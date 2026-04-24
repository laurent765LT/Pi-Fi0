/**
 * Signature lifecycle domain events.
 */

import type { SignatureDocumentType, SignatureStatus } from '../domain/signature';
import type { DomainEvent } from './base';

export type SignatureRequestedEvent = DomainEvent<
  'signature.requested',
  {
    signatureId: string;
    signerId: string;
    documentType: SignatureDocumentType;
    orderId: string | null;
  }
>;

export type SignatureCompletedEvent = DomainEvent<
  'signature.completed',
  {
    signatureId: string;
    signerId: string;
    completedAt: string;
  }
>;

export type SignatureRefusedEvent = DomainEvent<
  'signature.refused',
  {
    signatureId: string;
    signerId: string;
    refusedAt: string;
    reason: string | null;
  }
>;

/** Emitted when the e-signature provider reports a state change via webhook. */
export type SignatureStatusChangedEvent = DomainEvent<
  'signature.status_changed',
  {
    signatureId: string;
    previousStatus: SignatureStatus;
    newStatus: SignatureStatus;
  }
>;
