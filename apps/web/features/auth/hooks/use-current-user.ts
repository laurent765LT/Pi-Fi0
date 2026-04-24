'use client';

// ─── useCurrentUser() — GET /auth/me query ──────────────────────────────────
// Cached via TanStack under the `['auth', 'me']` key so it is shared with the
// `useLogin` / `useRegister` / `useLogout` mutations — they all write the
// same cache entry.

import { useQuery } from '@tanstack/react-query';
import type { UseQueryResult } from '@tanstack/react-query';
import { authApi } from '../api';
import type { AuthUser } from '../lib/auth.types';

export const currentUserKey = ['auth', 'me'] as const;

export function useCurrentUser(options?: {
  /** Skip the fetch and return `undefined`. Useful on public pages. */
  enabled?: boolean;
}): UseQueryResult<AuthUser | null> {
  return useQuery<AuthUser | null>({
    queryKey: currentUserKey,
    queryFn: async () => {
      try {
        return await authApi.me();
      } catch (err) {
        const status = (err as { status?: number } | null)?.status;
        if (status === 401 || status === 403) return null;
        throw err;
      }
    },
    enabled: options?.enabled ?? true,
    retry: (failureCount, err) => {
      const status = (err as { status?: number } | null)?.status;
      if (status === 401 || status === 403) return false;
      return failureCount < 2;
    },
    staleTime: 60_000,
    refetchOnWindowFocus: true,
  });
}
