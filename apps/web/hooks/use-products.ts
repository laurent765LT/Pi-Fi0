'use client';

import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';

interface ProductFilters {
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

export function useProducts(filters: ProductFilters = {}) {
  const params = buildQueryParams(filters);

  return useQuery({
    queryKey: ['products', params],
    queryFn: () => api.getProducts(params),
  });
}

export function useProduct(id: string) {
  return useQuery({
    queryKey: ['products', id],
    queryFn: () => api.getProduct(id),
    enabled: Boolean(id),
  });
}

export function useProductPayoff(id: string) {
  return useQuery({
    queryKey: ['products', id, 'payoff'],
    queryFn: () => api.getProductPayoff(id),
    enabled: Boolean(id),
  });
}
