'use client';

import * as React from 'react';
import Link from 'next/link';
import { cn } from '@/lib/cn';
import type { LucideIcon } from 'lucide-react';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description?: string;
  actionLabel?: string;
  actionHref?: string;
  onAction?: () => void;
  /** Accent colour for the icon gradient background (default: '#3B1FA8') */
  accentColor?: string;
  className?: string;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

function EmptyState({
  icon: Icon,
  title,
  description,
  actionLabel,
  actionHref,
  onAction,
  accentColor = '#3B1FA8',
  className,
}: EmptyStateProps) {
  // Build the action element (Link or button) only when needed
  const actionElement = React.useMemo(() => {
    if (!actionLabel) return null;

    const sharedClasses = cn(
      'mt-5 inline-flex items-center justify-center',
      'h-9 px-5 text-sm font-body font-semibold',
      'bg-violet text-white rounded-md',
      'hover:bg-violet-dark active:bg-violet-dark',
      'shadow-xs hover:shadow-violet',
      'transition-all duration-150 ease-in-out',
      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet focus-visible:ring-offset-2',
      'cursor-pointer select-none',
      'dark:ring-offset-ink',
    );

    if (actionHref) {
      return (
        <Link href={actionHref} className={sharedClasses}>
          {actionLabel}
        </Link>
      );
    }

    if (onAction) {
      return (
        <button type="button" onClick={onAction} className={sharedClasses}>
          {actionLabel}
        </button>
      );
    }

    return null;
  }, [actionLabel, actionHref, onAction]);

  return (
    <div
      className={cn(
        'relative flex flex-col items-center justify-center py-14 px-6 text-center overflow-hidden',
        className,
      )}
    >
      {/* Subtle radial background pattern */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background: `radial-gradient(ellipse 50% 40% at 50% 30%, ${accentColor}06 0%, transparent 100%)`,
        }}
        aria-hidden="true"
      />

      {/* Dot pattern overlay */}
      <div
        className={cn(
          'pointer-events-none absolute inset-0 opacity-[0.03]',
          'dark:opacity-[0.04]',
        )}
        style={{
          backgroundImage:
            'radial-gradient(circle, currentColor 1px, transparent 1px)',
          backgroundSize: '20px 20px',
        }}
        aria-hidden="true"
      />

      {/* Icon with gradient background */}
      <div className="relative z-10">
        <div
          className="flex items-center justify-center w-14 h-14 rounded-2xl mb-5"
          style={{
            background: `linear-gradient(135deg, ${accentColor}18 0%, ${accentColor}0A 100%)`,
          }}
          aria-hidden="true"
        >
          <div
            className="flex items-center justify-center w-full h-full rounded-2xl"
            style={{
              boxShadow: `inset 0 0 0 1px ${accentColor}12`,
            }}
          >
            <Icon
              size={24}
              strokeWidth={1.8}
              style={{ color: accentColor }}
              className="dark:opacity-90"
            />
          </div>
        </div>
      </div>

      {/* Title */}
      <h3 className="relative z-10 font-display text-base font-bold text-ink dark:text-white leading-snug mb-1.5">
        {title}
      </h3>

      {/* Description */}
      {description && (
        <p className="relative z-10 font-body text-xs text-ink-3 dark:text-white/50 max-w-xs leading-relaxed">
          {description}
        </p>
      )}

      {/* Optional action */}
      {actionElement && <div className="relative z-10">{actionElement}</div>}
    </div>
  );
}

export { EmptyState };
export type { EmptyStateProps };
