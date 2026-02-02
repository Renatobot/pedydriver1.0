import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useNetworkStatus } from './useNetworkStatus';
import { toast } from '@/hooks/use-toast';
import { addPendingOperation, cacheData } from '@/lib/offlineDB';

interface CreateShiftData {
  date: string;
  platform_id: string;
  platform_ids?: string[];
  hours_worked: number;
  km_driven: number;
}

export function useCreateShiftOffline() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { isOnline } = useNetworkStatus();

  return useMutation({
    mutationFn: async (shift: CreateShiftData) => {
      if (!user) throw new Error('Não autenticado');

      if (isOnline) {
        // Online: save directly to Supabase
        const { data, error } = await supabase
          .from('shifts')
          .insert({
            ...shift,
            user_id: user.id
          })
          .select()
          .single();
        
        if (error) throw error;
        
        // Cache the new data
        await cacheData('shifts', data.id, data);
        return data;
      } else {
        // Offline: save to IndexedDB queue
        const tempId = `temp-${Date.now()}`;
        const tempData = {
          id: tempId,
          ...shift,
          user_id: user.id,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };

        await addPendingOperation('create', 'shifts', tempData);
        await cacheData('shifts', tempId, tempData);
        
        return tempData;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shifts'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['monthlyEntryCount'] });
      toast({
        title: isOnline ? 'Turno registrado!' : 'Turno salvo offline!',
        description: isOnline 
          ? 'Seu turno foi salvo com sucesso.' 
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
