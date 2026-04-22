'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { cn } from '@/lib/cn';
import { ComparisonRow } from '@/components/marketing/ComparisonRow';
import {
  COMPARISON_CATEGORIES,
  COMPARISON_ROWS,
  rowsByCategory,
  type ComparisonCategory,
} from '@/lib/marketing/comparisons';

interface ComparisonTableProps {
  /** Optional category filter */
  categories?: ComparisonCategory[];
  /** Heading shown above the table */
  title?: string;
  subtitle?: string;
  className?: string;
}

// ─── Scroll-reveal hook (respects prefers-reduced-motion) ──────────────────

function useReveal<T extends HTMLElement>() {
  const ref = useRef<T | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const reduced = window.matchMedia(
      '(prefers-reduced-motion: reduce)',
    ).matches;
    if (reduced || !ref.current) {
      setVisible(true);
      return;
    }
    const obs = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            setVisible(true);
            obs.disconnect();
            break;
          }
        }
      },
      { rootMargin: '0px 0px -10% 0px', threshold: 0.05 },
    );
    obs.observe(ref.current);
    return () => obs.disconnect();
  }, []);

  return { ref, visible };
}

// ─── Main component ────────────────────────────────────────────────────────

export function ComparisonTable({
  categories,
  title,
  subtitle,
  className,
}: ComparisonTableProps) {
  const cats = useMemo<ComparisonCategory[]>(
    () => (categories && categories.length > 0 ? categories : [...COMPARISON_CATEGORIES]),
    [categories],
  );

  const { ref, visible } = useReveal<HTMLDivElement>();

  return (
    <div
      ref={ref}
      className={cn(
        'transition-opacity duration-700 ease-out motion-reduce:transition-none',
        visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4',
        'transform motion-reduce:transform-none',
        className,
      )}
    >
      {(title || subtitle) && (
        <header className="text-center mb-8 max-w-2xl mx-auto">
          {title && (
            <h2 className="font-display text-[28px] md:text-[36px] font-extrabold text-ink dark:text-white leading-tight">
              {title}
            </h2>
          )}
          {subtitle && (
            <p className="mt-3 text-[14px] md:text-[15px] text-ink-2 dark:text-white/70 leading-relaxed">
              {subtitle}
            </p>
          )}
        </header>
      )}

      {/* Desktop table */}
      <div className="hidden md:block rounded-2xl border border-border bg-white dark:bg-white/[0.03] overflow-hidden shadow-sm">
        <table className="w-full">
          <thead>
            <tr className="bg-surface dark:bg-white/[0.02] border-b border-border">
              <th className="text-left px-4 py-3 text-[11px] uppercase tracking-[0.16em] text-ink-3 font-bold w-[40%]">
                Fonctionnalité
              </th>
              <th
                scope="col"
                className="px-4 py-3 bg-violet text-white text-center"
              >
                <span className="block font-display font-extrabold text-[14px] leading-none">
                  Strick&apos;in
                </span>
                <span className="block text-[9.5px] mt-0.5 font-semibold uppercase tracking-wider opacity-80">
                  Plateforme native
                </span>
              </th>
              <th
                scope="col"
                className="px-4 py-3 text-center font-display font-bold text-[14px] text-ink dark:text-white"
              >
                Feefty
              </th>
              <th
                scope="col"
                className="px-4 py-3 text-center font-display font-bold text-[14px] text-ink dark:text-white"
              >
                Luma
              </th>
            </tr>
          </thead>
          <tbody>
            {cats.map((cat) => {
              const rows = rowsByCategory(cat);
              if (rows.length === 0) return null;
              return (
                <ComparisonCategoryBlock
                  key={cat}
                  category={cat}
                  rows={rows}
                />
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Mobile cards */}
      <div className="md:hidden space-y-6">
        {cats.map((cat) => {
          const rows = rowsByCategory(cat);
          if (rows.length === 0) return null;
          return (
            <section key={cat} aria-label={cat}>
              <h3 className="sticky top-0 z-10 bg-surface/95 dark:bg-ink/95 backdrop-blur-sm px-3 py-2 rounded-md mb-3 text-[11px] uppercase tracking-[0.18em] text-violet font-bold border-l-2 border-violet">
                {cat}
              </h3>
              <div className="space-y-3">
                {rows.map((row, i) => (
                  <ComparisonRow
                    key={`${row.category}-${i}`}
                    row={row}
                    as="card"
                  />
                ))}
              </div>
            </section>
          );
        })}
      </div>

      {/* Footer note */}
      <p className="text-[11px] text-ink-3 dark:text-white/40 text-center mt-6 max-w-2xl mx-auto">
        Comparatif fonctionnel construit sur les offres publiques disponibles en{' '}
        {new Date().getFullYear()}. Certains modules Feefty / Luma peuvent être
        disponibles sur demande commerciale.
      </p>
    </div>
  );
}

// ─── Category block with sticky header (desktop) ───────────────────────────

function ComparisonCategoryBlock({
  category,
  rows,
}: {
  category: ComparisonCategory;
  rows: ReturnType<typeof rowsByCategory>;
}) {
  return (
    <>
      <tr className="sticky top-0 z-[1]">
        <td
          colSpan={4}
          className={cn(
            'px-4 py-2 bg-violet-pale/70 dark:bg-violet/20',
            'text-[10px] uppercase tracking-[0.18em] text-violet font-bold',
            'border-y border-violet/20',
          )}
        >
          {category}
        </td>
      </tr>
      {rows.map((row, i) => (
        <ComparisonRow key={`${row.category}-${i}`} row={row} as="row" />
      ))}
    </>
  );
}
