'use client';

import { Check, X, Info } from 'lucide-react';
import { cn } from '@/lib/cn';
import type { ComparisonRow as ComparisonRowData, CompetitorCell } from '@/lib/marketing/comparisons';

interface ComparisonRowProps {
  row: ComparisonRowData;
  /** Render as a table row (desktop) or as a card (mobile) */
  as: 'row' | 'card';
  className?: string;
}

// ─── Cell renderer ──────────────────────────────────────────────────────────

function CellValue({
  cell,
  highlight,
}: {
  cell: CompetitorCell;
  highlight?: boolean;
}) {
  if (typeof cell.value === 'boolean') {
    if (cell.value) {
      return (
        <span
          className={cn(
            'inline-flex items-center justify-center w-6 h-6 rounded-full shrink-0',
            highlight
              ? 'bg-teal text-white'
              : 'bg-teal/10 text-teal border border-teal/20',
          )}
          aria-label="Disponible"
        >
          <Check size={13} strokeWidth={3} />
        </span>
      );
    }
    return (
      <span
        className="inline-flex items-center justify-center w-6 h-6 rounded-full shrink-0 bg-red/10 text-red border border-red/20"
        aria-label="Indisponible"
      >
        <X size={13} strokeWidth={3} />
      </span>
    );
  }
  return (
    <span
      className={cn(
        'inline-flex items-center justify-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider',
        highlight
          ? 'bg-violet text-white'
          : 'bg-surface-2 text-ink-3 border border-border',
      )}
    >
      {cell.value}
    </span>
  );
}

function CellBlock({
  cell,
  highlight,
  label,
}: {
  cell: CompetitorCell;
  highlight?: boolean;
  label: string;
}) {
  return (
    <div className="flex flex-col items-center gap-1 text-center">
      <CellValue cell={cell} highlight={highlight} />
      {cell.note && (
        <span className="text-[10px] text-ink-3 dark:text-white/50 leading-tight max-w-[140px]">
          {cell.note}
        </span>
      )}
      <span className="text-[9px] uppercase tracking-wider text-ink-3/80 font-bold mt-0.5 md:sr-only">
        {label}
      </span>
    </div>
  );
}

// ─── Row / Card ─────────────────────────────────────────────────────────────

export function ComparisonRow({ row, as, className }: ComparisonRowProps) {
  if (as === 'row') {
    return (
      <tr
        className={cn(
          'border-b border-border/60 last:border-b-0',
          'transition-colors duration-150 hover:bg-violet-pale/20 dark:hover:bg-white/[0.02]',
          className,
        )}
      >
        <td className="px-4 py-3 align-top">
          <p className="text-[13px] font-semibold text-ink dark:text-white leading-snug">
            {row.feature}
          </p>
        </td>
        <td className="px-4 py-3 align-middle bg-violet-pale/30 dark:bg-violet/10">
          <CellBlock cell={row.strickin} highlight label="Strick'in" />
        </td>
        <td className="px-4 py-3 align-middle">
          <CellBlock cell={row.feefty} label="Feefty" />
        </td>
        <td className="px-4 py-3 align-middle">
          <CellBlock cell={row.luma} label="Luma" />
        </td>
      </tr>
    );
  }

  // Card layout
  return (
    <article
      className={cn(
        'rounded-xl border border-border bg-white dark:bg-white/[0.03] p-4',
        'space-y-3',
        className,
      )}
    >
      <header>
        <span className="text-[10px] uppercase tracking-[0.18em] text-violet font-bold">
          {row.category}
        </span>
        <p className="font-display font-semibold text-[14px] text-ink dark:text-white mt-1 leading-snug">
          {row.feature}
        </p>
      </header>
      <dl className="grid grid-cols-3 gap-2">
        <div
          className="rounded-lg p-2 text-center bg-violet-pale/50 dark:bg-violet/15 border border-violet/20"
          role="group"
          aria-label="Strick'in"
        >
          <dt className="text-[9px] uppercase tracking-wider text-violet font-bold mb-1">
            Strick&apos;in
          </dt>
          <dd className="flex justify-center">
            <CellValue cell={row.strickin} highlight />
          </dd>
          {row.strickin.note && (
            <p className="text-[9.5px] text-ink-3 dark:text-white/60 mt-1 leading-tight">
              {row.strickin.note}
            </p>
          )}
        </div>
        <div
          className="rounded-lg p-2 text-center bg-surface-2 dark:bg-white/[0.03] border border-border"
          role="group"
          aria-label="Feefty"
        >
          <dt className="text-[9px] uppercase tracking-wider text-ink-3 font-bold mb-1">
            Feefty
          </dt>
          <dd className="flex justify-center">
            <CellValue cell={row.feefty} />
          </dd>
          {row.feefty.note && (
            <p className="text-[9.5px] text-ink-3 mt-1 leading-tight">
              {row.feefty.note}
            </p>
          )}
        </div>
        <div
          className="rounded-lg p-2 text-center bg-surface-2 dark:bg-white/[0.03] border border-border"
          role="group"
          aria-label="Luma"
        >
          <dt className="text-[9px] uppercase tracking-wider text-ink-3 font-bold mb-1">
            Luma
          </dt>
          <dd className="flex justify-center">
            <CellValue cell={row.luma} />
          </dd>
          {row.luma.note && (
            <p className="text-[9.5px] text-ink-3 mt-1 leading-tight">
              {row.luma.note}
            </p>
          )}
        </div>
      </dl>
    </article>
  );
}
