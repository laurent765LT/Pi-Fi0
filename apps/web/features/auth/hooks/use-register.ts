'use client';

// ─── useRegister() — granular register mutation ──────────────────────────────
// Wraps `POST /auth/register` as a TanStack mutation. Validates the password
// via `checkPassword` before hitting the network to avoid round-trips on
// trivially-bad inputs.

import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { UseMutationResult } from '@tanstack/react-query';
import { authApi } from '../api';
import { AuthError, AuthErrorCode } from '../lib/auth.errors';
import { checkPassword } from '../lib/password-rules';
import type { RegisterInput, AuthResponse } from '../lib/auth.types';

export function useRegister(): UseMutationResult<
  AuthResponse,
  AuthError,
  RegisterInput
> {
  const qc = useQueryClient();

  return useMutation<AuthResponse, AuthError, RegisterInput>({
    mutationFn: async (input) => {
      const pw = checkPassword(input.password);
      if (!pw.valid) {
        throw new AuthError(
          AuthErrorCode.WEAK_PASSWORD,
          pw.violations[0] ?? 'Mot de passe trop faible.',
        );
      }

      try {
        return await authApi.register(input);
      } catch (err) {
        const status = (err as { status?: number } | null)?.status;
        const code = (err as { code?: string } | null)?.code;
        if (status === 409 || code === 'EMAIL_ALREADY_EXISTS') {
          throw new AuthError(
            AuthErrorCode.EMAIL_ALREADY_EXISTS,
            'Cet email est déjà utilisé.',
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
