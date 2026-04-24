'use client';

// ─── useInsurers / useInsurer ────────────────────────────────────────────────
// TanStack Query hooks for the insurance-company (compagnie d'assurance)
// directory. Demo fallback seeds the list from the insurers referenced by the
// demo product catalog so the `/admin/*` and recommendation screens stay
// populated offline.

import { useQuery } from '@tanstack/react-query';
import { insurersApi } from '@/lib/api/resources/insurers';
import { useRealApi } from '@/lib/api/client';
import type { Insurer } from '@/lib/api/types';

export const insurerKeys = {
  all: ['insurers'] as const,
  detail: (id: string) => ['insurers', id] as const,
};

const DEMO_INSURERS: Insurer[] = [
  { id: 'ins-generali', name: 'Generali Vie', logo: null, status: 'ACTIVE' },
  { id: 'ins-cardiff', name: 'Cardiff Vie', logo: null, status: 'ACTIVE' },
  { id: 'ins-spirica', name: 'Spirica', logo: null, status: 'ACTIVE' },
  { id: 'ins-apicil', name: 'Apicil', logo: null, status: 'ACTIVE' },
  { id: 'ins-suravenir', name: 'Suravenir', logo: null, status: 'ACTIVE' },
];

export function useInsurers() {
  const realApi = useRealApi();
  return useQuery<Insurer[]>({
    queryKey: insurerKeys.all,
    queryFn: async () => {
      if (realApi) return insurersApi.list();
      return DEMO_INSURERS;
    },
    staleTime: 5 * 60_000,
  });
}

export function useInsurer(id: string) {
  const realApi = useRealApi();
  return useQuery<Insurer | null>({
    queryKey: insurerKeys.detail(id),
    queryFn: async () => {
      if (realApi) return insurersApi.get(id);
      return DEMO_INSURERS.find((i) => i.id === id) ?? null;
    },
    enabled: Boolean(id),
    staleTime: 5 * 60_000,
  });
}
