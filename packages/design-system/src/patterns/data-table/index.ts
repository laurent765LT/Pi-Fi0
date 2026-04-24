/**
 * DataTable pattern — public type contract.
 *
 * NOTE: no runtime implementation exists yet in `apps/web/components/ui/`.
 * Tables are currently assembled inline from the `.data-table` CSS
 * utilities. These types provide the contract for the consolidated
 * component; they can already be used to type ad-hoc table wrappers.
 */
export type {
  DataTableProps,
  DataTableColumn,
  DataTableSortState,
  SortDirection,
} from './data-table.types';
