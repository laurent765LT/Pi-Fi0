// ─────────────────────────────────────────────────────────────────────────────
// Structured logger (zero-dep Pino-compatible subset)
// ─────────────────────────────────────────────────────────────────────────────
// NestJS ships with a Logger that writes pretty-printed strings to stdout —
// fine for dev, but not machine-parseable in prod. We replace it with:
//   - JSON output in production (ingested by Railway → Datadog / CloudWatch)
//   - Pretty output in development
//   - Automatic redaction of sensitive fields
//   - Per-request correlation via AsyncLocalStorage ("requestId")
//
// Pino would be nicer long-term, but adding a native build dep now would
// complicate the Railway build. This file can be swapped for `nestjs-pino`
// without touching any call-site.
// ─────────────────────────────────────────────────────────────────────────────

import { AsyncLocalStorage } from 'node:async_hooks';
import type { LoggerService, LogLevel } from '@nestjs/common';

const REDACTION_KEYS = new Set([
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
  'jwt',
  'refreshtoken',
  'refresh_token',
]);

const LEVEL_ORDER: Record<LogLevel, number> = {
  fatal: 60,
  error: 50,
  warn: 40,
  log: 30,
  debug: 20,
  verbose: 10,
};

function redact(value: unknown, depth = 0): unknown {
  if (depth > 6 || value == null) return value;
  if (Array.isArray(value)) return value.map((v) => redact(v, depth + 1));
  if (typeof value === 'object') {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      const norm = k.toLowerCase().replace(/[_-]/g, '');
      if (REDACTION_KEYS.has(norm)) out[k] = '[redacted]';
      else out[k] = redact(v, depth + 1);
    }
    return out;
  }
  return value;
}

export interface RequestContext {
  requestId: string;
  userId?: string;
  orgId?: string;
}

const storage = new AsyncLocalStorage<RequestContext>();

export function runWithContext<T>(ctx: RequestContext, fn: () => T): T {
  return storage.run(ctx, fn);
}

export function currentContext(): RequestContext | undefined {
  return storage.getStore();
}

// ─── Logger impl ─────────────────────────────────────────────────────────────

export class StructuredLogger implements LoggerService {
  private readonly pretty: boolean;
  private readonly threshold: number;

  constructor() {
    this.pretty = process.env.NODE_ENV !== 'production';
    const level = (process.env.LOG_LEVEL ?? 'log') as LogLevel;
    this.threshold = LEVEL_ORDER[level] ?? LEVEL_ORDER.log;
  }

  log(message: unknown, context?: string): void {
    this.write('log', message, context);
  }
  error(message: unknown, stack?: string, context?: string): void {
    this.write('error', message, context, stack);
  }
  warn(message: unknown, context?: string): void {
    this.write('warn', message, context);
  }
  debug(message: unknown, context?: string): void {
    this.write('debug', message, context);
  }
  verbose(message: unknown, context?: string): void {
    this.write('verbose', message, context);
  }

  private write(level: LogLevel, message: unknown, context?: string, stack?: string): void {
    if (LEVEL_ORDER[level] < this.threshold) return;

    const ctx = currentContext();
    const record: Record<string, unknown> = {
      level,
      time: new Date().toISOString(),
      message: typeof message === 'string' ? message : redact(message),
      context,
    };
    if (stack) record.stack = stack;
    if (ctx?.requestId) record.requestId = ctx.requestId;
    if (ctx?.userId) record.userId = ctx.userId;
    if (ctx?.orgId) record.orgId = ctx.orgId;

    if (this.pretty) {
      const tag = context ? ` [${context}]` : '';
      const reqId = ctx?.requestId ? ` {${ctx.requestId.slice(0, 8)}}` : '';
      const line = `${record.time} ${level.toUpperCase()}${tag}${reqId} ${typeof message === 'string' ? message : JSON.stringify(record.message)}`;
      if (level === 'error' || level === 'warn') console.error(line);
      else console.log(line);
      if (stack) console.error(stack);
    } else {
      // Single JSON line per log event — one `console.log` call = atomic write
      console.log(JSON.stringify(record));
    }
  }
}

// Shared singleton so call sites outside Nest's DI can still use it.
export const logger = new StructuredLogger();
