import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, Building, Eye, Heart, User, Edit, Trash2, Download, LogOut, RefreshCw } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
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

interface UserStats {
  totalProperties: number;
  publishedProperties: number;
  totalViews: number;
  pendingInquiries: number;
}

interface UserSubscription {
  plan_type: string;
  status: string;
  max_properties: number;
}

const Dashboard = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [properties, setProperties] = useState<UserProperty[]>([]);
  const [subscription, setSubscription] = useState<UserSubscription | null>(null);
  const [stats, setStats] = useState<UserStats>({
    totalProperties: 0,
    publishedProperties: 0,
    totalViews: 0,
    pendingInquiries: 0
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (!user) {
      navigate('/auth');
      return;
    }
    fetchUserData();
  }, [user, navigate]);

  const fetchUserData = async () => {
    if (!user) return;

    try {
      // Fetch user properties
      const { data: propertiesData, error: propertiesError } = await supabase
        .from('properties')
        .select(`
          *,
          property_images (image_url, is_main)
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (propertiesError) {
        console.error('Error fetching properties:', propertiesError);
        toast({
          title: "Error",
          description: "No se pudieron cargar las propiedades",
          variant: "destructive",
        });
      }

      // Fetch user subscription
      const { data: subscriptionData, error: subscriptionError } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', user.id)
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (subscriptionError) {
        console.error('Error fetching subscription:', subscriptionError);
      }

      if (propertiesData) {
        setProperties(propertiesData);
        
        // Calculate stats
        const totalViews = propertiesData.reduce((sum, prop) => sum + (prop.views_count || 0), 0);
        const publishedCount = propertiesData.filter(prop => prop.status === 'published').length;
        
        setStats({
          totalProperties: propertiesData.length,
          publishedProperties: publishedCount,
          totalViews,
          pendingInquiries: 0
        });
      }

      if (subscriptionData) {
        setSubscription(subscriptionData);
        console.log('Current subscription:', subscriptionData);
      } else {
        // Si no hay suscripción activa, usar plan básico
        setSubscription({
          plan_type: 'basic',
          status: 'active',
          max_properties: 1
        });
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
      toast({
        title: "Error",
        description: "Error al cargar los datos del usuario",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRefreshData = async () => {
    if (refreshing) return;
    
    setRefreshing(true);
    try {
      await fetchUserData();
      toast({
        title: "¡Actualizado!",
        description: "Los datos han sido actualizados correctamente",
      });
    } catch (error) {
      console.error('Error refreshing data:', error);
      toast({
        title: "Error",
        description: "No se pudieron actualizar los datos",
        variant: "destructive",
      });
    } finally {
      setRefreshing(false);
    }
  };

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
        .eq('user_id', user?.id);

      if (error) {
        throw error;
      }

      toast({
        title: "¡Éxito!",
        description: "Propiedad eliminada correctamente",
      });

      fetchUserData();
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
      'Imagen principal': property.property_images?.find(img => img.is_main)?.image_url || 'Sin imagen',
      'Total de imágenes': property.property_images?.length || 0
    }));

    const worksheet = XLSX.utils.json_to_sheet(excelData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Mis Propiedades');

    // Ajustar ancho de columnas
    const colWidths = [
      { wch: 30 }, // Título
      { wch: 15 }, // Precio
      { wch: 10 }, // Moneda
      { wch: 10 }, // Tipo
      { wch: 20 }, // Ciudad
      { wch: 20 }, // Estado
      { wch: 12 }, // Dormitorios
      { wch: 10 }, // Baños
      { wch: 15 }, // Superficie
      { wch: 18 }, // Estado publicación
      { wch: 10 }, // Vistas
      { wch: 15 }, // Fecha
      { wch: 40 }, // Imagen principal
      { wch: 15 }  // Total imágenes
    ];
    worksheet['!cols'] = colWidths;

    XLSX.writeFile(workbook, `mis-propiedades-${new Date().toISOString().split('T')[0]}.xlsx`);

    toast({
      title: "¡Éxito!",
      description: "Catálogo exportado correctamente",
    });
  };

  const handleLogout = async () => {
    try {
      await signOut();
      navigate('/');
      toast({
        title: "Sesión cerrada",
        description: "Has cerrado sesión correctamente",
      });
    } catch (error) {
      console.error('Error signing out:', error);
      toast({
        title: "Error",
        description: "No se pudo cerrar la sesión",
        variant: "destructive",
      });
    }
  };

  const canCreateProperty = () => {
    if (!subscription) return properties.length < 1; // Basic plan: 1 property
    return properties.length < (subscription.max_properties || 1);
  };

  const getPlanName = (planType: string) => {
    switch (planType) {
      case 'basic': return 'Básico (Gratis)';
      case 'plan_100': return 'Plan $100 MXN/mes';
      case 'plan_300': return 'Plan $300 MXN/mes';
      case 'plan_500': return 'Plan $500 MXN/mes';
      case 'plan_1000': return 'Plan Premium $1000 MXN/mes';
      case 'plan_3000': return 'Plan VIP $3000 MXN/mes';
      default: return 'Plan desconocido';
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 dark:bg-gray-900 min-h-screen">
        <div className="text-center">
          <p className="dark:text-white">Cargando panel de control...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8 dark:bg-gray-900 min-h-screen">
      <div className="mb-6 sm:mb-8 flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4">
        <div className="flex-1">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Panel de Control
          </h1>
          <p className="text-gray-600 dark:text-gray-300 text-sm sm:text-base">
            Gestiona tus propiedades y revisa las estadísticas
          </p>
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 mt-2">
            <p className="text-sm text-blue-600 dark:text-blue-400">
              Plan actual: {getPlanName(subscription?.plan_type || 'basic')}
            </p>
            <Button 
              onClick={handleRefreshData}
              disabled={refreshing}
              variant="outline"
              size="sm"
              className="flex items-center gap-2 self-start sm:self-auto"
            >
              <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
              {refreshing ? 'Actualizando...' : 'Actualizar'}
            </Button>
          </div>
        </div>
        <Button 
          onClick={handleLogout}
          variant="outline"
          className="text-red-600 border-red-300 hover:bg-red-50 dark:text-red-400 dark:border-red-600 dark:hover:bg-red-900/20 self-start sm:self-auto"
          size="sm"
        >
          <LogOut className="h-4 w-4 mr-2" />
          Cerrar Sesión
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-6 sm:mb-8">
        <Card className="dark:bg-gray-800 dark:border-gray-700">
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center">
              <Building className="h-6 w-6 sm:h-8 sm:w-8 text-blue-600 dark:text-blue-400" />
              <div className="ml-3 sm:ml-4">
                <p className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-300">Total Propiedades</p>
                <p className="text-lg sm:text-2xl font-bold text-gray-900 dark:text-white">
                  {stats.totalProperties}/{subscription?.max_properties || 1}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="dark:bg-gray-800 dark:border-gray-700">
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center">
              <Eye className="h-6 w-6 sm:h-8 sm:w-8 text-green-600 dark:text-green-400" />
              <div className="ml-3 sm:ml-4">
                <p className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-300">Publicadas</p>
                <p className="text-lg sm:text-2xl font-bold text-gray-900 dark:text-white">{stats.publishedProperties}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="dark:bg-gray-800 dark:border-gray-700">
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center">
              <Eye className="h-6 w-6 sm:h-8 sm:w-8 text-purple-600 dark:text-purple-400" />
              <div className="ml-3 sm:ml-4">
                <p className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-300">Total Vistas</p>
                <p className="text-lg sm:text-2xl font-bold text-gray-900 dark:text-white">{stats.totalViews}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="dark:bg-gray-800 dark:border-gray-700">
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center">
              <Heart className="h-6 w-6 sm:h-8 sm:w-8 text-red-600 dark:text-red-400" />
              <div className="ml-3 sm:ml-4">
                <p className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-300">Consultas</p>
                <p className="text-lg sm:text-2xl font-bold text-gray-900 dark:text-white">{stats.pendingInquiries}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Properties Section */}
      <Card className="dark:bg-gray-800 dark:border-gray-700">
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
            <CardTitle className="dark:text-white">Mis Propiedades</CardTitle>
            <div className="flex flex-col sm:flex-row gap-2">
              {subscription && ['plan_1000', 'plan_3000'].includes(subscription.plan_type) && (
                <Button onClick={exportToExcel} variant="outline" size="sm">
                  <Download className="h-4 w-4 mr-2" />
                  Exportar Excel
                </Button>
              )}
              {canCreateProperty() ? (
                <Button onClick={() => navigate('/properties/new')} size="sm">
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
              {canCreateProperty() && (
                <Button onClick={() => navigate('/properties/new')}>
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
                            
                            {/* Action buttons */}
                            <div className="flex flex-wrap gap-2 mt-3">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => navigate(`/properties/${property.id}/edit`)}
                              >
                                <Edit className="h-4 w-4 mr-1" />
                                Editar
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleDeleteProperty(property.id)}
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

      {/* Quick Actions */}
      <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
        <Card className="p-4 sm:p-6 text-center dark:bg-gray-800 dark:border-gray-700">
          <h3 className="font-semibold mb-2 dark:text-white">Actualizar Plan</h3>
          <p className="text-gray-600 dark:text-gray-300 text-sm mb-4">
            Mejora tu plan para más publicaciones y funciones
          </p>
          <Button onClick={() => navigate('/plans')} className="w-full" size="sm">
            Ver Planes
          </Button>
        </Card>

        <Card className="p-4 sm:p-6 text-center dark:bg-gray-800 dark:border-gray-700">
          <h3 className="font-semibold mb-2 dark:text-white">Soporte</h3>
          <p className="text-gray-600 dark:text-gray-300 text-sm mb-4">
            ¿Necesitas ayuda? Contacta con soporte
          </p>
          <Button 
            onClick={() => window.open('https://wa.me/5217717789580', '_blank')}
            className="w-full bg-green-600 hover:bg-green-700"
            size="sm"
          >
            WhatsApp
          </Button>
        </Card>

        <Card className="p-4 sm:p-6 text-center dark:bg-gray-800 dark:border-gray-700">
          <h3 className="font-semibold mb-2 dark:text-white">Ver Propiedades</h3>
          <p className="text-gray-600 dark:text-gray-300 text-sm mb-4">
            Explora todas las propiedades disponibles
          </p>
          <Button onClick={() => navigate('/properties')} variant="outline" className="w-full" size="sm">
            Explorar
          </Button>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;