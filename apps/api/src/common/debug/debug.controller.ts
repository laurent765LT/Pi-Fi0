// ─────────────────────────────────────────────────────────────────────────────
// Debug / dev-only endpoints
// ─────────────────────────────────────────────────────────────────────────────
// Every route here is *disabled* when NODE_ENV === 'production' — the handler
// returns 404. They exist to:
//   - force a 500 so we can verify Sentry & the exception filter end-to-end
//   - expose the list of applied Prisma migrations to the admin panel
//
// Keep the surface tiny and route-guarded: no secrets are returned.
// ─────────────────────────────────────────────────────────────────────────────

import {
  Controller,
  Get,
  HttpException,
  HttpStatus,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma.service';

interface MigrationRow {
  id: string;
  migration_name: string;
  finished_at: Date | null;
  applied_steps_count: number;
}

@Controller('api/v1')
export class DebugController {
  constructor(private readonly prisma: PrismaService) {}

  private guardDev(): void {
    if (process.env.NODE_ENV === 'production') {
      throw new NotFoundException();
    }
  }

  // ── Force a 500 (Sentry round-trip test) ─────────────────────────────────
  @Get('test-error')
  triggerError(): never {
    this.guardDev();
    throw new InternalServerErrorException(
      'Intentional error triggered via /api/v1/test-error for Sentry monitoring test',
    );
  }

  // ── Force a 4xx (should NOT go to Sentry) ────────────────────────────────
  @Get('test-bad-request')
  triggerBadRequest(): never {
    this.guardDev();
    throw new HttpException('Intentional 400 — should not reach Sentry', HttpStatus.BAD_REQUEST);
  }

  // ── Prisma migrations status ─────────────────────────────────────────────
  // Used by /admin/system-health to show the last applied migration and
  // whether anything is pending/rolled back.
  @Get('admin/migrations')
  async listMigrations(): Promise<{
    total: number;
    last: { name: string; appliedAt: string | null } | null;
    pending: number;
  }> {
    try {
      const rows = await this.prisma.$queryRaw<MigrationRow[]>`
        SELECT id, migration_name, finished_at, applied_steps_count
        FROM "_prisma_migrations"
        ORDER BY finished_at DESC NULLS LAST
        LIMIT 50
      `;
      const last = rows[0]
        ? {
            name: rows[0].migration_name,
            appliedAt: rows[0].finished_at?.toISOString() ?? null,
          }
        : null;
      const pending = rows.filter((r) => r.finished_at === null).length;
      return { total: rows.length, last, pending };
    } catch {
      // Table missing or DB down → return a soft-degraded shape rather than 500
      return { total: 0, last: null, pending: 0 };
    }
  }
}
