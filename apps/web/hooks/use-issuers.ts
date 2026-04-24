'use client';

// ─── useIssuers / useIssuer ──────────────────────────────────────────────────
// TanStack Query hooks for the issuer (émetteur) directory.
// Demo fallback mirrors the issuer names used by the demo product catalog.

import { useQuery } from '@tanstack/react-query';
import { issuersApi } from '@/lib/api/resources/issuers';
import { useRealApi } from '@/lib/api/client';
import type { Issuer } from '@/lib/api/types';

export const issuerKeys = {
  all: ['issuers'] as const,
  detail: (id: string) => ['issuers', id] as const,
};

const DEMO_ISSUERS: Issuer[] = [
  { id: 'iss-bnp', name: 'BNP Paribas Issuance B.V.', logo: null, status: 'ACTIVE' },
  { id: 'iss-sg', name: 'SG Issuer', logo: null, status: 'ACTIVE' },
  { id: 'iss-natixis', name: 'Natixis Structured Issuance', logo: null, status: 'ACTIVE' },
  { id: 'iss-gs', name: 'Goldman Sachs International', logo: null, status: 'ACTIVE' },
  { id: 'iss-gs-fin', name: 'Goldman Sachs Finance Corp International Ltd', logo: null, status: 'ACTIVE' },
  { id: 'iss-barclays', name: 'Barclays Capital', logo: null, status: 'ACTIVE' },
  { id: 'iss-marex', name: 'Marex Financial Products', logo: null, status: 'ACTIVE' },
  { id: 'iss-julius', name: 'Julius Baer', logo: null, status: 'ACTIVE' },
];

export function useIssuers() {
  const realApi = useRealApi();
  return useQuery<Issuer[]>({
    queryKey: issuerKeys.all,
    queryFn: async () => {
      if (realApi) return issuersApi.list();
      return DEMO_ISSUERS;
    },
    staleTime: 5 * 60_000,
  });
}

export function useIssuer(id: string) {
  const realApi = useRealApi();
  return useQuery<Issuer | null>({
    queryKey: issuerKeys.detail(id),
    queryFn: async () => {
      if (realApi) return issuersApi.get(id);
      return DEMO_ISSUERS.find((i) => i.id === id) ?? null;
    },
    enabled: Boolean(id),
    staleTime: 5 * 60_000,
  });
}
