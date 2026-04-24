/**
 * Runtime validation for Product DTOs.
 */

import { z } from 'zod';
import { PayoffType, ProductStatus } from '../domain/product';
import { isValidIsin } from '../utils/validators';

const PayoffTypeSchema = z.enum(
  Object.values(PayoffType) as [PayoffType, ...PayoffType[]],
);
const ProductStatusSchema = z.enum(
  Object.values(ProductStatus) as [ProductStatus, ...ProductStatus[]],
);

/**
 * Inclusive range schema for the PRIIPs 1-7 SRI scale.
 */
const SriSchema = z.number().int().min(1).max(7);

export const ProductFiltersSchema = z.object({
  search: z.string().max(200).optional(),
  payoffType: PayoffTypeSchema.optional(),
  status: ProductStatusSchema.optional(),
  sriMin: SriSchema.optional(),
  sriMax: SriSchema.optional(),
  issuerId: z.string().cuid().optional(),
  page: z.number().int().min(1).optional(),
  limit: z.number().int().min(1).max(200).optional(),
});
export type ProductFiltersSchemaInput = z.infer<typeof ProductFiltersSchema>;

export const CreateProductSchema = z.object({
  isin: z
    .string()
    .length(12)
    .refine(isValidIsin, { message: 'Invalid ISIN (bad checksum).' }),
  name: z.string().min(1).max(200),
  payoffType: PayoffTypeSchema,
  issuerName: z.string().min(1).max(200),
  guarantorName: z.string().max(200).nullable().optional(),
  underlyingName: z.string().min(1).max(200),
  underlyingYahoo: z.string().min(1).max(64),
  initialPrice: z.number().positive().nullable().optional(),
  barrierCapPct: z.number().min(0).max(100),
  autocallBarrierPct: z.number().min(0).max(100).nullable().optional(),
  couponPct: z.number().min(0).max(100).nullable().optional(),
  maxGainPct: z.number().min(0).max(1000),
  sri: SriSchema,
  maturityDate: z.string().datetime(),
  observationDates: z.array(z.string().datetime()).default([]),
  entryFeePct: z.number().min(0).max(10),
  managementFeePct: z.number().min(0).max(10).default(0),
  reference: z.string().max(64).nullable().optional(),
  kidUrl: z.string().url().nullable().optional(),
  description: z.string().max(5000).nullable().optional(),
  descriptionData: z.record(z.string(), z.unknown()).nullable().optional(),
  orgId: z.string().cuid().nullable().optional(),
  issuerId: z.string().cuid().nullable().optional(),
});
export type CreateProductSchemaInput = z.infer<typeof CreateProductSchema>;

export const UpdateProductSchema = CreateProductSchema.omit({ isin: true }).partial();
export type UpdateProductSchemaInput = z.infer<typeof UpdateProductSchema>;
