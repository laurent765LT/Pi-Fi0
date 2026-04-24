'use client';

import {
  useMutation,
  useQuery,
  useQueryClient,
  type UseMutationResult,
  type UseQueryResult,
} from '@tanstack/react-query';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

/**
 * ─────────────────────────────────────────────────────────────────────────
 *  useAuth — production auth hook for Strick'in Sprint 1 / T1.3.
 * ─────────────────────────────────────────────────────────────────────────
 *
 *  Design:
 *    - The access token lives ONLY in React state (never in localStorage).
 *    - The refresh token lives in an HttpOnly cookie (`strickin_refresh`)
 *      set by the API and scoped to `/api/v1/auth`.
 *    - The access token is ALSO mirrored to an HttpOnly cookie
 *      (`strickin_access`) so that `middleware.ts` can make routing
 *      decisions without hitting the API — the cookie itself is the source
 *      of truth the middleware consults.
 *    - A silent refresh runs 1 minute before the access token's expiry.
 *    - `GET /auth/me` hydrates the hook on mount. On a 401, we clear
 *      in-memory state and let `middleware.ts` redirect to `/login`.
 *
 *  Migration note (T1.4 Wave A will supersede this):
 *    This hook coexists with the legacy `useAuthStore` Zustand store. Pages
 *    should migrate endpoint by endpoint.
 */

const API_BASE =
  process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000/api/v1';

const REFRESH_LEAD_MS = 60 * 1000; // Refresh 60s before expiry.

// ─── Types ──────────────────────────────────────────────────────────────────

export interface AuthUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  orgId: string;
}

export interface AuthSession {
  accessToken: string;
  refreshToken: string;
  expiresIn: string;
  refreshExpiresIn: string;
  user: AuthUser;
}

export interface RegisterInput {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role?: 'CGP' | 'ASSUREUR' | 'ADMIN';
}

export interface LoginInput {
  email: string;
  password: string;
}

// ─── HTTP helpers ───────────────────────────────────────────────────────────

async function requestJson<TBody, TOut>(
  path: string,
  init: {
    method?: 'GET' | 'POST' | 'PATCH' | 'DELETE';
    body?: TBody;
    accessToken?: string | null;
  } = {},
): Promise<TOut> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (init.accessToken) {
    headers['Authorization'] = `Bearer ${init.accessToken}`;
  }

  const response = await fetch(`${API_BASE}${path}`, {
    method: init.method ?? 'GET',
    credentials: 'include', // send/accept httpOnly auth cookies
    headers,
    body: init.body !== undefined ? JSON.stringify(init.body) : undefined,
  });

  if (response.status === 204) {
    return undefined as unknown as TOut;
  }

  let payload: unknown = null;
  const ct = response.headers.get('content-type') ?? '';
  if (ct.includes('application/json')) {
    payload = await response.json().catch(() => null);
  }

  if (!response.ok) {
    const message =
      (payload as { message?: string } | null)?.message ??
      `Request failed with status ${response.status}`;
    throw Object.assign(new Error(message), {
      status: response.status,
      payload,
    });
  }

  return payload as TOut;
}

/**
 * Parse an ExpiresIn string like `15m` / `900` into a number of milliseconds.
 */
function expiresInToMs(raw: string): number {
  const match = /^(\d+)([smhdw])$/.exec(raw);
  if (!match) {
    const n = Number.parseInt(raw, 10);
    return Number.isFinite(n) ? n * 1000 : 15 * 60_000;
  }
  const value = Number.parseInt(match[1] ?? '0', 10);
  const unit = match[2] ?? 'm';
  const multipliers: Record<string, number> = {
    s: 1_000,
    m: 60_000,
    h: 3_600_000,
    d: 86_400_000,
    w: 604_800_000,
  };
  return value * (multipliers[unit] ?? 60_000);
}

// ─── Hook ───────────────────────────────────────────────────────────────────

interface UseAuthReturn {
  /** Current access token held in memory, `null` when signed out. */
  accessToken: string | null;

  /** Current user loaded via `GET /auth/me`. `null` while unauthenticated. */
  user: AuthUser | null;

  /** True while the initial `/auth/me` call is in flight. */
  isLoading: boolean;

  /** Derived — user and access token both present. */
  isAuthenticated: boolean;

  /** Any error from `/auth/me` (fetch failure, 401, etc.). */
  error: Error | null;

  /** Log in via credentials. Throws on failure. */
  login: (input: LoginInput) => Promise<AuthSession>;

  /** Create an account via credentials. Throws on failure. */
  register: (input: RegisterInput) => Promise<AuthSession>;

  /** Revoke current session (HTTP + clear local state). */
  logout: () => Promise<void>;

  /** Force-refresh the access token now. */
  refresh: () => Promise<AuthSession>;

  /** Underlying TanStack Query for `/auth/me`. */
  meQuery: UseQueryResult<AuthUser>;

  /** Underlying TanStack mutation for `login`. */
  loginMutation: UseMutationResult<AuthSession, Error, LoginInput>;

  /** Underlying TanStack mutation for `register`. */
  registerMutation: UseMutationResult<AuthSession, Error, RegisterInput>;
}

export function useAuth(): UseAuthReturn {
  const queryClient = useQueryClient();
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const refreshTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Silent refresh scheduler. Runs 1 minute before access expiry.
  const scheduleRefresh = useCallback((expiresIn: string) => {
    if (typeof window === 'undefined') return;
    if (refreshTimer.current) {
      clearTimeout(refreshTimer.current);
      refreshTimer.current = null;
    }
    const ms = Math.max(5_000, expiresInToMs(expiresIn) - REFRESH_LEAD_MS);
    refreshTimer.current = setTimeout(() => {
      void refreshOnce().catch(() => {
        /* Swallow — `/auth/me` will force a re-login on next reload. */
      });
    }, ms);
  }, []);

  // Raw refresh implementation used both by the scheduler and by consumers.
  const refreshOnce = useCallback(async (): Promise<AuthSession> => {
    const session = await requestJson<undefined, AuthSession>('/auth/refresh', {
      method: 'POST',
      body: undefined,
    });
    setAccessToken(session.accessToken);
    scheduleRefresh(session.expiresIn);
    queryClient.setQueryData(['auth', 'me'], session.user);
    return session;
  }, [queryClient, scheduleRefresh]);

  // `GET /auth/me` — primary source of truth for `user`.
  const meQuery = useQuery<AuthUser>({
    queryKey: ['auth', 'me'],
    queryFn: async () => {
      const user = await requestJson<undefined, AuthUser>('/auth/me', {
        accessToken: accessToken ?? undefined,
      });
      return user;
    },
    retry: (failureCount, err) => {
      const status = (err as { status?: number } | null)?.status;
      if (status === 401 || status === 403) return false;
      return failureCount < 2;
    },
    // Let react-query refetch on window focus — keeps role/org in sync if an
    // admin updates the user while they're signed in.
    refetchOnWindowFocus: true,
    staleTime: 60_000,
  });

  // On first mount (and when access token arrives), try a silent refresh so
  // the user has a fresh access token in memory.
  useEffect(() => {
    let cancelled = false;
    if (accessToken !== null) return;
    (async () => {
      try {
        const session = await refreshOnce();
        if (cancelled) return;
        queryClient.setQueryData(['auth', 'me'], session.user);
      } catch {
        // Not signed in — that's OK.
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [accessToken, queryClient, refreshOnce]);

  useEffect(() => {
    return () => {
      if (refreshTimer.current) clearTimeout(refreshTimer.current);
    };
  }, []);

  // ── Mutations ────────────────────────────────────────────────────────────

  const loginMutation = useMutation<AuthSession, Error, LoginInput>({
    mutationFn: async (input) =>
      requestJson<LoginInput, AuthSession>('/auth/login', {
        method: 'POST',
        body: input,
      }),
    onSuccess: (session) => {
      setAccessToken(session.accessToken);
      scheduleRefresh(session.expiresIn);
      queryClient.setQueryData(['auth', 'me'], session.user);
    },
  });

  const registerMutation = useMutation<AuthSession, Error, RegisterInput>({
    mutationFn: async (input) =>
      requestJson<RegisterInput, AuthSession>('/auth/register', {
        method: 'POST',
        body: input,
      }),
    onSuccess: (session) => {
      setAccessToken(session.accessToken);
      scheduleRefresh(session.expiresIn);
      queryClient.setQueryData(['auth', 'me'], session.user);
    },
  });

  const logout = useCallback(async () => {
    try {
      await requestJson<undefined, void>('/auth/logout', {
        method: 'POST',
        accessToken: accessToken ?? undefined,
      });
    } catch {
      // Even on HTTP failure, purge local state — worst case the refresh
      // token will expire naturally.
    }
    if (refreshTimer.current) {
      clearTimeout(refreshTimer.current);
      refreshTimer.current = null;
    }
    setAccessToken(null);
    queryClient.setQueryData(['auth', 'me'], null);
    queryClient.invalidateQueries({ queryKey: ['auth'] });
  }, [accessToken, queryClient]);

  const user = meQuery.data ?? null;

  const isAuthenticated = useMemo(
    () => Boolean(accessToken && user),
    [accessToken, user],
  );

  const login = useCallback(
    (input: LoginInput) => loginMutation.mutateAsync(input),
    [loginMutation],
  );
  const register = useCallback(
    (input: RegisterInput) => registerMutation.mutateAsync(input),
    [registerMutation],
  );

  return {
    accessToken,
    user,
    isLoading: meQuery.isLoading,
    isAuthenticated,
    error: (meQuery.error as Error | null) ?? null,
    login,
    register,
    logout,
    refresh: refreshOnce,
    meQuery,
    loginMutation,
    registerMutation,
  };
}
