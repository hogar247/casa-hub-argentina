
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Users, Home, Crown, Calendar, Settings } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface UserSubscription {
  id: string;
  user_id: string;
  plan_type: string;
  status: string;
  max_properties: number;
  featured_properties: number;
  starts_at: string;
  ends_at: string;
  profiles: {
    first_name: string;
    last_name: string;
    email: string;
    company_name: string;
  };
  property_count?: number;
}

interface Property {
  id: string;
  title: string;
  is_featured: boolean;
  featured_until: string;
  status: string;
  profiles: {
    first_name: string;
    last_name: string;
    email: string;
  };
}

const AdminDashboard = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isAdmin, setIsAdmin] = useState(false);
  const [subscriptions, setSubscriptions] = useState<UserSubscription[]>([]);
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('subscriptions');

  useEffect(() => {
    checkAdminStatus();
  }, [user]);

  useEffect(() => {
    if (isAdmin) {
      fetchData();
    }
  }, [isAdmin]);

  const checkAdminStatus = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('admin_users')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (data && !error) {
        setIsAdmin(true);
      } else {
        setIsAdmin(false);
      }
    } catch (error) {
      console.error('Error checking admin status:', error);
      setIsAdmin(false);
    } finally {
      setLoading(false);
    }
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      // Obtener suscripciones con información del usuario
      const { data: subsData, error: subsError } = await supabase
        .from('subscriptions')
        .select(`
          *,
          profiles (first_name, last_name, email, company_name)
        `)
        .order('created_at', { ascending: false });

      if (subsError) throw subsError;

      // Contar propiedades por usuario
      const userPropertyCounts = new Map();
      for (const sub of subsData || []) {
        const { count } = await supabase
          .from('properties')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', sub.user_id);
        userPropertyCounts.set(sub.user_id, count || 0);
      }

      const subsWithCounts = (subsData || []).map(sub => ({
        ...sub,
        property_count: userPropertyCounts.get(sub.user_id) || 0
      }));

      setSubscriptions(subsWithCounts);

      // Obtener propiedades para gestión de destacados
      const { data: propsData, error: propsError } = await supabase
        .from('properties')
        .select(`
          id, title, is_featured, featured_until, status,
          profiles (first_name, last_name, email)
        `)
        .eq('status', 'published')
        .order('created_at', { ascending: false });

      if (propsError) throw propsError;
      setProperties(propsData || []);

    } catch (error) {
      console.error('Error fetching data:', error);
      toast({
        title: "Error",
        description: "No se pudieron cargar los datos",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const updateSubscription = async (subscriptionId: string, updates: any) => {
    try {
      const { error } = await supabase
        .from('subscriptions')
        .update(updates)
        .eq('id', subscriptionId);

      if (error) throw error;

      toast({
        title: "Éxito",
        description: "Suscripción actualizada correctamente",
      });

      fetchData();
    } catch (error) {
      console.error('Error updating subscription:', error);
      toast({
        title: "Error",
        description: "No se pudo actualizar la suscripción",
        variant: "destructive",
      });
    }
  };

  const togglePropertyFeatured = async (propertyId: string, isFeatured: boolean) => {
    try {
      const updates: any = {
        is_featured: !isFeatured
      };

      if (!isFeatured) {
        // Si se está destacando, agregar 30 días
        updates.featured_until = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
      } else {
        // Si se está quitando el destacado, limpiar la fecha
        updates.featured_until = null;
      }

      const { error } = await supabase
        .from('properties')
        .update(updates)
        .eq('id', propertyId);

      if (error) throw error;

      toast({
        title: "Éxito",
        description: `Propiedad ${!isFeatured ? 'destacada' : 'no destacada'} correctamente`,
      });

      fetchData();
    } catch (error) {
      console.error('Error updating property:', error);
      toast({
        title: "Error",
        description: "No se pudo actualizar la propiedad",
        variant: "destructive",
      });
    }
  };

  const getPlanBadgeColor = (planType: string) => {
    switch (planType) {
      case 'basico': return 'bg-gray-500';
      case 'premium': return 'bg-blue-500';
      case 'avanzado': return 'bg-green-500';
      case 'profesional': return 'bg-yellow-500';
      case 'empresarial': return 'bg-purple-500';
      default: return 'bg-gray-500';
    }
  };

  const isExpiringSoon = (endDate: string) => {
    const end = new Date(endDate);
    const now = new Date();
    const diffDays = Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    return diffDays <= 7;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Settings className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p>Verificando permisos...</p>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="w-full max-w-md">
          <CardContent className="text-center p-6">
            <Crown className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Acceso Denegado</h2>
            <p className="text-gray-600">No tienes permisos de administrador para acceder a este panel.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">Panel de Administración</h1>
          <p className="text-gray-600">Gestiona usuarios, suscripciones y propiedades destacadas</p>
        </div>

        {/* Tabs para móvil */}
        <div className="flex flex-wrap gap-2 mb-6">
          <Button
            variant={activeTab === 'subscriptions' ? 'default' : 'outline'}
            onClick={() => setActiveTab('subscriptions')}
            className="flex items-center gap-2 text-sm"
          >
            <Users className="h-4 w-4" />
            <span className="hidden sm:inline">Suscripciones</span>
          </Button>
          <Button
            variant={activeTab === 'properties' ? 'default' : 'outline'}
            onClick={() => setActiveTab('properties')}
            className="flex items-center gap-2 text-sm"
          >
            <Home className="h-4 w-4" />
            <span className="hidden sm:inline">Propiedades</span>
          </Button>
        </div>

        {activeTab === 'subscriptions' && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Gestión de Suscripciones
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {subscriptions.map((subscription) => (
                  <div key={subscription.id} className="border rounded-lg p-4 space-y-3">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div>
                        <h3 className="font-semibold">
                          {subscription.profiles?.company_name || 
                           `${subscription.profiles?.first_name || ''} ${subscription.profiles?.last_name || ''}`.trim() ||
                           'Usuario sin nombre'}
                        </h3>
                        <p className="text-sm text-gray-600">{subscription.profiles?.email}</p>
                        <div className="flex flex-wrap gap-2 mt-2">
                          <Badge className={getPlanBadgeColor(subscription.plan_type)}>
                            {subscription.plan_type.toUpperCase()}
                          </Badge>
                          <Badge variant={subscription.status === 'active' ? 'default' : 'secondary'}>
                            {subscription.status}
                          </Badge>
                          {subscription.ends_at && isExpiringSoon(subscription.ends_at) && (
                            <Badge variant="destructive" className="animate-pulse">
                              ⚠️ Expira pronto
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-sm">
                      <div>
                        <span className="font-medium">Propiedades:</span>
                        <p>{subscription.property_count}/{subscription.max_properties}</p>
                      </div>
                      <div>
                        <span className="font-medium">Destacadas:</span>
                        <p>{subscription.featured_properties}</p>
                      </div>
                      <div>
                        <span className="font-medium">Inicia:</span>
                        <p>{subscription.starts_at ? format(new Date(subscription.starts_at), 'dd/MM/yyyy', { locale: es }) : 'N/A'}</p>
                      </div>
                      <div>
                        <span className="font-medium">Expira:</span>
                        <p className={isExpiringSoon(subscription.ends_at) ? 'text-red-600 font-semibold' : ''}>
                          {subscription.ends_at ? format(new Date(subscription.ends_at), 'dd/MM/yyyy', { locale: es }) : 'N/A'}
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-3">
                      <Select
                        value={subscription.plan_type}
                        onValueChange={(value) => updateSubscription(subscription.id, { plan_type: value })}
                      >
                        <SelectTrigger className="w-full sm:w-40">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="basico">Básico</SelectItem>
                          <SelectItem value="premium">Premium</SelectItem>
                          <SelectItem value="avanzado">Avanzado</SelectItem>
                          <SelectItem value="profesional">Profesional</SelectItem>
                          <SelectItem value="empresarial">Empresarial</SelectItem>
                        </SelectContent>
                      </Select>

                      <Select
                        value={subscription.status}
                        onValueChange={(value) => updateSubscription(subscription.id, { status: value })}
                      >
                        <SelectTrigger className="w-full sm:w-32">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="active">Activo</SelectItem>
                          <SelectItem value="inactive">Inactivo</SelectItem>
                          <SelectItem value="expired">Expirado</SelectItem>
                        </SelectContent>
                      </Select>

                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          const newEndDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
                          updateSubscription(subscription.id, { ends_at: newEndDate });
                        }}
                        className="w-full sm:w-auto"
                      >
                        <Calendar className="h-4 w-4 mr-2" />
                        +30 días
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {activeTab === 'properties' && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Home className="h-5 w-5" />
                Gestión de Propiedades Destacadas
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {properties.map((property) => (
                  <div key={property.id} className="border rounded-lg p-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="flex-1">
                        <h3 className="font-semibold">{property.title}</h3>
                        <p className="text-sm text-gray-600">
                          {property.profiles?.first_name} {property.profiles?.last_name} - {property.profiles?.email}
                        </p>
                        {property.is_featured && property.featured_until && (
                          <p className="text-xs text-orange-600 mt-1">
                            Destacado hasta: {format(new Date(property.featured_until), 'dd/MM/yyyy HH:mm', { locale: es })}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        {property.is_featured && (
                          <Badge className="bg-yellow-500">
                            ⭐ Destacado
                          </Badge>
                        )}
                        <Button
                          variant={property.is_featured ? "destructive" : "default"}
                          size="sm"
                          onClick={() => togglePropertyFeatured(property.id, property.is_featured)}
                          className="w-full sm:w-auto"
                        >
                          {property.is_featured ? 'Quitar destacado' : 'Destacar'}
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;
