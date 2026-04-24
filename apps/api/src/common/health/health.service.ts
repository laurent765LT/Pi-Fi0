// ─────────────────────────────────────────────────────────────────────────────
// Health service — runs the actual DB / Redis / Anthropic checks
// ─────────────────────────────────────────────────────────────────────────────
// Each dependency is probed in parallel. Any single probe that throws is
// captured locally and reported as `{ status: 'down' }` — we never let a
// single flaky dependency take the /ready endpoint offline.
// ─────────────────────────────────────────────────────────────────────────────

import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { RedisService } from '../redis.service';
import type {
  HealthPayload,
  HealthStatus,
  ReadyPayload,
  ServiceCheck,
} from './health.types';

const API_VERSION = '2.1.0';

@Injectable()
export class HealthService {
  private readonly logger = new Logger(HealthService.name);
  private readonly startedAt = Date.now();

  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
  ) {}

  liveness(): HealthPayload {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: Math.round(process.uptime()),
      version: API_VERSION,
      commit: process.env.GIT_COMMIT ?? 'dev',
      node: process.version,
    };
  }

  async readiness(): Promise<ReadyPayload> {
    const [db, redis, anthropic] = await Promise.all([
      this.checkDb(),
      this.checkRedis(),
      this.checkAnthropic(),
    ]);

    const overall: HealthStatus =
      db.status === 'ok' && redis.status === 'ok' && anthropic.status === 'ok'
        ? 'ok'
        : 'degraded';

    return {
      status: overall,
      timestamp: new Date().toISOString(),
      uptime: Math.round(process.uptime()),
      version: API_VERSION,
      commit: process.env.GIT_COMMIT ?? 'dev',
      services: { db, redis, anthropic },
    };
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Individual checks
  // ─────────────────────────────────────────────────────────────────────────

  private async checkDb(): Promise<ServiceCheck> {
    const start = Date.now();
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      return { status: 'ok', latencyMs: Date.now() - start };
    } catch (err) {
      const message = err instanceof Error ? err.message : 'unknown';
      this.logger.warn(`db check failed: ${message}`);
      return { status: 'down', latencyMs: Date.now() - start, error: message };
    }
  }

  private async checkRedis(): Promise<ServiceCheck> {
    const start = Date.now();
    try {
      // Use the public API of RedisService. `set + get` round-trip on a
      // short-lived key is a good liveness probe that also exercises the
      // in-memory fallback when Upstash is unavailable.
      const key = `__health:${start}`;
      await this.redis.setex(key, 10, '1');
      const val = await this.redis.get(key);
      if (val !== '1') {
        return {
          status: 'degraded',
          latencyMs: Date.now() - start,
          error: 'roundtrip mismatch',
        };
      }
      return { status: 'ok', latencyMs: Date.now() - start };
    } catch (err) {
      const message = err instanceof Error ? err.message : 'unknown';
      return { status: 'down', latencyMs: Date.now() - start, error: message };
    }
  }

  private checkAnthropic(): ServiceCheck {
    // We don't hit Anthropic during readiness probes (cost + latency). We only
    // verify the key is configured — actual reachability is monitored via the
    // AIInteraction log table and the separate /admin/ai-health page.
    const key = process.env.ANTHROPIC_API_KEY;
    if (!key) {
      return { status: 'degraded', error: 'ANTHROPIC_API_KEY not set' };
    }
    if (!key.startsWith('sk-ant-')) {
      return { status: 'degraded', error: 'invalid key format' };
    }
    return { status: 'ok' };
  }
}
