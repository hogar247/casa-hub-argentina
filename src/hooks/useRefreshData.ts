
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';

export const useRefreshData = (fetchData: () => Promise<void>) => {
  const [refreshing, setRefreshing] = useState(false);
  const { toast } = useToast();

  const handleRefresh = async () => {
    if (refreshing) return;
    
    setRefreshing(true);
    try {
      await fetchData();
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

  return {
    refreshing,
    handleRefresh
  };
};
