import { Injectable } from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';

interface UserProfile {
  riskTolerance: number; // 1-7 (maps to SRI)
  yieldTarget: number;   // target annual yield %
  preferredPayoffTypes: string[];
  preferredIssuers: string[];
  maxMaturityMonths: number;
  viewHistory: string[]; // productIds recently viewed
  commitmentHistory: string[]; // productIds committed to
}

@Injectable()
export class RecommendationsService {
  constructor(private readonly prisma: PrismaService) {}

  // ── Generate Recommendations ───────────────────────────────────────────────

  async generateRecommendations(userId: string, limit: number = 10) {
    // Build user profile from activity
    const profile = await this.buildUserProfile(userId);

    // Get active products
    const products = await this.prisma.product.findMany({
      where: { status: 'ACTIVE' },
      include: {
        riskMetrics: true,
        shelves: {
          where: { status: 'OPEN' },
          select: {
            id: true,
            targetAmount: true,
            closingDate: true,
            commitments: {
              where: { status: { in: ['CONFIRMED', 'PENDING'] } },
              select: { amount: true },
            },
          },
        },
      },
    });

    // Score each product
    const scored = products.map((product) => {
      const factors = this.scoreProduct(product, profile);
      const totalScore = Object.values(factors).reduce((s, v) => s + v, 0);

      return {
        product,
        score: Math.round(totalScore * 10) / 10,
        factors,
        reason: this.generateReason(product, factors, profile),
      };
    });

    // Sort by score, take top N
    scored.sort((a, b) => b.score - a.score);
    const top = scored.slice(0, limit);

    // Upsert recommendations
    for (const item of top) {
      await this.prisma.aiRecommendation.upsert({
        where: {
          userId_productId: { userId, productId: item.product.id },
        },
        update: {
          score: item.score,
          reason: item.reason,
          factors: item.factors as any,
        },
        create: {
          userId,
          productId: item.product.id,
          score: item.score,
          reason: item.reason,
          factors: item.factors as any,
        },
      });
    }

    return top.map((t) => ({
      productId: t.product.id,
      product: {
        id: t.product.id,
        name: t.product.name,
        isin: t.product.isin,
        payoffType: t.product.payoffType,
        issuerName: t.product.issuerName,
        couponPct: t.product.couponPct,
        barrierCapPct: t.product.barrierCapPct,
        maxGainPct: t.product.maxGainPct,
        sri: t.product.sri,
        maturityDate: t.product.maturityDate,
      },
      score: t.score,
      reason: t.reason,
      factors: t.factors,
    }));
  }

  // ── Get cached recommendations ─────────────────────────────────────────────

  async getRecommendations(userId: string) {
    return this.prisma.aiRecommendation.findMany({
      where: { userId, isDismissed: false },
      include: {
        product: {
          select: {
            id: true, name: true, isin: true, payoffType: true,
            issuerName: true, couponPct: true, barrierCapPct: true,
            maxGainPct: true, sri: true, maturityDate: true,
          },
        },
      },
      orderBy: { score: 'desc' },
      take: 10,
    });
  }

  async dismissRecommendation(userId: string, productId: string) {
    return this.prisma.aiRecommendation.updateMany({
      where: { userId, productId },
      data: { isDismissed: true },
    });
  }

  async markViewed(userId: string, productId: string) {
    return this.prisma.aiRecommendation.updateMany({
      where: { userId, productId },
      data: { isViewed: true },
    });
  }

  // ── Build User Profile ─────────────────────────────────────────────────────

  private async buildUserProfile(userId: string): Promise<UserProfile> {
    const [commitments, views, favorites] = await Promise.all([
      this.prisma.commitment.findMany({
        where: { userId },
        include: { shelf: { include: { product: true } } },
        orderBy: { createdAt: 'desc' },
        take: 20,
      }),
      this.prisma.productView.findMany({
        where: { userId },
        orderBy: { viewedAt: 'desc' },
        take: 50,
      }),
      this.prisma.productFavorite.findMany({
        where: { userId },
        include: { product: true },
      }),
    ]);

    // Infer risk tolerance from committed products
    const committedProducts = commitments.map((c) => c.shelf.product);
    const avgSri = committedProducts.length > 0
      ? committedProducts.reduce((s, p) => s + p.sri, 0) / committedProducts.length
      : 4; // Default moderate

    // Infer yield target
    const avgCoupon = committedProducts.length > 0
      ? committedProducts.reduce((s, p) => s + (p.couponPct ?? 0), 0) / committedProducts.length
      : 6;

    // Infer preferred types from activity
    const typeCounts: Record<string, number> = {};
    const issuerCounts: Record<string, number> = {};
    const allProducts = [
      ...committedProducts,
      ...favorites.map((f) => f.product),
    ];

    for (const p of allProducts) {
      typeCounts[p.payoffType] = (typeCounts[p.payoffType] ?? 0) + 1;
      issuerCounts[p.issuerName] = (issuerCounts[p.issuerName] ?? 0) + 1;
    }

    const topTypes = Object.entries(typeCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3)
      .map(([k]) => k);

    const topIssuers = Object.entries(issuerCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([k]) => k);

    return {
      riskTolerance: Math.round(avgSri),
      yieldTarget: avgCoupon,
      preferredPayoffTypes: topTypes,
      preferredIssuers: topIssuers,
      maxMaturityMonths: 120,
      viewHistory: [...new Set(views.map((v) => v.productId))],
      commitmentHistory: [...new Set(commitments.map((c) => c.shelf.productId))],
    };
  }

  // ── Scoring Algorithm ──────────────────────────────────────────────────────

  private scoreProduct(product: any, profile: UserProfile): Record<string, number> {
    const factors: Record<string, number> = {};

    // 1. Risk match (0-25 points)
    const riskDiff = Math.abs(product.sri - profile.riskTolerance);
    factors.riskMatch = Math.max(0, 25 - riskDiff * 8);

    // 2. Yield attractiveness (0-20 points)
    const coupon = product.couponPct ?? 0;
    const yieldRatio = profile.yieldTarget > 0 ? coupon / profile.yieldTarget : 0.5;
    factors.yieldScore = Math.min(20, yieldRatio * 15);

    // 3. Type preference (0-15 points)
    factors.typeMatch = profile.preferredPayoffTypes.includes(product.payoffType) ? 15 : 5;

    // 4. Issuer preference (0-10 points)
    factors.issuerMatch = profile.preferredIssuers.includes(product.issuerName) ? 10 : 3;

    // 5. Novelty — not yet viewed or committed (0-10 points)
    const alreadySeen = profile.viewHistory.includes(product.id);
    const alreadyCommitted = profile.commitmentHistory.includes(product.id);
    factors.novelty = alreadyCommitted ? 0 : alreadySeen ? 3 : 10;

    // 6. Protection quality (0-10 points)
    factors.protectionScore = Math.min(10, (product.barrierCapPct / 100) * 15);

    // 7. Shelf urgency — products closing soon get a boost (0-10 points)
    const shelf = product.shelves?.[0];
    if (shelf?.closingDate) {
      const daysToClose = (new Date(shelf.closingDate).getTime() - Date.now()) / (24 * 3600 * 1000);
      if (daysToClose > 0 && daysToClose < 14) {
        factors.urgency = 10;
      } else if (daysToClose < 30) {
        factors.urgency = 6;
      } else {
        factors.urgency = 2;
      }
    } else {
      factors.urgency = 0;
    }

    return factors;
  }

  // ── Reason Generation ──────────────────────────────────────────────────────

  private generateReason(product: any, factors: Record<string, number>, profile: UserProfile): string {
    const parts: string[] = [];

    if ((factors.riskMatch ?? 0) >= 20) {
      parts.push(`Profil de risque adapte (SRI ${product.sri})`);
    }
    if ((factors.yieldScore ?? 0) >= 15) {
      parts.push(`Rendement attractif de ${product.couponPct?.toFixed(1) ?? '—'}%`);
    }
    if ((factors.typeMatch ?? 0) >= 10) {
      parts.push(`Type de produit correspondant a vos preferences`);
    }
    if ((factors.novelty ?? 0) >= 8) {
      parts.push(`Nouveau produit non encore consulte`);
    }
    if ((factors.urgency ?? 0) >= 8) {
      parts.push(`Cloture imminente`);
    }
    if ((factors.protectionScore ?? 0) >= 7) {
      parts.push(`Protection solide a ${product.barrierCapPct}%`);
    }

    return parts.length > 0
      ? parts.join('. ') + '.'
      : `Produit compatible avec votre profil d'investissement.`;
  }
}
