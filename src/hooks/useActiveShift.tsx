import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { usePlatforms } from './usePlatforms';
import { useCreateShiftOffline } from './useOfflineShifts';
import { useNetworkStatus } from './useNetworkStatus';
import { format, differenceInMinutes } from 'date-fns';
import { toast } from 'sonner';
import { Platform, ExpenseCategory } from '@/types/database';
import { addPendingOperation, cacheData } from '@/lib/offlineDB';

export interface ActiveShift {
  id: string;
  user_id: string;
  platform_id: string | null;
  platform_ids: string[] | null;
  started_at: string;
  start_km: number;
  notes: string | null;
  created_at: string;
  platforms?: Platform[];
}

interface StartShiftData {
  platform_ids: string[];
  start_km: number;
  notes?: string;
}

interface TempEarning {
  id: string;
  amount: number;
  service_count: number;
  platform_id: string;
}

interface TempExpense {
  id: string;
  amount: number;
  category: ExpenseCategory;
}

interface EndShiftData {
  endKm: number;
  earnings?: TempEarning[];
  expenses?: TempExpense[];
}

export function useActiveShift() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { data: platforms } = usePlatforms();
  const createShift = useCreateShiftOffline();
  const { isOnline } = useNetworkStatus();

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
        // Cast data to access platform_ids (added via migration, not in generated types yet)
        const rawData = data as typeof data & { platform_ids?: string[] };
        // Support both old single platform_id and new platform_ids array
        const platformIds = rawData.platform_ids || (data.platform_id ? [data.platform_id] : []);
        const shiftPlatforms = platforms.filter(p => platformIds.includes(p.id));
        return { 
          ...data, 
          platform_ids: platformIds,
          platforms: shiftPlatforms 
        } as ActiveShift;
      }
      
      return data as ActiveShift | null;
    },
    enabled: !!user?.id,
  });

  const startShiftMutation = useMutation({
    mutationFn: async (data: StartShiftData) => {
      if (!user?.id) throw new Error('Usuário não autenticado');
      
      // Use raw insert to include platform_ids (not in generated types yet)
      const insertData = {
        user_id: user.id,
        platform_id: data.platform_ids[0], // Keep first for backwards compatibility
        platform_ids: data.platform_ids,
        start_km: data.start_km,
        notes: data.notes || null,
      };
      
      const { error } = await supabase
        .from('active_shifts')
        .insert(insertData as any);
      
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
    mutationFn: async ({ endKm, earnings = [], expenses = [] }: EndShiftData) => {
      if (!user?.id || !activeShift) throw new Error('Nenhum turno ativo');
      
      const startedAt = new Date(activeShift.started_at);
      const now = new Date();
      const minutesWorked = differenceInMinutes(now, startedAt);
      const hoursWorked = Math.round((minutesWorked / 60) * 100) / 100;
      const kmDriven = endKm - activeShift.start_km;
      const shiftDate = format(startedAt, 'yyyy-MM-dd');
      
      if (kmDriven < 0) {
        throw new Error('Km final deve ser maior que o inicial');
      }
      
      // Get platform IDs (support both old and new format)
      const platformIds = activeShift.platform_ids || 
        (activeShift.platform_id ? [activeShift.platform_id] : []);
      
      // Create ONE shift record with all platforms
      await createShift.mutateAsync({
        platform_id: platformIds[0],
        platform_ids: platformIds,
        hours_worked: hoursWorked,
        km_driven: kmDriven,
        date: shiftDate,
      });
      
      // Save earnings
      let totalEarnings = 0;
      let totalServices = 0;
      for (const earning of earnings) {
        totalEarnings += earning.amount;
        totalServices += earning.service_count;
        
        if (isOnline) {
          await supabase.from('earnings').insert({
            user_id: user.id,
            date: shiftDate,
            platform_id: earning.platform_id,
            service_type: 'corrida',
            earning_type: 'corrida_entrega',
            payment_type: 'app',
            amount: earning.amount,
            service_count: earning.service_count,
          });
        } else {
          const tempId = `temp-${Date.now()}-${Math.random()}`;
          const tempData = {
            id: tempId,
            user_id: user.id,
            date: shiftDate,
            platform_id: earning.platform_id,
            service_type: 'corrida',
            earning_type: 'corrida_entrega',
            payment_type: 'app',
            amount: earning.amount,
            service_count: earning.service_count,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          };
          await addPendingOperation('create', 'earnings', tempData);
          await cacheData('earnings', tempId, tempData);
        }
      }
      
      // Save expenses
      let totalExpenses = 0;
      for (const expense of expenses) {
        totalExpenses += expense.amount;
        
        if (isOnline) {
          await supabase.from('expenses').insert({
            user_id: user.id,
            date: shiftDate,
            category: expense.category,
            amount: expense.amount,
          });
        } else {
          const tempId = `temp-${Date.now()}-${Math.random()}`;
          const tempData = {
            id: tempId,
            user_id: user.id,
            date: shiftDate,
            category: expense.category,
            amount: expense.amount,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          };
          await addPendingOperation('create', 'expenses', tempData);
          await cacheData('expenses', tempId, tempData);
        }
      }
      
      // Delete active shift
      const { error } = await supabase
        .from('active_shifts')
        .delete()
        .eq('id', activeShift.id);
      
      if (error) throw error;
      
      return { hoursWorked, kmDriven, totalEarnings, totalExpenses, totalServices };
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['active-shift'] });
      queryClient.invalidateQueries({ queryKey: ['shifts'] });
      queryClient.invalidateQueries({ queryKey: ['earnings'] });
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      
      // Build toast message
      let message = `${result.hoursWorked}h, ${result.kmDriven} km`;
      if (result.totalEarnings > 0) {
        message += `, R$ ${result.totalEarnings.toFixed(2)} em ganhos`;
      }
      if (result.totalExpenses > 0) {
        message += `, R$ ${result.totalExpenses.toFixed(2)} em gastos`;
      }
      
      toast.success(`Turno finalizado! ${message}`);
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

  // Calculate formatted duration
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
