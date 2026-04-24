'use client';

// ─── useAuth() — legacy-compat hook ──────────────────────────────────────────
// Drop-in replacement for `useAuthStore(selector)` accessors used throughout
// the 50-page app. Moved here from `apps/web/hooks/use-auth.ts` as part of
// the feature-based refactor — the old import path is still honoured via
// the shim at `apps/web/hooks/use-auth.ts`.
//
// NOTE: a parallel `hooks/useAuth.ts` (camelCase, written in T1.3) implements
// the production in-memory-token hook that talks directly to the NestJS
// `/auth/*` endpoints. That hook has its own interface and does not handle
// demo mode; we keep it separate so that:
//   - When `NEXT_PUBLIC_USE_REAL_API=true`, this shim calls the backend
//     directly and seeds the Zustand store for middleware cookie compat.
//   - When `NEXT_PUBLIC_USE_REAL_API=false`, the Zustand-backed demo flow
//     remains the source of truth.
//
// Consumers should import from `@/features/auth` (this file via the barrel).
// The T1.3 hook can still be consumed directly from `@/hooks/useAuth` by
// components that explicitly want the production flow.
//
// The Zustand store is marked `@deprecated` in `store/auth.store.ts` and
// kept alive for:
//   - Sprint 1 demo mode.
//   - `useAuthStore.setState(...)` style static writes (register page).
//   - Middleware cookie shape (`strickin-auth`) compatibility.

import { useMemo, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useAuthStore, selectIsAuthenticated } from '../store/auth.store';
import { apiClient, useRealApi } from '@/lib/api/client';
import { usersApi } from '@/lib/api/resources/users';
import type { User } from '@/lib/api/types';
import { userProfileKeys } from '@/hooks/use-user-profile';

export interface UseAuthResult {
  user: User | null;
  token: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isDemo: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: {
    email: string;
    firstName: string;
    lastName: string;
    role: string;
    orgId: string;
    company?: string;
  }) => Promise<void>;
  logout: () => void;
}

/**
 * Auth state + actions, drop-in compatible with the Zustand-based API.
 *
 * Components that previously used `useAuthStore((s) => s.user)` can switch to
 * `const { user } = useAuth()` without any structural changes.
 */
export function useAuth(): UseAuthResult {
  const realApi = useRealApi();
  const qc = useQueryClient();

  const user = useAuthStore((s) => s.user) as User | null;
  const token = useAuthStore((s) => s.token);
  const refreshToken = useAuthStore((s) => s.refreshToken);
  const isAuthenticated = useAuthStore(selectIsAuthenticated);
  const isDemo = useAuthStore((s) => s.isDemo);

  const zustandLogin = useAuthStore((s) => s.login);
  const zustandRegister = useAuthStore((s) => s.register);
  const zustandLogout = useAuthStore((s) => s.logout);

  const login = useCallback(
    async (email: string, password: string) => {
      if (!realApi) {
        await zustandLogin(email, password);
        return;
      }
      // Real API path: POST /auth/login, then seed the token + cached user.
      const { accessToken, refreshToken: rt, user: me } = await apiClient.post<{
        accessToken: string;
        refreshToken: string;
        user: User;
      }>('/auth/login', { email, password });
      apiClient.setToken(accessToken, rt);
      useAuthStore.setState({
        // The Zustand User interface uses `[key: string]: unknown` so we cast
        // our strict API User into a compatible record.
        user: { ...me } as unknown as { id: string; email: string },
        token: accessToken,
        refreshToken: rt,
        isDemo: false,
      });
      qc.setQueryData(userProfileKeys.me, me);
    },
    [realApi, zustandLogin, qc],
  );

  const register = useCallback(
    async (data: Parameters<UseAuthResult['register']>[0]) => {
      if (!realApi) {
        await zustandRegister(data);
        return;
      }
      const { accessToken, refreshToken: rt, user: me } = await apiClient.post<{
        accessToken: string;
        refreshToken: string;
        user: User;
      }>('/auth/register', data);
      apiClient.setToken(accessToken, rt);
      useAuthStore.setState({
        user: { ...me } as unknown as { id: string; email: string },
        token: accessToken,
        refreshToken: rt,
        isDemo: false,
      });
      qc.setQueryData(userProfileKeys.me, me);
    },
    [realApi, zustandRegister, qc],
  );

  const logout = useCallback(() => {
    if (realApi) {
      // Best-effort logout. We don't await it so the UI clears immediately.
      void apiClient.post('/auth/logout', undefined).catch(() => {});
      apiClient.clearTokens();
    }
    zustandLogout();
    qc.removeQueries({ queryKey: userProfileKeys.me });
  }, [realApi, zustandLogout, qc]);

  return useMemo(
    () => ({
      user,
      token,
      refreshToken,
      isAuthenticated,
      isDemo,
      login,
      register,
      logout,
    }),
    [user, token, refreshToken, isAuthenticated, isDemo, login, register, logout],
  );
}

/**
 * Prefetches the current user profile from `GET /users/me` in real-API mode.
 * Noop in demo mode.
 */
export async function prefetchCurrentUser(
  qc: ReturnType<typeof useQueryClient>,
): Promise<void> {
  if (process.env.NEXT_PUBLIC_USE_REAL_API !== 'true') return;
  await qc.prefetchQuery({
    queryKey: userProfileKeys.me,
    queryFn: usersApi.me,
  });
}

/**
 * Convenience alias — many new components expect a `useUser()` hook.
 * Returns the same user reference `useAuth()` exposes.
 */
export function useUser(): User | null {
  return useAuthStore((s) => s.user) as User | null;
}
