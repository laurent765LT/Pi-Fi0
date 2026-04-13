'use client';

import * as React from 'react';
import { cn } from '@/lib/cn';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type AlertVariant = 'info' | 'success' | 'warning' | 'error';

interface AlertProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: AlertVariant;
  title?: string;
  /** Optional custom icon — if omitted, a default SVG per variant is used */
  icon?: React.ReactNode;
  /** Callback to render a dismiss (X) button */
  onDismiss?: () => void;
  children?: React.ReactNode;
}

// ---------------------------------------------------------------------------
// Variant style maps
// ---------------------------------------------------------------------------

const variantStyles: Record<AlertVariant, string> = {
  info: 'bg-violet-pale border-violet/30 text-violet',
  success: 'bg-teal/10 border-teal/30 text-teal',
  warning: 'bg-gold/10 border-gold/30 text-[#9A7510]',
  error: 'bg-red/10 border-red/30 text-red',
};

const variantIconColor: Record<AlertVariant, string> = {
  info: 'text-violet',
  success: 'text-teal',
  warning: 'text-[#D4A017]',
  error: 'text-red',
};

// ---------------------------------------------------------------------------
// Default icons (inline SVGs to avoid external deps)
// ---------------------------------------------------------------------------

const InfoIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" />
    <line x1="12" y1="16" x2="12" y2="12" />
    <line x1="12" y1="8" x2="12.01" y2="8" />
  </svg>
);

const CheckIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
    <polyline points="22 4 12 14.01 9 11.01" />
  </svg>
);

const WarningIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
    <line x1="12" y1="9" x2="12" y2="13" />
    <line x1="12" y1="17" x2="12.01" y2="17" />
  </svg>
);

const ErrorIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" />
    <line x1="15" y1="9" x2="9" y2="15" />
    <line x1="9" y1="9" x2="15" y2="15" />
  </svg>
);

const defaultIcons: Record<AlertVariant, React.ReactNode> = {
  info: <InfoIcon />,
  success: <CheckIcon />,
  warning: <WarningIcon />,
  error: <ErrorIcon />,
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

const Alert = React.forwardRef<HTMLDivElement, AlertProps>(
  (
    {
      variant = 'info',
      title,
      icon,
      onDismiss,
      className,
      children,
      ...props
    },
    ref,
  ) => (
    <div
      ref={ref}
      role="alert"
      className={cn(
        'relative flex gap-3 rounded-lg border p-4 font-body text-sm',
        variantStyles[variant],
        className,
      )}
      {...props}
    >
      {/* Icon */}
      <span
        className={cn(
          'flex-shrink-0 mt-0.5',
          variantIconColor[variant],
        )}
      >
        {icon ?? defaultIcons[variant]}
      </span>

      {/* Content */}
      <div className="flex-1 min-w-0">
        {title && (
          <p className="font-semibold mb-1 leading-snug">{title}</p>
        )}
        {children && <div className="leading-relaxed opacity-90">{children}</div>}
      </div>

      {/* Dismiss button */}
      {onDismiss && (
        <button
          type="button"
          onClick={onDismiss}
          aria-label="Dismiss"
          className={cn(
            'flex-shrink-0 p-0.5 rounded-md transition-colors',
            'hover:bg-black/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-current',
          )}
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      )}
    </div>
  ),
);

Alert.displayName = 'Alert';

export { Alert };
export type { AlertProps, AlertVariant };
