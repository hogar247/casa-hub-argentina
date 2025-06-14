
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Check, Star, Crown, Zap, Building, RefreshCw } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import MercadoPagoButton from '@/components/MercadoPagoButton';

interface Plan {
  id: string;
  name: string;
  price: number;
  description: string;
  features: string[];
  maxProperties: number;
  maxPhotos: number;
  externalLinks: string;
  frame: string;
  highlighted?: boolean;
  icon?: React.ReactNode;
}

const SubscriptionPlans = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [currentPlan, setCurrentPlan] = useState<string>('basic');
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const plans: Plan[] = [
    {
      id: 'basic',
      name: 'Básico',
      price: 0,
      description: 'Gratuito',
      features: [
        '1 publicación',
        'Máximo 5 fotos',
        'Sin enlaces externos',
        'Sin marco'
      ],
      maxProperties: 1,
      maxPhotos: 5,
      externalLinks: 'No',
      frame: 'Sin marco',
      icon: <Building className="h-6 w-6" />
    },
    {
      id: 'plan_100',
      name: '100 MXN/mes',
      price: 100,
      description: '100 MXN/mes',
      features: [
        '2 publicaciones',
        'Máximo 10 fotos',
        'Sin enlaces externos',
        'Sin marco'
      ],
      maxProperties: 2,
      maxPhotos: 10,
      externalLinks: 'No',
      frame: 'Sin marco',
      icon: <Star className="h-6 w-6" />
    },
    {
      id: 'plan_300',
      name: '300 MXN/mes',
      price: 300,
      description: '300 MXN/mes',
      features: [
        '5 publicaciones',
        'Máximo 12 fotos',
        '1 enlace a Facebook',
        'Sin marco',
        'Mostrar teléfono'
      ],
      maxProperties: 5,
      maxPhotos: 12,
      externalLinks: '1 enlace a Facebook',
      frame: 'Sin marco',
      icon: <Star className="h-6 w-6" />
    },
    {
      id: 'plan_500',
      name: '500 MXN/mes',
      price: 500,
      description: '500 MXN/mes',
      features: [
        '10 publicaciones',
        'Máximo 15 fotos',
        '1 enlace a Facebook',
        'Sin marco'
      ],
      maxProperties: 10,
      maxPhotos: 15,
      externalLinks: '1 enlace a Facebook',
      frame: 'Sin marco',
      highlighted: true,
      icon: <Star className="h-6 w-6 text-yellow-500" />
    },
    {
      id: 'plan_1000',
      name: '1000 MXN/mes',
      price: 1000,
      description: '1000 MXN/mes',
      features: [
        '30 publicaciones',
        'Máximo 30 fotos',
        'Enlaces a Facebook + nombre personalizado',
        'Marco sólido dorado',
        'Compartir propiedades'
      ],
      maxProperties: 30,
      maxPhotos: 30,
      externalLinks: '1 enlace a Facebook, nombre personalizado',
      frame: 'Marco sólido dorado',
      icon: <Crown className="h-6 w-6 text-yellow-600" />
    },
    {
      id: 'plan_3000',
      name: '3000 MXN/mes',
      price: 3000,
      description: '3000 MXN/mes',
      features: [
        '100 publicaciones',
        'Máximo 30 fotos',
        'Todos los enlaces + nombre personalizado',
        'Marcos animados premium',
        'Página de perfil exclusiva',
        'Compartir propiedades',
        'Soporte prioritario'
      ],
      maxProperties: 100,
      maxPhotos: 30,
      externalLinks: 'Todos los enlaces, nombre personalizado',
      frame: 'Marcos animados (fuego, hielo, hierbas)',
      highlighted: true,
      icon: <Zap className="h-6 w-6 text-purple-600" />
    }
  ];

  useEffect(() => {
    if (user) {
      fetchCurrentPlan();
    }
    
    // Verificar parámetros de URL para manejar retorno de Mercado Pago
    const urlParams = new URLSearchParams(window.location.search);
    const success = urlParams.get('success');
    const failure = urlParams.get('failure');
    const pending = urlParams.get('pending');

    if (success === 'true') {
      toast({
        title: "¡Pago exitoso!",
        description: "Tu suscripción se está procesando. El plan se actualizará en unos momentos.",
      });
      
      // Refrescar el plan después de un breve delay para dar tiempo al webhook
      setTimeout(() => {
        if (user) {
          fetchCurrentPlan();
        }
      }, 3000);
      
      // Limpiar parámetros de URL
      window.history.replaceState({}, document.title, window.location.pathname);
    } else if (failure === 'true') {
      toast({
        title: "Pago cancelado",
        description: "El pago fue cancelado. Puedes intentar nuevamente.",
        variant: "destructive",
      });
      window.history.replaceState({}, document.title, window.location.pathname);
    } else if (pending === 'true') {
      toast({
        title: "Pago pendiente",
        description: "Tu pago está siendo procesado. Te notificaremos cuando esté confirmado.",
      });
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, [user, toast]);

  const fetchCurrentPlan = async () => {
    if (!user) return;

    setLoading(true);
    try {
      console.log('Fetching subscription for user:', user.id);
      
      const { data, error } = await supabase
        .from('subscriptions')
        .select('plan_type')
        .eq('user_id', user.id)
        .eq('status', 'active')
        .maybeSingle();

      if (error) {
        console.error('Error fetching subscription:', error);
        // No mostrar error al usuario, usar plan básico por defecto
        setCurrentPlan('basic');
        return;
      }

      if (data) {
        setCurrentPlan(data.plan_type);
        console.log('Current plan updated:', data.plan_type);
      } else {
        console.log('No active subscription found, using basic plan');
        setCurrentPlan('basic');
      }
    } catch (error) {
      console.error('Error fetching current plan:', error);
      setCurrentPlan('basic');
    } finally {
      setLoading(false);
    }
  };

  const handleSuccess = () => {
    toast({
      title: "Procesando pago...",
      description: "Tu suscripción se actualizará una vez confirmado el pago.",
    });
    
    // Refrescar el plan después de un delay
    setTimeout(() => {
      if (user) {
        fetchCurrentPlan();
      }
    }, 5000);
  };

  const handleRefreshPlan = async () => {
    if (!user) {
      toast({
        title: "Error",
        description: "Debes iniciar sesión para actualizar tu plan.",
        variant: "destructive",
      });
      return;
    }

    setRefreshing(true);
    try {
      await fetchCurrentPlan();
      toast({
        title: "Plan actualizado",
        description: "Se ha verificado el estado de tu suscripción.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo actualizar el estado del plan.",
        variant: "destructive",
      });
    } finally {
      setRefreshing(false);
    }
  };

  if (!user) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Planes de Suscripción
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            Debes iniciar sesión para ver y gestionar tus planes
          </p>
          <Button onClick={() => window.location.href = '/auth'}>
            Iniciar Sesión
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          Planes de Suscripción
        </h1>
        <p className="text-xl text-gray-600">
          Elige el plan perfecto para tus necesidades inmobiliarias
        </p>
        <div className="mt-4 p-4 bg-blue-50 rounded-lg">
          <p className="text-sm text-blue-800">
            💳 <strong>Integración con Mercado Pago:</strong> Pagos seguros con tarjetas de crédito, débito y más opciones
          </p>
        </div>
        
        {/* Botón para refrescar el estado del plan */}
        <div className="mt-4">
          <Button 
            onClick={handleRefreshPlan}
            disabled={loading || refreshing}
            variant="outline"
            size="sm"
            className="flex items-center gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${(loading || refreshing) ? 'animate-spin' : ''}`} />
            {loading || refreshing ? 'Actualizando...' : 'Actualizar Estado del Plan'}
          </Button>
        </div>

        {/* Mostrar plan actual */}
        {!loading && (
          <div className="mt-4 p-3 bg-green-50 rounded-lg">
            <p className="text-sm text-green-800">
              <strong>Plan actual:</strong> {plans.find(p => p.id === currentPlan)?.name || 'Básico'}
            </p>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {plans.map((plan) => (
          <Card 
            key={plan.id} 
            className={`relative overflow-hidden transition-all duration-300 hover:shadow-xl ${
              plan.highlighted ? 'ring-2 ring-blue-500 scale-105' : ''
            } ${currentPlan === plan.id ? 'border-green-500 border-2' : ''}`}
          >
            {plan.highlighted && (
              <div className="absolute top-0 right-0 bg-blue-500 text-white px-3 py-1 text-sm font-semibold rounded-bl-lg">
                Popular
              </div>
            )}
            
            <CardHeader className="text-center pb-4">
              <div className="flex justify-center mb-4">
                {plan.icon}
              </div>
              <CardTitle className="text-2xl font-bold">
                {plan.name}
              </CardTitle>
              <div className="text-3xl font-bold text-blue-600">
                {plan.price === 0 ? 'Gratis' : `$${plan.price} MXN`}
              </div>
              <p className="text-gray-600">{plan.description}</p>
            </CardHeader>

            <CardContent className="space-y-4">
              <ul className="space-y-3">
                {plan.features.map((feature, index) => (
                  <li key={index} className="flex items-center">
                    <Check className="h-5 w-5 text-green-500 mr-3 flex-shrink-0" />
                    <span className="text-gray-700">{feature}</span>
                  </li>
                ))}
              </ul>

              <div className="pt-6">
                {currentPlan === plan.id ? (
                  <Button disabled className="w-full bg-green-500">
                    Plan Actual
                  </Button>
                ) : plan.price === 0 ? (
                  <Button disabled className="w-full">
                    Plan Gratuito
                  </Button>
                ) : (
                  <MercadoPagoButton
                    planId={plan.id}
                    planName={plan.name}
                    price={plan.price}
                    onSuccess={handleSuccess}
                  />
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Plan Comparison Table */}
      <div className="mt-16">
        <h2 className="text-3xl font-bold text-center mb-8">Comparación de Planes</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white rounded-lg shadow">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Característica
                </th>
                {plans.map((plan) => (
                  <th key={plan.id} className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {plan.name}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              <tr>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  Máximo de publicaciones
                </td>
                {plans.map((plan) => (
                  <td key={plan.id} className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-center">
                    {plan.maxProperties}
                  </td>
                ))}
              </tr>
              <tr>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  Máximo de fotos por publicación
                </td>
                {plans.map((plan) => (
                  <td key={plan.id} className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-center">
                    {plan.maxPhotos}
                  </td>
                ))}
              </tr>
              <tr>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  Enlaces externos
                </td>
                {plans.map((plan) => (
                  <td key={plan.id} className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-center">
                    {plan.externalLinks}
                  </td>
                ))}
              </tr>
              <tr>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  Marco de publicación
                </td>
                {plans.map((plan) => (
                  <td key={plan.id} className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-center">
                    {plan.frame}
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Mercado Pago Info */}
      <div className="mt-12 bg-gradient-to-r from-blue-50 to-purple-50 p-6 rounded-lg">
        <h3 className="text-xl font-bold text-center mb-4">¿Por qué elegir nuestros planes?</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
          <div>
            <div className="text-2xl mb-2">🏡</div>
            <h4 className="font-semibold">Más Visibilidad</h4>
            <p className="text-sm text-gray-600">Marcos premium y posicionamiento destacado</p>
          </div>
          <div>
            <div className="text-2xl mb-2">📱</div>
            <h4 className="font-semibold">Más Contacto</h4>
            <p className="text-sm text-gray-600">Muestra tu teléfono y redes sociales</p>
          </div>
          <div>
            <div className="text-2xl mb-2">🌟</div>
            <h4 className="font-semibold">Perfil VIP</h4>
            <p className="text-sm text-gray-600">Página exclusiva para usuarios premium</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SubscriptionPlans;
