'use client';

import { useEffect } from 'react';

/**
 * Registers the service worker on mount.
 * Mounted once at the root layout so the registration happens as early as
 * possible after hydration. Errors are swallowed because service-worker
 * failures are not critical for the app to run.
 */
export function ServiceWorkerRegistrar() {
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!('serviceWorker' in navigator)) return;
    // Register with module error handling
    navigator.serviceWorker.register('/sw.js').catch((err) => {
      // eslint-disable-next-line no-console
      console.error('SW registration failed:', err);
    });
  }, []);

  return null;
}
