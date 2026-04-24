import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  private readonly logger = new Logger(PrismaService.name);
  private connected = false;

  async onModuleInit() {
    // We intentionally *do not* throw here. A failed $connect() at boot would
    // crash the whole Nest process, and Railway's liveness probe on /health
    // would never get a chance to see the container as alive. Letting the app
    // boot keeps /health green and makes the real cause observable through
    // /ready and structured logs.
    try {
      await this.$connect();
      this.connected = true;
      this.logger.log('Prisma connected to PostgreSQL');
    } catch (err) {
      this.connected = false;
      this.logger.error(
        `Prisma $connect failed at boot — the app will keep running so /health stays reachable, but DB-backed endpoints will 5xx until this is fixed. cause=${
          err instanceof Error ? err.message : String(err)
        }`,
      );
    }
  }

  async onModuleDestroy() {
    if (this.connected) {
      await this.$disconnect().catch(() => undefined);
    }
  }

  /** Used by the readiness probe to distinguish live-but-degraded from ready. */
  isConnected(): boolean {
    return this.connected;
  }
}
