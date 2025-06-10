
import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { MapPin, Building, Eye, Bed, Bath, Car, Star, Phone, Share } from 'lucide-react';

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

interface PropertyDetailsModalProps {
  property: Property | null;
  isOpen: boolean;
  onClose: () => void;
}

const PropertyDetailsModal = ({ property, isOpen, onClose }: PropertyDetailsModalProps) => {
  if (!property) return null;

  const formatPrice = (price: number, currency: string) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: currency === 'USD' ? 'USD' : 'MXN',
    }).format(price);
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

  const handleShareProperty = async () => {
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
      // Fallback: copy to clipboard
      try {
        await navigator.clipboard.writeText(`${shareText} ${shareUrl}`);
        // Could add a toast here if you have access to toast context
      } catch (error) {
        console.error('Could not copy to clipboard:', error);
      }
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex justify-between items-start">
            <DialogTitle className="text-2xl font-bold pr-4">{property.title}</DialogTitle>
            <Button
              variant="outline"
              size="sm"
              onClick={handleShareProperty}
              className="flex items-center gap-2"
            >
              <Share className="h-4 w-4" />
              Compartir
            </Button>
          </div>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Property Images */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {property.property_images?.slice(0, 4).map((image, index) => (
              <div key={index} className="aspect-video relative">
                <img 
                  src={image.image_url} 
                  alt={`${property.title} - Imagen ${index + 1}`}
                  className="w-full h-full object-cover rounded-lg"
                />
                {image.is_main && (
                  <Badge className="absolute top-2 left-2 bg-blue-600 text-white">
                    Principal
                  </Badge>
                )}
              </div>
            ))}
          </div>

          {/* Price and Operation Type */}
          <div className="flex flex-wrap items-center gap-4">
            <div className="text-3xl font-bold text-blue-600">
              {formatPrice(property.price, property.currency)}
            </div>
            <Badge className="bg-blue-600 text-white text-lg px-3 py-1">
              {property.operation_type === 'sale' ? 'Venta' : 'Alquiler'}
            </Badge>
            {getUserBadge(property.subscriptions)}
            {property.is_featured && (
              <Badge className="bg-yellow-500 text-white flex items-center gap-1">
                <Star className="h-4 w-4 fill-current" />
                Destacado
              </Badge>
            )}
          </div>

          {/* Location */}
          <div className="flex items-center text-gray-600">
            <MapPin className="h-5 w-5 mr-2" />
            <span className="text-lg">{property.address}, {property.city}, {property.province}</span>
          </div>

          {/* Property Details */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center">
              <Bed className="h-5 w-5 mr-2 text-gray-600" />
              <span className="font-medium">{property.bedrooms} Habitaciones</span>
            </div>
            <div className="flex items-center">
              <Bath className="h-5 w-5 mr-2 text-gray-600" />
              <span className="font-medium">{property.bathrooms} Baños</span>
            </div>
            <div className="flex items-center">
              <Building className="h-5 w-5 mr-2 text-gray-600" />
              <span className="font-medium">{property.surface_total} m² Total</span>
            </div>
            {property.parking_spaces > 0 && (
              <div className="flex items-center">
                <Car className="h-5 w-5 mr-2 text-gray-600" />
                <span className="font-medium">{property.parking_spaces} Estacionamientos</span>
              </div>
            )}
          </div>

          {property.surface_covered && property.surface_covered > 0 && (
            <div className="text-gray-600">
              <strong>Superficie cubierta:</strong> {property.surface_covered} m²
            </div>
          )}

          {/* Description */}
          <div>
            <h3 className="text-xl font-semibold mb-3">Descripción</h3>
            <p className="text-gray-700 leading-relaxed">{property.description}</p>
          </div>

          {/* Features */}
          {property.features && property.features.length > 0 && (
            <div>
              <h3 className="text-xl font-semibold mb-3">Características</h3>
              <div className="flex flex-wrap gap-2">
                {property.features.map((feature, index) => (
                  <Badge key={index} variant="outline" className="text-sm">
                    {feature}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Amenities */}
          {property.amenities && property.amenities.length > 0 && (
            <div>
              <h3 className="text-xl font-semibold mb-3">Amenidades</h3>
              <div className="flex flex-wrap gap-2">
                {property.amenities.map((amenity, index) => (
                  <Badge key={index} variant="outline" className="text-sm bg-blue-50">
                    {amenity}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Contact Information - Now available for all users */}
          <div className="border-t pt-6">
            <h3 className="text-xl font-semibold mb-4">Información de Contacto</h3>
            <div className="bg-blue-50 p-4 rounded-lg">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-lg font-medium">
                    {property.profiles?.company_name || 
                     `${property.profiles?.first_name || ''} ${property.profiles?.last_name || ''}`.trim() ||
                     'Propietario'}
                  </p>
                  <p className="text-sm text-gray-600 capitalize mb-2">
                    {property.profiles?.user_type || 'Propietario'}
                  </p>
                  
                  {property.profiles?.phone ? (
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-blue-600" />
                      <span className="text-blue-600 font-medium">{property.profiles.phone}</span>
                      <Button 
                        size="sm" 
                        className="ml-2"
                        onClick={() => window.open(`tel:${property.profiles.phone}`, '_self')}
                      >
                        Llamar
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => window.open(`https://wa.me/${property.profiles.phone.replace(/\D/g, '')}`, '_blank')}
                      >
                        WhatsApp
                      </Button>
                    </div>
                  ) : (
                    <div className="text-sm text-gray-500">
                      📞 Información de contacto no disponible
                    </div>
                  )}
                </div>
                <div className="flex items-center text-sm text-gray-500">
                  <Eye className="h-4 w-4 mr-1" />
                  {property.views_count} visualizaciones
                </div>
              </div>
            </div>
          </div>

          {/* Additional Info */}
          <div className="text-xs text-gray-500 border-t pt-4">
            Publicado el {new Date(property.created_at).toLocaleDateString('es-ES')}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PropertyDetailsModal;
