import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { ExpenseCategory } from '@/types/database';
import { useAuth } from './useAuth';
import { useNetworkStatus } from './useNetworkStatus';
import { toast } from '@/hooks/use-toast';
import { addPendingOperation, cacheData } from '@/lib/offlineDB';

interface CreateExpenseData {
  date: string;
  category: ExpenseCategory;
  amount: number;
  platform_id?: string | null;
  notes?: string;
}

export function useCreateExpenseOffline() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { isOnline } = useNetworkStatus();

  return useMutation({
    mutationFn: async (expense: CreateExpenseData) => {
      if (!user) throw new Error('Não autenticado');

      if (isOnline) {
        // Online: save directly to Supabase
        const { data, error } = await supabase
          .from('expenses')
          .insert({
            ...expense,
            user_id: user.id
          })
          .select()
          .single();
        
        if (error) throw error;
        
        // Cache the new data
        await cacheData('expenses', data.id, data);
        return data;
      } else {
        // Offline: save to IndexedDB queue
        const tempId = `temp-${Date.now()}`;
        const tempData = {
          id: tempId,
          ...expense,
          user_id: user.id,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };

        await addPendingOperation('create', 'expenses', tempData);
        await cacheData('expenses', tempId, tempData);
        
        return tempData;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      toast({
        title: isOnline ? 'Gasto registrado!' : 'Gasto salvo offline!',
        description: isOnline 
          ? 'Seu gasto foi salvo com sucesso.' 
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
