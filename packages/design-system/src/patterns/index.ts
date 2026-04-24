/**
 * Patterns — composite building blocks that combine several primitives
 * into ready-to-use UI blocks (page headers, empty states, data tables).
 *
 * Keep anything that is "more than a primitive but less than a feature"
 * here. If a pattern grows domain-specific (e.g. `ProductCard`), move it
 * out of the design-system and into the consuming app.
 */

export type { PageHeaderProps, IconComponent } from './page-header';

export type { EmptyStateProps } from './empty-state';

export type {
  DataTableProps,
  DataTableColumn,
  DataTableSortState,
  SortDirection,
} from './data-table';

export type { TermTooltipProps, FinancialGlossary } from './term-tooltip';
