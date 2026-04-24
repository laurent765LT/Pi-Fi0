'use client';
// TODO: migrate Sprint 2 — replace with `useAlerts()` TanStack Query hook.
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type AlertMetric = 'coupon' | 'barriere' | 'gainMax' | 'sri' | 'maturite';
export type AlertCondition = 'gte' | 'lte' | 'eq';

export interface PriceAlert {
  id: string;
  productId?: string;      // optional, for product-specific alerts
  productName?: string;    // resolved for display
  metric: AlertMetric;
  condition: AlertCondition;
  threshold: number;
  enabled: boolean;
  createdAt: string;
  triggered?: boolean;
  triggeredAt?: string;
}

interface AlertsState {
  alerts: PriceAlert[];
  add: (alert: Omit<PriceAlert, 'id' | 'createdAt' | 'enabled' | 'triggered'>) => void;
  remove: (id: string) => void;
  toggle: (id: string) => void;
  markTriggered: (id: string) => void;
  clearAll: () => void;
}

export const useAlertsStore = create<AlertsState>()(
  persist(
    (set) => ({
      alerts: [],
      add: (data) => set((state) => ({
        alerts: [
          {
            ...data,
            id: `alert-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
            createdAt: new Date().toISOString(),
            enabled: true,
            triggered: false,
          },
          ...state.alerts,
        ],
      })),
      remove: (id) => set((state) => ({ alerts: state.alerts.filter((a) => a.id !== id) })),
      toggle: (id) => set((state) => ({
        alerts: state.alerts.map((a) => a.id === id ? { ...a, enabled: !a.enabled } : a),
      })),
      markTriggered: (id) => set((state) => ({
        alerts: state.alerts.map((a) => a.id === id ? { ...a, triggered: true, triggeredAt: new Date().toISOString() } : a),
      })),
      clearAll: () => set({ alerts: [] }),
    }),
    { name: 'strickin-alerts' }
  )
);
