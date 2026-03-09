'use client';

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
        // Try real API first
        try {
          const { accessToken, refreshToken, user } = await api.login(email, password);
          api.setToken(accessToken);
          set({ user, token: accessToken, refreshToken, isDemo: false });
          return;
        } catch {
          // API unreachable — fall through to demo mode
        }

        // Demo mode fallback
        const demoUser = DEMO_USERS[email.toLowerCase()];
        if (demoUser && demoUser.password === password) {
          const fakeToken = 'demo-token-' + Date.now();
          api.setToken(fakeToken);
          set({
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
          });
          return;
        }

        // Neither API nor demo worked
        throw new Error('Identifiants incorrects. Veuillez réessayer.');
      },

      logout: () => {
        api.setToken(null);
        set({ user: null, token: null, refreshToken: null, isDemo: false });
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
