import { useState, useEffect, useCallback } from 'react';
import { useRegisterSW } from 'virtual:pwa-register/react';

const DISMISS_STORAGE_KEY = 'pwa_update_dismissed';
const DISMISS_DURATION = 6 * 60 * 60 * 1000; // 6 hours

function wasDismissedRecently(): boolean {
  const dismissedAt = localStorage.getItem(DISMISS_STORAGE_KEY);
  if (!dismissedAt) return false;
  return (Date.now() - parseInt(dismissedAt, 10)) < DISMISS_DURATION;
}

export function usePWAUpdate() {
  const [showUpdatePrompt, setShowUpdatePrompt] = useState(false);
  
  const {
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegisteredSW(swUrl, registration) {
      console.log('[PWA] Service Worker registered:', swUrl);
      
      // Check for updates every 30 minutes (battery-friendly)
      if (registration) {
        setInterval(() => {
          console.log('[PWA] Checking for updates...');
          registration.update();
        }, 30 * 60 * 1000);
      }
    },
    onRegisterError(error) {
      console.error('[PWA] Service Worker registration error:', error);
    },
    onNeedRefresh() {
      console.log('[PWA] New content available');
      // Only show if not dismissed recently
      if (!wasDismissedRecently()) {
        console.log('[PWA] Showing update prompt');
        setShowUpdatePrompt(true);
      } else {
        console.log('[PWA] Update prompt was dismissed recently, skipping');
      }
    },
    onOfflineReady() {
      console.log('[PWA] App ready to work offline');
    },
  });

  useEffect(() => {
    if (needRefresh && !wasDismissedRecently()) {
      setShowUpdatePrompt(true);
    }
  }, [needRefresh]);

  const updateApp = useCallback(async () => {
    console.log('[PWA] User requested update');
    // Clear dismiss flag when user updates
    localStorage.removeItem(DISMISS_STORAGE_KEY);
    await updateServiceWorker(true);
    setShowUpdatePrompt(false);
    setNeedRefresh(false);
  }, [updateServiceWorker, setNeedRefresh]);

  const dismissUpdate = useCallback(() => {
    console.log('[PWA] User dismissed update prompt for 6 hours');
    localStorage.setItem(DISMISS_STORAGE_KEY, Date.now().toString());
    setShowUpdatePrompt(false);
  }, []);

  return {
    showUpdatePrompt,
    updateApp,
    dismissUpdate,
    needRefresh
  };
}
