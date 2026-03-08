'use client';

import { create } from 'zustand';

type FilterKey = 'payoffType' | 'minSri' | 'maxSri' | 'search' | 'status';

interface FiltersState {
  payoffType: string | null;
  minSri: number | null;
  maxSri: number | null;
  search: string;
  status: string;

  setFilter: <K extends FilterKey>(key: K, value: FiltersState[K]) => void;
  resetFilters: () => void;
}

const defaultFilters = {
  payoffType: null,
  minSri: null,
  maxSri: null,
  search: '',
  status: '',
} satisfies Pick<FiltersState, FilterKey>;

export const useFiltersStore = create<FiltersState>()((set) => ({
  ...defaultFilters,

  setFilter: (key, value) => {
    set({ [key]: value } as Partial<FiltersState>);
  },

  resetFilters: () => {
    set(defaultFilters);
  },
}));
