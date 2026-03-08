import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../common/prisma.service';
import { RedisService } from '../../common/redis.service';
import { priceStructuredProduct } from '../core/engine';
import type { StructuredProductConfig, PricingResult } from '../core/types';

// ── DTOs ─────────────────────────────────────────────────────────────────────

export interface CreateRfqDto {
  productConfig: any;
  rfqMode?: string;
  targetCoupon?: number;
  targetIssuePrice?: number;
  targetProtection?: number;
  maxMaturityMonths?: number;
  maxFee?: number;
  targetCurrency?: string;
  preferredUnderlyings?: string[];
  excludedUnderlyings?: string[];
  acceptedIssuers?: string[];
  excludedIssuers?: string[];
  yieldWeight?: number;
  protectionWeight?: number;
  costWeight?: number;
  qualityWeight?: number;
  simplicityWeight?: number;
  deskName?: string;
  clientName?: string;
  clientSegment?: string;
  createdBy?: string;
}

export interface IssuerQuoteResult {
  issuerName: string;
  issuerShortName: string;
  status: 'QUOTED' | 'REJECTED';
  indicativeCoupon: number | null;
  issuePrice: number | null;
  couponBarrier: number | null;
  autocallBarrier: number | null;
  protectionBarrier: number | null;
  maturityMonths: number | null;
  feesTotal: number | null;
  rankingScore: number | null;
  comments: string | null;
  rejectionReason: string | null;
  legalDisclaimer: string;
}

// ── Service ──────────────────────────────────────────────────────────────────

@Injectable()
export class RfqService {
  private readonly logger = new Logger(RfqService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
  ) {}

  // ═══════════════════════════════════════════════════════════════════════════
  // Create RFQ
  // ═══════════════════════════════════════════════════════════════════════════

  async createRfq(dto: CreateRfqDto) {
    const rfq = await this.prisma.rfqRequest.create({
      data: {
        productConfig: dto.productConfig,
        rfqMode: (dto.rfqMode as any) ?? 'ISSUER_COMPETITION',
        status: 'DRAFT',
        targetCoupon: dto.targetCoupon,
        targetIssuePrice: dto.targetIssuePrice ?? 100,
        targetProtection: dto.targetProtection,
        maxMaturityMonths: dto.maxMaturityMonths,
        maxFee: dto.maxFee,
        targetCurrency: dto.targetCurrency ?? 'EUR',
        preferredUnderlyings: dto.preferredUnderlyings ?? [],
        excludedUnderlyings: dto.excludedUnderlyings ?? [],
        acceptedIssuers: dto.acceptedIssuers ?? [],
        excludedIssuers: dto.excludedIssuers ?? [],
        yieldWeight: dto.yieldWeight ?? 0.3,
        protectionWeight: dto.protectionWeight ?? 0.25,
        costWeight: dto.costWeight ?? 0.2,
        qualityWeight: dto.qualityWeight ?? 0.15,
        simplicityWeight: dto.simplicityWeight ?? 0.1,
        deskName: dto.deskName,
        clientName: dto.clientName,
        clientSegment: dto.clientSegment,
        createdBy: dto.createdBy,
        expiresAt: new Date(Date.now() + 7 * 24 * 3600 * 1000), // 7 days
      },
    });

    this.logger.log(`RFQ created: ${rfq.id} (${rfq.internalRef})`);
    return rfq;
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // Send RFQ to Issuers (Simulated)
  // ═══════════════════════════════════════════════════════════════════════════

  async sendRfq(rfqId: string): Promise<{
    rfq: any;
    quotes: IssuerQuoteResult[];
  }> {
    const rfq = await this.prisma.rfqRequest.findUnique({ where: { id: rfqId } });
    if (!rfq) throw new Error('RFQ not found');

    // Get active issuer profiles
    let issuers = await this.prisma.issuerProfile.findMany({
      where: { isActive: true },
    });

    // Apply filters
    if (rfq.acceptedIssuers.length > 0) {
      issuers = issuers.filter((i) => rfq.acceptedIssuers.includes(i.name));
    }
    if (rfq.excludedIssuers.length > 0) {
      issuers = issuers.filter((i) => !rfq.excludedIssuers.includes(i.name));
    }

    if (issuers.length === 0) {
      throw new Error('No eligible issuers for this RFQ');
    }

    const config = rfq.productConfig as unknown as StructuredProductConfig;

    // Generate quote for each issuer
    const quotes: IssuerQuoteResult[] = [];

    for (const issuer of issuers) {
      // Check if issuer supports this structure
      if (
        issuer.unsupportedStructures.length > 0 &&
        issuer.unsupportedStructures.includes(config.structureType)
      ) {
        const quote = await this.createRejectedQuote(rfqId, issuer.id,
          `${issuer.shortName} ne supporte pas la structure ${config.structureType}`);
        quotes.push({
          issuerName: issuer.name,
          issuerShortName: issuer.shortName,
          status: 'REJECTED',
          indicativeCoupon: null,
          issuePrice: null,
          couponBarrier: null,
          autocallBarrier: null,
          protectionBarrier: null,
          maturityMonths: null,
          feesTotal: null,
          rankingScore: null,
          comments: null,
          rejectionReason: `Structure non supportée`,
          legalDisclaimer: 'SIMULATED QUOTE',
        });
        continue;
      }

      // Random rejection based on issuer profile
      if (Math.random() < issuer.rejectionProbability) {
        const reasons = [
          'Hors appétit de risque actuel',
          'Sous-jacent non eligible',
          'Montant notionnel insuffisant',
          'Maturité trop longue',
          'Capacité d\'émission épuisée ce mois',
        ];
        const reason = reasons[Math.floor(Math.random() * reasons.length)]!;
        await this.createRejectedQuote(rfqId, issuer.id, reason);
        quotes.push({
          issuerName: issuer.name,
          issuerShortName: issuer.shortName,
          status: 'REJECTED',
          indicativeCoupon: null,
          issuePrice: null,
          couponBarrier: null,
          autocallBarrier: null,
          protectionBarrier: null,
          maturityMonths: null,
          feesTotal: null,
          rankingScore: null,
          comments: null,
          rejectionReason: reason,
          legalDisclaimer: 'SIMULATED QUOTE',
        });
        continue;
      }

      // Generate simulated quote
      const quote = await this.generateIssuerQuote(rfq, issuer, config);
      quotes.push(quote);
    }

    // Score & rank the quotes
    const scoredQuotes = this.scoreAndRankQuotes(quotes, rfq);

    // Update RFQ status
    const quotedCount = scoredQuotes.filter((q) => q.status === 'QUOTED').length;
    const newStatus = quotedCount === issuers.length ? 'FULLY_QUOTED' :
      quotedCount > 0 ? 'PARTIALLY_QUOTED' : 'RFQ_SENT';

    await this.prisma.rfqRequest.update({
      where: { id: rfqId },
      data: { status: newStatus as any },
    });

    return {
      rfq: { ...rfq, status: newStatus },
      quotes: scoredQuotes,
    };
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // Get RFQ + Quotes
  // ═══════════════════════════════════════════════════════════════════════════

  async getRfq(id: string) {
    return this.prisma.rfqRequest.findUnique({
      where: { id },
      include: {
        quotes: {
          include: {
            issuerProfile: { select: { name: true, shortName: true } },
          },
          orderBy: { rankingScore: 'desc' },
        },
      },
    });
  }

  async listRfqs(opts: { limit?: number; offset?: number; status?: string }) {
    const { limit = 20, offset = 0, status } = opts;
    const where = status ? { status: status as any } : {};

    const [rfqs, total] = await Promise.all([
      this.prisma.rfqRequest.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
        include: {
          quotes: {
            select: { id: true, status: true, indicativeCoupon: true, issuePrice: true, rankingScore: true },
          },
        },
      }),
      this.prisma.rfqRequest.count({ where }),
    ]);

    return { rfqs, total };
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // Select a Quote (Accept Best)
  // ═══════════════════════════════════════════════════════════════════════════

  async selectQuote(rfqId: string, quoteId: string) {
    // Mark the selected quote
    await this.prisma.rfqQuote.update({
      where: { id: quoteId },
      data: { status: 'ACCEPTED' },
    });

    // Decline others
    await this.prisma.rfqQuote.updateMany({
      where: { rfqRequestId: rfqId, id: { not: quoteId } },
      data: { status: 'DECLINED' },
    });

    // Update RFQ
    await this.prisma.rfqRequest.update({
      where: { id: rfqId },
      data: { status: 'SELECTED' },
    });

    return { message: 'Quote selected successfully' };
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // Issuer Profiles
  // ═══════════════════════════════════════════════════════════════════════════

  async getIssuers() {
    return this.prisma.issuerProfile.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' },
    });
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // Private: Quote Generation
  // ═══════════════════════════════════════════════════════════════════════════

  private async generateIssuerQuote(
    rfq: any,
    issuer: any,
    config: StructuredProductConfig,
  ): Promise<IssuerQuoteResult> {
    // Adjust config based on issuer profile
    const adjustedConfig: StructuredProductConfig = {
      ...config,
      market: {
        ...config.market,
        fundingSpread: issuer.fundingSpread,
        structuringMargin: issuer.structuringMargin,
        distributionFee: config.market.distributionFee,
        executionCost: config.market.executionCost,
      },
      underlying: {
        ...config.underlying,
        volatility: config.underlying.volatility + issuer.volMarkup,
      },
      mcPaths: Math.min(config.mcPaths || 10000, 5000), // Limit for speed
    };

    // Run pricing
    let pricingResult: PricingResult;
    try {
      pricingResult = priceStructuredProduct(adjustedConfig);
    } catch (e) {
      this.logger.error(`Pricing failed for issuer ${issuer.shortName}`, e);
      return {
        issuerName: issuer.name,
        issuerShortName: issuer.shortName,
        status: 'REJECTED',
        indicativeCoupon: null,
        issuePrice: null,
        couponBarrier: null,
        autocallBarrier: null,
        protectionBarrier: null,
        maturityMonths: null,
        feesTotal: null,
        rankingScore: null,
        comments: null,
        rejectionReason: 'Erreur de pricing interne',
        legalDisclaimer: 'SIMULATED QUOTE',
      };
    }

    // Apply issuer's aggressiveness adjustments
    const baseCoupon = config.payoff.couponRate * 100;
    const couponAdj = (issuer.couponAggressiveness - 0.5) * 1.5; // ±0.75% around base
    const indicativeCoupon = Math.round(
      (baseCoupon + couponAdj + (Math.random() - 0.5) * 0.8) * 100,
    ) / 100;

    const issuePrice = Math.round(
      (pricingResult.issuePrice + (issuer.distributionFriendliness - 0.5) * 2) * 100,
    ) / 100;

    const protAdj = (issuer.protectionAggressiveness - 0.5) * 5;
    const protectionBarrier = Math.round(
      ((config.payoff.protectionBarrier * 100) + protAdj) * 10,
    ) / 10;

    const totalFees = Math.round(
      (issuer.structuringMargin + config.market.distributionFee + config.market.executionCost) * 10000,
    ) / 100;

    // Generate comment based on style
    const comments = generateIssuerComment(issuer.commentStyle, indicativeCoupon, issuePrice);

    // Save pricing run
    let pricingRunId: string | undefined;
    try {
      const run = await this.prisma.pricingRun.create({
        data: {
          structuredProduct: adjustedConfig as any,
          modelUsed: pricingResult.modelUsed === 'MONTE_CARLO' ? 'MONTE_CARLO' : 'SEMI_ANALYTICAL',
          fairValue: pricingResult.fairValue,
          issuePrice: pricingResult.issuePrice,
          indicativeCoupon,
          scenarioTable: pricingResult.scenarioTable as any,
          costBreakdown: pricingResult.costBreakdown as any,
          riskSummary: pricingResult.riskSummary as any,
          greeksApprox: pricingResult.greeksApprox as any,
          payoffChartData: pricingResult.payoffChartData as any,
          warnings: pricingResult.warnings,
          modelLimitations: pricingResult.modelLimitations,
          mcPaths: adjustedConfig.mcPaths,
          computeTimeMs: pricingResult.computeTimeMs,
        },
      });
      pricingRunId = run.id;
    } catch (e) {
      this.logger.error('Failed to save RFQ pricing run', e);
    }

    // Save quote
    await this.prisma.rfqQuote.create({
      data: {
        rfqRequestId: rfq.id,
        issuerProfileId: issuer.id,
        pricingRunId: pricingRunId ?? null,
        status: 'QUOTED',
        indicativeCoupon,
        issuePrice,
        couponBarrier: config.payoff.couponBarrier * 100,
        autocallBarrier: config.payoff.autocallBarrier * 100,
        protectionBarrier,
        maturityMonths: Math.round(
          (new Date(config.schedule.maturityDate).getTime() - new Date(config.schedule.strikeDate).getTime()) /
          (1000 * 60 * 60 * 24 * 30),
        ),
        feesTotal: totalFees,
        issuerSpread: issuer.fundingSpread * 10000, // bps
        structuringMargin: issuer.structuringMargin * 100,
        distributionFee: config.market.distributionFee * 100,
        manufacturingFee: issuer.structuringMargin * 100,
        comments,
        validUntil: new Date(Date.now() + 24 * 3600 * 1000),
        quotedAt: new Date(),
      },
    });

    return {
      issuerName: issuer.name,
      issuerShortName: issuer.shortName,
      status: 'QUOTED',
      indicativeCoupon,
      issuePrice,
      couponBarrier: config.payoff.couponBarrier * 100,
      autocallBarrier: config.payoff.autocallBarrier * 100,
      protectionBarrier,
      maturityMonths: Math.round(
        (new Date(config.schedule.maturityDate).getTime() - new Date(config.schedule.strikeDate).getTime()) /
        (1000 * 60 * 60 * 24 * 30),
      ),
      feesTotal: totalFees,
      rankingScore: null, // Will be computed in scoring step
      comments,
      rejectionReason: null,
      legalDisclaimer: 'SIMULATED QUOTE — This is a synthetic quote generated for educational/analytical purposes. Not a binding offer.',
    };
  }

  private async createRejectedQuote(rfqId: string, issuerId: string, reason: string) {
    await this.prisma.rfqQuote.create({
      data: {
        rfqRequestId: rfqId,
        issuerProfileId: issuerId,
        status: 'REJECTED',
        rejectionReason: reason,
      },
    });
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // Scoring Engine
  // ═══════════════════════════════════════════════════════════════════════════

  private scoreAndRankQuotes(
    quotes: IssuerQuoteResult[],
    rfq: any,
  ): IssuerQuoteResult[] {
    const validQuotes = quotes.filter((q) => q.status === 'QUOTED');
    if (validQuotes.length === 0) return quotes;

    // Get scoring weights from RFQ
    const w = {
      yield: rfq.yieldWeight ?? 0.3,
      protection: rfq.protectionWeight ?? 0.25,
      cost: rfq.costWeight ?? 0.2,
      quality: rfq.qualityWeight ?? 0.15,
      simplicity: rfq.simplicityWeight ?? 0.1,
    };

    // Normalize each dimension
    const maxCoupon = Math.max(...validQuotes.map((q) => q.indicativeCoupon ?? 0));
    const minCoupon = Math.min(...validQuotes.map((q) => q.indicativeCoupon ?? 0));
    const maxProtection = Math.max(...validQuotes.map((q) => q.protectionBarrier ?? 0));
    const minFees = Math.min(...validQuotes.map((q) => q.feesTotal ?? Infinity));
    const maxFees = Math.max(...validQuotes.map((q) => q.feesTotal ?? 0));

    for (const q of validQuotes) {
      const coupon = q.indicativeCoupon ?? 0;
      const protection = q.protectionBarrier ?? 0;
      const fees = q.feesTotal ?? maxFees;

      // Yield score: higher coupon = better
      const yieldScore = maxCoupon > minCoupon
        ? (coupon - minCoupon) / (maxCoupon - minCoupon) * 100
        : 100;

      // Protection score: higher barrier = better (more protection for investor)
      const protectionScore = maxProtection > 0
        ? (protection / maxProtection) * 100
        : 50;

      // Cost score: lower fees = better
      const costScore = maxFees > minFees
        ? (1 - (fees - minFees) / (maxFees - minFees)) * 100
        : 100;

      // Quality score: based on issuer name recognition (simplified)
      const qualityScore = 70 + Math.random() * 30;

      // Simplicity score: constant (same structure for all)
      const simplicityScore = 75;

      // Weighted composite
      const rankingScore = Math.round(
        (w.yield * yieldScore +
          w.protection * protectionScore +
          w.cost * costScore +
          w.quality * qualityScore +
          w.simplicity * simplicityScore) * 100,
      ) / 100;

      q.rankingScore = rankingScore;

      // Update DB score
      this.prisma.rfqQuote.updateMany({
        where: {
          rfqRequestId: rfq.id,
          issuerProfile: { name: q.issuerName },
          status: 'QUOTED',
        },
        data: {
          rankingScore,
          yieldScore: Math.round(yieldScore * 100) / 100,
          protectionScore: Math.round(protectionScore * 100) / 100,
          costScore: Math.round(costScore * 100) / 100,
          qualityScore: Math.round(qualityScore * 100) / 100,
          simplicityScore: Math.round(simplicityScore * 100) / 100,
          bestExecutionScore: rankingScore,
        },
      }).catch((e) => this.logger.error('Failed to update quote score', e));
    }

    // Sort all quotes: QUOTED first (by score), then REJECTED
    return [
      ...validQuotes.sort((a, b) => (b.rankingScore ?? 0) - (a.rankingScore ?? 0)),
      ...quotes.filter((q) => q.status === 'REJECTED'),
    ];
  }
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function generateIssuerComment(style: string, coupon: number, price: number): string {
  const comments: Record<string, string[]> = {
    aggressive: [
      `Indicatif agressif à ${coupon}% — nous pouvons aller plus loin si volume ≥ 5M.`,
      `Prix compétitif à ${price}%. Fenêtre d'exécution courte — hedge desk optimiste.`,
      `Notre meilleur niveau. Coupon indicatif ${coupon}%, révisable à la hausse sur gros ticket.`,
    ],
    conservative: [
      `Indicatif prudent à ${coupon}% — conditions de marché volatiles.`,
      `Prix à ${price}% reflète notre analyse de risque conservatrice.`,
      `Coupon indicatif ${coupon}% — niveau ferme, peu de marge de négociation.`,
    ],
    neutral: [
      `Indicatif à ${coupon}% en ligne avec nos niveaux habituels.`,
      `Prix indicatif ${price}%. Sujet à confirmation du desk.`,
      `Coupon indicatif ${coupon}%, barrière et maturité standard.`,
    ],
  };

  const pool = comments[style] || comments['neutral']!;
  return pool[Math.floor(Math.random() * pool.length)]!;
}
