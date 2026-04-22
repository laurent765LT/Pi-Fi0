'use client';

/**
 * Web Push wrapper.
 *
 * In demo mode we use the browser Notification API directly
 * (same-origin, no Service Worker push needed).
 *
 * For production push (from backend), register a service worker
 * and subscribe via `navigator.serviceWorker.ready.then(r => r.pushManager.subscribe(...))`.
 */

function isBrowser(): boolean {
  return typeof window !== 'undefined';
}

function isSupported(): boolean {
  return isBrowser() && 'Notification' in window;
}

export async function requestPushPermission(): Promise<PermissionState> {
  if (!isSupported()) return 'denied';

  // Notification.permission returns 'default' | 'granted' | 'denied'
  if (Notification.permission === 'granted') return 'granted';
  if (Notification.permission === 'denied') return 'denied';

  try {
    const result = await Notification.requestPermission();
    if (result === 'granted') return 'granted';
    if (result === 'denied') return 'denied';
    return 'prompt';
  } catch {
    return 'denied';
  }
}

export async function sendPushNotification(
  title: string,
  body: string,
  url: string,
): Promise<void> {
  if (!isSupported()) return;
  if (Notification.permission !== 'granted') return;

  try {
    const notif = new Notification(title, {
      body,
      icon: '/favicon.ico',
      badge: '/favicon.ico',
      tag: url, // deduplicates notifications pointing to the same URL
    });

    notif.onclick = () => {
      try {
        window.focus();
        window.location.href = url;
      } catch {
        // noop
      }
      notif.close();
    };
  } catch (err) {
    // eslint-disable-next-line no-console
    console.warn('[push-service] failed to show notification', err);
  }
}

export function getPushPermission(): PermissionState | 'unsupported' {
  if (!isSupported()) return 'unsupported';
  if (Notification.permission === 'granted') return 'granted';
  if (Notification.permission === 'denied') return 'denied';
  return 'prompt';
}
