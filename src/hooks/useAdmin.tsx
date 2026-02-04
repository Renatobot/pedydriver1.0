import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from '@/hooks/use-toast';

export interface AdminMetrics {
  total_users: number;
  active_today: number;
  pro_users: number;
  new_today: number;
  new_week: number;
  free_users: number;
  expired_pro: number;
  blocked_users: number;
}

export interface AdminUser {
  user_id: string;
  full_name: string | null;
  email: string | null;
  phone: string | null;
  created_at: string;
  last_login_at: string | null;
  is_blocked: boolean;
  plan: 'free' | 'pro';
  plan_status: 'active' | 'cancelled' | 'expired' | 'trialing';
  plan_started_at: string;
  plan_expires_at: string | null;
  days_inactive: number;
}

export interface AdminLog {
  id: string;
  admin_email: string | null;
  action: string;
  target_user_email: string | null;
  details: Record<string, unknown> | null;
  created_at: string;
}

export interface AdminAlert {
  id: string;
  event_type: 'new_user_free' | 'new_user_pro' | 'payment_failure' | 'plan_activation_error' | 'churn_inactive_pro' | 'churn_expiring_pro' | 'churn_payment_failed';
  user_id: string | null;
  user_name: string | null;
  user_email: string | null;
  message: string;
  is_read: boolean;
  created_at: string;
}

export function useIsAdmin() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['isAdmin', user?.id],
    queryFn: async () => {
      if (!user) return false;
      
      const { data, error } = await supabase.rpc('is_admin');
      if (error) {
        console.error('Error checking admin status:', error);
        return false;
      }
      return data === true;
    },
    enabled: !!user,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function useAdminMetrics() {
  const { data: isAdmin } = useIsAdmin();

  return useQuery({
    queryKey: ['adminMetrics'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_admin_metrics');
      if (error) throw error;
      return data as unknown as AdminMetrics;
    },
    enabled: isAdmin === true,
    refetchInterval: 30000, // Refresh every 30 seconds
  });
}

export function useAdminUsers() {
  const { data: isAdmin } = useIsAdmin();

  return useQuery({
    queryKey: ['adminUsers'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_admin_users');
      if (error) throw error;
      return data as AdminUser[];
    },
    enabled: isAdmin === true,
  });
}

export function useAdminLogs(limit: number = 100) {
  const { data: isAdmin } = useIsAdmin();

  return useQuery({
    queryKey: ['adminLogs', limit],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_admin_logs', { _limit: limit });
      if (error) throw error;
      return data as AdminLog[];
    },
    enabled: isAdmin === true,
  });
}

export function useUpdateSubscription() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      targetUserId,
      plan,
      status,
      expiresAt,
    }: {
      targetUserId: string;
      plan: 'free' | 'pro';
      status: 'active' | 'cancelled' | 'expired' | 'trialing';
      expiresAt?: string | null;
    }) => {
      // Update subscription
      const { data, error } = await supabase.rpc('admin_update_subscription', {
        _target_user_id: targetUserId,
        _plan: plan,
        _status: status,
        _expires_at: expiresAt || null,
      });
      if (error) throw error;

      // Send notification to user
      await supabase.rpc('notify_subscription_update', {
        _target_user_id: targetUserId,
        _plan: plan,
        _status: status,
      });

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminUsers'] });
      queryClient.invalidateQueries({ queryKey: ['adminMetrics'] });
      queryClient.invalidateQueries({ queryKey: ['adminLogs'] });
      toast({
        title: 'Sucesso',
        description: 'Assinatura atualizada e usuário notificado.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Erro',
        description: 'Falha ao atualizar assinatura.',
        variant: 'destructive',
      });
      console.error('Error updating subscription:', error);
    },
  });
}

export function useToggleUserBlock() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      targetUserId,
      isBlocked,
    }: {
      targetUserId: string;
      isBlocked: boolean;
    }) => {
      const { data, error } = await supabase.rpc('admin_toggle_user_block', {
        _target_user_id: targetUserId,
        _is_blocked: isBlocked,
      });
      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['adminUsers'] });
      queryClient.invalidateQueries({ queryKey: ['adminMetrics'] });
      queryClient.invalidateQueries({ queryKey: ['adminLogs'] });
      toast({
        title: 'Sucesso',
        description: variables.isBlocked 
          ? 'Usuário bloqueado.' 
          : 'Usuário desbloqueado.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Erro',
        description: 'Falha ao alterar status do usuário.',
        variant: 'destructive',
      });
      console.error('Error toggling user block:', error);
    },
  });
}

export function useResetMonthlyLimit() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (targetUserId: string) => {
      const { data, error } = await supabase.rpc('admin_reset_monthly_limit', {
        _target_user_id: targetUserId,
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminLogs'] });
      toast({
        title: 'Sucesso',
        description: 'Limite mensal resetado.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Erro',
        description: 'Falha ao resetar limite.',
        variant: 'destructive',
      });
      console.error('Error resetting monthly limit:', error);
    },
  });
}

export function useAdminAlerts(limit: number = 50) {
  const { data: isAdmin } = useIsAdmin();

  return useQuery({
    queryKey: ['adminAlerts', limit],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_admin_alerts', { _limit: limit });
      if (error) throw error;
      return data as AdminAlert[];
    },
    enabled: isAdmin === true,
    refetchInterval: 30000, // Refresh every 30 seconds
  });
}

export function useUnreadAlertsCount() {
  const { data: isAdmin } = useIsAdmin();

  return useQuery({
    queryKey: ['unreadAlertsCount'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_unread_alerts_count');
      if (error) throw error;
      return data as number;
    },
    enabled: isAdmin === true,
    refetchInterval: 15000, // Refresh every 15 seconds
  });
}

export function useMarkAlertAsRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (alertId: string) => {
      const { data, error } = await supabase.rpc('mark_alert_as_read', {
        _alert_id: alertId,
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminAlerts'] });
      queryClient.invalidateQueries({ queryKey: ['unreadAlertsCount'] });
    },
  });
}

export function useMarkAllAlertsAsRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.rpc('mark_all_alerts_as_read');
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminAlerts'] });
      queryClient.invalidateQueries({ queryKey: ['unreadAlertsCount'] });
      toast({
        title: 'Sucesso',
        description: 'Todos os alertas foram marcados como lidos.',
      });
    },
  });
}

export function useGenerateChurnAlerts() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.rpc('generate_churn_alerts');
      if (error) throw error;
      return data as number;
    },
    onSuccess: (count) => {
      queryClient.invalidateQueries({ queryKey: ['adminAlerts'] });
      queryClient.invalidateQueries({ queryKey: ['unreadAlertsCount'] });
      if (count > 0) {
        toast({
          title: 'Alertas gerados',
          description: `${count} novo(s) alerta(s) de churn detectado(s).`,
        });
      } else {
        toast({
          title: 'Verificação concluída',
          description: 'Nenhum novo alerta de churn detectado.',
        });
      }
    },
    onError: (error) => {
      toast({
        title: 'Erro',
        description: 'Falha ao verificar alertas de churn.',
        variant: 'destructive',
      });
      console.error('Error generating churn alerts:', error);
    },
  });
}

export function useAdminResetPassword() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ targetUserId, newPassword }: { targetUserId: string; newPassword: string }) => {
      const { data, error } = await supabase.functions.invoke('admin-reset-password', {
        body: { targetUserId, newPassword },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminLogs'] });
      toast({
        title: 'Senha resetada',
        description: 'A senha do usuário foi alterada com sucesso.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Erro',
        description: 'Falha ao resetar senha: ' + error.message,
        variant: 'destructive',
      });
      console.error('Error resetting password:', error);
    },
  });
}

export function useDeleteUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ targetUserId, sendNotification }: { targetUserId: string; sendNotification?: boolean }) => {
      const { data, error } = await supabase.functions.invoke('admin-delete-user', {
        body: { targetUserId, sendNotification },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['adminUsers'] });
      queryClient.invalidateQueries({ queryKey: ['adminMetrics'] });
      queryClient.invalidateQueries({ queryKey: ['adminLogs'] });
      toast({
        title: variables.sendNotification ? 'Notificação enviada' : 'Usuário excluído',
        description: variables.sendNotification 
          ? 'O usuário foi notificado sobre a inatividade.'
          : 'O usuário foi excluído permanentemente.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Erro',
        description: 'Falha na operação: ' + error.message,
        variant: 'destructive',
      });
      console.error('Error in user operation:', error);
    },
  });
}

export function useAdminUpdateProfile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      targetUserId,
      fullName,
      phone,
    }: {
      targetUserId: string;
      fullName: string;
      phone: string | null;
    }) => {
      // Validações
      if (!fullName.trim()) {
        throw new Error('Nome é obrigatório');
      }
      if (fullName.length > 100) {
        throw new Error('Nome deve ter no máximo 100 caracteres');
      }

      const { data, error } = await supabase.rpc('admin_update_user_profile', {
        _target_user_id: targetUserId,
        _full_name: fullName.trim(),
        _phone: phone?.trim() || null,
      });
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminUsers'] });
      queryClient.invalidateQueries({ queryKey: ['adminLogs'] });
      toast({
        title: 'Sucesso',
        description: 'Dados do usuário atualizados.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Erro',
        description: 'Falha ao atualizar dados do usuário.',
        variant: 'destructive',
      });
      console.error('Error updating user profile:', error);
    },
  });
}
