// WIER OZplus — Service Worker para notificações em segundo plano
// Permite disparar alertas mesmo quando o navegador está minimizado ou bloqueado (Android)

let pendingTimerId = null;

self.addEventListener('install', () => self.skipWaiting());

self.addEventListener('activate', event => {
    event.waitUntil(self.clients.claim());
});

self.addEventListener('message', event => {
    const { type, endTime } = event.data || {};

    if (type === 'SCHEDULE_NOTIFICATION') {
        if (pendingTimerId !== null) {
            clearTimeout(pendingTimerId);
            pendingTimerId = null;
        }

        const delay = endTime - Date.now();

        if (delay <= 0) {
            fireCompletionNotification();
            return;
        }

        pendingTimerId = setTimeout(() => {
            pendingTimerId = null;
            fireCompletionNotification();
        }, delay);

    } else if (type === 'CANCEL_NOTIFICATION') {
        if (pendingTimerId !== null) {
            clearTimeout(pendingTimerId);
            pendingTimerId = null;
        }
    }
});

function fireCompletionNotification() {
    self.registration.showNotification('WIER OZplus — Aplicação Concluída! ✅', {
        body: 'O tempo programado terminou. Ventile o ambiente por pelo menos 10 minutos antes de entrar!',
        requireInteraction: true,
        vibrate: [200, 100, 200, 100, 200, 100, 600],
        tag: 'ozplus-timer-complete',
        renotify: true
    });
}

self.addEventListener('notificationclick', event => {
    event.notification.close();
    event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true })
            .then(windowClients => {
                for (const client of windowClients) {
                    if ('focus' in client) return client.focus();
                }
                return clients.openWindow('./ozplus.html');
            })
    );
});
