// ─── Secondary market opportunity scorer ────────────────────────────────────
// Rules:
// - YTM > primary coupon + 100bps → yield-pickup
// - Bid < 95% → discount opportunity
// - Barrier > 80% safe → barrier-safe
// - Autocall prob > 70% within 3 months → near-autocall

import type { SecondaryQuote } from './pricing-sync';

export type OpportunityType = 'yield-pickup' | 'discount' | 'barrier-safe' | 'near-autocall';

export interface SecondaryOpportunity {
  productId: string;
  score: number; // 0-100
  type: OpportunityType;
  reason: string;
}

// Lightweight product shape used by the scorer (matches DEMO_PRODUCTS).
export interface ScorableProduct {
  id: string;
  name: string;
  payoffType: string;
  couponPct: number | null;
  barrierCapPct: number | null;
  autocallBarrierPct?: number | null;
  maturityDate: string;
  sri?: number;
}

const TYPE_WEIGHTS: Record<OpportunityType, number> = {
  'yield-pickup': 0.9,
  discount: 0.8,
  'barrier-safe': 0.7,
  'near-autocall': 0.85,
};

function monthsUntil(date: string): number {
  const diff = new Date(date).getTime() - Date.now();
  return diff / (1000 * 60 * 60 * 24 * 30.44);
}

function clampScore(x: number): number {
  return Math.max(0, Math.min(100, x));
}

export function scoreOpportunities(
  quotes: SecondaryQuote[],
  products: ScorableProduct[],
): SecondaryOpportunity[] {
  const productById = new Map(products.map((p) => [p.id, p]));
  const opportunities: SecondaryOpportunity[] = [];

  for (const quote of quotes) {
    const product = productById.get(quote.productId);
    if (!product) continue;

    // 1) Yield pickup: YTM > primary coupon + 100bps
    if (product.couponPct != null) {
      const delta = quote.yieldToMaturity - product.couponPct;
      if (delta > 1) {
        const score = clampScore(
          30 + Math.min(50, delta * 12) + TYPE_WEIGHTS['yield-pickup'] * 20,
        );
        opportunities.push({
          productId: product.id,
          score,
          type: 'yield-pickup',
          reason: `Rendement à maturité ${quote.yieldToMaturity.toFixed(2)}% vs coupon primaire ${product.couponPct}% (+${delta.toFixed(2)}pts).`,
        });
      }
    }

    // 2) Discount: bid < 95
    if (quote.bid < 95) {
      const discount = 100 - quote.bid;
      const score = clampScore(
        25 + Math.min(55, discount * 6) + TYPE_WEIGHTS.discount * 20,
      );
      opportunities.push({
        productId: product.id,
        score,
        type: 'discount',
        reason: `Prix de rachat décoté: ${quote.bid.toFixed(2)}% (-${discount.toFixed(2)}pts sous le pair).`,
      });
    }

    // 3) Barrier-safe: barrier > 80 (i.e. barrierCapPct < 20 of initial level OR safety > 80)
    //    barrierCapPct in DEMO_PRODUCTS = barrier level as % of initial (eg 50 = 50%).
    //    "barrier safety > 80" means quote mid is well above barrier.
    if (product.barrierCapPct != null) {
      const mid = (quote.bid + quote.ask) / 2;
      const safetyBuffer = mid - product.barrierCapPct; // distance to barrier in %
      if (safetyBuffer > 30) {
        const score = clampScore(
          20 + Math.min(50, safetyBuffer * 0.8) + TYPE_WEIGHTS['barrier-safe'] * 20,
        );
        opportunities.push({
          productId: product.id,
          score,
          type: 'barrier-safe',
          reason: `Marge de sécurité sur la barrière: ${safetyBuffer.toFixed(1)}pts au-dessus (barrière ${product.barrierCapPct}%).`,
        });
      }
    }

    // 4) Near-autocall: autocall prob > 70% within 3 months.
    //    Proxied by bid price > autocallBarrierPct and time to next observation < 3m.
    if (product.autocallBarrierPct != null && product.autocallBarrierPct > 0) {
      const monthsToMaturity = monthsUntil(product.maturityDate);
      const mid = (quote.bid + quote.ask) / 2;
      // Heuristic: if mid is above autocall barrier and close-ish to autocall window
      if (mid >= product.autocallBarrierPct - 2 && monthsToMaturity < 36) {
        // Rough autocall probability
        const probProxy = Math.min(
          0.95,
          Math.max(0, 0.5 + (mid - product.autocallBarrierPct) / 20),
        );
        if (probProxy > 0.7) {
          const score = clampScore(
            40 + probProxy * 40 + TYPE_WEIGHTS['near-autocall'] * 20,
          );
          opportunities.push({
            productId: product.id,
            score,
            type: 'near-autocall',
            reason: `Probabilité d'autocall ~${(probProxy * 100).toFixed(0)}% (spot ${mid.toFixed(1)}% vs barrière ${product.autocallBarrierPct}%).`,
          });
        }
      }
    }
  }

  // Deduplicate: keep the highest-score opportunity per product
  const byProduct = new Map<string, SecondaryOpportunity>();
  for (const opp of opportunities) {
    const existing = byProduct.get(opp.productId);
    if (!existing || opp.score > existing.score) {
      byProduct.set(opp.productId, opp);
    }
  }

  return Array.from(byProduct.values()).sort((a, b) => b.score - a.score);
}

export function opportunityTypeLabel(type: OpportunityType): string {
  switch (type) {
    case 'yield-pickup':
      return 'Yield pickup';
    case 'discount':
      return 'Décote';
    case 'barrier-safe':
      return 'Barrière sécurisée';
    case 'near-autocall':
      return 'Autocall imminent';
  }
}

export function opportunityTypeColor(type: OpportunityType): string {
  switch (type) {
    case 'yield-pickup':
      return '#D4A017';
    case 'discount':
      return '#3D63F5';
    case 'barrier-safe':
      return '#007A63';
    case 'near-autocall':
      return '#3B1FA8';
  }
}
