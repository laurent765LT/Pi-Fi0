/**
 * Runtime validation for authentication DTOs.
 *
 * These Zod schemas are consumed by:
 * - apps/api: ZodValidationPipe (preferred) or manual parsing.
 * - apps/web: react-hook-form resolver + fetch-side parsing.
 *
 * Types are inferred from the schema to avoid the DTO/schema duplication.
 */

import { z } from 'zod';
import { PASSWORD_REGEX } from '../utils/validators';

export const RegistrableRoleSchema = z.enum(['CGP', 'ASSUREUR', 'ADMIN']);

export const RegisterSchema = z.object({
  email: z.string().email().max(254),
  password: z
    .string()
    .regex(
      PASSWORD_REGEX,
      'Password must contain at least 12 characters, including 1 uppercase letter, 1 digit, and 1 special character (!@#$%^&*).',
    ),
  firstName: z.string().min(1).max(100),
  lastName: z.string().min(1).max(100),
  role: RegistrableRoleSchema.optional(),
});
export type RegisterInput = z.infer<typeof RegisterSchema>;

export const LoginSchema = z.object({
  email: z.string().email().max(254),
  password: z.string().min(1).max(512),
});
export type LoginInput = z.infer<typeof LoginSchema>;

export const RefreshSchema = z.object({
  refreshToken: z.string().max(2048).optional(),
});
export type RefreshInput = z.infer<typeof RefreshSchema>;
