// ─── Products resource ───────────────────────────────────────────────────────

import { apiClient } from '../client';
import type {
  Product,
  ProductFilters,
  ProductListResponse,
} from '../types';

export const productsApi = {
  list: (filters?: ProductFilters) =>
    apiClient.get<ProductListResponse>(
      '/products',
      filters as Record<string, unknown> | undefined,
    ),
  get: (id: string) => apiClient.get<Product>(`/products/${id}`),
};
