'use client';

import * as React from 'react';
import { cn } from '@/lib/cn';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type TooltipSide = 'top' | 'bottom' | 'left' | 'right';

interface TooltipProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Text shown in the tooltip bubble */
  content: string;
  /** Side relative to the trigger (default "top") */
  side?: TooltipSide;
  children: React.ReactNode;
}

// ---------------------------------------------------------------------------
// Position & arrow classes per side
// ---------------------------------------------------------------------------

const positionClasses: Record<TooltipSide, string> = {
  top: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
  bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
  left: 'right-full top-1/2 -translate-y-1/2 mr-2',
  right: 'left-full top-1/2 -translate-y-1/2 ml-2',
};

const arrowClasses: Record<TooltipSide, string> = {
  top: 'top-full left-1/2 -translate-x-1/2 border-t-[#1A0A3E] border-x-transparent border-b-transparent',
  bottom: 'bottom-full left-1/2 -translate-x-1/2 border-b-[#1A0A3E] border-x-transparent border-t-transparent',
  left: 'left-full top-1/2 -translate-y-1/2 border-l-[#1A0A3E] border-y-transparent border-r-transparent',
  right: 'right-full top-1/2 -translate-y-1/2 border-r-[#1A0A3E] border-y-transparent border-l-transparent',
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

const Tooltip = React.forwardRef<HTMLDivElement, TooltipProps>(
  ({ content, side = 'top', className, children, ...props }, ref) => (
    <div
      ref={ref}
      className={cn('relative inline-flex group', className)}
      {...props}
    >
      {/* Trigger */}
      <div className="inline-flex" tabIndex={0}>
        {children}
      </div>

      {/* Bubble */}
      <div
        role="tooltip"
        className={cn(
          'absolute z-50 pointer-events-none',
          'whitespace-nowrap rounded-md px-2.5 py-1.5',
          'bg-[#1A0A3E] text-white text-xs font-body leading-tight',
          'opacity-0 group-hover:opacity-100 group-focus-within:opacity-100',
          'transition-opacity duration-150 ease-in-out',
          positionClasses[side],
        )}
      >
        {content}
        {/* Arrow */}
        <span
          className={cn(
            'absolute border-[5px]',
            arrowClasses[side],
          )}
        />
      </div>
    </div>
  ),
);

Tooltip.displayName = 'Tooltip';

export { Tooltip };
export type { TooltipProps, TooltipSide };
