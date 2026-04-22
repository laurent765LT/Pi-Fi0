'use client';

// ─── stores/signatures-store.ts ──────────────────────────────────────────────
// Store Zustand `strickin-signatures` pour gérer les demandes de signature
// électronique Yousign (mode mock).

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type {
  SignatureRequest,
  SignatureStatus,
  SignatureLevel,
  SignatureDocumentType,
  Signer,
  SignatureEvent,
} from '@/lib/yousign/types';
import {
  createSignatureRequest as clientCreate,
  mockSimulateProgress,
  type CreateSignatureRequestInput,
} from '@/lib/yousign/client';

// ─── Helpers ────────────────────────────────────────────────────────────────

function nowIso(): string {
  return new Date().toISOString();
}

function eventId(): string {
  return `evt-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
}

function statusEventType(s: SignatureStatus): SignatureEvent['type'] {
  if (s === 'viewed') return 'viewed';
  if (s === 'signed') return 'signed';
  if (s === 'refused') return 'refused';
  if (s === 'expired') return 'expired';
  if (s === 'sent') return 'sent';
  return 'created';
}

function statusMessage(status: SignatureStatus, signerLabel: string): string {
  switch (status) {
    case 'viewed':
      return `${signerLabel} a consulté le document`;
    case 'signed':
      return `${signerLabel} a signé le document`;
    case 'refused':
      return `${signerLabel} a refusé de signer`;
    case 'expired':
      return `Délai de signature expiré pour ${signerLabel}`;
    case 'sent':
      return `Demande envoyée à ${signerLabel}`;
    default:
      return `Mise à jour de ${signerLabel}`;
  }
}

function aggregateStatus(signers: Signer[]): SignatureStatus {
  if (signers.some((s) => s.status === 'refused')) return 'refused';
  if (signers.every((s) => s.status === 'signed')) return 'signed';
  if (signers.some((s) => s.status === 'expired')) return 'expired';
  if (signers.some((s) => s.status === 'viewed')) return 'viewed';
  if (signers.every((s) => s.status === 'sent' || s.status === 'viewed'))
    return 'sent';
  return 'sent';
}

// ─── Seed demo requests ─────────────────────────────────────────────────────

const DEMO_REQUESTS: SignatureRequest[] = [
  {
    id: 'sig-demo-001',
    documentName: 'Bulletin de souscription — Autocall Stoxx 50 Premium',
    documentType: 'bulletin-souscription',
    level: 'advanced',
    message:
      "Veuillez signer ce bulletin afin de valider votre engagement sur l'Autocall Stoxx 50 Premium.",
    signers: [
      {
        id: 'signer-d001-1',
        firstName: 'Sophie',
        lastName: 'Martin',
        email: 'sophie.martin@cabinet.fr',
        role: 'cgp',
        order: 1,
        status: 'signed',
        signedAt: '2026-04-18T10:05:00.000Z',
        viewedAt: '2026-04-18T10:02:00.000Z',
      },
      {
        id: 'signer-d001-2',
        firstName: 'Claire',
        lastName: 'Dubois',
        email: 'claire.dubois@exemple.fr',
        role: 'client',
        order: 2,
        status: 'signed',
        signedAt: '2026-04-18T11:22:00.000Z',
        viewedAt: '2026-04-18T11:15:00.000Z',
      },
    ],
    status: 'signed',
    createdAt: '2026-04-18T09:55:00.000Z',
    completedAt: '2026-04-18T11:22:00.000Z',
    yousignProcedureId: 'proc_mock_demo001',
    events: [
      {
        id: 'evt-d001-1',
        timestamp: '2026-04-18T09:55:00.000Z',
        type: 'created',
        message: 'Demande créée et envoyée aux signataires',
      },
      {
        id: 'evt-d001-2',
        signerId: 'signer-d001-1',
        timestamp: '2026-04-18T10:05:00.000Z',
        type: 'signed',
        message: 'Sophie Martin a signé le document',
      },
      {
        id: 'evt-d001-3',
        signerId: 'signer-d001-2',
        timestamp: '2026-04-18T11:22:00.000Z',
        type: 'signed',
        message: 'Claire Dubois a signé le document',
      },
    ],
  },
  {
    id: 'sig-demo-002',
    documentName: "Lettre de mission — Marc Lefebvre",
    documentType: 'lettre-mission',
    level: 'simple',
    signers: [
      {
        id: 'signer-d002-1',
        firstName: 'Sophie',
        lastName: 'Martin',
        email: 'sophie.martin@cabinet.fr',
        role: 'cgp',
        order: 1,
        status: 'signed',
        signedAt: '2026-04-20T14:01:00.000Z',
      },
      {
        id: 'signer-d002-2',
        firstName: 'Marc',
        lastName: 'Lefebvre',
        email: 'marc.lefebvre@exemple.fr',
        role: 'client',
        order: 2,
        status: 'viewed',
        viewedAt: '2026-04-21T09:30:00.000Z',
      },
    ],
    status: 'viewed',
    createdAt: '2026-04-20T13:58:00.000Z',
    yousignProcedureId: 'proc_mock_demo002',
    events: [
      {
        id: 'evt-d002-1',
        timestamp: '2026-04-20T13:58:00.000Z',
        type: 'created',
        message: 'Demande créée et envoyée aux signataires',
      },
      {
        id: 'evt-d002-2',
        signerId: 'signer-d002-1',
        timestamp: '2026-04-20T14:01:00.000Z',
        type: 'signed',
        message: 'Sophie Martin a signé le document',
      },
      {
        id: 'evt-d002-3',
        signerId: 'signer-d002-2',
        timestamp: '2026-04-21T09:30:00.000Z',
        type: 'viewed',
        message: 'Marc Lefebvre a consulté le document',
      },
    ],
  },
  {
    id: 'sig-demo-003',
    documentName: "Rapport d'adéquation — Trimestre 1",
    documentType: 'rapport-adequation',
    level: 'qualified',
    signers: [
      {
        id: 'signer-d003-1',
        firstName: 'Anne',
        lastName: 'Petit',
        email: 'anne.petit@exemple.fr',
        role: 'client',
        order: 1,
        status: 'sent',
      },
    ],
    status: 'sent',
    createdAt: '2026-04-21T16:45:00.000Z',
    yousignProcedureId: 'proc_mock_demo003',
    events: [
      {
        id: 'evt-d003-1',
        timestamp: '2026-04-21T16:45:00.000Z',
        type: 'created',
        message: 'Demande créée et envoyée aux signataires',
      },
    ],
  },
];

// ─── Store ──────────────────────────────────────────────────────────────────

export type CreateSignaturePayload = CreateSignatureRequestInput;

export interface SignaturesState {
  requests: SignatureRequest[];
  /** Crée une demande via le client mock, l'ajoute et lance la simulation. */
  create: (input: CreateSignaturePayload) => Promise<SignatureRequest>;
  /** Met à jour le statut d'un signataire précis et recalcule le statut global. */
  updateStatus: (
    id: string,
    signerId: string,
    status: SignatureStatus,
  ) => void;
  /** Lecture directe. */
  getById: (id: string) => SignatureRequest | undefined;
  /** Envoie une relance (mock) et ajoute un événement. */
  addReminder: (id: string, signerId?: string) => void;
  /** Reset aux données de démo. */
  reset: () => void;
}

export const useSignaturesStore = create<SignaturesState>()(
  persist(
    (set, get) => ({
      requests: DEMO_REQUESTS,

      getById: (id) => get().requests.find((r) => r.id === id),

      create: async (input) => {
        const created = await clientCreate(input);
        set((state) => ({ requests: [created, ...state.requests] }));

        // Simule la progression asynchrone pour chaque signataire
        created.signers.forEach((signer) => {
          const action: 'view' | 'sign' =
            Math.random() < 0.85 ? 'sign' : 'view';
          mockSimulateProgress(created.id, signer.id, action, (reqId, sId, status) => {
            get().updateStatus(reqId, sId, status);
          });
        });

        return created;
      },

      updateStatus: (id, signerId, status) =>
        set((state) => ({
          requests: state.requests.map((req) => {
            if (req.id !== id) return req;
            const newSigners: Signer[] = req.signers.map((s) => {
              if (s.id !== signerId) return s;
              const next: Signer = { ...s, status };
              if (status === 'signed') next.signedAt = nowIso();
              if (status === 'viewed' && !s.viewedAt) next.viewedAt = nowIso();
              return next;
            });
            const signer = newSigners.find((s) => s.id === signerId);
            const signerLabel = signer
              ? `${signer.firstName} ${signer.lastName}`
              : 'Un signataire';
            const nextStatus = aggregateStatus(newSigners);
            const event: SignatureEvent = {
              id: eventId(),
              signerId,
              timestamp: nowIso(),
              type: statusEventType(status),
              message: statusMessage(status, signerLabel),
            };
            const completed =
              nextStatus === 'signed' || nextStatus === 'refused'
                ? nowIso()
                : req.completedAt;
            return {
              ...req,
              signers: newSigners,
              status: nextStatus,
              events: [...req.events, event],
              completedAt: completed,
            };
          }),
        })),

      addReminder: (id, signerId) =>
        set((state) => ({
          requests: state.requests.map((req) => {
            if (req.id !== id) return req;
            const event: SignatureEvent = {
              id: eventId(),
              signerId,
              timestamp: nowIso(),
              type: 'reminder',
              message: signerId
                ? 'Relance envoyée au signataire'
                : 'Relance envoyée à tous les signataires',
            };
            return { ...req, events: [...req.events, event] };
          }),
        })),

      reset: () => set({ requests: DEMO_REQUESTS }),
    }),
    {
      name: 'strickin-signatures',
      version: 1,
      onRehydrateStorage: () => (state) => {
        if (!state) return;
        if (!Array.isArray(state.requests) || state.requests.length === 0) {
          state.requests = DEMO_REQUESTS;
        }
      },
    },
  ),
);

// ─── Utility selectors ──────────────────────────────────────────────────────

export function countByStatus(
  requests: SignatureRequest[],
): Record<SignatureStatus, number> {
  const base: Record<SignatureStatus, number> = {
    draft: 0,
    sent: 0,
    viewed: 0,
    signed: 0,
    refused: 0,
    expired: 0,
  };
  for (const r of requests) base[r.status] += 1;
  return base;
}

export type { SignatureRequest, SignatureStatus, SignatureLevel, SignatureDocumentType };
