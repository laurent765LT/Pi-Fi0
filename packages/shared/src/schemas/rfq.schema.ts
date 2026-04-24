/**
 * Runtime validation for RFQ DTOs.
 */

import { z } from 'zod';
import { IssuerQuoteStatus, RFQStatus } from '../domain/rfq';

const RFQStatusSchema = z.enum(
  Object.values(RFQStatus) as [RFQStatus, ...RFQStatus[]],
);
const IssuerQuoteStatusSchema = z.enum(
  Object.values(IssuerQuoteStatus) as [IssuerQuoteStatus, ...IssuerQuoteStatus[]],
);

export const ProductConfigSchema = z.record(z.string(), z.unknown());
export type ProductConfigSchemaInput = z.infer<typeof ProductConfigSchema>;

export const CreateRfqSchema = z.object({
  productConfig: ProductConfigSchema,
  expiresAt: z.string().datetime().nullable().optional(),
});
export type CreateRfqSchemaInput = z.infer<typeof CreateRfqSchema>;

export const SendRfqSchema = z.object({
  issuerIds: z.array(z.string().cuid()).min(1).max(50),
});
export type SendRfqSchemaInput = z.infer<typeof SendRfqSchema>;

export const ListRfqsQuerySchema = z.object({
  status: RFQStatusSchema.optional(),
  cgpId: z.string().cuid().optional(),
  since: z.string().datetime().optional(),
  page: z.number().int().min(1).optional(),
  limit: z.number().int().min(1).max(200).optional(),
});
export type ListRfqsQuerySchemaInput = z.infer<typeof ListRfqsQuerySchema>;

export const SubmitQuoteSchema = z.object({
  issuerId: z.string().cuid(),
  quoteData: z.record(z.string(), z.unknown()),
  coupon: z.number().min(0).max(100).nullable().optional(),
  price: z.number().min(0).max(1000).nullable().optional(),
  validUntil: z.string().datetime().nullable().optional(),
});
export type SubmitQuoteSchemaInput = z.infer<typeof SubmitQuoteSchema>;

export const AcceptQuoteSchema = z.object({
  clientId: z.string().cuid(),
  contractId: z.string().cuid(),
  amount: z.number().positive(),
  idempotencyKey: z.string().min(16).max(128),
});
export type AcceptQuoteSchemaInput = z.infer<typeof AcceptQuoteSchema>;

export const ListQuotesQuerySchema = z.object({
  status: IssuerQuoteStatusSchema.optional(),
  page: z.number().int().min(1).optional(),
  limit: z.number().int().min(1).max(200).optional(),
});
export type ListQuotesQuerySchemaInput = z.infer<typeof ListQuotesQuerySchema>;
