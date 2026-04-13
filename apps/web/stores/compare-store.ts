import { create } from 'zustand';

interface CompareState {
  productIds: string[];
  addProduct: (id: string) => void;
  removeProduct: (id: string) => void;
  clearAll: () => void;
  isInCompare: (id: string) => boolean;
}

export const useCompareStore = create<CompareState>((set, get) => ({
  productIds: [],
  addProduct: (id) => set((s) => ({
    productIds: s.productIds.length < 3 ? [...s.productIds, id] : s.productIds,
  })),
  removeProduct: (id) => set((s) => ({
    productIds: s.productIds.filter((pid) => pid !== id),
  })),
  clearAll: () => set({ productIds: [] }),
  isInCompare: (id) => get().productIds.includes(id),
}));
