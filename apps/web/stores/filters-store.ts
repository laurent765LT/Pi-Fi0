'use client';

import { create } from 'zustand';

// ─── Types ────────────────────────────────────────────────────────────────────

export type SortField = 'name' | 'maturity' | 'sri' | 'maxGain' | 'barrier' | 'coupon' | 'fill';
export type SortOrder = 'asc' | 'desc';

type FilterKey =
  | 'payoffType'
  | 'minSri'
  | 'maxSri'
  | 'search'
  | 'status'
  | 'underlying'
  | 'issuer'
  | 'minBarrier'
  | 'maxBarrier'
  | 'minCoupon'
  | 'maxCoupon'
  | 'minMaturityYear'
  | 'maxMaturityYear'
  | 'hasAutocall'
  | 'capitalProtected'
  | 'sortBy'
  | 'sortOrder';

interface FiltersState {
  payoffType: string | null;
  minSri: number | null;
  maxSri: number | null;
  search: string;
  status: string;
  underlying: string | null;
  issuer: string | null;
  minBarrier: number | null;
  maxBarrier: number | null;
  minCoupon: number | null;
  maxCoupon: number | null;
  minMaturityYear: number | null;
  maxMaturityYear: number | null;
  hasAutocall: boolean | null;
  capitalProtected: boolean | null;
  sortBy: SortField;
  sortOrder: SortOrder;

  setFilter: <K extends FilterKey>(key: K, value: FiltersState[K]) => void;
  resetFilters: () => void;
  activeFilterCount: () => number;
}

const defaultFilters = {
  payoffType: null,
  minSri: null,
  maxSri: null,
  search: '',
  status: '',
  underlying: null,
  issuer: null,
  minBarrier: null,
  maxBarrier: null,
  minCoupon: null,
  maxCoupon: null,
  minMaturityYear: null,
  maxMaturityYear: null,
  hasAutocall: null,
  capitalProtected: null,
  sortBy: 'name' as SortField,
  sortOrder: 'asc' as SortOrder,
} satisfies Pick<FiltersState, FilterKey>;

export const useFiltersStore = create<FiltersState>()((set, get) => ({
  ...defaultFilters,

  setFilter: (key, value) => {
    set({ [key]: value } as Partial<FiltersState>);
  },

  resetFilters: () => {
    set(defaultFilters);
  },

  activeFilterCount: () => {
    const s = get();
    return [
      s.payoffType !== null,
      s.minSri !== null,
      s.maxSri !== null,
      s.search !== '',
      s.status !== '',
      s.underlying !== null,
      s.issuer !== null,
      s.minBarrier !== null,
      s.maxBarrier !== null,
      s.minCoupon !== null,
      s.maxCoupon !== null,
      s.minMaturityYear !== null,
      s.maxMaturityYear !== null,
      s.hasAutocall !== null,
      s.capitalProtected !== null,
    ].filter(Boolean).length;
  },
}));
