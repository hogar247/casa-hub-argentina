
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate, useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface PropertyCategory {
  id: string;
  name: string;
  slug: string;
}

interface PropertyData {
  title: string;
  description: string;
  operation_type: string;
  price: string;
  currency: string;
  category_id: string;
  address: string;
  city: string;
  province: string;
  postal_code: string;
  bedrooms: string;
  bathrooms: string;
  surface_total: string;
  surface_covered: string;
  parking_spaces: string;
}

const PropertyForm = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { id } = useParams();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState<PropertyCategory[]>([]);
  const [formData, setFormData] = useState<PropertyData>({
    title: '',
    description: '',
    operation_type: '',
    price: '',
    currency: 'ARS',
    category_id: '',
    address: '',
    city: '',
    province: '',
    postal_code: '',
    bedrooms: '',
    bathrooms: '',
    surface_total: '',
    surface_covered: '',
    parking_spaces: '0'
  });

  useEffect(() => {
    if (!user) {
      navigate('/auth');
      return;
    }
    fetchCategories();
    if (id) {
      fetchProperty();
    }
  }, [user, navigate, id]);

  const fetchCategories = async () => {
    const { data } = await supabase
      .from('property_categories')
      .select('*')
      .order('name');
    
    if (data) setCategories(data);
  };

  const fetchProperty = async () => {
    if (!id || !user) return;

    const { data, error } = await supabase
      .from('properties')
      .select('*')
      .eq('id', id)
      .eq('user_id', user.id)
      .single();

    if (error) {
      toast({
        title: "Error",
        description: "No se pudo cargar la propiedad",
        variant: "destructive",
      });
      navigate('/dashboard');
      return;
    }

    if (data) {
      setFormData({
        title: data.title || '',
        description: data.description || '',
        operation_type: data.operation_type || '',
        price: data.price?.toString() || '',
        currency: data.currency || 'ARS',
        category_id: data.category_id || '',
        address: data.address || '',
        city: data.city || '',
        province: data.province || '',
        postal_code: data.postal_code || '',
        bedrooms: data.bedrooms?.toString() || '',
        bathrooms: data.bathrooms?.toString() || '',
        surface_total: data.surface_total?.toString() || '',
        surface_covered: data.surface_covered?.toString() || '',
        parking_spaces: data.parking_spaces?.toString() || '0'
      });
    }
  };

  const handleInputChange = (field: keyof PropertyData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent, status: 'draft' | 'published' = 'draft') => {
    e.preventDefault();
    if (!user) return;

    setLoading(true);

    try {
      const propertyData = {
        title: formData.title,
        description: formData.description,
        operation_type: formData.operation_type,
        price: parseFloat(formData.price),
        currency: formData.currency,
        category_id: formData.category_id || null,
        address: formData.address,
        city: formData.city,
        province: formData.province,
        postal_code: formData.postal_code || null,
        bedrooms: formData.bedrooms ? parseInt(formData.bedrooms) : null,
        bathrooms: formData.bathrooms ? parseInt(formData.bathrooms) : null,
        surface_total: formData.surface_total ? parseFloat(formData.surface_total) : null,
        surface_covered: formData.surface_covered ? parseFloat(formData.surface_covered) : null,
        parking_spaces: parseInt(formData.parking_spaces),
        status,
        user_id: user.id
      };

      let result;
      if (id) {
        result = await supabase
          .from('properties')
          .update(propertyData)
          .eq('id', id)
          .eq('user_id', user.id);
      } else {
        result = await supabase
          .from('properties')
          .insert([propertyData]);
      }

      if (result.error) {
        throw result.error;
      }

      toast({
        title: "¡Éxito!",
        description: id 
          ? `Propiedad ${status === 'published' ? 'actualizada y publicada' : 'actualizada'} correctamente`
          : `Propiedad ${status === 'published' ? 'creada y publicada' : 'guardada como borrador'} correctamente`,
      });

      navigate('/dashboard');
    } catch (error) {
      console.error('Error saving property:', error);
      toast({
        title: "Error",
        description: "No se pudo guardar la propiedad",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const argentineProvinces = [
    'Buenos Aires', 'Catamarca', 'Chaco', 'Chubut', 'Córdoba', 'Corrientes',
    'Entre Ríos', 'Formosa', 'Jujuy', 'La Pampa', 'La Rioja', 'Mendoza',
    'Misiones', 'Neuquén', 'Río Negro', 'Salta', 'San Juan', 'San Luis',
    'Santa Cruz', 'Santa Fe', 'Santiago del Estero', 'Tierra del Fuego',
    'Tucumán', 'Ciudad Autónoma de Buenos Aires'
  ];

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          {id ? 'Editar Propiedad' : 'Nueva Propiedad'}
        </h1>
        <p className="text-gray-600">
          Completa los datos de tu propiedad
        </p>
      </div>

      <form onSubmit={(e) => handleSubmit(e, 'draft')}>
        <div className="space-y-8">
          {/* Información Básica */}
          <Card>
            <CardHeader>
              <CardTitle>Información Básica</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="title">Título *</Label>
                <Input
                  id="title"
                  required
                  value={formData.title}
                  onChange={(e) => handleInputChange('title', e.target.value)}
                  placeholder="Ej: Hermoso departamento en Palermo"
                />
              </div>

              <div>
                <Label htmlFor="description">Descripción</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  placeholder="Describe tu propiedad..."
                  rows={4}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="operation_type">Tipo de Operación *</Label>
                  <Select
                    value={formData.operation_type}
                    onValueChange={(value) => handleInputChange('operation_type', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona una opción" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="sale">Venta</SelectItem>
                      <SelectItem value="rent">Alquiler</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="category_id">Categoría</Label>
                  <Select
                    value={formData.category_id}
                    onValueChange={(value) => handleInputChange('category_id', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona una categoría" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((category) => (
                        <SelectItem key={category.id} value={category.id}>
                          {category.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="md:col-span-2">
                  <Label htmlFor="price">Precio *</Label>
                  <Input
                    id="price"
                    type="number"
                    required
                    value={formData.price}
                    onChange={(e) => handleInputChange('price', e.target.value)}
                    placeholder="0"
                  />
                </div>
                <div>
                  <Label htmlFor="currency">Moneda</Label>
                  <Select
                    value={formData.currency}
                    onValueChange={(value) => handleInputChange('currency', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ARS">Pesos Argentinos (ARS)</SelectItem>
                      <SelectItem value="USD">Dólares (USD)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Ubicación */}
          <Card>
            <CardHeader>
              <CardTitle>Ubicación</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="address">Dirección *</Label>
                <Input
                  id="address"
                  required
                  value={formData.address}
                  onChange={(e) => handleInputChange('address', e.target.value)}
                  placeholder="Ej: Av. Santa Fe 1234"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="city">Ciudad *</Label>
                  <Input
                    id="city"
                    required
                    value={formData.city}
                    onChange={(e) => handleInputChange('city', e.target.value)}
                    placeholder="Ej: Buenos Aires"
                  />
                </div>

                <div>
                  <Label htmlFor="province">Provincia *</Label>
                  <Select
                    value={formData.province}
                    onValueChange={(value) => handleInputChange('province', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona una provincia" />
                    </SelectTrigger>
                    <SelectContent>
                      {argentineProvinces.map((province) => (
                        <SelectItem key={province} value={province}>
                          {province}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="postal_code">Código Postal</Label>
                <Input
                  id="postal_code"
                  value={formData.postal_code}
                  onChange={(e) => handleInputChange('postal_code', e.target.value)}
                  placeholder="Ej: 1425"
                />
              </div>
            </CardContent>
          </Card>

          {/* Características */}
          <Card>
            <CardHeader>
              <CardTitle>Características</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <Label htmlFor="bedrooms">Dormitorios</Label>
                  <Input
                    id="bedrooms"
                    type="number"
                    min="0"
                    value={formData.bedrooms}
                    onChange={(e) => handleInputChange('bedrooms', e.target.value)}
                  />
                </div>

                <div>
                  <Label htmlFor="bathrooms">Baños</Label>
                  <Input
                    id="bathrooms"
                    type="number"
                    min="0"
                    step="0.5"
                    value={formData.bathrooms}
                    onChange={(e) => handleInputChange('bathrooms', e.target.value)}
                  />
                </div>

                <div>
                  <Label htmlFor="surface_total">Superficie Total (m²)</Label>
                  <Input
                    id="surface_total"
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.surface_total}
                    onChange={(e) => handleInputChange('surface_total', e.target.value)}
                  />
                </div>

                <div>
                  <Label htmlFor="parking_spaces">Cocheras</Label>
                  <Input
                    id="parking_spaces"
                    type="number"
                    min="0"
                    value={formData.parking_spaces}
                    onChange={(e) => handleInputChange('parking_spaces', e.target.value)}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="surface_covered">Superficie Cubierta (m²)</Label>
                <Input
                  id="surface_covered"
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.surface_covered}
                  onChange={(e) => handleInputChange('surface_covered', e.target.value)}
                />
              </div>
            </CardContent>
          </Card>

          {/* Botones de Acción */}
          <div className="flex gap-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate('/dashboard')}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              variant="outline"
              disabled={loading}
            >
              {loading ? 'Guardando...' : 'Guardar Borrador'}
            </Button>
            <Button
              type="button"
              onClick={(e) => handleSubmit(e, 'published')}
              disabled={loading}
            >
              {loading ? 'Publicando...' : 'Publicar Propiedad'}
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default PropertyForm;
