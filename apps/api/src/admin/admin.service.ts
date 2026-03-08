import { Injectable } from '@nestjs/common';
import { OnboardingStatus, ProductStatus, ShelfStatus } from '@prisma/client';
import { PrismaService } from '../common/prisma.service';

export interface AdminStats {
  totalProducts: number;
  activeShelves: number;
  totalCommitments: number;
  totalVolume: number;
  activeUsers: number;
}

@Injectable()
export class AdminService {
  constructor(private readonly prisma: PrismaService) {}

  async getStats(): Promise<AdminStats> {
    const [
      totalProducts,
      activeShelves,
      commitmentAggregation,
      activeUsers,
    ] = await Promise.all([
      this.prisma.product.count({
        where: { status: ProductStatus.ACTIVE },
      }),
      this.prisma.shelf.count({
        where: { status: ShelfStatus.OPEN },
      }),
      this.prisma.commitment.aggregate({
        _count: { id: true },
        _sum: { amount: true },
      }),
      this.prisma.user.count({
        where: { onboardingStatus: OnboardingStatus.ACTIVE },
      }),
    ]);

    return {
      totalProducts,
      activeShelves,
      totalCommitments: commitmentAggregation._count.id,
      totalVolume: commitmentAggregation._sum.amount ?? 0,
      activeUsers,
    };
  }
}
