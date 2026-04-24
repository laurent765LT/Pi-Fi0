/**
 * AuditLog domain types.
 *
 * Source of truth: apps/api/prisma/schema.prisma#AuditLog
 *
 * Strick'in maintains a tamper-evident chained audit log: each record stores
 * `hashPrev` (hash of the previous entry) and `hashCurrent` = H(hashPrev || payload).
 */

/**
 * Canonical set of auditable actions.
 *
 * Keys follow the convention `<resource>.<verb>` and MUST be persisted as-is
 * (no localisation, no abbreviation) so that log replay / chain verification
 * is deterministic.
 */
export const AuditAction = {
  USER_REGISTERED: 'user.registered',
  USER_LOGIN: 'user.login',
  USER_LOGIN_FAILED: 'user.login_failed',
  USER_LOGOUT: 'user.logout',
  USER_PASSWORD_CHANGED: 'user.password_changed',
  USER_ROLE_CHANGED: 'user.role_changed',

  CGP_ONBOARDED: 'cgp.onboarded',
  CGP_STATUS_CHANGED: 'cgp.status_changed',

  CLIENT_CREATED: 'client.created',
  CLIENT_KYC_SUBMITTED: 'client.kyc_submitted',
  CLIENT_KYC_VERIFIED: 'client.kyc_verified',
  CLIENT_KYC_REJECTED: 'client.kyc_rejected',

  PRODUCT_CREATED: 'product.created',
  PRODUCT_UPDATED: 'product.updated',
  PRODUCT_STATUS_CHANGED: 'product.status_changed',

  ENVELOPE_OPENED: 'envelope.opened',
  ENVELOPE_CLOSED: 'envelope.closed',

  RFQ_CREATED: 'rfq.created',
  RFQ_SENT: 'rfq.sent',
  RFQ_CANCELLED: 'rfq.cancelled',

  QUOTE_SUBMITTED: 'quote.submitted',
  QUOTE_ACCEPTED: 'quote.accepted',
  QUOTE_REJECTED: 'quote.rejected',

  ORDER_CREATED: 'order.created',
  ORDER_CONFIRMED: 'order.confirmed',
  ORDER_SETTLED: 'order.settled',
  ORDER_CANCELLED: 'order.cancelled',
  ORDER_FAILED: 'order.failed',

  SIGNATURE_REQUESTED: 'signature.requested',
  SIGNATURE_COMPLETED: 'signature.completed',
  SIGNATURE_REFUSED: 'signature.refused',
} as const;
export type AuditAction = (typeof AuditAction)[keyof typeof AuditAction];

/**
 * AuditLog entry.
 *
 * @property hashPrev - Hex-encoded SHA-256 of the previous record (null for genesis).
 * @property hashCurrent - Hex-encoded SHA-256 of (hashPrev || canonical(payload)).
 */
export interface AuditLog {
  id: string;
  userId: string | null;
  action: AuditAction | string;
  targetType: string;
  targetId: string | null;
  payload: Record<string, unknown> | null;
  ipAddress: string | null;
  userAgent: string | null;
  hashPrev: string | null;
  hashCurrent: string;
  createdAt: string;
}

/**
 * AIInteraction entry (metered LLM calls — cost & latency tracking).
 * Source of truth: apps/api/prisma/schema.prisma#AIInteraction
 */
export interface AIInteraction {
  id: string;
  userId: string | null;
  endpoint: string;
  provider: string | null;
  model: string | null;
  promptHash: string;
  tokensIn: number;
  tokensOut: number;
  latencyMs: number;
  estimatedCostUsd: number;
  success: boolean;
  errorMessage: string | null;
  createdAt: string;
}
