'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// ─── Types ──────────────────────────────────────────────────────────────────

export type InsurerName =
  | 'Cardif'
  | 'Generali'
  | 'Spirica'
  | 'Apicil'
  | 'Suravenir'
  | 'SwissLife';

export interface ClientContract {
  id: string;
  insurer: InsurerName;
  productIds: string[];
  amountTotal: number;
}

export interface ConsolidatedClient {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  contracts: ClientContract[];
  createdAt: string;
}

type NewClientDraft = Omit<ConsolidatedClient, 'id' | 'createdAt'>;

interface ConsolidatedClientsState {
  clients: ConsolidatedClient[];
  getById: (id: string) => ConsolidatedClient | undefined;
  add: (draft: NewClientDraft) => ConsolidatedClient;
  update: (id: string, patch: Partial<ConsolidatedClient>) => void;
  remove: (id: string) => void;
  reset: () => void;
}

// ─── Helpers ────────────────────────────────────────────────────────────────

function makeId(): string {
  return `client-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function nowIso(): string {
  return new Date().toISOString();
}

// ─── Seed data ──────────────────────────────────────────────────────────────
// 8 demo clients with realistic French names and 2-3 multi-insurer contracts

const DEMO_CLIENTS: ConsolidatedClient[] = [
  {
    id: 'cc-001',
    firstName: 'Claire',
    lastName: 'Dubois',
    email: 'claire.dubois@example.fr',
    phone: '+33 6 12 34 56 78',
    contracts: [
      {
        id: 'ctr-001a',
        insurer: 'Cardif',
        productIds: ['prod-001', 'prod-004'],
        amountTotal: 320_000,
      },
      {
        id: 'ctr-001b',
        insurer: 'Generali',
        productIds: ['prod-007'],
        amountTotal: 180_000,
      },
      {
        id: 'ctr-001c',
        insurer: 'Spirica',
        productIds: ['prod-012'],
        amountTotal: 95_000,
      },
    ],
    createdAt: '2025-09-12T09:00:00.000Z',
  },
  {
    id: 'cc-002',
    firstName: 'Marc',
    lastName: 'Lefebvre',
    email: 'marc.lefebvre@example.fr',
    phone: '+33 6 22 55 41 09',
    contracts: [
      {
        id: 'ctr-002a',
        insurer: 'Generali',
        productIds: ['prod-002', 'prod-005'],
        amountTotal: 210_000,
      },
      {
        id: 'ctr-002b',
        insurer: 'Apicil',
        productIds: ['prod-008'],
        amountTotal: 140_000,
      },
    ],
    createdAt: '2025-10-03T10:30:00.000Z',
  },
  {
    id: 'cc-003',
    firstName: 'Sophie',
    lastName: 'Moreau',
    email: 'sophie.moreau@example.fr',
    phone: '+33 6 78 11 23 45',
    contracts: [
      {
        id: 'ctr-003a',
        insurer: 'Suravenir',
        productIds: ['prod-003', 'prod-010'],
        amountTotal: 260_000,
      },
      {
        id: 'ctr-003b',
        insurer: 'Cardif',
        productIds: ['prod-006'],
        amountTotal: 120_000,
      },
      {
        id: 'ctr-003c',
        insurer: 'SwissLife',
        productIds: ['prod-017'],
        amountTotal: 85_000,
      },
    ],
    createdAt: '2025-11-18T14:15:00.000Z',
  },
  {
    id: 'cc-004',
    firstName: 'Antoine',
    lastName: 'Garnier',
    email: 'antoine.garnier@example.fr',
    phone: '+33 6 44 22 88 11',
    contracts: [
      {
        id: 'ctr-004a',
        insurer: 'Apicil',
        productIds: ['prod-009', 'prod-011'],
        amountTotal: 175_000,
      },
      {
        id: 'ctr-004b',
        insurer: 'Spirica',
        productIds: ['prod-013'],
        amountTotal: 95_000,
      },
    ],
    createdAt: '2025-12-05T11:45:00.000Z',
  },
  {
    id: 'cc-005',
    firstName: 'Isabelle',
    lastName: 'Rousseau',
    email: 'isabelle.rousseau@example.fr',
    phone: '+33 6 55 66 77 88',
    contracts: [
      {
        id: 'ctr-005a',
        insurer: 'Cardif',
        productIds: ['prod-001', 'prod-008', 'prod-017'],
        amountTotal: 430_000,
      },
      {
        id: 'ctr-005b',
        insurer: 'Generali',
        productIds: ['prod-014'],
        amountTotal: 110_000,
      },
    ],
    createdAt: '2026-01-14T08:30:00.000Z',
  },
  {
    id: 'cc-006',
    firstName: 'Guillaume',
    lastName: 'Bernard',
    email: 'guillaume.bernard@example.fr',
    phone: '+33 6 33 88 22 44',
    contracts: [
      {
        id: 'ctr-006a',
        insurer: 'SwissLife',
        productIds: ['prod-005', 'prod-015'],
        amountTotal: 245_000,
      },
      {
        id: 'ctr-006b',
        insurer: 'Suravenir',
        productIds: ['prod-016'],
        amountTotal: 90_000,
      },
    ],
    createdAt: '2026-02-02T13:00:00.000Z',
  },
  {
    id: 'cc-007',
    firstName: 'Valerie',
    lastName: 'Fontaine',
    email: 'valerie.fontaine@example.fr',
    phone: '+33 6 77 33 44 55',
    contracts: [
      {
        id: 'ctr-007a',
        insurer: 'Generali',
        productIds: ['prod-002', 'prod-007'],
        amountTotal: 190_000,
      },
      {
        id: 'ctr-007b',
        insurer: 'Apicil',
        productIds: ['prod-012'],
        amountTotal: 80_000,
      },
      {
        id: 'ctr-007c',
        insurer: 'Cardif',
        productIds: ['prod-003'],
        amountTotal: 75_000,
      },
    ],
    createdAt: '2026-02-28T15:20:00.000Z',
  },
  {
    id: 'cc-008',
    firstName: 'Nicolas',
    lastName: 'Chevalier',
    email: 'nicolas.chevalier@example.fr',
    phone: '+33 6 99 11 22 33',
    contracts: [
      {
        id: 'ctr-008a',
        insurer: 'Spirica',
        productIds: ['prod-004', 'prod-009'],
        amountTotal: 165_000,
      },
      {
        id: 'ctr-008b',
        insurer: 'SwissLife',
        productIds: ['prod-006'],
        amountTotal: 100_000,
      },
    ],
    createdAt: '2026-03-18T10:00:00.000Z',
  },
];

// ─── Validation helpers ─────────────────────────────────────────────────────

function sanitizeClient(raw: unknown): ConsolidatedClient | null {
  if (!raw || typeof raw !== 'object') return null;
  const c = raw as Record<string, unknown>;
  if (
    typeof c.id !== 'string' ||
    typeof c.firstName !== 'string' ||
    typeof c.lastName !== 'string' ||
    typeof c.email !== 'string' ||
    !Array.isArray(c.contracts) ||
    typeof c.createdAt !== 'string'
  ) {
    return null;
  }
  return c as unknown as ConsolidatedClient;
}

// ─── Store ──────────────────────────────────────────────────────────────────

export const useConsolidatedClientsStore = create<ConsolidatedClientsState>()(
  persist(
    (set, get) => ({
      clients: DEMO_CLIENTS,

      getById: (id) => get().clients.find((c) => c.id === id),

      add: (draft) => {
        const client: ConsolidatedClient = {
          ...draft,
          id: makeId(),
          createdAt: nowIso(),
        };
        set((state) => ({ clients: [client, ...state.clients] }));
        return client;
      },

      update: (id, patch) =>
        set((state) => ({
          clients: state.clients.map((c) =>
            c.id === id ? { ...c, ...patch } : c,
          ),
        })),

      remove: (id) =>
        set((state) => ({
          clients: state.clients.filter((c) => c.id !== id),
        })),

      reset: () => set({ clients: DEMO_CLIENTS }),
    }),
    {
      name: 'strickin-clients-consolidated',
      onRehydrateStorage: () => (state) => {
        if (!state) return;
        const safe = state.clients
          .map(sanitizeClient)
          .filter((c): c is ConsolidatedClient => c !== null);
        if (safe.length === 0) {
          state.clients = DEMO_CLIENTS;
          return;
        }
        state.clients = safe;
      },
    },
  ),
);

// ─── Insurer metadata (shared across UI) ────────────────────────────────────

export const INSURER_COLORS: Record<InsurerName, string> = {
  Cardif: '#3B1FA8',
  Generali: '#B33636',
  Spirica: '#00B894',
  Apicil: '#D4A017',
  Suravenir: '#3D63F5',
  SwissLife: '#7B1E3A',
};

export const INSURER_SHORT: Record<InsurerName, string> = {
  Cardif: 'CAR',
  Generali: 'GEN',
  Spirica: 'SPI',
  Apicil: 'API',
  Suravenir: 'SUR',
  SwissLife: 'SWL',
};

export const INSURER_LIST: InsurerName[] = [
  'Cardif',
  'Generali',
  'Spirica',
  'Apicil',
  'Suravenir',
  'SwissLife',
];
