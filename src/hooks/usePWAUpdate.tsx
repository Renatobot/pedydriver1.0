import { useState, useEffect, useCallback } from 'react';
import { useRegisterSW } from 'virtual:pwa-register/react';

export function usePWAUpdate() {
  const [showUpdatePrompt, setShowUpdatePrompt] = useState(false);
  
  const {
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegisteredSW(swUrl, registration) {
      console.log('[PWA] Service Worker registered:', swUrl);
      
      // Check for updates every 5 minutes
      if (registration) {
        setInterval(() => {
          console.log('[PWA] Checking for updates...');
          registration.update();
        }, 5 * 60 * 1000);
      }
    },
    onRegisterError(error) {
      console.error('[PWA] Service Worker registration error:', error);
    },
    onNeedRefresh() {
      console.log('[PWA] New content available, showing update prompt');
      setShowUpdatePrompt(true);
    },
    onOfflineReady() {
      console.log('[PWA] App ready to work offline');
    },
  });

  useEffect(() => {
    if (needRefresh) {
      setShowUpdatePrompt(true);
    }
  }, [needRefresh]);

  const updateApp = useCallback(async () => {
    console.log('[PWA] User requested update');
    await updateServiceWorker(true);
    setShowUpdatePrompt(false);
    setNeedRefresh(false);
  }, [updateServiceWorker, setNeedRefresh]);

  const dismissUpdate = useCallback(() => {
    setShowUpdatePrompt(false);
  }, []);

  return {
    showUpdatePrompt,
    updateApp,
    dismissUpdate,
    needRefresh
  };
}
