
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, Building, Edit, Trash2, Download } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import * as XLSX from 'xlsx';

interface UserProperty {
  id: string;
  title: string;
  price: number;
  currency: string;
  operation_type: string;
  status: string;
  views_count: number;
  city: string;
  province: string;
  bedrooms: number;
  bathrooms: number;
  surface_total: number;
  created_at: string;
  property_images: Array<{ image_url: string; is_main: boolean }>;
}

interface UserSubscription {
  plan_type: string;
  status: string;
  max_properties: number;
}

interface UserPropertiesListProps {
  properties: UserProperty[];
  subscription: UserSubscription | null;
  userId?: string;
  onRefresh: () => void;
}

const UserPropertiesList: React.FC<UserPropertiesListProps> = ({ 
  properties, 
  subscription, 
  userId,
  onRefresh 
}) => {
  const navigate = useNavigate();
  const { toast } = useToast();

  const formatPrice = (price: number, currency: string) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: currency === 'USD' ? 'USD' : 'MXN',
    }).format(price);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'published': return 'text-green-600 bg-green-100 dark:text-green-400 dark:bg-green-900/20';
      case 'draft': return 'text-yellow-600 bg-yellow-100 dark:text-yellow-400 dark:bg-yellow-900/20';
      case 'sold': return 'text-blue-600 bg-blue-100 dark:text-blue-400 dark:bg-blue-900/20';
      case 'suspended': return 'text-red-600 bg-red-100 dark:text-red-400 dark:bg-red-900/20';
      default: return 'text-gray-600 bg-gray-100 dark:text-gray-400 dark:bg-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'published': return 'Publicada';
      case 'draft': return 'Borrador';
      case 'sold': return 'Vendida';
      case 'suspended': return 'Suspendida';
      default: return status;
    }
  };

  const handleDeleteProperty = async (propertyId: string) => {
    if (!confirm('¿Estás seguro de que quieres eliminar esta propiedad?')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('properties')
        .delete()
        .eq('id', propertyId)
        .eq('user_id', userId);

      if (error) {
        throw error;
      }

      toast({
        title: "¡Éxito!",
        description: "Propiedad eliminada correctamente",
      });

      onRefresh();
    } catch (error) {
      console.error('Error deleting property:', error);
      toast({
        title: "Error",
        description: "No se pudo eliminar la propiedad",
        variant: "destructive",
      });
    }
  };

  const exportToExcel = () => {
    const activeSub = subscription;
    const canExport = activeSub && ['plan_1000', 'plan_3000'].includes(activeSub.plan_type);

    if (!canExport) {
      toast({
        title: "Función Premium",
        description: "La exportación está disponible para usuarios Premium ($1000+)",
        variant: "destructive",
      });
      return;
    }

    const excelData = properties.map(property => ({
      'Título': property.title,
      'Precio': property.price,
      'Moneda': property.currency,
      'Tipo': property.operation_type === 'sale' ? 'Venta' : 'Alquiler',
      'Ciudad': property.city,
      'Estado': property.province,
      'Dormitorios': property.bedrooms,
      'Baños': property.bathrooms,
      'Superficie (m²)': property.surface_total,
      'Estado de publicación': getStatusText(property.status),
      'Vistas': property.views_count,
      'Fecha de creación': new Date(property.created_at).toLocaleDateString('es-MX'),
    }));

    const worksheet = XLSX.utils.json_to_sheet(excelData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Mis Propiedades');

    XLSX.writeFile(workbook, `mis-propiedades-${new Date().toISOString().split('T')[0]}.xlsx`);

    toast({
      title: "¡Éxito!",
      description: "Catálogo exportado correctamente",
    });
  };

  const canCreateProperty = () => {
    if (!subscription) {
      console.log("UserPropertiesList: canCreateProperty - Subscription is null. Properties count:", properties.length);
      return properties.length < 1;
    }
    const allowed = properties.length < (subscription.max_properties || 0);
    console.log("UserPropertiesList: canCreateProperty - Properties count:", properties.length, "Max properties:", subscription.max_properties, "Allowed:", allowed);
    return allowed;
  };

  const currentCanCreate = canCreateProperty();

  return (
    <Card className="dark:bg-gray-800 dark:border-gray-700">
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
          <CardTitle className="dark:text-white">Mis Propiedades</CardTitle>
          <div className="flex flex-col sm:flex-row gap-2">
            {subscription && ['plan_1000', 'plan_3000'].includes(subscription.plan_type) && (
              <Button onClick={() => { console.log("UserPropertiesList: Export Excel button clicked."); exportToExcel(); }} variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Exportar Excel
              </Button>
            )}
            {currentCanCreate ? (
              <Button onClick={() => { console.log("UserPropertiesList: Nueva Propiedad button clicked."); navigate('/properties/new'); }} size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Nueva Propiedad
              </Button>
            ) : (
              <div className="text-center">
                <Button disabled size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Límite Alcanzado
                </Button>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  <a href="/plans" className="text-blue-600 dark:text-blue-400 hover:underline">
                    Actualiza tu plan
                  </a>
                </p>
              </div>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {properties.length === 0 ? (
          <div className="text-center py-8">
            <Building className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              No tienes propiedades aún
            </h3>
            <p className="text-gray-600 dark:text-gray-300 mb-4">
              Comienza publicando tu primera propiedad
            </p>
            {currentCanCreate && (
              <Button onClick={() => { console.log("UserPropertiesList: Publicar Propiedad (empty state) button clicked."); navigate('/properties/new'); }}>
                <Plus className="h-4 w-4 mr-2" />
                Publicar Propiedad
              </Button>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {properties.map((property) => {
              const mainImage = property.property_images?.find(img => img.is_main)?.image_url 
                || property.property_images?.[0]?.image_url;

              return (
                <div 
                  key={property.id} 
                  className="border dark:border-gray-600 rounded-lg p-4 hover:shadow-md transition-shadow"
                >
                  <div className="flex flex-col sm:flex-row gap-4">
                    {mainImage && (
                      <div className="w-full sm:w-24 h-24 flex-shrink-0">
                        <img 
                          src={mainImage} 
                          alt={property.title}
                          className="w-full h-full object-cover rounded"
                          onError={e => {
                            (e.currentTarget as HTMLImageElement).src = "/placeholder.svg";
                          }}
                        />
                      </div>
                    )}
                    <div className="flex-1">
                      <div className="flex flex-col lg:flex-row lg:justify-between lg:items-start gap-4">
                        <div className="flex-1">
                          <h3 className="font-semibold text-base sm:text-lg mb-2 dark:text-white">{property.title}</h3>
                          <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">
                            {property.city}, {property.province}
                          </p>
                          <p className="text-lg font-bold text-blue-600 dark:text-blue-400 mb-2">
                            {formatPrice(property.price, property.currency)}
                          </p>
                          <div className="flex flex-wrap gap-2 sm:gap-4 text-sm text-gray-600 dark:text-gray-300">
                            <span>{property.bedrooms} hab.</span>
                            <span>{property.bathrooms} baños</span>
                            <span>{property.surface_total} m²</span>
                          </div>
                        </div>
                        <div className="text-left lg:text-right">
                          <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(property.status)}`}>
                            {getStatusText(property.status)}
                          </span>
                          <p className="text-sm text-gray-600 dark:text-gray-300 mt-2">
                            {property.views_count || 0} vistas
                          </p>
                          
                          <div className="flex flex-wrap gap-2 mt-3">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => { console.log(`UserPropertiesList: Edit property ${property.id} button clicked.`); navigate(`/properties/${property.id}/edit`); }}
                            >
                              <Edit className="h-4 w-4 mr-1" />
                              Editar
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => { console.log(`UserPropertiesList: Delete property ${property.id} button clicked.`); handleDeleteProperty(property.id); }}
                              className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20"
                            >
                              <Trash2 className="h-4 w-4 mr-1" />
                              Eliminar
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default UserPropertiesList;
