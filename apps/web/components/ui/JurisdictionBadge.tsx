'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { ChevronDown, Check } from 'lucide-react';
import { cn } from '@/lib/cn';
import {
  useJurisdictionStore,
  type Jurisdiction,
} from '@/stores/jurisdiction-store';
import { JURISDICTION_CONFIGS } from '@/lib/regulatory/jurisdiction-rules';

// ─── Props ──────────────────────────────────────────────────────────────────

export interface JurisdictionBadgeProps {
  /** Compact layout, flag only, used in tight corners (e.g. collapsed sidebar). */
  compact?: boolean;
  /** When true, clicking opens a dropdown to switch jurisdiction. */
  interactive?: boolean;
  className?: string;
}

// ─── Badge ──────────────────────────────────────────────────────────────────

export function JurisdictionBadge({
  compact = false,
  interactive = true,
  className,
}: JurisdictionBadgeProps) {
  const current = useJurisdictionStore((s) => s.current);
  const setJurisdiction = useJurisdictionStore((s) => s.setJurisdiction);

  const [open, setOpen] = useState(false);
  const [hydrated, setHydrated] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  // Wait for hydration so SSR / first-client render match
  useEffect(() => {
    setHydrated(true);
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, [open]);

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open]);

  const handleSelect = useCallback(
    (j: Jurisdiction) => {
      setJurisdiction(j);
      setOpen(false);
    },
    [setJurisdiction],
  );

  const cfg = JURISDICTION_CONFIGS[current];

  // SSR-safe: render a tiny stub until we are hydrated to avoid flash.
  if (!hydrated) {
    return (
      <span
        aria-hidden="true"
        className={cn(
          'inline-flex items-center gap-1 h-6 px-2 rounded-full text-[10px] bg-surface-2/40 text-ink-3',
          className,
        )}
      >
        <span className="opacity-0">--</span>
      </span>
    );
  }

  const triggerLabel = compact
    ? `${cfg.flag}`
    : `${cfg.flag} ${cfg.name} (${cfg.regulator})`;

  const triggerClasses = cn(
    'inline-flex items-center gap-1.5 h-7 px-2.5 rounded-full',
    'border border-border/60 bg-white/80 dark:bg-white/5 backdrop-blur-sm',
    'font-body text-[11px] font-semibold text-ink-2 dark:text-white',
    'transition-colors duration-150',
    interactive && 'hover:border-[#3B1FA8]/40 hover:text-[#3B1FA8] cursor-pointer',
    !interactive && 'cursor-default',
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3B1FA8]/40 focus-visible:ring-offset-1',
    className,
  );

  if (!interactive) {
    return (
      <span
        className={triggerClasses}
        title={`${cfg.name} \u2014 ${cfg.regulatorFullName}`}
      >
        <span aria-hidden="true">{triggerLabel}</span>
      </span>
    );
  }

  return (
    <div ref={rootRef} className="relative inline-block">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={`Juridiction actuelle : ${cfg.name} (${cfg.regulator}). Changer de juridiction.`}
        title={`${cfg.name} \u2014 ${cfg.regulatorFullName}`}
        className={triggerClasses}
      >
        <span aria-hidden="true">{triggerLabel}</span>
        {!compact && (
          <ChevronDown
            size={11}
            className={cn(
              'text-ink-3 transition-transform duration-150',
              open && 'rotate-180',
            )}
          />
        )}
      </button>

      {open && (
        <div
          role="listbox"
          className={cn(
            'absolute right-0 top-[calc(100%+4px)] z-50 min-w-[220px]',
            'rounded-xl border border-border/60 bg-white dark:bg-ink shadow-lg',
            'py-1',
          )}
        >
          {(['FR', 'LU', 'BE', 'CH'] as Jurisdiction[]).map((j) => {
            const c = JURISDICTION_CONFIGS[j];
            const selected = j === current;
            return (
              <button
                key={j}
                type="button"
                role="option"
                aria-selected={selected}
                onClick={() => handleSelect(j)}
                className={cn(
                  'w-full flex items-center gap-2.5 px-3 py-2 text-left',
                  'font-body text-[12px] transition-colors duration-100',
                  selected
                    ? 'bg-[#3B1FA8]/[0.08] text-[#3B1FA8]'
                    : 'text-ink-2 hover:bg-ink/[0.04] hover:text-ink',
                )}
              >
                <span className="text-base leading-none" aria-hidden="true">
                  {c.flag}
                </span>
                <span className="flex-1 min-w-0">
                  <span className="block font-semibold leading-tight">
                    {c.name}
                  </span>
                  <span className="block text-[10px] text-ink-3 mt-0.5">
                    {c.regulator} &middot; {c.currency} &middot; {c.registryName}
                  </span>
                </span>
                {selected && (
                  <Check size={13} className="text-[#3B1FA8] shrink-0" />
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
