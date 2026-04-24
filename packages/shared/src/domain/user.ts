/**
 * User domain types.
 *
 * Source of truth: apps/api/prisma/schema.prisma#User
 *
 * Functional roles mapped from the Sprint 1 spec:
 * - CGP (Conseiller en Gestion de Patrimoine): end-user distributor
 * - INSURER_ADMIN / ISSUER_ADMIN: B2B partner operators
 * - PLATFORM_ADMIN: Strick'in internal ops
 *
 * Legacy values (SUPER_ADMIN, ORG_ADMIN, MANAGER, VIEWER) are kept for
 * backwards compatibility with the pre-Sprint-1 seed data.
 */

/** Enumeration of user functional roles. */
export const UserRole = {
  SUPER_ADMIN: 'SUPER_ADMIN',
  ORG_ADMIN: 'ORG_ADMIN',
  MANAGER: 'MANAGER',
  VIEWER: 'VIEWER',
  CGP: 'CGP',
  INSURER_ADMIN: 'INSURER_ADMIN',
  ISSUER_ADMIN: 'ISSUER_ADMIN',
  PLATFORM_ADMIN: 'PLATFORM_ADMIN',
} as const;
export type UserRole = (typeof UserRole)[keyof typeof UserRole];

/** Onboarding workflow state of a User (documents upload → verified → active). */
export const OnboardingStatus = {
  PENDING: 'PENDING',
  DOCS_UPLOADED: 'DOCS_UPLOADED',
  VERIFIED: 'VERIFIED',
  ACTIVE: 'ACTIVE',
  SUSPENDED: 'SUSPENDED',
} as const;
export type OnboardingStatus = (typeof OnboardingStatus)[keyof typeof OnboardingStatus];

/**
 * Legal organisation family for cross-role multi-tenant data.
 * Used by the legacy Organization model before the Sprint 1 split.
 */
export const OrgType = {
  INSURER: 'INSURER',
  BROKER: 'BROKER',
  ADMIN: 'ADMIN',
} as const;
export type OrgType = (typeof OrgType)[keyof typeof OrgType];

/**
 * Canonical User entity mirrored from Prisma.
 *
 * @property id - cuid primary key.
 * @property email - Unique business identifier (case-insensitive, lower-cased).
 * @property role - Functional role (see {@link UserRole}).
 * @property orgId - FK to legacy Organization (nullable in future schemas).
 * @property oriasNumber - French intermediary registration (8 digits).
 * @property rcpInsurer - Professional civil liability insurer name.
 * @property onboardingStatus - KYB state (see {@link OnboardingStatus}).
 * @property kycStatus - Regulatory KYC state (see KYCStatus in client.ts).
 */
export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  orgId: string;
  oriasNumber: string | null;
  oriasValidUntil: string | null;
  rcpInsurer: string | null;
  rcpAmount: number | null;
  onboardingStatus: OnboardingStatus;
  kycStatus: string;
  createdAt: string;
  updatedAt: string;
}

/** Minimum public projection of User (never exposes password hash / tokens). */
export interface UserPublic {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  orgId?: string;
  avatarUrl?: string | null;
  locale?: string;
  createdAt?: string;
  updatedAt?: string;
}

/** Input for creating a User — server-generated fields are omitted. */
export type CreateUserInput = Omit<User, 'id' | 'createdAt' | 'updatedAt'>;

/** Input for updating a User — every field is optional. */
export type UpdateUserInput = Partial<
  Pick<User, 'firstName' | 'lastName' | 'oriasNumber' | 'oriasValidUntil' | 'rcpInsurer' | 'rcpAmount'>
>;
