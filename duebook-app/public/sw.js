const CACHE = 'duebook-v7';
const SHELL = ['/due-book', '/login', '/manifest.json'];

async function precacheShellAssets(cache) {
  // Fetch each shell HTML, store it, and mine its markup for `_next/static/*`
  // URLs so the referenced JS/CSS chunks are available on the very next load —
  // even if the user goes offline immediately after installing a new version.
  const chunkUrls = new Set();
  await Promise.all(SHELL.map(async url => {
    try {
      const res = await fetch(url, { cache: 'reload' });
      if (!res.ok) return;
      const clone = res.clone();
      await cache.put(url, res);
      if (url.endsWith('.json')) return;
      const html = await clone.text();
      for (const m of html.matchAll(/(?:src|href)="(\/_next\/[^"]+)"/g)) {
        chunkUrls.add(m[1]);
      }
    } catch {}
  }));
  await Promise.all([...chunkUrls].map(async url => {
    try {
      const res = await fetch(url, { cache: 'reload' });
      if (res.ok) await cache.put(url, res);
    } catch {}
  }));
}

self.addEventListener('install', e => {
  e.waitUntil((async () => {
    const cache = await caches.open(CACHE);
    await precacheShellAssets(cache);
    await self.skipWaiting();
  })());
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);

  // Never intercept API calls or cross-origin requests
  if (url.hostname !== self.location.hostname) return;
  if (url.pathname.startsWith('/api/')) return;

  // Cache-first for hashed static assets — they are immutable
  if (url.pathname.startsWith('/_next/static/') ||
      url.pathname.match(/\.(js|css|png|jpg|jpeg|ico|svg|woff2?)$/)) {
    e.respondWith((async () => {
      const cache = await caches.open(CACHE);
      const cached = await cache.match(req);
      if (cached) return cached;
      try {
        const res = await fetch(req);
        if (res.ok) cache.put(req, res.clone());
        return res;
      } catch {
        const fallback = await cache.match(req, { ignoreSearch: true });
        if (fallback) return fallback;
        throw new Error('offline and asset not cached');
      }
    })());
    return;
  }

  // Navigation / HTML: network-first with cached-shell fallback
  const isNav = req.mode === 'navigate' ||
                (req.headers.get('accept') || '').includes('text/html');
  if (isNav) {
    e.respondWith((async () => {
      const cache = await caches.open(CACHE);
      try {
        const res = await fetch(req);
        if (res.ok) cache.put(req, res.clone());
        return res;
      } catch {
        const cached = await cache.match(req) || await cache.match('/due-book');
        if (cached) return cached;
        return new Response(
          '<!doctype html><meta charset=utf-8><title>Offline</title>' +
          '<style>body{font-family:system-ui;padding:40px;text-align:center;color:#334155}</style>' +
          '<h2>Offline</h2><p>Open the app once online to enable offline mode.</p>',
          { headers: { 'content-type': 'text/html; charset=utf-8' } }
        );
      }
    })());
  }
});
