'use client';

import * as React from 'react';
import { cn } from '@/lib/cn';

// ---------------------------------------------------------------------------
// Skeleton — base shimmer block
// ---------------------------------------------------------------------------

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {}

const Skeleton = React.forwardRef<HTMLDivElement, SkeletonProps>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        'animate-shimmer rounded-md bg-gradient-to-r from-surface-2 via-[#E8E6E0] to-surface-2 bg-[length:200%_100%]',
        className,
      )}
      {...props}
    />
  ),
);

Skeleton.displayName = 'Skeleton';

// ---------------------------------------------------------------------------
// SkeletonText — simulates multiple text lines
// ---------------------------------------------------------------------------

interface SkeletonTextProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Number of lines to render (default 3) */
  lines?: number;
}

const lineWidths = ['w-full', 'w-4/5', 'w-3/5', 'w-5/6', 'w-2/3'];

const SkeletonText = React.forwardRef<HTMLDivElement, SkeletonTextProps>(
  ({ lines = 3, className, ...props }, ref) => (
    <div ref={ref} className={cn('flex flex-col gap-2', className)} {...props}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          className={cn('h-3 rounded', lineWidths[i % lineWidths.length])}
        />
      ))}
    </div>
  ),
);

SkeletonText.displayName = 'SkeletonText';

// ---------------------------------------------------------------------------
// SkeletonCard — simulates a full card placeholder
// ---------------------------------------------------------------------------

interface SkeletonCardProps extends React.HTMLAttributes<HTMLDivElement> {}

const SkeletonCard = React.forwardRef<HTMLDivElement, SkeletonCardProps>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        'rounded-xl border border-border bg-white p-5 space-y-4',
        className,
      )}
      {...props}
    >
      {/* Header area */}
      <div className="flex items-center gap-3">
        <Skeleton className="h-10 w-10 rounded-full" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-3.5 w-2/5 rounded" />
          <Skeleton className="h-3 w-1/4 rounded" />
        </div>
      </div>

      {/* Body lines */}
      <SkeletonText lines={3} />

      {/* Button placeholder */}
      <Skeleton className="h-9 w-28 rounded-md" />
    </div>
  ),
);

SkeletonCard.displayName = 'SkeletonCard';

export { Skeleton, SkeletonText, SkeletonCard };
export type { SkeletonProps, SkeletonTextProps, SkeletonCardProps };
