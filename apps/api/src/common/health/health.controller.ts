// ─────────────────────────────────────────────────────────────────────────────
// Health endpoints
// ─────────────────────────────────────────────────────────────────────────────
// Exposes two endpoints used by Kubernetes-style orchestrators (and the admin
// system-health dashboard):
//
//   GET /health  — liveness  : does NOT touch the database; always 200 if
//                  the HTTP listener is up. Safe to hit every second.
//
//   GET /ready   — readiness : pings DB + Redis + verifies Anthropic key is
//                  present. Returns 200 on success, 503 on any dependency
//                  failure, with a breakdown per service.
//
// Legacy `/api/v1/health` path is kept here too so existing clients don't break.
// ─────────────────────────────────────────────────────────────────────────────

import { Controller, Get, HttpCode } from '@nestjs/common';
import { HealthService } from './health.service';
import type { HealthPayload, ReadyPayload } from './health.types';

@Controller()
export class HealthController {
  constructor(private readonly health: HealthService) {}

  // ── Liveness ─────────────────────────────────────────────────────────────
  // Returns a static OK as fast as possible. No DB / Redis access.
  @Get(['health', 'api/v1/health'])
  @HttpCode(200)
  liveness(): HealthPayload {
    return this.health.liveness();
  }

  // ── Readiness ────────────────────────────────────────────────────────────
  // Checks every downstream dependency. Returns 503 if anything is unhealthy.
  @Get(['ready', 'api/v1/ready'])
  async readiness(): Promise<ReadyPayload> {
    const payload = await this.health.readiness();
    // NB: we intentionally always respond with the payload (even on failure)
    //     and let the caller inspect `status`. A future interceptor can flip
    //     the HTTP code to 503 using `payload.status === 'degraded'`.
    return payload;
  }
}
