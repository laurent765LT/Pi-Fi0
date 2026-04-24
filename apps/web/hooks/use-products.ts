'use client';

// ─── useProducts / useProduct / useProductPayoff ─────────────────────────────
// TanStack Query hooks for the structured products catalog.
//
// Behaviour:
// - When `NEXT_PUBLIC_USE_REAL_API=true` → calls the typed `productsApi`.
// - Otherwise uses the legacy `api.getProducts()` / `api.getProduct()` helpers
//   which already ship with a DEMO_PRODUCTS fallback.
//
// This replaces the never-built `useProductCatalogStore`. The public signature
// is stable so the existing 10+ consumer pages do NOT need any change.

import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { productsApi } from '@/lib/api/resources/products';
import { useRealApi } from '@/lib/api/client';

export interface ProductFilters {
  payoffType?: string | null;
  minSri?: number | null;
  maxSri?: number | null;
  search?: string;
  status?: string;
}

function buildQueryParams(filters: ProductFilters): Record<string, string> {
  const params: Record<string, string> = {};

  if (filters.payoffType) params.payoffType = filters.payoffType;
  if (filters.minSri != null) params.minSri = String(filters.minSri);
  if (filters.maxSri != null) params.maxSri = String(filters.maxSri);
  if (filters.search) params.search = filters.search;
  if (filters.status) params.status = filters.status;

  return params;
}

export const productKeys = {
  all: ['products'] as const,
  list: (params: Record<string, string>) => ['products', params] as const,
  detail: (id: string) => ['products', id] as const,
  payoff: (id: string) => ['products', id, 'payoff'] as const,
};

export function useProducts(filters: ProductFilters = {}) {
  const params = buildQueryParams(filters);
  const realApi = useRealApi();

  return useQuery({
    queryKey: productKeys.list(params),
    queryFn: async () => {
      if (realApi) {
        return productsApi.list({
          search: params.search,
          payoffType: params.payoffType,
          sriMin: params.minSri ? Number(params.minSri) : undefined,
          sriMax: params.maxSri ? Number(params.maxSri) : undefined,
          status: params.status,
        });
      }
      return api.getProducts(params);
    },
    staleTime: 5 * 60_000,
  });
}

export function useProduct(id: string) {
  const realApi = useRealApi();
  return useQuery({
    queryKey: productKeys.detail(id),
    queryFn: () => (realApi ? productsApi.get(id) : api.getProduct(id)),
    enabled: Boolean(id),
    staleTime: 5 * 60_000,
  });
}

export function useProductPayoff(id: string) {
  return useQuery({
    queryKey: productKeys.payoff(id),
    queryFn: () => api.getProductPayoff(id),
    enabled: Boolean(id),
  });
}
