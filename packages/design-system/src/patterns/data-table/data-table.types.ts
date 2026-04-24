import type { ReactNode } from 'react';

/**
 * Column definition for DataTable.
 *
 * `TRow` is the row shape; `key` must be a string key from `TRow` OR any
 * free-form identifier when the column is virtual (e.g. an actions column).
 */
export interface DataTableColumn<TRow> {
  /** Unique identifier — must be stable across renders. */
  key: string;
  /** Header label, rendered inside a `<th>`. */
  header: ReactNode;
  /** Cell renderer. Receives the full row so custom formatting works. */
  cell?: (row: TRow, index: number) => ReactNode;
  /** Horizontal alignment of the cell content. Default: `left`. */
  align?: 'left' | 'center' | 'right';
  /** Fixed column width — passed straight to the `<th>` style. */
  width?: string | number;
  /** If true, allow the user to sort this column. */
  sortable?: boolean;
  /** Optional CSS class applied to every cell in this column. */
  className?: string;
}

export type SortDirection = 'asc' | 'desc';

export interface DataTableSortState {
  key: string;
  direction: SortDirection;
}

export interface DataTableProps<TRow> {
  columns: DataTableColumn<TRow>[];
  rows: TRow[];
  /** Key used to identify rows (for React keys + selection). */
  rowKey: (row: TRow, index: number) => string;
  /** Controlled sort state. Undefined if not sortable. */
  sort?: DataTableSortState;
  /** Callback when the user clicks a sortable header. */
  onSortChange?: (state: DataTableSortState) => void;
  /** If true, show a shimmering skeleton instead of rows. */
  loading?: boolean;
  /** Rendered when `rows.length === 0 && !loading`. */
  emptyState?: ReactNode;
  /** Callback when a row is clicked. Receives row + native event. */
  onRowClick?: (row: TRow, index: number) => void;
  className?: string;
}
