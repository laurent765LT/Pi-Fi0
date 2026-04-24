// ─── Auth feature — internal types ───────────────────────────────────────────
// Types private to the auth feature. Wire-level shapes live in
// `api/auth.api.types.ts` and re-export from `@strickin/shared` where they
// already exist there.

import type { User } from '@/lib/api/types';
import type { UserRole } from '@strickin/shared';

/**
 * The authenticated user shape surfaced by the feature hooks.
 *
 * This is intentionally a re-export alias of the API's `User` shape so that
 * the rest of the app can consume `AuthUser` from this feature without
 * reaching into `@/lib/api/types`. If the auth user ever diverges from the
 * generic `User` (e.g. includes session-only fields), update this type.
 */
export type AuthUser = User;

/**
 * Tokens issued by the backend on login/refresh.
 */
export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

/**
 * Credentials accepted by `POST /auth/login`.
 */
export interface LoginCredentials {
  email: string;
  password: string;
}

/**
 * Payload accepted by `POST /auth/register`.
 *
 * `role` defaults to `VIEWER` server-side when absent; the shared
 * `UserRole` enum is reused to keep the CGP/ASSUREUR/ADMIN literals
 * in sync with the backend.
 */
export interface RegisterInput {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role?: UserRole | 'CGP' | 'ASSUREUR' | 'ADMIN';
  orgId?: string;
  company?: string;
}

/**
 * Response envelope returned by both `/auth/login` and `/auth/register`.
 */
export interface AuthResponse extends AuthTokens {
  user: AuthUser;
  /** Optional — present on the T1.3 hook path but absent on demo-mode flows. */
  expiresIn?: string;
  refreshExpiresIn?: string;
}
