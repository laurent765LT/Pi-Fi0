/**
 * Insurer domain types.
 *
 * Source of truth: apps/api/prisma/schema.prisma#Insurer
 *
 * An Insurer is a regulated entity (assureur) that:
 * - hosts life-insurance (AV) and capitalisation contracts,
 * - allocates Envelopes of Products onto its shelves,
 * - is one end of Contracts held by end-clients.
 */

/** Insurer aggregate entity. */
export interface Insurer {
  id: string;
  name: string;
  legalName: string | null;
  siren: string | null;
  logoUrl: string | null;
  apiBaseUrl: string | null;
  /** Encrypted credential references only — never raw API secrets. */
  apiCredentials: Record<string, unknown> | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

/** Projection exposed in lists (e.g. onboarding picker). */
export interface InsurerSummary {
  id: string;
  name: string;
  logoUrl: string | null;
  isActive: boolean;
}

/** Input used when creating an Insurer (platform admin only). */
export type CreateInsurerInput = Omit<Insurer, 'id' | 'createdAt' | 'updatedAt'>;

/** Partial update payload for an Insurer. */
export type UpdateInsurerInput = Partial<
  Pick<Insurer, 'name' | 'legalName' | 'siren' | 'logoUrl' | 'apiBaseUrl' | 'isActive'>
>;

/**
 * Link table between a User and an Insurer for role INSURER_ADMIN.
 * Source of truth: apps/api/prisma/schema.prisma#InsurerAdmin
 */
export interface InsurerAdmin {
  id: string;
  userId: string;
  insurerId: string;
  createdAt: string;
  updatedAt: string;
}
