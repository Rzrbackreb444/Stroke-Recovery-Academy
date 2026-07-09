import { useState, useEffect } from 'react';
import { apiRequest } from '@/lib/queryClient';

export type PushPermission = 'default' | 'granted' | 'denied' | 'unsupported';

export function usePushNotifications() {
  const [permission, setPermission] = useState<PushPermission>('default');
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isSupported = typeof window !== 'undefined' &&
    'serviceWorker' in navigator &&
    'PushManager' in window &&
    'Notification' in window;

  useEffect(() => {
    if (!isSupported) {
      setPermission('unsupported');
      return;
    }
    setPermission(Notification.permission as PushPermission);
    checkSubscriptionStatus();
  }, []);

  async function checkSubscriptionStatus() {
    try {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.getSubscription();
      setIsSubscribed(!!sub);
    } catch {
      setIsSubscribed(false);
    }
  }

  async function subscribe() {
    if (!isSupported) return false;
    setIsLoading(true);
    setError(null);

    try {
      // Register service worker
      const reg = await navigator.serviceWorker.register('/sw.js', { scope: '/' });
      await navigator.serviceWorker.ready;

      // Request permission
      const perm = await Notification.requestPermission();
      setPermission(perm as PushPermission);
      if (perm !== 'granted') {
        setError('Notification permission denied. Enable in browser settings to receive accountability reminders.');
        setIsLoading(false);
        return false;
      }

      // Get VAPID public key
      const vapidRes = await fetch('/api/push/vapid-key');
      const { publicKey } = await vapidRes.json();

      // Subscribe to push
      const subscription = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicKey),
      });

      const sub = subscription.toJSON();

      // Save subscription to server
      await apiRequest('POST', '/api/push/subscribe', {
        endpoint: sub.endpoint!,
        p256dh: sub.keys!.p256dh!,
        auth: sub.keys!.auth!,
        userAgent: navigator.userAgent,
      });

      setIsSubscribed(true);
      setIsLoading(false);
      return true;
    } catch (err: any) {
      setError(err.message || 'Failed to enable notifications');
      setIsLoading(false);
      return false;
    }
  }

  async function unsubscribe() {
    setIsLoading(true);
    try {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.getSubscription();
      if (sub) {
        await sub.unsubscribe();
        await apiRequest('DELETE', '/api/push/unsubscribe', { endpoint: sub.endpoint });
      }
      setIsSubscribed(false);
    } catch (err: any) {
      setError(err.message);
    }
    setIsLoading(false);
  }

  async function sendTest() {
    try {
      await apiRequest('POST', '/api/push/test', {});
    } catch (err: any) {
      setError(err.message);
    }
  }

  return { permission, isSubscribed, isLoading, error, isSupported, subscribe, unsubscribe, sendTest };
}

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}
