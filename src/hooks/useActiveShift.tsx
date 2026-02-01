import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { usePlatforms } from './usePlatforms';
import { useCreateShiftOffline } from './useOfflineShifts';
import { format, differenceInMinutes } from 'date-fns';
import { toast } from 'sonner';
import { Platform } from '@/types/database';

export interface ActiveShift {
  id: string;
  user_id: string;
  platform_id: string | null;
  started_at: string;
  start_km: number;
  notes: string | null;
  created_at: string;
  platform?: Platform;
}

interface StartShiftData {
  platform_id: string;
  start_km: number;
  notes?: string;
}

export function useActiveShift() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { data: platforms } = usePlatforms();
  const createShift = useCreateShiftOffline();

  const { data: activeShift, isLoading } = useQuery({
    queryKey: ['active-shift', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      
      const { data, error } = await supabase
        .from('active_shifts')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();
      
      if (error) throw error;
      
      if (data && platforms) {
        const platform = platforms.find(p => p.id === data.platform_id);
        return { ...data, platform } as ActiveShift;
      }
      
      return data as ActiveShift | null;
    },
    enabled: !!user?.id,
  });

  const startShiftMutation = useMutation({
    mutationFn: async (data: StartShiftData) => {
      if (!user?.id) throw new Error('Usuário não autenticado');
      
      const { error } = await supabase
        .from('active_shifts')
        .insert({
          user_id: user.id,
          platform_id: data.platform_id,
          start_km: data.start_km,
          notes: data.notes || null,
        });
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['active-shift'] });
      toast.success('Turno iniciado!');
    },
    onError: (error: any) => {
      if (error.code === '23505') {
        toast.error('Você já tem um turno ativo');
      } else {
        toast.error('Erro ao iniciar turno');
      }
    },
  });

  const endShiftMutation = useMutation({
    mutationFn: async (endKm: number) => {
      if (!user?.id || !activeShift) throw new Error('Nenhum turno ativo');
      
      const startedAt = new Date(activeShift.started_at);
      const now = new Date();
      const minutesWorked = differenceInMinutes(now, startedAt);
      const hoursWorked = Math.round((minutesWorked / 60) * 100) / 100; // 2 decimais
      const kmDriven = endKm - activeShift.start_km;
      
      if (kmDriven < 0) {
        throw new Error('Km final deve ser maior que o inicial');
      }
      
      // Criar registro de turno
      await createShift.mutateAsync({
        platform_id: activeShift.platform_id || undefined,
        hours_worked: hoursWorked,
        km_driven: kmDriven,
        date: format(startedAt, 'yyyy-MM-dd'),
      });
      
      // Deletar turno ativo
      const { error } = await supabase
        .from('active_shifts')
        .delete()
        .eq('id', activeShift.id);
      
      if (error) throw error;
      
      return { hoursWorked, kmDriven };
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['active-shift'] });
      queryClient.invalidateQueries({ queryKey: ['shifts'] });
      toast.success(`Turno finalizado! ${result.hoursWorked}h, ${result.kmDriven} km`);
    },
    onError: (error: any) => {
      toast.error(error.message || 'Erro ao finalizar turno');
    },
  });

  const cancelShiftMutation = useMutation({
    mutationFn: async () => {
      if (!activeShift) throw new Error('Nenhum turno ativo');
      
      const { error } = await supabase
        .from('active_shifts')
        .delete()
        .eq('id', activeShift.id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['active-shift'] });
      toast.success('Turno cancelado');
    },
    onError: () => {
      toast.error('Erro ao cancelar turno');
    },
  });

  // Calcular duração formatada
  const getDuration = () => {
    if (!activeShift) return '';
    
    const startedAt = new Date(activeShift.started_at);
    const now = new Date();
    const minutes = differenceInMinutes(now, startedAt);
    
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    
    if (hours > 0) {
      return `${hours}h ${mins}min`;
    }
    return `${mins}min`;
  };

  return {
    activeShift,
    isLoading,
    hasActiveShift: !!activeShift,
    startShift: startShiftMutation.mutateAsync,
    endShift: endShiftMutation.mutateAsync,
    cancelShift: cancelShiftMutation.mutateAsync,
    isStarting: startShiftMutation.isPending,
    isEnding: endShiftMutation.isPending,
    isCancelling: cancelShiftMutation.isPending,
    getDuration,
  };
}
