'use client';

// ─── useLogout() — granular logout mutation ──────────────────────────────────
// Wraps `POST /auth/logout` as a TanStack mutation. Best-effort — even on
// HTTP failure the local cache is cleared so the UI doesn't hang on a
// half-revoked session.

import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { UseMutationResult } from '@tanstack/react-query';
import { authApi } from '../api';
import { apiClient } from '@/lib/api/client';
import { AuthError } from '../lib/auth.errors';

export function useLogout(): UseMutationResult<void, AuthError, void> {
  const qc = useQueryClient();

  return useMutation<void, AuthError, void>({
    mutationFn: async () => {
      try {
        await authApi.logout();
      } catch (err) {
        // Swallow and continue: the refresh token cookie will expire
        // server-side eventually. We still want to clear client state.
        // We throw on unexpected errors so callers can decide to toast.
        if (err instanceof Error) {
          // NOTE: resisting the temptation to silence here — surfacing the
          // error lets the toast show "session terminée localement, mais…".
        }
      } finally {
        apiClient.clearTokens();
        qc.setQueryData(['auth', 'me'], null);
        qc.removeQueries({ queryKey: ['auth', 'me'] });
      }
    },
  });
}
