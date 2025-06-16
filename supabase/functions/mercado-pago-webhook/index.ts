
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
      "https://ynioxthsnoaenoqilxaz.supabase.co",
      "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InluaW94dGhzbm9hZW5vcWlseGF6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0OTI3NjUyOCwiZXhwIjoyMDY0ODUyNTI4fQ.E2OgXY8_QYmn4mQU5Yfs9GtLI-8KD7NW8M0QP80vicE",
      { auth: { persistSession: false } }
    );

    const body = await req.json();
    console.log('Webhook payload:', JSON.stringify(body, null, 2));

    // Verificar que es un webhook de pago
    if (body.type === 'payment') {
      const paymentId = body.data.id;
      console.log('Processing payment ID:', paymentId);
      
      // Usar el access token correcto
      const MP_ACCESS_TOKEN = "TEST-1195552363186700-060621-190210f5b2c446adaf06cd9e1700adc8-301957132";
      
      // Obtener información del pago desde Mercado Pago
      const paymentResponse = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
        headers: {
          'Authorization': `Bearer ${MP_ACCESS_TOKEN}`,
        },
      });

      if (!paymentResponse.ok) {
        console.error('Error al obtener información del pago:', paymentResponse.status);
        throw new Error('Error al obtener información del pago');
      }

      const payment = await paymentResponse.json();
      console.log('Payment details:', JSON.stringify(payment, null, 2));

      // Si el pago fue aprobado
      if (payment.status === 'approved') {
        const externalReference = payment.external_reference;
        console.log('External reference:', externalReference);
        
        if (externalReference) {
          // Extraer información del external_reference (user_id-plan_id-timestamp)
          const parts = externalReference.split('-');
          const userId = parts[0];
          const planId = parts[1];
          
          console.log('Updating subscription for user:', userId, 'plan:', planId);
          
          if (userId && planId) {
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
              const { error: updateError } = await supabaseClient
                .from('subscriptions')
                .update({ status: 'inactive' })
                .eq('user_id', userId);

              if (updateError) {
                console.error('Error deactivating previous subscriptions:', updateError);
              } else {
                console.log('Previous subscriptions deactivated');
              }

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
                console.error('Error creating new subscription:', insertError);
                throw new Error('Error al actualizar la suscripción');
              }

              console.log('Subscription updated successfully for user:', userId, 'to plan:', planConfig.planType);
              
              // Log del cambio de plan para debugging
              console.log(`Plan actualizado exitosamente:
                - Usuario: ${userId}
                - Plan anterior desactivado
                - Nuevo plan: ${planConfig.planType}
                - Máximo propiedades: ${planConfig.maxProperties}
                - Payment ID: ${paymentId}`);
                
            } else {
              console.error('Plan configuration not found for:', planId);
            }
          } else {
            console.error('Could not extract user_id or plan_id from external_reference');
          }
        } else {
          console.error('No external_reference found in payment');
        }
      } else {
        console.log('Payment not approved, status:', payment.status);
      }
    } else {
      console.log('Webhook type not payment:', body.type);
    }

    return new Response(JSON.stringify({ 
      success: true,
      message: 'Webhook processed successfully',
      timestamp: new Date().toISOString()
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    console.error('Webhook error:', error);
    return new Response(JSON.stringify({ 
      error: error.message,
      timestamp: new Date().toISOString(),
      success: false
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
