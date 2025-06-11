
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

interface MercadoPagoButtonProps {
  planId: string;
  planName: string;
  price: number;
  onSuccess?: () => void;
}

const MercadoPagoButton: React.FC<MercadoPagoButtonProps> = ({ 
  planId, 
  planName, 
  price, 
  onSuccess 
}) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  // Access Token de Mercado Pago (TEST)
  const MP_ACCESS_TOKEN = 'TEST-1195552363186700-060621-190210f5b2c446adaf06cd9e1700adc8-301957132';

  const createMercadoPagoPreference = async () => {
    if (!user) {
      toast({
        title: "Error",
        description: "Debes iniciar sesión para suscribirte",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      const preference = {
        items: [
          {
            title: `Plan ${planName}`,
            description: `Suscripción mensual al plan ${planName}`,
            quantity: 1,
            currency_id: 'MXN',
            unit_price: price
          }
        ],
        payer: {
          email: user.email,
          name: user.user_metadata?.first_name || '',
          surname: user.user_metadata?.last_name || ''
        },
        back_urls: {
          success: `${window.location.origin}/plans?success=true&plan=${planId}`,
          failure: `${window.location.origin}/plans?failure=true`,
          pending: `${window.location.origin}/plans?pending=true`
        },
        auto_return: 'approved',
        external_reference: `${user.id}-${planId}-${Date.now()}`,
        statement_descriptor: 'InmoPlus',
        expires: true,
        expiration_date_from: new Date().toISOString(),
        expiration_date_to: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24 horas
        notification_url: `${window.location.origin}/supabase/functions/v1/mercado-pago-webhook`,
      };

      console.log('Creating Mercado Pago preference:', preference);

      const response = await fetch('https://api.mercadopago.com/checkout/preferences', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${MP_ACCESS_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(preference),
      });

      if (!response.ok) {
        const errorData = await response.text();
        console.error('Mercado Pago API Error:', errorData);
        throw new Error(`Error al crear la preferencia de pago: ${response.status}`);
      }

      const data = await response.json();
      console.log('Mercado Pago response:', data);
      
      // Abrir Mercado Pago en nueva pestaña
      if (data.init_point) {
        window.open(data.init_point, '_blank');
        
        toast({
          title: "Redirigiendo...",
          description: "Se abrirá una nueva ventana para completar el pago",
        });

        if (onSuccess) {
          onSuccess();
        }
      } else {
        throw new Error('No se recibió la URL de pago');
      }
      
    } catch (error) {
      console.error('Error al procesar el pago:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Error al procesar el pago. Inténtalo de nuevo.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button 
      onClick={createMercadoPagoPreference}
      disabled={loading}
      className="w-full bg-blue-600 hover:bg-blue-700"
    >
      {loading ? 'Procesando...' : 'Suscribirse con Mercado Pago'}
    </Button>
  );
};

export default MercadoPagoButton;
