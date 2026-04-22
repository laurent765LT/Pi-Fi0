// ─── Web Push subscription manager ───────────────────────────────────────
// Wraps Notification + Push API into a small surface used by the settings
// page and mobile shell. Mock-compatible: accepts any VAPID key and never
// throws — errors are swallowed and returned as null / false so the UI can
// degrade gracefully.

/**
 * Requests permission to show browser notifications.
 * Returns the final `NotificationPermission` state (granted/denied/default).
 * Safe to call from SSR — returns "default" when Notification is absent.
 */
export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return 'default';
  }
  try {
    // Some older browsers return the permission string directly.
    const permission = await Notification.requestPermission();
    return permission;
  } catch {
    return Notification.permission;
  }
}

/**
 * Subscribes the active service worker to the push service.
 * Returns null when notifications are unavailable, denied, or if subscription
 * fails for any reason (network, invalid key, etc.).
 * The provided VAPID public key is accepted as a URL-safe base64 string —
 * we convert it to a Uint8Array as required by PushManager.subscribe.
 */
export async function subscribeToPush(
  vapidPublicKey: string,
): Promise<PushSubscription | null> {
  if (
    typeof window === 'undefined' ||
    !('serviceWorker' in navigator) ||
    !('PushManager' in window)
  ) {
    return null;
  }
  try {
    const registration = await navigator.serviceWorker.ready;
    const existing = await registration.pushManager.getSubscription();
    if (existing) return existing;

    const applicationServerKey = urlBase64ToUint8Array(vapidPublicKey);
    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      // Cast to BufferSource — PushManager accepts Uint8Array but the TS lib
      // signature only exposes BufferSource. Backed by the same ArrayBuffer.
      applicationServerKey: applicationServerKey.buffer as ArrayBuffer,
    });

    // Best-effort: notify the backend that we have a new subscription.
    // Failures are swallowed so the browser-side subscription remains valid.
    await fetch('/api/push/subscribe', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(subscription.toJSON()),
    }).catch(() => undefined);

    return subscription;
  } catch {
    return null;
  }
}

/**
 * Unsubscribes the active wallet from the push service.
 * Returns true on success, false otherwise.
 */
export async function unsubscribeFromPush(): Promise<boolean> {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
    return false;
  }
  try {
    const registration = await navigator.serviceWorker.ready;
    const sub = await registration.pushManager.getSubscription();
    if (!sub) return true;
    const ok = await sub.unsubscribe();
    return ok;
  } catch {
    return false;
  }
}

/**
 * Returns the currently active push subscription, if any.
 */
export async function getCurrentSubscription(): Promise<PushSubscription | null> {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
    return null;
  }
  try {
    const registration = await navigator.serviceWorker.ready;
    return await registration.pushManager.getSubscription();
  } catch {
    return null;
  }
}

// ─── Helper: URL-safe base64 → Uint8Array ────────────────────────────────

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData =
    typeof window !== 'undefined' && typeof window.atob === 'function'
      ? window.atob(base64)
      : Buffer.from(base64, 'base64').toString('binary');
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

// ─── Constants ────────────────────────────────────────────────────────────

/**
 * Public VAPID key used by the mock backend. Kept here so the settings page
 * can subscribe without passing arbitrary keys around. Replace with a real
 * key when a real push provider is wired.
 */
export const DEMO_VAPID_PUBLIC_KEY =
  'BHq7uL3wVaJ8eFjKmZ8V9hN6lK-X1Hm8fBdUoK7Wj0GqM_lT2pXyDc8_abCdEfGhIjKlMnOpQrStUvWxYz01234';
