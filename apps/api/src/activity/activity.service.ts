import { Injectable } from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';

@Injectable()
export class ActivityService {
  constructor(private readonly prisma: PrismaService) {}

  async log(params: {
    userId: string;
    action: string;
    entityType: string;
    entityId?: string;
    metadata?: any;
    ipAddress?: string;
  }) {
    return this.prisma.activityLog.create({
      data: {
        userId: params.userId,
        action: params.action,
        entityType: params.entityType,
        entityId: params.entityId,
        metadata: params.metadata,
        ipAddress: params.ipAddress,
      },
    });
  }

  async getUserActivity(userId: string, limit: number = 50) {
    return this.prisma.activityLog.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }

  async getEntityActivity(entityType: string, entityId: string, limit: number = 20) {
    return this.prisma.activityLog.findMany({
      where: { entityType, entityId },
      orderBy: { createdAt: 'desc' },
      take: limit,
      include: { user: { select: { firstName: true, lastName: true, email: true } } },
    });
  }

  async getRecentPlatformActivity(limit: number = 100) {
    return this.prisma.activityLog.findMany({
      orderBy: { createdAt: 'desc' },
      take: limit,
      include: { user: { select: { firstName: true, lastName: true, email: true, role: true } } },
    });
  }

  async getActivityStats(since?: Date) {
    const where = since ? { createdAt: { gte: since } } : {};

    const [totalActions, byAction, byUser] = await Promise.all([
      this.prisma.activityLog.count({ where }),
      this.prisma.activityLog.groupBy({
        by: ['action'],
        where,
        _count: true,
        orderBy: { _count: { action: 'desc' } },
        take: 20,
      }),
      this.prisma.activityLog.groupBy({
        by: ['userId'],
        where,
        _count: true,
        orderBy: { _count: { userId: 'desc' } },
        take: 10,
      }),
    ]);

    return {
      totalActions,
      byAction: byAction.map((a) => ({ action: a.action, count: a._count })),
      topUsers: byUser.map((u) => ({ userId: u.userId, count: u._count })),
    };
  }
}
