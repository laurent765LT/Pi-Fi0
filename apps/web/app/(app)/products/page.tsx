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
  'h-9 rounded-lg border border-border/80 bg-white px-3 pr-8 text-[13px] font-body text-ink',
  'transition-all duration-150 cursor-pointer',
  'focus:outline-none focus:ring-2 focus:ring-violet/30 focus:border-violet',
  'hover:border-border-2',
  "appearance-none bg-[url('data:image/svg+xml;utf8,<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"10\" height=\"6\" fill=\"none\"><path d=\"M1 1l4 4 4-4\" stroke=\"%237B6FA0\" stroke-width=\"1.4\" stroke-linecap=\"round\" stroke-linejoin=\"round\"/></svg>')] bg-no-repeat bg-[right_10px_center]",
);

// ─── Skeleton ────────────────────────────────────────────────────────────────

function SkeletonCard() {
  return (
    <div className="bg-white border border-border/80 rounded-xl p-5 animate-pulse flex flex-col gap-3">
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
    <tr className="border-b border-border/50 animate-pulse">
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

// ─── View Filter Pill ────────────────────────────────────────────────────────

function FilterPill({
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
        'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[12px] font-semibold font-body',
        'transition-all duration-200 whitespace-nowrap',
        active
          ? 'bg-violet text-white shadow-sm'
          : 'bg-white border border-border/80 text-ink-3 hover:border-violet/40 hover:text-violet',
      )}
    >
      <Icon size={12} />
      {label}
      {count != null && count > 0 && (
        <span className={cn(
          'inline-flex items-center justify-center h-4 min-w-4 px-1 rounded-full text-[9px] font-bold',
          active ? 'bg-white/25 text-white' : 'bg-violet-ghost text-violet',
        )}>
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
    <div className="animate-fade-in">
      {/* ── Header ──────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="font-display text-[28px] font-bold text-ink leading-tight">
            Produits structurés
          </h1>
          <p className="text-sm text-ink-3 font-body mt-1">
            Découvrez, comparez et marquez votre intérêt sur les meilleurs produits du marché.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Generate Recommendations */}
          <button
            onClick={() => generateRecs.mutate()}
            disabled={generateRecs.isPending}
            className={cn(
              'h-9 px-3 rounded-lg border border-violet/30 bg-violet-ghost text-violet',
              'text-[12px] font-semibold font-body',
              'flex items-center gap-1.5 transition-all duration-150',
              'hover:bg-violet/10 hover:border-violet/50',
              'disabled:opacity-50',
            )}
          >
            <Sparkles size={13} />
            {generateRecs.isPending ? 'Analyse...' : 'Suggestions IA'}
          </button>

          {/* Export button */}
          <button
            className={cn(
              'h-9 px-3 rounded-lg border border-border/80 bg-white text-ink-3',
              'text-[12px] font-medium font-body',
              'flex items-center gap-1.5 transition-all duration-150',
              'hover:border-violet hover:text-violet hover:bg-violet-ghost',
            )}
          >
            <Download size={13} />
            Export
          </button>

          {/* View toggle */}
          <div className="flex items-center h-9 rounded-lg border border-border/80 bg-white overflow-hidden">
            <button
              onClick={() => setView('grid')}
              className={cn(
                'h-full px-2.5 flex items-center justify-center transition-all duration-150',
                view === 'grid'
                  ? 'bg-violet text-white'
                  : 'text-ink-3 hover:bg-surface-2',
              )}
              title="Vue grille"
            >
              <LayoutGrid size={15} />
            </button>
            <button
              onClick={() => setView('table')}
              className={cn(
                'h-full px-2.5 flex items-center justify-center transition-all duration-150',
                view === 'table'
                  ? 'bg-violet text-white'
                  : 'text-ink-3 hover:bg-surface-2',
              )}
              title="Vue tableau"
            >
              <List size={15} />
            </button>
          </div>
        </div>
      </div>

      <div className="gradient-bar h-[2px] rounded-full mb-5 opacity-60" />

      {/* ── View Filter Pills ─────────────────────────────────────────── */}
      <div className="flex items-center gap-2 mb-4 flex-wrap">
        <FilterPill
          label="Tous"
          icon={LayoutGrid}
          active={viewFilter === 'all'}
          count={products.length}
          onClick={() => setViewFilter('all')}
        />
        <FilterPill
          label="Favoris"
          icon={Heart}
          active={viewFilter === 'favorites'}
          count={favoriteIds.size}
          onClick={() => setViewFilter('favorites')}
        />
        <FilterPill
          label="Suggérés par l’IA"
          icon={Sparkles}
          active={viewFilter === 'recommended'}
          count={recommendationMap.size}
          onClick={() => setViewFilter('recommended')}
        />
        <FilterPill
          label="Populaires"
          icon={TrendingUp}
          active={viewFilter === 'popular'}
          count={mostViewedIds.size}
          onClick={() => setViewFilter('popular')}
        />
      </div>

      {/* ── Filters Bar ─────────────────────────────────────────────────── */}
      <div className="bg-white rounded-xl border border-border/80 p-4 mb-5">
        <div className="flex items-center gap-3 flex-wrap">
          {/* Search */}
          <div className="relative flex-1 min-w-[200px] max-w-[320px]">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-3 pointer-events-none" />
            <input
              type="search"
              value={search}
              onChange={(e) => setFilter('search', e.target.value)}
              placeholder="Rechercher par nom, ISIN, sous-jacent…"
              className={cn(
                'w-full h-9 rounded-lg border border-border/80 bg-surface pl-9 pr-3 text-[13px] font-body text-ink',
                'placeholder:text-ink-3/60 transition-all duration-150',
                'focus:outline-none focus:ring-2 focus:ring-violet/30 focus:border-violet focus:bg-white',
              )}
            />
          </div>

          {/* Payoff Type */}
          <select
            value={payoffType ?? ''}
            onChange={(e) => setFilter('payoffType', e.target.value ? (e.target.value as PayoffType) : null)}
            className={selectCls}
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
            className={selectCls}
          >
            <option value="">Statut</option>
            {STATUS_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>

          {/* Advanced toggle */}
          <button
            onClick={() => setShowAdvanced(!showAdvanced)}
            className={cn(
              'h-9 px-3 rounded-lg border text-[12px] font-medium font-body',
              'flex items-center gap-1.5 transition-all duration-150',
              showAdvanced
                ? 'border-violet/40 text-violet bg-violet-ghost'
                : 'border-border/80 text-ink-3 bg-white hover:border-violet/40 hover:text-violet',
            )}
          >
            <SlidersHorizontal size={12} />
            Filtres avancés
          </button>

          {/* Reset */}
          {hasActiveFilters && (
            <button
              onClick={() => {
                resetFilters();
                setIssuerFilter('');
              }}
              className={cn(
                'h-9 px-3 rounded-lg border border-red/30 text-red bg-red-light',
                'text-[12px] font-semibold font-body flex items-center gap-1.5',
                'transition-all duration-150 hover:bg-red/10 hover:border-red/50',
              )}
            >
              <X size={12} />
              Réinitialiser
              <span className="inline-flex items-center justify-center h-4 min-w-4 px-1 rounded-full bg-red text-white text-[9px] font-bold">
                {activeFilterCount}
              </span>
            </button>
          )}
        </div>

        {/* Advanced filters row */}
        {showAdvanced && (
          <div className="flex items-center gap-3 flex-wrap mt-3 pt-3 border-t border-border/50">
            {/* SRI Range */}
            <div className="flex items-center gap-1.5 text-[12px] font-body text-ink-3">
              <span>SRI</span>
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
              <span>—</span>
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
        )}
      </div>

      {/* ── Results count ───────────────────────────────────────────────── */}
      {!isLoading && !isError && (
        <div className="flex items-center justify-between mb-4">
          <p className="text-[12px] text-ink-3 font-body">
            <span className="font-semibold text-ink">{filtered.length}</span> produit{filtered.length > 1 ? 's' : ''} trouvé{filtered.length > 1 ? 's' : ''}
            {viewFilter === 'favorites' && ' dans vos favoris'}
            {viewFilter === 'recommended' && ' suggérés par l’IA'}
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
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 stagger-children">
            {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-border/80 overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border/60" style={{ background: 'rgba(237,232,255,0.3)' }}>
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
        <div className="flex items-center justify-center py-20 text-red font-body text-sm bg-white rounded-xl border border-border/80">
          Une erreur est survenue lors du chargement des produits.
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 gap-3 bg-white rounded-xl border border-border/80">
          <div className="w-12 h-12 rounded-full bg-violet-ghost flex items-center justify-center">
            {viewFilter === 'favorites' ? <Heart size={20} className="text-ink-3" /> :
             viewFilter === 'recommended' ? <Sparkles size={20} className="text-ink-3" /> :
             <Search size={20} className="text-ink-3" />}
          </div>
          <p className="font-body text-sm text-ink-3">
            {viewFilter === 'favorites' ? "Vous n’avez pas encore de favoris. Cliquez sur le ❤️ pour en ajouter." :
             viewFilter === 'recommended' ? "Pas de suggestions IA. Cliquez sur «Suggestions IA» pour générer des recommandations." :
             'Aucun produit ne correspond à vos critères.'}
          </p>
          {viewFilter === 'recommended' && (
            <button
              onClick={() => generateRecs.mutate()}
              disabled={generateRecs.isPending}
              className="text-xs text-white bg-violet px-4 py-2 rounded-lg font-semibold hover:bg-violet-mid transition-colors disabled:opacity-50"
            >
              {generateRecs.isPending ? 'Analyse en cours...' : 'Générer des suggestions'}
            </button>
          )}
          {(viewFilter === 'all' || viewFilter === 'popular') && hasActiveFilters && (
            <button onClick={() => { resetFilters(); setIssuerFilter(''); }} className="text-xs text-violet font-semibold hover:underline">
              Réinitialiser les filtres
            </button>
          )}
        </div>
      ) : view === 'grid' ? (
        /* ── Grid View ────────────────────────────────────────────── */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 stagger-children">
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
        <div className="bg-white rounded-xl border border-border/80 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-[13px] font-body">
              <thead>
                <tr className="border-b border-border/60" style={{ background: 'rgba(237,232,255,0.3)' }}>
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
                {filtered.map((p: any) => {
                  const payoffStyle = PAYOFF_BADGE[p.payoffType] ?? { bg: '#F4F3EF', text: '#7B6FA0' };
                  const statusStyle = STATUS_BADGE[p.status] ?? { bg: '#F4F3EF', text: '#7B6FA0', label: p.status };
                  const sriColor = p.sri <= 2 ? '#008B6E' : p.sri <= 4 ? '#A07800' : '#C41F36';
                  const isFav = favoriteIds.has(p.id);
                  const recScore = recommendationMap.get(p.id);

                  return (
                    <tr
                      key={p.id}
                      className="border-b border-border/40 last:border-0 hover:bg-violet-ghost/40 transition-colors duration-150 group"
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
                          className="text-ink-3 hover:text-violet transition-colors"
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
