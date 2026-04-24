/**
 * Order domain types.
 *
 * Source of truth: apps/api/prisma/schema.prisma#Order
 *
 * An Order materialises an accepted RFQ quote into a subscription that will
 * eventually be settled on a Contract. Orders are legal records: onDelete is
 * never Cascade.
 */

/** Lifecycle of an Order. */
export const OrderStatus = {
  PENDING: 'PENDING',
  CONFIRMED: 'CONFIRMED',
  SETTLED: 'SETTLED',
  CANCELLED: 'CANCELLED',
  FAILED: 'FAILED',
} as const;
export type OrderStatus = (typeof OrderStatus)[keyof typeof OrderStatus];

/**
 * Order aggregate.
 *
 * @property idempotencyKey - Unique client-generated key to prevent duplicates
 *                            (required on POST /orders).
 * @property amount - Subscribed nominal amount in EUR.
 */
export interface Order {
  id: string;
  rfqId: string;
  quoteId: string;
  clientId: string;
  contractId: string;
  cgpId: string;
  status: OrderStatus;
  amount: number;
  idempotencyKey: string;
  confirmedAt: string | null;
  settledAt: string | null;
  cancelledAt: string | null;
  failureReason: string | null;
  createdAt: string;
  updatedAt: string;
}

/** Input used when a CGP confirms a subscription. */
export type CreateOrderInput = Omit<
  Order,
  | 'id'
  | 'status'
  | 'confirmedAt'
  | 'settledAt'
  | 'cancelledAt'
  | 'failureReason'
  | 'createdAt'
  | 'updatedAt'
>;

/**
 * Legacy Commitment model — kept for backwards compatibility with v1 routes.
 * Source of truth: apps/api/prisma/schema.prisma#Commitment
 */
export const CommitmentStatus = {
  PENDING: 'PENDING',
  REVIEW: 'REVIEW',
  CONFIRMED: 'CONFIRMED',
  WAITING: 'WAITING',
  CANCELLED: 'CANCELLED',
} as const;
export type CommitmentStatus = (typeof CommitmentStatus)[keyof typeof CommitmentStatus];

export interface Commitment {
  id: string;
  shelfId: string;
  userId: string;
  orgId: string | null;
  amount: number;
  status: CommitmentStatus;
  rank: number | null;
  rejectionReason: string | null;
  reviewedBy: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CommitmentSummary {
  id: string;
  shelfId: string;
  userId: string;
  amount: number;
  status: CommitmentStatus;
  rank: number | null;
  createdAt: string;
}
