import { Email } from '../value-objects/email.vo';
import { UserId } from '../value-objects/user-id.vo';
import type { UserDomainEvent } from '../events';
import { UserRegisteredEvent } from '../events/user-registered.event';
import { UserProfileUpdatedEvent } from '../events/user-profile-updated.event';

/**
 * Functional role in the Strick'in platform. This is the *domain* view of
 * roles — it mirrors the subset of Prisma `UserRole` that actually has
 * behaviour in the users bounded context. The persistence mapper
 * translates to/from the full Prisma enum (which also includes
 * `SUPER_ADMIN`, `MANAGER`, etc. for other contexts).
 */
export type UserRole =
  | 'CGP'
  | 'INSURER_ADMIN'
  | 'ISSUER_ADMIN'
  | 'PLATFORM_ADMIN'
  | 'VIEWER'
  | 'MANAGER'
  | 'ORG_ADMIN'
  | 'SUPER_ADMIN';

export type KycStatus = 'PENDING' | 'IN_REVIEW' | 'VERIFIED' | 'REJECTED' | 'EXPIRED';

/**
 * The full internal shape of a `User` aggregate. Only the entity itself
 * constructs / mutates this object — callers go through the static
 * factories and instance methods.
 */
export interface UserProps {
  id: UserId;
  email: Email;
  firstName: string;
  lastName: string;
  role: UserRole;
  orgId: string;
  kycStatus: KycStatus;
  createdAt: Date;
  updatedAt: Date;
  /**
   * Optional — only loaded by the repository when the caller explicitly
   * needs it (authentication flows). Everywhere else it is omitted to
   * prevent accidental exposure.
   */
  passwordHash?: string;
}

/**
 * The `User` aggregate root.
 *
 * Design notes:
 *   - The constructor is private; instances are created through
 *     `User.create()` (new aggregate) or `User.reconstitute()` (loaded
 *     from persistence). This keeps invariants in a single place.
 *   - All mutation flows through named intention-revealing methods
 *     (e.g. `updateProfile`, `markKycVerified`). Direct property access
 *     is read-only.
 *   - Domain events accumulate inside `_domainEvents` and are pulled by
 *     the application layer after persistence completes. The aggregate
 *     never dispatches events by itself.
 */
export class User {
  private readonly _domainEvents: UserDomainEvent[] = [];

  private constructor(private props: UserProps) {}

  // ── Factories ───────────────────────────────────────────────────────────

  /**
   * Creates a brand-new user. Emits `UserRegisteredEvent`.
   */
  static create(
    props: Omit<UserProps, 'id' | 'createdAt' | 'updatedAt'> & {
      id?: UserId;
    },
  ): User {
    const now = new Date();
    const user = new User({
      ...props,
      id: props.id ?? UserId.generate(),
      createdAt: now,
      updatedAt: now,
    });
    user._domainEvents.push(
      new UserRegisteredEvent(user.props.id, user.props.email, now),
    );
    return user;
  }

  /**
   * Re-hydrates an aggregate from persistence. Does NOT emit events —
   * the user already existed.
   */
  static reconstitute(props: UserProps): User {
    return new User(props);
  }

  // ── Getters (read-only projection) ──────────────────────────────────────

  get id(): UserId {
    return this.props.id;
  }

  get email(): Email {
    return this.props.email;
  }

  get firstName(): string {
    return this.props.firstName;
  }

  get lastName(): string {
    return this.props.lastName;
  }

  get fullName(): string {
    return `${this.props.firstName} ${this.props.lastName}`.trim();
  }

  get role(): UserRole {
    return this.props.role;
  }

  get orgId(): string {
    return this.props.orgId;
  }

  get kycStatus(): KycStatus {
    return this.props.kycStatus;
  }

  get createdAt(): Date {
    return new Date(this.props.createdAt.getTime());
  }

  get updatedAt(): Date {
    return new Date(this.props.updatedAt.getTime());
  }

  get passwordHash(): string | undefined {
    return this.props.passwordHash;
  }

  // ── Business methods ────────────────────────────────────────────────────

  /**
   * Rename the user. Both values are required and trimmed. Raises the
   * `UserProfileUpdatedEvent` when at least one value actually changes.
   */
  updateProfile(firstName: string, lastName: string): void {
    const newFirst = firstName.trim();
    const newLast = lastName.trim();
    if (newFirst.length === 0 || newLast.length === 0) {
      throw new Error('firstName and lastName cannot be empty.');
    }

    const changes: { firstName?: string; lastName?: string } = {};
    if (this.props.firstName !== newFirst) changes.firstName = newFirst;
    if (this.props.lastName !== newLast) changes.lastName = newLast;
    if (Object.keys(changes).length === 0) return;

    this.props.firstName = newFirst;
    this.props.lastName = newLast;
    this.props.updatedAt = new Date();
    this._domainEvents.push(
      new UserProfileUpdatedEvent(this.props.id, changes, this.props.updatedAt),
    );
  }

  /**
   * Transition KYC to VERIFIED. No-op when already verified (idempotent).
   */
  markKycVerified(): void {
    if (this.props.kycStatus === 'VERIFIED') return;
    this.props.kycStatus = 'VERIFIED';
    this.props.updatedAt = new Date();
  }

  /**
   * Attach a freshly computed password hash (e.g. during registration or
   * a password reset). The hash itself is opaque from the domain's POV.
   */
  setPasswordHash(hash: string): void {
    if (!hash || hash.length < 10) {
      throw new Error('Cannot set an empty / obviously-invalid password hash.');
    }
    this.props.passwordHash = hash;
    this.props.updatedAt = new Date();
  }

  // ── Events ──────────────────────────────────────────────────────────────

  /** Read-only copy of accumulated events (for inspection in tests). */
  getDomainEvents(): readonly UserDomainEvent[] {
    return [...this._domainEvents];
  }

  /**
   * Pulls the accumulated events and clears the internal buffer.
   * Application handlers call this after a successful `repository.save`.
   */
  pullDomainEvents(): UserDomainEvent[] {
    const drained = this._domainEvents.splice(0, this._domainEvents.length);
    return drained;
  }

  // ── Snapshot for persistence ────────────────────────────────────────────

  /**
   * Returns a plain snapshot of the aggregate's state. Intended for the
   * infrastructure mapper ONLY — do not ship this over the wire.
   */
  toSnapshot(): UserProps {
    return { ...this.props };
  }
}
