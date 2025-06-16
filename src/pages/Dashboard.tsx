
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import DashboardHeader from '@/components/DashboardHeader';
import DashboardStats from '@/components/DashboardStats';
import UserPropertiesList from '@/components/UserPropertiesList';
import QuickActions from '@/components/QuickActions';

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
  const { user } = useAuth();
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
      console.log("Dashboard: useEffect - No user, navigating to /auth");
      navigate('/auth');
      return;
    }
    console.log("Dashboard: useEffect[user, navigate] triggered. User ID:", user?.id);
    fetchUserData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, navigate]);

  const fetchUserData = async () => {
    if (!user) {
      console.log("Dashboard: fetchUserData - no user, returning.");
      return;
    }
    console.log("Dashboard: fetchUserData - START. Current component loading state:", loading);
    setLoading(true);
    try {
      console.log('Fetching user data for:', user.id);

      // Fetch user properties
      console.log("Dashboard: fetchUserData - Fetching properties...");
      const { data: propertiesData, error: propertiesError } = await supabase
        .from('properties')
        .select(`
          *,
          property_images (image_url, is_main)
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      console.log("Dashboard: fetchUserData - Properties fetched. Error:", propertiesError, "Data count:", propertiesData?.length);

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
      console.log("Dashboard: fetchUserData - Fetching subscription...");
      const { data: subscriptionData, error: subscriptionError } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', user.id)
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      console.log("Dashboard: fetchUserData - Subscription fetched. Error:", subscriptionError, "Data:", subscriptionData);

      if (subscriptionError) {
        console.error('Error fetching subscription:', subscriptionError);
      }

      if (subscriptionData) {
        setSubscription(subscriptionData);
      } else {
        console.log("Dashboard: fetchUserData - No active subscription found, setting basic plan.");
        setSubscription({
          plan_type: 'basic',
          status: 'active',
          max_properties: 1
        });
      }
    } catch (error) {
      console.error('Dashboard: fetchUserData - CATCH block error:', error);
      toast({
        title: "Error",
        description: "Error al cargar los datos del usuario en el dashboard.",
        variant: "destructive",
      });
      setProperties([]);
      setSubscription(null);
    } finally {
      console.log("Dashboard: fetchUserData - FINALLY block. Setting loading to false.");
      setLoading(false);
      console.log("Dashboard: fetchUserData - FINALLY block. setLoading(false) called. Component loading state should be false in next render.");
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

  console.log("Dashboard: Rendering component. Current loading state:", loading);
  if (loading) {
    console.log("Dashboard: Rendering loading state UI.");
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 dark:bg-gray-900 min-h-screen">
        <div className="text-center">
          <p className="dark:text-white">Cargando panel de control...</p>
        </div>
      </div>
    );
  }
  console.log("Dashboard: Rendering main content UI.");

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8 dark:bg-gray-900 min-h-screen">
      <DashboardHeader 
        subscription={subscription}
        refreshing={refreshing}
        onRefresh={handleRefreshData}
      />

      <DashboardStats 
        stats={stats}
        subscription={subscription}
      />

      <UserPropertiesList 
        properties={properties}
        subscription={subscription}
        userId={user?.id}
        onRefresh={fetchUserData}
      />

      <QuickActions />
    </div>
  );
};

export default Dashboard;
