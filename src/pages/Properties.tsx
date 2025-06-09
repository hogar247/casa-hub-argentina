
import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { MapPin, Building, Eye, Bed, Bath, Car, Star } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface Property {
  id: string;
  title: string;
  price: number;
  currency: string;
  operation_type: string;
  status: string;
  city: string;
  province: string;
  bedrooms: number;
  bathrooms: number;
  surface_total: number;
  parking_spaces: number;
  views_count: number;
  created_at: string;
  description: string;
  features: string[];
  amenities: string[];
  is_featured: boolean;
  user_id: string;
  property_images: Array<{ image_url: string; is_main: boolean }>;
  profiles: {
    first_name: string;
    last_name: string;
    company_name: string;
    phone: string;
    user_type: string;
  };
  subscriptions: Array<{
    plan_type: string;
    status: string;
  }>;
}

const PropertiesPage = () => {
  const { toast } = useToast();
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [operationType, setOperationType] = useState<string>('all');
  const [minPrice, setMinPrice] = useState<string>('');
  const [maxPrice, setMaxPrice] = useState<string>('');
  const [bedrooms, setBedrooms] = useState<string>('all');
  const [location, setLocation] = useState<string>('');

  useEffect(() => {
    fetchProperties();
  }, []);

  const fetchProperties = async () => {
    setLoading(true);
    
    try {
      const { data, error } = await supabase
        .from('properties')
        .select(`
          *,
          property_images (image_url, is_main),
          profiles (first_name, last_name, company_name, phone, user_type)
        `)
        .eq('status', 'published')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching properties:', error);
        toast({
          title: "Error",
          description: "No se pudieron cargar las propiedades",
          variant: "destructive",
        });
        return;
      }

      if (data) {
        const transformedData = data.map((property: any) => ({
          ...property,
          features: Array.isArray(property.features) ? property.features : 
                   typeof property.features === 'string' ? JSON.parse(property.features || '[]') : [],
          amenities: Array.isArray(property.amenities) ? property.amenities : 
                    typeof property.amenities === 'string' ? JSON.parse(property.amenities || '[]') : [],
          subscriptions: [{ plan_type: 'basic', status: 'active' }],
          property_images: property.property_images || [],
          profiles: property.profiles || { first_name: '', last_name: '', company_name: '', phone: '', user_type: 'owner' }
        }));

        setProperties(transformedData);
      }
    } catch (error) {
      console.error('Error:', error);
      toast({
        title: "Error",
        description: "Ocurrió un error al cargar las propiedades",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredProperties = properties.filter(property => {
    const matchesSearch = property.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         property.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         property.city.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         property.province.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesOperation = operationType === 'all' || property.operation_type === operationType;
    
    const matchesMinPrice = !minPrice || property.price >= parseFloat(minPrice);
    const matchesMaxPrice = !maxPrice || property.price <= parseFloat(maxPrice);
    
    const matchesBedrooms = bedrooms === 'all' || property.bedrooms >= parseInt(bedrooms);
    
    const matchesLocation = !location || 
                           property.city.toLowerCase().includes(location.toLowerCase()) ||
                           property.province.toLowerCase().includes(location.toLowerCase());

    return matchesSearch && matchesOperation && matchesMinPrice && matchesMaxPrice && matchesBedrooms && matchesLocation;
  });

  const formatPrice = (price: number, currency: string) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: currency === 'USD' ? 'USD' : 'MXN',
    }).format(price);
  };

  const getPropertyFrame = (subscriptions: any[]) => {
    const activeSub = subscriptions?.find(sub => sub.status === 'active');
    if (!activeSub) return '';

    switch (activeSub.plan_type) {
      case 'plan_1000':
        return 'border-4 border-yellow-500 shadow-lg shadow-yellow-500/50';
      case 'plan_3000':
        return 'border-4 border-gradient-to-r from-red-500 via-yellow-500 to-red-500 shadow-xl shadow-red-500/50 animate-pulse';
      default:
        return '';
    }
  };

  const getUserBadge = (subscriptions: any[]) => {
    const activeSub = subscriptions?.find(sub => sub.status === 'active');
    if (!activeSub) return null;

    switch (activeSub.plan_type) {
      case 'plan_1000':
        return <Badge className="bg-yellow-500 text-white">Premium</Badge>;
      case 'plan_3000':
        return <Badge className="bg-gradient-to-r from-purple-500 to-pink-500 text-white animate-pulse">VIP</Badge>;
      default:
        return null;
    }
  };

  const PropertyCard = ({ property }: { property: Property }) => {
    const mainImage = property.property_images?.find(img => img.is_main)?.image_url 
      || property.property_images?.[0]?.image_url 
      || '/placeholder.svg';

    const activeSub = property.subscriptions?.find(sub => sub.status === 'active');
    const showPhone = activeSub && ['plan_300', 'plan_500', 'plan_1000', 'plan_3000'].includes(activeSub.plan_type);

    return (
      <Card className={`overflow-hidden hover:shadow-xl transition-all duration-300 cursor-pointer ${getPropertyFrame(property.subscriptions)}`}>
        <div className="aspect-video relative">
          <img 
            src={mainImage} 
            alt={property.title}
            className="w-full h-full object-cover"
          />
          <div className="absolute top-4 left-4 flex gap-2">
            <Badge className="bg-blue-600 text-white">
              {property.operation_type === 'sale' ? 'Venta' : 'Alquiler'}
            </Badge>
            {getUserBadge(property.subscriptions)}
          </div>
          {property.is_featured && (
            <div className="absolute top-4 right-4">
              <Badge className="bg-yellow-500 text-white flex items-center gap-1">
                <Star className="h-3 w-3 fill-current" />
                Destacado
              </Badge>
            </div>
          )}
        </div>
        
        <CardContent className="p-6">
          <h3 className="font-semibold text-lg mb-2 line-clamp-2">
            {property.title}
          </h3>
          
          <p className="text-2xl font-bold text-blue-600 mb-2">
            {formatPrice(property.price, property.currency)}
          </p>
          
          <p className="text-gray-600 mb-4 flex items-center">
            <MapPin className="h-4 w-4 mr-1" />
            {property.city}, {property.province}
          </p>

          <div className="flex justify-between text-sm text-gray-600 mb-4">
            <span className="flex items-center">
              <Bed className="h-4 w-4 mr-1" />
              {property.bedrooms} hab.
            </span>
            <span className="flex items-center">
              <Bath className="h-4 w-4 mr-1" />
              {property.bathrooms} baños
            </span>
            <span>{property.surface_total} m²</span>
            {property.parking_spaces > 0 && (
              <span className="flex items-center">
                <Car className="h-4 w-4 mr-1" />
                {property.parking_spaces}
              </span>
            )}
          </div>

          <div className="border-t pt-4">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm font-medium">
                  {property.profiles?.company_name || 
                   `${property.profiles?.first_name || ''} ${property.profiles?.last_name || ''}`.trim() ||
                   'Propietario'}
                </p>
                <p className="text-xs text-gray-500 capitalize">
                  {property.profiles?.user_type || 'Propietario'}
                </p>
                {showPhone && property.profiles?.phone && (
                  <p className="text-xs text-blue-600">
                    📞 {property.profiles.phone}
                  </p>
                )}
              </div>
              <div className="flex items-center text-xs text-gray-500">
                <Eye className="h-3 w-3 mr-1" />
                {property.views_count}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center py-8">
          <Building className="h-16 w-16 text-gray-400 mx-auto mb-4 animate-pulse" />
          <p className="text-lg">Cargando propiedades...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">
          Propiedades en Venta y Alquiler
        </h1>
        
        {/* Filters */}
        <div className="bg-white p-6 rounded-lg shadow-md mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
            <div className="lg:col-span-2">
              <Input
                placeholder="Buscar propiedades..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full"
              />
            </div>
            
            <Select value={operationType} onValueChange={setOperationType}>
              <SelectTrigger>
                <SelectValue placeholder="Tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="sale">Venta</SelectItem>
                <SelectItem value="rent">Alquiler</SelectItem>
              </SelectContent>
            </Select>

            <Input
              placeholder="Precio mín."
              type="number"
              value={minPrice}
              onChange={(e) => setMinPrice(e.target.value)}
            />

            <Input
              placeholder="Precio máx."
              type="number"
              value={maxPrice}
              onChange={(e) => setMaxPrice(e.target.value)}
            />

            <Select value={bedrooms} onValueChange={setBedrooms}>
              <SelectTrigger>
                <SelectValue placeholder="Habitaciones" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Cualquiera</SelectItem>
                <SelectItem value="1">1+</SelectItem>
                <SelectItem value="2">2+</SelectItem>
                <SelectItem value="3">3+</SelectItem>
                <SelectItem value="4">4+</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="mt-4">
            <Input
              placeholder="Ubicación (ciudad, estado)"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="w-full"
            />
          </div>
        </div>
      </div>

      {/* Properties Grid */}
      {filteredProperties.length === 0 ? (
        <div className="text-center py-12">
          <Building className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No se encontraron propiedades
          </h3>
          <p className="text-gray-600">
            Intenta ajustar tus filtros de búsqueda
          </p>
        </div>
      ) : (
        <>
          <div className="mb-6">
            <p className="text-gray-600">
              Mostrando {filteredProperties.length} propiedad{filteredProperties.length !== 1 ? 'es' : ''}
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredProperties.map((property) => (
              <PropertyCard key={property.id} property={property} />
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default PropertiesPage;
