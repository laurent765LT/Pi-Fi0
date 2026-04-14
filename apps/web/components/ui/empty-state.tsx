'use client';

import * as React from 'react';
import { cn } from '@/lib/cn';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface EmptyStateAction {
  label: string;
  onClick: () => void;
}

interface EmptyStateProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  action?: EmptyStateAction;
  className?: string;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

function EmptyState({ icon, title, description, action, className }: EmptyStateProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center py-12 px-6 text-center',
        className,
      )}
    >
      {/* Icon circle */}
      <div
        className={cn(
          'flex items-center justify-center w-16 h-16 rounded-full',
          'bg-violet-pale text-violet',
          'mb-5',
        )}
        aria-hidden="true"
      >
        {icon}
      </div>

      {/* Title */}
      <h3 className="font-display font-bold text-base text-ink leading-snug mb-1.5">
        {title}
      </h3>

      {/* Description */}
      <p className="font-body text-sm text-ink-3 max-w-xs leading-relaxed">
        {description}
      </p>

      {/* Optional CTA */}
      {action && (
        <button
          type="button"
          onClick={action.onClick}
          className={cn(
            'mt-5 inline-flex items-center justify-center',
            'h-9 px-4 text-sm font-body font-semibold',
            'bg-violet text-white rounded-md',
            'hover:bg-violet-dark active:bg-violet-dark',
            'shadow-xs hover:shadow-violet',
            'transition-all duration-150 ease-in-out',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet focus-visible:ring-offset-2',
            'cursor-pointer select-none',
          )}
        >
          {action.label}
        </button>
      )}
    </div>
  );
}

export { EmptyState };
export type { EmptyStateProps, EmptyStateAction };
