/**
 * Position domain types.
 *
 * Source of truth: apps/api/prisma/schema.prisma#Position
 *
 * A Position represents a holding of a specific Product inside a Contract.
 * Quantities and average prices are required for P&L computation.
 */

/** Position entity (active or closed). */
export interface Position {
  id: string;
  contractId: string;
  productId: string;
  clientId: string;
  quantity: number;
  averagePrice: number;
  openedAt: string;
  closedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

/** Enriched projection with computed mark-to-market. */
export interface PositionWithValuation extends Position {
  currentPrice: number;
  currentValue: number;
  unrealizedPnl: number;
  unrealizedPnlPct: number;
}

/** Input used when executing a subscription that opens a Position. */
export type CreatePositionInput = Omit<
  Position,
  'id' | 'openedAt' | 'closedAt' | 'createdAt' | 'updatedAt'
>;
