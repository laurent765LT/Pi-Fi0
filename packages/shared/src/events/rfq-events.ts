/**
 * RFQ lifecycle domain events.
 */

import type { DomainEvent } from './base';

export type RfqSentEvent = DomainEvent<
  'rfq.sent',
  {
    rfqId: string;
    cgpId: string;
    issuerIds: string[];
    expiresAt: string | null;
  }
>;

export type QuoteReceivedEvent = DomainEvent<
  'quote.received',
  {
    quoteId: string;
    rfqId: string;
    issuerId: string;
    coupon: number | null;
    price: number | null;
  }
>;

export type QuoteAcceptedEvent = DomainEvent<
  'quote.accepted',
  {
    quoteId: string;
    rfqId: string;
    orderId: string;
    acceptedBy: string;
  }
>;

export type QuoteRejectedEvent = DomainEvent<
  'quote.rejected',
  {
    quoteId: string;
    rfqId: string;
    rejectedBy: string;
    reason: string;
  }
>;

export type RfqExpiredEvent = DomainEvent<
  'rfq.expired',
  {
    rfqId: string;
  }
>;
