
import { useState, useEffect } from 'react';
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

export const useDashboardData = (userId: string | undefined) => {
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

  const fetchUserData = async () => {
    if (!userId) {
      console.log("useDashboardData: fetchUserData - no userId, returning.");
      return;
    }
    
    console.log("useDashboardData: fetchUserData - START");
    setLoading(true);
    
    try {
      console.log('Fetching user data for:', userId);

      // Fetch user properties
      console.log("useDashboardData: Fetching properties...");
      const { data: propertiesData, error: propertiesError } = await supabase
        .from('properties')
        .select(`
          *,
          property_images (image_url, is_main)
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      console.log("useDashboardData: Properties fetched. Error:", propertiesError, "Data count:", propertiesData?.length);

      if (propertiesError) {
        console.error('Error fetching properties:', propertiesError);
        toast({
          title: "Error",
          description: "No se pudieron cargar las propiedades del usuario.",
          variant: "destructive",
        });
        setProperties([]);
      } else if (propertiesData) {
        setProperties(propertiesData);
        const totalViews = propertiesData.reduce((sum, prop) => sum + (prop.views_count || 0), 0);
        const publishedCount = propertiesData.filter(prop => prop.status === 'published').length;
        setStats({
          totalProperties: propertiesData.length,
          publishedProperties: publishedCount,
          totalViews,
          pendingInquiries: 0
        });
      } else {
        setProperties([]);
      }

      // Fetch user subscription
      console.log("useDashboardData: Fetching subscription...");
      const { data: subscriptionData, error: subscriptionError } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', userId)
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      console.log("useDashboardData: Subscription fetched. Error:", subscriptionError, "Data:", subscriptionData);

      if (subscriptionError) {
        console.error('Error fetching subscription:', subscriptionError);
      }

      if (subscriptionData) {
        setSubscription(subscriptionData);
      } else {
        console.log("useDashboardData: No active subscription found, setting basic plan.");
        setSubscription({
          plan_type: 'basic',
          status: 'active',
          max_properties: 1
        });
      }
    } catch (error) {
      console.error('useDashboardData: CATCH block error:', error);
      toast({
        title: "Error",
        description: "Error al cargar los datos del usuario en el dashboard.",
        variant: "destructive",
      });
      setProperties([]);
      setSubscription(null);
    } finally {
      console.log("useDashboardData: FINALLY block. Setting loading to false.");
      setLoading(false);
    }
  };

  useEffect(() => {
    if (userId) {
      console.log("useDashboardData: useEffect[userId] triggered. User ID:", userId);
      fetchUserData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  return {
    properties,
    subscription,
    stats,
    loading,
    refetch: fetchUserData
  };
};
