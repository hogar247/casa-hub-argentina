
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, Building, Eye, Heart, User, Edit, Trash2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

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
  created_at: string;
}

interface UserStats {
  totalProperties: number;
  publishedProperties: number;
  totalViews: number;
  pendingInquiries: number;
}

const Dashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [properties, setProperties] = useState<UserProperty[]>([]);
  const [stats, setStats] = useState<UserStats>({
    totalProperties: 0,
    publishedProperties: 0,
    totalViews: 0,
    pendingInquiries: 0
  });
  const [loading, setLoading] = useState(true);

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
      const { data: propertiesData } = await supabase
        .from('properties')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (propertiesData) {
        setProperties(propertiesData);
        
        // Calculate stats
        const totalViews = propertiesData.reduce((sum, prop) => sum + (prop.views_count || 0), 0);
        const publishedCount = propertiesData.filter(prop => prop.status === 'published').length;
        
        setStats({
          totalProperties: propertiesData.length,
          publishedProperties: publishedCount,
          totalViews,
          pendingInquiries: 0 // This would need a separate query
        });
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = (price: number, currency: string) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: currency === 'ARS' ? 'ARS' : currency === 'USD' ? 'USD' : 'MXN',
    }).format(price);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'published': return 'text-green-600 bg-green-100';
      case 'draft': return 'text-yellow-600 bg-yellow-100';
      case 'sold': return 'text-blue-600 bg-blue-100';
      case 'suspended': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
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

      // Refresh the properties list
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

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center">
          <p>Cargando panel de control...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Panel de Control
        </h1>
        <p className="text-gray-600">
          Gestiona tus propiedades y revisa las estadísticas
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Building className="h-8 w-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Propiedades</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalProperties}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Eye className="h-8 w-8 text-green-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Publicadas</p>
                <p className="text-2xl font-bold text-gray-900">{stats.publishedProperties}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Eye className="h-8 w-8 text-purple-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Vistas</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalViews}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Heart className="h-8 w-8 text-red-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Consultas</p>
                <p className="text-2xl font-bold text-gray-900">{stats.pendingInquiries}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Properties Section */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Mis Propiedades</CardTitle>
            <Button onClick={() => navigate('/properties/new')}>
              <Plus className="h-4 w-4 mr-2" />
              Nueva Propiedad
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {properties.length === 0 ? (
            <div className="text-center py-8">
              <Building className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No tienes propiedades aún
              </h3>
              <p className="text-gray-600 mb-4">
                Comienza publicando tu primera propiedad
              </p>
              <Button onClick={() => navigate('/properties/new')}>
                <Plus className="h-4 w-4 mr-2" />
                Publicar Propiedad
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {properties.map((property) => (
                <div 
                  key={property.id} 
                  className="border rounded-lg p-4 hover:shadow-md transition-shadow"
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg mb-2">{property.title}</h3>
                      <p className="text-sm text-gray-600 mb-2">
                        {property.city}, {property.province}
                      </p>
                      <p className="text-lg font-bold text-blue-600">
                        {formatPrice(property.price, property.currency)}
                      </p>
                    </div>
                    <div className="text-right">
                      <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(property.status)}`}>
                        {getStatusText(property.status)}
                      </span>
                      <p className="text-sm text-gray-600 mt-2">
                        {property.views_count} vistas
                      </p>
                      
                      {/* Action buttons */}
                      <div className="flex gap-2 mt-3">
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
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4 mr-1" />
                          Eliminar
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Dashboard;
