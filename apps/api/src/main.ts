// ─────────────────────────────────────────────────────────────────────────────
// NestJS bootstrap
// ─────────────────────────────────────────────────────────────────────────────
// Order matters:
//   1. initSentry()               — must run BEFORE NestFactory.create() so
//      the http integration can patch Node's http module.
//   2. NestFactory.create()       — uses the StructuredLogger.
//   3. requestContextMiddleware   — adds requestId to AsyncLocalStorage.
//   4. SentryExceptionFilter      — global filter for 5xx capture.
//   5. Structured access logging  — one JSON line per completed request.
// ─────────────────────────────────────────────────────────────────────────────

import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import compression from 'compression';

import { initSentry } from './common/sentry.init';
initSentry();

import { AppModule } from './app.module';
import { SentryExceptionFilter } from './common/filters/sentry-exception.filter';
import { StructuredLogger, currentContext } from './common/logging/structured.logger';
import { requestContextMiddleware } from './common/logging/request-context.middleware';

async function bootstrap() {
  const logger = new StructuredLogger();
  const app = await NestFactory.create(AppModule, { logger });

  // Gzip compression
  app.use(compression());

  // Cookie parser (optional at build time — auth controller has a fallback
  // that parses the raw Cookie header when this isn't installed).
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const cookieParser = require('cookie-parser');
    app.use(cookieParser());
  } catch {
    new Logger('Bootstrap').warn(
      'cookie-parser not installed — falling back to manual cookie reader.',
    );
  }

  // Request-id correlation: every downstream log line picks up the same id.
  app.use(requestContextMiddleware);

  // Structured access logging — one JSON line per completed HTTP response.
  // Liveness probe is intentionally excluded to keep log volume sane.
  app.use((req: any, res: any, next: any) => {
    const start = Date.now();
    res.on('finish', () => {
      if (req.url === '/health' || req.url === '/api/v1/health') return;
      const ms = Date.now() - start;
      const ctx = currentContext();
      const record = {
        level: res.statusCode >= 500 ? 'error' : res.statusCode >= 400 ? 'warn' : 'log',
        time: new Date().toISOString(),
        message: 'http_request',
        method: req.method,
        url: req.url,
        status: res.statusCode,
        durationMs: ms,
        requestId: ctx?.requestId ?? req.id,
        userId: ctx?.userId,
      };
      console.log(JSON.stringify(record));
    });
    next();
  });

  // Swagger API documentation
  const swaggerConfig = new DocumentBuilder()
    .setTitle("Strick'in API")
    .setDescription('API de la plateforme de distribution de produits structurés')
    .setVersion('2.1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api/docs', app, document);

  app.enableCors({
    origin:
      process.env.NODE_ENV === 'production'
        ? ['https://app.strickin.com', 'https://strickin.vercel.app', 'https://strickin-web-web.vercel.app']
        : ['http://localhost:3000', 'http://localhost:3001'],
    credentials: true,
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // Global exception filter — forwards 5xx to Sentry, leaves 4xx alone
  app.useGlobalFilters(new SentryExceptionFilter());

  // Railway (and most PaaS) expect the app to bind on 0.0.0.0 so their
  // internal health-probe can reach the container. Binding on the default
  // (127.0.0.1) makes the /health route unreachable from outside the process,
  // which is exactly what caused our "service unavailable" healthchecks.
  const port = Number(process.env.PORT ?? 4000);
  await app.listen(port, '0.0.0.0');
  logger.log(
    `[Strick'in API] Listening on 0.0.0.0:${port} (NODE_ENV=${process.env.NODE_ENV ?? 'unknown'})`,
    'Bootstrap',
  );
}

bootstrap().catch((err) => {
  // Surface boot failures (Prisma $connect, bad env, etc.) in Railway logs
  // instead of dying silently.
  // eslint-disable-next-line no-console
  console.error(
    JSON.stringify({
      level: 'error',
      time: new Date().toISOString(),
      message: 'bootstrap_failed',
      error: err instanceof Error ? { name: err.name, message: err.message, stack: err.stack } : String(err),
    }),
  );
  process.exit(1);
});
