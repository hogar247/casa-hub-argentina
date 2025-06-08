
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Check, Star, Crown, Zap } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

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
  const [currentPlan, setCurrentPlan] = useState<string>('basic');
  const [loading, setLoading] = useState(false);

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
    fetchCurrentPlan();
  }, [user]);

  const fetchCurrentPlan = async () => {
    if (!user) return;

    const { data } = await supabase
      .from('subscriptions')
      .select('plan_type')
      .eq('user_id', user.id)
      .eq('status', 'active')
      .single();

    if (data) {
      setCurrentPlan(data.plan_type);
    }
  };

  const handleUpgrade = async (planId: string) => {
    if (!user) return;

    setLoading(true);
    
    try {
      // Aquí integrarías con Mercado Pago
      console.log('Upgrading to plan:', planId);
      
      // Por ahora solo actualizamos en la base de datos
      const { error } = await supabase
        .from('subscriptions')
        .update({
          plan_type: planId,
          status: 'active',
          updated_at: new Date().toISOString()
        })
        .eq('user_id', user.id);

      if (!error) {
        setCurrentPlan(planId);
        alert('¡Plan actualizado exitosamente!');
      }
    } catch (error) {
      console.error('Error upgrading plan:', error);
      alert('Error al actualizar el plan');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          Planes de Suscripción
        </h1>
        <p className="text-xl text-gray-600">
          Elige el plan perfecto para tus necesidades inmobiliarias
        </p>
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
                ) : (
                  <Button 
                    onClick={() => handleUpgrade(plan.id)}
                    disabled={loading}
                    className={`w-full ${
                      plan.highlighted 
                        ? 'bg-blue-600 hover:bg-blue-700' 
                        : 'bg-gray-800 hover:bg-gray-900'
                    }`}
                  >
                    {loading ? 'Procesando...' : 'Suscribirse'}
                  </Button>
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
    </div>
  );
};

export default SubscriptionPlans;
