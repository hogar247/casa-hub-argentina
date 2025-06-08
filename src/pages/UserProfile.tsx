
import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MapPin, Phone, Mail, Building, Crown, Share2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface UserProfile {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  avatar_url: string;
  company_name: string;
  subscriptions: Array<{
    plan_type: string;
    status: string;
  }>;
}

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

const UserProfile = () => {
  const { username } = useParams();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (username) {
      fetchUserProfile();
    }
  }, [username]);

  const fetchUserProfile = async () => {
    if (!username) return;

    const [firstName, lastName] = username.split('-');
    
    const { data: profileData } = await supabase
      .from('profiles')
      .select(`
        *,
        subscriptions!subscriptions_user_id_fkey (
          plan_type,
          status
        )
      `)
      .eq('first_name', firstName)
      .eq('last_name', lastName)
      .single();

    if (profileData) {
      // Verificar que el usuario tiene plan VIP (3000 MXN)
      const activeSub = profileData.subscriptions?.find(sub => sub.status === 'active');
      if (activeSub?.plan_type !== 'plan_3000') {
        setLoading(false);
        return;
      }

      setProfile(profileData);

      // Fetch user properties
      const { data: propertiesData } = await supabase
        .from('properties')
        .select(`
          *,
          property_images (image_url, is_main),
          property_categories (name)
        `)
        .eq('user_id', profileData.id)
        .eq('status', 'published')
        .order('created_at', { ascending: false });

      if (propertiesData) {
        setProperties(propertiesData);
      }
    }

    setLoading(false);
  };

  const formatPrice = (price: number, currency: string) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: currency === 'ARS' ? 'ARS' : currency === 'MXN' ? 'MXN' : 'USD',
    }).format(price);
  };

  const shareProfile = () => {
    const url = window.location.href;
    navigator.clipboard.writeText(url);
    alert('Enlace del perfil copiado al portapapeles');
  };

  const shareProperty = (property: Property) => {
    const url = `${window.location.origin}/properties/${property.id}`;
    navigator.clipboard.writeText(url);
    alert('Enlace de la propiedad copiado al portapapeles');
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center">
          <p>Cargando perfil...</p>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            Perfil no encontrado
          </h1>
          <p className="text-gray-600">
            Este usuario no tiene un perfil público disponible o no cuenta con el plan VIP.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Profile Header */}
      <div className="bg-gradient-to-r from-purple-600 via-pink-600 to-red-600 rounded-lg p-8 mb-8 text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-black opacity-20"></div>
        <div className="relative z-10">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-6">
              <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center">
                <Crown className="h-12 w-12 text-purple-600" />
              </div>
              <div>
                <h1 className="text-4xl font-bold mb-2">
                  {profile.first_name} {profile.last_name}
                </h1>
                <div className="flex items-center space-x-4 text-purple-100">
                  <span className="bg-purple-500 px-3 py-1 rounded-full text-sm font-semibold">
                    Usuario VIP
                  </span>
                  <span className="flex items-center">
                    <Building className="h-4 w-4 mr-1" />
                    {properties.length} propiedades
                  </span>
                </div>
                {profile.company_name && (
                  <p className="text-purple-100 mt-2">{profile.company_name}</p>
                )}
              </div>
            </div>
            <Button onClick={shareProfile} variant="secondary">
              <Share2 className="h-4 w-4 mr-2" />
              Compartir Perfil
            </Button>
          </div>

          {/* Contact Info */}
          <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
            {profile.phone && (
              <div className="flex items-center">
                <Phone className="h-5 w-5 mr-2" />
                <span>{profile.phone}</span>
              </div>
            )}
            {profile.email && (
              <div className="flex items-center">
                <Mail className="h-5 w-5 mr-2" />
                <span>{profile.email}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Properties Grid */}
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-gray-900 mb-6">
          Propiedades de {profile.first_name}
        </h2>

        {properties.length === 0 ? (
          <div className="text-center py-12">
            <Building className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500 text-lg">
              Este usuario no tiene propiedades publicadas.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {properties.map((property) => {
              const mainImage = property.property_images?.find(img => img.is_main)?.image_url 
                || property.property_images?.[0]?.image_url 
                || '/placeholder.svg';

              return (
                <Card key={property.id} className="overflow-hidden hover:shadow-lg transition-shadow border-4 border-gradient-to-r from-purple-500 via-pink-500 to-red-500 shadow-2xl animate-pulse bg-gradient-to-br from-purple-100 to-pink-100">
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
                      <span className="bg-purple-600 text-white px-3 py-1 rounded-full text-sm font-medium">
                        VIP
                      </span>
                    </div>
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
        )}
      </div>
    </div>
  );
};

export default UserProfile;
