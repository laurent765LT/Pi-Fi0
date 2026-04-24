'use client';

// TODO: migrate Sprint 2 — replace with `useSMA()` TanStack Query hook.
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// ─── Types ──────────────────────────────────────────────────────────────────

export type SMAStrategy = 'income' | 'growth' | 'total-return';

export interface SMAComposition {
  productId: string;
  productName: string;
  weight: number; // %
}

export interface SMA {
  id: string;
  name: string;
  strategy: SMAStrategy;
  manager: string;
  managerBio: string;
  description: string;
  ticketMin: number;
  fees: number; // 0.15 = 15bps
  aum: number;
  inceptionDate: string;
  performance: {
    ytd: number;
    y1: number;
    y3: number;
    y5: number;
    since: number;
  };
  volatility: number;
  maxDrawdown: number;
  sharpeRatio: number;
  composition: SMAComposition[];
  monthlyReturns: number[]; // 36 months, newest last
}

interface SMAState {
  smas: SMA[];
  getById: (id: string) => SMA | undefined;
}

// ─── Deterministic return generator ─────────────────────────────────────────

function seededRandom(seed: number): () => number {
  let s = seed >>> 0;
  return () => {
    // xorshift32
    s ^= s << 13;
    s ^= s >>> 17;
    s ^= s << 5;
    // Map to [0, 1)
    return ((s >>> 0) % 1_000_000) / 1_000_000;
  };
}

function genMonthlyReturns(
  seed: number,
  meanAnnual: number,
  volAnnual: number,
): number[] {
  const rnd = seededRandom(seed);
  const mean = meanAnnual / 12;
  const vol = volAnnual / Math.sqrt(12);
  const returns: number[] = [];
  for (let i = 0; i < 36; i++) {
    // Box-Muller-ish using two uniforms
    const u1 = Math.max(1e-6, rnd());
    const u2 = rnd();
    const z = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
    returns.push(Number((mean + vol * z).toFixed(4)));
  }
  return returns;
}

function computeCumulativeFinal(returns: number[]): number {
  let cum = 1;
  for (const r of returns) cum *= 1 + r;
  return (cum - 1) * 100;
}

function computeAnnualizedVol(returns: number[]): number {
  const n = returns.length;
  const mean = returns.reduce((a, b) => a + b, 0) / n;
  const variance = returns.reduce((s, r) => s + (r - mean) ** 2, 0) / (n - 1 || 1);
  return Number((Math.sqrt(variance) * Math.sqrt(12) * 100).toFixed(2));
}

function computeMaxDD(returns: number[]): number {
  let cum = 1;
  let peak = 1;
  let maxDD = 0;
  for (const r of returns) {
    cum *= 1 + r;
    if (cum > peak) peak = cum;
    const dd = (cum - peak) / peak;
    if (dd < maxDD) maxDD = dd;
  }
  return Number((maxDD * 100).toFixed(2));
}

function computeSharpe(returns: number[], riskFreeAnnual: number): number {
  const n = returns.length;
  const mean = returns.reduce((a, b) => a + b, 0) / n;
  const rfMonthly = riskFreeAnnual / 12;
  const variance = returns.reduce((s, r) => s + (r - mean) ** 2, 0) / (n - 1 || 1);
  const vol = Math.sqrt(variance);
  if (vol === 0) return 0;
  // Annualized Sharpe
  const annualized = ((mean - rfMonthly) * 12) / (vol * Math.sqrt(12));
  return Number(annualized.toFixed(2));
}

// ─── Seed: 3 SMAs ───────────────────────────────────────────────────────────

// Income strategy — lower vol, steady coupons
const incomeReturns = genMonthlyReturns(11_111, 0.058, 0.042);
// Growth — higher mean, higher vol
const growthReturns = genMonthlyReturns(22_222, 0.095, 0.095);
// Total return — hybrid
const totalReturnReturns = genMonthlyReturns(33_333, 0.075, 0.068);

function buildPerfBlock(returns: number[]) {
  const ytd = computeCumulativeFinal(returns.slice(-4));
  const y1 = computeCumulativeFinal(returns.slice(-12));
  const y3 = computeCumulativeFinal(returns);
  // Simulate 5Y and since-inception with slight scaling
  const y5 = y3 * 1.42;
  const since = y3 * 1.68;
  return {
    ytd: Number(ytd.toFixed(2)),
    y1: Number(y1.toFixed(2)),
    y3: Number(y3.toFixed(2)),
    y5: Number(y5.toFixed(2)),
    since: Number(since.toFixed(2)),
  };
}

const SEED_SMAS: SMA[] = [
  {
    id: 'sma-income-001',
    name: "Strick'in Income Plus",
    strategy: 'income',
    manager: 'Benoît Leclerc, CFA',
    managerBio:
      "15 ans d'expérience dans la gestion de produits de taux et de stratégies de rendement. Spécialiste des autocalls à coupons et des notes à barrière conservatrices.",
    description:
      'Portefeuille orienté génération de revenus réguliers via des autocalls à coupons mémoires, des notes à capital protégé et des produits à taux conditionnel. Coupon cible 5-7% p.a.',
    ticketMin: 25_000,
    fees: 0.0015,
    aum: 42_700_000,
    inceptionDate: '2022-09-15',
    performance: buildPerfBlock(incomeReturns),
    volatility: computeAnnualizedVol(incomeReturns),
    maxDrawdown: computeMaxDD(incomeReturns),
    sharpeRatio: computeSharpe(incomeReturns, 0.025),
    composition: [
      { productId: 'prod-004', productName: 'M Equilibre CT', weight: 22 },
      { productId: 'prod-002', productName: 'M Rendement OR', weight: 18 },
      { productId: 'prod-003', productName: 'M Rendement Mixte', weight: 16 },
      { productId: 'prod-005', productName: 'M Ambition 10', weight: 14 },
      { productId: 'prod-007', productName: 'M Equilibre 7', weight: 12 },
      { productId: 'prod-001', productName: 'M Rendement 13', weight: 10 },
      { productId: 'prod-008', productName: 'M Equilibre 5', weight: 8 },
    ],
    monthlyReturns: incomeReturns,
  },
  {
    id: 'sma-growth-002',
    name: "Strick'in Growth Leaders",
    strategy: 'growth',
    manager: 'Amélie Varenne, CFA',
    managerBio:
      "12 ans dans la gestion systématique et les stratégies actions structurées. Mandat focalisé sur les sous-jacents actions leaders et la recherche de performance long terme.",
    description:
      "Portefeuille à dominante autocalls Phoenix et barrier notes sur actions et indices leaders. Objectif de performance annualisée 8-12%. Volatilité plus élevée, horizon 5+ ans.",
    ticketMin: 25_000,
    fees: 0.0018,
    aum: 31_200_000,
    inceptionDate: '2021-11-02',
    performance: buildPerfBlock(growthReturns),
    volatility: computeAnnualizedVol(growthReturns),
    maxDrawdown: computeMaxDD(growthReturns),
    sharpeRatio: computeSharpe(growthReturns, 0.025),
    composition: [
      { productId: 'prod-001', productName: 'M Rendement 13', weight: 24 },
      { productId: 'prod-005', productName: 'M Ambition 10', weight: 20 },
      { productId: 'prod-003', productName: 'M Rendement Mixte', weight: 18 },
      { productId: 'prod-007', productName: 'M Equilibre 7', weight: 14 },
      { productId: 'prod-008', productName: 'M Equilibre 5', weight: 12 },
      { productId: 'prod-009', productName: 'Selection Souverainete Europe', weight: 8 },
      { productId: 'prod-002', productName: 'M Rendement OR', weight: 4 },
    ],
    monthlyReturns: growthReturns,
  },
  {
    id: 'sma-total-003',
    name: "Strick'in Total Return",
    strategy: 'total-return',
    manager: 'Julien Marceau',
    managerBio:
      "20 ans d'expérience multi-actifs. Construction de portefeuilles hybrides combinant protection partielle du capital, coupons et exposition actions. Approche risk-parity.",
    description:
      'Stratégie hybride équilibrant rendement et capital protégé. Mix de produits à capital garanti, autocalls à coupons conditionnels et participation actions. Profil 50/50.',
    ticketMin: 25_000,
    fees: 0.0017,
    aum: 28_500_000,
    inceptionDate: '2023-03-20',
    performance: buildPerfBlock(totalReturnReturns),
    volatility: computeAnnualizedVol(totalReturnReturns),
    maxDrawdown: computeMaxDD(totalReturnReturns),
    sharpeRatio: computeSharpe(totalReturnReturns, 0.025),
    composition: [
      { productId: 'prod-004', productName: 'M Equilibre CT', weight: 18 },
      { productId: 'prod-002', productName: 'M Rendement OR', weight: 16 },
      { productId: 'prod-007', productName: 'M Equilibre 7', weight: 14 },
      { productId: 'prod-005', productName: 'M Ambition 10', weight: 12 },
      { productId: 'prod-001', productName: 'M Rendement 13', weight: 12 },
      { productId: 'prod-003', productName: 'M Rendement Mixte', weight: 10 },
      { productId: 'prod-008', productName: 'M Equilibre 5', weight: 10 },
      { productId: 'prod-009', productName: 'Selection Souverainete Europe', weight: 8 },
    ],
    monthlyReturns: totalReturnReturns,
  },
];

// ─── Store ──────────────────────────────────────────────────────────────────

export const useSMAStore = create<SMAState>()(
  persist(
    (_set, get) => ({
      smas: SEED_SMAS,
      getById: (id) => get().smas.find((s) => s.id === id),
    }),
    {
      name: 'strickin-sma',
      // Always refresh seed on rehydrate so metrics stay consistent across deploys.
      onRehydrateStorage: () => (state) => {
        if (!state) return;
        state.smas = SEED_SMAS;
      },
    },
  ),
);

// ─── Labels ─────────────────────────────────────────────────────────────────

export const SMA_STRATEGY_LABELS: Record<SMAStrategy, string> = {
  income: 'Revenu',
  growth: 'Croissance',
  'total-return': 'Total Return',
};

export const SMA_STRATEGY_COLORS: Record<
  SMAStrategy,
  { gradient: string; dot: string; text: string; bg: string; border: string }
> = {
  income: {
    gradient: 'linear-gradient(135deg, #D4A017 0%, #F0C84D 100%)',
    dot: '#D4A017',
    text: '#9B7210',
    bg: 'rgba(212, 160, 23, 0.10)',
    border: 'rgba(212, 160, 23, 0.25)',
  },
  growth: {
    gradient: 'linear-gradient(135deg, #3B1FA8 0%, #7B5FE0 100%)',
    dot: '#5535C4',
    text: '#3B1FA8',
    bg: 'rgba(59, 31, 168, 0.10)',
    border: 'rgba(59, 31, 168, 0.25)',
  },
  'total-return': {
    gradient: 'linear-gradient(135deg, #00B894 0%, #4FE0BE 100%)',
    dot: '#00B894',
    text: '#007A63',
    bg: 'rgba(0, 184, 148, 0.10)',
    border: 'rgba(0, 184, 148, 0.25)',
  },
};
