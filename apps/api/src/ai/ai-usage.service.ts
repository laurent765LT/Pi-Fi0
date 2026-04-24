import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';
import type {
  AIUsageDaily,
  AIUsageStats,
  AIUsageTopUser,
} from './types/ai.types';

interface RawInteraction {
  userId: string;
  endpoint: string;
  tokensIn: number;
  tokensOut: number;
  latencyMs: number;
  estimatedCostUsd: number;
  cached: boolean;
  success: boolean;
  createdAt: Date;
  user?: { email?: string | null } | null;
}

@Injectable()
export class AIUsageService {
  private readonly logger = new Logger(AIUsageService.name);

  constructor(private readonly prisma: PrismaService) {}

  async getStats(windowDays = 7): Promise<AIUsageStats> {
    const since = new Date(Date.now() - windowDays * 24 * 60 * 60 * 1000);
    const rows = await this.fetchInteractions(since);

    let totalRequests = 0;
    let totalTokensIn = 0;
    let totalTokensOut = 0;
    let totalCostUsd = 0;
    let errorCount = 0;
    let cacheHitCount = 0;

    const perDay = new Map<string, AIUsageDaily>();
    const perUser = new Map<string, AIUsageTopUser>();

    for (const r of rows) {
      totalRequests += 1;
      totalTokensIn += r.tokensIn;
      totalTokensOut += r.tokensOut;
      totalCostUsd += r.estimatedCostUsd;
      if (!r.success) errorCount += 1;
      if (r.cached) cacheHitCount += 1;

      const day = r.createdAt.toISOString().slice(0, 10);
      const dayRow =
        perDay.get(day) ??
        ({
          date: day,
          requests: 0,
          tokensIn: 0,
          tokensOut: 0,
          costUsd: 0,
          errors: 0,
        } as AIUsageDaily);
      dayRow.requests += 1;
      dayRow.tokensIn += r.tokensIn;
      dayRow.tokensOut += r.tokensOut;
      dayRow.costUsd += r.estimatedCostUsd;
      if (!r.success) dayRow.errors += 1;
      perDay.set(day, dayRow);

      const userRow =
        perUser.get(r.userId) ??
        ({
          userId: r.userId,
          email: r.user?.email ?? null,
          requests: 0,
          tokensIn: 0,
          tokensOut: 0,
          costUsd: 0,
        } as AIUsageTopUser);
      userRow.requests += 1;
      userRow.tokensIn += r.tokensIn;
      userRow.tokensOut += r.tokensOut;
      userRow.costUsd += r.estimatedCostUsd;
      if (!userRow.email && r.user?.email) userRow.email = r.user.email;
      perUser.set(r.userId, userRow);
    }

    const daily = Array.from(perDay.values()).sort((a, b) =>
      a.date.localeCompare(b.date),
    );
    const topUsers = Array.from(perUser.values())
      .sort((a, b) => b.costUsd - a.costUsd)
      .slice(0, 10);

    return {
      windowDays,
      totalRequests,
      totalTokensIn,
      totalTokensOut,
      totalCostUsd: Math.round(totalCostUsd * 1_000_000) / 1_000_000,
      errorRate: totalRequests ? errorCount / totalRequests : 0,
      cacheHitRate: totalRequests ? cacheHitCount / totalRequests : 0,
      daily,
      topUsers,
    };
  }

  private async fetchInteractions(since: Date): Promise<RawInteraction[]> {
    const prismaAny = this.prisma as unknown as {
      aIInteraction?: {
        findMany: (args: Record<string, unknown>) => Promise<unknown[]>;
      };
      aiInteraction?: {
        findMany: (args: Record<string, unknown>) => Promise<unknown[]>;
      };
    };
    const model = prismaAny.aIInteraction ?? prismaAny.aiInteraction;
    if (!model) {
      this.logger.warn(
        'AIInteraction model not available yet — returning empty stats',
      );
      return [];
    }
    try {
      const rows = (await model.findMany({
        where: { createdAt: { gte: since } },
        include: { user: { select: { email: true } } },
      })) as unknown as RawInteraction[];
      return rows;
    } catch (err) {
      this.logger.warn(
        `Failed to load AIInteraction rows (model may not include relation): ${String(err)}`,
      );
      try {
        const rows = (await model.findMany({
          where: { createdAt: { gte: since } },
        })) as unknown as RawInteraction[];
        return rows;
      } catch (err2) {
        this.logger.error(`AIInteraction findMany failed: ${String(err2)}`);
        return [];
      }
    }
  }
}
