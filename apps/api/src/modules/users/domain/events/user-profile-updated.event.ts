import type { UserId } from '../value-objects/user-id.vo';

/**
 * Emitted when a user's name / profile metadata is changed. Useful for
 * downstream search indexing, CRM sync, activity feeds.
 */
export class UserProfileUpdatedEvent {
  readonly name = 'user.profile.updated' as const;

  constructor(
    public readonly userId: UserId,
    public readonly changes: Readonly<{
      firstName?: string;
      lastName?: string;
    }>,
    public readonly occurredAt: Date = new Date(),
  ) {}
}
