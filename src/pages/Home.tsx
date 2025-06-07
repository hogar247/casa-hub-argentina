
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Search, MapPin, Home, Building, Calendar, Users } from 'lucide-react';
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
}

const Home = () => {
  const navigate = useNavigate();
  const [featuredProperties, setFeaturedProperties] = useState<Property[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchFeaturedProperties();
  }, []);

  const fetchFeaturedProperties = async () => {
    const { data, error } = await supabase
      .from('properties')
      .select(`
        *,
        property_images (image_url, is_main)
      `)
      .eq('status', 'published')
      .eq('is_featured', true)
      .limit(6);

    if (data && !error) {
      setFeaturedProperties(data);
    }
  };

  const handleSearch = () => {
    navigate(`/properties?search=${encodeURIComponent(searchQuery)}`);
  };

  const formatPrice = (price: number, currency: string) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: currency === 'ARS' ? 'ARS' : 'USD',
    }).format(price);
  };

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-blue-600 to-blue-800 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <div className="text-center">
            <h1 className="text-4xl md:text-6xl font-bold mb-6">
              Encuentra tu hogar ideal
            </h1>
            <p className="text-xl md:text-2xl mb-8 text-blue-100">
              La plataforma líder en soluciones inmobiliarias en Argentina
            </p>

            {/* Search Bar */}
            <div className="max-w-2xl mx-auto flex gap-2">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                <Input
                  type="text"
                  placeholder="Buscar por ubicación, tipo de propiedad..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 py-3 text-gray-900"
                  onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                />
              </div>
              <Button onClick={handleSearch} size="lg" variant="secondary">
                Buscar
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 text-center">
            <div className="flex flex-col items-center">
              <Home className="h-12 w-12 text-blue-600 mb-4" />
              <h3 className="text-3xl font-bold text-gray-900">5,000+</h3>
              <p className="text-gray-600">Propiedades</p>
            </div>
            <div className="flex flex-col items-center">
              <Users className="h-12 w-12 text-blue-600 mb-4" />
              <h3 className="text-3xl font-bold text-gray-900">10,000+</h3>
              <p className="text-gray-600">Clientes Satisfechos</p>
            </div>
            <div className="flex flex-col items-center">
              <Building className="h-12 w-12 text-blue-600 mb-4" />
              <h3 className="text-3xl font-bold text-gray-900">500+</h3>
              <p className="text-gray-600">Agentes</p>
            </div>
            <div className="flex flex-col items-center">
              <Calendar className="h-12 w-12 text-blue-600 mb-4" />
              <h3 className="text-3xl font-bold text-gray-900">15+</h3>
              <p className="text-gray-600">Años de experiencia</p>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Properties */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Propiedades Destacadas
            </h2>
            <p className="text-lg text-gray-600">
              Descubre las mejores propiedades disponibles
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {featuredProperties.map((property) => {
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
                    
                    <p className="text-2xl font-bold text-blue-600 mb-2">
                      {formatPrice(property.price, property.currency)}
                    </p>
                    
                    <p className="text-gray-600 mb-4 flex items-center">
                      <MapPin className="h-4 w-4 mr-1" />
                      {property.city}, {property.province}
                    </p>
                    
                    <div className="flex justify-between text-sm text-gray-600">
                      <span>{property.bedrooms} dormitorios</span>
                      <span>{property.bathrooms} baños</span>
                      <span>{property.surface_total} m²</span>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          <div className="text-center mt-12">
            <Button onClick={() => navigate('/properties')} size="lg">
              Ver Todas las Propiedades
            </Button>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-blue-600 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold mb-4">
            ¿Tienes una propiedad para vender o alquilar?
          </h2>
          <p className="text-xl mb-8 text-blue-100">
            Únete a nuestra plataforma y llega a miles de compradores potenciales
          </p>
          <Button onClick={() => navigate('/auth?tab=signup')} size="lg" variant="secondary">
            Publica tu Propiedad
          </Button>
        </div>
      </section>
    </div>
  );
};

export default Home;
