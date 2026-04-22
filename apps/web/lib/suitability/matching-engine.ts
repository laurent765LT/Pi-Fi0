// ─── Suitability matching engine ────────────────────────────────────────────
// Calcule un score d'adequation (0-100) entre le Target Market positif d'un
// produit structure et le profil d'un client CGP. Chaque dimension pese
// equitablement (~16.7 pts). Seuils retenus :
//   - match   : >= 75
//   - partial : 50 - 74
//   - no-match: < 50

import {
  KNOWLEDGE_LEVELS,
  EXPERIENCE_LEVELS,
  LOSS_CAPACITY,
  RISK_TOLERANCE,
  OBJECTIVES,
  HORIZONS,
  type ClientProfile,
  type DimensionKey,
  type Horizon,
  type KnowledgeLevel,
  type LossCapacity,
  type Objective,
  type RiskTolerance,
  type ExperienceLevel,
  type TargetMarket,
} from './target-market-schema';

// ─── Types ──────────────────────────────────────────────────────────────────

export interface SuitabilityDimension {
  /** True si la valeur du client est dans le Target Market positif. */
  match: boolean;
  /** Poids de la dimension en points (somme = 100). */
  weight: number;
}

export interface SuitabilityResult {
  /** Score d'adequation de 0 a 100 (arrondi a l'entier). */
  score: number;
  /** Niveau synthetique d'adequation. */
  level: 'match' | 'partial' | 'no-match';
  dimensions: Record<DimensionKey, SuitabilityDimension>;
}

// ─── Constantes ─────────────────────────────────────────────────────────────

const DIMENSION_WEIGHT = 100 / 6; // ~16.67
const MATCH_THRESHOLD = 75;
const PARTIAL_THRESHOLD = 50;

// ─── Moteur d'adequation ────────────────────────────────────────────────────

/**
 * Calcule l'adequation entre un Target Market et un profil client.
 * Chaque dimension est binaire : match (100% du poids) ou non (0%).
 * Les objectifs sont matches si au moins un objectif du client est
 * present dans le Target Market (intersection non vide).
 */
export function computeSuitability(
  tm: TargetMarket,
  client: ClientProfile,
): SuitabilityResult {
  const knowledgeMatch = tm.knowledge.includes(client.knowledge);
  const experienceMatch = tm.experience.includes(client.experience);
  const lossCapacityMatch = tm.lossCapacity.includes(client.lossCapacity);
  const riskToleranceMatch = tm.riskTolerance.includes(client.riskTolerance);
  const objectivesMatch =
    client.objectives.length > 0 &&
    client.objectives.some((o) => tm.objectives.includes(o));
  const horizonMatch = tm.horizons.includes(client.horizon);

  const dimensions: Record<DimensionKey, SuitabilityDimension> = {
    knowledge: { match: knowledgeMatch, weight: DIMENSION_WEIGHT },
    experience: { match: experienceMatch, weight: DIMENSION_WEIGHT },
    lossCapacity: { match: lossCapacityMatch, weight: DIMENSION_WEIGHT },
    riskTolerance: { match: riskToleranceMatch, weight: DIMENSION_WEIGHT },
    objectives: { match: objectivesMatch, weight: DIMENSION_WEIGHT },
    horizon: { match: horizonMatch, weight: DIMENSION_WEIGHT },
  };

  const rawScore = (Object.values(dimensions) as SuitabilityDimension[])
    .filter((d) => d.match)
    .reduce((acc, d) => acc + d.weight, 0);

  const score = Math.round(rawScore);

  let level: SuitabilityResult['level'];
  if (score >= MATCH_THRESHOLD) level = 'match';
  else if (score >= PARTIAL_THRESHOLD) level = 'partial';
  else level = 'no-match';

  return { score, level, dimensions };
}

// ─── PRNG deterministe (mulberry32) ─────────────────────────────────────────

/**
 * Hash 32-bit deterministe d'une chaine (FNV-1a simplifie) pour initialiser
 * mulberry32. Stable pour un meme productId entre rendus serveur/client.
 */
function hashString(input: string): number {
  let hash = 2166136261 >>> 0;
  for (let i = 0; i < input.length; i++) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

/**
 * Generateur pseudo-aleatoire mulberry32 : rapide, deterministe et
 * statistiquement correct pour un usage de mock UI.
 */
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

/** Tire N elements uniques d'un tableau avec un PRNG deterministe. */
function sampleUnique<T>(arr: readonly T[], rand: () => number, count: number): T[] {
  const n = Math.max(1, Math.min(count, arr.length));
  const pool = [...arr];
  const out: T[] = [];
  for (let i = 0; i < n; i++) {
    const idx = Math.floor(rand() * pool.length);
    const [item] = pool.splice(idx, 1);
    if (item !== undefined) out.push(item);
  }
  return out;
}

/** Selectionne tous les elements du tableau a partir d'un index donne. */
function tail<T>(arr: readonly T[], fromIndex: number): T[] {
  return arr.slice(Math.max(0, Math.min(arr.length - 1, fromIndex)));
}

// ─── Mock Target Market deterministe ───────────────────────────────────────

export interface MockTargetMarketOptions {
  /** SRI 1-7 du produit : plus le SRI est eleve, plus le TM est restrictif. */
  sri?: number;
  /** Horizon minimum pour le produit (en annees). */
  minYears?: number;
}

/**
 * Genere un Target Market mock, deterministe pour un productId donne,
 * avec une logique de coherence avec le SRI :
 *   - SRI ≥ 6  : connaissance 'averti'/'expert', experience ≥ 3 ans,
 *                capacite de perte 30% et 100%, tolerance risque elevee
 *   - SRI 4-5  : mix averti/informe, experience 1-3 et 3-5 ans,
 *                capacite de perte 10% et 30%, tolerance moyenne/elevee
 *   - SRI ≤ 3  : accessible (basique/informe), capital protege,
 *                capacite de perte faible, tolerance basse
 */
export function mockTargetMarketForProduct(
  productId: string,
  options: MockTargetMarketOptions = {},
): TargetMarket {
  const { sri = 4, minYears } = options;
  const seed = hashString(productId);
  const rand = mulberry32(seed);

  // Tranches de risque du produit
  const highRisk = sri >= 6;
  const midRisk = sri >= 4 && sri < 6;

  // ─── Connaissance ────────────────────────────────────────────────────────
  let knowledgePool: readonly KnowledgeLevel[];
  if (highRisk) {
    knowledgePool = tail(KNOWLEDGE_LEVELS, 2); // averti, expert
  } else if (midRisk) {
    knowledgePool = tail(KNOWLEDGE_LEVELS, 1); // informe, averti, expert
  } else {
    knowledgePool = KNOWLEDGE_LEVELS;
  }
  const knowledge = sampleUnique<KnowledgeLevel>(
    knowledgePool,
    rand,
    Math.max(1, knowledgePool.length - Math.floor(rand() * 2)),
  );

  // ─── Experience ──────────────────────────────────────────────────────────
  let experiencePool: readonly ExperienceLevel[];
  if (highRisk) {
    experiencePool = tail(EXPERIENCE_LEVELS, 2); // 3a5ans, plus5ans
  } else if (midRisk) {
    experiencePool = tail(EXPERIENCE_LEVELS, 1); // 1a3ans, 3a5ans, plus5ans
  } else {
    experiencePool = EXPERIENCE_LEVELS;
  }
  const experience = sampleUnique<ExperienceLevel>(
    experiencePool,
    rand,
    Math.max(1, experiencePool.length - Math.floor(rand() * 2)),
  );

  // ─── Capacite de perte ──────────────────────────────────────────────────
  let lossPool: readonly LossCapacity[];
  if (highRisk) {
    lossPool = LOSS_CAPACITY.filter((v) => v >= 30);
  } else if (midRisk) {
    lossPool = LOSS_CAPACITY.filter((v) => v >= 10 && v <= 30);
  } else {
    lossPool = LOSS_CAPACITY.filter((v) => v <= 30);
  }
  const lossCapacity = sampleUnique<LossCapacity>(
    lossPool,
    rand,
    Math.max(1, lossPool.length - Math.floor(rand() * 2)),
  );

  // ─── Tolerance au risque ────────────────────────────────────────────────
  let riskPool: readonly RiskTolerance[];
  if (highRisk) {
    riskPool = tail(RISK_TOLERANCE, 2); // moyenne, elevee
  } else if (midRisk) {
    riskPool = tail(RISK_TOLERANCE, 1); // faible, moyenne, elevee
  } else {
    riskPool = RISK_TOLERANCE;
  }
  const riskTolerance = sampleUnique<RiskTolerance>(
    riskPool,
    rand,
    Math.max(1, riskPool.length - Math.floor(rand() * 2)),
  );

  // ─── Objectifs ──────────────────────────────────────────────────────────
  let objectivesPool: readonly Objective[];
  if (highRisk) {
    objectivesPool = (['croissance', 'speculation'] as const);
  } else if (midRisk) {
    objectivesPool = (['revenus', 'croissance'] as const);
  } else {
    objectivesPool = (['preservation', 'revenus'] as const);
  }
  const objectives = sampleUnique<Objective>(
    objectivesPool,
    rand,
    Math.max(1, objectivesPool.length),
  );

  // ─── Horizon ────────────────────────────────────────────────────────────
  let horizonsPool: readonly Horizon[];
  if (minYears != null && minYears >= 8) {
    horizonsPool = (['plus8ans'] as const);
  } else if (minYears != null && minYears >= 5) {
    horizonsPool = (['5a8ans', 'plus8ans'] as const);
  } else if (highRisk) {
    horizonsPool = (['5a8ans', 'plus8ans'] as const);
  } else if (midRisk) {
    horizonsPool = (['3a5ans', '5a8ans', 'plus8ans'] as const);
  } else {
    horizonsPool = HORIZONS;
  }
  const horizons = sampleUnique<Horizon>(
    horizonsPool,
    rand,
    Math.max(1, horizonsPool.length),
  );

  return { knowledge, experience, lossCapacity, riskTolerance, objectives, horizons };
}

// ─── Profil client demo (utilise par defaut dans les vues CGP) ──────────────

/**
 * Profil client par defaut utilise pour les previsualisations lorsque
 * aucun client n'est selectionne. Valeurs medianes, profil equilibre.
 */
export const DEFAULT_CLIENT_PROFILE: ClientProfile = {
  knowledge: 'informe',
  experience: '1a3ans',
  lossCapacity: 30,
  riskTolerance: 'moyenne',
  objectives: ['revenus', 'croissance'],
  horizon: '5a8ans',
};
