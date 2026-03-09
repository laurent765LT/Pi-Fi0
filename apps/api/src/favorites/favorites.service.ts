import { Injectable, ConflictException } from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';

@Injectable()
export class FavoritesService {
  constructor(private readonly prisma: PrismaService) {}

  async addFavorite(userId: string, productId: string) {
    try {
      return await this.prisma.productFavorite.create({
        data: { userId, productId },
        include: { product: { select: { name: true, isin: true, payoffType: true } } },
      });
    } catch {
      throw new ConflictException('Produit deja en favoris');
    }
  }

  async removeFavorite(userId: string, productId: string) {
    await this.prisma.productFavorite.deleteMany({
      where: { userId, productId },
    });
    return { removed: true };
  }

  async getUserFavorites(userId: string) {
    return this.prisma.productFavorite.findMany({
      where: { userId },
      include: {
        product: {
          include: {
            riskMetrics: true,
            shelves: {
              where: { status: 'OPEN' },
              select: { id: true, targetAmount: true, closingDate: true },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async isFavorite(userId: string, productId: string): Promise<boolean> {
    const fav = await this.prisma.productFavorite.findUnique({
      where: { userId_productId: { userId, productId } },
    });
    return !!fav;
  }

  async toggleFavorite(userId: string, productId: string) {
    const existing = await this.prisma.productFavorite.findUnique({
      where: { userId_productId: { userId, productId } },
    });
    if (existing) {
      await this.prisma.productFavorite.delete({ where: { id: existing.id } });
      return { isFavorite: false };
    }
    await this.prisma.productFavorite.create({ data: { userId, productId } });
    return { isFavorite: true };
  }

  // ── Product Views Tracking ─────────────────────────────────────────────────

  async trackView(userId: string, productId: string) {
    return this.prisma.productView.create({
      data: { userId, productId },
    });
  }

  async getRecentViews(userId: string, limit: number = 10) {
    const views = await this.prisma.productView.findMany({
      where: { userId },
      orderBy: { viewedAt: 'desc' },
      take: limit * 3, // Get more to deduplicate
      include: {
        product: {
          select: {
            id: true, name: true, isin: true, payoffType: true,
            issuerName: true, couponPct: true, barrierCapPct: true, sri: true,
          },
        },
      },
    });

    // Deduplicate by productId, keeping most recent view
    const seen = new Set<string>();
    const unique: typeof views = [];
    for (const v of views) {
      if (!seen.has(v.productId)) {
        seen.add(v.productId);
        unique.push(v);
      }
      if (unique.length >= limit) break;
    }

    return unique;
  }

  async getMostViewedProducts(limit: number = 10) {
    const result = await this.prisma.productView.groupBy({
      by: ['productId'],
      _count: { productId: true },
      orderBy: { _count: { productId: 'desc' } },
      take: limit,
    });

    const productIds = result.map((r) => r.productId);
    const products = await this.prisma.product.findMany({
      where: { id: { in: productIds } },
      select: {
        id: true, name: true, isin: true, payoffType: true,
        issuerName: true, couponPct: true, barrierCapPct: true, sri: true, maxGainPct: true,
      },
    });

    return result.map((r) => ({
      product: products.find((p) => p.id === r.productId),
      viewCount: r._count.productId,
    }));
  }
}
