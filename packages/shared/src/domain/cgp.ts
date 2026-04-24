/**
 * CGP (Conseiller en Gestion de Patrimoine) domain types.
 *
 * Source of truth: apps/api/prisma/schema.prisma#Cgp
 *
 * A CGP is a one-to-one profile extension of a User with role = CGP. It holds
 * the regulated attributes required by ACPR for intermediary registration:
 * SIREN, ORIAS number, and RCP (professional civil liability) coverage.
 */

/** Lifecycle state of a CGP account. */
export const CgpStatus = {
  PENDING: 'PENDING',
  ACTIVE: 'ACTIVE',
  SUSPENDED: 'SUSPENDED',
  DEACTIVATED: 'DEACTIVATED',
} as const;
export type CgpStatus = (typeof CgpStatus)[keyof typeof CgpStatus];

/**
 * CGP profile — business attributes on top of the base User.
 *
 * @property siren - 9-digit French company identifier (with Luhn checksum).
 * @property oriasNumber - 8-digit ORIAS registration (intermediary registry).
 * @property rcpInsurer - Name of the RCP insurance provider.
 * @property rcpAmount - Coverage amount in EUR.
 * @property rcpValidUntil - ISO date string of RCP expiry.
 */
export interface Cgp {
  id: string;
  userId: string;
  companyName: string;
  siren: string;
  oriasNumber: string;
  rcpInsurer: string | null;
  rcpAmount: number | null;
  rcpValidUntil: string | null;
  status: CgpStatus;
  createdAt: string;
  updatedAt: string;
}

/** Minimal projection used by lists / look-ups. */
export interface CgpSummary {
  id: string;
  companyName: string;
  siren: string;
  oriasNumber: string;
  status: CgpStatus;
}

/** Input used when creating a CGP as part of onboarding. */
export type CreateCgpInput = Omit<Cgp, 'id' | 'status' | 'createdAt' | 'updatedAt'>;

/** Partial update applied to a CGP record. */
export type UpdateCgpInput = Partial<
  Pick<Cgp, 'companyName' | 'siren' | 'oriasNumber' | 'rcpInsurer' | 'rcpAmount' | 'rcpValidUntil'>
>;
