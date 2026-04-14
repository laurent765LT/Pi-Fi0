'use client';

import * as React from 'react';
import { createPortal } from 'react-dom';
import { cn } from '@/lib/cn';
import { X } from 'lucide-react';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface SheetProps {
  open: boolean;
  onClose: () => void;
  side?: 'left' | 'right' | 'bottom';
  title?: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
  /** CSS width value for left/right sheets (default: 400px) */
  width?: string;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const slideClasses: Record<'left' | 'right' | 'bottom', { base: string; open: string; closed: string }> = {
  right: {
    base: 'top-0 right-0 h-full',
    open: 'translate-x-0',
    closed: 'translate-x-full',
  },
  left: {
    base: 'top-0 left-0 h-full',
    open: 'translate-x-0',
    closed: '-translate-x-full',
  },
  bottom: {
    base: 'bottom-0 left-0 right-0',
    open: 'translate-y-0',
    closed: 'translate-y-full',
  },
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

function Sheet({
  open,
  onClose,
  side = 'right',
  title,
  description,
  children,
  className,
  width = '400px',
}: SheetProps) {
  const [mounted, setMounted] = React.useState(false);
  const [visible, setVisible] = React.useState(false);
  const sheetRef = React.useRef<HTMLDivElement>(null);
  const previousFocus = React.useRef<HTMLElement | null>(null);

  // SSR mount guard
  React.useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  // Animate open/close: delay the CSS transition trigger by a frame
  React.useEffect(() => {
    if (open) {
      // Store the element that had focus before opening
      previousFocus.current = document.activeElement as HTMLElement;
      // Trigger the slide-in after the portal renders
      requestAnimationFrame(() => {
        setVisible(true);
      });
    } else {
      setVisible(false);
    }
  }, [open]);

  // Escape key handler
  React.useEffect(() => {
    if (!open) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [open, onClose]);

  // Lock body scroll
  React.useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  // Focus trap: cycle tab within sheet
  React.useEffect(() => {
    if (!open || !sheetRef.current) return;

    // Focus the sheet itself on open
    const timer = setTimeout(() => {
      sheetRef.current?.focus();
    }, 50);

    const handleTab = (e: KeyboardEvent) => {
      if (e.key !== 'Tab' || !sheetRef.current) return;

      const focusable = sheetRef.current.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])',
      );

      if (focusable.length === 0) {
        e.preventDefault();
        return;
      }

      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('keydown', handleTab);
    return () => {
      clearTimeout(timer);
      document.removeEventListener('keydown', handleTab);
      // Restore focus when closing
      previousFocus.current?.focus();
    };
  }, [open]);

  // Restore focus on close
  const handleTransitionEnd = () => {
    if (!visible && !open) {
      previousFocus.current?.focus();
    }
  };

  if (!mounted || !open) return null;

  const slide = slideClasses[side];
  const isHorizontal = side === 'left' || side === 'right';

  return createPortal(
    <div className="fixed inset-0 z-50" aria-hidden={!open}>
      {/* Backdrop */}
      <div
        onClick={onClose}
        className={cn(
          'absolute inset-0 bg-black/30 backdrop-blur-sm',
          'transition-opacity duration-300 ease-out',
          visible ? 'opacity-100' : 'opacity-0',
        )}
        aria-hidden="true"
      />

      {/* Sheet panel */}
      <div
        ref={sheetRef}
        role="dialog"
        aria-modal="true"
        aria-label={title || 'Sheet'}
        tabIndex={-1}
        onTransitionEnd={handleTransitionEnd}
        style={isHorizontal ? { width } : undefined}
        className={cn(
          'fixed flex flex-col bg-white shadow-xl',
          'transition-transform duration-300 ease-out',
          'focus:outline-none',
          slide.base,
          visible ? slide.open : slide.closed,
          isHorizontal ? 'max-w-[90vw]' : 'max-h-[85vh] rounded-t-xl',
          className,
        )}
      >
        {/* Header */}
        <div className="flex items-start justify-between px-5 pt-5 pb-4 border-b border-border">
          <div className="flex-1 min-w-0 pr-4">
            {title && (
              <h2 className="font-display font-bold text-base text-ink leading-snug truncate">
                {title}
              </h2>
            )}
            {description && (
              <p className="mt-1 font-body text-sm text-ink-3 leading-relaxed">
                {description}
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close sheet"
            className={cn(
              'flex-shrink-0 flex items-center justify-center w-8 h-8 rounded-lg text-ink-3',
              'hover:bg-surface-2 hover:text-ink transition-colors duration-150',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet',
            )}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5">{children}</div>
      </div>
    </div>,
    document.body,
  );
}

Sheet.displayName = 'Sheet';

export { Sheet };
export type { SheetProps };
