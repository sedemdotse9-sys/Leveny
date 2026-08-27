/* ============================================================
   SW.JS — Leveny service worker
   Strategy:
   - HTML pages: network-first, falling back to cache when
     offline, so content never goes stale while online.
   - CSS/JS/fonts/icons (the "app shell"): cache-first, since
     these rarely change and should load instantly.
   Bump CACHE_VERSION whenever shell assets change so old
   caches get cleared out on the next visit.
============================================================ */

const CACHE_VERSION = 'leveny-shell-v1';

const SHELL_ASSETS = [
    '/css/design.css',
    '/css/mobile.css',
    '/css/app.css',
    '/js/script.js',
    '/js/app.js',
    '/favicon/favicon-96x96.png',
    '/favicon/icon-192.png',
    '/favicon/icon-512.png',
    '/manifest.json',
];

self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_VERSION).then((cache) => cache.addAll(SHELL_ASSETS))
    );
    self.skipWaiting();
});

self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((keys) =>
            Promise.all(
                keys.filter((key) => key !== CACHE_VERSION).map((key) => caches.delete(key))
            )
        )
    );
    self.clients.claim();
});

self.addEventListener('fetch', (event) => {
    const { request } = event;
    if (request.method !== 'GET') return;

    const isHTML = request.mode === 'navigate' || request.destination === 'document';

    if (isHTML) {
        // Network-first for pages: never serve stale movie data
        event.respondWith(
            fetch(request)
                .then((response) => {
                    const clone = response.clone();
                    caches.open(CACHE_VERSION).then((cache) => cache.put(request, clone));
                    return response;
                })
                .catch(() => caches.match(request))
        );
        return;
    }

    // Cache-first for shell assets (css/js/icons/fonts)
    event.respondWith(
        caches.match(request).then((cached) => {
            if (cached) return cached;
            return fetch(request).then((response) => {
                const clone = response.clone();
                caches.open(CACHE_VERSION).then((cache) => cache.put(request, clone));
                return response;
            });
        })
    );
});