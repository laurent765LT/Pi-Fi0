'use client';

import * as React from 'react';
import { cn } from '@/lib/cn';

// ---------------------------------------------------------------------------
// DropdownSeparator
// ---------------------------------------------------------------------------

const DropdownSeparator = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn('my-1 h-px bg-border', className)}
    role="separator"
    {...props}
  />
));

DropdownSeparator.displayName = 'DropdownSeparator';

// ---------------------------------------------------------------------------
// DropdownItem
// ---------------------------------------------------------------------------

interface DropdownItemProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  icon?: React.ReactNode;
  label: string;
  /** Renders with red/danger styling */
  danger?: boolean;
}

const DropdownItem = React.forwardRef<HTMLButtonElement, DropdownItemProps>(
  ({ icon, label, danger = false, className, ...props }, ref) => (
    <button
      ref={ref}
      type="button"
      className={cn(
        'flex w-full items-center gap-2.5 rounded-md px-3 py-2 text-sm font-body',
        'transition-colors duration-100 text-left',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet focus-visible:ring-inset',
        danger
          ? 'text-red hover:bg-red/10'
          : 'text-ink hover:bg-surface-2',
        'disabled:pointer-events-none disabled:opacity-45',
        className,
      )}
      {...props}
    >
      {icon && <span className="flex-shrink-0 w-4 h-4">{icon}</span>}
      <span className="truncate">{label}</span>
    </button>
  ),
);

DropdownItem.displayName = 'DropdownItem';

// ---------------------------------------------------------------------------
// Dropdown (container)
// ---------------------------------------------------------------------------

interface DropdownProps {
  /** Element that toggles the menu (e.g. a Button) */
  trigger: React.ReactNode;
  /** Menu content — use DropdownItem & DropdownSeparator */
  children: React.ReactNode;
  /** Horizontal alignment of the menu relative to the trigger */
  align?: 'left' | 'right';
  className?: string;
}

function Dropdown({ trigger, children, align = 'left', className }: DropdownProps) {
  const [open, setOpen] = React.useState(false);
  const containerRef = React.useRef<HTMLDivElement>(null);

  // Close on click-outside
  React.useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [open]);

  // Close on Escape
  React.useEffect(() => {
    if (!open) return;
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false);
    }
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [open]);

  return (
    <div ref={containerRef} className={cn('relative inline-flex', className)}>
      {/* Trigger */}
      <div
        onClick={() => setOpen((prev) => !prev)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            setOpen((prev) => !prev);
          }
        }}
        role="button"
        tabIndex={0}
        aria-haspopup="true"
        aria-expanded={open}
      >
        {trigger}
      </div>

      {/* Menu panel */}
      <div
        className={cn(
          'absolute z-50 mt-1.5 top-full min-w-[180px]',
          'rounded-lg border border-border bg-white p-1 shadow-lg',
          'origin-top transition-all duration-150 ease-out',
          align === 'right' ? 'right-0' : 'left-0',
          open
            ? 'scale-100 opacity-100'
            : 'scale-95 opacity-0 pointer-events-none',
        )}
        role="menu"
      >
        {children}
      </div>
    </div>
  );
}

Dropdown.displayName = 'Dropdown';

export { Dropdown, DropdownItem, DropdownSeparator };
export type { DropdownProps, DropdownItemProps };
