import type { HTMLAttributes } from 'react';

/**
 * Base shimmering block used to build loading placeholders.
 * Accepts every native `<div>` prop; use `className` for sizing.
 */
export type SkeletonProps = HTMLAttributes<HTMLDivElement>;

export interface SkeletonTextProps extends HTMLAttributes<HTMLDivElement> {
  /** Number of lines to render (default 3). */
  lines?: number;
}

export type SkeletonCardProps = HTMLAttributes<HTMLDivElement>;
