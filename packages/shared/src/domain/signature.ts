/**
 * Signature domain types.
 *
 * Source of truth: apps/api/prisma/schema.prisma#Signature
 *
 * Signatures track e-signature procedures (Yousign, DocuSign, etc.) used to
 * collect legally binding consent on mandates, subscription forms, KIDs, etc.
 */

/** Lifecycle of an e-signature procedure. */
export const SignatureStatus = {
  DRAFT: 'DRAFT',
  SENT: 'SENT',
  SIGNED: 'SIGNED',
  REFUSED: 'REFUSED',
  EXPIRED: 'EXPIRED',
} as const;
export type SignatureStatus = (typeof SignatureStatus)[keyof typeof SignatureStatus];

/** Catalogue of document types that can be sent for signature. */
export const SignatureDocumentType = {
  MANDATE: 'MANDATE',
  SUBSCRIPTION: 'SUBSCRIPTION',
  KID: 'KID',
  DDA: 'DDA',
  PRIPPS_STATEMENT: 'PRIPPS_STATEMENT',
  CUSTOM: 'CUSTOM',
} as const;
export type SignatureDocumentType =
  (typeof SignatureDocumentType)[keyof typeof SignatureDocumentType];

/**
 * Advanced / Qualified signature levels per eIDAS.
 * Used to select a provider/strong-auth flow from the SignatureModule.
 */
export const SignatureLevel = {
  SES: 'SES', // Simple Electronic Signature
  AES: 'AES', // Advanced Electronic Signature
  QES: 'QES', // Qualified Electronic Signature
} as const;
export type SignatureLevel = (typeof SignatureLevel)[keyof typeof SignatureLevel];

/**
 * Signature entity.
 *
 * @property yousignProcedureId - External identifier returned by the provider.
 * @property yousignSignatureUrl - Short-lived signing URL delivered to signer.
 */
export interface Signature {
  id: string;
  documentType: SignatureDocumentType;
  signerId: string;
  orderId: string | null;
  yousignProcedureId: string | null;
  yousignSignatureUrl: string | null;
  status: SignatureStatus;
  sentAt: string | null;
  completedAt: string | null;
  refusedAt: string | null;
  expiresAt: string | null;
  metadata: Record<string, unknown> | null;
  createdAt: string;
  updatedAt: string;
}

/** Input used when requesting a new signature procedure. */
export type CreateSignatureInput = Omit<
  Signature,
  | 'id'
  | 'status'
  | 'yousignProcedureId'
  | 'yousignSignatureUrl'
  | 'sentAt'
  | 'completedAt'
  | 'refusedAt'
  | 'createdAt'
  | 'updatedAt'
>;
