// WIER OZplus — Service Worker v3
// 1. Cache offline (cache-first)
// 2. Notificação IMEDIATA ao iniciar o timer (persistente na barra)
// 3. Notificação de conclusão quando o setTimeout disparar

const CACHE_NAME = 'ozplus-v3';

const LOCAL_FILES = [
    './ozplus.html',
    './manifest.json',
    './icon-192.png',
    './icon-512.png'
];

// ── Instalação ─────────────────────────────────────────────────────────────
self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => Promise.allSettled(LOCAL_FILES.map(u => cache.add(u).catch(() => {}))))
            .then(() => self.skipWaiting())
    );
});

// ── Ativação ───────────────────────────────────────────────────────────────
self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys()
            .then(keys => Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))))
            .then(() => self.clients.claim())
    );
});

// ── Cache offline ──────────────────────────────────────────────────────────
self.addEventListener('fetch', event => {
    if (event.request.method !== 'GET') return;
    event.respondWith(
        caches.match(event.request).then(cached => {
            if (cached) return cached;
            return fetch(event.request).then(response => {
                if (!response || response.status !== 200 || response.type === 'opaque') return response;
                const clone = response.clone();
                caches.open(CACHE_NAME).then(c => c.put(event.request, clone));
                return response;
            }).catch(() => {
                if (event.request.destination === 'document') return caches.match('./ozplus.html');
            });
        })
    );
});

// ── Timer ──────────────────────────────────────────────────────────────────
let completionTimerId = null;

self.addEventListener('message', event => {
    const { type, endTime, totalSeconds } = event.data || {};

    if (type === 'TIMER_STARTED') {
        // 1. Cancela qualquer timer anterior
        if (completionTimerId !== null) { clearTimeout(completionTimerId); completionTimerId = null; }

        // 2. Mostra notificação PERSISTENTE imediatamente na barra de notificações
        //    (Esta aparece agora, garante que o usuário veja mesmo sem setTimeout)
        const endDate   = new Date(endTime);
        const hh        = String(endDate.getHours()).padStart(2, '0');
        const mm        = String(endDate.getMinutes()).padStart(2, '0');
        const totalMins = Math.round(totalSeconds / 60);

        self.registration.showNotification('⏱ WIER OZplus — Timer em andamento', {
            body: `Ozônio ativo por ${totalMins} min. Término previsto: ${hh}h${mm}`,
            tag: 'ozplus-timer-active',
            requireInteraction: false,
            silent: true,
            renotify: false
        });

        // 3. Agenda notificação de conclusão via setTimeout
        const delay = endTime - Date.now();
        if (delay > 0) {
            completionTimerId = setTimeout(() => {
                completionTimerId = null;
                fireCompletionNotification();
            }, delay);
        } else {
            fireCompletionNotification();
        }

    } else if (type === 'TIMER_STOPPED') {
        // Cancela o setTimeout e fecha a notificação persistente
        if (completionTimerId !== null) { clearTimeout(completionTimerId); completionTimerId = null; }
        self.registration.getNotifications({ tag: 'ozplus-timer-active' })
            .then(notifs => notifs.forEach(n => n.close()));

    } else if (type === 'SCHEDULE_NOTIFICATION') {
        // Compatibilidade com código anterior
        if (completionTimerId !== null) { clearTimeout(completionTimerId); completionTimerId = null; }
        const delay = endTime - Date.now();
        if (delay > 0) {
            completionTimerId = setTimeout(() => { completionTimerId = null; fireCompletionNotification(); }, delay);
        } else {
            fireCompletionNotification();
        }

    } else if (type === 'CANCEL_NOTIFICATION') {
        if (completionTimerId !== null) { clearTimeout(completionTimerId); completionTimerId = null; }
    }
});

function fireCompletionNotification() {
    // Fecha a notificação "ativo" antes de mostrar a de conclusão
    self.registration.getNotifications({ tag: 'ozplus-timer-active' })
        .then(notifs => notifs.forEach(n => n.close()));

    self.registration.showNotification('✅ WIER OZplus — Aplicação Concluída!', {
        body: 'O tempo terminou. Ventile o ambiente por pelo menos 10 minutos antes de entrar!',
        tag: 'ozplus-timer-complete',
        requireInteraction: true,
        renotify: true,
        vibrate: [200, 100, 200, 100, 200, 100, 600]
    });
}

self.addEventListener('notificationclick', event => {
    event.notification.close();
    event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true }).then(list => {
            for (const c of list) if ('focus' in c) return c.focus();
            return clients.openWindow('./ozplus.html');
        })
    );
});
