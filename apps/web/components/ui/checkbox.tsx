'use client';

import * as React from 'react';
import { cn } from '@/lib/cn';
import { Check, Minus } from 'lucide-react';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface CheckboxProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: string;
  description?: string;
  disabled?: boolean;
  indeterminate?: boolean;
  className?: string;
}

interface CheckboxGroupProps {
  options: { value: string; label: string; description?: string }[];
  value: string[];
  onChange: (value: string[]) => void;
  label?: string;
  className?: string;
}

// ---------------------------------------------------------------------------
// Checkbox
// ---------------------------------------------------------------------------

function Checkbox({
  checked,
  onChange,
  label,
  description,
  disabled = false,
  indeterminate = false,
  className,
}: CheckboxProps) {
  const inputRef = React.useRef<HTMLInputElement>(null);

  // Sync the indeterminate property (not controllable via HTML attribute)
  React.useEffect(() => {
    if (inputRef.current) {
      inputRef.current.indeterminate = indeterminate;
    }
  }, [indeterminate]);

  const isActive = checked || indeterminate;
  const checkboxId = React.useId();

  return (
    <label
      htmlFor={checkboxId}
      className={cn(
        'group inline-flex items-start gap-2.5 select-none',
        disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer',
        className,
      )}
    >
      {/* Hidden native checkbox */}
      <input
        ref={inputRef}
        id={checkboxId}
        type="checkbox"
        checked={checked}
        disabled={disabled}
        onChange={(e) => onChange(e.target.checked)}
        className="sr-only peer"
        aria-checked={indeterminate ? 'mixed' : checked}
      />

      {/* Custom checkbox visual */}
      <span
        className={cn(
          'relative flex-shrink-0 flex items-center justify-center',
          'w-[18px] h-[18px] mt-0.5 rounded-[5px]',
          'border-2 transition-all duration-150 ease-out',
          // Unchecked
          !isActive && [
            'border-border-2 bg-white',
            !disabled && 'group-hover:border-violet-light',
          ],
          // Checked / indeterminate
          isActive && [
            'border-violet bg-gradient-to-br from-violet to-violet-mid',
            'shadow-xs',
          ],
          // Focus ring (peer-focus-visible targets the hidden input's focus)
          'peer-focus-visible:ring-2 peer-focus-visible:ring-violet/20 peer-focus-visible:ring-offset-2',
        )}
        aria-hidden="true"
      >
        {/* Check icon */}
        {checked && !indeterminate && (
          <Check
            className="w-3 h-3 text-white animate-scale-in"
            strokeWidth={3}
          />
        )}

        {/* Indeterminate dash */}
        {indeterminate && (
          <Minus
            className="w-3 h-3 text-white animate-scale-in"
            strokeWidth={3}
          />
        )}
      </span>

      {/* Label + description */}
      {(label || description) && (
        <div className="flex flex-col gap-0.5 min-w-0">
          {label && (
            <span className="font-body text-sm font-medium text-ink leading-snug">
              {label}
            </span>
          )}
          {description && (
            <span className="font-body text-xs text-ink-3 leading-relaxed">
              {description}
            </span>
          )}
        </div>
      )}
    </label>
  );
}

Checkbox.displayName = 'Checkbox';

// ---------------------------------------------------------------------------
// CheckboxGroup
// ---------------------------------------------------------------------------

function CheckboxGroup({
  options,
  value,
  onChange,
  label,
  className,
}: CheckboxGroupProps) {
  const handleToggle = React.useCallback(
    (optionValue: string, checked: boolean) => {
      if (checked) {
        onChange([...value, optionValue]);
      } else {
        onChange(value.filter((v) => v !== optionValue));
      }
    },
    [value, onChange],
  );

  return (
    <fieldset className={cn('flex flex-col gap-3', className)}>
      {label && (
        <legend className="font-body text-sm font-semibold text-ink-2 mb-1">
          {label}
        </legend>
      )}
      {options.map((option) => (
        <Checkbox
          key={option.value}
          checked={value.includes(option.value)}
          onChange={(checked) => handleToggle(option.value, checked)}
          label={option.label}
          description={option.description}
        />
      ))}
    </fieldset>
  );
}

CheckboxGroup.displayName = 'CheckboxGroup';

export { Checkbox, CheckboxGroup };
export type { CheckboxProps, CheckboxGroupProps };
