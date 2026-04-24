/**
 * Commitment / Order lifecycle domain events.
 *
 * "Commitment" maps to both the legacy `Commitment` model and the new Sprint 1
 * `Order` flow: consumers should inspect `data.kind` when disambiguation is
 * required.
 */

import type { DomainEvent } from './base';

export type CommitmentCreatedEvent = DomainEvent<
  'commitment.created',
  {
    commitmentId: string;
    shelfId: string | null;
    orderId: string | null;
    userId: string;
    amount: number;
    kind: 'LEGACY' | 'ORDER';
  }
>;

export type CommitmentApprovedEvent = DomainEvent<
  'commitment.approved',
  {
    commitmentId: string;
    approvedBy: string;
  }
>;

export type CommitmentRejectedEvent = DomainEvent<
  'commitment.rejected',
  {
    commitmentId: string;
    rejectedBy: string;
    reason: string;
  }
>;

export type OrderSettledEvent = DomainEvent<
  'order.settled',
  {
    orderId: string;
    settledAt: string;
    contractId: string;
  }
>;

export type OrderFailedEvent = DomainEvent<
  'order.failed',
  {
    orderId: string;
    failureReason: string;
  }
>;
