'use client';

// TODO: migrate Sprint 2 — replace with `useRfqHistory()` (Vague C / Sprint 2).
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { PricingResponse } from '@/lib/issuers/IssuerPricingAdapter';

export interface RfqSnapshot {
  id: string;
  createdAt: string;
  request: {
    productType: string;
    underlying: string;
    notional: number;
    maturityYears: number;
    targetCoupon?: number;
    barrier?: number;
  };
  responses: PricingResponse[];
}

interface RfqHistoryState {
  snapshots: RfqSnapshot[];
  add: (snapshot: Omit<RfqSnapshot, 'id' | 'createdAt'>) => RfqSnapshot;
  clear: () => void;
  /** Return the previous coupon for the given issuer on the same underlying. */
  getPreviousCoupon: (issuerShort: string, underlying: string, excludeId?: string) => number | null;
}

export const useRfqHistoryStore = create<RfqHistoryState>()(
  persist(
    (set, get) => ({
      snapshots: [],

      add: (data) => {
        const snapshot: RfqSnapshot = {
          ...data,
          id: `rfq-snap-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          createdAt: new Date().toISOString(),
        };
        set((state) => ({ snapshots: [snapshot, ...state.snapshots].slice(0, 50) }));
        return snapshot;
      },

      clear: () => set({ snapshots: [] }),

      getPreviousCoupon: (issuerShort, underlying, excludeId) => {
        const { snapshots } = get();
        for (const snap of snapshots) {
          if (excludeId && snap.id === excludeId) continue;
          if (snap.request.underlying !== underlying) continue;
          const match = snap.responses.find(
            (r) => r.issuerShort === issuerShort && r.status === 'success',
          );
          if (match) return match.indicativeCoupon;
        }
        return null;
      },
    }),
    { name: 'strickin-rfq-history' },
  ),
);
