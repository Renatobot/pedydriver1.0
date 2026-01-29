import { useEffect, useCallback, useState } from 'react';

interface ReminderSettings {
  enabled: boolean;
  time: string;
}

const STORAGE_KEY = 'driverpay_reminder_settings';
const LAST_REMINDER_KEY = 'driverpay_last_reminder_date';

function getReminderSettings(): ReminderSettings {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) return JSON.parse(stored);
  } catch {}
  return { enabled: false, time: '20:00' };
}

function saveReminderSettings(settings: ReminderSettings) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
}

export function useNotificationReminder() {
  const [reminderSettings, setReminderSettings] = useState<ReminderSettings>(getReminderSettings);

  const requestPermission = useCallback(async () => {
    if (!('Notification' in window)) {
      return 'unsupported';
    }

    if (Notification.permission === 'granted') {
      return 'granted';
    }

    if (Notification.permission === 'denied') {
      return 'denied';
    }

    const permission = await Notification.requestPermission();
    return permission;
  }, []);

  const sendNotification = useCallback((title: string, options?: NotificationOptions) => {
    if (!('Notification' in window)) return;
    if (Notification.permission !== 'granted') return;

    new Notification(title, {
      icon: '/icons/icon-192.png',
      badge: '/icons/icon-192.png',
      ...options,
    });
  }, []);

  const sendReminderNow = useCallback(() => {
    sendNotification('🚗 Hora de registrar!', {
      body: 'Não esqueça de registrar seus ganhos de hoje no DriverPay.',
      tag: 'daily-reminder',
    });
  }, [sendNotification]);

  const updateSettings = useCallback((updates: Partial<ReminderSettings>) => {
    const newSettings = { ...reminderSettings, ...updates };
    setReminderSettings(newSettings);
    saveReminderSettings(newSettings);
  }, [reminderSettings]);

  // Check and send reminder based on configured time
  useEffect(() => {
    if (!reminderSettings.enabled || !reminderSettings.time) return;
    if (typeof window === 'undefined' || !('Notification' in window)) return;
    if (Notification.permission !== 'granted') return;

    const checkReminder = () => {
      const now = new Date();
      const [hours, minutes] = reminderSettings.time.split(':').map(Number);
      
      if (now.getHours() === hours && now.getMinutes() === minutes) {
        // Check if we already sent today
        const today = now.toDateString();
        const lastReminder = localStorage.getItem(LAST_REMINDER_KEY);
        
        if (lastReminder !== today) {
          sendReminderNow();
          localStorage.setItem(LAST_REMINDER_KEY, today);
        }
      }
    };

    // Check every minute
    const interval = setInterval(checkReminder, 60000);
    
    // Also check immediately
    checkReminder();

    return () => clearInterval(interval);
  }, [reminderSettings.enabled, reminderSettings.time, sendReminderNow]);

  return {
    permission: typeof window !== 'undefined' && 'Notification' in window 
      ? Notification.permission 
      : 'unsupported',
    requestPermission,
    sendNotification,
    sendReminderNow,
    isSupported: typeof window !== 'undefined' && 'Notification' in window,
    reminderEnabled: reminderSettings.enabled,
    reminderTime: reminderSettings.time,
    setReminderEnabled: (enabled: boolean) => updateSettings({ enabled }),
    setReminderTime: (time: string) => updateSettings({ time }),
  };
}
