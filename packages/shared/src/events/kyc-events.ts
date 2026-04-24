/**
 * KYC lifecycle domain events.
 */

import type { DomainEvent } from './base';

export type KycSubmittedEvent = DomainEvent<
  'kyc.submitted',
  {
    clientId: string;
    cgpId: string;
  }
>;

export type KycVerifiedEvent = DomainEvent<
  'kyc.verified',
  {
    clientId: string;
    verifiedBy: string;
  }
>;

export type KycRejectedEvent = DomainEvent<
  'kyc.rejected',
  {
    clientId: string;
    rejectedBy: string;
    reason: string;
  }
>;
