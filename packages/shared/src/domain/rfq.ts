/**
 * RFQ (Request For Quote) domain types.
 *
 * Source of truth:
 * - apps/api/prisma/schema.prisma#Rfq (Sprint 1 production model)
 * - apps/api/prisma/schema.prisma#IssuerRfqQuote (issuer responses)
 *
 * Not to be confused with the legacy `RfqRequest` / `RfqQuote` models from the
 * pricing-engine simulator: those are exposed under `@strickin/shared/domain`
 * via separate aliases when/if the simulator needs to share them.
 */

/** CGP-side lifecycle of an RFQ. */
export const RFQStatus = {
  DRAFT: 'DRAFT',
  SENT: 'SENT',
  QUOTED: 'QUOTED',
  ACCEPTED: 'ACCEPTED',
  EXPIRED: 'EXPIRED',
  CANCELLED: 'CANCELLED',
} as const;
export type RFQStatus = (typeof RFQStatus)[keyof typeof RFQStatus];

/** Lifecycle of a single Issuer quote inside an RFQ. */
export const IssuerQuoteStatus = {
  PENDING: 'PENDING',
  QUOTED: 'QUOTED',
  ACCEPTED: 'ACCEPTED',
  REJECTED: 'REJECTED',
  EXPIRED: 'EXPIRED',
} as const;
export type IssuerQuoteStatus = (typeof IssuerQuoteStatus)[keyof typeof IssuerQuoteStatus];

/**
 * Structured product configuration embedded in an Rfq / Quote.
 * Kept intentionally permissive (Json on the Prisma side) because issuers may
 * return any set of structural parameters.
 */
export type ProductConfig = Record<string, unknown>;

/**
 * Rfq aggregate — a CGP requests a quote from a pool of issuers.
 *
 * @property productConfig - Free-form structural ask (payoff, underlyings, barriers…).
 * @property sentAt - When the RFQ was dispatched to issuers (null while DRAFT).
 */
export interface Rfq {
  id: string;
  cgpId: string;
  status: RFQStatus;
  productConfig: ProductConfig;
  sentAt: string | null;
  expiresAt: string | null;
  createdAt: string;
  updatedAt: string;
}

/**
 * Single Issuer response to an Rfq.
 *
 * @property quoteData - Full priced parameters (issue price, fees, barriers…).
 * @property coupon - Indicative coupon (%, annualised).
 * @property price - Indicative issue price (par = 100).
 */
export interface IssuerRfqQuote {
  id: string;
  rfqId: string;
  issuerId: string;
  status: IssuerQuoteStatus;
  quoteData: Record<string, unknown>;
  coupon: number | null;
  price: number | null;
  validUntil: string | null;
  receivedAt: string;
  createdAt: string;
  updatedAt: string;
}

/** Input used when a CGP creates a new Rfq draft. */
export type CreateRfqInput = Omit<
  Rfq,
  'id' | 'status' | 'sentAt' | 'createdAt' | 'updatedAt'
>;

/** Input used by an Issuer to submit a quote. */
export type SubmitQuoteInput = Omit<
  IssuerRfqQuote,
  'id' | 'status' | 'receivedAt' | 'createdAt' | 'updatedAt'
>;
