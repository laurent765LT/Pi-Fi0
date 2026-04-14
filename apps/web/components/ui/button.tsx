'use client';

import * as React from 'react';
import { cn } from '@/lib/cn';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type ButtonVariant =
  | 'primary'
  | 'cobalt'
  | 'outline'
  | 'ghost'
  | 'teal'
  | 'danger'
  | 'muted';

type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  /**
   * When true, show a spinner and disable the button.
   */
  loading?: boolean;
  /**
   * When true, the Button renders its child element directly, merging its
   * own props onto it. Useful for rendering a Next.js <Link> styled as a
   * button without wrapping it in an extra DOM node.
   */
  asChild?: boolean;
  children?: React.ReactNode;
}

// ---------------------------------------------------------------------------
// Variant & size maps
// ---------------------------------------------------------------------------

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    'bg-violet text-white hover:bg-violet-dark active:bg-violet-dark shadow-xs hover:shadow-violet',
  cobalt:
    'bg-cobalt text-white hover:bg-cobalt-mid active:bg-cobalt shadow-xs',
  outline:
    'border border-violet text-violet bg-transparent hover:bg-violet-pale active:bg-violet-pale',
  ghost:
    'bg-violet-pale text-violet hover:bg-[#DDD5FF] active:bg-[#CFC5FF]',
  teal:
    'bg-teal text-white hover:opacity-90 active:opacity-80 shadow-xs',
  danger:
    'bg-red text-white hover:opacity-90 active:opacity-80 shadow-xs',
  muted:
    'bg-surface-2 text-ink-3 border border-border hover:bg-surface hover:text-ink-2 active:bg-surface',
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: 'h-7 px-3 text-xs gap-1.5',
  md: 'h-9 px-4 text-sm gap-2',
  lg: 'h-11 px-5 text-base gap-2',
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

const Spinner = () => (
  <svg
    className="animate-spin"
    width="14"
    height="14"
    viewBox="0 0 14 14"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden="true"
  >
    <circle
      cx="7"
      cy="7"
      r="5.5"
      stroke="currentColor"
      strokeOpacity="0.25"
      strokeWidth="2"
    />
    <path
      d="M12.5 7a5.5 5.5 0 0 0-5.5-5.5"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
    />
  </svg>
);

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = 'primary',
      size = 'md',
      loading = false,
      asChild = false,
      className,
      children,
      disabled,
      ...props
    },
    ref,
  ) => {
    const isDisabled = disabled || loading;

    const baseClasses = cn(
      // layout
      'inline-flex items-center justify-center',
      // typography
      'font-body font-semibold',
      // shape
      'rounded-md',
      // interaction
      'transition-all duration-150 ease-in-out',
      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet focus-visible:ring-offset-2',
      'select-none whitespace-nowrap cursor-pointer',
      // disabled
      'disabled:pointer-events-none disabled:opacity-45',
      variantClasses[variant],
      sizeClasses[size],
      className,
    );

    // asChild: clone the single child element and forward all button props onto it
    if (asChild && React.isValidElement(children)) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return React.cloneElement(children as React.ReactElement<any>, {
        ...props,
        ref,
        className: cn(baseClasses, (children.props as { className?: string }).className),
      });
    }

    return (
      <button
        ref={ref}
        disabled={isDisabled}
        className={baseClasses}
        {...props}
      >
        {loading && <Spinner />}
        {children}
      </button>
    );
  },
);

Button.displayName = 'Button';

export { Button };
export type { ButtonProps, ButtonVariant, ButtonSize };
