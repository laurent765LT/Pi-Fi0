'use client';

// @deprecated Use `useAuth()` from `@/hooks/use-auth` instead.
// This Zustand store is kept for:
//   - demo-mode authentication (offline/no backend)
//   - the NestJS auth API migration bridge (Sprint 1, T1.4)
// Direct consumption of `useAuthStore` from new components is discouraged —
// prefer `useAuth()` which encapsulates the feature flag + TanStack Query
// cache wiring. Scheduled for removal once Sprint 2 completes.

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { api } from '@/lib/api';
import { DEMO_USERS } from '@/lib/demo-data';

interface User {
  id: string;
  email: string;
  [key: string]: unknown;
}

interface AuthState {
  user: User | null;
  token: string | null;
  refreshToken: string | null;
  isDemo: boolean;

  login: (email: string, password: string) => Promise<void>;
  register: (userData: { email: string; firstName: string; lastName: string; role: string; orgId: string; company?: string }) => Promise<void>;
  logout: () => void;
  hydrate: () => void;
}

/** Selector — derive `isAuthenticated` from token + user without a JS getter. */
export const selectIsAuthenticated = (s: AuthState) =>
  s.token !== null && s.user !== null;


export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      refreshToken: null,
      isDemo: false,

      login: async (email: string, password: string) => {
        // Check registered users from localStorage FIRST
        try {
          const registered = JSON.parse(localStorage.getItem('strickin-registered-users') ?? '[]');
          const regUser = registered.find((u: any) => u.email === email);
          if (regUser) {
            const token = 'demo-token-registered-' + Date.now();
            api.setToken(token);
            const { password: _pw, ...userWithoutPassword } = regUser;
            const userData = {
              user: userWithoutPassword,
              token,
              refreshToken: 'demo-refresh',
              isDemo: true,
            };
            set(userData);
            document.cookie = `strickin-auth=${encodeURIComponent(JSON.stringify({ state: userData }))};path=/;max-age=${60 * 60 * 24 * 7};SameSite=Lax`;
            return;
          }
        } catch {}

        // Check demo credentials (instant, no network)
        const demoUser = DEMO_USERS[email.toLowerCase()];
        if (demoUser && demoUser.password === password) {
          const fakeToken = 'demo-token-' + Date.now();
          api.setToken(fakeToken);
          const userData = {
            user: {
              id: demoUser.id,
              email: demoUser.email,
              firstName: demoUser.firstName,
              lastName: demoUser.lastName,
              role: demoUser.role,
              orgId: demoUser.orgId,
            },
            token: fakeToken,
            refreshToken: 'demo-refresh',
            isDemo: true,
          };
          set(userData);
          // Set cookie so middleware can read auth state (localStorage is not available in middleware)
          document.cookie = `strickin-auth=${encodeURIComponent(JSON.stringify({ state: userData }))};path=/;max-age=${60 * 60 * 24 * 7};SameSite=Lax`;
          return;
        }

        // Not a demo account — try real API
        try {
          const { accessToken, refreshToken, user } = await api.login(email, password);
          api.setToken(accessToken);
          const realData = { user, token: accessToken, refreshToken, isDemo: false };
          set(realData);
          document.cookie = `strickin-auth=${encodeURIComponent(JSON.stringify({ state: realData }))};path=/;max-age=${60 * 60 * 24 * 7};SameSite=Lax`;
          return;
        } catch {
          // API unreachable
        }

        throw new Error('Identifiants incorrects. Veuillez réessayer.');
      },

      register: async (userData: { email: string; firstName: string; lastName: string; role: string; orgId: string; company?: string }) => {
        const id = 'user-' + Date.now();
        const token = 'demo-token-registered-' + Date.now();
        const user: User = { id, ...userData };

        // Store in registered users list
        try {
          const existing = JSON.parse(localStorage.getItem('strickin-registered-users') ?? '[]');
          existing.push({ ...user, password: 'registered' });
          localStorage.setItem('strickin-registered-users', JSON.stringify(existing));
        } catch {}

        set({ user, token, refreshToken: 'demo-refresh', isDemo: true });
        api.setToken(token);

        // Set auth cookie
        const cookieVal = JSON.stringify({ state: { user, token, refreshToken: 'demo-refresh', isDemo: true } });
        document.cookie = `strickin-auth=${encodeURIComponent(cookieVal)};path=/;max-age=${60 * 60 * 24 * 7};SameSite=Lax`;
      },

      logout: () => {
        api.setToken(null);
        set({ user: null, token: null, refreshToken: null, isDemo: false });
        // Clear auth cookie
        document.cookie = 'strickin-auth=;path=/;max-age=0';
      },

      hydrate: () => {
        const { token } = get();
        if (token) {
          api.setToken(token);
        }
      },
    }),
    {
      name: 'strickin-auth',
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        refreshToken: state.refreshToken,
        isDemo: state.isDemo,
      }),
    },
  ),
);
