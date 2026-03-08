'use client';

import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';

// ── Quote (Yahoo + Alpha Vantage fallback) ─────────────────────────────────

export function useMarketQuote(symbol: string) {
  return useQuery({
    queryKey: ['market', 'quote', symbol],
    queryFn: () => api.getQuote(symbol),
    enabled: Boolean(symbol),
    refetchInterval: 30_000,
  });
}

// ── Euribor ────────────────────────────────────────────────────────────────

export function useEuribor() {
  return useQuery({
    queryKey: ['market', 'euribor'],
    queryFn: () => api.getEuribor(),
    refetchInterval: 60_000,
  });
}

// ── Price History (1 year daily) ───────────────────────────────────────────

export function useMarketHistory(symbol: string) {
  return useQuery({
    queryKey: ['market', 'history', symbol],
    queryFn: () => api.getHistory(symbol),
    enabled: Boolean(symbol),
    refetchInterval: 3600_000, // 1h
  });
}

// ── Company Overview (Alpha Vantage) ───────────────────────────────────────

export function useCompanyOverview(symbol: string) {
  return useQuery({
    queryKey: ['market', 'overview', symbol],
    queryFn: () => api.getCompanyOverview(symbol),
    enabled: Boolean(symbol),
    staleTime: 24 * 3600_000, // 24h
  });
}

// ── Symbol Search (Alpha Vantage) ──────────────────────────────────────────

export function useSymbolSearch(query: string) {
  return useQuery({
    queryKey: ['market', 'search', query],
    queryFn: () => api.searchSymbol(query),
    enabled: query.length >= 2,
    staleTime: 3600_000,
  });
}

// ── Intraday Data (Alpha Vantage) ──────────────────────────────────────────

export function useIntraday(symbol: string, interval: string = '5min') {
  return useQuery({
    queryKey: ['market', 'intraday', symbol, interval],
    queryFn: () => api.getIntraday(symbol, interval),
    enabled: Boolean(symbol),
    refetchInterval: 300_000, // 5 min
  });
}

// ── Forex Rate (Alpha Vantage) ─────────────────────────────────────────────

export function useForexRate(from: string, to: string) {
  return useQuery({
    queryKey: ['market', 'forex', from, to],
    queryFn: () => api.getForexRate(from, to),
    enabled: Boolean(from) && Boolean(to),
    refetchInterval: 600_000, // 10 min
  });
}
