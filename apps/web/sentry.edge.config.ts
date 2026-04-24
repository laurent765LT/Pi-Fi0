// ─────────────────────────────────────────────────────────────────────────────
// Sentry — edge runtime configuration (middleware, edge route handlers)
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
  sendDefaultPii: false,
});
