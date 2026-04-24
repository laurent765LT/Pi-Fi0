'use client';

// ─── useUserProfile / useUpdateUserProfile ───────────────────────────────────
// TanStack Query hooks replacing the (never-implemented) `useUserProfileStore`.
//
// Behaviour:
// - When `NEXT_PUBLIC_USE_REAL_API=true` → calls `GET/PATCH /users/me`.
// - Otherwise falls back to the logged-in user stored by `useAuthStore` so the
//   50 existing pages keep working in demo mode without a backend.
//
// The shape returned by the query is always `User | null`.

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { usersApi } from '@/lib/api/resources/users';
import { useRealApi } from '@/lib/api/client';
import type { User, UserUpdate } from '@/lib/api/types';
import { useAuthStore } from '@/stores/auth-store';

export const userProfileKeys = {
  me: ['user', 'me'] as const,
};

function demoUser(): User | null {
  const u = useAuthStore.getState().user as Partial<User> | null;
  if (!u || !u.id || !u.email) return null;
  return {
    id: u.id,
    email: u.email,
    firstName: u.firstName ?? '',
    lastName: u.lastName ?? '',
    role: (u.role as string) ?? 'VIEWER',
    orgId: u.orgId as string | undefined,
    phone: (u.phone as string | null | undefined) ?? null,
    avatarUrl: (u.avatarUrl as string | null | undefined) ?? null,
    locale: (u.locale as string | undefined) ?? undefined,
  };
}

export function useUserProfile() {
  const realApi = useRealApi();
  return useQuery<User | null>({
    queryKey: userProfileKeys.me,
    queryFn: async () => {
      if (realApi) return usersApi.me();
      return demoUser();
    },
    staleTime: 60_000,
  });
}

export function useUpdateUserProfile() {
  const realApi = useRealApi();
  const qc = useQueryClient();
  return useMutation<User, Error, Partial<UserUpdate>>({
    mutationFn: async (patch) => {
      if (realApi) return usersApi.updateMe(patch);
      // Demo: merge into auth store user and return synthesized User.
      const current = demoUser();
      if (!current) throw new Error('Aucun utilisateur connecté en mode démo.');
      const updated: User = { ...current, ...patch };
      // Also mirror the update into the Zustand store so subsequent reads match.
      const authUser = useAuthStore.getState().user;
      if (authUser) {
        useAuthStore.setState({ user: { ...authUser, ...patch } });
      }
      return updated;
    },
    onSuccess: (data) => {
      qc.setQueryData(userProfileKeys.me, data);
    },
  });
}
