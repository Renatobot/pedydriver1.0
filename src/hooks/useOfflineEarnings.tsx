import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { ServiceType, EarningType, PaymentType } from '@/types/database';
import { useAuth } from './useAuth';
import { useNetworkStatus } from './useNetworkStatus';
import { toast } from '@/hooks/use-toast';
import { addPendingOperation, cacheData } from '@/lib/offlineDB';

interface CreateEarningData {
  date: string;
  platform_id: string;
  service_type: ServiceType;
  earning_type: EarningType;
  payment_type: PaymentType;
  amount: number;
  service_count: number;
  notes?: string;
}

export function useCreateEarningOffline() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { isOnline } = useNetworkStatus();

  return useMutation({
    mutationFn: async (earning: CreateEarningData) => {
      if (!user) throw new Error('Não autenticado');

      if (isOnline) {
        // Online: save directly to Supabase
        const { data, error } = await supabase
          .from('earnings')
          .insert({
            ...earning,
            user_id: user.id
          })
          .select()
          .single();
        
        if (error) throw error;
        
        // Cache the new data
        await cacheData('earnings', data.id, data);
        return data;
      } else {
        // Offline: save to IndexedDB queue
        const tempId = `temp-${Date.now()}`;
        const tempData = {
          id: tempId,
          ...earning,
          user_id: user.id,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };

        await addPendingOperation('create', 'earnings', tempData);
        await cacheData('earnings', tempId, tempData);
        
        return tempData;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['earnings'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      toast({
        title: isOnline ? 'Ganho registrado!' : 'Ganho salvo offline!',
        description: isOnline 
          ? 'Seu ganho foi salvo com sucesso.' 
          : 'Será sincronizado quando houver conexão.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Erro ao registrar',
        description: error.message,
        variant: 'destructive',
      });
    }
  });
}
