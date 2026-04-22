'use client';

// ─── stores/kyc-store.ts ─────────────────────────────────────────────────────
// Store Zustand `strickin-kyc` : enregistrements de KYC (Know Your Customer).

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// ─── Types ──────────────────────────────────────────────────────────────────

export type IdDocumentType = 'cni' | 'passport' | 'permis';
export type AddressProofType = 'facture' | 'quittance' | 'avis-imposition';
export type PEPStatus = 'clear' | 'pep' | 'sanctioned';
export type KYCStatus = 'pending' | 'validated' | 'rejected';

export interface KYCRecord {
  id: string;
  firstName: string;
  lastName: string;
  birthDate: string;
  idDocumentType: IdDocumentType;
  idDocumentNumber: string;
  addressProofType: AddressProofType;
  pepStatus: PEPStatus;
  amlScore: number; // 0-100
  status: KYCStatus;
  createdAt: string;
  /** Fichier OCR source (stocké en base64 dans une vraie implémentation). */
  idDocumentFileName?: string;
  /** Fichier justificatif de domicile. */
  addressProofFileName?: string;
  /** Questionnaire LCB-FT : 5 réponses booléennes/textes. */
  amlQuestionnaire?: Record<string, string>;
}

// ─── Labels ─────────────────────────────────────────────────────────────────

export const ID_DOCUMENT_TYPE_LABELS: Record<IdDocumentType, string> = {
  cni: "Carte nationale d'identité",
  passport: 'Passeport',
  permis: 'Permis de conduire',
};

export const ADDRESS_PROOF_TYPE_LABELS: Record<AddressProofType, string> = {
  facture: "Facture d'énergie",
  quittance: 'Quittance de loyer',
  'avis-imposition': "Avis d'imposition",
};

export const PEP_STATUS_LABELS: Record<PEPStatus, string> = {
  clear: 'Aucun match',
  pep: 'PPE détectée',
  sanctioned: 'Sanctions UE/OFAC',
};

export const KYC_STATUS_LABELS: Record<KYCStatus, string> = {
  pending: 'En attente',
  validated: 'Validé',
  rejected: 'Rejeté',
};

// ─── Helpers ────────────────────────────────────────────────────────────────

function makeId(): string {
  return `kyc-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function nowIso(): string {
  return new Date().toISOString();
}

// ─── Seed ───────────────────────────────────────────────────────────────────

const DEMO_KYCS: KYCRecord[] = [
  {
    id: 'kyc-demo-001',
    firstName: 'Claire',
    lastName: 'Dubois',
    birthDate: '1972-05-14',
    idDocumentType: 'cni',
    idDocumentNumber: '140572X12345',
    addressProofType: 'facture',
    pepStatus: 'clear',
    amlScore: 12,
    status: 'validated',
    createdAt: '2026-03-02T10:22:00.000Z',
  },
  {
    id: 'kyc-demo-002',
    firstName: 'Marc',
    lastName: 'Lefebvre',
    birthDate: '1985-11-22',
    idDocumentType: 'passport',
    idDocumentNumber: '22FK98765',
    addressProofType: 'quittance',
    pepStatus: 'clear',
    amlScore: 24,
    status: 'pending',
    createdAt: '2026-04-10T09:40:00.000Z',
  },
  {
    id: 'kyc-demo-003',
    firstName: 'Alessandro',
    lastName: 'Rossi',
    birthDate: '1965-07-08',
    idDocumentType: 'passport',
    idDocumentNumber: 'IT7894561',
    addressProofType: 'avis-imposition',
    pepStatus: 'pep',
    amlScore: 68,
    status: 'pending',
    createdAt: '2026-04-19T15:12:00.000Z',
  },
];

// ─── Store ──────────────────────────────────────────────────────────────────

export type NewKYCDraft = Omit<KYCRecord, 'id' | 'status' | 'createdAt'>;

interface KYCState {
  records: KYCRecord[];
  getById: (id: string) => KYCRecord | undefined;
  add: (draft: NewKYCDraft) => KYCRecord;
  updateStatus: (id: string, status: KYCStatus) => void;
  remove: (id: string) => void;
  reset: () => void;
}

export const useKYCStore = create<KYCState>()(
  persist(
    (set, get) => ({
      records: DEMO_KYCS,
      getById: (id) => get().records.find((r) => r.id === id),
      add: (draft) => {
        const rec: KYCRecord = {
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
        set((state) => ({ records: state.records.filter((r) => r.id !== id) })),
      reset: () => set({ records: DEMO_KYCS }),
    }),
    {
      name: 'strickin-kyc',
      version: 1,
      onRehydrateStorage: () => (state) => {
        if (!state) return;
        if (!Array.isArray(state.records) || state.records.length === 0) {
          state.records = DEMO_KYCS;
        }
      },
    },
  ),
);
