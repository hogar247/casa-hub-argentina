
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Users, Home, Crown, Calendar, Settings, Plus, Clock, Edit } from 'lucide-react';
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

  const extendSubscription = async (subscriptionId: string, months: number) => {
    try {
      const subscription = subscriptions.find(s => s.id === subscriptionId);
      if (!subscription) return;

      const currentEndDate = new Date(subscription.ends_at);
      const newEndDate = new Date(currentEndDate);
      newEndDate.setMonth(newEndDate.getMonth() + months);

      await updateSubscription(subscriptionId, {
        ends_at: newEndDate.toISOString(),
        status: 'active'
      });
    } catch (error) {
      console.error('Error extending subscription:', error);
      toast({
        title: "Error",
        description: "No se pudo extender la suscripción",
        variant: "destructive",
      });
    }
  };

  const updatePlanBenefits = async (subscriptionId: string, planType: string) => {
    const planConfigs = {
      'basic': { maxProperties: 1, featuredProperties: 0 },
      'plan_100': { maxProperties: 2, featuredProperties: 0 },
      'plan_300': { maxProperties: 5, featuredProperties: 2 },
      'plan_500': { maxProperties: 10, featuredProperties: 5 },
      'plan_1000': { maxProperties: 30, featuredProperties: 15 },
      'plan_3000': { maxProperties: 100, featuredProperties: 50 },
    };

    const config = planConfigs[planType as keyof typeof planConfigs];
    if (!config) return;

    await updateSubscription(subscriptionId, {
      plan_type: planType,
      max_properties: config.maxProperties,
      featured_properties: config.featuredProperties
    });
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

  const extendPropertyFeatured = async (propertyId: string, days: number) => {
    try {
      const property = properties.find(p => p.id === propertyId);
      if (!property) return;

      const currentDate = property.featured_until ? new Date(property.featured_until) : new Date();
      const newDate = new Date(currentDate);
      newDate.setDate(newDate.getDate() + days);

      const { error } = await supabase
        .from('properties')
        .update({
          is_featured: true,
          featured_until: newDate.toISOString()
        })
        .eq('id', propertyId);

      if (error) throw error;

      toast({
        title: "Éxito",
        description: `Destacado extendido por ${days} días`,
      });

      fetchData();
    } catch (error) {
      console.error('Error extending featured property:', error);
      toast({
        title: "Error",
        description: "No se pudo extender el destacado",
        variant: "destructive",
      });
    }
  };

  const getPlanBadgeColor = (planType: string) => {
    switch (planType) {
      case 'basic': return 'bg-gray-500';
      case 'plan_100': return 'bg-blue-500';
      case 'plan_300': return 'bg-green-500';
      case 'plan_500': return 'bg-yellow-500';
      case 'plan_1000': return 'bg-purple-500';
      case 'plan_3000': return 'bg-gradient-to-r from-purple-500 to-pink-500';
      default: return 'bg-gray-500';
    }
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

  const isExpiringSoon = (endDate: string) => {
    const end = new Date(endDate);
    const now = new Date();
    const diffDays = Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    return diffDays <= 7;
  };

  const setCustomEndDate = async (subscriptionId: string, newEndDate: string) => {
    try {
      await updateSubscription(subscriptionId, {
        ends_at: new Date(newEndDate).toISOString(),
        status: 'active'
      });
    } catch (error) {
      console.error('Error setting custom end date:', error);
      toast({
        title: "Error",
        description: "No se pudo actualizar la fecha de expiración",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen dark:bg-gray-900">
        <div className="text-center">
          <Settings className="h-8 w-8 animate-spin mx-auto mb-4 dark:text-white" />
          <p className="dark:text-white">Verificando permisos...</p>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="flex items-center justify-center min-h-screen dark:bg-gray-900">
        <Card className="w-full max-w-md dark:bg-gray-800 dark:border-gray-700">
          <CardContent className="text-center p-6">
            <Crown className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2 dark:text-white">Acceso Denegado</h2>
            <p className="text-gray-600 dark:text-gray-300">No tienes permisos de administrador para acceder a este panel.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-2">Panel de Administración</h1>
          <p className="text-gray-600 dark:text-gray-300">Gestiona usuarios, suscripciones y propiedades destacadas</p>
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
          <Card className="dark:bg-gray-800 dark:border-gray-700">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 dark:text-white">
                <Users className="h-5 w-5" />
                Gestión Avanzada de Suscripciones
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {subscriptions.map((subscription) => (
                  <div key={subscription.id} className="border dark:border-gray-600 rounded-lg p-4 space-y-4">
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                      <div className="flex-1">
                        <h3 className="font-semibold text-lg dark:text-white">
                          {subscription.profiles?.company_name || 
                           `${subscription.profiles?.first_name || ''} ${subscription.profiles?.last_name || ''}`.trim() ||
                           'Usuario sin nombre'}
                        </h3>
                        <p className="text-sm text-gray-600 dark:text-gray-300">{subscription.profiles?.email}</p>
                        <div className="flex flex-wrap gap-2 mt-2">
                          <Badge className={getPlanBadgeColor(subscription.plan_type)}>
                            {getPlanName(subscription.plan_type)}
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
                      <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded">
                        <span className="font-medium dark:text-white">Propiedades:</span>
                        <p className="text-lg font-bold dark:text-white">{subscription.property_count}/{subscription.max_properties}</p>
                      </div>
                      <div className="bg-yellow-50 dark:bg-yellow-900/20 p-3 rounded">
                        <span className="font-medium dark:text-white">Destacadas:</span>
                        <p className="text-lg font-bold dark:text-white">{subscription.featured_properties}</p>
                      </div>
                      <div className="bg-green-50 dark:bg-green-900/20 p-3 rounded">
                        <span className="font-medium dark:text-white">Inicia:</span>
                        <p className="dark:text-white">{subscription.starts_at ? format(new Date(subscription.starts_at), 'dd/MM/yyyy', { locale: es }) : 'N/A'}</p>
                      </div>
                      <div className="bg-red-50 dark:bg-red-900/20 p-3 rounded">
                        <span className="font-medium dark:text-white">Expira:</span>
                        <p className={`${isExpiringSoon(subscription.ends_at) ? 'text-red-600 font-semibold' : 'dark:text-white'}`}>
                          {subscription.ends_at ? format(new Date(subscription.ends_at), 'dd/MM/yyyy', { locale: es }) : 'N/A'}
                        </p>
                      </div>
                    </div>

                    {/* Controles de Plan */}
                    <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg space-y-4">
                      <h4 className="font-semibold dark:text-white">Gestión de Plan</h4>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium mb-2 dark:text-white">Cambiar Plan</label>
                          <Select
                            value={subscription.plan_type}
                            onValueChange={(value) => updatePlanBenefits(subscription.id, value)}
                          >
                            <SelectTrigger className="dark:bg-gray-600 dark:border-gray-500">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="dark:bg-gray-800">
                              <SelectItem value="basic">Básico (Gratis)</SelectItem>
                              <SelectItem value="plan_100">Plan $100 MXN/mes</SelectItem>
                              <SelectItem value="plan_300">Plan $300 MXN/mes</SelectItem>
                              <SelectItem value="plan_500">Plan $500 MXN/mes</SelectItem>
                              <SelectItem value="plan_1000">Plan Premium $1000 MXN/mes</SelectItem>
                              <SelectItem value="plan_3000">Plan VIP $3000 MXN/mes</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div>
                          <label className="block text-sm font-medium mb-2 dark:text-white">Estado</label>
                          <Select
                            value={subscription.status}
                            onValueChange={(value) => updateSubscription(subscription.id, { status: value })}
                          >
                            <SelectTrigger className="dark:bg-gray-600 dark:border-gray-500">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="dark:bg-gray-800">
                              <SelectItem value="active">Activo</SelectItem>
                              <SelectItem value="inactive">Inactivo</SelectItem>
                              <SelectItem value="expired">Expirado</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      {/* Fecha de expiración personalizada */}
                      <div>
                        <label className="block text-sm font-medium mb-2 dark:text-white">Fecha de Expiración</label>
                        <div className="flex gap-2">
                          <Input
                            type="datetime-local"
                            defaultValue={subscription.ends_at ? format(new Date(subscription.ends_at), "yyyy-MM-dd'T'HH:mm") : ''}
                            onChange={(e) => {
                              if (e.target.value) {
                                setCustomEndDate(subscription.id, e.target.value);
                              }
                            }}
                            className="dark:bg-gray-600 dark:border-gray-500"
                          />
                        </div>
                      </div>

                      {/* Controles de Duración */}
                      <div>
                        <label className="block text-sm font-medium mb-2 dark:text-white">Extender Suscripción</label>
                        <div className="flex flex-wrap gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => extendSubscription(subscription.id, 1)}
                            className="flex items-center gap-1"
                          >
                            <Plus className="h-3 w-3" />
                            1 mes
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => extendSubscription(subscription.id, 3)}
                            className="flex items-center gap-1"
                          >
                            <Plus className="h-3 w-3" />
                            3 meses
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => extendSubscription(subscription.id, 6)}
                            className="flex items-center gap-1"
                          >
                            <Plus className="h-3 w-3" />
                            6 meses
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => extendSubscription(subscription.id, 12)}
                            className="flex items-center gap-1"
                          >
                            <Plus className="h-3 w-3" />
                            1 año
                          </Button>
                        </div>
                      </div>

                      {/* Controles de Límites de Propiedades */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium mb-2 dark:text-white">Límite de Propiedades</label>
                          <Input
                            type="number"
                            min="1"
                            max="1000"
                            value={subscription.max_properties}
                            onChange={(e) => updateSubscription(subscription.id, { max_properties: parseInt(e.target.value) })}
                            className="dark:bg-gray-600 dark:border-gray-500"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium mb-2 dark:text-white">Propiedades Destacadas</label>
                          <Input
                            type="number"
                            min="0"
                            max="100"
                            value={subscription.featured_properties}
                            onChange={(e) => updateSubscription(subscription.id, { featured_properties: parseInt(e.target.value) })}
                            className="dark:bg-gray-600 dark:border-gray-500"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {activeTab === 'properties' && (
          <Card className="dark:bg-gray-800 dark:border-gray-700">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 dark:text-white">
                <Home className="h-5 w-5" />
                Gestión Avanzada de Propiedades Destacadas
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {properties.map((property) => (
                  <div key={property.id} className="border dark:border-gray-600 rounded-lg p-4">
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                      <div className="flex-1">
                        <h3 className="font-semibold text-lg dark:text-white">{property.title}</h3>
                        <p className="text-sm text-gray-600 dark:text-gray-300">
                          {property.profiles?.first_name} {property.profiles?.last_name} - {property.profiles?.email}
                        </p>
                        {property.is_featured && property.featured_until && (
                          <p className="text-xs text-orange-600 dark:text-orange-400 mt-1">
                            Destacado hasta: {format(new Date(property.featured_until), 'dd/MM/yyyy HH:mm', { locale: es })}
                          </p>
                        )}
                      </div>
                      
                      <div className="flex flex-col gap-2">
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
                          >
                            {property.is_featured ? 'Quitar destacado' : 'Destacar'}
                          </Button>
                        </div>
                        
                        {/* Controles de duración del destacado */}
                        {property.is_featured && (
                          <div className="flex flex-wrap gap-1">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => extendPropertyFeatured(property.id, 7)}
                              className="flex items-center gap-1 text-xs"
                            >
                              <Clock className="h-3 w-3" />
                              +7d
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => extendPropertyFeatured(property.id, 15)}
                              className="flex items-center gap-1 text-xs"
                            >
                              <Clock className="h-3 w-3" />
                              +15d
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => extendPropertyFeatured(property.id, 30)}
                              className="flex items-center gap-1 text-xs"
                            >
                              <Clock className="h-3 w-3" />
                              +30d
                            </Button>
                          </div>
                        )}
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
