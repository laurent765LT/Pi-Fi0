'use client';

// TODO: migrate Sprint 2 — replace with `useSecondaryPricing()` TanStack Query hook.
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import {
  syncSecondaryPricing,
  seedQuotes,
  type SecondaryQuote,
  type LiquidityTier,
} from '@/lib/secondary/pricing-sync';
import {
  scoreOpportunities,
  type SecondaryOpportunity,
  type OpportunityType,
} from '@/lib/secondary/opportunity-scorer';
import { DEMO_PRODUCTS } from '@/lib/demo-data';

export type { SecondaryQuote, LiquidityTier, SecondaryOpportunity, OpportunityType };

interface SecondaryPricingState {
  quotes: Record<string, SecondaryQuote>;
  opportunities: SecondaryOpportunity[];
  lastSync: string;
  isSyncing: boolean;
  syncQuotes: () => Promise<void>;
  getQuote: (productId: string) => SecondaryQuote | undefined;
}

const initialQuotes = seedQuotes();
const initialOpportunities = scoreOpportunities(
  Object.values(initialQuotes),
  DEMO_PRODUCTS.map((p) => ({
    id: p.id,
    name: p.name,
    payoffType: p.payoffType,
    couponPct: p.couponPct ?? null,
    barrierCapPct: p.barrierCapPct ?? null,
    autocallBarrierPct: p.autocallBarrierPct ?? null,
    maturityDate: p.maturityDate,
    sri: p.sri,
  })),
);

export const useSecondaryPricingStore = create<SecondaryPricingState>()(
  persist(
    (set, get) => ({
      quotes: initialQuotes,
      opportunities: initialOpportunities,
      lastSync: new Date().toISOString(),
      isSyncing: false,

      syncQuotes: async () => {
        if (get().isSyncing) return;
        set({ isSyncing: true });
        try {
          const quotes = await syncSecondaryPricing();
          const opportunities = scoreOpportunities(
            Object.values(quotes),
            DEMO_PRODUCTS.map((p) => ({
              id: p.id,
              name: p.name,
              payoffType: p.payoffType,
              couponPct: p.couponPct ?? null,
              barrierCapPct: p.barrierCapPct ?? null,
              autocallBarrierPct: p.autocallBarrierPct ?? null,
              maturityDate: p.maturityDate,
              sri: p.sri,
            })),
          );
          set({
            quotes,
            opportunities,
            lastSync: new Date().toISOString(),
            isSyncing: false,
          });
        } catch {
          set({ isSyncing: false });
        }
      },

      getQuote: (productId: string) => get().quotes[productId],
    }),
    {
      name: 'strickin-secondary-pricing',
      partialize: (state) => ({
        quotes: state.quotes,
        opportunities: state.opportunities,
        lastSync: state.lastSync,
      }),
    },
  ),
);
