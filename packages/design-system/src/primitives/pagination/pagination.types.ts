export interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  className?: string;
  /** Show first/last page jump buttons. */
  showFirstLast?: boolean;
  /** Number of page siblings to show around the current page. */
  siblingCount?: number;
}
