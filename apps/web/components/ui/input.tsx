'use client';

import * as React from 'react';
import { cn } from '@/lib/cn';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  hint?: string;
  error?: string;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ label, hint, error, className, id, ...props }, ref) => {
    const inputId = id ?? (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

    return (
      <div className="flex flex-col gap-1.5 w-full">
        {label && (
          <label
            htmlFor={inputId}
            className="font-body text-[13px] font-semibold text-ink-2"
          >
            {label}
          </label>
        )}

        <input
          ref={ref}
          id={inputId}
          className={cn(
            'w-full rounded-md bg-surface-2 border border-border-2 font-body text-sm text-ink',
            'px-3 h-9',
            'placeholder:text-ink-3',
            'transition-all duration-150',
            'focus:outline-none focus:ring-2 focus:ring-violet focus:ring-offset-0 focus:border-violet',
            'disabled:pointer-events-none disabled:opacity-50',
            error && 'border-red focus:ring-red',
            className,
          )}
          aria-invalid={error ? true : undefined}
          aria-describedby={
            error
              ? `${inputId}-error`
              : hint
              ? `${inputId}-hint`
              : undefined
          }
          {...props}
        />

        {hint && !error && (
          <p id={`${inputId}-hint`} className="font-body text-xs text-ink-3">
            {hint}
          </p>
        )}

        {error && (
          <p id={`${inputId}-error`} className="font-body text-xs text-red font-medium">
            {error}
          </p>
        )}
      </div>
    );
  },
);

Input.displayName = 'Input';

export { Input };
export type { InputProps };
