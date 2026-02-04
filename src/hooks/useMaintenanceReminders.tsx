import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useGamification } from './useGamification';

export interface MaintenanceReminder {
  id: string;
  user_id: string;
  name: string;
  interval_km: number;
  last_km: number;
  created_at: string;
  updated_at: string;
}

export interface MaintenanceTemplate {
  name: string;
  interval_km: number;
}

export const MAINTENANCE_TEMPLATES: MaintenanceTemplate[] = [
  { name: 'Troca de óleo', interval_km: 5000 },
  { name: 'Troca de óleo (sintético)', interval_km: 10000 },
  { name: 'Revisão de freios', interval_km: 20000 },
  { name: 'Troca de pneus', interval_km: 40000 },
  { name: 'Revisão geral', interval_km: 30000 },
  { name: 'Alinhamento e balanceamento', interval_km: 10000 },
  { name: 'Troca de filtro de ar', interval_km: 15000 },
  { name: 'Troca de correia dentada', interval_km: 60000 },
];

export function useMaintenanceReminders() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { stats } = useGamification();

  const currentKm = stats?.totalKm || 0;

  const { data: reminders, isLoading } = useQuery({
    queryKey: ['maintenance-reminders', user?.id],
    staleTime: 5 * 60 * 1000,
    queryFn: async (): Promise<MaintenanceReminder[]> => {
      if (!user?.id) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('maintenance_reminders')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return (data || []) as MaintenanceReminder[];
    },
    enabled: !!user?.id,
  });

  const addReminder = useMutation({
    mutationFn: async ({ name, interval_km }: { name: string; interval_km: number }) => {
      if (!user?.id) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('maintenance_reminders')
        .insert({
          user_id: user.id,
          name,
          interval_km,
          last_km: currentKm,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['maintenance-reminders'] });
    },
  });

  const completeReminder = useMutation({
    mutationFn: async (id: string) => {
      if (!user?.id) throw new Error('User not authenticated');

      const { error } = await supabase
        .from('maintenance_reminders')
        .update({ last_km: currentKm })
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['maintenance-reminders'] });
    },
  });

  const deleteReminder = useMutation({
    mutationFn: async (id: string) => {
      if (!user?.id) throw new Error('User not authenticated');

      const { error } = await supabase
        .from('maintenance_reminders')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['maintenance-reminders'] });
    },
  });

  // Calculate pending reminders (km since last maintenance >= interval)
  const pendingReminders = reminders?.filter(reminder => {
    const kmSinceLastMaintenance = currentKm - Number(reminder.last_km);
    return kmSinceLastMaintenance >= reminder.interval_km;
  }) || [];

  // Calculate reminders that are approaching (>= 80% of interval)
  const approachingReminders = reminders?.filter(reminder => {
    const kmSinceLastMaintenance = currentKm - Number(reminder.last_km);
    const percentage = kmSinceLastMaintenance / reminder.interval_km;
    return percentage >= 0.8 && percentage < 1;
  }) || [];

  return {
    reminders: reminders || [],
    pendingReminders,
    approachingReminders,
    isLoading,
    currentKm,
    addReminder,
    completeReminder,
    deleteReminder,
  };
}
