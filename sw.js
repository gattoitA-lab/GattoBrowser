/* GattoBrowser service worker — pagine sempre aggiornate, asset in cache */
const CACHE = 'gattobrowser-v2';
const CORE = [
  './', './browser.html', './index.html', './manifest.webmanifest',
  './assets/app.css', './assets/app.js', './assets/app-ui.js', './assets/settings.js',
  './assets/tools.js', './assets/vault.js', './assets/landing.css', './assets/landing.js',
  './icon-192.png', './icon-512.png'
];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE).then((c) => c.addAll(CORE)).catch(() => {}).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return; // solo risorse dell'app

  const isHTML = req.mode === 'navigate' || (req.headers.get('accept') || '').includes('text/html');

  // Pagine: prima la rete (aggiornamenti immediati), cache solo come fallback offline
  if (isHTML) {
    e.respondWith(
      fetch(req)
        .then((res) => {
          if (res && res.status === 200) {
            const copy = res.clone();
            caches.open(CACHE).then((c) => c.put(req, copy)).catch(() => {});
          }
          return res;
        })
        .catch(() => caches.match(req).then((hit) => hit || caches.match('./browser.html')))
    );
    return;
  }

  // Asset: cache-first con aggiornamento in background
  e.respondWith(
    caches.match(req).then((hit) => {
      const net = fetch(req)
        .then((res) => {
          if (res && res.status === 200) {
            const copy = res.clone();
            caches.open(CACHE).then((c) => c.put(req, copy)).catch(() => {});
          }
          return res;
        })
        .catch(() => hit);
      return hit || net;
    })
  );
});
