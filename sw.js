/* GattoBrowser service worker — sempre la versione aggiornata, cache solo offline */
const CACHE = 'gattobrowser-v11';
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

  e.respondWith((async () => {
    try {
      // no-cache = richiesta con revalidazione: nessun contenuto vecchio
      const res = await fetch(req, { cache: 'no-cache' });
      if (res && res.status === 200) {
        const copy = res.clone();
        caches.open(CACHE).then((c) => c.put(req, copy)).catch(() => {});
      }
      return res;
    } catch (err) {
      const hit = await caches.match(req);
      if (hit) return hit;
      if (req.mode === 'navigate') {
        const shell = await caches.match('./browser.html');
        if (shell) return shell;
      }
      return Response.error();
    }
  })());
});
