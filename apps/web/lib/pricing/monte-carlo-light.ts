// ─── Monte Carlo (Light) ──────────────────────────────────────────────────────
// A small, deterministic simulation helper used by the "Et si ?" scenario block.
// We run a geometric Brownian motion for a handful of paths and aggregate
// the outcome metrics that matter for a structured-product fact sheet:
//   • product value after the shock
//   • probability of the autocall firing at the next observation
//   • expected coupon (€ per 100k invested)
//   • capital loss potential (€ per 100k invested)
//   • barrier breach flag

export interface ScenarioProductInput {
  couponPct: number; // annual coupon, in %
  barrierPct: number; // capital barrier, 0-100
  maturityYears: number;
  sri: number; // used to infer realistic volatility
  autocallBarrierPct?: number | null; // optional autocall trigger
}

export interface ScenarioResult {
  spotMove: number; // -50 to +50 %
  productValue: number; // in % of nominal
  autocallProbability: number; // 0-100 %
  expectedCoupon: number; // in € per 100k invested
  capitalLoss: number; // in € per 100k invested
  barrierBreached: boolean;
}

// Deterministic PRNG so the slider stays stable across re-renders.
function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Box-Muller transform to turn two uniforms into one standard normal.
function randNormal(rand: () => number): number {
  let u = 0;
  let v = 0;
  while (u === 0) u = rand();
  while (v === 0) v = rand();
  return Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
}

function volatilityFromSri(sri: number): number {
  // Approximate annual volatility from the SRI bucket.
  const table: Record<number, number> = {
    1: 0.02,
    2: 0.05,
    3: 0.1,
    4: 0.15,
    5: 0.2,
    6: 0.27,
    7: 0.35,
  };
  return table[sri] ?? 0.2;
}

function hashSeed(product: ScenarioProductInput, spotMove: number): number {
  const key = `${product.couponPct}|${product.barrierPct}|${product.maturityYears}|${product.sri}|${product.autocallBarrierPct ?? 'n'}|${spotMove.toFixed(2)}`;
  let h = 2166136261;
  for (let i = 0; i < key.length; i++) {
    h ^= key.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

export function simulateScenario(
  product: ScenarioProductInput,
  spotMove: number,
): ScenarioResult {
  const paths = 1000;
  const horizon = Math.max(0.25, Math.min(10, product.maturityYears));
  const vol = volatilityFromSri(product.sri);
  const riskFreeRate = 0.03;
  const dt = horizon;

  const rand = mulberry32(hashSeed(product, spotMove));

  const barrier = Math.max(10, Math.min(100, product.barrierPct || 50));
  const autocall = product.autocallBarrierPct ?? 100;
  const couponPct = product.couponPct ?? 0;

  // Starting spot after the instantaneous shock, in % of initial level.
  const s0 = 100 * (1 + spotMove / 100);

  let autocallHits = 0;
  let finalSum = 0;
  let breachedCount = 0;
  let couponSum = 0;
  let lossSum = 0;

  for (let i = 0; i < paths; i++) {
    const drift = (riskFreeRate - 0.5 * vol * vol) * dt;
    const shock = vol * Math.sqrt(dt) * randNormal(rand);
    const sT = s0 * Math.exp(drift + shock);

    // Autocall probability at the NEXT observation — use a shorter sub-path.
    const dtNext = Math.min(1, horizon); // next observation within 1y
    const driftNext = (riskFreeRate - 0.5 * vol * vol) * dtNext;
    const shockNext = vol * Math.sqrt(dtNext) * randNormal(rand);
    const sNext = s0 * Math.exp(driftNext + shockNext);
    if (sNext >= autocall) autocallHits++;

    if (sT < barrier) {
      breachedCount++;
      // Loss in percentage of nominal (linearly proportional to distance below barrier).
      const loss = Math.max(0, 100 - sT) / 100; // fraction
      lossSum += loss * 100_000; // in € per 100k
    } else {
      finalSum += Math.max(100, sT);
      // Coupon accrual — assumes half the coupons paid on average for the scenario.
      const couponAmount = (couponPct / 100) * horizon * 0.5 * 100_000;
      couponSum += couponAmount;
    }
  }

  const productValue = (finalSum + (paths - breachedCount > 0 ? 0 : 0)) / paths;
  const autocallProbability = (autocallHits / paths) * 100;
  const expectedCoupon = couponSum / paths;
  const capitalLoss = lossSum / paths;
  const barrierBreached = breachedCount / paths > 0.5;

  return {
    spotMove,
    productValue: Math.max(0, productValue || s0),
    autocallProbability: Math.max(0, Math.min(100, autocallProbability)),
    expectedCoupon: Math.round(expectedCoupon),
    capitalLoss: Math.round(capitalLoss),
    barrierBreached,
  };
}

export type ScenarioPresetKey = 'stress' | 'baisse' | 'stable' | 'hausse';

export const SCENARIO_PRESETS: { key: ScenarioPresetKey; label: string; spotMove: number; description: string }[] = [
  { key: 'stress', label: 'Stress -30%', spotMove: -30, description: 'Choc de march\u00e9 s\u00e9v\u00e8re' },
  { key: 'baisse', label: 'Baisse -10%', spotMove: -10, description: 'Correction mod\u00e9r\u00e9e' },
  { key: 'stable', label: 'Stable', spotMove: 0, description: 'March\u00e9 sans tendance' },
  { key: 'hausse', label: 'Hausse +20%', spotMove: 20, description: 'Environnement porteur' },
];

export function simulatePresets(
  product: ScenarioProductInput,
): Record<ScenarioPresetKey, ScenarioResult> {
  const result = {} as Record<ScenarioPresetKey, ScenarioResult>;
  for (const preset of SCENARIO_PRESETS) {
    result[preset.key] = simulateScenario(product, preset.spotMove);
  }
  return result;
}
