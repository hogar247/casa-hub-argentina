import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { MapPin, Bed, Bath, Car, Filter, X } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import PropertyDetailsModal from '@/components/PropertyDetailsModal';
import { MEXICO_STATES_MUNICIPALITIES } from '@/data/mexicoStates';

interface Property {
  id: string;
  title: string;
  description: string;
  price: number;
  currency: string;
  operation_type: string;
  address: string;
  city: string;
  province: string;
  bedrooms: number;
  bathrooms: number;
  parking_spaces: number;
  surface_total: number;
  surface_covered: number;
  is_featured: boolean;
  status: string;
  views_count: number;
  created_at: string;
  features: any[];
  amenities: any[];
  user_id: string;
  subscriptions: any;
  property_images: { image_url: string; is_main: boolean }[];
  profiles: {
    first_name: string;
    last_name: string;
    company_name: string;
    phone: string;
    email: string;
    user_type: string;
  };
}

const Properties = () => {
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [operationType, setOperationType] = useState('');
  const [state, setState] = useState('');
  const [municipality, setMunicipality] = useState('');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);
  const { toast } = useToast();

  const mexicoStates = Object.keys(MEXICO_STATES_MUNICIPALITIES);
  const municipalities = state ? MEXICO_STATES_MUNICIPALITIES[state] || [] : [];

  // Nueva función robusta para obtener propiedades
  const fetchProperties = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('properties')
        .select(`
          *,
          property_images (image_url, is_main),
          profiles (first_name, last_name, company_name, phone, email, user_type)
        `)
        .eq('status', 'published')
        .order('is_featured', { ascending: false })
        .order('created_at', { ascending: false });

      if (error) {
        toast({
          title: "Error",
          description: "No se pudieron cargar las propiedades",
          variant: "destructive",
        });
        setProperties([]);
        return;
      }

      // Mapear y asegurar que las claves críticas existen
      const mapped: Property[] = (data || []).map(property => ({
        id: property.id,
        title: property.title || '',
        description: property.description || '',
        price: Number(property.price) || 0,
        currency: property.currency || 'MXN',
        operation_type: property.operation_type || '',
        address: property.address || '',
        city: property.city || '',
        province: property.province || '',
        bedrooms: property.bedrooms || 0,
        bathrooms: property.bathrooms || 0,
        parking_spaces: property.parking_spaces || 0,
        surface_total: property.surface_total || 0,
        surface_covered: property.surface_covered || 0,
        is_featured: property.is_featured || false,
        status: property.status || 'draft',
        views_count: property.views_count || 0,
        created_at: property.created_at || '',
        features: Array.isArray(property.features) ? property.features : [],
        amenities: Array.isArray(property.amenities) ? property.amenities : [],
        user_id: property.user_id || '',
        subscriptions: null,
        property_images: Array.isArray(property.property_images) ? property.property_images : [],
        profiles: property.profiles || {
          first_name: '',
          last_name: '',
          company_name: '',
          phone: '',
          email: '',
          user_type: 'owner',
        },
      }));

      setProperties(mapped);
    } catch (error) {
      toast({
        title: "Error inesperado",
        description: "No se pudieron cargar los inmuebles.",
        variant: "destructive",
      });
      setProperties([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProperties();
    // eslint-disable-next-line
  }, []);

  const filteredProperties = properties.filter(property => {
    const matchesSearch = property.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         property.city.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         property.address.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesOperation = !operationType || operationType === 'all' || property.operation_type === operationType;
    const matchesState = !state || state === 'all' || property.province === state;
    const matchesMunicipality = !municipality || municipality === 'all' || property.city === municipality;
    
    const matchesMinPrice = !minPrice || property.price >= parseInt(minPrice);
    const matchesMaxPrice = !maxPrice || property.price <= parseInt(maxPrice);

    return matchesSearch && matchesOperation && matchesState && matchesMunicipality && matchesMinPrice && matchesMaxPrice;
  });

  const formatPrice = (price: number, currency: string = 'MXN') => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price);
  };

  const getMainImage = (images: { image_url: string; is_main: boolean }[]) => {
    const mainImage = images?.find(img => img.is_main);
    return mainImage?.image_url || images?.[0]?.image_url || '/placeholder.svg';
  };

  const clearFilters = () => {
    setSearchTerm('');
    setOperationType('');
    setState('');
    setMunicipality('');
    setMinPrice('');
    setMaxPrice('');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600 dark:text-gray-300">Cargando propiedades...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-4">
            Propiedades Disponibles en México
          </h1>
          
          {/* Mobile Filter Toggle */}
          <div className="md:hidden mb-4">
            <Button
              variant="outline"
              onClick={() => setShowFilters(!showFilters)}
              className="w-full flex items-center justify-center gap-2"
            >
              <Filter className="h-4 w-4" />
              {showFilters ? 'Ocultar Filtros' : 'Mostrar Filtros'}
            </Button>
          </div>

          {/* Filters */}
          <div className={`space-y-4 mb-6 ${showFilters ? 'block' : 'hidden md:block'}`}>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
              <div className="lg:col-span-2">
                <Input
                  type="text"
                  placeholder="Buscar por título, ciudad o dirección..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full"
                />
              </div>
              
              <Select value={operationType} onValueChange={setOperationType}>
                <SelectTrigger>
                  <SelectValue placeholder="Tipo de operación" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="sale">Venta</SelectItem>
                  <SelectItem value="rent">Alquiler</SelectItem>
                </SelectContent>
              </Select>

              <Select value={state} onValueChange={(value) => {
                setState(value);
                setMunicipality(''); // Reset municipality when state changes
              }}>
                <SelectTrigger>
                  <SelectValue placeholder="Estado" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los Estados</SelectItem>
                  {mexicoStates.map((estado) => (
                    <SelectItem key={estado} value={estado}>{estado}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Input
                type="number"
                placeholder="Precio mínimo"
                value={minPrice}
                onChange={(e) => setMinPrice(e.target.value)}
              />

              <Input
                type="number"
                placeholder="Precio máximo"
                value={maxPrice}
                onChange={(e) => setMaxPrice(e.target.value)}
              />
            </div>

            {/* Municipality filter - only show if state is selected */}
            {state && state !== 'all' && municipalities.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Select value={municipality} onValueChange={setMunicipality}>
                  <SelectTrigger>
                    <SelectValue placeholder="Municipio" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos los Municipios</SelectItem>
                    {municipalities.map((municipio) => (
                      <SelectItem key={municipio} value={municipio}>{municipio}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="flex flex-wrap gap-2 items-center">
              <Button
                variant="outline"
                size="sm"
                onClick={clearFilters}
                className="flex items-center gap-2"
              >
                <X className="h-3 w-3" />
                Limpiar filtros
              </Button>
              <span className="text-sm text-gray-600 dark:text-gray-400">
                {filteredProperties.length} propiedades encontradas
              </span>
            </div>
          </div>
        </div>

        {/* Properties Grid */}
        {filteredProperties.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-600 dark:text-gray-300 text-lg">
              No se encontraron propiedades que coincidan con los filtros aplicados.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProperties.map((property) => (
              <Card 
                key={property.id} 
                className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer dark:bg-gray-800 dark:border-gray-700"
                onClick={() => setSelectedProperty(property)}
              >
                <div className="relative">
                  <img
                    src={getMainImage(property.property_images)}
                    alt={property.title}
                    className="w-full h-48 object-cover"
                    onError={(e) => {
                      e.currentTarget.src = '/placeholder.svg';
                    }}
                  />
                  {property.is_featured && (
                    <Badge className="absolute top-2 right-2 bg-yellow-500 text-white">
                      ⭐ Destacado
                    </Badge>
                  )}
                  <Badge 
                    variant="secondary" 
                    className="absolute top-2 left-2 bg-blue-600 text-white"
                  >
                    {property.operation_type === 'sale' ? 'Venta' : 'Alquiler'}
                  </Badge>
                </div>
                
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg line-clamp-2 dark:text-white">
                    {property.title}
                  </CardTitle>
                  <div className="flex items-center text-gray-600 dark:text-gray-300 text-sm">
                    <MapPin className="h-4 w-4 mr-1" />
                    {property.city}, {property.province}
                  </div>
                </CardHeader>

                <CardContent className="space-y-3">
                  <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                    {formatPrice(property.price, property.currency)}
                  </div>

                  <div className="flex justify-between text-sm text-gray-600 dark:text-gray-300">
                    <div className="flex items-center">
                      <Bed className="h-4 w-4 mr-1" />
                      {property.bedrooms || 0}
                    </div>
                    <div className="flex items-center">
                      <Bath className="h-4 w-4 mr-1" />
                      {property.bathrooms || 0}
                    </div>
                    <div className="flex items-center">
                      <Car className="h-4 w-4 mr-1" />
                      {property.parking_spaces || 0}
                    </div>
                  </div>

                  {property.surface_total && (
                    <div className="text-sm text-gray-600 dark:text-gray-300">
                      Superficie: {property.surface_total} m²
                    </div>
                  )}

                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    Publicado por: {property.profiles?.company_name || 
                      `${property.profiles?.first_name || ''} ${property.profiles?.last_name || ''}`.trim() || 
                      'Usuario'}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Property Details Modal */}
        {selectedProperty && (
          <PropertyDetailsModal
            property={selectedProperty}
            isOpen={!!selectedProperty}
            onClose={() => setSelectedProperty(null)}
          />
        )}
      </div>
    </div>
  );
};

export default Properties;
