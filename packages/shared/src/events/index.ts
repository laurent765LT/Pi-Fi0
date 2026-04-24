/**
 * Domain events emitted by the backend.
 *
 * Events are serialised to JSON and published on the internal event bus
 * (Redis Streams in v1). Webhooks relay the same payload to external
 * integrations.
 *
 * ALL events share the {@link DomainEvent} envelope: consumers can discriminate
 * on `type` to narrow the payload.
 */

export * from './base';
export * from './user-events';
export * from './commitment-events';
export * from './rfq-events';
export * from './signature-events';
export * from './kyc-events';

import type {
  UserRegisteredEvent,
  UserLoggedInEvent,
  UserLoginFailedEvent,
  UserPasswordChangedEvent,
  UserRoleChangedEvent,
  UserKycVerifiedEvent,
} from './user-events';
import type {
  CommitmentCreatedEvent,
  CommitmentApprovedEvent,
  CommitmentRejectedEvent,
  OrderSettledEvent,
  OrderFailedEvent,
} from './commitment-events';
import type {
  RfqSentEvent,
  QuoteReceivedEvent,
  QuoteAcceptedEvent,
  QuoteRejectedEvent,
  RfqExpiredEvent,
} from './rfq-events';
import type {
  SignatureRequestedEvent,
  SignatureCompletedEvent,
  SignatureRefusedEvent,
  SignatureStatusChangedEvent,
} from './signature-events';
import type {
  KycSubmittedEvent,
  KycVerifiedEvent,
  KycRejectedEvent,
} from './kyc-events';

/** Union of every domain event. Useful for exhaustive switch on `type`. */
export type AnyDomainEvent =
  | UserRegisteredEvent
  | UserLoggedInEvent
  | UserLoginFailedEvent
  | UserPasswordChangedEvent
  | UserRoleChangedEvent
  | UserKycVerifiedEvent
  | CommitmentCreatedEvent
  | CommitmentApprovedEvent
  | CommitmentRejectedEvent
  | OrderSettledEvent
  | OrderFailedEvent
  | RfqSentEvent
  | QuoteReceivedEvent
  | QuoteAcceptedEvent
  | QuoteRejectedEvent
  | RfqExpiredEvent
  | SignatureRequestedEvent
  | SignatureCompletedEvent
  | SignatureRefusedEvent
  | SignatureStatusChangedEvent
  | KycSubmittedEvent
  | KycVerifiedEvent
  | KycRejectedEvent;
