'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// ─── Types ──────────────────────────────────────────────────────────────────

export type FamilySituation =
  | 'celibataire'
  | 'marie'
  | 'pacs'
  | 'divorce'
  | 'veuf';

export type MarketKnowledge = 'basique' | 'informe' | 'averti' | 'expert';

export type ProductExperience =
  | 'aucune'
  | 'moins1an'
  | '1a3ans'
  | '3a5ans'
  | 'plus5ans';

export type LossTolerance = 0 | 10 | 30 | 100;

export type InvestmentHorizon =
  | 'moins3ans'
  | '3a5ans'
  | '5a8ans'
  | 'plus8ans';

export type DossierStatus = 'brouillon' | 'signe' | 'archive';

export type ClientObjective =
  | 'retraite'
  | 'transmission'
  | 'fiscalite'
  | 'revenus';

export interface ClientDossier {
  id: string;
  // Step 1 — client info
  firstName: string;
  lastName: string;
  birthDate: string;
  familySituation: FamilySituation;
  profession: string;
  revenuesAnnuel: number;
  // Step 2 — investor profile
  marketKnowledge: MarketKnowledge;
  productExperience: ProductExperience;
  lossTolerance: LossTolerance;
  investmentHorizon: InvestmentHorizon;
  // Step 3 — objectives
  objectives: ClientObjective[];
  // Step 4 — proposed products
  proposedProducts: string[];
  // Step 5 — status
  status: DossierStatus;
  createdAt: string;
  updatedAt: string;
  signedAt?: string;
}

type NewDossierDraft = Omit<
  ClientDossier,
  'id' | 'createdAt' | 'updatedAt' | 'status'
>;

interface ClientsState {
  dossiers: ClientDossier[];
  getById: (id: string) => ClientDossier | undefined;
  create: (draft: NewDossierDraft) => ClientDossier;
  update: (id: string, patch: Partial<ClientDossier>) => void;
  remove: (id: string) => void;
  sign: (id: string) => void;
  archive: (id: string) => void;
  reset: () => void;
}

// ─── Helpers ────────────────────────────────────────────────────────────────

function makeId(): string {
  return `dossier-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function nowIso(): string {
  return new Date().toISOString();
}

// ─── Seed (demo dossiers) ───────────────────────────────────────────────────

const DEMO_DOSSIERS: ClientDossier[] = [
  {
    id: 'dossier-demo-001',
    firstName: 'Claire',
    lastName: 'Dubois',
    birthDate: '1972-05-14',
    familySituation: 'marie',
    profession: 'Chef d\u2019entreprise',
    revenuesAnnuel: 185_000,
    marketKnowledge: 'averti',
    productExperience: '3a5ans',
    lossTolerance: 30,
    investmentHorizon: '5a8ans',
    objectives: ['retraite', 'fiscalite'],
    proposedProducts: ['prod-004', 'prod-007'],
    status: 'signe',
    createdAt: '2026-03-02T10:12:00.000Z',
    updatedAt: '2026-03-05T14:20:00.000Z',
    signedAt: '2026-03-05T14:20:00.000Z',
  },
  {
    id: 'dossier-demo-002',
    firstName: 'Marc',
    lastName: 'Lefebvre',
    birthDate: '1985-11-22',
    familySituation: 'celibataire',
    profession: 'Cadre sup\u00e9rieur',
    revenuesAnnuel: 98_500,
    marketKnowledge: 'informe',
    productExperience: '1a3ans',
    lossTolerance: 10,
    investmentHorizon: '3a5ans',
    objectives: ['revenus', 'transmission'],
    proposedProducts: ['prod-002'],
    status: 'brouillon',
    createdAt: '2026-04-10T09:30:00.000Z',
    updatedAt: '2026-04-18T16:45:00.000Z',
  },
];

// ─── Validation helpers (lightweight, zod-like) ─────────────────────────────

function sanitizeDossier(raw: unknown): ClientDossier | null {
  if (!raw || typeof raw !== 'object') return null;
  const d = raw as Record<string, unknown>;
  if (
    typeof d.id !== 'string' ||
    typeof d.firstName !== 'string' ||
    typeof d.lastName !== 'string' ||
    typeof d.createdAt !== 'string' ||
    typeof d.updatedAt !== 'string'
  ) {
    return null;
  }
  return d as unknown as ClientDossier;
}

// ─── Store ──────────────────────────────────────────────────────────────────

export const useClientsStore = create<ClientsState>()(
  persist(
    (set, get) => ({
      dossiers: DEMO_DOSSIERS,

      getById: (id) => get().dossiers.find((d) => d.id === id),

      create: (draft) => {
        const ts = nowIso();
        const dossier: ClientDossier = {
          ...draft,
          id: makeId(),
          status: 'brouillon',
          createdAt: ts,
          updatedAt: ts,
        };
        set((state) => ({ dossiers: [dossier, ...state.dossiers] }));
        return dossier;
      },

      update: (id, patch) =>
        set((state) => ({
          dossiers: state.dossiers.map((d) =>
            d.id === id ? { ...d, ...patch, updatedAt: nowIso() } : d,
          ),
        })),

      remove: (id) =>
        set((state) => ({
          dossiers: state.dossiers.filter((d) => d.id !== id),
        })),

      sign: (id) =>
        set((state) => {
          const ts = nowIso();
          return {
            dossiers: state.dossiers.map((d) =>
              d.id === id
                ? { ...d, status: 'signe' as DossierStatus, signedAt: ts, updatedAt: ts }
                : d,
            ),
          };
        }),

      archive: (id) =>
        set((state) => ({
          dossiers: state.dossiers.map((d) =>
            d.id === id
              ? { ...d, status: 'archive' as DossierStatus, updatedAt: nowIso() }
              : d,
          ),
        })),

      reset: () => set({ dossiers: DEMO_DOSSIERS }),
    }),
    {
      name: 'strickin-client-dossiers',
      // Defensive hydration: drop any entries that fail shape checks and
      // ensure seed demo dossiers remain available on first load.
      onRehydrateStorage: () => (state) => {
        if (!state) return;
        const safe = state.dossiers
          .map(sanitizeDossier)
          .filter((d): d is ClientDossier => d !== null);
        if (safe.length === 0) {
          state.dossiers = DEMO_DOSSIERS;
          return;
        }
        state.dossiers = safe;
      },
    },
  ),
);

// ─── Label dictionaries (shared across UI) ──────────────────────────────────

export const FAMILY_SITUATION_LABELS: Record<FamilySituation, string> = {
  celibataire: 'C\u00e9libataire',
  marie: 'Mari\u00e9(e)',
  pacs: 'Pacs\u00e9(e)',
  divorce: 'Divorc\u00e9(e)',
  veuf: 'Veuf / Veuve',
};

export const MARKET_KNOWLEDGE_LABELS: Record<MarketKnowledge, string> = {
  basique: 'Basique',
  informe: 'Inform\u00e9(e)',
  averti: 'Averti(e)',
  expert: 'Expert',
};

export const PRODUCT_EXPERIENCE_LABELS: Record<ProductExperience, string> = {
  aucune: 'Aucune exp\u00e9rience',
  moins1an: 'Moins d\u2019un an',
  '1a3ans': '1 \u00e0 3 ans',
  '3a5ans': '3 \u00e0 5 ans',
  plus5ans: 'Plus de 5 ans',
};

export const LOSS_TOLERANCE_LABELS: Record<LossTolerance, string> = {
  0: 'Aucune perte en capital accept\u00e9e',
  10: 'Jusqu\u2019\u00e0 10 % de perte',
  30: 'Jusqu\u2019\u00e0 30 % de perte',
  100: 'Perte totale possible',
};

export const INVESTMENT_HORIZON_LABELS: Record<InvestmentHorizon, string> = {
  moins3ans: 'Moins de 3 ans',
  '3a5ans': '3 \u00e0 5 ans',
  '5a8ans': '5 \u00e0 8 ans',
  plus8ans: 'Plus de 8 ans',
};

export const OBJECTIVE_LABELS: Record<ClientObjective, string> = {
  retraite: 'Pr\u00e9parer la retraite',
  transmission: 'Transmission de patrimoine',
  fiscalite: 'Optimisation fiscale',
  revenus: 'Compl\u00e9ment de revenus',
};

export const STATUS_LABELS: Record<DossierStatus, string> = {
  brouillon: 'Brouillon',
  signe: 'Sign\u00e9',
  archive: 'Archiv\u00e9',
};
