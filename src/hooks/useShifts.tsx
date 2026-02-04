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
    staleTime: 30 * 1000, // 30 seconds - data can be slightly stale
    queryFn: async (): Promise<Shift[]> => {
      if (!user) return [];
      
      // Fetch shifts and platforms in parallel to avoid N+1 query
      const [shiftsResult, platformsResult] = await Promise.all([
        supabase
          .from('shifts')
          .select('*, platform:platforms(*)')
          .eq('user_id', user.id)
          .gte('date', startDate || '1900-01-01')
          .lte('date', endDate || '2100-12-31')
          .order('date', { ascending: false }),
        supabase
          .from('platforms')
          .select('*')
      ]);
      
      if (shiftsResult.error) throw shiftsResult.error;
      
      const platformsMap = new Map(platformsResult.data?.map(p => [p.id, p]) || []);
      
      // Enrich shifts with platforms array
      const enrichedShifts = (shiftsResult.data || []).map(shift => {
        const platformIds = shift.platform_ids || (shift.platform_id ? [shift.platform_id] : []);
        const platforms = platformIds
          .map((id: string) => platformsMap.get(id))
          .filter(Boolean);
        return { ...shift, platforms } as Shift;
      });
      
      return enrichedShifts;
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

export function useUpdateShift() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ id, ...shift }: { id: string } & Partial<CreateShiftData>) => {
      if (!user) throw new Error('Não autenticado');

      const { data, error } = await supabase
        .from('shifts')
        .update(shift)
        .eq('id', id)
        .eq('user_id', user.id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shifts'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      toast({
        title: 'Turno atualizado!',
        description: 'Seu turno foi editado com sucesso.',
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
