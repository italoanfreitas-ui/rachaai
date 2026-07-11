// WIER OZplus — Service Worker
// Responsabilidades:
//   1. Cache offline (cache-first): app funciona sem internet após 1ª carga
//   2. Notificações em background quando o timer encerra

const CACHE_NAME = 'ozplus-v2';

// Arquivos locais pré-cacheados na instalação
const LOCAL_FILES = [
    './ozplus.html',
    './manifest.json',
    './icon-192.png',
    './icon-512.png'
];

// ── Instalação: pré-cache dos arquivos locais ──────────────────────────────
self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME).then(cache =>
            // allSettled: não falha se ícones ainda não existirem
            Promise.allSettled(LOCAL_FILES.map(url => cache.add(url).catch(() => {})))
        ).then(() => self.skipWaiting())
    );
});

// ── Ativação: limpa caches antigas ────────────────────────────────────────
self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys()
            .then(keys => Promise.all(
                keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))
            ))
            .then(() => self.clients.claim())
    );
});

// ── Fetch: cache-first (CDN e tudo mais cacheado na 1ª vez) ───────────────
self.addEventListener('fetch', event => {
    if (event.request.method !== 'GET') return;

    event.respondWith(
        caches.match(event.request).then(cached => {
            // Servido do cache → funciona offline
            if (cached) return cached;

            // Não está no cache → busca na rede e armazena para próxima vez
            return fetch(event.request)
                .then(response => {
                    // Não cacheia respostas inválidas ou opacas (ex: imagens cross-origin sem CORS)
                    if (!response || response.status !== 200 || response.type === 'opaque') {
                        return response;
                    }
                    const clone = response.clone();
                    caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
                    return response;
                })
                .catch(() => {
                    // Sem rede e sem cache: retorna o HTML principal (evita tela em branco)
                    if (event.request.destination === 'document') {
                        return caches.match('./ozplus.html');
                    }
                });
        })
    );
});

// ── Timer de notificação em background ────────────────────────────────────
let pendingTimerId = null;

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
