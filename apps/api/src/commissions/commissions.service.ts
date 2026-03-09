import { Injectable, NotFoundException } from '@nestjs/common';
import { CommissionType, CommissionStatus, Prisma } from '@prisma/client';
import { PrismaService } from '../common/prisma.service';

@Injectable()
export class CommissionsService {
  constructor(private readonly prisma: PrismaService) {}

  // ── Commission Rules CRUD ──────────────────────────────────────────────────

  async createRule(dto: {
    orgId?: string;
    productId?: string;
    commissionType: CommissionType;
    ratePct: number;
    splitPlatformPct?: number;
    splitDistributorPct?: number;
    minAmount?: number;
    maxAmount?: number;
  }) {
    return this.prisma.commissionRule.create({
      data: {
        orgId: dto.orgId ?? null,
        productId: dto.productId ?? null,
        commissionType: dto.commissionType,
        ratePct: dto.ratePct,
        splitPlatformPct: dto.splitPlatformPct ?? 20,
        splitDistributorPct: dto.splitDistributorPct ?? 80,
        minAmount: dto.minAmount,
        maxAmount: dto.maxAmount,
      },
    });
  }

  async listRules(orgId?: string) {
    return this.prisma.commissionRule.findMany({
      where: {
        ...(orgId ? { orgId } : {}),
        isActive: true,
      },
      include: {
        organization: { select: { name: true } },
        product: { select: { name: true, isin: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async updateRule(id: string, dto: Partial<{
    ratePct: number;
    splitPlatformPct: number;
    splitDistributorPct: number;
    isActive: boolean;
  }>) {
    return this.prisma.commissionRule.update({
      where: { id },
      data: dto,
    });
  }

  // ── Commission Calculation ─────────────────────────────────────────────────

  async calculateCommissions(commitmentId: string) {
    const commitment = await this.prisma.commitment.findUnique({
      where: { id: commitmentId },
      include: {
        shelf: {
          include: { product: true },
        },
        user: { include: { organization: true } },
      },
    });

    if (!commitment) {
      throw new NotFoundException(`Commitment ${commitmentId} not found`);
    }

    const product = commitment.shelf.product;

    // Find applicable rules (product-specific first, then org-level, then global)
    const rules = await this.prisma.commissionRule.findMany({
      where: {
        isActive: true,
        OR: [
          { productId: product.id },
          { orgId: commitment.orgId, productId: null },
          { orgId: null, productId: null },
        ],
      },
      orderBy: { createdAt: 'asc' },
    });

    // Deduplicate by commission type (product-specific > org-specific > global)
    const rulesByType = new Map<CommissionType, typeof rules[0]>();
    for (const rule of rules) {
      const existing = rulesByType.get(rule.commissionType);
      if (!existing) {
        rulesByType.set(rule.commissionType, rule);
      } else if (rule.productId && !existing.productId) {
        rulesByType.set(rule.commissionType, rule);
      } else if (rule.orgId && !existing.orgId && !existing.productId) {
        rulesByType.set(rule.commissionType, rule);
      }
    }

    const commissions: Array<{
      ruleId: string;
      commissionType: CommissionType;
      grossAmount: number;
      platformShare: number;
      distributorShare: number;
    }> = [];

    for (const [, rule] of rulesByType) {
      const gross = commitment.amount * (rule.ratePct / 100);

      if (rule.minAmount && gross < rule.minAmount) continue;
      const capped = rule.maxAmount ? Math.min(gross, rule.maxAmount) : gross;

      const platformShare = capped * (rule.splitPlatformPct / 100);
      const distributorShare = capped * (rule.splitDistributorPct / 100);

      commissions.push({
        ruleId: rule.id,
        commissionType: rule.commissionType,
        grossAmount: Math.round(capped * 100) / 100,
        platformShare: Math.round(platformShare * 100) / 100,
        distributorShare: Math.round(distributorShare * 100) / 100,
      });
    }

    // Batch insert commissions
    if (commissions.length > 0) {
      await this.prisma.commission.createMany({
        data: commissions.map((c) => ({
          commitmentId,
          ...c,
        })),
      });
    }

    return {
      commitmentId,
      amount: commitment.amount,
      commissions,
      totalGross: commissions.reduce((s, c) => s + c.grossAmount, 0),
      totalPlatform: commissions.reduce((s, c) => s + c.platformShare, 0),
      totalDistributor: commissions.reduce((s, c) => s + c.distributorShare, 0),
    };
  }

  // ── Commission Queries ─────────────────────────────────────────────────────

  async getCommissionsByOrg(orgId: string, status?: CommissionStatus) {
    return this.prisma.commission.findMany({
      where: {
        commitment: { orgId },
        ...(status ? { status } : {}),
      },
      include: {
        commitment: {
          include: {
            shelf: { include: { product: { select: { name: true, isin: true } } } },
            user: { select: { firstName: true, lastName: true, email: true } },
          },
        },
        rule: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getCommissionSummary(orgId?: string) {
    const where: Prisma.CommissionWhereInput = orgId
      ? { commitment: { orgId } }
      : {};

    const [accrued, payable, paid] = await Promise.all([
      this.prisma.commission.aggregate({
        where: { ...where, status: 'ACCRUED' },
        _sum: { grossAmount: true, platformShare: true, distributorShare: true },
        _count: true,
      }),
      this.prisma.commission.aggregate({
        where: { ...where, status: 'PAYABLE' },
        _sum: { grossAmount: true, platformShare: true, distributorShare: true },
        _count: true,
      }),
      this.prisma.commission.aggregate({
        where: { ...where, status: 'PAID' },
        _sum: { grossAmount: true, platformShare: true, distributorShare: true },
        _count: true,
      }),
    ]);

    return {
      accrued: {
        count: accrued._count,
        total: accrued._sum.grossAmount ?? 0,
        platform: accrued._sum.platformShare ?? 0,
        distributor: accrued._sum.distributorShare ?? 0,
      },
      payable: {
        count: payable._count,
        total: payable._sum.grossAmount ?? 0,
        platform: payable._sum.platformShare ?? 0,
        distributor: payable._sum.distributorShare ?? 0,
      },
      paid: {
        count: paid._count,
        total: paid._sum.grossAmount ?? 0,
        platform: paid._sum.platformShare ?? 0,
        distributor: paid._sum.distributorShare ?? 0,
      },
    };
  }

  async markPayable(ids: string[]) {
    return this.prisma.commission.updateMany({
      where: { id: { in: ids }, status: 'ACCRUED' },
      data: { status: 'PAYABLE' },
    });
  }

  async markPaid(ids: string[], invoiceRef?: string) {
    return this.prisma.commission.updateMany({
      where: { id: { in: ids }, status: 'PAYABLE' },
      data: { status: 'PAID', paidAt: new Date(), invoiceRef },
    });
  }
}
