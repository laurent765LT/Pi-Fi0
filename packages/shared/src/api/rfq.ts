/**
 * RFQ HTTP contracts.
 */

import type {
  IssuerRfqQuote,
  IssuerQuoteStatus,
  ProductConfig,
  Rfq,
  RFQStatus,
} from '../domain/rfq';
import type { OffsetPagination, PagedResponse } from './pagination';

/** Query-string filters for GET /rfqs. */
export interface ListRfqsQuery extends OffsetPagination {
  status?: RFQStatus;
  cgpId?: string;
  since?: string;
}

/** Request body for POST /rfqs. */
export interface CreateRfqDto {
  productConfig: ProductConfig;
  expiresAt?: string | null;
}

/** Request body for POST /rfqs/:id/send (dispatches to issuer list). */
export interface SendRfqDto {
  issuerIds: string[];
}

/** Response to POST /rfqs/:id/send. */
export interface SendRfqResponse {
  rfq: Rfq;
  dispatchedTo: number;
}

/** Response to GET /rfqs. */
export type ListRfqsResponse = PagedResponse<Rfq>;

/** Response to GET /rfqs/:id (full hydrate with quotes). */
export interface RfqDetailResponse {
  rfq: Rfq;
  quotes: IssuerRfqQuote[];
}

/** Query-string filters for GET /rfqs/:id/quotes. */
export interface ListQuotesQuery extends OffsetPagination {
  status?: IssuerQuoteStatus;
}

/** Request body for POST /rfqs/:id/quotes (issuer side). */
export interface SubmitQuoteDto {
  issuerId: string;
  quoteData: Record<string, unknown>;
  coupon?: number | null;
  price?: number | null;
  validUntil?: string | null;
}

/** Request body for POST /quotes/:id/accept (CGP accepts a quote → creates Order). */
export interface AcceptQuoteDto {
  clientId: string;
  contractId: string;
  amount: number;
  idempotencyKey: string;
}
