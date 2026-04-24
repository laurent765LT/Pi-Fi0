/**
 * Client (end-investor) domain types.
 *
 * Source of truth: apps/api/prisma/schema.prisma#Client
 *
 * A Client is an end-investor managed by a CGP. PII beyond core identifiers
 * is encrypted at rest in `encryptedData`.
 */

/** KYC regulatory status. */
export const KYCStatus = {
  PENDING: 'PENDING',
  IN_REVIEW: 'IN_REVIEW',
  VERIFIED: 'VERIFIED',
  REJECTED: 'REJECTED',
  EXPIRED: 'EXPIRED',
} as const;
export type KYCStatus = (typeof KYCStatus)[keyof typeof KYCStatus];

/**
 * Client aggregate.
 *
 * @property cgpId - Owning CGP.
 * @property encryptedData - JSONB encrypted PII (address, tax id, NIR reference…).
 *                           Never decrypted on the client side.
 */
export interface Client {
  id: string;
  cgpId: string;
  firstName: string;
  lastName: string;
  birthDate: string | null;
  email: string | null;
  phone: string | null;
  kycStatus: KYCStatus;
  encryptedData: Record<string, unknown> | null;
  createdAt: string;
  updatedAt: string;
}

/** Sensitive-free projection exposed to the CGP front. */
export interface ClientSummary {
  id: string;
  firstName: string;
  lastName: string;
  email: string | null;
  kycStatus: KYCStatus;
  createdAt: string;
}

/** Input used when a CGP registers a new Client. */
export type CreateClientInput = Omit<
  Client,
  'id' | 'kycStatus' | 'createdAt' | 'updatedAt'
>;

/** Partial update to a Client profile. */
export type UpdateClientInput = Partial<
  Pick<Client, 'firstName' | 'lastName' | 'birthDate' | 'email' | 'phone' | 'encryptedData'>
>;
