/* Stroke Recovery Academy service worker
   - Push notifications (medication, appointment, check-in)
   - Offline caching for unlocked course assets (P4-04)
*/

const STATIC_CACHE = 'sra-static-v5';
const COURSE_CACHE = 'sra-course-v5';
const RUNTIME_CACHE = 'sra-runtime-v5';
const CACHE_VERSIONS = [STATIC_CACHE, COURSE_CACHE, RUNTIME_CACHE];

const STATIC_ASSETS = [
  '/',
  '/recovery/dashboard',
  '/manifest.webmanifest',
  '/favicon.jpg',
  '/offline.html',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then((c) => c.addAll(STATIC_ASSETS).catch(() => null))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => !CACHE_VERSIONS.includes(k)).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

/* ---------------- Course-asset caching API ---------------- */
/* The app posts { type: 'CACHE_COURSE', courseId, urls: [...] } when a user opens a course
   for the first time after unlock. We pre-fetch transcripts, captions, manifests, and the
   first chunk of HLS so the lesson plays even with no signal. */
self.addEventListener('message', (event) => {
  const data = event.data || {};
  if (data.type === 'CACHE_COURSE' && Array.isArray(data.urls)) {
    event.waitUntil((async () => {
      const cache = await caches.open(COURSE_CACHE);
      await Promise.all(
        data.urls.map((u) =>
          fetch(u, { credentials: 'include' })
            .then((r) => (r && r.ok ? cache.put(u, r.clone()) : null))
            .catch(() => null)
        )
      );
      const client = event.source;
      if (client && 'postMessage' in client) {
        client.postMessage({ type: 'CACHE_COURSE_DONE', courseId: data.courseId, count: data.urls.length });
      }
    })());
  } else if (data.type === 'CLEAR_COURSE_CACHE') {
    event.waitUntil(caches.delete(COURSE_CACHE));
  } else if (data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

/* ---------------- Fetch strategy ----------------
   - GET HTML navigations: network-first, fall back to cached shell, then /offline.html
   - Course assets (uploads/captions, /api/lessons/:id/video, *.m3u8/.ts, *.vtt): cache-first
   - Other GETs: stale-while-revalidate from RUNTIME_CACHE */
self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;

  // Never intercept API requests. They are per-user and auth-bearing; the
  // stale-while-revalidate path below served stale list data after writes
  // (a saved journal entry never appeared until a hard reload) and could leak
  // one user's cached API response to the next user on a shared browser.
  if (url.pathname.startsWith('/api/')) return;

  // HTML navigations
  if (req.mode === 'navigate' || (req.headers.get('accept') || '').includes('text/html')) {
    event.respondWith((async () => {
      try {
        const fresh = await fetch(req);
        const c = await caches.open(STATIC_CACHE);
        c.put(req, fresh.clone()).catch(() => null);
        return fresh;
      } catch {
        const cached = await caches.match(req);
        return cached || (await caches.match('/offline.html')) ||
          new Response('<h1>Offline</h1>', { headers: { 'Content-Type': 'text/html' } });
      }
    })());
    return;
  }

  // Cache only public/static course assets — never auth-bearing API responses,
  // since the SW cache is shared across users on the same browser origin and
  // would leak private lesson metadata to a subsequent signed-in user.
  const isCourseAsset =
    url.pathname.startsWith('/uploads/captions/') ||
    url.pathname.startsWith('/uploads/videos/') ||
    /\.(m3u8|ts|vtt|mp4|webm)$/i.test(url.pathname);

  if (isCourseAsset) {
    event.respondWith((async () => {
      const cached = await caches.match(req);
      if (cached) return cached;
      try {
        const fresh = await fetch(req);
        if (fresh && fresh.ok) {
          const cache = await caches.open(COURSE_CACHE);
          cache.put(req, fresh.clone()).catch(() => null);
        }
        return fresh;
      } catch {
        return cached || Response.error();
      }
    })());
    return;
  }

  // Stale-while-revalidate for everything else GET
  event.respondWith((async () => {
    const cache = await caches.open(RUNTIME_CACHE);
    const cached = await cache.match(req);
    const network = fetch(req).then((res) => {
      if (res && res.ok) cache.put(req, res.clone()).catch(() => null);
      return res;
    }).catch(() => cached);
    return cached || network;
  })());
});

/* ---------------- Push (existing) ---------------- */
self.addEventListener('push', (event) => {
  if (!event.data) return;

  let data;
  try {
    data = event.data.json();
  } catch {
    data = { title: 'Sasquatch Recovery', body: event.data.text(), icon: '/favicon.ico' };
  }

  const { title, body, icon, badge, tag, url, type } = data;

  const icons = {
    medication: '/icons/pill.png',
    appointment: '/icons/calendar.png',
    hydration: '/icons/water.png',
    exercise: '/icons/exercise.png',
    checkin: '/icons/check.png',
    default: '/favicon.ico',
  };

  const options = {
    body: body || "Time to check in, Warrior.",
    icon: icon || icons[type] || icons.default,
    badge: badge || '/favicon.ico',
    tag: tag || type || 'recovery',
    requireInteraction: type === 'medication' || type === 'appointment',
    vibrate: [200, 100, 200],
    data: { url: url || '/recovery/dashboard', type },
    actions: type === 'medication'
      ? [
          { action: 'taken', title: 'Taken' },
          { action: 'snooze', title: 'Snooze 15min' },
        ]
      : type === 'checkin'
      ? [
          { action: 'checkin', title: 'Check In Now' },
          { action: 'dismiss', title: 'Later' },
        ]
      : [{ action: 'open', title: 'Open' }],
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const action = event.action;
  const { url, type } = event.notification.data || {};

  let targetUrl = url || '/recovery/dashboard';

  if (action === 'taken') targetUrl = '/recovery/reminders?action=taken';
  else if (action === 'snooze') targetUrl = '/recovery/reminders?action=snooze';
  else if (action === 'checkin') targetUrl = '/recovery/dashboard?checkin=1';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          client.navigate(targetUrl);
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
    })
  );
});
