'use client';

import * as React from 'react';
import { createPortal } from 'react-dom';
import { cn } from '@/lib/cn';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children?: React.ReactNode;
  /** Max-width class override, defaults to max-w-md */
  maxWidth?: string;
  className?: string;
}

function Modal({ isOpen, onClose, title, children, maxWidth, className }: ModalProps) {
  const [mounted, setMounted] = React.useState(false);
  const overlayRef = React.useRef<HTMLDivElement>(null);

  // Mount guard for SSR
  React.useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  // Escape key handler
  React.useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Lock body scroll while open
  React.useEffect(() => {
    if (!isOpen) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prevOverflow;
    };
  }, [isOpen]);

  // Click outside to close
  const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === overlayRef.current) {
      onClose();
    }
  };

  if (!mounted || !isOpen) return null;

  return createPortal(
    <div
      ref={overlayRef}
      onClick={handleOverlayClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby={title ? 'modal-title' : undefined}
      className={cn(
        'fixed inset-0 z-50 flex items-center justify-center p-4',
        'bg-ink/40 backdrop-blur-[2px]',
        'animate-in fade-in duration-150',
      )}
    >
      <div
        className={cn(
          'relative w-full bg-white rounded-xl shadow-lg',
          'animate-in zoom-in-95 duration-150',
          maxWidth ?? 'max-w-md',
          className,
        )}
      >
        {/* Header */}
        {title && (
          <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-border">
            <h2
              id="modal-title"
              className="font-display font-bold text-base text-ink leading-snug"
            >
              {title}
            </h2>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close modal"
              className={cn(
                'flex items-center justify-center w-7 h-7 rounded-md text-ink-3',
                'hover:bg-surface-2 hover:text-ink transition-colors duration-150',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet',
              )}
            >
              <CloseIcon />
            </button>
          </div>
        )}

        {/* Close button when no title */}
        {!title && (
          <button
            type="button"
            onClick={onClose}
            aria-label="Close modal"
            className={cn(
              'absolute top-3 right-3 flex items-center justify-center w-7 h-7 rounded-md text-ink-3',
              'hover:bg-surface-2 hover:text-ink transition-colors duration-150',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet',
            )}
          >
            <CloseIcon />
          </button>
        )}

        {/* Content */}
        <div className="p-5">{children}</div>
      </div>
    </div>,
    document.body,
  );
}

function CloseIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 14 14"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <path
        d="M1 1L13 13M13 1L1 13"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
      />
    </svg>
  );
}

export { Modal };
export type { ModalProps };
