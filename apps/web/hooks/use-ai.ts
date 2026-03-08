'use client';

import { useQuery, useMutation } from '@tanstack/react-query';
import { api } from '@/lib/api';

// ── AI Status ──────────────────────────────────────────────────────────────

export function useAiStatus() {
  return useQuery({
    queryKey: ['ai', 'status'],
    queryFn: () => api.getAiStatus(),
    staleTime: 300_000, // 5 min
  });
}

// ── AI Chat (mutation — user-triggered) ────────────────────────────────────

export function useAiChat() {
  return useMutation({
    mutationFn: (params: {
      message: string;
      context?: { productNames?: string[]; productTypes?: string[] };
    }) => api.aiChat(params.message, params.context),
  });
}

// ── Underlying Analysis ────────────────────────────────────────────────────

export function useUnderlyingAnalysis(ticker: string, name?: string) {
  return useQuery({
    queryKey: ['ai', 'analyze', ticker],
    queryFn: () => api.analyzeUnderlying(ticker, name),
    enabled: Boolean(ticker),
    staleTime: 4 * 3600_000, // 4h (matches server cache)
  });
}

// ── Market Sentiment ───────────────────────────────────────────────────────

export function useMarketSentiment(topic?: string) {
  return useQuery({
    queryKey: ['ai', 'sentiment', topic ?? 'general'],
    queryFn: () => api.getMarketSentiment(topic),
    staleTime: 2 * 3600_000, // 2h
  });
}

// ── Product Risk Assessment (mutation — user-triggered) ────────────────────

export function useRiskAssessment() {
  return useMutation({
    mutationFn: (product: {
      name: string;
      payoffType: string;
      underlyingName: string;
      underlyingTicker: string;
      barrierPct: number | null;
      couponPct: number | null;
      maturityDate: string;
      sri: number;
    }) => api.assessProductRisk(product),
  });
}
