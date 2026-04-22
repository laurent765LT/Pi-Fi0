// ─── Client Portfolio Aggregation Engine ────────────────────────────────────
// Pure, dependency-free aggregation utilities that turn a client's contracts
// (multi-insurer) into consolidated views: exposure totals, YTD attribution,
// merged timeline, and a 0-100 portfolio health score.

import { DEMO_PRODUCTS } from '@/lib/demo-data';
import {
  useConsolidatedClientsStore,
  type ConsolidatedClient,
  type ClientContract,
  type InsurerName,
} from '@/stores/clients-consolidated-store';

// ─── Types ──────────────────────────────────────────────────────────────────

export interface DemoProduct {
  id: string;
  isin: string;
  name: string;
  payoffType: string;
  issuerName: string;
  underlyingYahoo?: string | null;
  underlyingName: string;
  barrierCapPct: number | null;
  autocallBarrierPct: number | null;
  couponPct: number | null;
  maxGainPct: number | null;
  sri: number;
  maturityDate: string;
  entryFeePct: number | null;
  status: string;
  description?: string;
  observationDates?: string[];
  shelfClosingDate?: string;
}

export interface AggregatedProduct {
  productId: string;
  product: DemoProduct | null;
  amount: number;
  contractId: string;
  insurer: InsurerName;
}

export interface ContractAggregate {
  contract: ClientContract;
  products: AggregatedProduct[];
  productsCount: number;
  amountTotal: number;
  ytdPct: number;
}

export interface UnderlyingAggregate {
  underlying: string;
  amount: number;
  count: number;
  pct: number;
}

export interface PayoffAggregate {
  payoffType: string;
  amount: number;
  count: number;
  pct: number;
}

export interface ClientPortfolioAggregate {
  clientId: string;
  totalExposure: number;
  productsCount: number;
  contractsCount: number;
  products: AggregatedProduct[];
  contracts: ContractAggregate[];
  underlyings: UnderlyingAggregate[];
  payoffs: PayoffAggregate[];
  ytdByInsurer: Array<{ insurer: InsurerName; ytdPct: number; amount: number }>;
  avgSri: number;
  avgCoupon: number;
}

export interface ClientEvent {
  date: string;
  dateMs: number;
  productId: string;
  productName: string;
  insurer: InsurerName;
  contractId: string;
  type: 'observation' | 'maturity' | 'closing' | 'coupon';
  label: string;
}

// ─── Helpers ────────────────────────────────────────────────────────────────

const PRODUCT_MAP = new Map<string, DemoProduct>();
for (const p of DEMO_PRODUCTS as unknown as DemoProduct[]) {
  PRODUCT_MAP.set(p.id, p);
}

function findProduct(id: string): DemoProduct | null {
  return PRODUCT_MAP.get(id) ?? null;
}

function getClient(clientId: string): ConsolidatedClient | undefined {
  return useConsolidatedClientsStore.getState().getById(clientId);
}

/**
 * Deterministic YTD return generator based on a seed string. Values between
 * -8 and +18 %, stable across renders (so charts don't flicker).
 */
function seededYtd(seed: string): number {
  let h = 0;
  for (let i = 0; i < seed.length; i++) {
    h = ((h << 5) - h + seed.charCodeAt(i)) | 0;
  }
  const normalized = Math.abs(h) % 2600; // 0..2599
  return (normalized / 100) - 8; // -8..+17.99
}

// ─── Public API ─────────────────────────────────────────────────────────────

/**
 * Aggregate a client's portfolio across all contracts. Returns totals, per
 * contract breakdown, exposure by underlying and by payoff type, plus YTD
 * attribution by insurer.
 */
export function aggregateClientPortfolio(
  clientId: string,
): ClientPortfolioAggregate | null {
  const client = getClient(clientId);
  if (!client) return null;

  const products: AggregatedProduct[] = [];
  const contractAggs: ContractAggregate[] = [];
  const underlyingMap = new Map<string, { amount: number; count: number }>();
  const payoffMap = new Map<string, { amount: number; count: number }>();
  const ytdByInsurerMap = new Map<InsurerName, { amount: number; ytd: number }>();

  let totalExposure = 0;
  let totalSriWeighted = 0;
  let totalSriWeight = 0;
  let totalCouponWeighted = 0;
  let totalCouponWeight = 0;

  for (const contract of client.contracts) {
    const productsForContract: AggregatedProduct[] = [];

    // Weight each product within the contract proportionally to the number of
    // lines (flat) — keeps math simple and realistic for demo data.
    const perLineAmount =
      contract.productIds.length > 0
        ? contract.amountTotal / contract.productIds.length
        : 0;

    for (const pid of contract.productIds) {
      const product = findProduct(pid);
      const agg: AggregatedProduct = {
        productId: pid,
        product,
        amount: perLineAmount,
        contractId: contract.id,
        insurer: contract.insurer,
      };
      products.push(agg);
      productsForContract.push(agg);

      // Tally by underlying
      const underlyingLabel = product?.underlyingName ?? 'Inconnu';
      const uPrev = underlyingMap.get(underlyingLabel) ?? {
        amount: 0,
        count: 0,
      };
      underlyingMap.set(underlyingLabel, {
        amount: uPrev.amount + perLineAmount,
        count: uPrev.count + 1,
      });

      // Tally by payoff type
      const payoffLabel = product?.payoffType ?? 'AUTRE';
      const pPrev = payoffMap.get(payoffLabel) ?? { amount: 0, count: 0 };
      payoffMap.set(payoffLabel, {
        amount: pPrev.amount + perLineAmount,
        count: pPrev.count + 1,
      });

      // Risk & yield
      if (product?.sri != null) {
        totalSriWeighted += product.sri * perLineAmount;
        totalSriWeight += perLineAmount;
      }
      if (product?.couponPct != null) {
        totalCouponWeighted += product.couponPct * perLineAmount;
        totalCouponWeight += perLineAmount;
      }
    }

    // Contract YTD — seeded by contract id for stability.
    const ytdPct = seededYtd(`${client.id}-${contract.id}`);

    contractAggs.push({
      contract,
      products: productsForContract,
      productsCount: contract.productIds.length,
      amountTotal: contract.amountTotal,
      ytdPct,
    });

    const insurerPrev = ytdByInsurerMap.get(contract.insurer) ?? {
      amount: 0,
      ytd: 0,
    };
    ytdByInsurerMap.set(contract.insurer, {
      amount: insurerPrev.amount + contract.amountTotal,
      // Weighted YTD (amount-weighted)
      ytd: insurerPrev.ytd + ytdPct * contract.amountTotal,
    });

    totalExposure += contract.amountTotal;
  }

  const underlyings: UnderlyingAggregate[] = Array.from(
    underlyingMap.entries(),
  )
    .map(([underlying, data]) => ({
      underlying,
      amount: data.amount,
      count: data.count,
      pct: totalExposure > 0 ? (data.amount / totalExposure) * 100 : 0,
    }))
    .sort((a, b) => b.amount - a.amount);

  const payoffs: PayoffAggregate[] = Array.from(payoffMap.entries())
    .map(([payoffType, data]) => ({
      payoffType,
      amount: data.amount,
      count: data.count,
      pct: totalExposure > 0 ? (data.amount / totalExposure) * 100 : 0,
    }))
    .sort((a, b) => b.amount - a.amount);

  const ytdByInsurer = Array.from(ytdByInsurerMap.entries())
    .map(([insurer, data]) => ({
      insurer,
      ytdPct: data.amount > 0 ? data.ytd / data.amount : 0,
      amount: data.amount,
    }))
    .sort((a, b) => b.amount - a.amount);

  const avgSri = totalSriWeight > 0 ? totalSriWeighted / totalSriWeight : 0;
  const avgCoupon =
    totalCouponWeight > 0 ? totalCouponWeighted / totalCouponWeight : 0;

  return {
    clientId,
    totalExposure,
    productsCount: products.length,
    contractsCount: client.contracts.length,
    products: products.sort((a, b) => b.amount - a.amount),
    contracts: contractAggs,
    underlyings,
    payoffs,
    ytdByInsurer,
    avgSri,
    avgCoupon,
  };
}

/**
 * Build a merged timeline of all upcoming events (observations, maturities,
 * closings, coupons) for a client across every contract, sorted by date.
 */
export function getClientEvents(clientId: string): ClientEvent[] {
  const client = getClient(clientId);
  if (!client) return [];

  const now = Date.now();
  const events: ClientEvent[] = [];

  for (const contract of client.contracts) {
    for (const pid of contract.productIds) {
      const product = findProduct(pid);
      if (!product) continue;
      const productName = product.name;

      if (Array.isArray(product.observationDates)) {
        for (const d of product.observationDates) {
          const ms = new Date(d).getTime();
          if (!Number.isNaN(ms) && ms >= now) {
            events.push({
              date: d,
              dateMs: ms,
              productId: pid,
              productName,
              insurer: contract.insurer,
              contractId: contract.id,
              type: 'observation',
              label: "Date d'observation",
            });
          }
        }
      }

      if (product.shelfClosingDate) {
        const ms = new Date(product.shelfClosingDate).getTime();
        if (!Number.isNaN(ms) && ms >= now) {
          events.push({
            date: product.shelfClosingDate,
            dateMs: ms,
            productId: pid,
            productName,
            insurer: contract.insurer,
            contractId: contract.id,
            type: 'closing',
            label: 'Date de clôture',
          });
        }
      }

      if (product.maturityDate) {
        const ms = new Date(product.maturityDate).getTime();
        if (!Number.isNaN(ms) && ms >= now) {
          events.push({
            date: product.maturityDate,
            dateMs: ms,
            productId: pid,
            productName,
            insurer: contract.insurer,
            contractId: contract.id,
            type: 'maturity',
            label: 'Maturité',
          });
        }
      }

      // Synthesize a coupon event for products that pay coupons — next Dec 1st
      if (product.couponPct != null && product.couponPct > 0) {
        const thisYear = new Date().getFullYear();
        const couponDate = new Date(thisYear, 11, 1); // Dec 1
        if (couponDate.getTime() < now) {
          couponDate.setFullYear(thisYear + 1);
        }
        events.push({
          date: couponDate.toISOString().slice(0, 10),
          dateMs: couponDate.getTime(),
          productId: pid,
          productName,
          insurer: contract.insurer,
          contractId: contract.id,
          type: 'coupon',
          label: `Coupon ${product.couponPct.toFixed(1)}%`,
        });
      }
    }
  }

  events.sort((a, b) => a.dateMs - b.dateMs);
  return events;
}

/**
 * Compute a 0-100 portfolio health score based on four factors:
 *   - Diversification by underlying (25)
 *   - Diversification by insurer   (25)
 *   - Risk (weighted SRI)          (25)
 *   - Concentration (largest line) (25)
 */
export function getClientHealthScore(clientId: string): number {
  const agg = aggregateClientPortfolio(clientId);
  if (!agg || agg.totalExposure === 0) return 0;

  // 1) Underlying diversification — more distinct underlyings = better, up to 8.
  const underlyingScore = Math.min(25, (agg.underlyings.length / 8) * 25);

  // 2) Insurer diversification — up to 4 insurers rewarded fully.
  const insurerScore = Math.min(25, (agg.ytdByInsurer.length / 4) * 25);

  // 3) Risk — SRI 1 = best (25), SRI 7 = worst (0).
  const riskScore = Math.max(0, Math.min(25, ((7 - agg.avgSri) / 6) * 25));

  // 4) Concentration — if largest underlying > 40% portfolio, penalise.
  const topUnderlyingPct =
    agg.underlyings.length > 0 ? agg.underlyings[0].pct : 100;
  const concentrationScore = Math.max(
    0,
    Math.min(25, ((50 - Math.min(50, topUnderlyingPct)) / 50) * 25),
  );

  return Math.round(
    underlyingScore + insurerScore + riskScore + concentrationScore,
  );
}

/**
 * Convenience: get a summary row for a client (used by the list view).
 */
export interface ClientListRow {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  contractsCount: number;
  productsCount: number;
  exposure: number;
  nextEventDate: string | null;
  createdAt: string;
}

export function getClientListRow(client: ConsolidatedClient): ClientListRow {
  const exposure = client.contracts.reduce((acc, c) => acc + c.amountTotal, 0);
  const productsCount = client.contracts.reduce(
    (acc, c) => acc + c.productIds.length,
    0,
  );
  const events = getClientEvents(client.id);
  const nextEventDate = events.length > 0 ? events[0].date : null;

  return {
    id: client.id,
    firstName: client.firstName,
    lastName: client.lastName,
    email: client.email,
    contractsCount: client.contracts.length,
    productsCount,
    exposure,
    nextEventDate,
    createdAt: client.createdAt,
  };
}

// ─── Payoff labels (kept consistent with portfolio-pdf) ─────────────────────

export const PAYOFF_LABELS: Record<string, string> = {
  AUTOCALL_PHOENIX: 'Autocall Phoenix',
  AUTOCALL_COUPON: 'Autocall Coupon',
  CAPITAL_PROTECTED: 'Capital Protégé',
  CONDITIONAL_RATE: 'Taux Conditionnel',
  BARRIER_NOTE: 'Barrier Note',
  AUTRE: 'Autre',
};

export const PAYOFF_COLORS: Record<string, string> = {
  AUTOCALL_PHOENIX: '#3B1FA8',
  AUTOCALL_COUPON: '#5B3FD4',
  CAPITAL_PROTECTED: '#00B894',
  CONDITIONAL_RATE: '#D4A017',
  BARRIER_NOTE: '#E8334A',
  AUTRE: '#7B6FA0',
};
