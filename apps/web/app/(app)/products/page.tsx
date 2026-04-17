'use client';

import { useState, useMemo, useRef, useCallback, useEffect } from 'react';
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
  ChevronLeft,
  ChevronRight,
  Filter,
  Layers,
} from 'lucide-react';
import { cn } from '@/lib/cn';
import { PageHeader } from '@/components/ui/page-header';
import { useFiltersStore } from '@/stores/filters-store';
import { useProducts } from '@/hooks/use-products';
import { ProductCard } from '@/components/products/product-card';
import type { PayoffType } from '@/components/products/product-card';
import { useFavorites, useToggleFavorite, useMostViewed } from '@/hooks/use-favorites';
import { useRecommendations, useGenerateRecommendations } from '@/hooks/use-recommendations';
import { useCompareStore } from '@/stores/compare-store';
import { Countdown } from '@/components/ui/countdown';
import { Tooltip } from '@/components/ui/tooltip';
import { TermTooltip, FINANCIAL_GLOSSARY } from '@/components/ui/term-tooltip';

// ─── Constants ───────────────────────────────────────────────────────────────

const PAYOFF_OPTIONS: { value: PayoffType; label: string }[] = [
  { value: 'AUTOCALL_PHOENIX', label: 'Autocall Phoenix' },
  { value: 'AUTOCALL_COUPON', label: 'Autocall Coupon' },
  { value: 'CAPITAL_PROTECTED', label: 'Capital Protege' },
  { value: 'CONDITIONAL_RATE', label: 'Taux Conditionnel' },
  { value: 'BARRIER_NOTE', label: 'Barrier Note' },
];

const STATUS_OPTIONS = [
  { value: 'ACTIVE', label: 'Actif' },
  { value: 'OPEN', label: 'Ouvert' },
  { value: 'UPCOMING', label: 'A venir' },
  { value: 'CLOSED', label: 'Ferme' },
  { value: 'MATURED', label: 'Echu' },
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
  CAPITAL_PROTECTED: 'Protege',
  CONDITIONAL_RATE: 'Taux Cond.',
  BARRIER_NOTE: 'Barrier',
};

const STATUS_BADGE: Record<string, { bg: string; text: string; label: string }> = {
  ACTIVE: { bg: '#E6FAF5', text: '#008B6E', label: 'Actif' },
  OPEN: { bg: '#E6FAF5', text: '#008B6E', label: 'Ouvert' },
  DRAFT: { bg: '#F4F3EF', text: '#7B6FA0', label: 'Brouillon' },
  UPCOMING: { bg: '#E4EAFF', text: '#0A2799', label: 'A venir' },
  CLOSED: { bg: '#F4F3EF', text: '#7B6FA0', label: 'Ferme' },
  MATURED: { bg: '#FFF0F2', text: '#C41F36', label: 'Echu' },
};

const SORT_OPTIONS: { value: SortField; label: string }[] = [
  { value: 'name', label: 'Nom' },
  { value: 'issuerName', label: 'Emetteur' },
  { value: 'maturityDate', label: 'Echeance' },
  { value: 'maxGainPct', label: 'Gain max' },
  { value: 'couponPct', label: 'Coupon' },
  { value: 'barrierCapPct', label: 'Barriere' },
  { value: 'sri', label: 'SRI' },
];

const PAYOFF_FILTER_LABELS: Record<string, string> = {
  AUTOCALL_PHOENIX: 'Autocall Phoenix',
  AUTOCALL_COUPON: 'Autocall Coupon',
  CAPITAL_PROTECTED: 'Capital Protege',
  CONDITIONAL_RATE: 'Taux Conditionnel',
  BARRIER_NOTE: 'Barrier Note',
};

const STATUS_FILTER_LABELS: Record<string, string> = {
  ACTIVE: 'Actif',
  OPEN: 'Ouvert',
  UPCOMING: 'A venir',
  CLOSED: 'Ferme',
  MATURED: 'Echu',
};

type SortField = 'name' | 'issuerName' | 'maturityDate' | 'maxGainPct' | 'barrierCapPct' | 'sri' | 'couponPct';
type SortDir = 'asc' | 'desc';
type ViewFilter = 'all' | 'favorites' | 'recommended' | 'popular';

const PER_PAGE = 12;

const CSV_COLUMNS = ['Nom', 'ISIN', 'Type', 'Emetteur', 'Coupon', 'Barriere', 'SRI', 'Statut'] as const;

function exportProductsCsv(products: any[]) {
  const header = CSV_COLUMNS.join(';');
  const rows = products.map((p: any) => {
    const cells = [
      p.name ?? '',
      p.isin ?? '',
      PAYOFF_SHORT[p.payoffType] ?? p.payoffType ?? '',
      p.issuerName ?? '',
      p.couponPct != null ? `${p.couponPct.toFixed(1)}%` : '',
      p.barrierCapPct != null ? `${p.barrierCapPct.toFixed(0)}%` : '',
      p.sri != null ? String(p.sri) : '',
      STATUS_BADGE[p.status]?.label ?? p.status ?? '',
    ];
    return cells.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(';');
  });
  const csv = '\uFEFF' + [header, ...rows].join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  const date = new Date().toISOString().slice(0, 10);
  a.href = url;
  a.download = `strickin-produits-${date}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' });
}

function formatPct(v: number | null | undefined) {
  if (v == null) return '\u2014';
  return v.toFixed(1) + '%';
}

// ─── Select Component ────────────────────────────────────────────────────────

const selectCls = cn(
  'h-8 rounded-lg border border-border/50 bg-white dark:bg-ink/60 px-2.5 pr-7 text-[12px] font-body text-ink dark:text-surface',
  'transition-all duration-150 cursor-pointer',
  'focus:outline-none focus:ring-2 focus:ring-violet/20 focus:border-violet/40',
  'hover:border-border-2 dark:hover:border-border/60',
  "appearance-none bg-[url('data:image/svg+xml;utf8,<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"10\" height=\"6\" fill=\"none\"><path d=\"M1 1l4 4 4-4\" stroke=\"%237B6FA0\" stroke-width=\"1.4\" stroke-linecap=\"round\" stroke-linejoin=\"round\"/></svg>')] bg-no-repeat bg-[right_8px_center]",
);

// ─── Skeleton ────────────────────────────────────────────────────────────────

function SkeletonCard() {
  return (
    <div className="bg-white dark:bg-ink/40 border border-border/40 dark:border-border/20 rounded-xl p-3.5 animate-pulse flex flex-col gap-2.5">
      <div className="flex justify-between">
        <div className="h-4 w-20 bg-surface-2 dark:bg-surface-3/30 rounded-md" />
        <div className="h-4 w-12 bg-surface-2 dark:bg-surface-3/30 rounded-md" />
      </div>
      <div className="h-3.5 w-3/4 bg-surface-2 dark:bg-surface-3/30 rounded" />
      <div className="h-3 w-1/2 bg-surface-2 dark:bg-surface-3/30 rounded" />
      <div className="h-14 w-full bg-surface-2 dark:bg-surface-3/30 rounded-lg mt-0.5" />
      <div className="h-1 w-full bg-surface-2 dark:bg-surface-3/30 rounded-full" />
      <div className="h-9 w-full bg-surface-2 dark:bg-surface-3/30 rounded-lg mt-auto" />
    </div>
  );
}

function SkeletonRow() {
  return (
    <tr className="border-b border-border/20 animate-pulse">
      {Array.from({ length: 9 }).map((_, i) => (
        <td key={i} className="px-3 py-2.5">
          <div className="h-3 bg-surface-2 dark:bg-surface-3/30 rounded w-full" />
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
  glossaryKey,
}: {
  label: string;
  field: SortField;
  sortField: SortField;
  sortDir: SortDir;
  onSort: (f: SortField) => void;
  className?: string;
  glossaryKey?: string;
}) {
  const active = sortField === field;
  const glossaryDef = glossaryKey ? FINANCIAL_GLOSSARY[glossaryKey] : undefined;
  return (
    <th
      onClick={() => onSort(field)}
      className={cn(
        'px-3 py-2.5 text-left text-[10px] uppercase tracking-[0.15em] font-semibold cursor-pointer select-none group',
        'transition-colors hover:text-violet dark:hover:text-violet-light',
        active ? 'text-violet dark:text-violet-light' : 'text-ink-3 dark:text-ink-3',
        className,
      )}
    >
      <span className="inline-flex items-center gap-1">
        {glossaryKey && glossaryDef ? (
          <TermTooltip term={glossaryKey} definition={glossaryDef}>{label}</TermTooltip>
        ) : (
          label
        )}
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
        'inline-flex items-center gap-1.5 px-3 py-1 text-[12px] font-semibold font-body',
        'transition-all duration-200 whitespace-nowrap rounded-md',
        active
          ? 'bg-violet text-white shadow-[0_1px_6px_rgba(53,53,196,0.3)]'
          : 'text-ink-3 dark:text-ink-3 hover:text-ink dark:hover:text-surface hover:bg-surface-2 dark:hover:bg-surface-3/20',
      )}
    >
      <Icon size={12} className={active ? 'text-white' : ''} />
      {label}
      {count != null && count > 0 && (
        <span
          className={cn(
            'inline-flex items-center justify-center h-[16px] min-w-[16px] px-0.5 rounded-full text-[9px] font-bold leading-none',
            active
              ? 'bg-white/20 text-white'
              : 'bg-violet/8 text-violet/70 dark:bg-violet/20 dark:text-violet-light/80',
          )}
        >
          {count}
        </span>
      )}
    </button>
  );
}

// ─── Active Filter Pill ─────────────────────────────────────────────────────

function FilterPill({ label, onRemove }: { label: string; onRemove: () => void }) {
  return (
    <span className={cn(
      'inline-flex items-center gap-1 h-6 px-2 rounded-lg',
      'bg-violet-ghost dark:bg-violet/10 text-violet dark:text-violet-light',
      'text-[11px] font-semibold font-body',
      'border border-violet/15 dark:border-violet/20',
      'transition-all duration-150 hover:border-violet/30 hover:bg-violet/10',
    )}>
      {label}
      <button
        onClick={onRemove}
        className="p-0.5 rounded-full hover:bg-violet/15 transition-colors"
      >
        <X size={10} />
      </button>
    </span>
  );
}

// ─── Pagination ─────────────────────────────────────────────────────────────

function Pagination({
  page,
  totalPages,
  totalItems,
  perPage,
  onPageChange,
}: {
  page: number;
  totalPages: number;
  totalItems: number;
  perPage: number;
  onPageChange: (p: number) => void;
}) {
  const start = (page - 1) * perPage + 1;
  const end = Math.min(page * perPage, totalItems);

  // Build page numbers array with ellipsis
  const pageNumbers: (number | 'ellipsis')[] = [];
  if (totalPages <= 7) {
    for (let i = 1; i <= totalPages; i++) pageNumbers.push(i);
  } else {
    pageNumbers.push(1);
    if (page > 3) pageNumbers.push('ellipsis');
    for (let i = Math.max(2, page - 1); i <= Math.min(totalPages - 1, page + 1); i++) {
      pageNumbers.push(i);
    }
    if (page < totalPages - 2) pageNumbers.push('ellipsis');
    pageNumbers.push(totalPages);
  }

  return (
    <div className="flex items-center justify-between mt-4 px-1">
      <p className="text-[12px] font-body text-ink-3 dark:text-ink-3">
        Affichage{' '}
        <span className="font-mono font-semibold text-ink dark:text-surface tabular-nums">{start}-{end}</span>
        {' '}sur{' '}
        <span className="font-mono font-semibold text-ink dark:text-surface tabular-nums">{totalItems}</span>
        {' '}produits
      </p>

      <div className="flex items-center gap-1">
        <button
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1}
          className={cn(
            'h-8 w-8 rounded-lg flex items-center justify-center transition-all duration-200',
            'border border-border/50 bg-white dark:bg-ink/40',
            page <= 1
              ? 'opacity-40 cursor-not-allowed'
              : 'hover:border-violet/40 hover:text-violet dark:hover:text-violet-light hover:bg-violet-ghost dark:hover:bg-violet/10',
          )}
        >
          <ChevronLeft size={14} />
        </button>

        {pageNumbers.map((pn, idx) =>
          pn === 'ellipsis' ? (
            <span key={`e-${idx}`} className="w-8 text-center text-ink-3/50 text-[12px] font-mono">...</span>
          ) : (
            <button
              key={pn}
              onClick={() => onPageChange(pn)}
              className={cn(
                'h-8 min-w-[32px] px-1.5 rounded-lg text-[12px] font-mono font-semibold tabular-nums transition-all duration-200',
                pn === page
                  ? 'bg-violet text-white shadow-sm shadow-violet/25'
                  : 'text-ink-3 hover:text-violet dark:hover:text-violet-light hover:bg-violet-ghost dark:hover:bg-violet/10 border border-transparent hover:border-violet/20',
              )}
            >
              {pn}
            </button>
          ),
        )}

        <button
          onClick={() => onPageChange(page + 1)}
          disabled={page >= totalPages}
          className={cn(
            'h-8 w-8 rounded-lg flex items-center justify-center transition-all duration-200',
            'border border-border/50 bg-white dark:bg-ink/40',
            page >= totalPages
              ? 'opacity-40 cursor-not-allowed'
              : 'hover:border-violet/40 hover:text-violet dark:hover:text-violet-light hover:bg-violet-ghost dark:hover:bg-violet/10',
          )}
        >
          <ChevronRight size={14} />
        </button>
      </div>
    </div>
  );
}

// ─── Page ────────────────────────────────────────────────────────────────────

export default function ProductsPage() {
  useEffect(() => { document.title = "Catalogue Produits | Strick'in"; }, []);
  const { payoffType, minSri, maxSri, search, status, setFilter, resetFilters } = useFiltersStore();
  const [view, setView] = useState<'grid' | 'table'>('grid');
  const [sortField, setSortField] = useState<SortField>('name');
  const [sortDir, setSortDir] = useState<SortDir>('asc');
  const [viewFilter, setViewFilter] = useState<ViewFilter>('all');
  const [issuerFilter, setIssuerFilter] = useState<string>('');
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [page, setPage] = useState(1);

  // Debounced search
  const [searchInput, setSearchInput] = useState(search);
  const searchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleSearchChange = useCallback((value: string) => {
    setSearchInput(value);
    if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
    searchTimerRef.current = setTimeout(() => {
      setFilter('search', value);
      setPage(1);
    }, 300);
  }, [setFilter]);

  // Sync external search state to local input (e.g. on reset)
  useEffect(() => {
    setSearchInput(search);
  }, [search]);

  // Cleanup timer
  useEffect(() => {
    return () => {
      if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
    };
  }, []);

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
  const [aiJustGenerated, setAiJustGenerated] = useState(false);

  // Compare store
  const compareIds = useCompareStore((s) => s.productIds);
  const clearCompare = useCompareStore((s) => s.clearAll);

  const products = productsData?.data ?? [];
  const favoriteIds = new Set(
    (favoritesData as any[])?.map((f: any) => f.productId ?? f.product?.id) ?? []
  );
  const recommendationMap = new Map<string, number>(
    (recommendationsData as any[])?.map((r: any) => [r.productId, r.score]) ?? []
  );
  const recommendationReasonMap = new Map<string, string>(
    (recommendationsData as any[])?.filter((r: any) => r.reason).map((r: any) => [r.productId, r.reason]) ?? []
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

  // Pagination
  const totalPages = Math.max(1, Math.ceil(filtered.length / PER_PAGE));
  const safePage = Math.min(page, totalPages);
  const paginatedProducts = useMemo(() => {
    const start = (safePage - 1) * PER_PAGE;
    return filtered.slice(start, start + PER_PAGE);
  }, [filtered, safePage]);

  // Reset page when filters change
  useEffect(() => {
    setPage(1);
  }, [payoffType, minSri, maxSri, status, viewFilter, issuerFilter, sortField, sortDir]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDir('asc');
    }
  };

  const handleClearSearch = () => {
    setSearchInput('');
    setFilter('search', '');
    setPage(1);
  };

  // Build active filter pills
  const activeFilters: { key: string; label: string; onRemove: () => void }[] = [];
  if (search) {
    activeFilters.push({
      key: 'search',
      label: `Recherche : "${search}"`,
      onRemove: () => { setFilter('search', ''); setSearchInput(''); },
    });
  }
  if (payoffType) {
    activeFilters.push({
      key: 'payoffType',
      label: `Type : ${PAYOFF_FILTER_LABELS[payoffType] ?? payoffType}`,
      onRemove: () => setFilter('payoffType', null),
    });
  }
  if (status) {
    activeFilters.push({
      key: 'status',
      label: `Statut : ${STATUS_FILTER_LABELS[status] ?? status}`,
      onRemove: () => setFilter('status', ''),
    });
  }
  if (minSri !== null) {
    activeFilters.push({
      key: 'minSri',
      label: `SRI min : ${minSri}`,
      onRemove: () => setFilter('minSri', null),
    });
  }
  if (maxSri !== null) {
    activeFilters.push({
      key: 'maxSri',
      label: `SRI max : ${maxSri}`,
      onRemove: () => setFilter('maxSri', null),
    });
  }
  if (issuerFilter) {
    activeFilters.push({
      key: 'issuer',
      label: `Emetteur : ${issuerFilter}`,
      onRemove: () => setIssuerFilter(''),
    });
  }

  return (
    <div className="animate-fade-in">
      <PageHeader
        icon={Layers}
        title="Produits structures"
        subtitle="Explorez et filtrez les produits structures disponibles."
        accentFrom="#3B1FA8"
        accentTo="#5B3FD4"
        className="mb-3"
      >
        {/* Generate Recommendations */}
        <button
          onClick={() => {
            setAiJustGenerated(false);
            generateRecs.mutate(undefined, {
              onSuccess: () => {
                setAiJustGenerated(true);
                setViewFilter('recommended');
                // Clear the "just generated" highlight after 5s
                setTimeout(() => setAiJustGenerated(false), 5000);
              },
            });
          }}
          disabled={generateRecs.isPending}
          className={cn(
            'h-8 px-3 rounded-lg border text-[11px] font-semibold font-body',
            'flex items-center gap-1.5 transition-all duration-200',
            generateRecs.isPending
              ? 'bg-gradient-to-r from-violet to-cobalt-light text-white border-transparent shadow-md shadow-violet/25 animate-pulse-subtle'
              : aiJustGenerated
              ? 'bg-teal text-white border-teal shadow-md shadow-teal/25'
              : 'border-violet/25 bg-violet-ghost dark:bg-violet/10 text-violet dark:text-violet-light hover:bg-violet/10 hover:border-violet/40 hover:shadow-sm',
            'disabled:cursor-wait',
          )}
        >
          <Sparkles size={12} className={generateRecs.isPending ? 'animate-spin' : ''} />
          {generateRecs.isPending ? 'Analyse IA...' : aiJustGenerated ? 'Pretes !' : 'Suggestions IA'}
        </button>

        {/* Export */}
        <button
          onClick={() => exportProductsCsv(filtered)}
          className={cn(
            'h-8 px-3 rounded-lg border border-border/50 bg-white dark:bg-ink/40 text-ink-3 dark:text-ink-3',
            'text-[11px] font-medium font-body',
            'flex items-center gap-1.5 transition-all duration-200',
            'hover:border-violet/40 hover:text-violet dark:hover:text-violet-light hover:bg-violet-ghost dark:hover:bg-violet/10 hover:shadow-sm',
          )}
        >
          <Download size={12} />
          Export
        </button>

        {/* View toggle */}
        <div className="flex items-center h-8 rounded-lg border border-border/50 bg-white dark:bg-ink/40 overflow-hidden">
          <button
            onClick={() => setView('grid')}
            className={cn(
              'h-full px-2.5 flex items-center justify-center transition-all duration-200',
              view === 'grid'
                ? 'bg-violet text-white'
                : 'text-ink-3 hover:bg-surface-2 dark:hover:bg-surface-3/20 hover:text-ink dark:hover:text-surface',
            )}
            title="Vue grille"
          >
            <LayoutGrid size={13} />
          </button>
          <div className="w-px h-4 bg-border/40" />
          <button
            onClick={() => setView('table')}
            className={cn(
              'h-full px-2.5 flex items-center justify-center transition-all duration-200',
              view === 'table'
                ? 'bg-violet text-white'
                : 'text-ink-3 hover:bg-surface-2 dark:hover:bg-surface-3/20 hover:text-ink dark:hover:text-surface',
            )}
            title="Vue tableau"
          >
            <List size={13} />
          </button>
        </div>
      </PageHeader>

      {/* ── Summary Stats Bar ────────────────────────────────────────── */}
      {!isLoading && !isError && products.length > 0 && (
        <div className="flex items-center gap-4 mb-3 px-3.5 py-2 rounded-xl bg-white/80 dark:bg-white/[0.04] backdrop-blur-md border border-border/40 dark:border-white/8 shadow-sm">
          {(() => {
            const avgCoupon = products.filter((p: any) => p.couponPct != null && p.couponPct > 0).reduce((s: number, p: any) => s + p.couponPct, 0) / Math.max(1, products.filter((p: any) => p.couponPct != null && p.couponPct > 0).length);
            const avgBarrier = products.filter((p: any) => p.barrierCapPct != null).reduce((s: number, p: any) => s + p.barrierCapPct, 0) / Math.max(1, products.filter((p: any) => p.barrierCapPct != null).length);
            const sriDist = [0, 0, 0, 0, 0, 0, 0];
            products.forEach((p: any) => { if (p.sri >= 1 && p.sri <= 7) sriDist[p.sri - 1]++; });
            const activeCount = products.filter((p: any) => p.status === 'ACTIVE' || p.status === 'OPEN').length;

            return (
              <>
                <div className="flex items-center gap-1.5">
                  <span className="text-[9px] uppercase tracking-wider text-ink-3 dark:text-white/40 font-semibold font-body">Coupon moy.</span>
                  <span className="font-mono text-[13px] font-bold text-[#008B6E] tabular-nums">{avgCoupon.toFixed(1)}%</span>
                </div>
                <div className="w-px h-4 bg-border/40 dark:bg-white/8" />
                <div className="flex items-center gap-1.5">
                  <span className="text-[9px] uppercase tracking-wider text-ink-3 dark:text-white/40 font-semibold font-body">Barriere moy.</span>
                  <span className="font-mono text-[13px] font-bold text-[#E8334A] tabular-nums">{avgBarrier.toFixed(0)}%</span>
                </div>
                <div className="w-px h-4 bg-border/40 dark:bg-white/8" />
                <div className="flex items-center gap-1.5">
                  <span className="text-[9px] uppercase tracking-wider text-ink-3 dark:text-white/40 font-semibold font-body">Actifs</span>
                  <span className="font-mono text-[13px] font-bold text-[#3B1FA8] dark:text-[#C9BCFF] tabular-nums">{activeCount}</span>
                </div>
                <div className="w-px h-4 bg-border/40 dark:bg-white/8 hidden lg:block" />
                <div className="hidden lg:flex items-center gap-1">
                  <span className="text-[9px] uppercase tracking-wider text-ink-3 dark:text-white/40 font-semibold font-body mr-1">SRI</span>
                  {sriDist.map((count, i) => (
                    <Tooltip key={i} content={`SRI ${i + 1} : ${count} produit${count > 1 ? 's' : ''}`}>
                      <div
                        className="h-3 rounded-sm min-w-[4px] transition-all duration-300"
                        style={{
                          width: `${Math.max(4, (count / products.length) * 60)}px`,
                          backgroundColor: i <= 1 ? '#00B894' : i <= 3 ? '#D4A017' : '#E8334A',
                          opacity: count > 0 ? 0.7 : 0.15,
                        }}
                      />
                    </Tooltip>
                  ))}
                </div>
              </>
            );
          })()}
        </div>
      )}

      {/* ── Sticky Toolbar: Tabs + Search + Filters ──────────────────── */}
      <div className={cn(
        'sticky top-0 z-20',
        'bg-white/80 dark:bg-ink/80 backdrop-blur-xl',
        'border-y border-border/30 dark:border-border/15',
        '-mx-4 md:-mx-8 px-4 md:px-8 py-2.5',
        'flex flex-col gap-2',
      )}>
        {/* Row 1: Tabs + result count */}
        <div className="flex items-center justify-between">
          <div className="flex items-center rounded-lg bg-surface/80 dark:bg-surface-3/15 p-0.5 gap-0.5">
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
              label="IA"
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

          {!isLoading && !isError && (
            <div className="flex items-center gap-2">
              <p className="text-[11px] text-ink-3 dark:text-ink-3 font-body">
                <span className="font-semibold text-ink dark:text-surface font-mono tabular-nums">{filtered.length}</span>{' '}
                resultat{filtered.length > 1 ? 's' : ''}
              </p>
              {viewFilter === 'recommended' && (
                <span className="text-[10px] text-violet/60 dark:text-violet-light/50 font-body flex items-center gap-0.5">
                  <Sparkles size={8} />
                  par pertinence
                </span>
              )}
            </div>
          )}
        </div>

        {/* Row 2: Search + filters all on one line */}
        <div className="flex items-center gap-2">
          {/* Search input with clear button and result count */}
          <div className="relative flex-1 min-w-[180px]">
            <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-ink-3/40 pointer-events-none" />
            <input
              type="text"
              value={searchInput}
              onChange={(e) => handleSearchChange(e.target.value)}
              placeholder="Rechercher nom, ISIN, sous-jacent..."
              className={cn(
                'w-full h-8 rounded-lg bg-surface/60 dark:bg-surface-3/10 border border-border/40 dark:border-border/20 pl-8 pr-16 text-[12px] font-body text-ink dark:text-surface',
                'placeholder:text-ink-3/40 dark:placeholder:text-ink-3/30 transition-all duration-200',
                'focus:outline-none focus:ring-2 focus:ring-violet/20 focus:border-violet/40 focus:bg-white dark:focus:bg-ink/60 focus:shadow-sm',
              )}
            />
            {/* Result count + clear button inside input */}
            <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
              {searchInput && !isLoading && (
                <span className="text-[10px] font-mono text-ink-3/60 tabular-nums">
                  {filtered.length} resultat{filtered.length !== 1 ? 's' : ''}
                </span>
              )}
              {searchInput && (
                <button
                  onClick={handleClearSearch}
                  className="p-0.5 rounded hover:bg-surface-2 dark:hover:bg-white/10 text-ink-3/40 hover:text-ink-3 transition-colors"
                >
                  <X size={12} />
                </button>
              )}
            </div>
          </div>

          {/* Payoff Type */}
          <select
            value={payoffType ?? ''}
            onChange={(e) => setFilter('payoffType', e.target.value ? (e.target.value as PayoffType) : null)}
            className={selectCls}
          >
            <option value="">Type</option>
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

          {/* Sort control */}
          <div className="flex items-center gap-1">
            <select
              value={sortField}
              onChange={(e) => setSortField(e.target.value as SortField)}
              className={selectCls}
            >
              {SORT_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>Tri : {o.label}</option>
              ))}
            </select>
            <button
              onClick={() => setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))}
              className={cn(
                'h-8 w-8 rounded-lg border border-border/50 bg-white dark:bg-ink/40 flex items-center justify-center',
                'text-ink-3 hover:text-violet dark:hover:text-violet-light hover:border-violet/40 transition-all duration-200',
                'focus:outline-none focus:ring-2 focus:ring-violet/20 focus:border-violet/40',
              )}
              title={sortDir === 'asc' ? 'Croissant' : 'Decroissant'}
            >
              {sortDir === 'asc' ? <ArrowUp size={12} /> : <ArrowDown size={12} />}
            </button>
          </div>

          {/* Advanced toggle */}
          <button
            onClick={() => setShowAdvanced(!showAdvanced)}
            className={cn(
              'h-8 px-2.5 rounded-lg border text-[11px] font-medium font-body',
              'flex items-center gap-1 transition-all duration-200',
              showAdvanced
                ? 'border-violet/40 text-violet dark:text-violet-light bg-violet-ghost dark:bg-violet/10 shadow-sm'
                : 'border-border/50 text-ink-3 bg-white dark:bg-ink/40 hover:border-violet/40 hover:text-violet dark:hover:text-violet-light',
            )}
          >
            <SlidersHorizontal size={11} />
            <span className="hidden lg:inline">Avances</span>
            <ChevronDown
              size={10}
              className={cn('transition-transform duration-200', showAdvanced && 'rotate-180')}
            />
          </button>

          {/* Reset */}
          {hasActiveFilters && (
            <button
              onClick={() => {
                resetFilters();
                setIssuerFilter('');
                setSearchInput('');
              }}
              className={cn(
                'h-8 px-2.5 rounded-lg border border-red/20 text-red bg-red-light dark:bg-red/10',
                'text-[11px] font-semibold font-body flex items-center gap-1',
                'transition-all duration-200 hover:bg-red/10 hover:border-red/40',
              )}
            >
              <X size={11} />
              <span className="hidden sm:inline">Reset</span>
              <span className="inline-flex items-center justify-center h-[15px] min-w-[15px] px-0.5 rounded-full bg-red text-white text-[9px] font-bold">
                {activeFilterCount}
              </span>
            </button>
          )}
        </div>

        {/* Advanced filters expandable -- inside sticky bar */}
        <div
          className={cn(
            'overflow-hidden transition-all duration-300 ease-out',
            showAdvanced ? 'max-h-16 opacity-100' : 'max-h-0 opacity-0',
          )}
        >
          <div className="flex items-center gap-2.5 flex-wrap pt-1 pb-0.5">
            {/* SRI Range */}
            <div className="flex items-center gap-1.5 text-[11px] font-body text-ink-3 dark:text-ink-3">
              <span className="font-semibold text-ink dark:text-surface text-[10px] uppercase tracking-wider">
                <TermTooltip term="SRI" definition={FINANCIAL_GLOSSARY['SRI']!}>SRI</TermTooltip>
              </span>
              <select
                value={minSri ?? ''}
                onChange={(e) => setFilter('minSri', e.target.value ? Number(e.target.value) : null)}
                className={cn(selectCls, 'w-14 text-center')}
              >
                <option value="">Min</option>
                {[1, 2, 3, 4, 5, 6, 7].map((n) => (
                  <option key={n} value={n}>{n}</option>
                ))}
              </select>
              <span className="text-ink-3/30">&mdash;</span>
              <select
                value={maxSri ?? ''}
                onChange={(e) => setFilter('maxSri', e.target.value ? Number(e.target.value) : null)}
                className={cn(selectCls, 'w-14 text-center')}
              >
                <option value="">Max</option>
                {[1, 2, 3, 4, 5, 6, 7].map((n) => (
                  <option key={n} value={n}>{n}</option>
                ))}
              </select>
            </div>

            <div className="w-px h-4 bg-border/30" />

            {/* Issuer filter */}
            <select
              value={issuerFilter}
              onChange={(e) => setIssuerFilter(e.target.value)}
              className={selectCls}
            >
              <option value="">Emetteur</option>
              {ISSUER_OPTIONS.map((name) => (
                <option key={name} value={name}>{name}</option>
              ))}
            </select>
          </div>
        </div>

        {/* ── Active Filters Pills ── */}
        {activeFilters.length > 0 && (
          <div className="flex items-center gap-1.5 flex-wrap pt-0.5 pb-0.5">
            {activeFilters.map((af) => (
              <FilterPill key={af.key} label={af.label} onRemove={af.onRemove} />
            ))}
            <button
              onClick={() => {
                resetFilters();
                setIssuerFilter('');
                setSearchInput('');
              }}
              className="text-[11px] text-ink-3 hover:text-red font-semibold font-body ml-1 transition-colors duration-150"
            >
              Reinitialiser tout
            </button>
          </div>
        )}
      </div>

      {/* ── Content ─────────────────────────────────────────────────────── */}
      <div className="mt-3">
        {isLoading ? (
          view === 'grid' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3 stagger-children">
              {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}
            </div>
          ) : (
            <div className="bg-white dark:bg-ink/30 rounded-xl border border-border/40 dark:border-border/20 overflow-hidden">
              <table className="w-full">
                <thead className="sticky top-0 z-10">
                  <tr className="border-b border-border/30 bg-surface/80 dark:bg-ink/60 backdrop-blur-sm">
                    {['', 'Produit', 'ISIN', 'Emetteur', 'Type', 'Barriere', 'Gain max', 'SRI', 'Echeance', 'Statut'].map((h) => (
                      <th key={h} className="px-3 py-2.5 text-left text-[10px] uppercase tracking-[0.15em] text-ink-3 font-semibold">{h}</th>
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
          /* ── Error State ───────────────────────────────────────── */
          <div className="flex flex-col items-center justify-center py-14 gap-2.5 bg-white dark:bg-ink/30 rounded-xl border border-red/10 dark:border-red/5">
            <div className="w-11 h-11 rounded-xl bg-red-light dark:bg-red/10 flex items-center justify-center">
              <X size={20} className="text-red" />
            </div>
            <p className="text-red font-body text-[13px] font-medium">
              Erreur lors du chargement des produits.
            </p>
            <p className="text-ink-3 font-body text-[11px]">
              Veuillez reessayer dans quelques instants.
            </p>
          </div>
        ) : filtered.length === 0 ? (
          /* ── Empty State ───────────────────────────────────────── */
          <div className={cn(
            'flex flex-col items-center justify-center py-16 gap-3',
            'bg-gradient-to-b from-white to-surface/40 dark:from-ink/30 dark:to-ink/10',
            'rounded-xl border border-border/30 dark:border-border/15',
          )}>
            <div className={cn(
              'w-14 h-14 rounded-2xl flex items-center justify-center',
              'bg-gradient-to-br from-violet-ghost to-violet-pale dark:from-violet/15 dark:to-violet/5',
              'shadow-sm',
            )}>
              {viewFilter === 'favorites' ? (
                <Heart size={24} className="text-violet/60 dark:text-violet-light/60" />
              ) : viewFilter === 'recommended' ? (
                <Sparkles size={24} className="text-violet/60 dark:text-violet-light/60" />
              ) : (
                <PackageSearch size={24} className="text-violet/60 dark:text-violet-light/60" />
              )}
            </div>
            <div className="text-center">
              <p className="font-body text-[13px] font-semibold text-ink dark:text-surface mb-0.5">
                {viewFilter === 'favorites'
                  ? 'Aucun favori pour le moment'
                  : viewFilter === 'recommended'
                  ? 'Pas encore de suggestions IA'
                  : 'Aucun produit trouve'}
              </p>
              <p className="font-body text-[11px] text-ink-3 dark:text-ink-3 max-w-[280px] leading-relaxed">
                {viewFilter === 'favorites'
                  ? 'Cliquez sur le coeur sur un produit pour le retrouver ici.'
                  : viewFilter === 'recommended'
                  ? 'Lancez une analyse IA pour recevoir des recommandations personnalisees.'
                  : 'Essayez de modifier vos filtres ou votre recherche.'}
              </p>
            </div>
            {viewFilter === 'recommended' && (
              <button
                onClick={() => {
                  generateRecs.mutate(undefined, {
                    onSuccess: () => {
                      setAiJustGenerated(true);
                      setTimeout(() => setAiJustGenerated(false), 5000);
                    },
                  });
                }}
                disabled={generateRecs.isPending}
                className={cn(
                  'text-[12px] text-white px-4 py-2 rounded-lg font-semibold transition-all duration-200 hover:shadow-md disabled:cursor-wait flex items-center gap-1.5',
                  generateRecs.isPending
                    ? 'bg-gradient-to-r from-violet to-cobalt-light animate-pulse-subtle'
                    : 'bg-violet hover:bg-violet-mid',
                )}
              >
                <Sparkles size={12} className={generateRecs.isPending ? 'animate-spin' : ''} />
                {generateRecs.isPending ? 'Analyse IA...' : 'Generer des suggestions'}
              </button>
            )}
            {(viewFilter === 'all' || viewFilter === 'popular') && hasActiveFilters && (
              <button
                onClick={() => { resetFilters(); setIssuerFilter(''); setSearchInput(''); }}
                className="text-[12px] text-violet dark:text-violet-light font-semibold hover:underline flex items-center gap-1"
              >
                <X size={11} />
                Reinitialiser les filtres
              </button>
            )}
          </div>
        ) : view === 'grid' ? (
          /* ── Grid View ─────────────────────────────────────────── */
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3 stagger-children stagger-grid">
              {paginatedProducts.map((product: any) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  isFavorited={favoriteIds.has(product.id)}
                  recommendationScore={recommendationMap.get(product.id) ?? null}
                  aiReason={recommendationReasonMap.get(product.id) ?? null}
                />
              ))}
            </div>
            {filtered.length > PER_PAGE && (
              <Pagination
                page={safePage}
                totalPages={totalPages}
                totalItems={filtered.length}
                perPage={PER_PAGE}
                onPageChange={setPage}
              />
            )}
          </>
        ) : (
          /* ── Table View ────────────────────────────────────────── */
          <>
            <div className="bg-white dark:bg-ink/30 rounded-xl border border-border/40 dark:border-border/20 overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-[12px] font-body">
                  <thead className="sticky top-0 z-10">
                    <tr className="border-b border-border/30 bg-surface/80 dark:bg-ink/60 backdrop-blur-sm">
                      <th className="px-2.5 py-2.5 w-9" />
                      <SortTh label="Produit" field="name" sortField={sortField} sortDir={sortDir} onSort={handleSort} />
                      <th className="px-3 py-2.5 text-left text-[10px] uppercase tracking-[0.15em] text-ink-3 font-semibold">ISIN</th>
                      <SortTh label="Emetteur" field="issuerName" sortField={sortField} sortDir={sortDir} onSort={handleSort} />
                      <th className="px-3 py-2.5 text-left text-[10px] uppercase tracking-[0.15em] text-ink-3 font-semibold">Type</th>
                      <SortTh label="Barriere" field="barrierCapPct" sortField={sortField} sortDir={sortDir} onSort={handleSort} className="text-right" glossaryKey="Barrière" />
                      <SortTh label="Coupon" field="couponPct" sortField={sortField} sortDir={sortDir} onSort={handleSort} className="text-right" glossaryKey="Coupon" />
                      <SortTh label="Gain max" field="maxGainPct" sortField={sortField} sortDir={sortDir} onSort={handleSort} className="text-right" />
                      <SortTh label="SRI" field="sri" sortField={sortField} sortDir={sortDir} onSort={handleSort} className="text-center" glossaryKey="SRI" />
                      <SortTh label="Echeance" field="maturityDate" sortField={sortField} sortDir={sortDir} onSort={handleSort} />
                      <th className="px-3 py-2.5 text-center text-[10px] uppercase tracking-[0.15em] text-ink-3 font-semibold">Statut</th>
                      <th className="px-3 py-2.5 w-9" />
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedProducts.map((p: any, idx: number) => {
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
                            'border-b border-border/20 dark:border-border/10 last:border-0 transition-colors duration-150 group',
                            'hover:bg-violet-ghost/50 dark:hover:bg-violet/5',
                            isEven && 'bg-surface/30 dark:bg-surface-3/5',
                          )}
                        >
                          {/* Favorite */}
                          <td className="px-2.5 py-2.5">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleFavorite.mutate(p.id);
                              }}
                              className={cn(
                                'p-0.5 rounded-full transition-all duration-200',
                                isFav
                                  ? 'text-red'
                                  : 'text-ink-3/30 hover:text-red opacity-0 group-hover:opacity-100',
                              )}
                            >
                              <Heart size={12} fill={isFav ? 'currentColor' : 'none'} />
                            </button>
                          </td>

                          {/* Product name */}
                          <td className="px-3 py-2.5">
                            <Link href={`/products/${p.id}`} className="hover:text-violet dark:hover:text-violet-light transition-colors font-medium text-ink dark:text-surface leading-tight block max-w-[180px] truncate text-[12px]">
                              {p.name}
                            </Link>
                            {recScore != null && recScore >= 70 && (
                              <span className="inline-flex items-center gap-0.5 mt-0.5 text-[9px] text-violet dark:text-violet-light font-medium">
                                <Sparkles size={7} /> IA {recScore}%
                              </span>
                            )}
                          </td>

                          {/* ISIN */}
                          <td className="px-3 py-2.5">
                            <span className="font-mono text-[10px] text-ink-3 tabular-nums">{p.isin}</span>
                          </td>

                          {/* Issuer */}
                          <td className="px-3 py-2.5 text-ink-2 dark:text-ink-3 max-w-[130px] truncate text-[12px]">{p.issuerName}</td>

                          {/* Type badge */}
                          <td className="px-3 py-2.5">
                            <span
                              className="inline-flex items-center rounded-md px-1.5 py-0.5 text-[9px] font-semibold"
                              style={{ backgroundColor: payoffStyle.bg, color: payoffStyle.text }}
                            >
                              {PAYOFF_SHORT[p.payoffType] ?? p.payoffType}
                            </span>
                          </td>

                          {/* Barrier */}
                          <td className="px-3 py-2.5 text-right font-mono tabular-nums text-red font-semibold text-[11px]">
                            {formatPct(p.barrierCapPct)}
                          </td>

                          {/* Coupon */}
                          <td className="px-3 py-2.5 text-right font-mono tabular-nums text-teal font-semibold text-[11px]">
                            {formatPct(p.couponPct)}
                          </td>

                          {/* Max Gain */}
                          <td className="px-3 py-2.5 text-right font-mono tabular-nums font-bold text-ink dark:text-surface text-[11px]">
                            {formatPct(p.maxGainPct)}
                          </td>

                          {/* SRI */}
                          <td className="px-3 py-2.5 text-center">
                            <Tooltip content="Indicateur de risque de 1 (faible) a 7 (eleve)">
                              <span
                                className="inline-flex items-center justify-center w-5 h-5 rounded-md text-[9px] font-bold"
                                style={{ backgroundColor: `${sriColor}15`, color: sriColor }}
                              >
                                {p.sri}
                              </span>
                            </Tooltip>
                          </td>

                          {/* Maturity */}
                          <td className="px-3 py-2.5 text-[11px] text-ink-2 dark:text-ink-3 whitespace-nowrap">
                            <span className="inline-flex items-center gap-1">
                              <Calendar size={9} className="text-ink-3" />
                              {p.maturityDate ? formatDate(p.maturityDate) : '\u2014'}
                            </span>
                          </td>

                          {/* Status */}
                          <td className="px-3 py-2.5 text-center">
                            <span
                              className="inline-flex items-center rounded-md px-1.5 py-0.5 text-[9px] font-semibold"
                              style={{ backgroundColor: statusStyle.bg, color: statusStyle.text }}
                            >
                              {statusStyle.label}
                            </span>
                            {p.shelfClosingDate && new Date(p.shelfClosingDate) > new Date() && (
                              <div className="mt-0.5">
                                <Countdown targetDate={p.shelfClosingDate} label="Cloture" className="text-[9px]" />
                              </div>
                            )}
                          </td>

                          {/* Action */}
                          <td className="px-3 py-2.5">
                            <Link
                              href={`/products/${p.id}`}
                              className="text-ink-3/30 hover:text-violet dark:hover:text-violet-light transition-colors group-hover:text-ink-3"
                            >
                              <ArrowUpRight size={13} />
                            </Link>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
            {filtered.length > PER_PAGE && (
              <Pagination
                page={safePage}
                totalPages={totalPages}
                totalItems={filtered.length}
                perPage={PER_PAGE}
                onPageChange={setPage}
              />
            )}
          </>
        )}
      </div>

      {/* ── Batch Actions Bar (floating, appears when products are selected for compare) ── */}
      <div
        className={cn(
          'fixed bottom-0 left-0 right-0 z-50',
          'transition-all duration-300 ease-out',
          compareIds.length > 0
            ? 'translate-y-0 opacity-100'
            : 'translate-y-full opacity-0 pointer-events-none',
        )}
      >
        <div className={cn(
          'mx-auto max-w-3xl mb-4 px-5 py-3 rounded-xl',
          'bg-[#1A0A3E]/95 backdrop-blur-xl border border-violet/20',
          'shadow-2xl shadow-violet/20',
          'flex items-center justify-between gap-4',
        )}>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-violet/20 flex items-center justify-center">
              <Layers size={14} className="text-violet-light" />
            </div>
            <span className="text-[13px] font-body text-white">
              <span className="font-mono font-bold tabular-nums">{compareIds.length}</span>{' '}
              produit{compareIds.length > 1 ? 's' : ''} selectionne{compareIds.length > 1 ? 's' : ''}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href="/products/compare"
              className={cn(
                'h-8 px-4 rounded-lg text-[12px] font-semibold font-body',
                'bg-violet text-white',
                'flex items-center gap-1.5',
                'transition-all duration-200 hover:bg-violet-mid hover:shadow-md hover:shadow-violet/30',
              )}
            >
              <Layers size={12} />
              Comparer
            </Link>
            <button
              onClick={() => {
                const selected = products.filter((p: any) => compareIds.includes(p.id));
                if (selected.length > 0) exportProductsCsv(selected);
              }}
              className={cn(
                'h-8 px-4 rounded-lg text-[12px] font-semibold font-body',
                'bg-white/10 text-white border border-white/10',
                'flex items-center gap-1.5',
                'transition-all duration-200 hover:bg-white/20 hover:border-white/20',
              )}
            >
              <Download size={12} />
              Exporter
            </button>
            <button
              onClick={() => clearCompare()}
              className="p-1.5 rounded-lg text-white/50 hover:text-white hover:bg-white/10 transition-all duration-200"
              title="Effacer la selection"
            >
              <X size={14} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
