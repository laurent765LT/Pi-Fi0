'use client';

import { useState } from 'react';
import { useFiltersStore } from '@/stores/filters-store';
import { cn } from '@/lib/cn';
import { ChevronDown, SlidersHorizontal, X, ArrowUpDown } from 'lucide-react';
import type { PayoffType } from './product-card';
import type { SortField, SortOrder } from '@/stores/filters-store';

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
  { value: 'ACTIVE', label: 'Actif' },
  { value: 'UPCOMING', label: 'À venir' },
  { value: 'CLOSED', label: 'Fermé' },
  { value: 'MATURED', label: 'Échu' },
];

const UNDERLYING_OPTIONS = [
  { value: '^STOXX50E', label: 'Euro Stoxx 50' },
  { value: 'GC=F', label: 'Or (Gold)' },
  { value: 'EURIBOR12M', label: 'Taux EUR CMS' },
];

const ISSUER_OPTIONS = [
  { value: 'BNP Paribas', label: 'BNP Paribas' },
  { value: 'Natixis', label: 'Natixis' },
  { value: 'Goldman Sachs', label: 'Goldman Sachs' },
  { value: 'SG Issuer', label: 'SG Issuer' },
];

const SORT_OPTIONS: { value: SortField; label: string }[] = [
  { value: 'name', label: 'Nom' },
  { value: 'maturity', label: 'Échéance' },
  { value: 'sri', label: 'SRI' },
  { value: 'maxGain', label: 'Gain max' },
  { value: 'barrier', label: 'Barrière' },
  { value: 'coupon', label: 'Coupon' },
  { value: 'fill', label: 'Remplissage' },
];

// ─── Shared input styles ──────────────────────────────────────────────────────

const inputBase = [
  'h-8 rounded-md border border-border bg-white px-2.5 text-sm font-body text-ink',
  'placeholder:text-ink-3',
  'transition-colors duration-150',
  'focus:outline-none focus:ring-2 focus:ring-violet focus:ring-offset-0 focus:border-violet',
  'hover:border-border-2',
].join(' ');

const selectArrow = 'bg-[url(\'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="10" height="6" fill="none"><path d="M1 1l4 4 4-4" stroke="%237B6FA0" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/></svg>\')] bg-no-repeat bg-[right_8px_center]';

// ─── Component ───────────────────────────────────────────────────────────────

interface ProductFiltersProps {
  className?: string;
}

export function ProductFilters({ className }: ProductFiltersProps) {
  const store = useFiltersStore();
  const [showAdvanced, setShowAdvanced] = useState(false);
  const activeCount = store.activeFilterCount();

  return (
    <div className={cn('flex flex-col gap-3', className)}>
      {/* ── Primary filters row ─────────────────────────────── */}
      <div
        className="flex flex-wrap items-center gap-2"
        role="search"
        aria-label="Filtres produits"
      >
        {/* Search input */}
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
            <path d="M9.5 9.5L12 12" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
          </svg>
          <input
            type="search"
            value={store.search}
            onChange={(e) => store.setFilter('search', e.target.value)}
            placeholder="Nom, ISIN, sous-jacent…"
            className={cn(inputBase, 'pl-7 w-52')}
            aria-label="Rechercher un produit"
          />
        </div>

        {/* PayoffType dropdown */}
        <select
          value={store.payoffType ?? ''}
          onChange={(e) =>
            store.setFilter('payoffType', e.target.value ? (e.target.value as PayoffType) : null)
          }
          className={cn(inputBase, 'cursor-pointer pr-7 appearance-none', selectArrow)}
          aria-label="Type de payoff"
        >
          <option value="">Tous les types</option>
          {PAYOFF_TYPE_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>

        {/* SRI range */}
        <div className="flex items-center gap-1">
          <label className="text-xs text-ink-3 font-body whitespace-nowrap">SRI</label>
          <select
            value={store.minSri ?? ''}
            onChange={(e) => store.setFilter('minSri', e.target.value ? Number(e.target.value) : null)}
            className={cn(inputBase, 'w-14 cursor-pointer pr-1 text-center')}
            aria-label="SRI minimum"
          >
            <option value="">–</option>
            {SRI_OPTIONS.map((n) => (<option key={n} value={n}>{n}</option>))}
          </select>
          <span className="text-xs text-ink-3">à</span>
          <select
            value={store.maxSri ?? ''}
            onChange={(e) => store.setFilter('maxSri', e.target.value ? Number(e.target.value) : null)}
            className={cn(inputBase, 'w-14 cursor-pointer pr-1 text-center')}
            aria-label="SRI maximum"
          >
            <option value="">–</option>
            {SRI_OPTIONS.map((n) => (<option key={n} value={n}>{n}</option>))}
          </select>
        </div>

        {/* Status dropdown */}
        <select
          value={store.status}
          onChange={(e) => store.setFilter('status', e.target.value)}
          className={cn(inputBase, 'cursor-pointer pr-7 appearance-none', selectArrow)}
          aria-label="Statut"
        >
          <option value="">Tous les statuts</option>
          {STATUS_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>

        {/* Sort */}
        <div className="flex items-center gap-1 ml-auto">
          <ArrowUpDown size={12} className="text-ink-3" />
          <select
            value={store.sortBy}
            onChange={(e) => store.setFilter('sortBy', e.target.value as SortField)}
            className={cn(inputBase, 'cursor-pointer pr-7 appearance-none text-xs', selectArrow)}
            aria-label="Trier par"
          >
            {SORT_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>Tri: {opt.label}</option>
            ))}
          </select>
          <button
            type="button"
            onClick={() => store.setFilter('sortOrder', store.sortOrder === 'asc' ? 'desc' : 'asc')}
            className={cn(inputBase, 'w-8 flex items-center justify-center cursor-pointer text-xs')}
            aria-label={store.sortOrder === 'asc' ? 'Tri croissant' : 'Tri décroissant'}
            title={store.sortOrder === 'asc' ? 'Croissant' : 'Décroissant'}
          >
            {store.sortOrder === 'asc' ? '\u2191' : '\u2193'}
          </button>
        </div>

        {/* Advanced toggle */}
        <button
          type="button"
          onClick={() => setShowAdvanced(!showAdvanced)}
          className={cn(
            'inline-flex h-8 items-center gap-1.5 rounded-md border px-2.5',
            'text-xs font-semibold font-body transition-all duration-150',
            showAdvanced
              ? 'border-violet bg-violet-pale text-violet'
              : 'border-border bg-white text-ink-3 hover:border-violet/50 hover:text-violet',
          )}
        >
          <SlidersHorizontal size={12} />
          Filtres
          <ChevronDown size={10} className={cn('transition-transform', showAdvanced && 'rotate-180')} />
        </button>

        {/* Reset button */}
        {activeCount > 0 && (
          <button
            type="button"
            onClick={store.resetFilters}
            className={cn(
              'inline-flex h-8 items-center gap-1.5 rounded-md border border-border px-2.5',
              'text-xs font-semibold font-body text-ink-3',
              'transition-colors duration-150',
              'hover:border-red hover:text-red hover:bg-red/5',
            )}
            aria-label="Réinitialiser les filtres"
          >
            <X size={10} />
            Réinitialiser
          </button>
        )}

        {/* Active filter count pill */}
        {activeCount > 0 && (
          <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-violet px-1.5 text-[10px] font-bold text-white font-body">
            {activeCount}
          </span>
        )}
      </div>

      {/* ── Advanced filters panel ──────────────────────────── */}
      {showAdvanced && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 rounded-lg border border-border bg-surface-2/50 p-4 animate-in slide-in-from-top-2 duration-200">
          {/* Underlying */}
          <div className="flex flex-col gap-1">
            <label className="text-[10px] uppercase tracking-widest text-ink-3 font-body font-semibold">
              Sous-jacent
            </label>
            <select
              value={store.underlying ?? ''}
              onChange={(e) => store.setFilter('underlying', e.target.value || null)}
              className={cn(inputBase, 'cursor-pointer pr-7 appearance-none', selectArrow)}
            >
              <option value="">Tous</option>
              {UNDERLYING_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>

          {/* Issuer */}
          <div className="flex flex-col gap-1">
            <label className="text-[10px] uppercase tracking-widest text-ink-3 font-body font-semibold">
              Émetteur
            </label>
            <select
              value={store.issuer ?? ''}
              onChange={(e) => store.setFilter('issuer', e.target.value || null)}
              className={cn(inputBase, 'cursor-pointer pr-7 appearance-none', selectArrow)}
            >
              <option value="">Tous</option>
              {ISSUER_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>

          {/* Barrier range */}
          <div className="flex flex-col gap-1">
            <label className="text-[10px] uppercase tracking-widest text-ink-3 font-body font-semibold">
              Barrière (%)
            </label>
            <div className="flex items-center gap-1">
              <input
                type="number"
                placeholder="Min"
                value={store.minBarrier ?? ''}
                onChange={(e) => store.setFilter('minBarrier', e.target.value ? Number(e.target.value) : null)}
                className={cn(inputBase, 'w-full text-center')}
                min={0}
                max={100}
              />
              <span className="text-xs text-ink-3">–</span>
              <input
                type="number"
                placeholder="Max"
                value={store.maxBarrier ?? ''}
                onChange={(e) => store.setFilter('maxBarrier', e.target.value ? Number(e.target.value) : null)}
                className={cn(inputBase, 'w-full text-center')}
                min={0}
                max={100}
              />
            </div>
          </div>

          {/* Coupon range */}
          <div className="flex flex-col gap-1">
            <label className="text-[10px] uppercase tracking-widest text-ink-3 font-body font-semibold">
              Coupon (%)
            </label>
            <div className="flex items-center gap-1">
              <input
                type="number"
                placeholder="Min"
                value={store.minCoupon ?? ''}
                onChange={(e) => store.setFilter('minCoupon', e.target.value ? Number(e.target.value) : null)}
                className={cn(inputBase, 'w-full text-center')}
                min={0}
                step={0.1}
              />
              <span className="text-xs text-ink-3">–</span>
              <input
                type="number"
                placeholder="Max"
                value={store.maxCoupon ?? ''}
                onChange={(e) => store.setFilter('maxCoupon', e.target.value ? Number(e.target.value) : null)}
                className={cn(inputBase, 'w-full text-center')}
                min={0}
                step={0.1}
              />
            </div>
          </div>

          {/* Maturity year range */}
          <div className="flex flex-col gap-1">
            <label className="text-[10px] uppercase tracking-widest text-ink-3 font-body font-semibold">
              Maturité (année)
            </label>
            <div className="flex items-center gap-1">
              <input
                type="number"
                placeholder="De"
                value={store.minMaturityYear ?? ''}
                onChange={(e) => store.setFilter('minMaturityYear', e.target.value ? Number(e.target.value) : null)}
                className={cn(inputBase, 'w-full text-center')}
                min={2024}
                max={2040}
              />
              <span className="text-xs text-ink-3">–</span>
              <input
                type="number"
                placeholder="À"
                value={store.maxMaturityYear ?? ''}
                onChange={(e) => store.setFilter('maxMaturityYear', e.target.value ? Number(e.target.value) : null)}
                className={cn(inputBase, 'w-full text-center')}
                min={2024}
                max={2040}
              />
            </div>
          </div>

          {/* Quick toggles */}
          <div className="flex flex-col gap-1">
            <label className="text-[10px] uppercase tracking-widest text-ink-3 font-body font-semibold">
              Caractéristiques
            </label>
            <div className="flex flex-col gap-1.5">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={store.hasAutocall === true}
                  onChange={(e) => store.setFilter('hasAutocall', e.target.checked ? true : null)}
                  className="h-3.5 w-3.5 rounded border-border accent-violet"
                />
                <span className="text-xs font-body text-ink-2">Autocall</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={store.capitalProtected === true}
                  onChange={(e) => store.setFilter('capitalProtected', e.target.checked ? true : null)}
                  className="h-3.5 w-3.5 rounded border-border accent-violet"
                />
                <span className="text-xs font-body text-ink-2">Capital protégé</span>
              </label>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
