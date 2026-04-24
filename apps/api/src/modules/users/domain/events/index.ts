export { UserRegisteredEvent } from './user-registered.event';
export { UserProfileUpdatedEvent } from './user-profile-updated.event';

import type { UserRegisteredEvent } from './user-registered.event';
import type { UserProfileUpdatedEvent } from './user-profile-updated.event';

/**
 * Discriminated union of every domain event emitted by the users module.
 * The event bus implementation narrows on `event.name` to dispatch.
 */
export type UserDomainEvent = UserRegisteredEvent | UserProfileUpdatedEvent;
