'use client';

import * as React from 'react';
import { createPortal } from 'react-dom';
import { cn } from '@/lib/cn';

// ─── Types ────────────────────────────────────────────────────────────────────

export type SnapPoint = 'peek' | 'half' | 'full';

interface BottomSheetProps {
  /** Controlled open state */
  open: boolean;
  /** Called when the user asks to close (backdrop click, drag-down, Escape) */
  onClose: () => void;
  /** Sheet content */
  children?: React.ReactNode;
  /** Optional title shown in the header */
  title?: string;
  /** Initial snap point — defaults to "half" */
  initialSnap?: SnapPoint;
  /** Allowed snap points — defaults to ['peek', 'half', 'full'] */
  snapPoints?: readonly SnapPoint[];
  /** Close when backdrop is clicked — defaults to true */
  closeOnBackdropClick?: boolean;
  /** Optional extra className */
  className?: string;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const SNAP_HEIGHT_PCT: Record<SnapPoint, number> = {
  peek: 25,
  half: 60,
  full: 92,
};

const DEFAULT_SNAPS: readonly SnapPoint[] = ['peek', 'half', 'full'];

const CLOSE_DRAG_THRESHOLD_PX = 80;
const SNAP_DRAG_THRESHOLD_PX = 40;

// ─── Component ───────────────────────────────────────────────────────────────

export function BottomSheet({
  open,
  onClose,
  children,
  title,
  initialSnap = 'half',
  snapPoints = DEFAULT_SNAPS,
  closeOnBackdropClick = true,
  className,
}: BottomSheetProps) {
  const [mounted, setMounted] = React.useState(false);
  const [currentSnap, setCurrentSnap] = React.useState<SnapPoint>(initialSnap);
  const [dragOffset, setDragOffset] = React.useState<number>(0);
  const dragStartY = React.useRef<number | null>(null);
  const overlayRef = React.useRef<HTMLDivElement>(null);

  // SSR-guard
  React.useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  // Reset snap on open
  React.useEffect(() => {
    if (open) {
      setCurrentSnap(initialSnap);
      setDragOffset(0);
    }
  }, [open, initialSnap]);

  // Escape key
  React.useEffect(() => {
    if (!open) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [open, onClose]);

  // Lock body scroll while open
  React.useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  // Resolve valid snap points
  const resolvedSnaps = React.useMemo(
    () => (snapPoints.length > 0 ? snapPoints : DEFAULT_SNAPS),
    [snapPoints],
  );

  const snapIndex = resolvedSnaps.indexOf(currentSnap);
  const safeIndex = snapIndex >= 0 ? snapIndex : 0;

  const nextSnapUp = (): SnapPoint | null => {
    if (safeIndex >= resolvedSnaps.length - 1) return null;
    return resolvedSnaps[safeIndex + 1] ?? null;
  };

  const nextSnapDown = (): SnapPoint | null => {
    if (safeIndex <= 0) return null;
    return resolvedSnaps[safeIndex - 1] ?? null;
  };

  // Drag handlers (touch + pointer)
  const handleDragStart = React.useCallback((clientY: number) => {
    dragStartY.current = clientY;
  }, []);

  const handleDragMove = React.useCallback((clientY: number) => {
    if (dragStartY.current === null) return;
    const delta = clientY - dragStartY.current;
    // Allow downward drag freely, resist upward drag
    setDragOffset(delta > 0 ? delta : delta * 0.35);
  }, []);

  const handleDragEnd = React.useCallback(() => {
    if (dragStartY.current === null) return;
    const delta = dragOffset;
    dragStartY.current = null;
    if (delta > CLOSE_DRAG_THRESHOLD_PX && currentSnap === resolvedSnaps[0]) {
      setDragOffset(0);
      onClose();
      return;
    }
    if (delta > SNAP_DRAG_THRESHOLD_PX) {
      const next = nextSnapDown();
      if (next) {
        setCurrentSnap(next);
      } else {
        onClose();
      }
    } else if (delta < -SNAP_DRAG_THRESHOLD_PX) {
      const next = nextSnapUp();
      if (next) setCurrentSnap(next);
    }
    setDragOffset(0);
  }, [dragOffset, currentSnap, resolvedSnaps, onClose, nextSnapUp, nextSnapDown]);

  const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    const touch = e.touches[0];
    if (touch) handleDragStart(touch.clientY);
  };
  const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    const touch = e.touches[0];
    if (touch) handleDragMove(touch.clientY);
  };
  const handleTouchEnd = () => handleDragEnd();

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    (e.currentTarget as HTMLDivElement).setPointerCapture(e.pointerId);
    handleDragStart(e.clientY);
  };
  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (dragStartY.current === null) return;
    handleDragMove(e.clientY);
  };
  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    try {
      (e.currentTarget as HTMLDivElement).releasePointerCapture(e.pointerId);
    } catch {
      /* ignore */
    }
    handleDragEnd();
  };

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!closeOnBackdropClick) return;
    if (e.target === overlayRef.current) onClose();
  };

  if (!mounted || !open) return null;

  const heightPct = SNAP_HEIGHT_PCT[currentSnap];
  const transform = `translateY(${dragOffset}px)`;

  return createPortal(
    <div
      ref={overlayRef}
      onClick={handleBackdropClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby={title ? 'bottomsheet-title' : undefined}
      className={cn(
        'fixed inset-0 z-50 flex items-end',
        'bg-ink/40 backdrop-blur-[2px]',
        'animate-in fade-in duration-200',
      )}
    >
      <div
        className={cn(
          'relative w-full bg-white dark:bg-[#1E1636] rounded-t-2xl shadow-2xl',
          'flex flex-col',
          'pb-[env(safe-area-inset-bottom)]',
          'will-change-transform transition-[height,transform] duration-200 ease-out',
          className,
        )}
        style={{
          height: `${heightPct}vh`,
          transform,
          touchAction: 'none',
        }}
      >
        {/* Drag handle */}
        <div
          role="button"
          tabIndex={0}
          aria-label="Déplacer le volet"
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
          onKeyDown={(e) => {
            if (e.key === 'ArrowUp') {
              const next = nextSnapUp();
              if (next) setCurrentSnap(next);
            } else if (e.key === 'ArrowDown') {
              const next = nextSnapDown();
              if (next) setCurrentSnap(next);
              else onClose();
            }
          }}
          className="flex flex-col items-center py-3 cursor-grab active:cursor-grabbing touch-none"
        >
          <span className="w-10 h-1 rounded-full bg-ink-3/30 dark:bg-white/20" />
        </div>

        {title && (
          <header className="px-5 pb-3 border-b border-border/30">
            <h2
              id="bottomsheet-title"
              className="font-display font-bold text-[16px] text-ink dark:text-white leading-tight"
            >
              {title}
            </h2>
          </header>
        )}

        <div className="flex-1 overflow-y-auto overscroll-contain px-5 py-4">
          {children}
        </div>
      </div>
    </div>,
    document.body,
  );
}
