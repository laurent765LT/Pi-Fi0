'use client';

import * as React from 'react';
import { createPortal } from 'react-dom';
import { cn } from '@/lib/cn';
import { AlertTriangle, AlertCircle, Info } from 'lucide-react';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface ConfirmDialogProps {
  open: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'danger' | 'warning' | 'info';
  loading?: boolean;
}

// ---------------------------------------------------------------------------
// Variant configuration
// ---------------------------------------------------------------------------

const variantConfig = {
  danger: {
    icon: AlertTriangle,
    iconBg: 'bg-red-light',
    iconColor: 'text-red',
    confirmBg:
      'bg-red text-white hover:opacity-90 active:opacity-80 shadow-xs',
  },
  warning: {
    icon: AlertCircle,
    iconBg: 'bg-gold-light',
    iconColor: 'text-gold',
    confirmBg:
      'bg-gold text-white hover:opacity-90 active:opacity-80 shadow-xs',
  },
  info: {
    icon: Info,
    iconBg: 'bg-violet-pale',
    iconColor: 'text-violet',
    confirmBg:
      'bg-violet text-white hover:bg-violet-dark active:bg-violet-dark shadow-xs hover:shadow-violet',
  },
} as const;

// ---------------------------------------------------------------------------
// Spinner
// ---------------------------------------------------------------------------

function Spinner() {
  return (
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
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

function ConfirmDialog({
  open,
  onConfirm,
  onCancel,
  title,
  description,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  variant = 'danger',
  loading = false,
}: ConfirmDialogProps) {
  const [mounted, setMounted] = React.useState(false);
  const cancelRef = React.useRef<HTMLButtonElement>(null);
  const overlayRef = React.useRef<HTMLDivElement>(null);

  // SSR mount guard
  React.useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  // Auto-focus cancel button as the safe default
  React.useEffect(() => {
    if (open) {
      // Slight delay to ensure the portal has rendered
      const timer = setTimeout(() => {
        cancelRef.current?.focus();
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [open]);

  // Escape key handler
  React.useEffect(() => {
    if (!open) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onCancel();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [open, onCancel]);

  // Lock body scroll
  React.useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  // Click outside to cancel
  const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === overlayRef.current) {
      onCancel();
    }
  };

  if (!mounted || !open) return null;

  const config = variantConfig[variant];
  const Icon = config.icon;

  return createPortal(
    <div
      ref={overlayRef}
      onClick={handleOverlayClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-dialog-title"
      aria-describedby={description ? 'confirm-dialog-desc' : undefined}
      className={cn(
        'fixed inset-0 z-50 flex items-center justify-center p-4',
        'bg-ink/40 backdrop-blur-[2px]',
        'animate-fade-in',
      )}
    >
      <div
        className={cn(
          'relative w-full max-w-sm bg-white rounded-xl shadow-lg',
          'animate-scale-in',
        )}
      >
        <div className="p-5">
          {/* Icon */}
          <div
            className={cn(
              'flex items-center justify-center w-10 h-10 rounded-lg mb-4',
              config.iconBg,
            )}
          >
            <Icon className={cn('w-5 h-5', config.iconColor)} />
          </div>

          {/* Title */}
          <h2
            id="confirm-dialog-title"
            className="font-display font-bold text-base text-ink leading-snug"
          >
            {title}
          </h2>

          {/* Description */}
          {description && (
            <p
              id="confirm-dialog-desc"
              className="mt-2 font-body text-sm text-ink-3 leading-relaxed"
            >
              {description}
            </p>
          )}

          {/* Actions */}
          <div className="flex items-center gap-3 mt-5">
            <button
              ref={cancelRef}
              type="button"
              onClick={onCancel}
              disabled={loading}
              className={cn(
                'flex-1 inline-flex items-center justify-center h-9 px-4',
                'font-body text-sm font-semibold rounded-md',
                'border border-violet text-violet bg-transparent',
                'hover:bg-violet-pale active:bg-violet-pale',
                'transition-all duration-150 ease-in-out',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet focus-visible:ring-offset-2',
                'disabled:pointer-events-none disabled:opacity-45',
              )}
            >
              {cancelLabel}
            </button>

            <button
              type="button"
              onClick={onConfirm}
              disabled={loading}
              className={cn(
                'flex-1 inline-flex items-center justify-center gap-2 h-9 px-4',
                'font-body text-sm font-semibold rounded-md',
                'transition-all duration-150 ease-in-out',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet focus-visible:ring-offset-2',
                'disabled:pointer-events-none disabled:opacity-45',
                config.confirmBg,
              )}
            >
              {loading && <Spinner />}
              {confirmLabel}
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}

ConfirmDialog.displayName = 'ConfirmDialog';

export { ConfirmDialog };
export type { ConfirmDialogProps };
