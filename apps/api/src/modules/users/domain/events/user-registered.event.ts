import type { UserId } from '../value-objects/user-id.vo';
import type { Email } from '../value-objects/email.vo';

/**
 * Emitted by the domain when a new `User` aggregate is created (i.e. a
 * successful registration). Downstream infrastructure listeners can react
 * to it — audit log, welcome email, analytics … — without coupling the
 * domain to those concerns.
 *
 * The payload is intentionally minimal: the id + email + timestamp.
 * Consumers that need more data reload the aggregate via the repository.
 */
export class UserRegisteredEvent {
  readonly name = 'user.registered' as const;

  constructor(
    public readonly userId: UserId,
    public readonly email: Email,
    public readonly occurredAt: Date = new Date(),
  ) {}
}
