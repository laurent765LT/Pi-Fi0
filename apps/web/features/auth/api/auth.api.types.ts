// ─── Auth feature — API wire types ───────────────────────────────────────────
// Thin re-exports of the backend request/response shapes. Ship-of-Theseus:
// this file is the stable import surface for the auth API; the underlying
// types can migrate to `@strickin/shared/api` without touching callers.

export type {
  LoginCredentials,
  RegisterInput,
  AuthResponse,
  AuthTokens,
  AuthUser,
} from '../lib/auth.types';

// Re-export the shared `LoginDto`/`AuthResponse` that the NestJS backend
// emits so feature code can import from a single source when needed.
export type { LoginDto } from '@strickin/shared';
export type { AuthResponse as SharedAuthResponse } from '@strickin/shared';
