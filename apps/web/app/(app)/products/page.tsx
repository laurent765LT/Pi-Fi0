'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  Search,
  LayoutGrid,
  List,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Download,
  X,
  Calendar,
  ArrowUpRight,
  Heart,
  Sparkles,
  TrendingUp,
  Eye,
  SlidersHorizontal,
  PackageSearch,
  ChevronDown,
  Filter,
} from 'lucide-react';
import { cn } from '@/lib/cn';
import { useFiltersStore } from '@/stores/filters-store';
import { useProducts } from '@/hooks/use-products';
import { ProductCard } from '@/components/products/product-card';
import type { PayoffType } from '@/components/products/product-card';
import { useFavorites, useToggleFavorite, useMostViewed } from '@/hooks/use-favorites';
import { useRecommendations, useGenerateRecommendations } from '@/hooks/use-recommendations';

// ─── Constants ───────────────────────────────────────────────────────────────

const PAYOFF_OPTIONS: { value: PayoffType; label: string }[] = [
  { value: 'AUTOCALL_PHOENIX', label: 'Autocall Phoenix' },
  { value: 'AUTOCALL_COUPON', label: 'Autocall Coupon' },
  { value: 'CAPITAL_PROTECTED', label: 'Capital Protégé' },
  { value: 'CONDITIONAL_RATE', label: 'Taux Conditionnel' },
  { value: 'BARRIER_NOTE', label: 'Barrier Note' },
];

const STATUS_OPTIONS = [
  { value: 'ACTIVE', label: 'Actif' },
  { value: 'OPEN', label: 'Ouvert' },
  { value: 'UPCOMING', label: 'À venir' },
  { value: 'CLOSED', label: 'Fermé' },
  { value: 'MATURED', label: 'Échu' },
];

const ISSUER_OPTIONS = [
  'BNP Paribas Issuance B.V.',
  'Julius Baer',
  'SG Issuer',
  'Natixis Structured Issuance',
  'Marex Financial Products',
];

const PAYOFF_BADGE: Record<string, { bg: string; text: string }> = {
  AUTOCALL_PHOENIX: { bg: '#EDE8FF', text: '#3B1FA8' },
  AUTOCALL_COUPON: { bg: '#EDE8FF', text: '#5535C4' },
  CAPITAL_PROTECTED: { bg: '#E6FAF5', text: '#008B6E' },
  CONDITIONAL_RATE: { bg: '#E4EAFF', text: '#0A2799' },
  BARRIER_NOTE: { bg: '#FFF8E7', text: '#A07800' },
};

const PAYOFF_SHORT: Record<string, string> = {
  AUTOCALL_PHOENIX: 'Phoenix',
  AUTOCALL_COUPON: 'Autocall',
  CAPITAL_PROTECTED: 'Protégé',
  CONDITIONAL_RATE: 'Taux Cond.',
  BARRIER_NOTE: 'Barrier',
};

const STATUS_BADGE: Record<string, { bg: string; text: string; label: string }> = {
  ACTIVE: { bg: '#E6FAF5', text: '#008B6E', label: 'Actif' },
  OPEN: { bg: '#E6FAF5', text: '#008B6E', label: 'Ouvert' },
  DRAFT: { bg: '#F4F3EF', text: '#7B6FA0', label: 'Brouillon' },
  UPCOMING: { bg: '#E4EAFF', text: '#0A2799', label: 'À venir' },
  CLOSED: { bg: '#F4F3EF', text: '#7B6FA0', label: 'Fermé' },
  MATURED: { bg: '#FFF0F2', text: '#C41F36', label: 'Échu' },
};

const SORT_OPTIONS: { value: SortField; label: string }[] = [
  { value: 'name', label: 'Nom' },
  { value: 'issuerName', label: 'Émetteur' },
  { value: 'maturityDate', label: 'Échéance' },
  { value: 'maxGainPct', label: 'Gain max' },
  { value: 'couponPct', label: 'Coupon' },
  { value: 'barrierCapPct', label: 'Barrière' },
  { value: 'sri', label: 'SRI' },
];

type SortField = 'name' | 'issuerName' | 'maturityDate' | 'maxGainPct' | 'barrierCapPct' | 'sri' | 'couponPct';
type SortDir = 'asc' | 'desc';
type ViewFilter = 'all' | 'favorites' | 'recommended' | 'popular';

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' });
}

function formatPct(v: number | null | undefined) {
  if (v == null) return '—';
  return v.toFixed(1) + '%';
}

// ─── Select Component ────────────────────────────────────────────────────────

const selectCls = cn(
  'h-9 rounded-lg border border-border/60 bg-white px-3 pr-8 text-[13px] font-body text-ink',
  'transition-all duration-150 cursor-pointer',
  'focus:outline-none focus:ring-2 focus:ring-violet/20 focus:border-violet/40',
  'hover:border-border-2',
  "appearance-none bg-[url('data:image/svg+xml;utf8,<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"10\" height=\"6\" fill=\"none\"><path d=\"M1 1l4 4 4-4\" stroke=\"%237B6FA0\" stroke-width=\"1.4\" stroke-linecap=\"round\" stroke-linejoin=\"round\"/></svg>')] bg-no-repeat bg-[right_10px_center]",
);

// ─── Skeleton ────────────────────────────────────────────────────────────────

function SkeletonCard() {
  return (
    <div className="bg-white border border-border/60 rounded-xl p-5 animate-pulse flex flex-col gap-3">
      <div className="flex justify-between">
        <div className="h-5 w-20 bg-surface-2 rounded-md" />
        <div className="h-5 w-12 bg-surface-2 rounded-md" />
      </div>
      <div className="h-4 w-3/4 bg-surface-2 rounded" />
      <div className="h-3 w-1/2 bg-surface-2 rounded" />
      <div className="h-16 w-full bg-surface-2 rounded-lg mt-1" />
      <div className="h-1.5 w-full bg-surface-2 rounded-full" />
      <div className="h-10 w-full bg-surface-2 rounded-lg mt-auto" />
    </div>
  );
}

function SkeletonRow() {
  return (
    <tr className="border-b border-border/30 animate-pulse">
      {Array.from({ length: 9 }).map((_, i) => (
        <td key={i} className="px-4 py-3.5">
          <div className="h-3.5 bg-surface-2 rounded w-full" />
        </td>
      ))}
    </tr>
  );
}

// ─── Sort Header ─────────────────────────────────────────────────────────────

function SortTh({
  label,
  field,
  sortField,
  sortDir,
  onSort,
  className,
}: {
  label: string;
  field: SortField;
  sortField: SortField;
  sortDir: SortDir;
  onSort: (f: SortField) => void;
  className?: string;
}) {
  const active = sortField === field;
  return (
    <th
      onClick={() => onSort(field)}
      className={cn(
        'px-4 py-3 text-left text-[10px] uppercase tracking-[0.15em] font-semibold cursor-pointer select-none group',
        'transition-colors hover:text-violet',
        active ? 'text-violet' : 'text-ink-3',
        className,
      )}
    >
      <span className="inline-flex items-center gap-1">
        {label}
        {active ? (
          sortDir === 'asc' ? <ArrowUp size={10} /> : <ArrowDown size={10} />
        ) : (
          <ArrowUpDown size={10} className="opacity-0 group-hover:opacity-50 transition-opacity" />
        )}
      </span>
    </th>
  );
}

// ─── Tab Pill ────────────────────────────────────────────────────────────────

function TabPill({
  label,
  icon: Icon,
  active,
  count,
  onClick,
}: {
  label: string;
  icon: any;
  active: boolean;
  count?: number;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-4 py-1.5 text-[13px] font-semibold font-body',
        'transition-all duration-200 whitespace-nowrap',
        active
          ? 'bg-violet text-white shadow-[0_2px_8px_rgba(53,53,196,0.25)]'
          : 'text-ink-3 hover:text-ink hover:bg-surface-2 rounded-full',
      )}
    >
      <Icon size={13} className={active ? 'text-white' : ''} />
      {label}
      {count != null && count > 0 && (
        <span
          className={cn(
            'inline-flex items-center justify-center h-[18px] min-w-[18px] px-1 rounded-full text-[10px] font-bold leading-none',
            active
              ? 'bg-white/20 text-white'
              : 'bg-violet/8 text-violet/70',
          )}
        >
          {count}
        </span>
      )}
    </button>
  );
}

// ─── Page ────────────────────────────────────────────────────────────────────

export default function ProductsPage() {
  const { payoffType, minSri, maxSri, search, status, setFilter, resetFilters } = useFiltersStore();
  const [view, setView] = useState<'grid' | 'table'>('grid');
  const [sortField, setSortField] = useState<SortField>('name');
  const [sortDir, setSortDir] = useState<SortDir>('asc');
  const [viewFilter, setViewFilter] = useState<ViewFilter>('all');
  const [issuerFilter, setIssuerFilter] = useState<string>('');
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Data queries
  const { data: productsData, isLoading, isError } = useProducts({
    payoffType: payoffType ?? undefined,
    minSri: minSri ?? undefined,
    maxSri: maxSri ?? undefined,
    search: search || undefined,
    status: status || undefined,
  });

  const { data: favoritesData } = useFavorites();
  const { data: recommendationsData } = useRecommendations();
  const { data: mostViewedData } = useMostViewed(10);
  const generateRecs = useGenerateRecommendations();
  const toggleFavorite = useToggleFavorite();

  const products = productsData?.data ?? [];
  const favoriteIds = new Set(
    (favoritesData as any[])?.map((f: any) => f.productId ?? f.product?.id) ?? []
  );
  const recommendationMap = new Map<string, number>(
    (recommendationsData as any[])?.map((r: any) => [r.productId, r.score]) ?? []
  );
  const mostViewedIds = new Set(
    (mostViewedData as any[])?.map((m: any) => m.productId) ?? []
  );

  const hasActiveFilters = payoffType !== null || minSri !== null || maxSri !== null || search !== '' || status !== '' || issuerFilter !== '';
  const activeFilterCount = [payoffType !== null, minSri !== null, maxSri !== null, search !== '', status !== '', issuerFilter !== ''].filter(Boolean).length;

  // Apply view filter + issuer filter + sorting
  const filtered = useMemo(() => {
    let arr = [...products];

    // Issuer filter
    if (issuerFilter) {
      arr = arr.filter((p: any) => p.issuerName === issuerFilter);
    }

    // View filter
    switch (viewFilter) {
      case 'favorites':
        arr = arr.filter((p: any) => favoriteIds.has(p.id));
        break;
      case 'recommended':
        arr = arr.filter((p: any) => recommendationMap.has(p.id));
        arr.sort((a: any, b: any) => (recommendationMap.get(b.id) ?? 0) - (recommendationMap.get(a.id) ?? 0));
        break;
      case 'popular':
        arr = arr.filter((p: any) => mostViewedIds.has(p.id));
        break;
    }

    // Sort
    if (viewFilter !== 'recommended') {
      arr.sort((a: any, b: any) => {
        let va = a[sortField];
        let vb = b[sortField];
        if (typeof va === 'string') va = va.toLowerCase();
        if (typeof vb === 'string') vb = vb.toLowerCase();
        if (va == null) return 1;
        if (vb == null) return -1;
        if (va < vb) return sortDir === 'asc' ? -1 : 1;
        if (va > vb) return sortDir === 'asc' ? 1 : -1;
        return 0;
      });
    }

    return arr;
  }, [products, sortField, sortDir, viewFilter, favoriteIds, recommendationMap, mostViewedIds, issuerFilter]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDir('asc');
    }
  };

  return (
    <div className="animate-fade-in space-y-0">
      {/* ── Page Header ────────────────────────────────────────────────── */}
      <div className="flex items-start justify-between mb-1">
        <div>
          <h1 className="font-display text-[28px] font-bold text-ink leading-tight">
            Produits structurés
          </h1>
          <p className="text-ink-2 text-sm font-body mt-1.5 max-w-lg">
            Découvrez, comparez et marquez votre intérêt sur les meilleurs produits du marché.
          </p>
        </div>

        <div className="flex items-center gap-2 pt-1">
          {/* Generate Recommendations */}
          <button
            onClick={() => generateRecs.mutate()}
            disabled={generateRecs.isPending}
            className={cn(
              'h-9 px-4 rounded-full border border-violet/25 bg-violet-ghost text-violet',
              'text-[12px] font-semibold font-body',
              'flex items-center gap-1.5 transition-all duration-200',
              'hover:bg-violet/10 hover:border-violet/40 hover:shadow-sm',
              'disabled:opacity-50',
            )}
          >
            <Sparkles size={13} />
            {generateRecs.isPending ? 'Analyse...' : 'Suggestions IA'}
          </button>

          {/* Export */}
          <button
            className={cn(
              'h-9 px-4 rounded-full border border-border/60 bg-white text-ink-3',
              'text-[12px] font-medium font-body',
              'flex items-center gap-1.5 transition-all duration-200',
              'hover:border-violet/40 hover:text-violet hover:bg-violet-ghost hover:shadow-sm',
            )}
          >
            <Download size={13} />
            Export
          </button>

          {/* View toggle */}
          <div className="flex items-center h-9 rounded-full border border-border/60 bg-white overflow-hidden">
            <button
              onClick={() => setView('grid')}
              className={cn(
                'h-full px-3 flex items-center justify-center transition-all duration-200',
                view === 'grid'
                  ? 'bg-violet text-white'
                  : 'text-ink-3 hover:bg-surface-2 hover:text-ink',
              )}
              title="Vue grille"
            >
              <LayoutGrid size={14} />
            </button>
            <button
              onClick={() => setView('table')}
              className={cn(
                'h-full px-3 flex items-center justify-center transition-all duration-200',
                view === 'table'
                  ? 'bg-violet text-white'
                  : 'text-ink-3 hover:bg-surface-2 hover:text-ink',
              )}
              title="Vue tableau"
            >
              <List size={14} />
            </button>
          </div>
        </div>
      </div>

      {/* Gradient separator */}
      <div
        className="h-[2px] rounded-full mb-6 mt-4"
        style={{ background: 'linear-gradient(90deg, #5535C4, #3D63F5)' }}
      />

      {/* ── Tab Navigation ─────────────────────────────────────────────── */}
      <div className="flex items-center gap-1.5 mb-5">
        <TabPill
          label="Tous"
          icon={LayoutGrid}
          active={viewFilter === 'all'}
          count={products.length}
          onClick={() => setViewFilter('all')}
        />
        <TabPill
          label="Favoris"
          icon={Heart}
          active={viewFilter === 'favorites'}
          count={favoriteIds.size}
          onClick={() => setViewFilter('favorites')}
        />
        <TabPill
          label="Suggérés par l'IA"
          icon={Sparkles}
          active={viewFilter === 'recommended'}
          count={recommendationMap.size}
          onClick={() => setViewFilter('recommended')}
        />
        <TabPill
          label="Populaires"
          icon={TrendingUp}
          active={viewFilter === 'popular'}
          count={mostViewedIds.size}
          onClick={() => setViewFilter('popular')}
        />
      </div>

      {/* ── Search & Filters Bar ───────────────────────────────────────── */}
      <div className="flex items-center gap-3 flex-wrap mb-5">
        {/* Search input - full width feel */}
        <div className="relative flex-1 min-w-[240px]">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-3/50 pointer-events-none" />
          <input
            type="search"
            value={search}
            onChange={(e) => setFilter('search', e.target.value)}
            placeholder="Rechercher par nom, ISIN, sous-jacent..."
            className={cn(
              'w-full h-10 rounded-xl bg-white border border-border/60 pl-10 pr-4 text-[13px] font-body text-ink',
              'placeholder:text-ink-3/50 transition-all duration-200',
              'focus:outline-none focus:ring-2 focus:ring-violet/20 focus:border-violet/40 focus:shadow-sm',
            )}
          />
        </div>

        {/* Payoff Type */}
        <select
          value={payoffType ?? ''}
          onChange={(e) => setFilter('payoffType', e.target.value ? (e.target.value as PayoffType) : null)}
          className={cn(selectCls, 'rounded-lg')}
        >
          <option value="">Type de produit</option>
          {PAYOFF_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>

        {/* Status */}
        <select
          value={status}
          onChange={(e) => setFilter('status', e.target.value)}
          className={cn(selectCls, 'rounded-lg')}
        >
          <option value="">Statut</option>
          {STATUS_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>

        {/* Sort control */}
        <div className="flex items-center gap-1.5">
          <select
            value={sortField}
            onChange={(e) => setSortField(e.target.value as SortField)}
            className={cn(selectCls, 'rounded-lg')}
          >
            {SORT_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>Tri : {o.label}</option>
            ))}
          </select>
          <button
            onClick={() => setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))}
            className={cn(
              'h-9 w-9 rounded-lg border border-border/60 bg-white flex items-center justify-center',
              'text-ink-3 hover:text-violet hover:border-violet/40 transition-all duration-200',
              'focus:outline-none focus:ring-2 focus:ring-violet/20 focus:border-violet/40',
            )}
            title={sortDir === 'asc' ? 'Croissant' : 'Décroissant'}
          >
            {sortDir === 'asc' ? <ArrowUp size={14} /> : <ArrowDown size={14} />}
          </button>
        </div>

        {/* Advanced toggle */}
        <button
          onClick={() => setShowAdvanced(!showAdvanced)}
          className={cn(
            'h-9 px-3.5 rounded-lg border text-[12px] font-medium font-body',
            'flex items-center gap-1.5 transition-all duration-200',
            showAdvanced
              ? 'border-violet/40 text-violet bg-violet-ghost shadow-sm'
              : 'border-border/60 text-ink-3 bg-white hover:border-violet/40 hover:text-violet',
          )}
        >
          <SlidersHorizontal size={12} />
          Filtres avancés
          <ChevronDown
            size={11}
            className={cn('transition-transform duration-200', showAdvanced && 'rotate-180')}
          />
        </button>

        {/* Reset */}
        {hasActiveFilters && (
          <button
            onClick={() => {
              resetFilters();
              setIssuerFilter('');
            }}
            className={cn(
              'h-9 px-3.5 rounded-lg border border-red/20 text-red bg-red-light',
              'text-[12px] font-semibold font-body flex items-center gap-1.5',
              'transition-all duration-200 hover:bg-red/10 hover:border-red/40',
            )}
          >
            <X size={12} />
            Réinitialiser
            <span className="inline-flex items-center justify-center h-[18px] min-w-[18px] px-1 rounded-full bg-red text-white text-[10px] font-bold">
              {activeFilterCount}
            </span>
          </button>
        )}
      </div>

      {/* Advanced filters expandable */}
      <div
        className={cn(
          'overflow-hidden transition-all duration-300 ease-out',
          showAdvanced ? 'max-h-24 opacity-100 mb-5' : 'max-h-0 opacity-0 mb-0',
        )}
      >
        <div className="flex items-center gap-3 flex-wrap bg-surface/60 rounded-xl border border-border/40 px-4 py-3">
          {/* SRI Range */}
          <div className="flex items-center gap-1.5 text-[12px] font-body text-ink-3">
            <span className="font-medium">SRI</span>
            <select
              value={minSri ?? ''}
              onChange={(e) => setFilter('minSri', e.target.value ? Number(e.target.value) : null)}
              className={cn(selectCls, 'w-16 text-center')}
            >
              <option value="">Min</option>
              {[1, 2, 3, 4, 5, 6, 7].map((n) => (
                <option key={n} value={n}>{n}</option>
              ))}
            </select>
            <span className="text-ink-3/40">—</span>
            <select
              value={maxSri ?? ''}
              onChange={(e) => setFilter('maxSri', e.target.value ? Number(e.target.value) : null)}
              className={cn(selectCls, 'w-16 text-center')}
            >
              <option value="">Max</option>
              {[1, 2, 3, 4, 5, 6, 7].map((n) => (
                <option key={n} value={n}>{n}</option>
              ))}
            </select>
          </div>

          <div className="w-px h-5 bg-border/40" />

          {/* Issuer filter */}
          <select
            value={issuerFilter}
            onChange={(e) => setIssuerFilter(e.target.value)}
            className={selectCls}
          >
            <option value="">Émetteur</option>
            {ISSUER_OPTIONS.map((name) => (
              <option key={name} value={name}>{name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* ── Results Count ──────────────────────────────────────────────── */}
      {!isLoading && !isError && (
        <div className="flex items-center justify-between mb-4">
          <p className="text-[13px] text-ink-3 font-body">
            <span className="font-semibold text-ink">{filtered.length}</span>{' '}
            produit{filtered.length > 1 ? 's' : ''} trouvé{filtered.length > 1 ? 's' : ''}
            {viewFilter === 'favorites' && ' dans vos favoris'}
            {viewFilter === 'recommended' && " suggérés par l'IA"}
            {viewFilter === 'popular' && ' les plus consultés'}
          </p>
          {viewFilter === 'recommended' && (
            <p className="text-[11px] text-violet/70 font-body flex items-center gap-1">
              <Sparkles size={10} />
              Triés par score de pertinence
            </p>
          )}
        </div>
      )}

      {/* ── Content ─────────────────────────────────────────────────────── */}
      {isLoading ? (
        view === 'grid' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5 stagger-children">
            {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-border/60 overflow-hidden">
            <table className="w-full">
              <thead className="sticky top-0 z-10">
                <tr className="border-b border-border/40 bg-surface/80 backdrop-blur-sm">
                  {['', 'Produit', 'ISIN', 'Émetteur', 'Type', 'Barrière', 'Gain max', 'SRI', 'Échéance', 'Statut'].map((h) => (
                    <th key={h} className="px-4 py-3 text-left text-[10px] uppercase tracking-[0.15em] text-ink-3 font-semibold">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} />)}
              </tbody>
            </table>
          </div>
        )
      ) : isError ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3 bg-white rounded-xl border border-border/60">
          <div className="w-14 h-14 rounded-2xl bg-red-light flex items-center justify-center">
            <X size={24} className="text-red" />
          </div>
          <p className="text-red font-body text-sm font-medium">
            Une erreur est survenue lors du chargement des produits.
          </p>
          <p className="text-ink-3 font-body text-xs">
            Veuillez réessayer dans quelques instants.
          </p>
        </div>
      ) : filtered.length === 0 ? (
        /* ── Empty State ──────────────────────────────────────────── */
        <div className="flex flex-col items-center justify-center py-24 gap-4 bg-white rounded-xl border border-border/60">
          <div className="w-16 h-16 rounded-2xl bg-violet-ghost flex items-center justify-center">
            {viewFilter === 'favorites' ? (
              <Heart size={28} className="text-violet/50" />
            ) : viewFilter === 'recommended' ? (
              <Sparkles size={28} className="text-violet/50" />
            ) : (
              <PackageSearch size={28} className="text-violet/50" />
            )}
          </div>
          <div className="text-center">
            <p className="font-body text-sm font-medium text-ink mb-1">
              {viewFilter === 'favorites'
                ? 'Aucun favori pour le moment'
                : viewFilter === 'recommended'
                ? 'Pas encore de suggestions IA'
                : 'Aucun produit trouvé'}
            </p>
            <p className="font-body text-xs text-ink-3 max-w-sm">
              {viewFilter === 'favorites'
                ? 'Cliquez sur le coeur sur un produit pour le retrouver ici.'
                : viewFilter === 'recommended'
                ? 'Lancez une analyse IA pour recevoir des recommandations personnalisées.'
                : 'Essayez de modifier vos filtres ou votre recherche.'}
            </p>
          </div>
          {viewFilter === 'recommended' && (
            <button
              onClick={() => generateRecs.mutate()}
              disabled={generateRecs.isPending}
              className="text-[13px] text-white bg-violet px-5 py-2.5 rounded-full font-semibold hover:bg-violet-mid transition-all duration-200 hover:shadow-md disabled:opacity-50 flex items-center gap-2"
            >
              <Sparkles size={14} />
              {generateRecs.isPending ? 'Analyse en cours...' : 'Générer des suggestions'}
            </button>
          )}
          {(viewFilter === 'all' || viewFilter === 'popular') && hasActiveFilters && (
            <button
              onClick={() => { resetFilters(); setIssuerFilter(''); }}
              className="text-[13px] text-violet font-semibold hover:underline flex items-center gap-1.5"
            >
              <X size={12} />
              Réinitialiser les filtres
            </button>
          )}
        </div>
      ) : view === 'grid' ? (
        /* ── Grid View ────────────────────────────────────────────── */
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5 stagger-children">
          {filtered.map((product: any) => (
            <ProductCard
              key={product.id}
              product={product}
              isFavorited={favoriteIds.has(product.id)}
              recommendationScore={recommendationMap.get(product.id) ?? null}
            />
          ))}
        </div>
      ) : (
        /* ── Table View ───────────────────────────────────────────── */
        <div className="bg-white rounded-xl border border-border/60 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-[13px] font-body">
              <thead className="sticky top-0 z-10">
                <tr className="border-b border-border/40 bg-surface/80 backdrop-blur-sm">
                  <th className="px-3 py-3 w-10" />
                  <SortTh label="Produit" field="name" sortField={sortField} sortDir={sortDir} onSort={handleSort} />
                  <th className="px-4 py-3 text-left text-[10px] uppercase tracking-[0.15em] text-ink-3 font-semibold">ISIN</th>
                  <SortTh label="Émetteur" field="issuerName" sortField={sortField} sortDir={sortDir} onSort={handleSort} />
                  <th className="px-4 py-3 text-left text-[10px] uppercase tracking-[0.15em] text-ink-3 font-semibold">Type</th>
                  <SortTh label="Barrière" field="barrierCapPct" sortField={sortField} sortDir={sortDir} onSort={handleSort} className="text-right" />
                  <SortTh label="Coupon" field="couponPct" sortField={sortField} sortDir={sortDir} onSort={handleSort} className="text-right" />
                  <SortTh label="Gain max" field="maxGainPct" sortField={sortField} sortDir={sortDir} onSort={handleSort} className="text-right" />
                  <SortTh label="SRI" field="sri" sortField={sortField} sortDir={sortDir} onSort={handleSort} className="text-center" />
                  <SortTh label="Échéance" field="maturityDate" sortField={sortField} sortDir={sortDir} onSort={handleSort} />
                  <th className="px-4 py-3 text-center text-[10px] uppercase tracking-[0.15em] text-ink-3 font-semibold">Statut</th>
                  <th className="px-4 py-3 w-10" />
                </tr>
              </thead>
              <tbody>
                {filtered.map((p: any, idx: number) => {
                  const payoffStyle = PAYOFF_BADGE[p.payoffType] ?? { bg: '#F4F3EF', text: '#7B6FA0' };
                  const statusStyle = STATUS_BADGE[p.status] ?? { bg: '#F4F3EF', text: '#7B6FA0', label: p.status };
                  const sriColor = p.sri <= 2 ? '#008B6E' : p.sri <= 4 ? '#A07800' : '#C41F36';
                  const isFav = favoriteIds.has(p.id);
                  const recScore = recommendationMap.get(p.id);
                  const isEven = idx % 2 === 1;

                  return (
                    <tr
                      key={p.id}
                      className={cn(
                        'border-b border-border/30 last:border-0 transition-colors duration-150 group',
                        'hover:bg-violet-ghost/50',
                        isEven && 'bg-surface/30',
                      )}
                    >
                      {/* Favorite */}
                      <td className="px-3 py-3">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleFavorite.mutate(p.id);
                          }}
                          className={cn(
                            'p-1 rounded-full transition-all duration-200',
                            isFav
                              ? 'text-red'
                              : 'text-ink-3/30 hover:text-red opacity-0 group-hover:opacity-100',
                          )}
                        >
                          <Heart size={13} fill={isFav ? 'currentColor' : 'none'} />
                        </button>
                      </td>

                      {/* Product name */}
                      <td className="px-4 py-3">
                        <Link href={`/products/${p.id}`} className="hover:text-violet transition-colors font-medium text-ink leading-tight block max-w-[200px] truncate">
                          {p.name}
                        </Link>
                        {recScore != null && recScore >= 70 && (
                          <span className="inline-flex items-center gap-0.5 mt-0.5 text-[9px] text-violet font-medium">
                            <Sparkles size={8} /> IA {recScore}%
                          </span>
                        )}
                      </td>

                      {/* ISIN */}
                      <td className="px-4 py-3">
                        <span className="font-mono text-[11px] text-ink-3 tabular-nums">{p.isin}</span>
                      </td>

                      {/* Issuer */}
                      <td className="px-4 py-3 text-ink-2 max-w-[140px] truncate">{p.issuerName}</td>

                      {/* Type badge */}
                      <td className="px-4 py-3">
                        <span
                          className="inline-flex items-center rounded-md px-2 py-0.5 text-[10px] font-semibold"
                          style={{ backgroundColor: payoffStyle.bg, color: payoffStyle.text }}
                        >
                          {PAYOFF_SHORT[p.payoffType] ?? p.payoffType}
                        </span>
                      </td>

                      {/* Barrier */}
                      <td className="px-4 py-3 text-right font-mono tabular-nums text-red font-semibold text-[12px]">
                        {formatPct(p.barrierCapPct)}
                      </td>

                      {/* Coupon */}
                      <td className="px-4 py-3 text-right font-mono tabular-nums text-teal font-semibold text-[12px]">
                        {formatPct(p.couponPct)}
                      </td>

                      {/* Max Gain */}
                      <td className="px-4 py-3 text-right font-mono tabular-nums font-bold text-ink text-[12px]">
                        {formatPct(p.maxGainPct)}
                      </td>

                      {/* SRI */}
                      <td className="px-4 py-3 text-center">
                        <span
                          className="inline-flex items-center justify-center w-6 h-6 rounded-md text-[10px] font-bold"
                          style={{ backgroundColor: `${sriColor}15`, color: sriColor }}
                        >
                          {p.sri}
                        </span>
                      </td>

                      {/* Maturity */}
                      <td className="px-4 py-3 text-[12px] text-ink-2 whitespace-nowrap">
                        <span className="inline-flex items-center gap-1">
                          <Calendar size={10} className="text-ink-3" />
                          {p.maturityDate ? formatDate(p.maturityDate) : '—'}
                        </span>
                      </td>

                      {/* Status */}
                      <td className="px-4 py-3 text-center">
                        <span
                          className="inline-flex items-center rounded-md px-2 py-0.5 text-[10px] font-semibold"
                          style={{ backgroundColor: statusStyle.bg, color: statusStyle.text }}
                        >
                          {statusStyle.label}
                        </span>
                      </td>

                      {/* Action */}
                      <td className="px-4 py-3">
                        <Link
                          href={`/products/${p.id}`}
                          className="text-ink-3/40 hover:text-violet transition-colors group-hover:text-ink-3"
                        >
                          <ArrowUpRight size={14} />
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
