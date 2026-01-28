import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Shift } from '@/types/database';
import { useAuth } from './useAuth';
import { toast } from '@/hooks/use-toast';

interface CreateShiftData {
  date: string;
  platform_id: string;
  hours_worked: number;
  km_driven: number;
}

export function useShifts(startDate?: string, endDate?: string) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['shifts', user?.id, startDate, endDate],
    queryFn: async (): Promise<Shift[]> => {
      if (!user) return [];
      
      let query = supabase
        .from('shifts')
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
      return data as Shift[];
    },
    enabled: !!user
  });
}

export function useCreateShift() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (shift: CreateShiftData) => {
      if (!user) throw new Error('Não autenticado');

      const { data, error } = await supabase
        .from('shifts')
        .insert({
          ...shift,
          user_id: user.id
        })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shifts'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      toast({
        title: 'Turno registrado!',
        description: 'Seu turno foi salvo com sucesso.',
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

export function useDeleteShift() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('shifts')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shifts'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      toast({
        title: 'Turno excluído',
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
