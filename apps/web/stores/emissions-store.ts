'use client';

// TODO: migrate Sprint 2 — replace with `useEmissions()` / `useEvents()` TanStack Query hook.
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// ─── Types ──────────────────────────────────────────────────────────────────

export type EmissionIssuer =
  | 'BNP Paribas'
  | 'Société Générale'
  | 'Natixis'
  | 'Goldman Sachs'
  | 'Marex';

export type EmissionType =
  | 'AUTOCALL_PHOENIX'
  | 'AUTOCALL_COUPON'
  | 'CAPITAL_PROTECTED'
  | 'CONDITIONAL_RATE'
  | 'BARRIER_NOTE';

export type EmissionStatus = 'announced' | 'premarketing' | 'open' | 'closed';

export interface UpcomingEmission {
  id: string;
  productName: string;
  issuer: EmissionIssuer;
  type: EmissionType;
  underlying: string;
  expectedCoupon: number; // %
  expectedBarrier: number; // %
  expectedMaturityYears: number;
  minTicket: number;
  subscriptionStart: string; // ISO date
  subscriptionEnd: string;
  status: EmissionStatus;
  description?: string;
}

export interface EmissionAlert {
  emissionId: string;
  createdAt: string;
  notified: boolean;
}

interface EmissionsState {
  emissions: UpcomingEmission[];
  alerts: EmissionAlert[];
  addAlert: (emissionId: string) => void;
  removeAlert: (emissionId: string) => void;
  isSubscribed: (emissionId: string) => boolean;
  markNotified: (emissionId: string) => void;
}

// ─── Seed (12 upcoming emissions — April-June 2026) ────────────────────────

const SEED_EMISSIONS: UpcomingEmission[] = [
  // April 2026
  {
    id: 'em-001',
    productName: 'Phoenix Zone Euro Avril 2026',
    issuer: 'BNP Paribas',
    type: 'AUTOCALL_PHOENIX',
    underlying: 'Euro Stoxx 50',
    expectedCoupon: 7.2,
    expectedBarrier: 60,
    expectedMaturityYears: 10,
    minTicket: 10_000,
    subscriptionStart: '2026-04-25',
    subscriptionEnd: '2026-05-15',
    status: 'premarketing',
    description:
      'Autocall Phoenix indexé sur Euro Stoxx 50 avec coupon mémoire de 7.2% par an et barrière de protection à 60%. Remboursement anticipé annuel si sous-jacent ≥ 100% du niveau initial.',
  },
  {
    id: 'em-002',
    productName: 'Capital Protégé OR 5 ans',
    issuer: 'Natixis',
    type: 'CAPITAL_PROTECTED',
    underlying: 'Gold Index EUR',
    expectedCoupon: 4.5,
    expectedBarrier: 90,
    expectedMaturityYears: 5,
    minTicket: 5_000,
    subscriptionStart: '2026-04-28',
    subscriptionEnd: '2026-05-20',
    status: 'announced',
    description:
      'Capital protégé à 90% indexé sur l\'or. Performance plafonnée à 130%. Horizon 5 ans.',
  },
  {
    id: 'em-003',
    productName: 'Autocall Coupon CAC 40',
    issuer: 'Société Générale',
    type: 'AUTOCALL_COUPON',
    underlying: 'CAC 40',
    expectedCoupon: 6.5,
    expectedBarrier: 55,
    expectedMaturityYears: 8,
    minTicket: 10_000,
    subscriptionStart: '2026-04-15',
    subscriptionEnd: '2026-04-30',
    status: 'open',
    description:
      'Autocall avec coupon fixe de 6.5%. Observation semi-annuelle. Barrière à 55%.',
  },
  {
    id: 'em-004',
    productName: 'Barrier Note Tech US',
    issuer: 'Goldman Sachs',
    type: 'BARRIER_NOTE',
    underlying: 'Nasdaq 100',
    expectedCoupon: 8.8,
    expectedBarrier: 50,
    expectedMaturityYears: 6,
    minTicket: 25_000,
    subscriptionStart: '2026-04-20',
    subscriptionEnd: '2026-05-10',
    status: 'premarketing',
    description:
      'Note à barrière sur Nasdaq 100 avec coupon trimestriel conditionnel 8.8%. Barrière européenne à 50%.',
  },
  // May 2026
  {
    id: 'em-005',
    productName: 'Phoenix Bancaires Europe',
    issuer: 'BNP Paribas',
    type: 'AUTOCALL_PHOENIX',
    underlying: 'Euro Stoxx Banks',
    expectedCoupon: 9.0,
    expectedBarrier: 55,
    expectedMaturityYears: 10,
    minTicket: 10_000,
    subscriptionStart: '2026-05-05',
    subscriptionEnd: '2026-05-28',
    status: 'announced',
    description:
      'Autocall Phoenix sectoriel bancaire Europe. Coupon mémoire 9% p.a. Barrière 55%.',
  },
  {
    id: 'em-006',
    productName: 'Taux Conditionnel EUR CMS',
    issuer: 'Société Générale',
    type: 'CONDITIONAL_RATE',
    underlying: 'EUR CMS 10Y',
    expectedCoupon: 5.8,
    expectedBarrier: 100,
    expectedMaturityYears: 12,
    minTicket: 10_000,
    subscriptionStart: '2026-05-10',
    subscriptionEnd: '2026-05-30',
    status: 'announced',
    description:
      'Coupon conditionnel 5.8% p.a. indexé sur EUR CMS 10 ans. Capital garanti à maturité.',
  },
  {
    id: 'em-007',
    productName: 'Phoenix Énergie Verte',
    issuer: 'Marex',
    type: 'AUTOCALL_PHOENIX',
    underlying: 'Solactive Green Energy',
    expectedCoupon: 8.0,
    expectedBarrier: 60,
    expectedMaturityYears: 10,
    minTicket: 10_000,
    subscriptionStart: '2026-05-12',
    subscriptionEnd: '2026-06-02',
    status: 'announced',
    description:
      'Autocall Phoenix ESG sur indice énergie verte. Coupon 8% p.a. mémoire. Barrière 60%.',
  },
  {
    id: 'em-008',
    productName: 'Capital Protégé US Large Cap',
    issuer: 'Goldman Sachs',
    type: 'CAPITAL_PROTECTED',
    underlying: 'S&P 500',
    expectedCoupon: 3.5,
    expectedBarrier: 100,
    expectedMaturityYears: 7,
    minTicket: 25_000,
    subscriptionStart: '2026-05-20',
    subscriptionEnd: '2026-06-15',
    status: 'announced',
    description:
      'Capital garanti 100% indexé sur S&P 500. Participation 120% à la performance.',
  },
  // June 2026
  {
    id: 'em-009',
    productName: 'Autocall Coupon Global Leaders',
    issuer: 'Natixis',
    type: 'AUTOCALL_COUPON',
    underlying: 'MSCI World',
    expectedCoupon: 7.5,
    expectedBarrier: 55,
    expectedMaturityYears: 9,
    minTicket: 10_000,
    subscriptionStart: '2026-06-02',
    subscriptionEnd: '2026-06-25',
    status: 'announced',
    description:
      'Autocall avec coupon fixe 7.5% sur indice MSCI World. Barrière 55%.',
  },
  {
    id: 'em-010',
    productName: 'Barrier Note Luxe',
    issuer: 'BNP Paribas',
    type: 'BARRIER_NOTE',
    underlying: 'Solactive European Luxury',
    expectedCoupon: 8.2,
    expectedBarrier: 50,
    expectedMaturityYears: 6,
    minTicket: 10_000,
    subscriptionStart: '2026-06-10',
    subscriptionEnd: '2026-06-30',
    status: 'announced',
    description:
      'Note à barrière sur secteur luxe européen. Coupon trimestriel 8.2% conditionnel.',
  },
  {
    id: 'em-011',
    productName: 'Phoenix Industrielles Sélection',
    issuer: 'Société Générale',
    type: 'AUTOCALL_PHOENIX',
    underlying: 'Euro Stoxx Industrial 10',
    expectedCoupon: 7.8,
    expectedBarrier: 60,
    expectedMaturityYears: 10,
    minTicket: 10_000,
    subscriptionStart: '2026-06-15',
    subscriptionEnd: '2026-07-05',
    status: 'announced',
    description:
      'Autocall Phoenix sur 10 industrielles Euro. Coupon mémoire 7.8% p.a. Barrière 60%.',
  },
  {
    id: 'em-012',
    productName: 'Capital Protégé Multi-Actifs',
    issuer: 'Marex',
    type: 'CAPITAL_PROTECTED',
    underlying: 'Strickin Balanced Index',
    expectedCoupon: 4.0,
    expectedBarrier: 95,
    expectedMaturityYears: 5,
    minTicket: 5_000,
    subscriptionStart: '2026-06-25',
    subscriptionEnd: '2026-07-15',
    status: 'announced',
    description:
      'Capital protégé à 95% sur indice diversifié multi-actifs. Durée 5 ans.',
  },
];

// ─── Store ──────────────────────────────────────────────────────────────────

export const useEmissionsStore = create<EmissionsState>()(
  persist(
    (set, get) => ({
      emissions: SEED_EMISSIONS,
      alerts: [],

      addAlert: (emissionId) =>
        set((state) => {
          if (state.alerts.some((a) => a.emissionId === emissionId)) return state;
          return {
            alerts: [
              ...state.alerts,
              {
                emissionId,
                createdAt: new Date().toISOString(),
                notified: false,
              },
            ],
          };
        }),

      removeAlert: (emissionId) =>
        set((state) => ({
          alerts: state.alerts.filter((a) => a.emissionId !== emissionId),
        })),

      isSubscribed: (emissionId) =>
        get().alerts.some((a) => a.emissionId === emissionId),

      markNotified: (emissionId) =>
        set((state) => ({
          alerts: state.alerts.map((a) =>
            a.emissionId === emissionId ? { ...a, notified: true } : a,
          ),
        })),
    }),
    {
      name: 'strickin-emissions',
      // Always refresh the upcoming emissions seed from source on rehydrate so
      // dates stay aligned across deployments. Keep persisted alerts.
      onRehydrateStorage: () => (state) => {
        if (!state) return;
        state.emissions = SEED_EMISSIONS;
      },
    },
  ),
);

// ─── Labels ─────────────────────────────────────────────────────────────────

export const EMISSION_TYPE_LABELS: Record<EmissionType, string> = {
  AUTOCALL_PHOENIX: 'Phoenix',
  AUTOCALL_COUPON: 'Autocall',
  CAPITAL_PROTECTED: 'Capital Protégé',
  CONDITIONAL_RATE: 'Taux Conditionnel',
  BARRIER_NOTE: 'Barrier Note',
};

export const EMISSION_STATUS_LABELS: Record<EmissionStatus, string> = {
  announced: 'Annoncé',
  premarketing: 'Pré-marketing',
  open: 'Ouvert',
  closed: 'Fermé',
};

export const ISSUER_COLORS: Record<EmissionIssuer, { bg: string; text: string; border: string; dot: string }> = {
  'BNP Paribas': {
    bg: 'rgba(0, 150, 94, 0.10)',
    text: '#00965E',
    border: 'rgba(0, 150, 94, 0.25)',
    dot: '#00965E',
  },
  'Société Générale': {
    bg: 'rgba(232, 51, 74, 0.10)',
    text: '#E8334A',
    border: 'rgba(232, 51, 74, 0.25)',
    dot: '#E8334A',
  },
  Natixis: {
    bg: 'rgba(59, 31, 168, 0.10)',
    text: '#3B1FA8',
    border: 'rgba(59, 31, 168, 0.25)',
    dot: '#3B1FA8',
  },
  'Goldman Sachs': {
    bg: 'rgba(10, 39, 153, 0.10)',
    text: '#0A2799',
    border: 'rgba(10, 39, 153, 0.25)',
    dot: '#0A2799',
  },
  Marex: {
    bg: 'rgba(212, 160, 23, 0.10)',
    text: '#9B7210',
    border: 'rgba(212, 160, 23, 0.25)',
    dot: '#D4A017',
  },
};
