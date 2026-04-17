const CACHE_NAME = 'sasquatch-recovery-v1';

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(clients.claim());
});

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
