// ─────────────────────────────────────────────────────────────────────────────
// Service Worker — Web Push Notifications
// Este arquivo DEVE estar na raiz do servidor para ter escopo global.
// ─────────────────────────────────────────────────────────────────────────────

self.addEventListener('install', (event) => {
  console.log('[Service Worker] Instalado');
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  console.log('[Service Worker] Ativado');
  event.waitUntil(self.clients.claim());
});

// ── Recebe o evento push vindo do servidor ────────────────────────────────────
self.addEventListener('push', (event) => {
  console.log('[Service Worker] Push recebido:', event);

  let data = {
    title: '🔔 Notificação',
    body: 'Você recebeu uma nova notificação!',
    icon: '/icon.png',
    badge: '/badge.png',
    url: '/',
    tag: 'default',
  };

  if (event.data) {
    try {
      data = { ...data, ...JSON.parse(event.data.text()) };
    } catch (e) {
      data.body = event.data.text();
    }
  }

  const options = {
    body: data.body,
    icon: data.icon,
    badge: data.badge,
    tag: data.tag,
    data: { url: data.url },
    vibrate: [200, 100, 200],
    requireInteraction: false,
    actions: [
      { action: 'open', title: '👁️ Abrir', icon: '/icon.png' },
      { action: 'close', title: '✖️ Fechar' },
    ],
  };

  event.waitUntil(self.registration.showNotification(data.title, options));
});

// ── Trata clique na notificação ───────────────────────────────────────────────
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  if (event.action === 'close') return;

  const url = event.notification.data?.url || '/';

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // Se já tem uma aba aberta, foca nela
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          return client.focus();
        }
      }
      // Caso contrário, abre nova aba
      if (self.clients.openWindow) {
        return self.clients.openWindow(url);
      }
    })
  );
});

// ── Trata push subscription change ───────────────────────────────────────────
self.addEventListener('pushsubscriptionchange', (event) => {
  console.log('[Service Worker] Subscription alterada — re-inscrevendo...');
  event.waitUntil(
    self.registration.pushManager.subscribe({ userVisibleOnly: true })
      .then((subscription) => {
        return fetch('/api/subscribe', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(subscription),
        });
      })
  );
});
