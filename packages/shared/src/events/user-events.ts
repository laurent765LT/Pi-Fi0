/**
 * User lifecycle domain events.
 */

import type { UserRole } from '../domain/user';
import type { DomainEvent } from './base';

/** Emitted when a new User completes registration. */
export type UserRegisteredEvent = DomainEvent<
  'user.registered',
  {
    userId: string;
    email: string;
    role: UserRole;
  }
>;

/** Emitted after a successful password check (pre-MFA). */
export type UserLoggedInEvent = DomainEvent<
  'user.logged_in',
  {
    userId: string;
    ipAddress: string | null;
    userAgent: string | null;
  }
>;

/** Emitted when a login attempt fails (wrong password, locked account…). */
export type UserLoginFailedEvent = DomainEvent<
  'user.login_failed',
  {
    email: string;
    reason: 'INVALID_CREDENTIALS' | 'ACCOUNT_LOCKED' | 'ACCOUNT_SUSPENDED';
    ipAddress: string | null;
  }
>;

/** Emitted when a User changes their own password. */
export type UserPasswordChangedEvent = DomainEvent<
  'user.password_changed',
  { userId: string }
>;

/** Emitted when a platform admin changes a User's role. */
export type UserRoleChangedEvent = DomainEvent<
  'user.role_changed',
  {
    userId: string;
    previousRole: UserRole;
    newRole: UserRole;
  }
>;

/** Emitted when KYC is accepted for a User. */
export type UserKycVerifiedEvent = DomainEvent<
  'user.kyc_verified',
  { userId: string }
>;
