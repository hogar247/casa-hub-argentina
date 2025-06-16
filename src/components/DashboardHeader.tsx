
import React from 'react';
import { Button } from '@/components/ui/button';
import { RefreshCw } from 'lucide-react';

interface UserSubscription {
  plan_type: string;
  status: string;
  max_properties: number;
}

interface DashboardHeaderProps {
  subscription: UserSubscription | null;
  refreshing: boolean;
  onRefresh: () => void;
}

const DashboardHeader: React.FC<DashboardHeaderProps> = ({ subscription, refreshing, onRefresh }) => {
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

  return (
    <div className="mb-6 sm:mb-8 flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4">
      <div className="flex-1">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-2">
          Panel de Control
        </h1>
        <p className="text-gray-600 dark:text-gray-300 text-sm sm:text-base">
          Gestiona tus propiedades y revisa las estadísticas
        </p>
        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 mt-2">
          <p className="text-sm text-blue-600 dark:text-blue-400">
            Plan actual: {getPlanName(subscription?.plan_type || 'basic')}
          </p>
          <Button 
            onClick={() => { console.log("Dashboard: Refresh button clicked."); onRefresh(); }}
            disabled={refreshing}
            variant="outline"
            size="sm"
            className="flex items-center gap-2 self-start sm:self-auto"
          >
            <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
            {refreshing ? 'Actualizando...' : 'Actualizar'}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default DashboardHeader;
