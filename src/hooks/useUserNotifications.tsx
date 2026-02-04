import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export interface UserNotification {
  id: string;
  user_id: string;
  type: string;
  title: string;
  message: string;
  is_read: boolean;
  created_at: string;
}

export function useUserNotifications() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Realtime subscription for notifications
  useEffect(() => {
    if (!user?.id) return;

    const channel = supabase
      .channel(`user_notifications_${user.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'user_notifications',
          filter: `user_id=eq.${user.id}`
        },
        (payload) => {
          console.log('[Notifications] Realtime update:', payload.eventType);
          queryClient.invalidateQueries({ queryKey: ['userNotifications', user.id] });
          queryClient.invalidateQueries({ queryKey: ['unreadNotificationsCount', user.id] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id, queryClient]);

  return useQuery({
    queryKey: ['userNotifications', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('user_notifications')
        .select('*')
        .eq('user_id', user!.id)
        .order('created_at', { ascending: false })
        .limit(20);
      
      if (error) throw error;
      return data as UserNotification[];
    },
    enabled: !!user,
    staleTime: 30000, // 30 seconds - realtime will handle updates
  });
}

export function useUnreadNotificationsCount() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['unreadNotificationsCount', user?.id],
    queryFn: async () => {
      const { count, error } = await supabase
        .from('user_notifications')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user!.id)
        .eq('is_read', false);
      
      if (error) throw error;
      return count || 0;
    },
    enabled: !!user,
    staleTime: 30000, // 30 seconds - realtime will handle updates
  });
}

export function useMarkNotificationAsRead() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (notificationId: string) => {
      const { error } = await supabase
        .from('user_notifications')
        .update({ is_read: true })
        .eq('id', notificationId)
        .eq('user_id', user!.id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['userNotifications'] });
      queryClient.invalidateQueries({ queryKey: ['unreadNotificationsCount'] });
    },
  });
}

export function useMarkAllNotificationsAsRead() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from('user_notifications')
        .update({ is_read: true })
        .eq('user_id', user!.id)
        .eq('is_read', false);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['userNotifications'] });
      queryClient.invalidateQueries({ queryKey: ['unreadNotificationsCount'] });
    },
  });
}

export function useDeleteNotification() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (notificationId: string) => {
      const { error } = await supabase
        .from('user_notifications')
        .delete()
        .eq('id', notificationId)
        .eq('user_id', user!.id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['userNotifications'] });
      queryClient.invalidateQueries({ queryKey: ['unreadNotificationsCount'] });
    },
  });
}
