
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Building } from 'lucide-react';
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
  const [userPhone, setUserPhone] = useState<string>('');
  const [submitting, setSubmitting] = useState(false);

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

    fetchUserProfile();
    
    if (isEditing) {
      fetchProperty();
    }
  }, [user, id, isEditing]);

  const fetchUserProfile = async () => {
    if (!user) return;

    try {
      console.log('Fetching user profile for:', user.id);
      const { data, error } = await supabase
        .from('profiles')
        .select('phone')
        .eq('id', user.id)
        .maybeSingle();

      if (error) {
        console.error('Error fetching user profile:', error);
        return;
      }

      if (data) {
        setUserPhone(data.phone || '');
      }
    } catch (error) {
      console.error('Error in fetchUserProfile:', error);
    }
  };

  const updateUserProfile = async (phone: string) => {
    if (!user) return;

    try {
      console.log('Updating user profile phone:', phone);
      const { error } = await supabase
        .from('profiles')
        .update({ phone })
        .eq('id', user.id);

      if (error) {
        console.error('Error updating user profile:', error);
        throw error;
      }
      console.log('User profile updated successfully');
    } catch (error) {
      console.error('Error updating user profile:', error);
      throw error;
    }
  };

  const fetchProperty = async () => {
    if (!id) return;

    setLoading(true);
    try {
      console.log('Fetching property:', id);
      const { data, error } = await supabase
        .from('properties')
        .select(`
          *,
          property_images (*)
        `)
        .eq('id', id)
        .eq('user_id', user?.id)
        .maybeSingle();

      if (error) {
        console.error('Error fetching property:', error);
        throw error;
      }

      if (data) {
        console.log('Property fetched:', data);
        const convertedProperty = {
          ...data,
          features: Array.isArray(data.features) 
            ? data.features.map(item => typeof item === 'string' ? item : String(item))
            : [],
          amenities: Array.isArray(data.amenities)
            ? data.amenities.map(item => typeof item === 'string' ? item : String(item))
            : []
        };

        setProperty(convertedProperty);

        if (data.property_images && Array.isArray(data.property_images)) {
          setImages(data.property_images.map((img: any) => ({
            url: img.image_url,
            isMain: img.is_main || false
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

  const handlePhoneChange = (phone: string) => {
    setUserPhone(phone);
  };

  const validateForm = () => {
    if (!property.title.trim()) {
      toast({
        title: "Error",
        description: "El título es obligatorio",
        variant: "destructive",
      });
      return false;
    }

    if (!property.description.trim()) {
      toast({
        title: "Error",
        description: "La descripción es obligatoria",
        variant: "destructive",
      });
      return false;
    }

    if (property.price <= 0) {
      toast({
        title: "Error",
        description: "El precio debe ser mayor a 0",
        variant: "destructive",
      });
      return false;
    }

    if (!property.address.trim()) {
      toast({
        title: "Error",
        description: "La dirección es obligatoria",
        variant: "destructive",
      });
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || submitting) return;

    if (!validateForm()) return;

    setSubmitting(true);
    try {
      console.log('Starting property submission...');
      
      // Update user profile with phone number
      if (userPhone.trim()) {
        await updateUserProfile(userPhone.trim());
      }

      // Prepare property data
      const propertyData = {
        title: property.title.trim(),
        description: property.description.trim(),
        price: Number(property.price),
        currency: property.currency,
        operation_type: property.operation_type,
        status: property.status,
        address: property.address.trim(),
        city: property.city,
        province: property.province,
        postal_code: property.postal_code || '',
        bedrooms: Number(property.bedrooms) || 1,
        bathrooms: Number(property.bathrooms) || 1,
        surface_total: Number(property.surface_total) || 0,
        surface_covered: Number(property.surface_covered) || 0,
        parking_spaces: Number(property.parking_spaces) || 0,
        floor_number: property.floor_number ? Number(property.floor_number) : null,
        total_floors: property.total_floors ? Number(property.total_floors) : null,
        features: property.features || [],
        amenities: property.amenities || [],
        is_featured: Boolean(property.is_featured),
        latitude: property.latitude ? Number(property.latitude) : null,
        longitude: property.longitude ? Number(property.longitude) : null,
        property_type: property.property_type || '',
        user_id: user.id,
      };

      console.log('Property data to save:', propertyData);

      let savedProperty;
      if (isEditing) {
        console.log('Updating existing property...');
        const { data, error } = await supabase
          .from('properties')
          .update(propertyData)
          .eq('id', id)
          .eq('user_id', user.id)
          .select()
          .single();

        if (error) {
          console.error('Error updating property:', error);
          throw error;
        }
        savedProperty = data;
        console.log('Property updated:', savedProperty);
      } else {
        console.log('Creating new property...');
        const { data, error } = await supabase
          .from('properties')
          .insert([propertyData])
          .select()
          .single();

        if (error) {
          console.error('Error creating property:', error);
          throw error;
        }
        savedProperty = data;
        console.log('Property created:', savedProperty);
      }

      // Handle image uploads only if there are new images
      const newImages = images.filter(img => img.file);
      if (newImages.length > 0) {
        console.log('Uploading images...', newImages.length);
        await handleImageUploads(savedProperty.id);
      }

      toast({
        title: "Éxito",
        description: `Propiedad ${isEditing ? 'actualizada' : 'creada'} correctamente`,
      });

      navigate('/dashboard');
    } catch (error) {
      console.error('Error saving property:', error);
      toast({
        title: "Error",
        description: `No se pudo ${isEditing ? 'actualizar' : 'crear'} la propiedad. ${error instanceof Error ? error.message : 'Error desconocido'}`,
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleImageUploads = async (propertyId: string) => {
    console.log('Starting image uploads for property:', propertyId);
    
    for (let i = 0; i < images.length; i++) {
      const image = images[i];
      if (image.file) {
        try {
          console.log(`Uploading image ${i + 1}/${images.length}`);
          const fileExt = image.file.name.split('.').pop();
          const fileName = `${propertyId}/${Date.now()}-${i}.${fileExt}`;

          const { error: uploadError } = await supabase.storage
            .from('property-images')
            .upload(fileName, image.file, {
              cacheControl: '3600',
              upsert: false
            });

          if (uploadError) {
            console.error('Upload error:', uploadError);
            continue;
          }

          const { data: { publicUrl } } = supabase.storage
            .from('property-images')
            .getPublicUrl(fileName);

          console.log('Image uploaded, saving to database:', publicUrl);

          const { error: dbError } = await supabase
            .from('property_images')
            .insert({
              property_id: propertyId,
              image_url: publicUrl,
              is_main: image.isMain,
              sort_order: i
            });

          if (dbError) {
            console.error('Database error saving image:', dbError);
          } else {
            console.log('Image saved to database successfully');
          }
        } catch (error) {
          console.error('Error processing image:', error);
        }
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
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
          {isEditing ? 'Editar Propiedad' : 'Crear Nueva Propiedad'}
        </h1>
        <p className="text-gray-600 dark:text-gray-300">
          {isEditing ? 'Actualiza los datos de tu propiedad' : 'Completa la información de tu propiedad'}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        <PropertyFormFields
          property={property}
          setProperty={setProperty}
          municipalities={municipalities}
          onStateChange={handleStateChange}
          userPhone={userPhone}
          onPhoneChange={handlePhoneChange}
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
            disabled={submitting}
          >
            Cancelar
          </Button>
          <Button 
            type="submit" 
            disabled={submitting || loading}
          >
            {submitting ? 'Guardando...' : (isEditing ? 'Actualizar Propiedad' : 'Crear Propiedad')}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default PropertyForm;
