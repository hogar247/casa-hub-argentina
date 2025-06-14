import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { MapPin, Building, Eye, Bed, Bath, Car, Star, Share, Filter, RefreshCw } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import PropertyDetailsModal from '@/components/PropertyDetailsModal';
import { MEXICO_STATES_MUNICIPALITIES } from '@/data/mexicoStates';

interface Property {
  id: string;
  title: string;
  price: number;
  currency: string;
  operation_type: string;
  status: string;
  city: string;
  province: string;
  address: string;
  bedrooms: number;
  bathrooms: number;
  surface_total: number;
  surface_covered: number;
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

const PROPERTY_TYPES = [
  'Casa', 'Departamento', 'Oficina', 'Local comercial', 
  'Terreno', 'Bodega', 'Quinta', 'Penthouse'
];

const PropertiesPage = () => {
  const { toast } = useToast();
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [operationType, setOperationType] = useState<string>('all');
  const [minPrice, setMinPrice] = useState<string>('');
  const [maxPrice, setMaxPrice] = useState<string>('');
  const [bedrooms, setBedrooms] = useState<string>('all');
  const [bathrooms, setBathrooms] = useState<string>('all');
  const [selectedState, setSelectedState] = useState<string>('all');
  const [selectedCity, setSelectedCity] = useState<string>('all');
  const [propertyType, setPropertyType] = useState<string>('all');
  const [location, setLocation] = useState<string>('');
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [availableCities, setAvailableCities] = useState<string[]>([]);
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    fetchProperties();
  }, []);

  useEffect(() => {
    if (selectedState !== 'all') {
      setAvailableCities(MEXICO_STATES_MUNICIPALITIES[selectedState] || []);
      setSelectedCity('all');
    } else {
      setAvailableCities([]);
    }
  }, [selectedState]);

  const fetchProperties = async () => {
    setLoading(true);
    
    try {
      console.log('Fetching properties from Supabase...');
      
      // Primero obtener las propiedades con sus imágenes
      const { data: propertiesData, error: propertiesError } = await supabase
        .from('properties')
        .select(`
          *,
          property_images (
            image_url,
            is_main
          )
        `)
        .eq('status', 'published')
        .order('is_featured', { ascending: false })
        .order('created_at', { ascending: false });

      if (propertiesError) {
        console.error('Error fetching properties:', propertiesError);
        toast({
          title: "Error",
          description: "No se pudieron cargar las propiedades. Intenta refrescar la página.",
          variant: "destructive",
        });
        return;
      }

      console.log('Properties fetched:', propertiesData?.length || 0);

      if (propertiesData && propertiesData.length > 0) {
        // Obtener los perfiles de los usuarios
        const userIds = [...new Set(propertiesData.map(p => p.user_id).filter(Boolean))];
        
        const { data: profilesData, error: profilesError } = await supabase
          .from('profiles')
          .select('*')
          .in('id', userIds);

        if (profilesError) {
          console.error('Error fetching profiles:', profilesError);
        }

        // Obtener las suscripciones de los usuarios
        const { data: subscriptionsData, error: subscriptionsError } = await supabase
          .from('subscriptions')
          .select('*')
          .in('user_id', userIds)
          .eq('status', 'active');

        if (subscriptionsError) {
          console.error('Error fetching subscriptions:', subscriptionsError);
        }

        // Combinar los datos
        const enrichedProperties = propertiesData.map((property: any) => {
          const profile = profilesData?.find(p => p.id === property.user_id) || {
            first_name: '',
            last_name: '',
            company_name: '',
            phone: '',
            user_type: 'owner'
          };

          const subscription = subscriptionsData?.find(s => s.user_id === property.user_id) || {
            plan_type: 'basic',
            status: 'active'
          };

          return {
            ...property,
            address: property.address || '',
            surface_covered: property.surface_covered || 0,
            features: Array.isArray(property.features) ? property.features : [],
            amenities: Array.isArray(property.amenities) ? property.amenities : [],
            property_images: Array.isArray(property.property_images) ? property.property_images : [],
            profiles: profile,
            subscriptions: [subscription]
          };
        });

        setProperties(enrichedProperties);
        console.log('Properties enriched and set successfully:', enrichedProperties.length);
      } else {
        console.log('No properties found');
        setProperties([]);
      }
    } catch (error) {
      console.error('Unexpected error:', error);
      toast({
        title: "Error",
        description: "Ocurrió un error inesperado al cargar las propiedades",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchProperties();
    setRefreshing(false);
    toast({
      title: "Actualizado",
      description: "Las propiedades han sido actualizadas",
    });
  };

  const filteredProperties = properties.filter(property => {
    const matchesSearch = property.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         property.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         property.city.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         property.province.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesOperation = operationType === 'all' || property.operation_type === operationType;
    
    const matchesMinPrice = !minPrice || property.price >= parseFloat(minPrice);
    const matchesMaxPrice = !maxPrice || property.price <= parseFloat(maxPrice);
    
    const matchesBedrooms = bedrooms === 'all' || property.bedrooms >= parseInt(bedrooms);
    const matchesBathrooms = bathrooms === 'all' || property.bathrooms >= parseInt(bathrooms);
    
    const matchesState = selectedState === 'all' || property.province === selectedState;
    const matchesCity = selectedCity === 'all' || property.city === selectedCity;
    
    const matchesLocation = !location || 
                           property.city.toLowerCase().includes(location.toLowerCase()) ||
                           property.province.toLowerCase().includes(location.toLowerCase()) ||
                           property.address?.toLowerCase().includes(location.toLowerCase());

    return matchesSearch && matchesOperation && matchesMinPrice && matchesMaxPrice && 
           matchesBedrooms && matchesBathrooms && matchesState && matchesCity && 
           matchesLocation;
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

  const handlePropertyClick = (property: Property) => {
    // Incrementar contador de vistas
    incrementViewCount(property.id);
    setSelectedProperty(property);
    setIsModalOpen(true);
  };

  const incrementViewCount = async (propertyId: string) => {
    try {
      const { error } = await supabase.rpc('increment_property_views', {
        property_id: propertyId
      });
      
      if (error) {
        console.error('Error incrementing view count:', error);
      }
    } catch (error) {
      console.error('Error incrementing view count:', error);
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedProperty(null);
  };

  const handleShareProperty = async (property: Property, e: React.MouseEvent) => {
    e.stopPropagation();
    
    const shareUrl = `${window.location.origin}/properties?id=${property.id}`;
    const shareText = `Mira esta propiedad: ${property.title} - ${formatPrice(property.price, property.currency)}`;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: property.title,
          text: shareText,
          url: shareUrl,
        });
      } catch (error) {
        console.log('Error sharing:', error);
      }
    } else {
      try {
        await navigator.clipboard.writeText(`${shareText} ${shareUrl}`);
        toast({
          title: "¡Enlace copiado!",
          description: "El enlace de la propiedad se ha copiado al portapapeles",
        });
      } catch (error) {
        toast({
          title: "Error",
          description: "No se pudo copiar el enlace",
          variant: "destructive",
        });
      }
    }
  };

  const PropertyCard = ({ property }: { property: Property }) => {
    const mainImage = property.property_images?.find(img => img.is_main)?.image_url 
      || property.property_images?.[0]?.image_url 
      || 'https://images.pexels.com/photos/106399/pexels-photo-106399.jpeg';

    return (
      <Card 
        className={`overflow-hidden hover:shadow-xl transition-all duration-300 cursor-pointer relative ${getPropertyFrame(property.subscriptions)} dark:bg-gray-800 dark:border-gray-700`}
        onClick={() => handlePropertyClick(property)}
      >
        <div className="aspect-video relative">
          <img 
            src={mainImage} 
            alt={property.title}
            className="w-full h-full object-cover"
            onError={(e) => {
              (e.target as HTMLImageElement).src = 'https://images.pexels.com/photos/106399/pexels-photo-106399.jpeg';
            }}
          />
          <div className="absolute top-2 left-2 flex gap-1 flex-wrap">
            <Badge className="bg-blue-600 text-white text-xs">
              {property.operation_type === 'sale' ? 'Venta' : 'Alquiler'}
            </Badge>
            {getUserBadge(property.subscriptions)}
          </div>
          <div className="absolute top-2 right-2 flex gap-1">
            {property.is_featured && (
              <Badge className="bg-yellow-500 text-white flex items-center gap-1 text-xs">
                <Star className="h-3 w-3 fill-current" />
                <span className="hidden sm:inline">Destacado</span>
              </Badge>
            )}
            <Button
              size="sm"
              variant="secondary"
              className="bg-white/80 hover:bg-white text-gray-700 h-8 w-8 p-0"
              onClick={(e) => handleShareProperty(property, e)}
            >
              <Share className="h-3 w-3" />
            </Button>
          </div>
        </div>
        
        <CardContent className="p-3 sm:p-4 md:p-6">
          <h3 className="font-semibold text-sm sm:text-base lg:text-lg mb-2 line-clamp-2 dark:text-white">
            {property.title}
          </h3>
          
          <p className="text-lg sm:text-xl md:text-2xl font-bold text-blue-600 mb-2 dark:text-blue-400">
            {formatPrice(property.price, property.currency)}
          </p>
          
          <p className="text-gray-600 dark:text-gray-300 mb-3 flex items-center text-xs sm:text-sm">
            <MapPin className="h-3 w-3 sm:h-4 sm:w-4 mr-1 flex-shrink-0" />
            <span className="truncate">{property.city}, {property.province}</span>
          </p>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:flex lg:justify-between text-xs sm:text-sm text-gray-600 dark:text-gray-300 mb-3 gap-1 sm:gap-2">
            <span className="flex items-center">
              <Bed className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
              {property.bedrooms} hab.
            </span>
            <span className="flex items-center">
              <Bath className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
              {property.bathrooms} baños
            </span>
            <span className="flex items-center">
              <Building className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
              {property.surface_total} m²
            </span>
            {property.parking_spaces > 0 && (
              <span className="flex items-center">
                <Car className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                {property.parking_spaces}
              </span>
            )}
          </div>

          <div className="border-t dark:border-gray-600 pt-3">
            <div className="flex justify-between items-center">
              <div className="flex-1 min-w-0">
                <p className="text-xs sm:text-sm font-medium truncate dark:text-white">
                  {property.profiles?.company_name || 
                   `${property.profiles?.first_name || ''} ${property.profiles?.last_name || ''}`.trim() ||
                   'Propietario'}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 capitalize">
                  {property.profiles?.user_type || 'Propietario'}
                </p>
                {property.profiles?.phone && (
                  <p className="text-xs text-blue-600 dark:text-blue-400 truncate">
                    📞 {property.profiles.phone}
                  </p>
                )}
              </div>
              <div className="flex items-center text-xs text-gray-500 dark:text-gray-400 ml-2">
                <Eye className="h-3 w-3 mr-1" />
                {property.views_count || 0}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 dark:bg-gray-900 min-h-screen">
        <div className="text-center py-8">
          <Building className="h-16 w-16 text-gray-400 mx-auto mb-4 animate-pulse" />
          <p className="text-lg dark:text-white">Cargando propiedades...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 md:py-8 dark:bg-gray-900 min-h-screen">
      <div className="mb-6 md:mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4 md:mb-6">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">
            Propiedades en Venta y Alquiler
          </h1>
          <Button
            onClick={handleRefresh}
            disabled={refreshing}
            variant="outline"
            size="sm"
            className="flex items-center gap-2 self-start sm:self-auto"
          >
            <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
            {refreshing ? 'Actualizando...' : 'Actualizar'}
          </Button>
        </div>
        
        {/* Search bar and filter toggle for mobile */}
        <div className="flex gap-2 mb-4">
          <Input
            placeholder="Buscar propiedades..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="flex-1 dark:bg-gray-800 dark:border-gray-600 dark:text-white"
          />
          <Button
            variant="outline"
            onClick={() => setShowFilters(!showFilters)}
            className="md:hidden dark:border-gray-600"
          >
            <Filter className="h-4 w-4" />
          </Button>
        </div>
        
        {/* Filters */}
        <div className={`bg-white dark:bg-gray-800 p-4 md:p-6 rounded-lg shadow-md mb-4 md:mb-6 border dark:border-gray-700 ${showFilters ? 'block' : 'hidden md:block'}`}>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
            <Input
              placeholder="Buscar propiedades..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full hidden md:block lg:col-span-2 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            />
            
            <Select value={operationType} onValueChange={setOperationType}>
              <SelectTrigger className="dark:bg-gray-700 dark:border-gray-600 dark:text-white">
                <SelectValue placeholder="Tipo de operación" />
              </SelectTrigger>
              <SelectContent className="dark:bg-gray-800 dark:border-gray-600">
                <SelectItem value="all">Todas las operaciones</SelectItem>
                <SelectItem value="sale">Venta</SelectItem>
                <SelectItem value="rent">Alquiler</SelectItem>
              </SelectContent>
            </Select>

            <Select value={propertyType} onValueChange={setPropertyType}>
              <SelectTrigger className="dark:bg-gray-700 dark:border-gray-600 dark:text-white">
                <SelectValue placeholder="Tipo de propiedad" />
              </SelectTrigger>
              <SelectContent className="dark:bg-gray-800 dark:border-gray-600">
                <SelectItem value="all">Todos los tipos</SelectItem>
                {PROPERTY_TYPES.map((type) => (
                  <SelectItem key={type} value={type}>
                    {type}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
            <Select value={selectedState} onValueChange={setSelectedState}>
              <SelectTrigger className="dark:bg-gray-700 dark:border-gray-600 dark:text-white">
                <SelectValue placeholder="Estado" />
              </SelectTrigger>
              <SelectContent className="dark:bg-gray-800 dark:border-gray-600">
                <SelectItem value="all">Todos los estados</SelectItem>
                {Object.keys(MEXICO_STATES_MUNICIPALITIES).map((state) => (
                  <SelectItem key={state} value={state}>
                    {state}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={selectedCity} onValueChange={setSelectedCity} disabled={selectedState === 'all'}>
              <SelectTrigger className="dark:bg-gray-700 dark:border-gray-600 dark:text-white">
                <SelectValue placeholder="Municipio" />
              </SelectTrigger>
              <SelectContent className="dark:bg-gray-800 dark:border-gray-600">
                <SelectItem value="all">Todos los municipios</SelectItem>
                {availableCities.map((city) => (
                  <SelectItem key={city} value={city}>
                    {city}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={bedrooms} onValueChange={setBedrooms}>
              <SelectTrigger className="dark:bg-gray-700 dark:border-gray-600 dark:text-white">
                <SelectValue placeholder="Habitaciones" />
              </SelectTrigger>
              <SelectContent className="dark:bg-gray-800 dark:border-gray-600">
                <SelectItem value="all">Cualquier cantidad</SelectItem>
                <SelectItem value="1">1+ habitaciones</SelectItem>
                <SelectItem value="2">2+ habitaciones</SelectItem>
                <SelectItem value="3">3+ habitaciones</SelectItem>
                <SelectItem value="4">4+ habitaciones</SelectItem>
                <SelectItem value="5">5+ habitaciones</SelectItem>
              </SelectContent>
            </Select>

            <Select value={bathrooms} onValueChange={setBathrooms}>
              <SelectTrigger className="dark:bg-gray-700 dark:border-gray-600 dark:text-white">
                <SelectValue placeholder="Baños" />
              </SelectTrigger>
              <SelectContent className="dark:bg-gray-800 dark:border-gray-600">
                <SelectItem value="all">Cualquier cantidad</SelectItem>
                <SelectItem value="1">1+ baños</SelectItem>
                <SelectItem value="2">2+ baños</SelectItem>
                <SelectItem value="3">3+ baños</SelectItem>
                <SelectItem value="4">4+ baños</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Input
              placeholder="Precio mínimo"
              type="number"
              value={minPrice}
              onChange={(e) => setMinPrice(e.target.value)}
              className="dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            />

            <Input
              placeholder="Precio máximo"
              type="number"
              value={maxPrice}
              onChange={(e) => setMaxPrice(e.target.value)}
              className="dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            />

            <Input
              placeholder="Ubicación específica"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            />
          </div>
        </div>
      </div>

      {/* Properties Grid */}
      {filteredProperties.length === 0 ? (
        <div className="text-center py-12">
          <Building className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            No se encontraron propiedades
          </h3>
          <p className="text-gray-600 dark:text-gray-300 mb-4">
            {properties.length === 0 
              ? "No hay propiedades disponibles en este momento"
              : "Intenta ajustar tus filtros de búsqueda"
            }
          </p>
          <Button 
            onClick={handleRefresh} 
            className="mt-4"
            variant="outline"
            disabled={refreshing}
          >
            {refreshing ? 'Recargando...' : 'Recargar propiedades'}
          </Button>
        </div>
      ) : (
        <>
          <div className="mb-4 md:mb-6">
            <p className="text-gray-600 dark:text-gray-300 text-sm sm:text-base">
              Mostrando {filteredProperties.length} propiedad{filteredProperties.length !== 1 ? 'es' : ''}
            </p>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
            {filteredProperties.map((property) => (
              <PropertyCard key={property.id} property={property} />
            ))}
          </div>
        </>
      )}
      
      <PropertyDetailsModal 
        property={selectedProperty}
        isOpen={isModalOpen}
        onClose={handleCloseModal}
      />
    </div>
  );
};

export default PropertiesPage;