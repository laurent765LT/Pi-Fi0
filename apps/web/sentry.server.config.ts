// ─────────────────────────────────────────────────────────────────────────────
// Sentry — server configuration (Next.js Node runtime)
// ─────────────────────────────────────────────────────────────────────────────
// Used for SSR / Route Handlers / Server Actions running in the Node runtime.
// Edge runtime uses sentry.edge.config.ts instead.
// ─────────────────────────────────────────────────────────────────────────────

import * as Sentry from '@sentry/nextjs';

const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN;
const enabledFlag = process.env.FEATURE_SENTRY_ENABLED ?? process.env.NEXT_PUBLIC_FEATURE_SENTRY_ENABLED;
const enabled = Boolean(dsn) && enabledFlag !== 'false';

Sentry.init({
  dsn,
  enabled,
  environment: process.env.NODE_ENV,
  release: process.env.NEXT_PUBLIC_GIT_COMMIT,
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.2 : 1.0,
  // Don't send PII automatically — headers, cookies, IPs are off by default
  sendDefaultPii: false,
});
