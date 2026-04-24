// ─────────────────────────────────────────────────────────────────────────────
// /debug-sentry — dev-only utility page
// ─────────────────────────────────────────────────────────────────────────────
// Lets us verify Sentry ingestion from the browser without shipping an error
// to real users. Disabled in production (returns 404).
// ─────────────────────────────────────────────────────────────────────────────

'use client';

import { useState } from 'react';
import { notFound } from 'next/navigation';
import * as Sentry from '@sentry/nextjs';

export default function DebugSentryPage() {
  if (process.env.NODE_ENV === 'production') {
    notFound();
  }

  const [lastAction, setLastAction] = useState<string>('');

  const throwError = () => {
    setLastAction('throwing…');
    throw new Error('Intentional error from /debug-sentry at ' + new Date().toISOString());
  };

  const captureMessage = () => {
    Sentry.captureMessage('Test message from /debug-sentry', 'info');
    setLastAction('captureMessage sent');
  };

  const captureException = () => {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (null as any).foo.bar;
    } catch (err) {
      Sentry.captureException(err);
      setLastAction('captureException sent');
    }
  };

  const rejectPromise = () => {
    void Promise.reject(new Error('unhandled-rejection-from-debug-sentry'));
    setLastAction('promise rejected (unhandled)');
  };

  return (
    <main className="mx-auto max-w-xl p-8 font-body">
      <h1 className="text-2xl font-syne font-bold text-ink mb-2">Sentry debug</h1>
      <p className="text-ink-3 mb-6 text-sm">
        Dev-only. Click a button to emit a Sentry event. Check the{' '}
        <code className="font-mono text-xs">strickin</code> project in Sentry within ~30s.
      </p>

      <div className="flex flex-col gap-3">
        <button
          onClick={throwError}
          className="h-10 rounded-lg bg-red-600 px-4 text-sm font-semibold text-white hover:bg-red-700"
        >
          Throw synchronous error
        </button>
        <button
          onClick={captureException}
          className="h-10 rounded-lg bg-orange-500 px-4 text-sm font-semibold text-white hover:bg-orange-600"
        >
          Trigger captured TypeError
        </button>
        <button
          onClick={captureMessage}
          className="h-10 rounded-lg bg-violet px-4 text-sm font-semibold text-white hover:bg-violet/90"
        >
          Send captureMessage (info)
        </button>
        <button
          onClick={rejectPromise}
          className="h-10 rounded-lg bg-ink-3 px-4 text-sm font-semibold text-white hover:bg-ink-3/90"
        >
          Unhandled promise rejection
        </button>
      </div>

      {lastAction && (
        <p className="mt-6 rounded-md bg-surface-2 p-3 text-sm text-ink-3">
          Last action: <strong className="text-ink">{lastAction}</strong>
        </p>
      )}

      <div className="mt-8 rounded-md border border-border bg-surface-2 p-4 text-xs text-ink-3">
        <p>
          DSN:{' '}
          <code className="font-mono">
            {process.env.NEXT_PUBLIC_SENTRY_DSN ? '✓ configured' : '✗ not set'}
          </code>
        </p>
        <p>
          NODE_ENV: <code className="font-mono">{process.env.NODE_ENV}</code>
        </p>
      </div>
    </main>
  );
}
