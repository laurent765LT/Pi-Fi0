'use client';

// ─── stores/kyb-store.ts ─────────────────────────────────────────────────────
// Store Zustand `strickin-kyb` : enregistrements KYB (Know Your Business).

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// ─── Types ──────────────────────────────────────────────────────────────────

export type KYBStatus = 'pending' | 'validated' | 'rejected';
export type ScreeningResult = 'clear' | 'warning' | 'sanction';

export interface KYBDirigeant {
  nom: string;
  prenom: string;
  fonction: string;
}

export interface KYBBeneficiaire {
  nom: string;
  prenom: string;
  pctDetention: number;
}

export interface KYBRecord {
  id: string;
  siren: string;
  denomination: string;
  formeJuridique: string;
  capital: number;
  adresse: string;
  dirigeants: KYBDirigeant[];
  beneficiairesEffectifs: KYBBeneficiaire[];
  kbisDate: string;
  screeningResult: ScreeningResult;
  status: KYBStatus;
  createdAt: string;
}

// ─── Labels ─────────────────────────────────────────────────────────────────

export const KYB_STATUS_LABELS: Record<KYBStatus, string> = {
  pending: 'En attente',
  validated: 'Validé',
  rejected: 'Rejeté',
};

export const SCREENING_RESULT_LABELS: Record<ScreeningResult, string> = {
  clear: 'RAS — BODACC propre',
  warning: 'Alerte BODACC',
  sanction: 'Sanctions internationales',
};

// ─── Helpers ────────────────────────────────────────────────────────────────

function makeId(): string {
  return `kyb-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function nowIso(): string {
  return new Date().toISOString();
}

// ─── Seed ───────────────────────────────────────────────────────────────────

const DEMO_KYBS: KYBRecord[] = [
  {
    id: 'kyb-demo-001',
    siren: '892451603',
    denomination: 'Cabinet Dubois Patrimoine',
    formeJuridique: 'SAS',
    capital: 50_000,
    adresse: '12 rue de la Bourse, 75002 Paris',
    dirigeants: [
      { nom: 'Dubois', prenom: 'Claire', fonction: 'Présidente' },
    ],
    beneficiairesEffectifs: [
      { nom: 'Dubois', prenom: 'Claire', pctDetention: 75 },
      { nom: 'Dubois', prenom: 'Étienne', pctDetention: 25 },
    ],
    kbisDate: '2026-02-15',
    screeningResult: 'clear',
    status: 'validated',
    createdAt: '2026-03-02T10:40:00.000Z',
  },
  {
    id: 'kyb-demo-002',
    siren: '519884011',
    denomination: 'Lefebvre & Associés',
    formeJuridique: 'SARL',
    capital: 30_000,
    adresse: '55 avenue Foch, 69006 Lyon',
    dirigeants: [
      { nom: 'Lefebvre', prenom: 'Marc', fonction: 'Gérant' },
      { nom: 'Roux', prenom: 'Sylvie', fonction: 'Co-gérante' },
    ],
    beneficiairesEffectifs: [
      { nom: 'Lefebvre', prenom: 'Marc', pctDetention: 60 },
      { nom: 'Roux', prenom: 'Sylvie', pctDetention: 40 },
    ],
    kbisDate: '2026-03-20',
    screeningResult: 'warning',
    status: 'pending',
    createdAt: '2026-04-11T14:05:00.000Z',
  },
];

// ─── Store ──────────────────────────────────────────────────────────────────

export type NewKYBDraft = Omit<KYBRecord, 'id' | 'status' | 'createdAt'>;

interface KYBState {
  records: KYBRecord[];
  getById: (id: string) => KYBRecord | undefined;
  add: (draft: NewKYBDraft) => KYBRecord;
  updateStatus: (id: string, status: KYBStatus) => void;
  remove: (id: string) => void;
  reset: () => void;
}

export const useKYBStore = create<KYBState>()(
  persist(
    (set, get) => ({
      records: DEMO_KYBS,
      getById: (id) => get().records.find((r) => r.id === id),
      add: (draft) => {
        const rec: KYBRecord = {
          ...draft,
          id: makeId(),
          status: 'pending',
          createdAt: nowIso(),
        };
        set((state) => ({ records: [rec, ...state.records] }));
        return rec;
      },
      updateStatus: (id, status) =>
        set((state) => ({
          records: state.records.map((r) =>
            r.id === id ? { ...r, status } : r,
          ),
        })),
      remove: (id) =>
        set((state) => ({
          records: state.records.filter((r) => r.id !== id),
        })),
      reset: () => set({ records: DEMO_KYBS }),
    }),
    {
      name: 'strickin-kyb',
      version: 1,
      onRehydrateStorage: () => (state) => {
        if (!state) return;
        if (!Array.isArray(state.records) || state.records.length === 0) {
          state.records = DEMO_KYBS;
        }
      },
    },
  ),
);
