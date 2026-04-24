import { Injectable, Logger } from '@nestjs/common';
import { createHash } from 'node:crypto';
import { PrismaService } from '../../common/prisma.service';

export type AuditAction =
  | 'LOGIN'
  | 'LOGIN_FAILED'
  | 'LOGOUT'
  | 'REGISTER'
  | 'REGISTER_FAILED'
  | 'TOKEN_REFRESH'
  | 'TOKEN_REFRESH_FAILED';

export interface AuditEntry {
  userId: string | null;
  action: AuditAction;
  ipAddress: string | null;
  userAgent: string | null;
  payload: Record<string, unknown>;
}

/**
 * Tamper-evident audit log.
 *
 * Each record stores `hashPrev` + `hashCurrent`, where
 *   hashCurrent = SHA256( hashPrev + JSON.stringify(payload) + timestamp )
 * forming a hash chain — any retroactive edit invalidates every subsequent
 * entry. The chain starts with `hashPrev = '0'` for the very first record.
 *
 * If the underlying `AuditLog` Prisma model isn't available (e.g. schema
 * migration still in progress), we fall back to `ActivityLog` or simply log
 * the entry to the console. The auth flow MUST never fail because of an
 * audit-log write error.
 */
@Injectable()
export class AuditLogService {
  private readonly logger = new Logger(AuditLogService.name);

  constructor(private readonly prisma: PrismaService) {}

  private get auditModel(): {
    findFirst: (args: unknown) => Promise<{ hashCurrent: string } | null>;
    create: (args: unknown) => Promise<unknown>;
  } | null {
    const model = (this.prisma as unknown as Record<string, unknown>)['auditLog'];
    if (model && typeof model === 'object') {
      return model as {
        findFirst: (args: unknown) => Promise<{ hashCurrent: string } | null>;
        create: (args: unknown) => Promise<unknown>;
      };
    }
    return null;
  }

  async record(entry: AuditEntry): Promise<void> {
    try {
      const timestamp = new Date();
      const model = this.auditModel;

      if (model) {
        const lastRow = await model.findFirst({
          orderBy: { createdAt: 'desc' },
          select: { hashCurrent: true },
        });
        const hashPrev = lastRow?.hashCurrent ?? '0';
        const hashCurrent = this.computeHash(
          hashPrev,
          entry.payload,
          timestamp,
        );

        await model.create({
          data: {
            userId: entry.userId,
            action: entry.action,
            ipAddress: entry.ipAddress,
            userAgent: entry.userAgent,
            payload: entry.payload as object,
            hashPrev,
            hashCurrent,
            createdAt: timestamp,
          },
        });
        return;
      }

      // Fallback 1 — existing ActivityLog table.
      const activity = (this.prisma as unknown as Record<string, unknown>)[
        'activityLog'
      ] as
        | {
            create: (args: {
              data: {
                userId: string;
                action: string;
                entityType: string;
                metadata: object;
                ipAddress: string | null;
              };
            }) => Promise<unknown>;
          }
        | undefined;

      if (activity && entry.userId) {
        await activity.create({
          data: {
            userId: entry.userId,
            action: entry.action,
            entityType: 'AUTH',
            metadata: {
              ...entry.payload,
              userAgent: entry.userAgent,
            },
            ipAddress: entry.ipAddress,
          },
        });
        return;
      }

      // Fallback 2 — structured log line. Better than silence.
      this.logger.log(
        JSON.stringify({ level: 'audit', timestamp, ...entry }),
      );
    } catch (err) {
      // Swallowing audit-log errors is intentional: we must not fail an auth
      // operation just because we couldn't write the trail. Ops will still
      // see this in the logs.
      this.logger.error(
        `Failed to write audit log entry for ${entry.action}: ${
          err instanceof Error ? err.message : String(err)
        }`,
      );
    }
  }

  /** Exposed for tests. */
  computeHash(
    hashPrev: string,
    payload: Record<string, unknown>,
    timestamp: Date,
  ): string {
    const input = hashPrev + JSON.stringify(payload) + timestamp.toISOString();
    return createHash('sha256').update(input).digest('hex');
  }
}
