import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface PushTemplate {
  id: string;
  name: string;
  title: string;
  body: string;
  icon: string;
  url: string | null;
  is_active: boolean;
  created_at: string;
}

interface ScheduledNotification {
  id: string;
  title: string;
  body: string;
  icon: string;
  url: string | null;
  target_type: string;
  target_user_id: string | null;
  inactive_days: number | null;
  scheduled_at: string;
  status: string;
  sent_count: number;
  failed_count: number;
  created_by: string;
  created_at: string;
  sent_at: string | null;
}

interface RecurringNotification {
  id: string;
  name: string;
  title: string;
  body: string;
  icon: string;
  url: string | null;
  target_type: string;
  inactive_days: number | null;
  frequency: string;
  time_of_day: string;
  days_of_week: number[];
  day_of_month: number | null;
  timezone: string;
  is_active: boolean;
  last_run_at: string | null;
  next_run_at: string;
  total_sent: number;
  created_by: string;
  created_at: string;
}

interface PushSendLog {
  id: string;
  notification_id: string | null;
  recurring_id: string | null;
  title: string;
  body: string;
  target_type: string;
  total_recipients: number;
  success_count: number;
  failure_count: number;
  sent_by: string | null;
  sent_at: string;
}

interface SendNotificationParams {
  title: string;
  body: string;
  icon?: string;
  url?: string;
  targetType: 'all' | 'pro' | 'free' | 'inactive' | 'user';
  targetUserId?: string;
  inactiveDays?: number;
}

interface ScheduleNotificationParams extends SendNotificationParams {
  scheduledAt: string;
}

interface CreateRecurringParams {
  name: string;
  title: string;
  body: string;
  icon?: string;
  url?: string;
  targetType: 'all' | 'pro' | 'free' | 'inactive';
  inactiveDays?: number;
  frequency: 'daily' | 'weekly' | 'monthly';
  timeOfDay: string;
  daysOfWeek?: number[];
  dayOfMonth?: number;
}

export function usePushTemplates() {
  return useQuery({
    queryKey: ['push-templates'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('push_templates')
        .select('*')
        .eq('is_active', true)
        .order('created_at');
      
      if (error) throw error;
      return data as PushTemplate[];
    }
  });
}

export function useScheduledNotifications() {
  return useQuery({
    queryKey: ['scheduled-notifications'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('scheduled_notifications')
        .select('*')
        .order('scheduled_at', { ascending: false });
      
      if (error) throw error;
      return data as ScheduledNotification[];
    }
  });
}

export function useRecurringNotifications() {
  return useQuery({
    queryKey: ['recurring-notifications'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('recurring_notifications')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as RecurringNotification[];
    }
  });
}

export function usePushSendLogs() {
  return useQuery({
    queryKey: ['push-send-logs'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('push_send_logs')
        .select('*')
        .order('sent_at', { ascending: false })
        .limit(100);
      
      if (error) throw error;
      return data as PushSendLog[];
    }
  });
}

export function useRecipientCounts() {
  return useQuery({
    queryKey: ['recipient-counts'],
    queryFn: async () => {
      const [allResult, proResult, freeResult] = await Promise.all([
        supabase.rpc('count_push_recipients', { _target_type: 'all' }),
        supabase.rpc('count_push_recipients', { _target_type: 'pro' }),
        supabase.rpc('count_push_recipients', { _target_type: 'free' })
      ]);
      
      return {
        all: (allResult.data as number) || 0,
        pro: (proResult.data as number) || 0,
        free: (freeResult.data as number) || 0
      };
    }
  });
}

export function useSendNotification() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (params: SendNotificationParams) => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Not authenticated');

      const response = await supabase.functions.invoke('send-admin-notification', {
        body: params
      });

      if (response.error) throw response.error;
      return response.data;
    },
    onSuccess: (data) => {
      toast({
        title: 'Notificação enviada!',
        description: `Enviadas: ${data.sent} | Falhas: ${data.failed}`
      });
      queryClient.invalidateQueries({ queryKey: ['push-send-logs'] });
    },
    onError: (error) => {
      toast({
        title: 'Erro ao enviar',
        description: error.message,
        variant: 'destructive'
      });
    }
  });
}

export function useScheduleNotification() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (params: ScheduleNotificationParams) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase.from('scheduled_notifications').insert({
        title: params.title,
        body: params.body,
        icon: params.icon || '📢',
        url: params.url,
        target_type: params.targetType,
        target_user_id: params.targetUserId || null,
        inactive_days: params.inactiveDays || null,
        scheduled_at: params.scheduledAt,
        created_by: user.id
      });

      if (error) throw error;
    },
    onSuccess: () => {
      toast({
        title: 'Notificação agendada!',
        description: 'A notificação será enviada no horário programado.'
      });
      queryClient.invalidateQueries({ queryKey: ['scheduled-notifications'] });
    },
    onError: (error) => {
      toast({
        title: 'Erro ao agendar',
        description: error.message,
        variant: 'destructive'
      });
    }
  });
}

export function useCreateRecurring() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (params: CreateRecurringParams) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Calculate next_run_at using the database function
      const { data: nextRunAt } = await supabase.rpc('calculate_next_run_at', {
        _frequency: params.frequency,
        _time_of_day: params.timeOfDay,
        _days_of_week: params.daysOfWeek || [],
        _day_of_month: params.dayOfMonth || null,
        _timezone: 'America/Sao_Paulo'
      });

      const { error } = await supabase.from('recurring_notifications').insert({
        name: params.name,
        title: params.title,
        body: params.body,
        icon: params.icon || '📢',
        url: params.url,
        target_type: params.targetType,
        inactive_days: params.inactiveDays || null,
        frequency: params.frequency,
        time_of_day: params.timeOfDay,
        days_of_week: params.daysOfWeek || [],
        day_of_month: params.dayOfMonth || null,
        next_run_at: nextRunAt,
        created_by: user.id
      });

      if (error) throw error;
    },
    onSuccess: () => {
      toast({
        title: 'Recorrência criada!',
        description: 'A notificação será enviada automaticamente.'
      });
      queryClient.invalidateQueries({ queryKey: ['recurring-notifications'] });
    },
    onError: (error) => {
      toast({
        title: 'Erro ao criar recorrência',
        description: error.message,
        variant: 'destructive'
      });
    }
  });
}

export function useToggleRecurring() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, isActive }: { id: string; isActive: boolean }) => {
      const { error } = await supabase
        .from('recurring_notifications')
        .update({ is_active: isActive, updated_at: new Date().toISOString() })
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: (_, { isActive }) => {
      toast({
        title: isActive ? 'Recorrência ativada' : 'Recorrência pausada',
        description: isActive 
          ? 'As notificações serão enviadas no próximo horário.'
          : 'As notificações foram pausadas.'
      });
      queryClient.invalidateQueries({ queryKey: ['recurring-notifications'] });
    },
    onError: (error) => {
      toast({
        title: 'Erro',
        description: error.message,
        variant: 'destructive'
      });
    }
  });
}

export function useDeleteRecurring() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('recurring_notifications')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: 'Recorrência excluída' });
      queryClient.invalidateQueries({ queryKey: ['recurring-notifications'] });
    },
    onError: (error) => {
      toast({
        title: 'Erro ao excluir',
        description: error.message,
        variant: 'destructive'
      });
    }
  });
}

export function useCancelScheduled() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('scheduled_notifications')
        .update({ status: 'cancelled' })
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: 'Agendamento cancelado' });
      queryClient.invalidateQueries({ queryKey: ['scheduled-notifications'] });
    },
    onError: (error) => {
      toast({
        title: 'Erro ao cancelar',
        description: error.message,
        variant: 'destructive'
      });
    }
  });
}
