import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

interface ReminderSettings {
  enabled: boolean;
  reminder_time: string;
  timezone: string;
}

export function useUserPush() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [isSupported, setIsSupported] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [permission, setPermission] = useState<NotificationPermission>('default');

  // Check if push is supported
  useEffect(() => {
    const supported = 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;
    setIsSupported(supported);
    
    if (supported) {
      setPermission(Notification.permission);
    }
  }, []);

  // Check current subscription status
  useEffect(() => {
    async function checkSubscription() {
      if (!isSupported || !user) {
        setIsLoading(false);
        return;
      }

      try {
        const registration = await navigator.serviceWorker.getRegistration('/sw-push.js');
        if (registration) {
          const subscription = await registration.pushManager.getSubscription();
          setIsSubscribed(!!subscription);
        }
      } catch (error) {
        console.error('Error checking push subscription:', error);
      } finally {
        setIsLoading(false);
      }
    }

    checkSubscription();
  }, [isSupported, user]);

  // Fetch reminder settings from database
  const { data: reminderSettings, isLoading: isLoadingSettings } = useQuery({
    queryKey: ['user-reminder-settings', user?.id],
    queryFn: async () => {
      if (!user) return null;
      
      const { data, error } = await supabase
        .from('user_reminder_settings')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();
      
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  // Update reminder settings mutation
  const updateSettingsMutation = useMutation({
    mutationFn: async (settings: Partial<ReminderSettings>) => {
      if (!user) throw new Error('User not authenticated');
      
      const { data: existing } = await supabase
        .from('user_reminder_settings')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();

      if (existing) {
        const { error } = await supabase
          .from('user_reminder_settings')
          .update(settings)
          .eq('user_id', user.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('user_reminder_settings')
          .insert({
            user_id: user.id,
            ...settings
          });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-reminder-settings'] });
    },
  });

  const subscribe = useCallback(async () => {
    if (!isSupported || !user) {
      toast.error('Push notifications não suportadas neste navegador.');
      return false;
    }

    setIsLoading(true);

    try {
      // Request notification permission
      const permissionResult = await Notification.requestPermission();
      setPermission(permissionResult);

      if (permissionResult !== 'granted') {
        toast.error('Você precisa permitir notificações para receber lembretes.');
        setIsLoading(false);
        return false;
      }

      // Register service worker
      const registration = await navigator.serviceWorker.register('/sw-push.js', {
        scope: '/'
      });

      console.log('Service Worker registered:', registration);

      // Wait for the service worker to be ready
      await navigator.serviceWorker.ready;

      // Get VAPID public key from database
      const { data: vapidKey, error: vapidError } = await supabase.rpc('get_vapid_public_key');
      
      if (vapidError || !vapidKey) {
        throw new Error('Falha ao obter chave VAPID');
      }

      // Convert VAPID key to Uint8Array
      const vapidKeyArray = urlBase64ToUint8Array(vapidKey);

      // Subscribe to push
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: vapidKeyArray.buffer as ArrayBuffer
      });

      console.log('Push subscription:', subscription);

      // Extract keys from subscription
      const subscriptionJson = subscription.toJSON();
      const p256dh = subscriptionJson.keys?.p256dh;
      const auth = subscriptionJson.keys?.auth;

      if (!p256dh || !auth) {
        throw new Error('Chaves de push não disponíveis');
      }

      // Save subscription to database
      const { error: saveError } = await supabase
        .from('user_push_subscriptions')
        .upsert({
          user_id: user.id,
          endpoint: subscription.endpoint,
          p256dh,
          auth
        }, {
          onConflict: 'user_id,endpoint'
        });

      if (saveError) {
        throw saveError;
      }

      setIsSubscribed(true);
      toast.success('Notificações push ativadas!');

      return true;
    } catch (error) {
      console.error('Error subscribing to push:', error);
      toast.error(error instanceof Error ? error.message : 'Falha ao ativar notificações push.');
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [isSupported, user]);

  const unsubscribe = useCallback(async () => {
    if (!user) return false;

    setIsLoading(true);

    try {
      const registration = await navigator.serviceWorker.getRegistration('/sw-push.js');
      if (registration) {
        const subscription = await registration.pushManager.getSubscription();
        if (subscription) {
          await subscription.unsubscribe();
        }
      }

      // Remove from database
      const { error } = await supabase
        .from('user_push_subscriptions')
        .delete()
        .eq('user_id', user.id);

      if (error) {
        throw error;
      }

      // Also disable reminders
      await updateSettingsMutation.mutateAsync({ enabled: false });

      setIsSubscribed(false);
      toast.success('Notificações push desativadas.');

      return true;
    } catch (error) {
      console.error('Error unsubscribing from push:', error);
      toast.error('Falha ao desativar notificações.');
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [user, updateSettingsMutation]);

  const setReminderEnabled = useCallback(async (enabled: boolean) => {
    if (enabled && !isSubscribed) {
      // Need to subscribe first
      const success = await subscribe();
      if (!success) return;
    }
    
    await updateSettingsMutation.mutateAsync({ enabled });
  }, [isSubscribed, subscribe, updateSettingsMutation]);

  const setReminderTime = useCallback(async (time: string) => {
    await updateSettingsMutation.mutateAsync({ reminder_time: time });
  }, [updateSettingsMutation]);

  const sendTestNotification = useCallback(async () => {
    if (!('Notification' in window) || Notification.permission !== 'granted') {
      toast.error('Permissão de notificação não concedida');
      return;
    }

    try {
      // Try to use Service Worker first (works on mobile PWA)
      const registration = await navigator.serviceWorker.getRegistration('/sw-push.js');
      
      if (registration) {
        await registration.showNotification('🚗 Teste de Lembrete', {
          body: 'Suas notificações estão funcionando! Você receberá lembretes no horário configurado.',
          icon: '/icons/icon-192.png',
          badge: '/icons/icon-192.png',
          tag: 'test-reminder',
          data: { url: '/settings' }
        } as NotificationOptions);
        toast.success('Notificação de teste enviada!');
      } else {
        // Fallback to Notification API (desktop only)
        new Notification('🚗 Teste de Lembrete', {
          body: 'Suas notificações estão funcionando! Você receberá lembretes no horário configurado.',
          icon: '/icons/icon-192.png',
          badge: '/icons/icon-192.png',
          tag: 'test-reminder'
        });
        toast.success('Notificação de teste enviada!');
      }
    } catch (error) {
      console.error('Error sending test notification:', error);
      // Fallback to Notification API
      try {
        new Notification('🚗 Teste de Lembrete', {
          body: 'Suas notificações estão funcionando!',
          icon: '/icons/icon-192.png',
          tag: 'test-reminder'
        });
        toast.success('Notificação de teste enviada!');
      } catch (e) {
        toast.error('Erro ao enviar notificação de teste');
      }
    }
  }, []);

  return {
    isSupported,
    isSubscribed,
    isLoading: isLoading || isLoadingSettings,
    permission,
    subscribe,
    unsubscribe,
    reminderEnabled: reminderSettings?.enabled ?? false,
    reminderTime: reminderSettings?.reminder_time?.slice(0, 5) ?? '20:00',
    setReminderEnabled,
    setReminderTime,
    sendTestNotification,
  };
}

// Helper function to convert VAPID key
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding)
    .replace(/-/g, '+')
    .replace(/_/g, '/');

  const rawData = atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }

  return outputArray;
}
