'use client';

import * as React from 'react';
import { cn } from '@/lib/cn';

interface ProgressBarProps {
  /** Value from 0 to 100 */
  value: number;
  /** Accessible label */
  label?: string;
  /** Height class override, defaults to h-1.5 (6px) */
  heightClass?: string;
  className?: string;
  /** Show the numeric value as a label to the right */
  showValue?: boolean;
}

function ProgressBar({
  value,
  label,
  heightClass,
  className,
  showValue = false,
}: ProgressBarProps) {
  const clamped = Math.min(100, Math.max(0, value));

  return (
    <div className={cn('flex items-center gap-2 w-full', className)}>
      <div
        role="progressbar"
        aria-valuenow={clamped}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={label}
        className={cn(
          'flex-1 rounded-full bg-violet-pale overflow-hidden',
          heightClass ?? 'h-1.5',
        )}
      >
        <div
          className={cn(
            'h-full rounded-full',
            'bg-gradient-to-r from-violet-mid to-violet-light',
            'transition-[width] duration-500 ease-out',
          )}
          style={{ width: `${clamped}%` }}
        />
      </div>

      {showValue && (
        <span className="font-body text-xs font-semibold text-ink-3 tabular-nums min-w-[2.5rem] text-right">
          {Math.round(clamped)}%
        </span>
      )}
    </div>
  );
}

export { ProgressBar };
export type { ProgressBarProps };
