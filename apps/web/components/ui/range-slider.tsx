'use client';

import * as React from 'react';
import { cn } from '@/lib/cn';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface RangeSliderProps {
  min: number;
  max: number;
  step?: number;
  value: number;
  onChange: (value: number) => void;
  label?: string;
  /** Unit suffix shown next to the value, e.g. "%" or "EUR" */
  suffix?: string;
  showValue?: boolean;
  className?: string;
  disabled?: boolean;
  /** Optional marks rendered below the track */
  marks?: { value: number; label: string }[];
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

function RangeSlider({
  min,
  max,
  step = 1,
  value,
  onChange,
  label,
  suffix,
  showValue = true,
  className,
  disabled = false,
  marks,
}: RangeSliderProps) {
  const trackRef = React.useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = React.useState(false);
  const [showTooltip, setShowTooltip] = React.useState(false);

  // Clamp and snap value to step
  const clamp = React.useCallback(
    (v: number) => {
      const clamped = Math.min(max, Math.max(min, v));
      const stepped = Math.round((clamped - min) / step) * step + min;
      // Round to avoid floating point issues
      const decimals = step.toString().split('.')[1]?.length ?? 0;
      return Number(stepped.toFixed(decimals));
    },
    [min, max, step],
  );

  // Convert pixel position to value
  const positionToValue = React.useCallback(
    (clientX: number) => {
      if (!trackRef.current) return value;
      const rect = trackRef.current.getBoundingClientRect();
      const ratio = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
      return clamp(min + ratio * (max - min));
    },
    [min, max, value, clamp],
  );

  // Fill percentage
  const percent = max !== min ? ((value - min) / (max - min)) * 100 : 0;

  // Pointer handlers for drag
  const handlePointerDown = (e: React.PointerEvent) => {
    if (disabled) return;
    e.preventDefault();
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    setIsDragging(true);
    setShowTooltip(true);
    const newVal = positionToValue(e.clientX);
    if (newVal !== value) onChange(newVal);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging || disabled) return;
    const newVal = positionToValue(e.clientX);
    if (newVal !== value) onChange(newVal);
  };

  const handlePointerUp = () => {
    setIsDragging(false);
    setShowTooltip(false);
  };

  // Keyboard handler
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (disabled) return;
    let newVal = value;

    switch (e.key) {
      case 'ArrowRight':
      case 'ArrowUp':
        e.preventDefault();
        newVal = clamp(value + step);
        break;
      case 'ArrowLeft':
      case 'ArrowDown':
        e.preventDefault();
        newVal = clamp(value - step);
        break;
      case 'Home':
        e.preventDefault();
        newVal = min;
        break;
      case 'End':
        e.preventDefault();
        newVal = max;
        break;
      case 'PageUp':
        e.preventDefault();
        newVal = clamp(value + step * 10);
        break;
      case 'PageDown':
        e.preventDefault();
        newVal = clamp(value - step * 10);
        break;
      default:
        return;
    }

    if (newVal !== value) onChange(newVal);
  };

  const sliderId = label ? `slider-${label.toLowerCase().replace(/\s+/g, '-')}` : undefined;

  return (
    <div className={cn('flex flex-col gap-2 w-full', disabled && 'opacity-50', className)}>
      {/* Label + value */}
      {(label || showValue) && (
        <div className="flex items-center justify-between">
          {label && (
            <label
              htmlFor={sliderId}
              className="font-body text-sm font-semibold text-ink-2"
            >
              {label}
            </label>
          )}
          {showValue && (
            <span className="font-mono text-sm font-medium text-violet tabular-nums">
              {value}
              {suffix ? ` ${suffix}` : ''}
            </span>
          )}
        </div>
      )}

      {/* Slider track area */}
      <div
        className="relative py-2 touch-none select-none"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
      >
        {/* Track */}
        <div
          ref={trackRef}
          className="relative h-1.5 rounded-full bg-surface-3"
        >
          {/* Filled track */}
          <div
            className="absolute top-0 left-0 h-full rounded-full bg-gradient-to-r from-violet to-violet-light"
            style={{ width: `${percent}%` }}
          />
        </div>

        {/* Thumb */}
        <div
          id={sliderId}
          role="slider"
          tabIndex={disabled ? -1 : 0}
          aria-valuemin={min}
          aria-valuemax={max}
          aria-valuenow={value}
          aria-label={label}
          aria-disabled={disabled}
          onKeyDown={handleKeyDown}
          onFocus={() => setShowTooltip(true)}
          onBlur={() => {
            if (!isDragging) setShowTooltip(false);
          }}
          onMouseEnter={() => setShowTooltip(true)}
          onMouseLeave={() => {
            if (!isDragging) setShowTooltip(false);
          }}
          className={cn(
            'absolute top-1/2 -translate-y-1/2 -translate-x-1/2',
            'w-4.5 h-4.5 rounded-full',
            'bg-white border-2 border-violet shadow-md',
            'transition-transform duration-150 ease-out',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet/20 focus-visible:ring-offset-2',
            !disabled && 'cursor-grab hover:scale-125',
            isDragging && 'scale-125 cursor-grabbing shadow-violet',
          )}
          style={{
            left: `${percent}%`,
            width: '18px',
            height: '18px',
          }}
        >
          {/* Tooltip */}
          {showTooltip && (
            <div
              className={cn(
                'absolute bottom-full left-1/2 -translate-x-1/2 mb-2',
                'px-2 py-0.5 rounded-md',
                'bg-violet text-white text-xs font-mono font-medium whitespace-nowrap',
                'shadow-sm pointer-events-none',
                'animate-scale-in origin-bottom',
              )}
            >
              {value}
              {suffix || ''}
              {/* Arrow */}
              <div className="absolute top-full left-1/2 -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-l-transparent border-r-transparent border-t-violet" />
            </div>
          )}
        </div>
      </div>

      {/* Marks */}
      {marks && marks.length > 0 && (
        <div className="relative w-full h-5">
          {marks.map((mark) => {
            const markPercent =
              max !== min ? ((mark.value - min) / (max - min)) * 100 : 0;
            return (
              <button
                key={mark.value}
                type="button"
                onClick={() => {
                  if (!disabled) onChange(clamp(mark.value));
                }}
                disabled={disabled}
                className={cn(
                  'absolute -translate-x-1/2 font-body text-xs text-ink-3',
                  'hover:text-violet transition-colors duration-150',
                  'disabled:pointer-events-none',
                  mark.value === value && 'text-violet font-medium',
                )}
                style={{ left: `${markPercent}%` }}
              >
                {mark.label}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

RangeSlider.displayName = 'RangeSlider';

export { RangeSlider };
export type { RangeSliderProps };
