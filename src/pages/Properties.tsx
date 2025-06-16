
import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, MapPin, Filter, Share2, User, Building, Star } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface Property {
  id: string;
  title: string;
  price: number;
  currency: string;
  operation_type: string;
  city: string;
  province: string;
  bedrooms: number;
  bathrooms: number;
  surface_total: number;
  property_images: Array<{ image_url: string; is_main: boolean }>;
  property_categories: { name: string };
  profiles: {
    first_name: string;
    last_name: string;
    phone: string;
    user_type: string;
    subscriptions: Array<{
      plan_type: string;
      status: string;
    }>;
  };
}

const Properties = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [properties, setProperties] = useState<Property[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    search: searchParams.get('search') || '',
    operation_type: '',
    category: '',
    min_price: '',
    max_price: '',
    city: '',
    bedrooms: '',
    username: '',
    phone: ''
  });

  useEffect(() => {
    fetchCategories();
    fetchProperties();
  }, []);

  useEffect(() => {
    fetchProperties();
  }, [filters]);

  const fetchCategories = async () => {
    const { data } = await supabase
      .from('property_categories')
      .select('*')
      .order('name');
    
    if (data) setCategories(data);
  };

  const fetchProperties = async () => {
    setLoading(true);
    
    let query = supabase
      .from('properties')
      .select(`
        *,
        property_images (image_url, is_main),
        property_categories (name),
        profiles!properties_user_id_fkey (
          first_name,
          last_name,
          phone,
          user_type,
          subscriptions!subscriptions_user_id_fkey (
            plan_type,
            status
          )
        )
      `)
      .eq('status', 'published')
      .order('created_at', { ascending: false });

    if (filters.search) {
      query = query.or(`title.ilike.%${filters.search}%,city.ilike.%${filters.search}%,province.ilike.%${filters.search}%`);
    }

    if (filters.operation_type) {
      query = query.eq('operation_type', filters.operation_type);
    }

    if (filters.category) {
      query = query.eq('category_id', filters.category);
    }

    if (filters.min_price) {
      query = query.gte('price', parseFloat(filters.min_price));
    }

    if (filters.max_price) {
      query = query.lte('price', parseFloat(filters.max_price));
    }

    if (filters.city) {
      query = query.ilike('city', `%${filters.city}%`);
    }

    if (filters.bedrooms) {
      query = query.eq('bedrooms', parseInt(filters.bedrooms));
    }

    if (filters.username) {
      query = query.or(`profiles.first_name.ilike.%${filters.username}%,profiles.last_name.ilike.%${filters.username}%`);
    }

    if (filters.phone) {
      query = query.ilike('profiles.phone', `%${filters.phone}%`);
    }

    const { data, error } = await query;

    if (data && !error) {
      setProperties(data);
    }
    
    setLoading(false);
  };

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const formatPrice = (price: number, currency: string) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: currency === 'ARS' ? 'ARS' : currency === 'MXN' ? 'MXN' : 'USD',
    }).format(price);
  };

  const getUserPlan = (subscriptions: any[]) => {
    const activeSub = subscriptions?.find(sub => sub.status === 'active');
    return activeSub?.plan_type || 'basic';
  };

  const getPlanPrice = (plan: string) => {
    const prices = {
      'basic': 0,
      'plan_100': 100,
      'plan_300': 300,
      'plan_500': 500,
      'plan_1000': 1000,
      'plan_3000': 3000
    };
    return prices[plan] || 0;
  };

  const getFrameStyle = (plan: string) => {
    switch (plan) {
      case 'plan_1000':
        return 'border-4 border-yellow-500 shadow-lg shadow-yellow-500/50';
      case 'plan_3000':
        return 'border-4 border-gradient-to-r from-purple-500 via-pink-500 to-red-500 shadow-2xl animate-pulse bg-gradient-to-br from-purple-100 to-pink-100';
      default:
        return '';
    }
  };

  const shareProperty = (property: Property) => {
    const url = `${window.location.origin}/properties/${property.id}`;
    navigator.clipboard.writeText(url);
    alert('Enlace copiado al portapapeles');
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">
          Propiedades Disponibles
        </h1>

        {/* Filters */}
        <div className="bg-white p-6 rounded-lg shadow-sm border mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                type="text"
                placeholder="Buscar..."
                value={filters.search}
                onChange={(e) => handleFilterChange('search', e.target.value)}
                className="pl-10"
              />
            </div>

            <Input
              type="text"
              placeholder="Nombre de usuario"
              value={filters.username}
              onChange={(e) => handleFilterChange('username', e.target.value)}
            />

            <Input
              type="text"
              placeholder="Teléfono"
              value={filters.phone}
              onChange={(e) => handleFilterChange('phone', e.target.value)}
            />

            <Select
              value={filters.operation_type}
              onValueChange={(value) => handleFilterChange('operation_type', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Tipo de operación" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Todos</SelectItem>
                <SelectItem value="sale">Venta</SelectItem>
                <SelectItem value="rent">Alquiler</SelectItem>
              </SelectContent>
            </Select>

            <Select
              value={filters.category}
              onValueChange={(value) => handleFilterChange('category', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Categoría" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Todas</SelectItem>
                {categories.map((category) => (
                  <SelectItem key={category.id} value={category.id}>
                    {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Input
              type="text"
              placeholder="Ciudad"
              value={filters.city}
              onChange={(e) => handleFilterChange('city', e.target.value)}
            />

            <Input
              type="number"
              placeholder="Precio mínimo"
              value={filters.min_price}
              onChange={(e) => handleFilterChange('min_price', e.target.value)}
            />

            <Input
              type="number"
              placeholder="Precio máximo"
              value={filters.max_price}
              onChange={(e) => handleFilterChange('max_price', e.target.value)}
            />

            <Select
              value={filters.bedrooms}
              onValueChange={(value) => handleFilterChange('bedrooms', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Dormitorios" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Cualquier cantidad</SelectItem>
                <SelectItem value="1">1 dormitorio</SelectItem>
                <SelectItem value="2">2 dormitorios</SelectItem>
                <SelectItem value="3">3 dormitorios</SelectItem>
                <SelectItem value="4">4+ dormitorios</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Results */}
      {loading ? (
        <div className="text-center py-8">
          <p>Cargando propiedades...</p>
        </div>
      ) : (
        <>
          <div className="mb-6">
            <p className="text-gray-600">
              {properties.length} propiedades encontradas
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {properties.map((property) => {
              const mainImage = property.property_images?.find(img => img.is_main)?.image_url 
                || property.property_images?.[0]?.image_url 
                || '/placeholder.svg';
              
              const userPlan = getUserPlan(property.profiles?.subscriptions);
              const planPrice = getPlanPrice(userPlan);
              const frameStyle = getFrameStyle(userPlan);
              const canShare = planPrice >= 1000;

              return (
                <Card key={property.id} className={`overflow-hidden hover:shadow-lg transition-shadow cursor-pointer ${frameStyle}`}>
                  <div className="aspect-video relative">
                    <img 
                      src={mainImage} 
                      alt={property.title}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute top-4 left-4 flex gap-2">
                      <span className="bg-blue-600 text-white px-3 py-1 rounded-full text-sm font-medium">
                        {property.operation_type === 'sale' ? 'Venta' : 'Alquiler'}
                      </span>
                      {planPrice > 0 && (
                        <span className="bg-yellow-500 text-white px-3 py-1 rounded-full text-sm font-medium flex items-center">
                          <Star className="h-3 w-3 mr-1" />
                          Premium
                        </span>
                      )}
                    </div>
                    {canShare && (
                      <Button
                        size="sm"
                        variant="secondary"
                        className="absolute top-4 right-4"
                        onClick={(e) => {
                          e.stopPropagation();
                          shareProperty(property);
                        }}
                      >
                        <Share2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                  
                  <CardContent className="p-6" onClick={() => navigate(`/properties/${property.id}`)}>
                    <h3 className="font-semibold text-lg mb-2 line-clamp-2">
                      {property.title}
                    </h3>
                    
                    <p className="text-sm text-gray-600 mb-2">
                      {property.property_categories?.name}
                    </p>
                    
                    <p className="text-2xl font-bold text-blue-600 mb-2">
                      {formatPrice(property.price, property.currency)}
                    </p>
                    
                    <p className="text-gray-600 mb-4 flex items-center">
                      <MapPin className="h-4 w-4 mr-1" />
                      {property.city}, {property.province}
                    </p>

                    {/* User Info */}
                    <div className="border-t pt-3 mt-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <User className="h-4 w-4 mr-2 text-gray-500" />
                          <span className="text-sm text-gray-700">
                            {property.profiles?.first_name} {property.profiles?.last_name}
                          </span>
                          {planPrice >= 3000 && (
                            <Button
                              size="sm"
                              variant="link"
                              className="text-xs p-0 ml-2"
                              onClick={(e) => {
                                e.stopPropagation();
                                navigate(`/user/${property.profiles?.first_name}-${property.profiles?.last_name}`);
                              }}
                            >
                              Ver perfil
                            </Button>
                          )}
                        </div>
                        {planPrice > 0 && (
                          <span className="text-xs bg-gray-100 px-2 py-1 rounded">
                            Plan ${planPrice} MXN
                          </span>
                        )}
                      </div>
                      {property.profiles?.phone && planPrice >= 300 && (
                        <p className="text-sm text-gray-600 mt-1">
                          📞 {property.profiles.phone}
                        </p>
                      )}
                    </div>
                    
                    <div className="flex justify-between text-sm text-gray-600 mt-3">
                      <span>{property.bedrooms} dorm.</span>
                      <span>{property.bathrooms} baños</span>
                      <span>{property.surface_total} m²</span>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {properties.length === 0 && (
            <div className="text-center py-12">
              <p className="text-gray-500 text-lg">
                No se encontraron propiedades con los filtros seleccionados.
              </p>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default Properties;
