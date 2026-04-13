import { z } from 'zod';

// Login form
export const loginSchema = z.object({
  email: z.string().email('Adresse e-mail invalide'),
  password: z.string().min(6, 'Minimum 6 caractères'),
});
export type LoginFormData = z.infer<typeof loginSchema>;

// Commitment form
export const commitmentSchema = z.object({
  shelfId: z.string().min(1),
  amount: z.number().min(1000, 'Montant minimum : 1 000 €').max(100_000_000, 'Montant maximum : 100M €'),
  contractType: z.enum(['ASSURANCE_VIE', 'CTO', 'PEA']),
  insurerEnvelope: z.string().min(1, 'Sélectionnez un assureur'),
  clientCount: z.number().int().min(1).max(1000),
  kidAcknowledged: z.literal(true, { message: 'Vous devez accepter le KID' }),
});
export type CommitmentFormData = z.infer<typeof commitmentSchema>;

// Pricing config
export const pricingConfigSchema = z.object({
  structureType: z.string().min(1, 'Sélectionnez un type'),
  productName: z.string().min(2, 'Nom requis').max(100),
  currency: z.enum(['EUR', 'USD', 'GBP', 'CHF']),
  nominalAmount: z.number().min(10_000, 'Minimum 10 000 €').max(1_000_000_000),
  couponRate: z.number().min(0).max(30, 'Maximum 30%'),
  couponBarrier: z.number().min(0).max(100),
  protectionBarrier: z.number().min(0).max(100),
  autocallBarrier: z.number().min(50).max(150),
  mcPaths: z.number().int().min(1000).max(1_000_000),
  structuringMargin: z.number().min(0).max(10),
  distributionFee: z.number().min(0).max(10),
});
export type PricingConfigFormData = z.infer<typeof pricingConfigSchema>;

// RFQ form
export const rfqSchema = z.object({
  productName: z.string().min(2),
  structureType: z.string().min(1),
  nominal: z.number().min(100_000, 'Minimum 100k€'),
  selectedIssuers: z.array(z.string()).min(1, 'Sélectionnez au moins 1 émetteur'),
});
export type RfqFormData = z.infer<typeof rfqSchema>;

// Contact/Support
export const contactSchema = z.object({
  subject: z.string().min(3, 'Sujet requis'),
  message: z.string().min(10, 'Message trop court').max(2000),
  priority: z.enum(['low', 'medium', 'high']).default('medium'),
});
export type ContactFormData = z.infer<typeof contactSchema>;
