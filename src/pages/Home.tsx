
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Search, MapPin, Building, Calendar, Users, Star, Crown, Zap, Eye, Bed, Bath, Car, Share2, Heart } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import MercadoPagoButton from '@/components/MercadoPagoButton';

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
  parking_spaces: number;
  views_count: number;
  is_featured: boolean;
  property_images: Array<{ image_url: string; is_main: boolean }>;
  profiles: {
    first_name: string;
    last_name: string;
    company_name: string;
    phone: string;
    user_type: string;
    youtube_url?: string;
    instagram_url?: string;
    facebook_url?: string;
  };
  subscriptions: Array<{
    plan_type: string;
    status: string;
  }>;
}

const HomePage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [allProperties, setAllProperties] = useState<Property[]>([]);
  const [featuredProperties, setFeaturedProperties] = useState<Property[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [favorites, setFavorites] = useState<string[]>([]);

  useEffect(() => {
    fetchProperties();
    if (user) {
      fetchFavorites();
    }
  }, [user]);

  const fetchFavorites = async () => {
    if (!user) return;
    
    const { data } = await supabase
      .from('favorites')
      .select('property_id')
      .eq('user_id', user.id);
    
    if (data) {
      setFavorites(data.map(fav => fav.property_id));
    }
  };

  const toggleFavorite = async (propertyId: string) => {
    if (!user) {
      toast({
        title: "Inicia sesión",
        description: "Necesitas iniciar sesión para guardar favoritos",
        variant: "destructive",
      });
      return;
    }

    const isFavorite = favorites.includes(propertyId);
    
    if (isFavorite) {
      const { error } = await supabase
        .from('favorites')
        .delete()
        .eq('user_id', user.id)
        .eq('property_id', propertyId);
      
      if (!error) {
        setFavorites(prev => prev.filter(id => id !== propertyId));
        toast({
          title: "Eliminado de favoritos",
          description: "La propiedad ha sido eliminada de tus favoritos",
        });
      }
    } else {
      const { error } = await supabase
        .from('favorites')
        .insert([{ user_id: user.id, property_id: propertyId }]);
      
      if (!error) {
        setFavorites(prev => [...prev, propertyId]);
        toast({
          title: "Agregado a favoritos",
          description: "La propiedad ha sido agregada a tus favoritos",
        });
      }
    }
  };

  const fetchProperties = async () => {
    const { data, error } = await supabase
      .from('properties')
      .select(`
        *,
        property_images (image_url, is_main),
        profiles (first_name, last_name, company_name, phone, user_type, youtube_url, instagram_url, facebook_url),
        subscriptions!inner (plan_type, status)
      `)
      .eq('status', 'published')
      .eq('subscriptions.status', 'active')
      .order('created_at', { ascending: false });

    if (data && !error) {
      // Separate featured and regular properties
      const featured = data.filter(property => property.is_featured).slice(0, 6);
      const shuffled = [...data].sort(() => 0.5 - Math.random()).slice(0, 12);
      
      setFeaturedProperties(featured);
      setAllProperties(shuffled);
    }
  };

  const handleSearch = () => {
    navigate(`/properties?search=${encodeURIComponent(searchQuery)}`);
  };

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

  const handleShare = async (property: Property) => {
    const shareData = {
      title: property.title,
      text: `${property.title} - ${formatPrice(property.price, property.currency)}`,
      url: `${window.location.origin}/properties/${property.id}`
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch (error) {
        console.log('Error sharing:', error);
      }
    } else {
      navigator.clipboard.writeText(shareData.url);
      alert('Enlace copiado al portapapeles');
    }
  };

  const PropertyCard = ({ property }: { property: Property }) => {
    const mainImage = property.property_images?.find(img => img.is_main)?.image_url 
      || property.property_images?.[0]?.image_url 
      || '/placeholder.svg';

    const activeSub = property.subscriptions?.find(sub => sub.status === 'active');
    const showPhone = activeSub && ['plan_300', 'plan_500', 'plan_1000', 'plan_3000'].includes(activeSub.plan_type);
    const canShare = activeSub && ['plan_1000', 'plan_3000'].includes(activeSub.plan_type);
    const isFavorite = favorites.includes(property.id);

    return (
      <Card 
        className={`overflow-hidden hover:shadow-xl transition-all duration-300 cursor-pointer ${getPropertyFrame(property.subscriptions)}`}
        onClick={() => navigate(`/properties/${property.id}`)}
      >
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
              <Badge className="bg-yellow-500 text-white">Destacado</Badge>
            </div>
          )}
          <div className="absolute bottom-4 right-4 flex gap-2">
            <button
              onClick={(e) => {
                e.stopPropagation();
                toggleFavorite(property.id);
              }}
              className={`p-2 rounded-full transition-colors ${
                isFavorite 
                  ? 'bg-red-500 text-white' 
                  : 'bg-white/80 hover:bg-white text-gray-700'
              }`}
            >
              <Heart className={`h-4 w-4 ${isFavorite ? 'fill-current' : ''}`} />
            </button>
            {canShare && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleShare(property);
                }}
                className="bg-white/80 hover:bg-white p-2 rounded-full transition-colors"
              >
                <Share2 className="h-4 w-4" />
              </button>
            )}
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

          {/* Agent info */}
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
                {/* Social media links for premium users */}
                {activeSub && ['plan_1000', 'plan_3000'].includes(activeSub.plan_type) && (
                  <div className="flex gap-2 mt-2">
                    {property.profiles?.youtube_url && (
                      <a href={property.profiles.youtube_url} target="_blank" rel="noopener noreferrer" className="text-red-500">
                        📺
                      </a>
                    )}
                    {property.profiles?.instagram_url && (
                      <a href={property.profiles.instagram_url} target="_blank" rel="noopener noreferrer" className="text-pink-500">
                        📷
                      </a>
                    )}
                    {property.profiles?.facebook_url && (
                      <a href={property.profiles.facebook_url} target="_blank" rel="noopener noreferrer" className="text-blue-500">
                        📘
                      </a>
                    )}
                  </div>
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
              La plataforma líder en soluciones inmobiliarias en México
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

      {/* Destacados Section */}
      <section className="py-16 bg-gradient-to-r from-yellow-50 to-orange-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4 flex items-center justify-center">
              <Star className="h-8 w-8 text-yellow-500 mr-2" />
              Propiedades Destacadas
            </h2>
            <p className="text-lg text-gray-600 mb-6">
              Las mejores propiedades seleccionadas especialmente para ti
            </p>
            <div className="bg-yellow-100 border border-yellow-300 rounded-lg p-4 max-w-2xl mx-auto">
              <h3 className="font-semibold text-yellow-800 mb-2">¿Quieres destacar tu propiedad?</h3>
              <p className="text-yellow-700 text-sm mb-3">
                Por solo $250 MXN a la semana, tu propiedad aparecerá en esta sección especial. 
                Máximo 20 destacados por estado.
              </p>
              <MercadoPagoButton
                planId="destacado_semanal"
                planName="Destacado Semanal"
                price={250}
                onSuccess={() => alert('¡Tu propiedad será destacada pronto!')}
              />
            </div>
          </div>

          {featuredProperties.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-8">
              {featuredProperties.map((property) => (
                <PropertyCard key={property.id} property={property} />
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Star className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">Próximamente propiedades destacadas</p>
            </div>
          )}
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 text-center">
            <div className="flex flex-col items-center">
              <Building className="h-12 w-12 text-blue-600 mb-4" />
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

      {/* All Properties */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Todas las Propiedades
            </h2>
            <p className="text-lg text-gray-600">
              Explora nuestra amplia selección de propiedades disponibles
            </p>
          </div>

          {allProperties.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {allProperties.map((property) => (
                <PropertyCard key={property.id} property={property} />
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Building className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">Cargando propiedades...</p>
            </div>
          )}

          <div className="text-center mt-12">
            <Button onClick={() => navigate('/properties')} size="lg">
              Ver Todas las Propiedades
            </Button>
          </div>
        </div>
      </section>

      {/* Plans Section */}
      <section className="py-16 bg-gradient-to-r from-blue-600 to-purple-700 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">
              Planes de Suscripción
            </h2>
            <p className="text-xl text-blue-100">
              Elige el plan perfecto para potenciar tu negocio inmobiliario
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <Card className="bg-white text-gray-900 p-6">
              <div className="text-center">
                <Building className="h-12 w-12 text-blue-600 mx-auto mb-4" />
                <h3 className="text-xl font-bold mb-2">Plan Básico</h3>
                <p className="text-3xl font-bold text-blue-600 mb-4">Gratis</p>
                <ul className="text-left space-y-2 mb-6">
                  <li>• 1 publicación</li>
                  <li>• Máximo 5 fotos</li>
                  <li>• Sin enlaces externos</li>
                  <li>• Publicación extra $100 MXN</li>
                </ul>
                <Button className="w-full" disabled>
                  Plan Actual
                </Button>
              </div>
            </Card>

            <Card className="bg-white text-gray-900 p-6">
              <div className="text-center">
                <Crown className="h-12 w-12 text-green-600 mx-auto mb-4" />
                <h3 className="text-xl font-bold mb-2">Plan $100</h3>
                <p className="text-3xl font-bold text-green-600 mb-4">$100 MXN/mes</p>
                <ul className="text-left space-y-2 mb-6">
                  <li>• 3 publicaciones</li>
                  <li>• Máximo 10 fotos</li>
                  <li>• Número telefónico</li>
                </ul>
                <Button className="w-full bg-green-600 hover:bg-green-700" onClick={() => navigate('/plans')}>
                  Elegir Plan
                </Button>
              </div>
            </Card>

            <Card className="bg-white text-gray-900 p-6 border-2 border-yellow-500">
              <div className="text-center">
                <Crown className="h-12 w-12 text-yellow-600 mx-auto mb-4" />
                <h3 className="text-xl font-bold mb-2">Plan Premium</h3>
                <p className="text-3xl font-bold text-yellow-600 mb-4">$1,000 MXN/mes</p>
                <ul className="text-left space-y-2 mb-6">
                  <li>• 30 publicaciones</li>
                  <li>• Máximo 30 fotos</li>
                  <li>• Marco dorado</li>
                  <li>• Redes sociales</li>
                  <li>• Analytics</li>
                </ul>
                <Button className="w-full bg-yellow-600 hover:bg-yellow-700" onClick={() => navigate('/plans')}>
                  Elegir Plan
                </Button>
              </div>
            </Card>

            <Card className="bg-white text-gray-900 p-6">
              <div className="text-center">
                <Zap className="h-12 w-12 text-purple-600 mx-auto mb-4" />
                <h3 className="text-xl font-bold mb-2">Plan VIP</h3>
                <p className="text-3xl font-bold text-purple-600 mb-4">$3,000 MXN/mes</p>
                <ul className="text-left space-y-2 mb-6">
                  <li>• 100 publicaciones</li>
                  <li>• Marcos animados</li>
                  <li>• Página VIP exclusiva</li>
                  <li>• Analytics avanzados</li>
                  <li>• Exportar catálogo</li>
                </ul>
                <Button className="w-full bg-purple-600 hover:bg-purple-700" onClick={() => navigate('/plans')}>
                  Elegir Plan
                </Button>
              </div>
            </Card>
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

      {/* WhatsApp Support */}
      <div className="fixed bottom-6 right-6">
        <a
          href="https://wa.me/5217717789580"
          target="_blank"
          rel="noopener noreferrer"
          className="bg-green-500 hover:bg-green-600 text-white p-3 rounded-full shadow-lg transition-colors"
          title="Soporte WhatsApp"
        >
          <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.488z"/>
          </svg>
        </a>
      </div>
    </div>
  );
};

export default HomePage;
