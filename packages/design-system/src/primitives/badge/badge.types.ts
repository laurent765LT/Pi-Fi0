import type { HTMLAttributes, ReactNode } from 'react';

export type BadgeVariant =
  | 'violet'
  | 'cobalt'
  | 'teal'
  | 'gold'
  | 'red'
  | 'muted';

export type BadgeSize = 'sm' | 'md' | 'lg';

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
  size?: BadgeSize;
  children?: ReactNode;
}
