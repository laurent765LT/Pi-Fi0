// ─────────────────────────────────────────────────────────────────────────────
// Sentry — client (browser) configuration
// ─────────────────────────────────────────────────────────────────────────────
// Governs browser-side error reporting + session replay for the Next.js app.
// Controlled by two env flags:
//   - NEXT_PUBLIC_SENTRY_DSN : DSN; empty = no SDK init
//   - FEATURE_SENTRY_ENABLED : 'true' | 'false' ; hard kill-switch
//
// PII scrubbing: beforeSend strips email / phone / IBAN / CNI before dispatch.
// ─────────────────────────────────────────────────────────────────────────────

import * as Sentry from '@sentry/nextjs';
import type { ErrorEvent, EventHint } from '@sentry/nextjs';

const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN;
const enabledFlag = process.env.NEXT_PUBLIC_FEATURE_SENTRY_ENABLED ?? process.env.FEATURE_SENTRY_ENABLED;
const enabled = Boolean(dsn) && enabledFlag !== 'false';

// Regex patterns for PII scrubbing ---------------------------------------------
// Kept intentionally conservative to avoid over-masking legitimate payloads.
const EMAIL_RE = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
const PHONE_RE = /(\+?\d{1,3}[\s.-]?)?(\(?\d{2,4}\)?[\s.-]?){2,5}\d{2,4}/g;
const IBAN_RE = /\b[A-Z]{2}\d{2}(?:[\s-]?[A-Z0-9]{4}){2,7}[A-Z0-9]{1,4}\b/g;
const CNI_RE = /\b\d{12}\b/g; // French CNI = 12-digit number

function scrubPii(input: unknown): unknown {
  if (typeof input === 'string') {
    return input
      .replace(EMAIL_RE, '[email]')
      .replace(IBAN_RE, '[iban]')
      .replace(CNI_RE, '[cni]')
      .replace(PHONE_RE, (m) => (m.length >= 9 ? '[phone]' : m));
  }
  if (Array.isArray(input)) return input.map(scrubPii);
  if (input && typeof input === 'object') {
    const out: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(input as Record<string, unknown>)) {
      const lowered = key.toLowerCase();
      if (
        lowered.includes('password') ||
        lowered.includes('token') ||
        lowered.includes('authorization') ||
        lowered.includes('cookie') ||
        lowered.includes('secret') ||
        lowered.includes('apikey') ||
        lowered === 'iban'
      ) {
        out[key] = '[redacted]';
      } else {
        out[key] = scrubPii(value);
      }
    }
    return out;
  }
  return input;
}

Sentry.init({
  dsn,
  enabled,
  environment: process.env.NODE_ENV,
  release: process.env.NEXT_PUBLIC_GIT_COMMIT,
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.2 : 1.0,
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1.0,
  integrations: [
    Sentry.replayIntegration({
      maskAllText: true,
      blockAllMedia: true,
    }),
  ],
  beforeSend(event: ErrorEvent, _hint: EventHint): ErrorEvent | null {
    if (!enabled) return null;

    // Strip user PII — we only keep the opaque id
    if (event.user) {
      event.user = { id: event.user.id };
    }

    // Scrub request body / querystring / headers
    if (event.request) {
      if (event.request.data) event.request.data = scrubPii(event.request.data) as typeof event.request.data;
      if (event.request.query_string)
        event.request.query_string = scrubPii(event.request.query_string) as typeof event.request.query_string;
      if (event.request.headers)
        event.request.headers = scrubPii(event.request.headers) as typeof event.request.headers;
    }

    // Scrub breadcrumbs
    if (event.breadcrumbs) {
      event.breadcrumbs = event.breadcrumbs.map((crumb) => ({
        ...crumb,
        message: typeof crumb.message === 'string' ? (scrubPii(crumb.message) as string) : crumb.message,
        data: crumb.data ? (scrubPii(crumb.data) as Record<string, unknown>) : crumb.data,
      }));
    }

    return event;
  },
});
