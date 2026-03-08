'use client';

import * as React from 'react';
import { createPortal } from 'react-dom';
import { cn } from '@/lib/cn';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type ToastType = 'success' | 'info' | 'warning' | 'error';

interface ToastItem {
  id: string;
  type: ToastType;
  title?: string;
  message: string;
  /** Auto-dismiss delay in ms. Pass 0 to disable. Defaults to 5000. */
  duration?: number;
}

// ---------------------------------------------------------------------------
// Internal config
// ---------------------------------------------------------------------------

const typeConfig: Record<
  ToastType,
  { borderColor: string; iconColor: string; icon: React.ReactNode }
> = {
  success: {
    borderColor: 'border-l-teal',
    iconColor: 'text-teal',
    icon: <CheckCircleIcon />,
  },
  info: {
    borderColor: 'border-l-violet',
    iconColor: 'text-violet',
    icon: <InfoIcon />,
  },
  warning: {
    borderColor: 'border-l-gold',
    iconColor: 'text-gold',
    icon: <WarningIcon />,
  },
  error: {
    borderColor: 'border-l-red',
    iconColor: 'text-red',
    icon: <ErrorIcon />,
  },
};

// ---------------------------------------------------------------------------
// Single Toast card
// ---------------------------------------------------------------------------

interface ToastCardProps {
  toast: ToastItem;
  onDismiss: (id: string) => void;
}

function ToastCard({ toast, onDismiss }: ToastCardProps) {
  const { borderColor, iconColor, icon } = typeConfig[toast.type];
  const duration = toast.duration ?? 5000;

  // Auto-dismiss timer
  React.useEffect(() => {
    if (duration <= 0) return;
    const timer = setTimeout(() => onDismiss(toast.id), duration);
    return () => clearTimeout(timer);
  }, [toast.id, duration, onDismiss]);

  return (
    <div
      role="alert"
      aria-live="assertive"
      aria-atomic="true"
      className={cn(
        'relative flex items-start gap-3 w-full max-w-sm',
        'bg-white rounded-lg shadow-md border border-border',
        'border-l-4',
        borderColor,
        'animate-in slide-in-from-right-5 fade-in duration-200',
      )}
      style={{ padding: '12px 14px' }}
    >
      {/* Icon */}
      <span className={cn('mt-0.5 shrink-0', iconColor)}>{icon}</span>

      {/* Body */}
      <div className="flex-1 min-w-0">
        {toast.title && (
          <p className="font-body font-semibold text-sm text-ink leading-snug mb-0.5">
            {toast.title}
          </p>
        )}
        <p className="font-body text-sm text-ink-2 leading-snug">{toast.message}</p>
      </div>

      {/* Dismiss button */}
      <button
        type="button"
        aria-label="Dismiss notification"
        onClick={() => onDismiss(toast.id)}
        className={cn(
          'shrink-0 mt-0.5 text-ink-3 hover:text-ink transition-colors',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet rounded-sm',
        )}
      >
        <DismissIcon />
      </button>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Toast container (renders into portal)
// ---------------------------------------------------------------------------

interface ToastContainerProps {
  toasts: ToastItem[];
  onDismiss: (id: string) => void;
}

function ToastContainer({ toasts, onDismiss }: ToastContainerProps) {
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  if (!mounted || toasts.length === 0) return null;

  return createPortal(
    <div
      aria-label="Notifications"
      className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 items-end pointer-events-none"
    >
      {toasts.map((t) => (
        <div key={t.id} className="pointer-events-auto">
          <ToastCard toast={t} onDismiss={onDismiss} />
        </div>
      ))}
    </div>,
    document.body,
  );
}

// ---------------------------------------------------------------------------
// useToast hook
// ---------------------------------------------------------------------------

function useToast() {
  const [toasts, setToasts] = React.useState<ToastItem[]>([]);

  const dismiss = React.useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const toast = React.useCallback(
    (
      message: string,
      options?: Partial<Omit<ToastItem, 'id' | 'message'>>,
    ) => {
      const id = Math.random().toString(36).slice(2);
      setToasts((prev) => [
        ...prev,
        { id, message, type: 'info', ...options },
      ]);
      return id;
    },
    [],
  );

  const success = React.useCallback(
    (message: string, opts?: Partial<Omit<ToastItem, 'id' | 'message' | 'type'>>) =>
      toast(message, { type: 'success', ...opts }),
    [toast],
  );

  const error = React.useCallback(
    (message: string, opts?: Partial<Omit<ToastItem, 'id' | 'message' | 'type'>>) =>
      toast(message, { type: 'error', ...opts }),
    [toast],
  );

  const warning = React.useCallback(
    (message: string, opts?: Partial<Omit<ToastItem, 'id' | 'message' | 'type'>>) =>
      toast(message, { type: 'warning', ...opts }),
    [toast],
  );

  const info = React.useCallback(
    (message: string, opts?: Partial<Omit<ToastItem, 'id' | 'message' | 'type'>>) =>
      toast(message, { type: 'info', ...opts }),
    [toast],
  );

  return { toasts, toast, success, error, warning, info, dismiss };
}

// ---------------------------------------------------------------------------
// SVG Icons
// ---------------------------------------------------------------------------

function CheckCircleIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <circle cx="8" cy="8" r="7" stroke="currentColor" strokeWidth="1.5" />
      <path d="M5 8l2 2 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function InfoIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <circle cx="8" cy="8" r="7" stroke="currentColor" strokeWidth="1.5" />
      <path d="M8 7v4M8 5.5v.01" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

function WarningIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path d="M8 2L14.5 13.5H1.5L8 2z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
      <path d="M8 6v3.5M8 11v.01" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

function ErrorIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <circle cx="8" cy="8" r="7" stroke="currentColor" strokeWidth="1.5" />
      <path d="M6 6l4 4M10 6l-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

function DismissIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
      <path d="M1 1l10 10M11 1L1 11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

export { ToastContainer, useToast };
export type { ToastItem, ToastType, ToastContainerProps };
