/**
 * Product domain types.
 *
 * Source of truth: apps/api/prisma/schema.prisma#Product
 *
 * A Product represents a structured product instance — a specific ISIN with
 * its payoff, underlying(s), barriers and lifecycle state.
 */

/** Catalogue of payoff families supported on the platform. */
export const PayoffType = {
  AUTOCALL_PHOENIX: 'AUTOCALL_PHOENIX',
  AUTOCALL_COUPON: 'AUTOCALL_COUPON',
  CAPITAL_PROTECTED: 'CAPITAL_PROTECTED',
  CONDITIONAL_RATE: 'CONDITIONAL_RATE',
  BARRIER_NOTE: 'BARRIER_NOTE',
  REVERSE: 'REVERSE',
  CUSTOM: 'CUSTOM',
} as const;
export type PayoffType = (typeof PayoffType)[keyof typeof PayoffType];

/** Lifecycle state of a Product on the platform. */
export const ProductStatus = {
  DRAFT: 'DRAFT',
  ACTIVE: 'ACTIVE',
  LIVE: 'LIVE',
  PAUSED: 'PAUSED',
  CLOSED: 'CLOSED',
  MATURED: 'MATURED',
  RECALLED: 'RECALLED',
} as const;
export type ProductStatus = (typeof ProductStatus)[keyof typeof ProductStatus];

/**
 * Structured product aggregate.
 *
 * @property isin - International Securities Identification Number (unique, 12 chars).
 * @property payoffType - Type of payoff (Autocall, Phoenix, Capital Protected, etc.).
 * @property sri - Synthetic Risk Indicator 1-7 (PRIIPs scale, 1 = lowest risk).
 * @property observationDates - Schedule of autocall / coupon observation dates (ISO strings).
 */
export interface Product {
  id: string;
  isin: string;
  name: string;
  payoffType: PayoffType;
  issuerName: string;
  guarantorName: string | null;
  underlyingName: string;
  underlyingYahoo: string;
  initialPrice: number | null;
  barrierCapPct: number;
  autocallBarrierPct: number | null;
  couponPct: number | null;
  maxGainPct: number;
  sri: number;
  maturityDate: string;
  observationDates: string[];
  entryFeePct: number;
  managementFeePct: number;
  reference: string | null;
  kidUrl: string | null;
  description: string | null;
  descriptionData: Record<string, unknown> | null;
  status: ProductStatus;
  orgId: string | null;
  issuerId: string | null;
  createdAt: string;
  updatedAt: string;
}

/** Short projection used in catalogue listings. */
export interface ProductSummary {
  id: string;
  isin: string;
  name: string;
  payoffType: PayoffType;
  issuerName: string;
  underlyingYahoo: string;
  barrierCapPct: number;
  autocallBarrierPct: number | null;
  couponPct: number | null;
  maxGainPct: number;
  sri: number;
  maturityDate: string;
  entryFeePct: number;
  status: ProductStatus;
}

/**
 * Risk metrics attached to a Product (computed offline by the pricing engine).
 * Source of truth: apps/api/prisma/schema.prisma#RiskMetrics
 */
export interface RiskMetrics {
  id: string;
  productId: string;
  volatility1Y: number | null;
  sharpeRatio: number | null;
  maxDrawdown: number | null;
  mcSimulations: number | null;
  mcScenarios: Record<string, unknown> | null;
  calculatedAt: string;
}

/** Input used when creating a Product (platform or issuer admin). */
export type CreateProductInput = Omit<Product, 'id' | 'status' | 'createdAt' | 'updatedAt'>;

/** Partial update to a Product. Certain immutable fields (isin) are excluded. */
export type UpdateProductInput = Partial<Omit<Product, 'id' | 'isin' | 'createdAt' | 'updatedAt'>>;
