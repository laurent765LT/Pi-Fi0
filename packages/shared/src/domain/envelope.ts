/**
 * Envelope domain types.
 *
 * Source of truth: apps/api/prisma/schema.prisma#Envelope
 *
 * An Envelope represents the allocated capacity of a specific Product inside
 * an Insurer's life-contract shelf. Capacity is consumed as CGPs subscribe.
 */

/** Lifecycle state of an Envelope. */
export const EnvelopeStatus = {
  DRAFT: 'DRAFT',
  OPEN: 'OPEN',
  FULL: 'FULL',
  CLOSED: 'CLOSED',
  CANCELLED: 'CANCELLED',
} as const;
export type EnvelopeStatus = (typeof EnvelopeStatus)[keyof typeof EnvelopeStatus];

/**
 * Envelope entity.
 *
 * @property allocatedAmount - Maximum capacity of this envelope in EUR.
 * @property consumedAmount - Amount already subscribed (cumulative).
 */
export interface Envelope {
  id: string;
  insurerId: string;
  productId: string;
  allocatedAmount: number;
  consumedAmount: number;
  status: EnvelopeStatus;
  openedAt: string;
  closedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

/**
 * Legacy `Shelf` model — kept for backwards compatibility with the v1 pricing
 * engine. New code should prefer `Envelope` in Sprint 1 workflows.
 * Source of truth: apps/api/prisma/schema.prisma#Shelf
 */
export const ShelfStatus = {
  OPEN: 'OPEN',
  FULL: 'FULL',
  CLOSED: 'CLOSED',
  CANCELLED: 'CANCELLED',
} as const;
export type ShelfStatus = (typeof ShelfStatus)[keyof typeof ShelfStatus];

export interface Shelf {
  id: string;
  productId: string;
  orgId: string | null;
  status: ShelfStatus;
  targetAmount: number;
  surbookingPct: number;
  closingDate: string;
  createdAt: string;
  updatedAt: string;
}

export interface ShelfSummary {
  id: string;
  productId: string;
  status: ShelfStatus;
  targetAmount: number;
  surbookingPct: number;
  closingDate: string;
  fillPct: number;
  confirmedAmount: number;
}

/** Input used when an insurer admin opens a new Envelope. */
export type CreateEnvelopeInput = Omit<
  Envelope,
  'id' | 'consumedAmount' | 'status' | 'openedAt' | 'closedAt' | 'createdAt' | 'updatedAt'
>;
