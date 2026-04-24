'use client';

// ─── useLogin() — granular login mutation ────────────────────────────────────
// Wraps `POST /auth/login` as a TanStack mutation. Components that only need
// the mutation surface (form with onSubmit + onError + loading state) should
// prefer this over `useAuth().login` which also manages demo-mode state.

import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { UseMutationResult } from '@tanstack/react-query';
import { authApi } from '../api';
import { AuthError, AuthErrorCode } from '../lib/auth.errors';
import type { LoginCredentials, AuthResponse } from '../lib/auth.types';

export function useLogin(): UseMutationResult<
  AuthResponse,
  AuthError,
  LoginCredentials
> {
  const qc = useQueryClient();

  return useMutation<AuthResponse, AuthError, LoginCredentials>({
    mutationFn: async (credentials) => {
      try {
        return await authApi.login(credentials);
      } catch (err) {
        // Heuristic: coerce the `ApiError` surface into an `AuthError`. The
        // wire-level error type from `@/lib/api/client` exposes `status` +
        // `code` which we map onto the feature's code taxonomy.
        const status = (err as { status?: number } | null)?.status;
        if (status === 401 || status === 400) {
          throw new AuthError(
            AuthErrorCode.INVALID_CREDENTIALS,
            'Identifiants incorrects.',
            err,
          );
        }
        if (status === 429) {
          throw new AuthError(
            AuthErrorCode.RATE_LIMITED,
            'Trop de tentatives. Réessayez plus tard.',
            err,
          );
        }
        if (!status) {
          throw new AuthError(
            AuthErrorCode.NETWORK_ERROR,
            'Impossible de contacter le serveur.',
            err,
          );
        }
        throw AuthError.from(err);
      }
    },
    onSuccess: (data) => {
      qc.setQueryData(['auth', 'me'], data.user);
    },
  });
}
