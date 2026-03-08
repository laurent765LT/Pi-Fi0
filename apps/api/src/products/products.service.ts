import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { Prisma, PayoffType, ProductStatus } from '@prisma/client';
import { PrismaService } from '../common/prisma.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { ListProductsDto } from './dto/list-products.dto';

export interface PayoffScenario {
  label: string;
  description: string;
  data: Array<{ date: string; value: number }>;
}

export interface PayoffChartData {
  productId: string;
  productName: string;
  maturityDate: string;
  scenarios: PayoffScenario[];
}

export interface LiveData {
  productId: string;
  underlyingTicker: string;
  underlyingPrice: number | null;
  underlyingChange1DPct: number | null;
  distanceToBarrierPct: number | null;
  estimatedCurrentValue: number | null;
  lastUpdatedAt: string;
}

@Injectable()
export class ProductsService {
  constructor(private readonly prisma: PrismaService) {}

  async list(query: ListProductsDto) {
    const {
      payoffType,
      minSri,
      maxSri,
      status,
      search,
      page = 1,
      limit = 20,
    } = query;

    const where: Prisma.ProductWhereInput = {};

    if (payoffType) {
      where.payoffType = payoffType;
    }

    if (minSri !== undefined || maxSri !== undefined) {
      where.sri = {};
      if (minSri !== undefined) where.sri = { ...where.sri as object, gte: minSri };
      if (maxSri !== undefined) where.sri = { ...where.sri as object, lte: maxSri };
    }

    if (status) {
      where.status = status;
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { isin: { contains: search, mode: 'insensitive' } },
        { issuerName: { contains: search, mode: 'insensitive' } },
        { underlyingName: { contains: search, mode: 'insensitive' } },
      ];
    }

    const skip = (page - 1) * limit;

    const [items, total] = await this.prisma.$transaction([
      this.prisma.product.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          riskMetrics: true,
          shelves: {
            select: {
              id: true,
              status: true,
              targetAmount: true,
              closingDate: true,
              commitments: {
                where: { status: { in: ['CONFIRMED', 'PENDING'] } },
                select: { amount: true },
              },
            },
          },
        },
      }),
      this.prisma.product.count({ where }),
    ]);

    // Enrich products with shelf fill data
    const enrichedItems = items.map((product) => {
      const openShelf = product.shelves.find((s) => s.status === 'OPEN') ?? product.shelves[0];
      const targetAmount = openShelf?.targetAmount ?? 0;
      const filledAmount = openShelf
        ? openShelf.commitments.reduce((sum, c) => sum + c.amount, 0)
        : 0;
      const fillPct = targetAmount > 0 ? (filledAmount / targetAmount) * 100 : 0;

      // Remove nested commitments from the response
      const { shelves, ...rest } = product;
      return {
        ...rest,
        fillPct: Math.round(fillPct * 10) / 10,
        targetAmount,
        shelfClosingDate: openShelf?.closingDate?.toISOString() ?? null,
      };
    });

    return {
      data: enrichedItems,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string) {
    const product = await this.prisma.product.findUnique({
      where: { id },
      include: {
        riskMetrics: true,
        shelves: {
          select: {
            id: true,
            status: true,
            targetAmount: true,
            closingDate: true,
          },
        },
      },
    });

    if (!product) {
      throw new NotFoundException(`Product with id "${id}" not found`);
    }

    return product;
  }

  async create(dto: CreateProductDto) {
    const existing = await this.prisma.product.findUnique({
      where: { isin: dto.isin },
    });

    if (existing) {
      throw new ConflictException(
        `A product with ISIN "${dto.isin}" already exists`,
      );
    }

    const { observationDates, maturityDate, ...rest } = dto;

    return this.prisma.product.create({
      data: {
        ...rest,
        maturityDate: new Date(maturityDate),
        observationDates: observationDates
          ? observationDates.map((d) => new Date(d))
          : [],
      },
      include: { riskMetrics: true },
    });
  }

  async update(id: string, dto: UpdateProductDto) {
    await this.findOne(id);

    const { observationDates, maturityDate, ...rest } = dto;

    const data: Prisma.ProductUpdateInput = { ...rest };

    if (maturityDate) {
      data.maturityDate = new Date(maturityDate);
    }

    if (observationDates) {
      data.observationDates = observationDates.map((d) => new Date(d));
    }

    return this.prisma.product.update({
      where: { id },
      data,
      include: { riskMetrics: true },
    });
  }

  async remove(id: string) {
    await this.findOne(id);

    await this.prisma.product.delete({ where: { id } });

    return { message: `Product "${id}" deleted successfully` };
  }

  async getLive(id: string): Promise<LiveData> {
    const product = await this.findOne(id);

    // Placeholder: in production this would call a market-data service
    // (e.g. Yahoo Finance via the MarketDataModule) to fetch real-time quotes.
    return {
      productId: product.id,
      underlyingTicker: product.underlyingYahoo,
      underlyingPrice: null,
      underlyingChange1DPct: null,
      distanceToBarrierPct: null,
      estimatedCurrentValue: null,
      lastUpdatedAt: new Date().toISOString(),
    };
  }

  async getPayoff(id: string): Promise<PayoffChartData> {
    const product = await this.findOne(id);

    const start = new Date();
    const maturity = new Date(product.maturityDate);
    const totalMs = maturity.getTime() - start.getTime();
    const steps = 12;

    const datePoints: string[] = Array.from({ length: steps + 1 }, (_, i) => {
      const d = new Date(start.getTime() + (totalMs * i) / steps);
      return d.toISOString().split('T')[0] ?? '';
    });

    const buildScenario = (
      label: string,
      description: string,
      valuesFn: (i: number) => number,
    ): PayoffScenario => ({
      label,
      description,
      data: datePoints.map((date, i) => ({
        date,
        value: Math.round(valuesFn(i) * 100) / 100,
      })),
    });

    const scenarios: PayoffScenario[] = [
      buildScenario(
        'Optimistic',
        'Underlying rises steadily; autocall or max gain triggered.',
        (i) => {
          const progress = i / steps;
          return 100 + progress * product.maxGainPct;
        },
      ),
      buildScenario(
        'Neutral',
        'Underlying stays flat; coupon collected if applicable.',
        (i) => {
          const progress = i / steps;
          const annualCoupon = product.couponPct ?? 0;
          return 100 + progress * annualCoupon;
        },
      ),
      buildScenario(
        'Pessimistic',
        'Underlying falls but stays above barrier; capital preserved at maturity.',
        (i) => {
          const progress = i / steps;
          // Dips then recovers to 100 at maturity
          const trough = 100 - (product.barrierCapPct / 2) * Math.sin(Math.PI * progress);
          return trough;
        },
      ),
      buildScenario(
        'Barrier Breach',
        'Underlying crosses the barrier; capital loss proportional to underlying performance.',
        (i) => {
          const progress = i / steps;
          const loss = product.barrierCapPct * 1.5;
          return 100 - progress * loss;
        },
      ),
    ];

    return {
      productId: product.id,
      productName: product.name,
      maturityDate: product.maturityDate.toISOString().split('T')[0] ?? '',
      scenarios,
    };
  }

  async getAiAdvice(id: string): Promise<{ productId: string; advice: string }> {
    const product = await this.findOne(id);

    // Placeholder: in production this would call the ChatModule / OpenAI service.
    const advice =
      `Product "${product.name}" (${product.isin}) — ` +
      `Payoff type: ${product.payoffType}, SRI: ${product.sri}/7. ` +
      `Barrier: ${product.barrierCapPct}%, max gain: ${product.maxGainPct}%. ` +
      `AI-generated personalised advice is not yet available in this environment.`;

    return { productId: product.id, advice };
  }
}
