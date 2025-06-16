
import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useDashboardData } from '@/hooks/useDashboardData';
import { useRefreshData } from '@/hooks/useRefreshData';
import DashboardHeader from '@/components/DashboardHeader';
import DashboardStats from '@/components/DashboardStats';
import UserPropertiesList from '@/components/UserPropertiesList';
import QuickActions from '@/components/QuickActions';

const Dashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { properties, subscription, stats, loading, refetch } = useDashboardData(user?.id);
  const { refreshing, handleRefresh } = useRefreshData(refetch);

  React.useEffect(() => {
    if (!user) {
      console.log("Dashboard: useEffect - No user, navigating to /auth");
      navigate('/auth');
      return;
    }
    console.log("Dashboard: useEffect[user, navigate] triggered. User ID:", user?.id);
  }, [user, navigate]);

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
        onRefresh={handleRefresh}
      />

      <DashboardStats 
        stats={stats}
        subscription={subscription}
      />

      <UserPropertiesList 
        properties={properties}
        subscription={subscription}
        userId={user?.id}
        onRefresh={refetch}
      />

      <QuickActions />
    </div>
  );
};

export default Dashboard;
