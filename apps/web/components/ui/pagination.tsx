'use client';

import * as React from 'react';
import { cn } from '@/lib/cn';
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from 'lucide-react';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  className?: string;
  /** Show first/last page jump buttons */
  showFirstLast?: boolean;
  /** Number of page siblings to show around the current page */
  siblingCount?: number;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Build an array of page numbers and ellipsis markers.
 * Always shows the first page, last page, and `siblingCount` pages
 * around `currentPage`, using `null` as an ellipsis placeholder.
 */
function buildPageRange(
  currentPage: number,
  totalPages: number,
  siblingCount: number,
): (number | null)[] {
  const totalSlots = siblingCount * 2 + 5; // siblings + first + last + 2 ellipses + current

  // If total pages fit inside the available slots, show them all
  if (totalPages <= totalSlots) {
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }

  const leftSibling = Math.max(currentPage - siblingCount, 2);
  const rightSibling = Math.min(currentPage + siblingCount, totalPages - 1);

  const showLeftEllipsis = leftSibling > 2;
  const showRightEllipsis = rightSibling < totalPages - 1;

  const pages: (number | null)[] = [1];

  if (showLeftEllipsis) {
    pages.push(null);
  } else {
    // Fill in pages between 1 and leftSibling
    for (let i = 2; i < leftSibling; i++) {
      pages.push(i);
    }
  }

  for (let i = leftSibling; i <= rightSibling; i++) {
    pages.push(i);
  }

  if (showRightEllipsis) {
    pages.push(null);
  } else {
    for (let i = rightSibling + 1; i < totalPages; i++) {
      pages.push(i);
    }
  }

  pages.push(totalPages);

  return pages;
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

interface NavButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
}

function NavButton({ children, className, ...props }: NavButtonProps) {
  return (
    <button
      type="button"
      className={cn(
        'inline-flex items-center justify-center w-8 h-8 rounded-lg',
        'font-body text-sm text-ink-2',
        'transition-all duration-150 ease-in-out',
        'hover:bg-violet-pale hover:text-violet',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet focus-visible:ring-offset-1',
        'disabled:pointer-events-none disabled:opacity-35',
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

function Pagination({
  currentPage,
  totalPages,
  onPageChange,
  className,
  showFirstLast = false,
  siblingCount = 1,
}: PaginationProps) {
  // On mobile, reduce siblings for a compact layout
  const [compactSiblings, setCompactSiblings] = React.useState(siblingCount);

  React.useEffect(() => {
    const mq = window.matchMedia('(max-width: 640px)');
    const handler = (e: MediaQueryListEvent | MediaQueryList) => {
      setCompactSiblings(e.matches ? 0 : siblingCount);
    };
    handler(mq);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, [siblingCount]);

  if (totalPages <= 1) return null;

  const pages = buildPageRange(currentPage, totalPages, compactSiblings);

  const isFirst = currentPage === 1;
  const isLast = currentPage === totalPages;

  return (
    <nav
      aria-label="Pagination"
      className={cn('flex items-center gap-1', className)}
    >
      {/* First page button */}
      {showFirstLast && (
        <NavButton
          onClick={() => onPageChange(1)}
          disabled={isFirst}
          aria-label="Go to first page"
        >
          <ChevronsLeft className="w-4 h-4" />
        </NavButton>
      )}

      {/* Previous page button */}
      <NavButton
        onClick={() => onPageChange(currentPage - 1)}
        disabled={isFirst}
        aria-label="Go to previous page"
      >
        <ChevronLeft className="w-4 h-4" />
      </NavButton>

      {/* Page numbers */}
      {pages.map((page, idx) => {
        if (page === null) {
          return (
            <span
              key={`ellipsis-${idx}`}
              className="inline-flex items-center justify-center w-8 h-8 font-mono text-sm text-ink-3 select-none"
              aria-hidden="true"
            >
              ...
            </span>
          );
        }

        const isCurrent = page === currentPage;

        return (
          <button
            key={page}
            type="button"
            onClick={() => onPageChange(page)}
            aria-current={isCurrent ? 'page' : undefined}
            aria-label={`Page ${page}`}
            className={cn(
              'inline-flex items-center justify-center w-8 h-8 rounded-lg',
              'font-mono text-sm font-medium',
              'transition-all duration-150 ease-in-out',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet focus-visible:ring-offset-1',
              isCurrent
                ? 'bg-gradient-to-br from-violet to-violet-mid text-white shadow-sm'
                : 'text-ink-2 hover:bg-violet-pale hover:text-violet',
            )}
          >
            {page}
          </button>
        );
      })}

      {/* Next page button */}
      <NavButton
        onClick={() => onPageChange(currentPage + 1)}
        disabled={isLast}
        aria-label="Go to next page"
      >
        <ChevronRight className="w-4 h-4" />
      </NavButton>

      {/* Last page button */}
      {showFirstLast && (
        <NavButton
          onClick={() => onPageChange(totalPages)}
          disabled={isLast}
          aria-label="Go to last page"
        >
          <ChevronsRight className="w-4 h-4" />
        </NavButton>
      )}
    </nav>
  );
}

Pagination.displayName = 'Pagination';

export { Pagination };
export type { PaginationProps };
