'use client';

import * as React from 'react';
import { cn } from '@/lib/cn';

// ---------------------------------------------------------------------------
// Shared shimmer block
// ---------------------------------------------------------------------------

interface ShimmerProps extends React.HTMLAttributes<HTMLDivElement> {}

const Shimmer = React.forwardRef<HTMLDivElement, ShimmerProps>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        'animate-shimmer rounded-md',
        'bg-gradient-to-r from-surface-2 via-[#E8E6E0] to-surface-2 bg-[length:200%_100%]',
        'dark:from-white/5 dark:via-white/10 dark:to-white/5',
        className,
      )}
      {...props}
    />
  ),
);

Shimmer.displayName = 'Shimmer';

// ---------------------------------------------------------------------------
// SkeletonCard — card-shaped skeleton with header + body lines
// ---------------------------------------------------------------------------

interface SkeletonCardProps extends React.HTMLAttributes<HTMLDivElement> {}

const SkeletonCard = React.forwardRef<HTMLDivElement, SkeletonCardProps>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        'rounded-xl border border-border/60 bg-white p-5 space-y-4',
        'dark:bg-white/[0.03] dark:border-white/10',
        className,
      )}
      {...props}
    >
      {/* Header row */}
      <div className="flex items-center gap-3">
        <Shimmer className="h-10 w-10 rounded-full shrink-0" />
        <div className="flex-1 space-y-2">
          <Shimmer className="h-3.5 w-2/5 rounded" />
          <Shimmer className="h-3 w-1/4 rounded" />
        </div>
      </div>

      {/* Body lines */}
      <div className="space-y-2.5">
        <Shimmer className="h-3 w-full rounded" />
        <Shimmer className="h-3 w-4/5 rounded" />
        <Shimmer className="h-3 w-3/5 rounded" />
      </div>

      {/* Button placeholder */}
      <Shimmer className="h-9 w-28 rounded-md" />
    </div>
  ),
);

SkeletonCard.displayName = 'SkeletonCard';

// ---------------------------------------------------------------------------
// SkeletonTable — table skeleton with header row + N body rows
// ---------------------------------------------------------------------------

interface SkeletonTableProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Number of body rows to render (default 5) */
  rows?: number;
}

const SkeletonTable = React.forwardRef<HTMLDivElement, SkeletonTableProps>(
  ({ rows = 5, className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        'rounded-xl border border-border/60 bg-white overflow-hidden',
        'dark:bg-white/[0.03] dark:border-white/10',
        className,
      )}
      {...props}
    >
      {/* Header row */}
      <div className="flex items-center gap-4 px-5 py-3.5 border-b border-border/60 dark:border-white/10 bg-surface/60 dark:bg-white/[0.02]">
        <Shimmer className="h-3.5 w-1/6 rounded" />
        <Shimmer className="h-3.5 w-1/5 rounded" />
        <Shimmer className="h-3.5 w-1/4 rounded" />
        <Shimmer className="h-3.5 w-1/6 rounded" />
        <Shimmer className="h-3.5 w-1/12 rounded" />
      </div>

      {/* Body rows */}
      {Array.from({ length: rows }).map((_, i) => (
        <div
          key={i}
          className={cn(
            'flex items-center gap-4 px-5 py-3',
            i < rows - 1 && 'border-b border-border/30 dark:border-white/5',
          )}
        >
          <Shimmer className="h-3 w-1/6 rounded" />
          <Shimmer className="h-3 w-1/5 rounded" />
          <Shimmer className="h-3 w-1/4 rounded" />
          <Shimmer className="h-3 w-1/6 rounded" />
          <Shimmer className="h-3 w-1/12 rounded" />
        </div>
      ))}
    </div>
  ),
);

SkeletonTable.displayName = 'SkeletonTable';

// ---------------------------------------------------------------------------
// SkeletonKpi — KPI card skeleton (icon circle + text lines)
// ---------------------------------------------------------------------------

interface SkeletonKpiProps extends React.HTMLAttributes<HTMLDivElement> {}

const SkeletonKpi = React.forwardRef<HTMLDivElement, SkeletonKpiProps>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        'rounded-xl border border-border/60 bg-white p-5',
        'dark:bg-white/[0.03] dark:border-white/10',
        className,
      )}
      {...props}
    >
      <div className="flex items-start gap-4">
        {/* Icon circle */}
        <Shimmer className="h-11 w-11 rounded-2xl shrink-0" />

        {/* Text block */}
        <div className="flex-1 space-y-2.5 pt-0.5">
          <Shimmer className="h-3 w-1/2 rounded" />
          <Shimmer className="h-6 w-2/5 rounded" />
          <Shimmer className="h-2.5 w-3/5 rounded" />
        </div>
      </div>
    </div>
  ),
);

SkeletonKpi.displayName = 'SkeletonKpi';

// ---------------------------------------------------------------------------
// SkeletonChart — chart-area skeleton (tall rectangle)
// ---------------------------------------------------------------------------

interface SkeletonChartProps extends React.HTMLAttributes<HTMLDivElement> {}

const SkeletonChart = React.forwardRef<HTMLDivElement, SkeletonChartProps>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        'rounded-xl border border-border/60 bg-white p-5 space-y-4',
        'dark:bg-white/[0.03] dark:border-white/10',
        className,
      )}
      {...props}
    >
      {/* Chart title */}
      <div className="flex items-center justify-between">
        <Shimmer className="h-4 w-1/4 rounded" />
        <Shimmer className="h-7 w-24 rounded-md" />
      </div>

      {/* Chart area */}
      <div className="relative">
        <Shimmer className="h-52 w-full rounded-lg" />

        {/* Faux bar columns overlaid for visual depth */}
        <div className="absolute inset-x-5 bottom-3 flex items-end gap-3 h-40">
          {[0.6, 0.85, 0.45, 0.7, 0.55, 0.9, 0.4].map((ratio, i) => (
            <div
              key={i}
              className="flex-1 rounded-t-sm bg-surface-2/50 dark:bg-white/[0.04]"
              style={{ height: `${ratio * 100}%` }}
            />
          ))}
        </div>
      </div>

      {/* Legend row */}
      <div className="flex items-center gap-4">
        <Shimmer className="h-2.5 w-16 rounded" />
        <Shimmer className="h-2.5 w-16 rounded" />
        <Shimmer className="h-2.5 w-16 rounded" />
      </div>
    </div>
  ),
);

SkeletonChart.displayName = 'SkeletonChart';

// ---------------------------------------------------------------------------
// SkeletonGrid — grid of SkeletonCards
// ---------------------------------------------------------------------------

interface SkeletonGridProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Number of skeleton cards to render (default 6) */
  count?: number;
  /** Number of grid columns (default 3) */
  cols?: number;
}

const colsMap: Record<number, string> = {
  1: 'grid-cols-1',
  2: 'grid-cols-1 sm:grid-cols-2',
  3: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
  4: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4',
};

const SkeletonGrid = React.forwardRef<HTMLDivElement, SkeletonGridProps>(
  ({ count = 6, cols = 3, className, ...props }, ref) => {
    const gridClass = colsMap[cols] ?? `grid-cols-1 sm:grid-cols-2 lg:grid-cols-${cols}`;

    return (
      <div
        ref={ref}
        className={cn('grid gap-4', gridClass, className)}
        {...props}
      >
        {Array.from({ length: count }).map((_, i) => (
          <SkeletonCard key={i} />
        ))}
      </div>
    );
  },
);

SkeletonGrid.displayName = 'SkeletonGrid';

// ---------------------------------------------------------------------------
// Exports
// ---------------------------------------------------------------------------

export { SkeletonCard, SkeletonTable, SkeletonKpi, SkeletonChart, SkeletonGrid };
export type {
  SkeletonCardProps,
  SkeletonTableProps,
  SkeletonKpiProps,
  SkeletonChartProps,
  SkeletonGridProps,
};
