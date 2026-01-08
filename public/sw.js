self.addEventListener('install', (e) => {
    e.waitUntil(
        caches.open('jobee-store').then((cache) => cache.addAll([
            '/',
            '/index.html',
            '/index.css',
            '/manifest.json'
        ])),
    );
});

self.addEventListener('fetch', (e) => {
    e.respondWith(
        caches.match(e.request).then((response) => response || fetch(e.request)),
    );
});
