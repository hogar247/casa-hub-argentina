
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate, useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Upload, X, Image as ImageIcon } from 'lucide-react';

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
  features: string[];
}

interface UploadedImage {
  id?: string;
  file?: File;
  url: string;
  is_main: boolean;
}

const mexicoStatesAndMunicipalities = {
  "Aguascalientes": ["Aguascalientes","Asientos","Calvillo","Cosio","El Llano","Jesus Maria","Pabellon de Arteaga","Rincon de Romos","San Francisco de los Romo","San Jose de Gracia","Tepezala"],
  "Baja California": ["Ensenada","Mexicali","Playas de Rosarito","Tecate","Tijuana"],
  "Baja California Sur": ["Comondu","La Paz","Loreto","Los Cabos","Mulege"],
  "Ciudad de Mexico": ["Alvaro Obregon","Azcapotzalco","Benito Juarez","Coyoacan","Cuajimalpa de Morelos","Cuauhtemoc","Gustavo A. Madero","Iztacalco","Iztapalapa","La Magdalena Contreras","Miguel Hidalgo","Milpa Alta","Tlalpan","Tlahuac","Venustiano Carranza","Xochimilco"],
  "Jalisco": ["Guadalajara","Zapopan","Tlaquepaque","Tonala","Puerto Vallarta","Lagos de Moreno","Tepatitlan de Morelos"]
};

const PropertyForm = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { id } = useParams();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState<PropertyCategory[]>([]);
  const [images, setImages] = useState<UploadedImage[]>([]);
  const [uploadingImages, setUploadingImages] = useState(false);
  const [formData, setFormData] = useState<PropertyData>({
    title: '',
    description: '',
    operation_type: '',
    price: '',
    currency: 'MXN',
    category_id: '',
    address: '',
    city: '',
    province: '',
    postal_code: '',
    bedrooms: '',
    bathrooms: '',
    surface_total: '',
    surface_covered: '',
    parking_spaces: '0',
    features: []
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
        currency: data.currency || 'MXN',
        category_id: data.category_id || '',
        address: data.address || '',
        city: data.city || '',
        province: data.province || '',
        postal_code: data.postal_code || '',
        bedrooms: data.bedrooms?.toString() || '',
        bathrooms: data.bathrooms?.toString() || '',
        surface_total: data.surface_total?.toString() || '',
        surface_covered: data.surface_covered?.toString() || '',
        parking_spaces: data.parking_spaces?.toString() || '0',
        features: data.features || []
      });

      // Fetch existing images
      const { data: imagesData } = await supabase
        .from('property_images')
        .select('*')
        .eq('property_id', id)
        .order('sort_order');

      if (imagesData) {
        setImages(imagesData.map(img => ({
          id: img.id,
          url: img.image_url,
          is_main: img.is_main
        })));
      }
    }
  };

  const handleInputChange = (field: keyof PropertyData, value: string | string[]) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleFeatureChange = (feature: string, checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      features: checked 
        ? [...prev.features, feature]
        : prev.features.filter(f => f !== feature)
    }));
  };

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files) return;

    setUploadingImages(true);
    
    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        
        // Validate file type
        if (!file.type.startsWith('image/')) {
          toast({
            title: "Error",
            description: `${file.name} no es una imagen válida`,
            variant: "destructive",
          });
          continue;
        }

        // Validate file size (max 5MB)
        if (file.size > 5 * 1024 * 1024) {
          toast({
            title: "Error",
            description: `${file.name} es demasiado grande. Máximo 5MB`,
            variant: "destructive",
          });
          continue;
        }

        // Create preview URL
        const previewUrl = URL.createObjectURL(file);
        
        setImages(prev => [...prev, {
          file,
          url: previewUrl,
          is_main: prev.length === 0 // First image is main by default
        }]);
      }
    } finally {
      setUploadingImages(false);
    }
  };

  const removeImage = (index: number) => {
    setImages(prev => {
      const newImages = prev.filter((_, i) => i !== index);
      // If we removed the main image, make the first remaining image main
      if (prev[index].is_main && newImages.length > 0) {
        newImages[0].is_main = true;
      }
      return newImages;
    });
  };

  const setMainImage = (index: number) => {
    setImages(prev => prev.map((img, i) => ({
      ...img,
      is_main: i === index
    })));
  };

  const uploadImages = async (propertyId: string) => {
    for (const image of images) {
      if (image.file) {
        // Upload new image
        const fileExt = image.file.name.split('.').pop();
        const fileName = `${Math.random()}.${fileExt}`;
        const filePath = `properties/${propertyId}/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('property-images')
          .upload(filePath, image.file);

        if (uploadError) {
          console.error('Error uploading image:', uploadError);
          continue;
        }

        // Get public URL
        const { data: { publicUrl } } = supabase.storage
          .from('property-images')
          .getPublicUrl(filePath);

        // Save to database
        const { error: dbError } = await supabase
          .from('property_images')
          .insert({
            property_id: propertyId,
            image_url: publicUrl,
            is_main: image.is_main,
            sort_order: images.indexOf(image)
          });

        if (dbError) {
          console.error('Error saving image to database:', dbError);
        }
      }
    }
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
        features: formData.features,
        status,
        user_id: user.id
      };

      let result;
      let propertyId = id;

      if (id) {
        result = await supabase
          .from('properties')
          .update(propertyData)
          .eq('id', id)
          .eq('user_id', user.id);
      } else {
        result = await supabase
          .from('properties')
          .insert([propertyData])
          .select()
          .single();
        
        if (result.data) {
          propertyId = result.data.id;
        }
      }

      if (result.error) {
        throw result.error;
      }

      // Upload images if there are new ones
      if (propertyId && images.some(img => img.file)) {
        await uploadImages(propertyId);
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

  const featuresList = [
    { id: 'pets', label: 'Acepta mascotas' },
    { id: 'furnished', label: 'Amueblado' },
    { id: 'wifi', label: 'WiFi' },
    { id: 'pool', label: 'Piscina' },
    { id: 'gym', label: 'Gimnasio' },
    { id: 'security', label: 'Seguridad 24/7' },
    { id: 'elevator', label: 'Elevador' },
    { id: 'balcony', label: 'Balcón' },
    { id: 'terrace', label: 'Terraza' },
    { id: 'garden', label: 'Jardín' }
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
                      <SelectItem value="MXN">Pesos Mexicanos (MXN)</SelectItem>
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
                  placeholder="Ej: Av. Reforma 1234"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="province">Estado *</Label>
                  <Select
                    value={formData.province}
                    onValueChange={(value) => {
                      handleInputChange('province', value);
                      handleInputChange('city', ''); // Reset city when state changes
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona un estado" />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.keys(mexicoStatesAndMunicipalities).map((state) => (
                        <SelectItem key={state} value={state}>
                          {state}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="city">Municipio *</Label>
                  <Select
                    value={formData.city}
                    onValueChange={(value) => handleInputChange('city', value)}
                    disabled={!formData.province}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona un municipio" />
                    </SelectTrigger>
                    <SelectContent>
                      {formData.province && mexicoStatesAndMunicipalities[formData.province as keyof typeof mexicoStatesAndMunicipalities]?.map((municipality) => (
                        <SelectItem key={municipality} value={municipality}>
                          {municipality}
                        </SelectItem>
                      ))}
                      <SelectItem value="Otro">Otro</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {formData.city === 'Otro' && (
                <div>
                  <Label htmlFor="custom_city">Especifica el municipio</Label>
                  <Input
                    id="custom_city"
                    placeholder="Escribe el nombre del municipio"
                    onChange={(e) => handleInputChange('city', e.target.value)}
                  />
                </div>
              )}

              <div>
                <Label htmlFor="postal_code">Código Postal</Label>
                <Input
                  id="postal_code"
                  value={formData.postal_code}
                  onChange={(e) => handleInputChange('postal_code', e.target.value)}
                  placeholder="Ej: 06600"
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

              {/* Features */}
              <div>
                <Label>Características Adicionales</Label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-2">
                  {featuresList.map((feature) => (
                    <div key={feature.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={feature.id}
                        checked={formData.features.includes(feature.id)}
                        onCheckedChange={(checked) => handleFeatureChange(feature.id, !!checked)}
                      />
                      <Label htmlFor={feature.id} className="text-sm">
                        {feature.label}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Imágenes */}
          <Card>
            <CardHeader>
              <CardTitle>Imágenes</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="images">Subir Imágenes</Label>
                <div className="mt-2">
                  <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100">
                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                      <Upload className="w-8 h-8 mb-2 text-gray-500" />
                      <p className="mb-2 text-sm text-gray-500">
                        <span className="font-semibold">Haz clic para subir</span> o arrastra y suelta
                      </p>
                      <p className="text-xs text-gray-500">PNG, JPG, JPEG (MAX. 5MB)</p>
                    </div>
                    <input
                      id="images"
                      type="file"
                      multiple
                      accept="image/*"
                      className="hidden"
                      onChange={handleImageUpload}
                      disabled={uploadingImages}
                    />
                  </label>
                </div>
              </div>

              {/* Image Preview */}
              {images.length > 0 && (
                <div>
                  <Label>Imágenes Subidas</Label>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mt-2">
                    {images.map((image, index) => (
                      <div key={index} className="relative group">
                        <div className={`aspect-square rounded-lg overflow-hidden border-2 ${image.is_main ? 'border-blue-500' : 'border-gray-200'}`}>
                          <img
                            src={image.url}
                            alt={`Imagen ${index + 1}`}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        
                        {/* Controls */}
                        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button
                            type="button"
                            size="sm"
                            variant="destructive"
                            onClick={() => removeImage(index)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                        
                        <div className="absolute bottom-2 left-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          {!image.is_main && (
                            <Button
                              type="button"
                              size="sm"
                              variant="secondary"
                              onClick={() => setMainImage(index)}
                            >
                              Principal
                            </Button>
                          )}
                          {image.is_main && (
                            <Button size="sm" variant="default" disabled>
                              Principal
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
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
