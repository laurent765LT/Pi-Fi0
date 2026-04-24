import type { UserDomainEvent } from '../../domain/events';

/**
 * Generic pub/sub port the application layer uses to dispatch domain
 * events after a write has been persisted. The infrastructure adapter may
 * emit on NestJS's `EventEmitter2`, a message broker, or a simple in-proc
 * logger during development — the handler doesn't care.
 */
export interface IUserEventPublisher {
  publish(events: readonly UserDomainEvent[]): Promise<void>;
}

export const USER_EVENT_PUBLISHER = Symbol('IUserEventPublisher');
