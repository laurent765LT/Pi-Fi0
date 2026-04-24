/**
 * Pagination contracts shared between client and server.
 *
 * Two strategies are supported:
 * - Offset pagination (page/limit) — simple, suitable for admin tables.
 * - Cursor pagination — stable for infinite scroll on high-traffic lists.
 */

/** Offset pagination query parameters. */
export interface OffsetPagination {
  /** 1-based page number. */
  page?: number;
  /** Max records per page (server enforces upper bound). */
  limit?: number;
}

/** Cursor pagination query parameters. */
export interface CursorPagination {
  /** Opaque cursor returned by the previous page (null for first page). */
  cursor?: string | null;
  /** Max records per page. */
  limit?: number;
}

/** Metadata returned alongside a paged response. */
export interface PageMeta {
  total: number;
  page: number;
  limit: number;
  hasMore?: boolean;
}

/** Standard envelope for paged responses. */
export interface PagedResponse<T> {
  data: T[];
  meta: PageMeta;
}

/** Cursor-paginated envelope. */
export interface CursorPagedResponse<T> {
  data: T[];
  nextCursor: string | null;
  hasMore: boolean;
}
