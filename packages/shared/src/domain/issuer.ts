/**
 * Issuer domain types.
 *
 * Source of truth: apps/api/prisma/schema.prisma#Issuer
 *
 * An Issuer is an investment bank or structurer that:
 * - designs and issues structured Products,
 * - responds to RFQs from CGPs (see IssuerRfqQuote),
 * - is identified on capital markets by a LEI.
 */

/** Issuer aggregate entity. */
export interface Issuer {
  id: string;
  name: string;
  legalName: string | null;
  /** Legal Entity Identifier (20 alphanumeric, ISO 17442). */
  lei: string | null;
  logoUrl: string | null;
  apiBaseUrl: string | null;
  /** Encrypted credential references only — never raw API secrets. */
  apiCredentials: Record<string, unknown> | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

/** Projection exposed in lists / pickers. */
export interface IssuerSummary {
  id: string;
  name: string;
  logoUrl: string | null;
  isActive: boolean;
}

/** Input used when creating an Issuer (platform admin only). */
export type CreateIssuerInput = Omit<Issuer, 'id' | 'createdAt' | 'updatedAt'>;

/** Partial update payload for an Issuer. */
export type UpdateIssuerInput = Partial<
  Pick<Issuer, 'name' | 'legalName' | 'lei' | 'logoUrl' | 'apiBaseUrl' | 'isActive'>
>;

/**
 * Link table between a User and an Issuer for role ISSUER_ADMIN.
 * Source of truth: apps/api/prisma/schema.prisma#IssuerAdmin
 */
export interface IssuerAdmin {
  id: string;
  userId: string;
  issuerId: string;
  createdAt: string;
  updatedAt: string;
}
