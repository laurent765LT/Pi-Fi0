/**
 * Product catalogue HTTP contracts.
 */

import type { PayoffType, Product, ProductStatus, ProductSummary } from '../domain/product';
import type { OffsetPagination, PagedResponse } from './pagination';

/** Query-string filters for GET /products. */
export interface ProductFilters extends OffsetPagination {
  search?: string;
  payoffType?: PayoffType;
  status?: ProductStatus;
  /** Inclusive lower bound of SRI. */
  sriMin?: number;
  /** Inclusive upper bound of SRI. */
  sriMax?: number;
  /** Filter by issuer id. */
  issuerId?: string;
}

/** Full product listing query type (filters + pagination). */
export type ListProductsQuery = ProductFilters;

/** Response to GET /products. */
export type ListProductsResponse = PagedResponse<ProductSummary>;

/** Legacy product list response shape used by apps/web today. */
export interface ProductListResponse {
  data: ProductSummary[];
  meta: { total: number; page: number; limit: number };
}

/** Response to GET /products/:id. */
export interface ProductResponseDto {
  product: Product;
}

/** Request body for POST /products (platform admin / issuer admin only). */
export type CreateProductDto = Omit<
  Product,
  'id' | 'status' | 'createdAt' | 'updatedAt' | 'descriptionData'
> & {
  descriptionData?: Record<string, unknown> | null;
};

/** Request body for PATCH /products/:id. */
export type UpdateProductDto = Partial<
  Omit<Product, 'id' | 'isin' | 'createdAt' | 'updatedAt'>
>;
