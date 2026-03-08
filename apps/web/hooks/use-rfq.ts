'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';

// ── Create RFQ (mutation) ───────────────────────────────────────────────────

export function useCreateRfq() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => api.createRfq(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['rfq', 'list'] });
    },
  });
}

// ── Send RFQ (mutation — triggers quote generation) ─────────────────────────

export function useSendRfq() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (rfqId: string) => api.sendRfq(rfqId),
    onSuccess: (_data, rfqId) => {
      qc.invalidateQueries({ queryKey: ['rfq', rfqId] });
      qc.invalidateQueries({ queryKey: ['rfq', 'list'] });
    },
  });
}

// ── Get RFQ with Quotes ─────────────────────────────────────────────────────

export function useRfq(rfqId: string) {
  return useQuery({
    queryKey: ['rfq', rfqId],
    queryFn: () => api.getRfq(rfqId),
    enabled: Boolean(rfqId),
    refetchInterval: (query) => {
      // Auto-refetch while quotes are being generated
      const status = query.state.data?.status;
      if (status === 'RFQ_SENT' || status === 'PARTIALLY_QUOTED') return 3000;
      return false;
    },
  });
}

// ── List RFQs ───────────────────────────────────────────────────────────────

export function useRfqList(opts?: { limit?: number; offset?: number; status?: string }) {
  return useQuery({
    queryKey: ['rfq', 'list', opts],
    queryFn: () => api.listRfqs(opts),
    staleTime: 30_000,
  });
}

// ── Select a Quote ──────────────────────────────────────────────────────────

export function useSelectQuote() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (params: { rfqId: string; quoteId: string }) =>
      api.selectRfqQuote(params.rfqId, params.quoteId),
    onSuccess: (_data, params) => {
      qc.invalidateQueries({ queryKey: ['rfq', params.rfqId] });
      qc.invalidateQueries({ queryKey: ['rfq', 'list'] });
    },
  });
}

// ── Issuer Profiles ─────────────────────────────────────────────────────────

export function useIssuers() {
  return useQuery({
    queryKey: ['rfq', 'issuers'],
    queryFn: () => api.getRfqIssuers(),
    staleTime: 600_000, // 10 min
  });
}
