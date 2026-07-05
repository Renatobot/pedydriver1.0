import { useState, useEffect, useCallback } from 'react';

function isAppShellRegistration(registration: ServiceWorkerRegistration): boolean {
  const workers = [registration.active, registration.waiting, registration.installing];

  return workers.some((worker) => {
    if (!worker?.scriptURL) return false;

    try {
      const { pathname } = new URL(worker.scriptURL);
      return pathname === '/sw.js' || pathname === '/service-worker.js';
    } catch {
      return false;
    }
  });
}

function isWorkboxCacheForScope(name: string, scopes: string[]): boolean {
  const hasWorkboxBucket = /(^|-)precache-v\d+-|(^|-)runtime-|(^|-)googleAnalytics-/.test(name);
  return hasWorkboxBucket && scopes.some((scope) => name.endsWith(scope));
}

async function cleanupAppShellServiceWorkers({ reload = false } = {}) {
  if (!('serviceWorker' in navigator)) return;

  try {
    const registrations = await navigator.serviceWorker.getRegistrations();
    const appRegistrations = registrations.filter(isAppShellRegistration);
    const scopes = appRegistrations.map((registration) => registration.scope);

    await Promise.allSettled(appRegistrations.map((registration) => registration.unregister()));

    if ('caches' in window && scopes.length > 0) {
      const cacheNames = await caches.keys();
      const appCacheNames = cacheNames.filter((name) => isWorkboxCacheForScope(name, scopes));
      await Promise.allSettled(appCacheNames.map((name) => caches.delete(name)));
    }

    if (reload && appRegistrations.length > 0) {
      window.location.reload();
    }
  } catch (error) {
    console.warn('[PWA] Failed to clean stale app shell service worker', error);
  }
}

export function usePWAUpdate() {
  const [showUpdatePrompt, setShowUpdatePrompt] = useState(false);
  const [needRefresh, setNeedRefresh] = useState(false);

  useEffect(() => {
    cleanupAppShellServiceWorkers({ reload: true });
  }, []);

  const updateApp = useCallback(async () => {
    await cleanupAppShellServiceWorkers({ reload: true });
    setShowUpdatePrompt(false);
    setNeedRefresh(false);
  }, []);

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
