// Service Worker for Push Notifications (Admin + User Reminders)
self.addEventListener('install', (event) => {
  console.log('[SW Push] Installing...');
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  console.log('[SW Push] Activating...');
  event.waitUntil(clients.claim());
});

self.addEventListener('push', (event) => {
  console.log('[SW Push] Push received:', event);

  let data = {
    title: 'PEDY Driver',
    body: 'Nova notificação',
    icon: '/icons/icon-192.png',
    url: '/'
  };

  try {
    if (event.data) {
      const payload = event.data.json();
      data = { ...data, ...payload };
    }
  } catch (e) {
    console.log('[SW Push] Error parsing push data:', e);
    if (event.data) {
      data.body = event.data.text();
    }
  }

  // Determine if it's admin or user notification
  const isAdmin = data.url && data.url.includes('/admin');
  const tag = data.tag || (isAdmin ? 'admin-notification' : 'user-notification');

  const options = {
    body: data.body,
    icon: data.icon || '/icons/icon-192.png',
    badge: '/icons/icon-192.png',
    vibrate: [200, 100, 200],
    tag: tag,
    renotify: true,
    requireInteraction: tag === 'admin-notification', // Only admin notifications require interaction
    data: {
      url: data.url || '/'
    },
    actions: isAdmin ? [
      {
        action: 'open',
        title: 'Abrir'
      },
      {
        action: 'close',
        title: 'Fechar'
      }
    ] : [
      {
        action: 'open',
        title: 'Registrar'
      },
      {
        action: 'close',
        title: 'Depois'
      }
    ]
  };

  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

self.addEventListener('notificationclick', (event) => {
  console.log('[SW Push] Notification clicked:', event);
  
  event.notification.close();

  if (event.action === 'close') {
    return;
  }

  const urlToOpen = event.notification.data?.url || '/';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        // Try to find an existing window
        for (const client of clientList) {
          if ('focus' in client) {
            return client.focus().then(() => {
              if ('navigate' in client) {
                return client.navigate(urlToOpen);
              }
            });
          }
        }
        // If no existing window, open a new one
        if (clients.openWindow) {
          return clients.openWindow(urlToOpen);
        }
      })
  );
});

self.addEventListener('notificationclose', (event) => {
  console.log('[SW Push] Notification closed:', event);
});
