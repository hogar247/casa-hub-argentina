
import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, MapPin, Filter } from 'lucide-react';
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
    bedrooms: ''
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
        property_categories (name)
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
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: currency === 'ARS' ? 'ARS' : 'USD',
    }).format(price);
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

              return (
                <Card key={property.id} className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer"
                      onClick={() => navigate(`/properties/${property.id}`)}>
                  <div className="aspect-video relative">
                    <img 
                      src={mainImage} 
                      alt={property.title}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute top-4 left-4">
                      <span className="bg-blue-600 text-white px-3 py-1 rounded-full text-sm font-medium">
                        {property.operation_type === 'sale' ? 'Venta' : 'Alquiler'}
                      </span>
                    </div>
                  </div>
                  
                  <CardContent className="p-6">
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
                    
                    <div className="flex justify-between text-sm text-gray-600">
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
