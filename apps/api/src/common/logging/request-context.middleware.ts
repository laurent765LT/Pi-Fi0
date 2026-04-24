// ─────────────────────────────────────────────────────────────────────────────
// Request-context middleware
// ─────────────────────────────────────────────────────────────────────────────
// Wraps every incoming HTTP request in an AsyncLocalStorage scope containing
// a unique `requestId`. All subsequent `StructuredLogger` calls during that
// request automatically include the id → logs are trivially correlatable.
//
// Also:
//   - reads an existing `x-request-id` header (keeps tracing from upstream)
//   - echoes the id back on the response
// ─────────────────────────────────────────────────────────────────────────────

import { randomUUID } from 'node:crypto';
import type { NextFunction, Request, Response } from 'express';
import { runWithContext } from './structured.logger';

function resolveHeaderValue(v: string | string[] | undefined): string | undefined {
  if (Array.isArray(v)) return v[0];
  return v;
}

export function requestContextMiddleware(req: Request, res: Response, next: NextFunction): void {
  const incoming = resolveHeaderValue(req.headers['x-request-id']);
  const requestId: string = incoming && incoming.length > 0 ? incoming : randomUUID();

  res.setHeader('x-request-id', requestId);
  (req as Request & { id?: string }).id = requestId;

  runWithContext({ requestId }, () => next());
}
