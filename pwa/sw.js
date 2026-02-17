const CACHE_NAME = 'gt-admin-v1';
const urlsToCache = [
  '/pwa/index.html',
  '/pwa/manifest.json'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(urlsToCache))
  );
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', event => {
  event.respondWith(
    fetch(event.request)
      .then(response => {
        if (response && response.status === 200) {
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then(cache => {
            cache.put(event.request, responseClone);
          });
        }
        return response;
      })
      .catch(() => caches.match(event.request))
  );
});

// Push notification handler
self.addEventListener('push', event => {
  let data = { title: 'Georgia Trips', body: 'New notification' };
  if (event.data) {
    try {
      data = event.data.json();
    } catch (e) {
      data.body = event.data.text();
    }
  }

  const options = {
    body: data.body || data.message || 'New notification',
    icon: '/pwa/icons/icon-192.jpg',
    badge: '/pwa/icons/icon-192.jpg',
    vibrate: [300, 100, 300],
    tag: data.tag || 'default',
    renotify: true,
    requireInteraction: true,
    data: { url: '/pwa/index.html' }
  };

  event.waitUntil(
    self.registration.showNotification(data.title || 'Georgia Trips Admin', options)
  );
});

self.addEventListener('notificationclick', event => {
  event.notification.close();
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(windowClients => {
      for (const client of windowClients) {
        if (client.url.includes('/pwa/') && 'focus' in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow('/pwa/index.html');
      }
    })
  );
});
