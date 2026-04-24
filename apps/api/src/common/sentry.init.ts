// ─────────────────────────────────────────────────────────────────────────────
// Sentry — backend initialisation (NestJS / Node)
// ─────────────────────────────────────────────────────────────────────────────
// Called once from main.ts *before* NestFactory.create(), so that Sentry's
// Http integration can auto-instrument incoming requests.
//
// Controlled by:
//   SENTRY_DSN_API           — DSN of the "strickin-api" Sentry project
//   FEATURE_SENTRY_ENABLED   — 'true' | 'false' kill-switch
//   NODE_ENV                 — used as `environment`
//   GIT_COMMIT               — optional release tag
// ─────────────────────────────────────────────────────────────────────────────

import * as Sentry from '@sentry/node';

const SENSITIVE_KEYS = new Set([
  'password',
  'authorization',
  'cookie',
  'token',
  'apikey',
  'api_key',
  'secret',
  'creditcard',
  'credit_card',
  'iban',
]);

/**
 * Strip known-sensitive fields from arbitrary request payloads before they
 * are ever shipped to Sentry. Recursive, defensive, never throws.
 */
function scrubSensitive(input: unknown): unknown {
  if (input == null) return input;
  if (Array.isArray(input)) return input.map(scrubSensitive);
  if (typeof input === 'object') {
    const out: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(input as Record<string, unknown>)) {
      const lowered = key.toLowerCase().replace(/[_-]/g, '');
      if (SENSITIVE_KEYS.has(lowered)) {
        out[key] = '[redacted]';
      } else {
        out[key] = scrubSensitive(value);
      }
    }
    return out;
  }
  return input;
}

export function initSentry(): void {
  const dsn = process.env.SENTRY_DSN_API;
  const flagOff = process.env.FEATURE_SENTRY_ENABLED === 'false';

  if (!dsn || flagOff) {
    // Intentional: leave Sentry uninitialised. `Sentry.isInitialized()` will
    // return false everywhere and capture calls become no-ops.
    // eslint-disable-next-line no-console
    console.log('[Sentry] disabled (no DSN or flag off)');
    return;
  }

  Sentry.init({
    dsn,
    environment: process.env.NODE_ENV,
    release: process.env.GIT_COMMIT,
    tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.2 : 1.0,
    // Profiling is gated behind @sentry/profiling-node which isn't installed
    // yet — keep it disabled rather than throwing on boot.
    profilesSampleRate: 0,
    integrations: [Sentry.httpIntegration()],
    sendDefaultPii: false,
    beforeSend(event) {
      if (event.request) {
        if (event.request.data) event.request.data = scrubSensitive(event.request.data) as typeof event.request.data;
        if (event.request.headers) {
          event.request.headers = scrubSensitive(event.request.headers) as typeof event.request.headers;
        }
      }
      if (event.user) {
        event.user = { id: event.user.id };
      }
      return event;
    },
  });

  // eslint-disable-next-line no-console
  console.log(`[Sentry] initialised (env=${process.env.NODE_ENV ?? 'unknown'})`);
}
