// ─── ESG Scoring Engine ───────────────────────────────────────────────────────
// Deterministic mock ESG data derivation based on a product id.
// Every call for the same productId returns the exact same result so the demo
// stays stable across reloads and across components.

import type { ESGData, ExclusionKey, SFDRClassification } from './sfdr-schema';

// Tiny, stable string hash (fnv-1a style). Deterministic, no external deps.
function hashString(input: string): number {
  let h = 2166136261;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

// Deterministic pseudo-random generator seeded from a hash. Yields numbers in [0, 1).
function seeded(seed: number): () => number {
  let s = seed || 1;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 0xffffffff;
  };
}

// Normalize a float into an integer 0-100 with a min floor so the value
// never goes below a lower bound (prevents unreadable sub-scores like 2/100).
function clampInt(value: number, min = 0, max = 100): number {
  return Math.max(min, Math.min(max, Math.round(value)));
}

function pickSFDR(rand: () => number): SFDRClassification {
  const r = rand();
  // Distribution: ~30% non-esg, ~40% art8, ~25% art9, ~5% art6
  if (r < 0.3) return 'non-esg';
  if (r < 0.7) return 'art8';
  if (r < 0.95) return 'art9';
  return 'art6';
}

const ALL_EXCLUSIONS: ExclusionKey[] = [
  'tabac',
  'armes',
  'energies-fossiles',
  'charbon',
  'alcool-fort',
  'jeux',
];

function pickExclusions(sfdr: SFDRClassification, rand: () => number): ExclusionKey[] {
  // Non-ESG rarely has formal exclusions. Art 6 may have a couple.
  // Art 8 usually has 2-4 exclusions, Art 9 has 4-6.
  let count: number;
  switch (sfdr) {
    case 'non-esg':
      count = rand() < 0.85 ? 0 : 1;
      break;
    case 'art6':
      count = rand() < 0.5 ? 0 : 1 + Math.floor(rand() * 2);
      break;
    case 'art8':
      count = 2 + Math.floor(rand() * 3); // 2-4
      break;
    case 'art9':
      count = 4 + Math.floor(rand() * 3); // 4-6
      break;
  }

  if (count <= 0) return [];
  // Deterministic Fisher-Yates shuffle on a local copy.
  const pool = [...ALL_EXCLUSIONS];
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    const tmp = pool[i]!;
    pool[i] = pool[j]!;
    pool[j] = tmp;
  }
  return pool.slice(0, Math.min(count, pool.length));
}

export function mockESGForProduct(productId: string): ESGData {
  const seed = hashString(productId);
  const rand = seeded(seed);

  // Burn a few draws so same id sequence feels well-distributed.
  rand();
  rand();

  const sfdr = pickSFDR(rand);

  // Score ranges vary per classification — Art 9 products have the highest
  // floor, Art 6 / non-ESG skew noticeably lower.
  let envBase: number;
  let socBase: number;
  let govBase: number;
  switch (sfdr) {
    case 'art9':
      envBase = 72 + rand() * 22; // 72-94
      socBase = 65 + rand() * 25; // 65-90
      govBase = 68 + rand() * 25;
      break;
    case 'art8':
      envBase = 55 + rand() * 25; // 55-80
      socBase = 50 + rand() * 28;
      govBase = 55 + rand() * 28;
      break;
    case 'art6':
      envBase = 35 + rand() * 25; // 35-60
      socBase = 40 + rand() * 25;
      govBase = 45 + rand() * 25;
      break;
    case 'non-esg':
      envBase = 20 + rand() * 35; // 20-55
      socBase = 28 + rand() * 32;
      govBase = 35 + rand() * 30;
      break;
  }

  const environment = clampInt(envBase);
  const social = clampInt(socBase);
  const governance = clampInt(govBase);

  // Overall score is a weighted blend (environment counts slightly more for
  // ESG products, governance for non-ESG) with a small SFDR bonus.
  const isEsg = sfdr !== 'non-esg' && sfdr !== 'art6';
  const weightedRaw = isEsg
    ? environment * 0.45 + social * 0.3 + governance * 0.25
    : environment * 0.3 + social * 0.3 + governance * 0.4;
  const sfdrBonus = sfdr === 'art9' ? 4 : sfdr === 'art8' ? 2 : 0;
  const overallScore = clampInt(weightedRaw + sfdrBonus);

  // Taxonomy alignment — Art 9 must be high, non-ESG near zero.
  let taxonomyAlignment: number;
  switch (sfdr) {
    case 'art9':
      // Intentionally sometimes below 50% to trigger the greenwashing rule.
      taxonomyAlignment = clampInt(35 + rand() * 55); // 35-90
      break;
    case 'art8':
      taxonomyAlignment = clampInt(15 + rand() * 45); // 15-60
      break;
    case 'art6':
      taxonomyAlignment = clampInt(5 + rand() * 25); // 5-30
      break;
    case 'non-esg':
      taxonomyAlignment = clampInt(rand() * 15); // 0-15
      break;
  }

  // Fossil fuel exposure — inversely correlated with env score for ESG tiers.
  let fossilFuelExposure: number;
  switch (sfdr) {
    case 'art9':
      // Some Art 9 products will exceed 10% to surface the greenwashing rule.
      fossilFuelExposure = clampInt(rand() * 18);
      break;
    case 'art8':
      fossilFuelExposure = clampInt(5 + rand() * 20);
      break;
    case 'art6':
      fossilFuelExposure = clampInt(15 + rand() * 30);
      break;
    case 'non-esg':
      fossilFuelExposure = clampInt(20 + rand() * 45);
      break;
  }

  const exclusions = pickExclusions(sfdr, rand);

  return {
    overallScore,
    subScores: {
      environment,
      social,
      governance,
    },
    sfdr,
    exclusions,
    taxonomyAlignment,
    fossilFuelExposure,
  };
}

// Convenience helper used by the ESG dashboard.
export interface ESGSummary {
  productId: string;
  productName: string;
  esg: ESGData;
}

export function buildESGSummaries<T extends { id: string; name: string }>(
  products: readonly T[],
): ESGSummary[] {
  return products.map((p) => ({
    productId: p.id,
    productName: p.name,
    esg: mockESGForProduct(p.id),
  }));
}
