
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Building, Eye, Heart } from 'lucide-react';

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

interface DashboardStatsProps {
  stats: UserStats;
  subscription: UserSubscription | null;
}

const DashboardStats: React.FC<DashboardStatsProps> = ({ stats, subscription }) => {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-6 sm:mb-8">
      <Card className="dark:bg-gray-800 dark:border-gray-700">
        <CardContent className="p-4 sm:p-6">
          <div className="flex items-center">
            <Building className="h-6 w-6 sm:h-8 sm:w-8 text-blue-600 dark:text-blue-400" />
            <div className="ml-3 sm:ml-4">
              <p className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-300">Total Propiedades</p>
              <p className="text-lg sm:text-2xl font-bold text-gray-900 dark:text-white">
                {stats.totalProperties}/{subscription?.max_properties || (subscription?.plan_type === 'basic' ? 1 : 0)}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="dark:bg-gray-800 dark:border-gray-700">
        <CardContent className="p-4 sm:p-6">
          <div className="flex items-center">
            <Eye className="h-6 w-6 sm:h-8 sm:w-8 text-green-600 dark:text-green-400" />
            <div className="ml-3 sm:ml-4">
              <p className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-300">Publicadas</p>
              <p className="text-lg sm:text-2xl font-bold text-gray-900 dark:text-white">{stats.publishedProperties}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="dark:bg-gray-800 dark:border-gray-700">
        <CardContent className="p-4 sm:p-6">
          <div className="flex items-center">
            <Eye className="h-6 w-6 sm:h-8 sm:w-8 text-purple-600 dark:text-purple-400" />
            <div className="ml-3 sm:ml-4">
              <p className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-300">Total Vistas</p>
              <p className="text-lg sm:text-2xl font-bold text-gray-900 dark:text-white">{stats.totalViews}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="dark:bg-gray-800 dark:border-gray-700">
        <CardContent className="p-4 sm:p-6">
          <div className="flex items-center">
            <Heart className="h-6 w-6 sm:h-8 sm:w-8 text-red-600 dark:text-red-400" />
            <div className="ml-3 sm:ml-4">
              <p className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-300">Consultas</p>
              <p className="text-lg sm:text-2xl font-bold text-gray-900 dark:text-white">{stats.pendingInquiries}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default DashboardStats;
