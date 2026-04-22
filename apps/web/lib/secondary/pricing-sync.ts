// ─── Secondary pricing sync (mock) ──────────────────────────────────────────
// Generates realistic bid/ask quotes for each demo product, deterministic
// per product ID + day-of-year. Simulates a 15-minute batch sync.

import { DEMO_PRODUCTS } from '@/lib/demo-data';
import { hashString, mulberry32 } from '@/lib/issuers/IssuerPricingAdapter';

export type LiquidityTier = 'Excellent' | 'Bon' | 'Moyen' | 'Faible';

export interface SecondaryQuote {
  productId: string;
  bid: number; // % of nominal
  ask: number;
  spread: number; // bps
  liquidity: LiquidityTier;
  timestamp: string;
  yieldToMaturity: number; // %
  change24h: number; // % change vs previous day
}

function dayOfYear(date: Date = new Date()): number {
  const start = Date.UTC(date.getUTCFullYear(), 0, 0);
  const diff = date.getTime() - start;
  return Math.floor(diff / (1000 * 60 * 60 * 24));
}

function pickLiquidity(seed: number): LiquidityTier {
  const rnd = mulberry32(seed)();
  if (rnd < 0.25) return 'Excellent';
  if (rnd < 0.6) return 'Bon';
  if (rnd < 0.85) return 'Moyen';
  return 'Faible';
}

function spreadForLiquidity(liquidity: LiquidityTier, rnd: () => number): number {
  // Spreads in basis points
  switch (liquidity) {
    case 'Excellent':
      return 10 + rnd() * 15; // 10-25 bps
    case 'Bon':
      return 25 + rnd() * 35; // 25-60 bps
    case 'Moyen':
      return 60 + rnd() * 60; // 60-120 bps
    case 'Faible':
      return 120 + rnd() * 130; // 120-250 bps
  }
}

export function generateQuote(product: (typeof DEMO_PRODUCTS)[number]): SecondaryQuote {
  const today = dayOfYear();
  const seed = hashString(`${product.id}|${today}`);
  const rnd = mulberry32(seed);

  const liquidity = pickLiquidity(seed);
  const spreadBps = spreadForLiquidity(liquidity, rnd);

  // Mid price influenced by product performance proxies
  const barrierSafety = product.barrierCapPct ? (100 - product.barrierCapPct) / 100 : 0.4;
  const maturityYears = Math.max(
    0.5,
    (new Date(product.maturityDate).getTime() - Date.now()) / (365 * 24 * 3600 * 1000),
  );
  const sri = product.sri ?? 4;

  // Base mid 97-103
  const baseMid = 100 + (rnd() - 0.5) * 6;
  // Adjust for barrier / sri / maturity
  const mid = Math.max(
    70,
    Math.min(110, baseMid + barrierSafety * 1.5 - (sri - 3) * 0.5 - Math.min(2, maturityYears * 0.1)),
  );

  const bid = +(mid - (spreadBps / 2) / 100).toFixed(2);
  const ask = +(mid + (spreadBps / 2) / 100).toFixed(2);
  const spread = +spreadBps.toFixed(1);

  // 24h change: deterministic drift -1% to +1%
  const change24h = +((rnd() - 0.5) * 2).toFixed(2);

  // Yield to maturity estimate based on coupon + mid price
  const coupon = product.couponPct ?? product.maxGainPct ? product.couponPct ?? 0 : 0;
  const effectiveCoupon = coupon > 0 ? coupon : 4 + rnd() * 4;
  const yieldToMaturity = +(effectiveCoupon + (100 - mid) / Math.max(1, maturityYears)).toFixed(2);

  return {
    productId: product.id,
    bid,
    ask,
    spread,
    liquidity,
    timestamp: new Date().toISOString(),
    yieldToMaturity,
    change24h,
  };
}

/**
 * Simulate a 15-minute batch sync: small delay to evoke a real sync, then
 * return a keyed map of quotes for every demo product.
 */
export async function syncSecondaryPricing(): Promise<Record<string, SecondaryQuote>> {
  // Small async delay to feel like a real sync
  await new Promise((resolve) => setTimeout(resolve, 450));

  const quotes: Record<string, SecondaryQuote> = {};
  for (const product of DEMO_PRODUCTS) {
    quotes[product.id] = generateQuote(product);
  }
  return quotes;
}

export function seedQuotes(): Record<string, SecondaryQuote> {
  const quotes: Record<string, SecondaryQuote> = {};
  for (const product of DEMO_PRODUCTS) {
    quotes[product.id] = generateQuote(product);
  }
  return quotes;
}
