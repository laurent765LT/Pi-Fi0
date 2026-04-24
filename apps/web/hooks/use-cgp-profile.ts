'use client';

// ─── useCGPProfile / useUpdateCGPProfile ─────────────────────────────────────
// TanStack Query hooks for the CGP professional profile (orias, RCP, etc.).
//
// The demo fallback reads from localStorage under the key below, which is
// where the onboarding flow already persists its draft.

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { cgpsApi } from '@/lib/api/resources/cgps';
import { useRealApi } from '@/lib/api/client';
import type { CGP, CGPUpdate } from '@/lib/api/types';
import { useAuthStore } from '@/stores/auth-store';

export const cgpProfileKeys = {
  me: ['cgp', 'me'] as const,
};

const DEMO_CGP_KEY = 'strickin-cgp-profile';

function readDemoCgp(): CGP | null {
  if (typeof window === 'undefined') return null;
  const user = useAuthStore.getState().user as { id?: string } | null;
  if (!user?.id) return null;
  try {
    const raw = localStorage.getItem(DEMO_CGP_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<CGP>;
      return {
        id: parsed.id ?? `cgp-${user.id}`,
        userId: user.id,
        companyName: parsed.companyName ?? '',
        siren: parsed.siren ?? '',
        oriasNumber: parsed.oriasNumber ?? '',
        rcpInsurer: parsed.rcpInsurer ?? '',
        rcpAmount: parsed.rcpAmount ?? 0,
        status: parsed.status ?? 'PENDING',
      };
    }
  } catch {
    // ignore
  }
  return {
    id: `cgp-${user.id}`,
    userId: user.id,
    companyName: '',
    siren: '',
    oriasNumber: '',
    rcpInsurer: '',
    rcpAmount: 0,
    status: 'PENDING',
  };
}

function writeDemoCgp(cgp: CGP): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(DEMO_CGP_KEY, JSON.stringify(cgp));
  } catch {
    // ignore quota errors
  }
}

export function useCGPProfile() {
  const realApi = useRealApi();
  return useQuery<CGP | null>({
    queryKey: cgpProfileKeys.me,
    queryFn: async () => {
      if (realApi) return cgpsApi.me();
      return readDemoCgp();
    },
    staleTime: 60_000,
  });
}

export function useUpdateCGPProfile() {
  const realApi = useRealApi();
  const qc = useQueryClient();
  return useMutation<CGP, Error, CGPUpdate>({
    mutationFn: async (patch) => {
      if (realApi) return cgpsApi.updateMe(patch);
      const current = readDemoCgp();
      if (!current) throw new Error('Aucun profil CGP disponible en mode démo.');
      const updated: CGP = { ...current, ...patch };
      writeDemoCgp(updated);
      return updated;
    },
    onSuccess: (data) => {
      qc.setQueryData(cgpProfileKeys.me, data);
    },
  });
}
