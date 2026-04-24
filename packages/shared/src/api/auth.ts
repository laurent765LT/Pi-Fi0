/**
 * Authentication HTTP contracts.
 *
 * Paired with:
 * - apps/api/src/auth/dto/*.ts (server DTOs).
 * - apps/web/lib/api/*.ts      (client hooks).
 */

import type { UserPublic, UserRole } from '../domain/user';

/** Functional role accepted at registration (smaller surface than UserRole). */
export type RegistrableRole = 'CGP' | 'ASSUREUR' | 'ADMIN';

/** Request body for POST /auth/register. */
export interface RegisterDto {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role?: RegistrableRole;
}

/** Request body for POST /auth/login. */
export interface LoginDto {
  email: string;
  password: string;
}

/** Request body for POST /auth/refresh (refreshToken may come from HttpOnly cookie). */
export interface RefreshDto {
  refreshToken?: string;
}

/** Access + refresh JWT pair. */
export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

/** Full auth response including the logged-in user. */
export interface AuthResponseDto extends AuthTokens {
  user: UserPublic;
}

/** Minimal response used by POST /auth/refresh. */
export interface RefreshResponseDto extends AuthTokens {}

/**
 * Legacy auth response — kept for backwards compatibility with the v1 web
 * client that expected `user.orgType`.
 */
export interface LegacyAuthResponse {
  accessToken: string;
  refreshToken: string;
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    role: UserRole;
    orgId: string;
    orgType: 'INSURER' | 'BROKER' | 'ADMIN';
  };
}
