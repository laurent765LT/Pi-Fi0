import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';
import { RedisService } from '../common/redis.service';
import { priceStructuredProduct } from './core/engine';
import { validateProductConfig, isValidConfig } from './validation/validator';
import type { StructuredProductConfig, PricingResult, ValidationError } from './core/types';

// ── DTOs ─────────────────────────────────────────────────────────────────────

export interface PriceProductDto {
  config: StructuredProductConfig;
  saveRun?: boolean;
  createdBy?: string;
}

export interface ScenarioDto {
  config: StructuredProductConfig;
  shocks?: number[];
}

export interface PricingRunRecord {
  id: string;
  fairValue: number;
  issuePrice: number;
  indicativeCoupon: number | null;
  modelUsed: string;
  computeTimeMs: number;
  createdAt: Date;
}

// ── Service ──────────────────────────────────────────────────────────────────

@Injectable()
export class PricingService {
  private readonly logger = new Logger(PricingService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
  ) {}

  // ═══════════════════════════════════════════════════════════════════════════
  // Price a Product
  // ═══════════════════════════════════════════════════════════════════════════

  async priceProduct(dto: PriceProductDto): Promise<{
    result: PricingResult;
    validation: ValidationError[];
    runId?: string;
  }> {
    const { config, saveRun = true, createdBy } = dto;

    // Validate
    const validation = validateProductConfig(config);
    const hasErrors = validation.some((v) => v.severity === 'ERROR');

    if (hasErrors) {
      this.logger.warn(`Pricing blocked: ${validation.filter((v) => v.severity === 'ERROR').length} validation errors`);
      return {
        result: emptyPricingResult(),
        validation,
      };
    }

    // Price
    this.logger.log(`Pricing "${config.productName}" (${config.structureType}, ${config.mcPaths} MC paths)...`);
    const result = priceStructuredProduct(config);
    this.logger.log(`Pricing done: fairValue=${result.fairValue}%, issuePrice=${result.issuePrice}% in ${result.computeTimeMs}ms`);

    // Persist
    let runId: string | undefined;
    if (saveRun) {
      try {
        const run = await this.prisma.pricingRun.create({
          data: {
            structuredProduct: config as any,
            modelUsed: result.modelUsed === 'MONTE_CARLO' ? 'MONTE_CARLO' : 'SEMI_ANALYTICAL',
            fairValue: result.fairValue,
            issuePrice: result.issuePrice,
            indicativeCoupon: result.indicativeCoupon,
            expectedRedemption: result.expectedRedemption,
            expectedReturn: result.expectedReturn,
            annualizedReturn: result.annualizedReturn,
            breakEven: result.breakEven,
            maxGain: result.maxGain,
            maxLoss: result.maxLoss,
            scenarioTable: result.scenarioTable as any,
            costBreakdown: result.costBreakdown as any,
            riskSummary: result.riskSummary as any,
            greeksApprox: result.greeksApprox as any,
            payoffChartData: result.payoffChartData as any,
            assumptions: result.assumptions as any,
            warnings: result.warnings,
            modelLimitations: result.modelLimitations,
            mcPaths: config.mcPaths,
            mcSeed: config.mcSeed,
            computeTimeMs: result.computeTimeMs,
            createdBy,
          },
        });
        runId = run.id;
        this.logger.log(`PricingRun saved: ${runId}`);
      } catch (err) {
        this.logger.error('Failed to save PricingRun', err);
      }
    }

    return { result, validation, runId };
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // Validate Only
  // ═══════════════════════════════════════════════════════════════════════════

  validateConfig(config: StructuredProductConfig): {
    valid: boolean;
    errors: ValidationError[];
  } {
    const errors = validateProductConfig(config);
    return {
      valid: !errors.some((e) => e.severity === 'ERROR'),
      errors,
    };
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // Scenario Analysis (spot shocks)
  // ═══════════════════════════════════════════════════════════════════════════

  runScenarios(dto: ScenarioDto): {
    scenarios: Array<{
      shock: number;
      result: PricingResult;
    }>;
  } {
    const { config, shocks = [-0.30, -0.20, -0.10, 0, 0.10, 0.20, 0.30] } = dto;
    const scenarios = shocks.map((shock) => {
      const shiftedConfig: StructuredProductConfig = {
        ...config,
        underlying: {
          ...config.underlying,
          spot: config.underlying.spot * (1 + shock),
        },
        mcPaths: Math.min(config.mcPaths, 5000), // faster for scenarios
      };
      return {
        shock,
        result: priceStructuredProduct(shiftedConfig),
      };
    });
    return { scenarios };
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // Pricing Run History
  // ═══════════════════════════════════════════════════════════════════════════

  async getHistory(opts: {
    limit?: number;
    offset?: number;
    createdBy?: string;
  }): Promise<{ runs: PricingRunRecord[]; total: number }> {
    const { limit = 20, offset = 0, createdBy } = opts;

    const where = createdBy ? { createdBy } : {};

    const [runs, total] = await Promise.all([
      this.prisma.pricingRun.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
        select: {
          id: true,
          fairValue: true,
          issuePrice: true,
          indicativeCoupon: true,
          modelUsed: true,
          computeTimeMs: true,
          createdAt: true,
        },
      }),
      this.prisma.pricingRun.count({ where }),
    ]);

    return {
      runs: runs.map((r) => ({
        ...r,
        modelUsed: r.modelUsed as string,
        computeTimeMs: r.computeTimeMs ?? 0,
      })),
      total,
    };
  }

  async getRun(id: string) {
    return this.prisma.pricingRun.findUnique({ where: { id } });
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // Templates
  // ═══════════════════════════════════════════════════════════════════════════

  async getTemplates() {
    return this.prisma.productTemplate.findMany({
      orderBy: { name: 'asc' },
    });
  }

  async getTemplate(id: string) {
    return this.prisma.productTemplate.findUnique({ where: { id } });
  }

  async createTemplate(data: {
    name: string;
    description?: string;
    structureType: string;
    config: any;
    createdBy?: string;
  }) {
    return this.prisma.productTemplate.create({
      data: {
        name: data.name,
        description: data.description,
        structureType: data.structureType as any,
        config: data.config,
        isDefault: false,
        createdBy: data.createdBy,
      },
    });
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // Market Data Snapshots
  // ═══════════════════════════════════════════════════════════════════════════

  async saveMarketSnapshot(data: {
    ticker: string;
    spot: number;
    volatility?: number;
    dividendYield?: number;
    riskFreeRate?: number;
  }) {
    return this.prisma.marketDataSnapshot.create({ data });
  }

  async getLatestSnapshot(ticker: string) {
    return this.prisma.marketDataSnapshot.findFirst({
      where: { ticker },
      orderBy: { timestamp: 'desc' },
    });
  }
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function emptyPricingResult(): PricingResult {
  return {
    fairValue: 0,
    issuePrice: 0,
    indicativeCoupon: null,
    expectedRedemption: 0,
    expectedReturn: 0,
    annualizedReturn: 0,
    breakEven: null,
    maxGain: 0,
    maxLoss: 0,
    scenarioTable: [],
    costBreakdown: { structuringMargin: 0, distributionFee: 0, executionCost: 0, hedgingCost: 0, totalCost: 0 },
    riskSummary: {
      probAutocall: 0, probCouponPayment: 0, probCapitalLoss: 0,
      probBarrierBreach: 0, expectedLossGivenDefault: 0,
      valueAtRisk95: 0, conditionalVaR95: 0,
    },
    greeksApprox: { delta: 0, gamma: 0, vega: 0, theta: 0, rho: 0 },
    payoffChartData: [],
    modelUsed: 'NONE',
    modelLimitations: [],
    assumptions: [],
    warnings: ['La configuration contient des erreurs de validation — pricing non exécuté.'],
    computeTimeMs: 0,
  };
}
