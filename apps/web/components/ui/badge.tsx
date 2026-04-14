'use client';

import * as React from 'react';
import { cn } from '@/lib/cn';

type BadgeVariant = 'violet' | 'cobalt' | 'teal' | 'gold' | 'red' | 'muted';
type BadgeSize = 'sm' | 'md' | 'lg';

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
  size?: BadgeSize;
  children?: React.ReactNode;
}

const variantClasses: Record<BadgeVariant, string> = {
  violet: 'bg-violet-pale text-violet border border-[#C9BCFF]',
  cobalt: 'bg-cobalt-pale text-cobalt border border-[#B8C8FF]',
  teal:   'bg-[#D6F7EF] text-[#007A63] border border-[#A3EDD9]',
  gold:   'bg-[#FDF3D6] text-[#9B7210] border border-[#F0D98A]',
  red:    'bg-[#FDE8EB] text-red border border-[#F8B4BC]',
  muted:  'bg-surface-2 text-ink-3 border border-border',
};

const sizeClasses: Record<BadgeSize, string> = {
  sm: 'text-[8px] px-[6px] py-[2px]',
  md: 'text-[9.5px] px-[9px] py-[3px]',
  lg: 'text-[11px] px-[12px] py-[4px]',
};

const Badge = React.forwardRef<HTMLSpanElement, BadgeProps>(
  ({ variant = 'violet', size = 'md', className, children, ...props }, ref) => {
    return (
      <span
        ref={ref}
        className={cn(
          'inline-flex items-center justify-center',
          'rounded-sm font-body font-bold uppercase tracking-widest',
          'leading-none',
          sizeClasses[size],
          variantClasses[variant],
          className,
        )}
        {...props}
      >
        {children}
      </span>
    );
  },
);

Badge.displayName = 'Badge';

export { Badge };
export type { BadgeProps, BadgeVariant, BadgeSize };
