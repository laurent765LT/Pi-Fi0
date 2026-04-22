// ─── lib/yousign/client.ts ───────────────────────────────────────────────────
// Mock Yousign client. Aucune clé réelle n'est requise.
// En mode réel, on appellerait `fetch('https://api.yousign.app/v3/...')` avec le
// header `Authorization: Bearer <YOUSIGN_API_KEY>`. Ici, on simule les
// transitions de statut avec setTimeout.

import type {
  SignatureRequest,
  SignatureStatus,
  SignerRole,
  SignatureDocumentType,
  SignatureLevel,
  Signer,
} from './types';

// ─── Helpers ────────────────────────────────────────────────────────────────

function makeRequestId(): string {
  return `sig-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function makeSignerId(): string {
  return `signer-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function makeProcedureId(): string {
  return `proc_mock_${Math.random().toString(36).slice(2, 14)}`;
}

function nowIso(): string {
  return new Date().toISOString();
}

async function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// ─── Types propres au client (entrée minimale) ──────────────────────────────

export interface CreateSignerInput {
  firstName: string;
  lastName: string;
  email: string;
  role: SignerRole;
  order: number;
}

export interface CreateSignatureRequestInput {
  documentName: string;
  documentType: SignatureDocumentType;
  documentHtml?: string;
  signers: CreateSignerInput[];
  level: SignatureLevel;
  message?: string;
}

// ─── Mock API ────────────────────────────────────────────────────────────────

/**
 * Crée une demande de signature auprès de Yousign (mock).
 * Retourne une requête au statut `sent` avec tous les signataires en `sent`.
 */
export async function createSignatureRequest(
  input: CreateSignatureRequestInput,
): Promise<SignatureRequest> {
  await delay(800 + Math.random() * 400);

  const createdAt = nowIso();

  const signers: Signer[] = input.signers
    .slice()
    .sort((a, b) => a.order - b.order)
    .map((s) => ({
      id: makeSignerId(),
      firstName: s.firstName,
      lastName: s.lastName,
      email: s.email,
      role: s.role,
      order: s.order,
      status: 'sent' as SignatureStatus,
    }));

  const req: SignatureRequest = {
    id: makeRequestId(),
    documentName: input.documentName,
    documentType: input.documentType,
    documentHtml: input.documentHtml,
    signers,
    level: input.level,
    message: input.message,
    status: 'sent',
    createdAt,
    yousignProcedureId: makeProcedureId(),
    events: [
      {
        id: `evt-${Date.now()}-c`,
        timestamp: createdAt,
        type: 'created',
        message: 'Demande créée et envoyée aux signataires',
      },
    ],
  };

  return req;
}

/**
 * Envoie une relance pour une demande donnée (mock : délai + log).
 */
export async function sendReminder(requestId: string): Promise<void> {
  await delay(500);
  // eslint-disable-next-line no-console
  console.info('[yousign.mock] reminder sent for', requestId);
}

/**
 * Annule une demande (mock : délai + log).
 */
export async function cancelRequest(requestId: string): Promise<void> {
  await delay(500);
  // eslint-disable-next-line no-console
  console.info('[yousign.mock] cancel', requestId);
}

// ─── Mock progress simulator ─────────────────────────────────────────────────
// Intended to be wired by the caller (store) so it can mutate local state.

export type SimulateAction = 'view' | 'sign' | 'refuse';

export interface MockProgressHook {
  (requestId: string, signerId: string, status: SignatureStatus): void;
}

/**
 * Simule la progression côté signataire sans appel réseau.
 * Utilise des timers pour faire évoluer le statut (view = 3-5s, sign = 8-10s).
 * La mise à jour réelle passe par le `hook` fourni par le store.
 */
export function mockSimulateProgress(
  requestId: string,
  signerId: string,
  action: SimulateAction,
  hook: MockProgressHook,
): void {
  if (action === 'view') {
    const ms = 3_000 + Math.random() * 2_000;
    setTimeout(() => hook(requestId, signerId, 'viewed'), ms);
    return;
  }
  if (action === 'sign') {
    // view → signed
    const viewMs = 2_000 + Math.random() * 2_000;
    const signMs = viewMs + 6_000 + Math.random() * 2_000;
    setTimeout(() => hook(requestId, signerId, 'viewed'), viewMs);
    setTimeout(() => hook(requestId, signerId, 'signed'), signMs);
    return;
  }
  if (action === 'refuse') {
    const viewMs = 2_000 + Math.random() * 1_500;
    const refuseMs = viewMs + 3_000 + Math.random() * 1_500;
    setTimeout(() => hook(requestId, signerId, 'viewed'), viewMs);
    setTimeout(() => hook(requestId, signerId, 'refused'), refuseMs);
  }
}
