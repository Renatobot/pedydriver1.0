import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Earning, ServiceType, EarningType, PaymentType } from '@/types/database';
import { useAuth } from './useAuth';
import { toast } from '@/hooks/use-toast';

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

export function useEarnings(startDate?: string, endDate?: string) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['earnings', user?.id, startDate, endDate],
    staleTime: 30 * 1000, // 30 seconds - data can be slightly stale
    queryFn: async (): Promise<Earning[]> => {
      if (!user) return [];
      
      let query = supabase
        .from('earnings')
        .select('*, platform:platforms(*)')
        .eq('user_id', user.id)
        .order('date', { ascending: false });
      
      if (startDate) {
        query = query.gte('date', startDate);
      }
      if (endDate) {
        query = query.lte('date', endDate);
      }
      
      const { data, error } = await query;
      
      if (error) throw error;
      return data as Earning[];
    },
    enabled: !!user
  });
}

export function useCreateEarning() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (earning: CreateEarningData) => {
      if (!user) throw new Error('Não autenticado');

      const { data, error } = await supabase
        .from('earnings')
        .insert({
          ...earning,
          user_id: user.id
        })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['earnings'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      toast({
        title: 'Ganho registrado!',
        description: 'Seu ganho foi salvo com sucesso.',
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

export function useUpdateEarning() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ id, ...earning }: { id: string } & Partial<CreateEarningData>) => {
      if (!user) throw new Error('Não autenticado');

      const { data, error } = await supabase
        .from('earnings')
        .update(earning)
        .eq('id', id)
        .eq('user_id', user.id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['earnings'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      toast({
        title: 'Ganho atualizado!',
        description: 'Seu ganho foi editado com sucesso.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Erro ao atualizar',
        description: error.message,
        variant: 'destructive',
      });
    }
  });
}

export function useDeleteEarning() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('earnings')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['earnings'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      toast({
        title: 'Ganho excluído',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Erro ao excluir',
        description: error.message,
        variant: 'destructive',
      });
    }
  });
}
