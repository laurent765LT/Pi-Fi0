'use client';
// TODO: migrate Sprint 2 — replace with `useMarketData()` TanStack Query hook.
import { create } from 'zustand';

export interface MarketQuote {
  symbol: string;
  label: string;
  value: number;
  change: number;
  changePercent: number;
  updatedAt: string;
}

interface MarketDataStore {
  quotes: Record<string, MarketQuote>;
  setQuotes: (quotes: Record<string, MarketQuote>) => void;
  getQuote: (symbol: string) => MarketQuote | undefined;
}

// Initialize with unified demo values (avoid conflicts between pages)
const INITIAL_QUOTES: Record<string, MarketQuote> = {
  EUROSTOXX50: { symbol: 'EUROSTOXX50', label: 'Euro Stoxx 50', value: 4892, change: 39.1, changePercent: 0.8, updatedAt: new Date().toISOString() },
  CAC40: { symbol: 'CAC40', label: 'CAC 40', value: 7845, change: 39.2, changePercent: 0.5, updatedAt: new Date().toISOString() },
  VIX: { symbol: 'VIX', label: 'VIX', value: 16.2, change: -0.52, changePercent: -3.1, updatedAt: new Date().toISOString() },
  EURUSD: { symbol: 'EURUSD', label: 'EUR/USD', value: 1.082, change: -0.002, changePercent: -0.2, updatedAt: new Date().toISOString() },
  VOL_IMPLICITE: { symbol: 'VOL_IMPLICITE', label: 'Vol. Implicite', value: 17.8, change: -1.2, changePercent: -6.3, updatedAt: new Date().toISOString() },
  EUR_CMS_10Y: { symbol: 'EUR_CMS_10Y', label: 'EUR CMS 10Y', value: 2.64, change: 0.03, changePercent: 1.1, updatedAt: new Date().toISOString() },
};

export const useMarketDataStore = create<MarketDataStore>((set, get) => ({
  quotes: INITIAL_QUOTES,
  setQuotes: (quotes) => set({ quotes }),
  getQuote: (symbol) => get().quotes[symbol],
}));
