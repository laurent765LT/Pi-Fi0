'use client';

import { useFiltersStore } from '@/stores/filters-store';
import { cn } from '@/lib/cn';
import type { PayoffType } from './product-card';

// ─── Constants ───────────────────────────────────────────────────────────────

const PAYOFF_TYPE_OPTIONS: { value: PayoffType; label: string }[] = [
  { value: 'AUTOCALL_PHOENIX', label: 'Autocall Phoenix' },
  { value: 'AUTOCALL_COUPON', label: 'Autocall Coupon' },
  { value: 'CAPITAL_PROTECTED', label: 'Capital Protégé' },
  { value: 'CONDITIONAL_RATE', label: 'Taux Conditionnel' },
  { value: 'BARRIER_NOTE', label: 'Barrier Note' },
];

const SRI_OPTIONS = [1, 2, 3, 4, 5, 6, 7] as const;

const STATUS_OPTIONS = [
  { value: 'OPEN', label: 'Ouvert' },
  { value: 'UPCOMING', label: 'À venir' },
  { value: 'CLOSED', label: 'Fermé' },
  { value: 'MATURED', label: 'Échu' },
];

// ─── Shared input styles ──────────────────────────────────────────────────────

const inputBase = [
  'h-8 rounded-sm border border-border bg-white px-2.5 text-sm font-body text-ink',
  'placeholder:text-ink-3',
  'transition-colors duration-150',
  'focus:outline-none focus:ring-2 focus:ring-violet focus:ring-offset-0 focus:border-violet',
  'hover:border-border-2',
].join(' ');

// ─── Component ───────────────────────────────────────────────────────────────

interface ProductFiltersProps {
  className?: string;
}

export function ProductFilters({ className }: ProductFiltersProps) {
  const {
    payoffType,
    minSri,
    maxSri,
    search,
    status,
    setFilter,
    resetFilters,
  } = useFiltersStore();

  const hasActiveFilters =
    payoffType !== null ||
    minSri !== null ||
    maxSri !== null ||
    search !== '' ||
    status !== '';

  return (
    <div
      className={cn(
        'flex flex-wrap items-center gap-2',
        className,
      )}
      role="search"
      aria-label="Filtres produits"
    >
      {/* ── Search input ─────────────────────────────────────── */}
      <div className="relative">
        <svg
          width="14"
          height="14"
          viewBox="0 0 14 14"
          fill="none"
          className="absolute left-2 top-1/2 -translate-y-1/2 text-ink-3 pointer-events-none"
          aria-hidden="true"
        >
          <circle cx="6" cy="6" r="4.5" stroke="currentColor" strokeWidth="1.3" />
          <path
            d="M9.5 9.5L12 12"
            stroke="currentColor"
            strokeWidth="1.3"
            strokeLinecap="round"
          />
        </svg>
        <input
          type="search"
          value={search}
          onChange={(e) => setFilter('search', e.target.value)}
          placeholder="Nom, ISIN, sous-jacent…"
          className={cn(inputBase, 'pl-7 w-48')}
          aria-label="Rechercher un produit"
        />
      </div>

      {/* ── PayoffType dropdown ──────────────────────────────── */}
      <select
        value={payoffType ?? ''}
        onChange={(e) =>
          setFilter('payoffType', e.target.value ? (e.target.value as PayoffType) : null)
        }
        className={cn(inputBase, 'cursor-pointer pr-7 appearance-none bg-[url(\'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="10" height="6" fill="none"><path d="M1 1l4 4 4-4" stroke="%237B6FA0" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/></svg>\')] bg-no-repeat bg-[right_8px_center]')}
        aria-label="Type de payoff"
      >
        <option value="">Tous les types</option>
        {PAYOFF_TYPE_OPTIONS.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>

      {/* ── SRI min ──────────────────────────────────────────── */}
      <div className="flex items-center gap-1">
        <label className="text-xs text-ink-3 font-body whitespace-nowrap">
          SRI min
        </label>
        <select
          value={minSri ?? ''}
          onChange={(e) =>
            setFilter('minSri', e.target.value ? Number(e.target.value) : null)
          }
          className={cn(inputBase, 'w-14 cursor-pointer pr-1 text-center')}
          aria-label="SRI minimum"
        >
          <option value="">–</option>
          {SRI_OPTIONS.map((n) => (
            <option key={n} value={n}>
              {n}
            </option>
          ))}
        </select>
      </div>

      {/* ── SRI max ──────────────────────────────────────────── */}
      <div className="flex items-center gap-1">
        <label className="text-xs text-ink-3 font-body whitespace-nowrap">
          SRI max
        </label>
        <select
          value={maxSri ?? ''}
          onChange={(e) =>
            setFilter('maxSri', e.target.value ? Number(e.target.value) : null)
          }
          className={cn(inputBase, 'w-14 cursor-pointer pr-1 text-center')}
          aria-label="SRI maximum"
        >
          <option value="">–</option>
          {SRI_OPTIONS.map((n) => (
            <option key={n} value={n}>
              {n}
            </option>
          ))}
        </select>
      </div>

      {/* ── Status dropdown ──────────────────────────────────── */}
      <select
        value={status}
        onChange={(e) => setFilter('status', e.target.value)}
        className={cn(inputBase, 'cursor-pointer pr-7 appearance-none bg-[url(\'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="10" height="6" fill="none"><path d="M1 1l4 4 4-4" stroke="%237B6FA0" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/></svg>\')] bg-no-repeat bg-[right_8px_center]')}
        aria-label="Statut"
      >
        <option value="">Tous les statuts</option>
        {STATUS_OPTIONS.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>

      {/* ── Reset button ─────────────────────────────────────── */}
      {hasActiveFilters && (
        <button
          type="button"
          onClick={resetFilters}
          className={cn(
            'inline-flex h-8 items-center gap-1.5 rounded-sm border border-border px-2.5',
            'text-xs font-semibold font-body text-ink-3',
            'transition-colors duration-150',
            'hover:border-red hover:text-red hover:bg-red/5',
            'focus:outline-none focus:ring-2 focus:ring-red focus:ring-offset-0',
          )}
          aria-label="Réinitialiser les filtres"
        >
          <svg
            width="10"
            height="10"
            viewBox="0 0 10 10"
            fill="none"
            aria-hidden="true"
          >
            <path
              d="M1 1l8 8M9 1L1 9"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
          </svg>
          Réinitialiser
        </button>
      )}

      {/* ── Active filter count pill ─────────────────────────── */}
      {hasActiveFilters && (
        <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-violet px-1.5 text-[10px] font-bold text-white font-body">
          {[
            payoffType !== null,
            minSri !== null,
            maxSri !== null,
            search !== '',
            status !== '',
          ].filter(Boolean).length}
        </span>
      )}
    </div>
  );
}
