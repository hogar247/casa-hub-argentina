
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Webhook received from Mercado Pago');
    
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    const body = await req.json();
    console.log('Webhook payload:', body);

    // Verificar que es un webhook de pago
    if (body.type === 'payment') {
      const paymentId = body.data.id;
      
      // Obtener información del pago desde Mercado Pago
      const MP_ACCESS_TOKEN = Deno.env.get("MERCADO_PAGO_ACCESS_TOKEN");
      const paymentResponse = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
        headers: {
          'Authorization': `Bearer ${MP_ACCESS_TOKEN}`,
        },
      });

      if (!paymentResponse.ok) {
        throw new Error('Error al obtener información del pago');
      }

      const payment = await paymentResponse.json();
      console.log('Payment details:', payment);

      // Si el pago fue aprobado
      if (payment.status === 'approved') {
        const externalReference = payment.external_reference;
        
        if (externalReference) {
          // Extraer información del external_reference (user_id-plan_id-timestamp)
          const [userId, planId] = externalReference.split('-');
          
          if (userId && planId) {
            console.log('Updating subscription for user:', userId, 'plan:', planId);
            
            // Mapear plan_id a configuración de plan
            const planConfigs = {
              'plan_100': { maxProperties: 2, planType: 'plan_100' },
              'plan_300': { maxProperties: 5, planType: 'plan_300' },
              'plan_500': { maxProperties: 10, planType: 'plan_500' },
              'plan_1000': { maxProperties: 30, planType: 'plan_1000' },
              'plan_3000': { maxProperties: 100, planType: 'plan_3000' },
            };

            const planConfig = planConfigs[planId as keyof typeof planConfigs];
            
            if (planConfig) {
              // Desactivar suscripciones previas
              await supabaseClient
                .from('subscriptions')
                .update({ status: 'inactive' })
                .eq('user_id', userId);

              // Crear nueva suscripción activa
              const { error: insertError } = await supabaseClient
                .from('subscriptions')
                .insert({
                  user_id: userId,
                  plan_type: planConfig.planType,
                  status: 'active',
                  max_properties: planConfig.maxProperties,
                  starts_at: new Date().toISOString(),
                  ends_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 días
                  mercado_pago_subscription_id: paymentId,
                });

              if (insertError) {
                console.error('Error updating subscription:', insertError);
                throw new Error('Error al actualizar la suscripción');
              }

              console.log('Subscription updated successfully');
            }
          }
        }
      }
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    console.error('Webhook error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
