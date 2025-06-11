import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Building, Upload, X, MapPin, DollarSign, Home, Camera } from 'lucide-react';
import PropertyFormFields from '@/components/PropertyFormFields';
import PropertyImageUpload from '@/components/PropertyImageUpload';
import { MEXICO_STATES_MUNICIPALITIES } from '@/data/mexicoStates';

interface Property {
  id?: string;
  title: string;
  description: string;
  price: number;
  currency: string;
  operation_type: string;
  status: string;
  address: string;
  city: string;
  province: string;
  postal_code: string;
  bedrooms: number;
  bathrooms: number;
  surface_total: number;
  surface_covered: number;
  parking_spaces: number;
  floor_number?: number;
  total_floors?: number;
  features: string[];
  amenities: string[];
  is_featured: boolean;
  latitude?: number;
  longitude?: number;
  category_id?: string;
  user_id?: string;
  property_type?: string;
}

const PropertyForm = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditing = Boolean(id);

  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [images, setImages] = useState<Array<{ file?: File; url: string; isMain: boolean }>>([]);
  const [municipalities, setMunicipalities] = useState<string[]>([]);

  const [property, setProperty] = useState<Property>({
    title: '',
    description: '',
    price: 0,
    currency: 'MXN',
    operation_type: 'sale',
    status: 'draft',
    address: '',
    city: '',
    province: '',
    postal_code: '',
    bedrooms: 1,
    bathrooms: 1,
    surface_total: 0,
    surface_covered: 0,
    parking_spaces: 0,
    floor_number: 0,
    total_floors: 0,
    features: [],
    amenities: [],
    is_featured: false,
    property_type: '',
  });

  useEffect(() => {
    if (!user) {
      navigate('/auth');
      return;
    }

    if (isEditing) {
      fetchProperty();
    }
  }, [user, id, isEditing]);

  const fetchProperty = async () => {
    if (!id) return;

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('properties')
        .select(`
          *,
          property_images (*)
        `)
        .eq('id', id)
        .eq('user_id', user?.id)
        .single();

      if (error) throw error;

      if (data) {
        // Convert Json types to string arrays and remove contact_phone
        const convertedProperty = {
          ...data,
          features: Array.isArray(data.features) 
            ? data.features.map(item => typeof item === 'string' ? item : String(item))
            : [],
          amenities: Array.isArray(data.amenities)
            ? data.amenities.map(item => typeof item === 'string' ? item : String(item))
            : []
        };

        // Remove contact_phone if it exists
        const { contact_phone, ...propertyWithoutPhone } = convertedProperty;
        setProperty(propertyWithoutPhone);

        if (data.property_images) {
          setImages(data.property_images.map((img: any) => ({
            url: img.image_url,
            isMain: img.is_main
          })));
        }
      }
    } catch (error) {
      console.error('Error fetching property:', error);
      toast({
        title: "Error",
        description: "No se pudo cargar la propiedad",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleStateChange = (state: string) => {
    setProperty(prev => ({ ...prev, province: state, city: '' }));
    setMunicipalities(MEXICO_STATES_MUNICIPALITIES[state] || []);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setLoading(true);
    try {
      // Remove any properties that don't exist in the database schema
      const { contact_phone, property_images, ...propertyData } = property as any;
      
      const cleanPropertyData = {
        ...propertyData,
        user_id: user.id,
        features: property.features,
        amenities: property.amenities
      };

      let savedProperty;
      if (isEditing) {
        const { data, error } = await supabase
          .from('properties')
          .update(cleanPropertyData)
          .eq('id', id)
          .eq('user_id', user.id)
          .select()
          .single();

        if (error) throw error;
        savedProperty = data;
      } else {
        const { data, error } = await supabase
          .from('properties')
          .insert([cleanPropertyData])
          .select()
          .single();

        if (error) throw error;
        savedProperty = data;
      }

      // Handle image uploads
      await handleImageUploads(savedProperty.id);

      toast({
        title: "Éxito",
        description: `Propiedad ${isEditing ? 'actualizada' : 'creada'} correctamente`,
      });

      navigate('/dashboard');
    } catch (error) {
      console.error('Error saving property:', error);
      toast({
        title: "Error",
        description: `No se pudo ${isEditing ? 'actualizar' : 'crear'} la propiedad`,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleImageUploads = async (propertyId: string) => {
    for (let i = 0; i < images.length; i++) {
      const image = images[i];
      if (image.file) {
        const fileExt = image.file.name.split('.').pop();
        const fileName = `${propertyId}/${Date.now()}-${i}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from('property-images')
          .upload(fileName, image.file);

        if (uploadError) {
          console.error('Upload error:', uploadError);
          continue;
        }

        const { data: { publicUrl } } = supabase.storage
          .from('property-images')
          .getPublicUrl(fileName);

        await supabase
          .from('property_images')
          .insert({
            property_id: propertyId,
            image_url: publicUrl,
            is_main: image.isMain,
            sort_order: i
          });
      }
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center py-8">
          <Building className="h-16 w-16 text-gray-400 mx-auto mb-4 animate-pulse" />
          <p className="text-lg">Cargando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">
          {isEditing ? 'Editar Propiedad' : 'Crear Nueva Propiedad'}
        </h1>
        <p className="text-gray-600">
          {isEditing ? 'Actualiza los datos de tu propiedad' : 'Completa la información de tu propiedad'}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        <PropertyFormFields
          property={property}
          setProperty={setProperty}
          municipalities={municipalities}
          onStateChange={handleStateChange}
        />

        <PropertyImageUpload
          images={images}
          setImages={setImages}
          uploading={uploading}
          setUploading={setUploading}
        />

        <div className="flex justify-end space-x-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate('/dashboard')}
          >
            Cancelar
          </Button>
          <Button type="submit" disabled={loading}>
            {loading ? 'Guardando...' : (isEditing ? 'Actualizar' : 'Crear Propiedad')}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default PropertyForm;
