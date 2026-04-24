// ─────────────────────────────────────────────────────────────────────────────
// Sentry exception filter
// ─────────────────────────────────────────────────────────────────────────────
// Catches every unhandled exception and:
//   - forwards 5xx (+ unknown) to Sentry with captured scope
//   - does NOT forward 4xx — client errors should not pollute Sentry
//   - always re-throws the HTTP response via the default exception flow so
//     Nest's built-in error handler shapes the JSON response
//
// Registered globally from main.ts via `app.useGlobalFilters(...)`.
// ─────────────────────────────────────────────────────────────────────────────

import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import * as Sentry from '@sentry/node';

@Catch()
export class SentryExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(SentryExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const status = this.resolveStatus(exception);
    const body = this.resolveBody(exception, status);

    // ── 5xx → capture + log ───────────────────────────────────────────────────
    if (status >= HttpStatus.INTERNAL_SERVER_ERROR) {
      this.logger.error(
        `[${status}] ${request.method} ${request.url} — ${this.stringifyError(exception)}`,
      );
      if (Sentry.isInitialized()) {
        Sentry.withScope((scope) => {
          scope.setTag('http.status_code', String(status));
          scope.setTag('http.method', request.method);
          scope.setContext('request', {
            method: request.method,
            url: request.url,
            requestId: (request as Request & { id?: string }).id,
          });
          Sentry.captureException(exception);
        });
      }
    }

    response.status(status).json(body);
  }

  private resolveStatus(exception: unknown): number {
    if (exception instanceof HttpException) return exception.getStatus();
    return HttpStatus.INTERNAL_SERVER_ERROR;
  }

  private resolveBody(exception: unknown, status: number): Record<string, unknown> {
    if (exception instanceof HttpException) {
      const resp = exception.getResponse();
      if (typeof resp === 'string') return { statusCode: status, message: resp };
      return resp as Record<string, unknown>;
    }
    return {
      statusCode: status,
      message: 'Internal server error',
      timestamp: new Date().toISOString(),
    };
  }

  private stringifyError(exception: unknown): string {
    if (exception instanceof Error) return `${exception.name}: ${exception.message}`;
    try {
      return JSON.stringify(exception);
    } catch {
      return String(exception);
    }
  }
}
