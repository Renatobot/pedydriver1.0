import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useIsAdmin } from './useAdmin';
import { toast } from '@/hooks/use-toast';

export function useAdminPush() {
  const { user } = useAuth();
  const { data: isAdmin } = useIsAdmin();
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
      if (!isSupported || !user || !isAdmin) {
        setIsLoading(false);
        return;
      }

      try {
        const registration = await getPrimaryServiceWorkerRegistration();
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
  }, [isSupported, user, isAdmin]);

  const subscribe = useCallback(async () => {
    if (!isSupported || !user || !isAdmin) {
      toast({
        title: 'Erro',
        description: 'Push notifications não suportadas neste navegador.',
        variant: 'destructive'
      });
      return false;
    }

    setIsLoading(true);

    try {
      // Request notification permission
      const permissionResult = await Notification.requestPermission();
      setPermission(permissionResult);

      if (permissionResult !== 'granted') {
        toast({
          title: 'Permissão negada',
          description: 'Você precisa permitir notificações para receber alertas.',
          variant: 'destructive'
        });
        setIsLoading(false);
        return false;
      }

      // IMPORTANT: Do NOT register a separate SW for push (conflicts with PWA SW on mobile).
      const registration = await getOrWaitForServiceWorker();
      if (!registration) {
        throw new Error('Service Worker não está pronto. Recarregue o app e tente novamente.');
      }

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
        .from('admin_push_subscriptions')
        .upsert({
          admin_id: user.id,
          endpoint: subscription.endpoint,
          p256dh,
          auth
        }, {
          onConflict: 'admin_id,endpoint'
        });

      if (saveError) {
        throw saveError;
      }

      setIsSubscribed(true);
      toast({
        title: 'Notificações ativadas!',
        description: 'Você receberá alertas de novos cadastros e upgrades.'
      });

      return true;
    } catch (error) {
      console.error('Error subscribing to push:', error);
      toast({
        title: 'Erro ao ativar',
        description: error instanceof Error ? error.message : 'Falha ao ativar notificações push.',
        variant: 'destructive'
      });
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [isSupported, user, isAdmin]);

  const unsubscribe = useCallback(async () => {
    if (!user) return false;

    setIsLoading(true);

    try {
      const registration = await getPrimaryServiceWorkerRegistration();
      if (registration) {
        const subscription = await registration.pushManager.getSubscription();
        if (subscription) {
          await subscription.unsubscribe();
        }
      }

      // Remove from database
      const { error } = await supabase
        .from('admin_push_subscriptions')
        .delete()
        .eq('admin_id', user.id);

      if (error) {
        throw error;
      }

      setIsSubscribed(false);
      toast({
        title: 'Notificações desativadas',
        description: 'Você não receberá mais alertas push.'
      });

      return true;
    } catch (error) {
      console.error('Error unsubscribing from push:', error);
      toast({
        title: 'Erro',
        description: 'Falha ao desativar notificações.',
        variant: 'destructive'
      });
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  const toggle = useCallback(async () => {
    if (isSubscribed) {
      return unsubscribe();
    } else {
      return subscribe();
    }
  }, [isSubscribed, subscribe, unsubscribe]);

  return {
    isSupported,
    isSubscribed,
    isLoading,
    permission,
    subscribe,
    unsubscribe,
    toggle
  };
}

async function getPrimaryServiceWorkerRegistration(): Promise<ServiceWorkerRegistration | null> {
  if (!('serviceWorker' in navigator)) return null;
  try {
    const reg = await navigator.serviceWorker.getRegistration('/');
    if (reg) return reg;
  } catch {
    // ignore
  }
  try {
    const reg = await navigator.serviceWorker.getRegistration();
    if (reg) return reg;
  } catch {
    // ignore
  }
  return null;
}

async function getOrWaitForServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (!('serviceWorker' in navigator)) return null;
  const existing = await getPrimaryServiceWorkerRegistration();
  if (existing) return existing;
  try {
    const ready = await Promise.race([
      navigator.serviceWorker.ready,
      new Promise<null>((resolve) => setTimeout(() => resolve(null), 6000)),
    ]);
    return ready;
  } catch {
    return null;
  }
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
