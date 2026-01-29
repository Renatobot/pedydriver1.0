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
}

export interface AdminLog {
  id: string;
  admin_email: string | null;
  action: string;
  target_user_email: string | null;
  details: Record<string, unknown> | null;
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
      const { data, error } = await supabase.rpc('admin_update_subscription', {
        _target_user_id: targetUserId,
        _plan: plan,
        _status: status,
        _expires_at: expiresAt || null,
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminUsers'] });
      queryClient.invalidateQueries({ queryKey: ['adminMetrics'] });
      queryClient.invalidateQueries({ queryKey: ['adminLogs'] });
      toast({
        title: 'Sucesso',
        description: 'Assinatura atualizada com sucesso.',
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
