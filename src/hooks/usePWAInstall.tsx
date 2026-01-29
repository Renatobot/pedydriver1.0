import { useState, useEffect, useCallback } from 'react';

const PWA_DISMISSED_KEY = 'pedy_pwa_dismissed';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

interface UsePWAInstall {
  canInstall: boolean;
  isInstalled: boolean;
  isDismissed: boolean;
  isIOS: boolean;
  installApp: () => Promise<void>;
  dismissBanner: () => void;
  resetDismiss: () => void;
}

export function usePWAInstall(): UsePWAInstall {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);

  // Detect iOS
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;

  // Check if already installed as PWA
  useEffect(() => {
    const isStandalone = 
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone === true;
    
    setIsInstalled(isStandalone);
  }, []);

  // Load dismissed state from localStorage
  useEffect(() => {
    const dismissed = localStorage.getItem(PWA_DISMISSED_KEY);
    setIsDismissed(dismissed === 'true');
  }, []);

  // Listen for beforeinstallprompt event
  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener('beforeinstallprompt', handler);

    // Listen for app installed event
    window.addEventListener('appinstalled', () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
    });

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
    };
  }, []);

  const installApp = useCallback(async () => {
    if (!deferredPrompt) return;

    try {
      await deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      
      if (outcome === 'accepted') {
        setIsInstalled(true);
        setDeferredPrompt(null);
      }
    } catch (error) {
      console.error('Error installing PWA:', error);
    }
  }, [deferredPrompt]);

  const dismissBanner = useCallback(() => {
    localStorage.setItem(PWA_DISMISSED_KEY, 'true');
    setIsDismissed(true);
  }, []);

  const resetDismiss = useCallback(() => {
    localStorage.removeItem(PWA_DISMISSED_KEY);
    setIsDismissed(false);
  }, []);

  // canInstall is true if:
  // - We have a deferred prompt (Android/Chrome) OR it's iOS
  // - AND app is not already installed
  const canInstall = (!isInstalled) && (!!deferredPrompt || isIOS);

  return {
    canInstall,
    isInstalled,
    isDismissed,
    isIOS,
    installApp,
    dismissBanner,
    resetDismiss,
  };
}
