'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { api } from '@/lib/api';

interface User {
  id: string;
  email: string;
  [key: string]: unknown;
}

interface AuthState {
  user: User | null;
  token: string | null;
  refreshToken: string | null;

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

      login: async (email: string, password: string) => {
        const { accessToken, refreshToken, user } = await api.login(email, password);

        api.setToken(accessToken);

        set({
          user,
          token: accessToken,
          refreshToken,
        });
      },

      logout: () => {
        api.setToken(null);

        set({
          user: null,
          token: null,
          refreshToken: null,
        });
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
      }),
    },
  ),
);
