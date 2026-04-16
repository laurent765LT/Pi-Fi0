'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  Plus,
  Pencil,
  Trash2,
  Search,
  X,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  ChevronLeft,
  ChevronRight,
  Package,
  Filter,
  Eye,
  Copy,
  Check,
} from 'lucide-react';
import { cn } from '@/lib/cn';
import { useProducts } from '@/hooks/use-products';
import { Badge, type BadgeVariant } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

// ─── Type maps ────────────────────────────────────────────────────────────────

const PAYOFF_LABELS: Record<string, string> = {
  AUTOCALL_PHOENIX: 'Autocall Phoenix',
  AUTOCALL_COUPON: 'Autocall Coupon',
  CAPITAL_PROTECTED: 'Capital Protégé',
  CONDITIONAL_RATE: 'Taux Conditionnel',
  BARRIER_NOTE: 'Barrier Note',
};

const STATUS_VARIANT: Record<string, BadgeVariant> = {
  OPEN: 'teal',
  ACTIVE: 'teal',
  UPCOMING: 'violet',
  CLOSED: 'muted',
  MATURED: 'red',
};

const STATUS_LABEL: Record<string, string> = {
  OPEN: 'Ouvert',
  ACTIVE: 'Actif',
  UPCOMING: 'À venir',
  CLOSED: 'Fermé',
  MATURED: 'Maturé',
};

const PAYOFF_VARIANT: Record<string, BadgeVariant> = {
  AUTOCALL_PHOENIX: 'violet',
  AUTOCALL_COUPON: 'cobalt',
  CAPITAL_PROTECTED: 'teal',
  CONDITIONAL_RATE: 'cobalt',
  BARRIER_NOTE: 'gold',
};

const SRI_COLORS: Record<number, string> = {
  1: '#00B894', 2: '#00B894', 3: '#6FCF97',
  4: '#F2C94C', 5: '#F2994A', 6: '#EB5757', 7: '#E8334A',
};

type SortCol = 'name' | 'isin' | 'payoffType' | 'sri' | 'status' | 'couponPct' | 'barrierCapPct';
type SortDir = 'asc' | 'desc';

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function TableSkeleton() {
  return (
    <div className="animate-pulse">
      {Array.from({ length: 5 }).map((_, i) => (
        <div
          key={i}
          className="flex items-center gap-4 px-5 py-3.5 border-b border-border dark:border-white/10 last:border-0"
        >
          <div className="h-3 w-28 bg-surface-2 dark:bg-white/10 rounded font-mono" />
          <div className="h-3 flex-1 bg-surface-2 dark:bg-white/10 rounded" />
          <div className="h-5 w-20 bg-surface-2 dark:bg-white/10 rounded" />
          <div className="h-5 w-8 bg-surface-2 dark:bg-white/10 rounded" />
          <div className="h-5 w-16 bg-surface-2 dark:bg-white/10 rounded" />
          <div className="h-7 w-20 bg-surface-2 dark:bg-white/10 rounded" />
        </div>
      ))}
    </div>
  );
}

// ─── Sort Header ──────────────────────────────────────────────────────────────

function SortHeader({
  label,
  col,
  sortCol,
  sortDir,
  onSort,
  align = 'left',
}: {
  label: string;
  col: SortCol;
  sortCol: SortCol;
  sortDir: SortDir;
  onSort: (col: SortCol) => void;
  align?: 'left' | 'center' | 'right';
}) {
  const active = sortCol === col;
  return (
    <th
      className={cn(
        'px-5 py-3 text-xs uppercase tracking-widest font-semibold cursor-pointer select-none group',
        'transition-colors duration-150 hover:text-violet',
        active ? 'text-violet dark:text-[#C9BCFF]' : 'text-ink-3 dark:text-white/50',
        align === 'center' && 'text-center',
        align === 'right' && 'text-right',
      )}
      onClick={() => onSort(col)}
    >
      <span className="inline-flex items-center gap-1">
        {label}
        {active ? (
          sortDir === 'asc' ? (
            <ArrowUp size={11} className="text-violet dark:text-[#C9BCFF]" />
          ) : (
            <ArrowDown size={11} className="text-violet dark:text-[#C9BCFF]" />
          )
        ) : (
          <ArrowUpDown size={11} className="opacity-0 group-hover:opacity-60 transition-opacity" />
        )}
      </span>
    </th>
  );
}

// ─── ISIN Copy ────────────────────────────────────────────────────────────────

function IsinCell({ isin }: { isin: string }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = () => {
    navigator.clipboard.writeText(isin);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <span className="inline-flex items-center gap-1.5 font-mono text-xs font-medium text-ink dark:text-white bg-surface-2 dark:bg-white/10 px-2 py-0.5 rounded-xs border border-border dark:border-white/10 group/isin">
      {isin}
      <button
        onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleCopy(); }}
        className="opacity-0 group-hover/isin:opacity-100 transition-opacity p-0.5 rounded hover:bg-violet/10"
        title="Copier l'ISIN"
      >
        {copied ? <Check size={10} className="text-teal" /> : <Copy size={10} className="text-ink-3 dark:text-white/50" />}
      </button>
    </span>
  );
}

// ─── Status Filter Pill ───────────────────────────────────────────────────────

function StatusFilter({
  value,
  active,
  onClick,
  count,
}: {
  value: string;
  active: boolean;
  onClick: () => void;
  count: number;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-semibold font-body transition-all duration-200',
        active
          ? 'bg-gradient-to-r from-[#3B1FA8] to-[#5535C4] text-white shadow-sm shadow-violet/20'
          : 'bg-white/80 dark:bg-white/5 border border-border/60 text-ink-3 hover:text-ink hover:border-violet/30',
      )}
    >
      {STATUS_LABEL[value] ?? value}
      <span
        className={cn(
          'inline-flex items-center justify-center h-4 min-w-4 px-1 rounded-full text-[9px] font-bold',
          active ? 'bg-white/25 text-white' : 'bg-surface-2 dark:bg-white/10 text-ink-3 dark:text-white/50',
        )}
      >
        {count}
      </span>
    </button>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function AdminProductsPage() {
  const { data, isLoading } = useProducts();
  const products = data?.data ?? [];

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [sortCol, setSortCol] = useState<SortCol>('name');
  const [sortDir, setSortDir] = useState<SortDir>('asc');
  const [page, setPage] = useState(1);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const perPage = 10;

  const handleSort = (col: SortCol) => {
    if (sortCol === col) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortCol(col);
      setSortDir('asc');
    }
    setPage(1);
  };

  // Filter + sort
  const processed = useMemo(() => {
    let list = [...products];

    // Text search
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(
        (p: any) =>
          p.name?.toLowerCase().includes(q) ||
          p.isin?.toLowerCase().includes(q) ||
          p.issuerName?.toLowerCase().includes(q),
      );
    }

    // Status filter
    if (statusFilter) {
      list = list.filter((p: any) => p.status === statusFilter);
    }

    // Sort
    list.sort((a: any, b: any) => {
      let va = a[sortCol] ?? '';
      let vb = b[sortCol] ?? '';
      if (typeof va === 'string') va = va.toLowerCase();
      if (typeof vb === 'string') vb = vb.toLowerCase();
      if (va < vb) return sortDir === 'asc' ? -1 : 1;
      if (va > vb) return sortDir === 'asc' ? 1 : -1;
      return 0;
    });

    return list;
  }, [products, search, statusFilter, sortCol, sortDir]);

  // Pagination
  const totalPages = Math.max(1, Math.ceil(processed.length / perPage));
  const paginated = processed.slice((page - 1) * perPage, page * perPage);

  // Status counts for filters
  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    products.forEach((p: any) => {
      counts[p.status] = (counts[p.status] ?? 0) + 1;
    });
    return counts;
  }, [products]);

  return (
    <main className="w-full animate-fade-in">
      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between gap-4 mb-2">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#3B1FA8] to-[#1A0A3E] flex items-center justify-center shadow-sm shadow-[#3B1FA8]/20">
            <Package size={18} className="text-white" />
          </div>
          <div>
            <h1 className="font-display text-2xl font-bold leading-tight bg-gradient-to-r from-[#3B1FA8] via-[#1A0A3E] to-[#3B1FA8] bg-clip-text text-transparent dark:from-white dark:via-[#C9BCFF] dark:to-white">
              Gestion des produits
            </h1>
            <p className="font-body text-sm text-ink-3 dark:text-white/50 mt-0.5">
              {products.length} produit{products.length !== 1 ? 's' : ''} au catalogue
            </p>
          </div>
        </div>
        <Button variant="primary" size="md" asChild>
          <Link href="/admin/products/new" className="flex items-center gap-2">
            <Plus size={16} strokeWidth={2.5} />
            Nouveau produit
          </Link>
        </Button>
      </div>
      <div
        className="h-[2px] rounded-full mb-6"
        style={{
          background: 'linear-gradient(90deg, #3B1FA8, #00B894 40%, #D4A017 70%, transparent)',
        }}
      />

      {/* ── Filters bar ────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 mb-5">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-3" />
          <input
            type="text"
            placeholder="Rechercher par nom, ISIN, émetteur…"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="w-full rounded-lg bg-white/80 dark:bg-white/5 border border-border/60 dark:border-white/10 font-body text-sm text-ink dark:text-white pl-9 pr-8 h-9 placeholder:text-ink-3 dark:placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-violet/30 focus:border-violet/40 transition-all duration-200"
          />
          {search && (
            <button
              onClick={() => { setSearch(''); setPage(1); }}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 rounded hover:bg-ink/5 text-ink-3 dark:text-white/50 hover:text-ink dark:hover:text-white transition-colors"
            >
              <X size={13} />
            </button>
          )}
        </div>

        {/* Status filters */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <Filter size={13} className="text-ink-3 mr-1" />
          <button
            onClick={() => { setStatusFilter(''); setPage(1); }}
            className={cn(
              'px-3 py-1.5 rounded-lg text-[11px] font-semibold font-body transition-all duration-200',
              !statusFilter
                ? 'bg-gradient-to-r from-[#3B1FA8] to-[#5535C4] text-white shadow-sm shadow-violet/20'
                : 'bg-white/80 dark:bg-white/5 border border-border/60 text-ink-3 hover:text-ink hover:border-violet/30',
            )}
          >
            Tous ({products.length})
          </button>
          {Object.entries(statusCounts).map(([status, count]) => (
            <StatusFilter
              key={status}
              value={status}
              active={statusFilter === status}
              onClick={() => { setStatusFilter(statusFilter === status ? '' : status); setPage(1); }}
              count={count}
            />
          ))}
        </div>
      </div>

      {/* ── Active filters display ─────────────────────────────────────────── */}
      {(search || statusFilter) && (
        <div className="flex items-center gap-2 mb-4 flex-wrap">
          {search && (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-violet-pale/50 text-violet text-[11px] font-semibold font-body">
              Recherche: &laquo;{search}&raquo;
              <button onClick={() => { setSearch(''); setPage(1); }} className="hover:bg-violet/10 rounded p-0.5"><X size={10} /></button>
            </span>
          )}
          {statusFilter && (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-violet-pale/50 text-violet text-[11px] font-semibold font-body">
              Statut: {STATUS_LABEL[statusFilter] ?? statusFilter}
              <button onClick={() => { setStatusFilter(''); setPage(1); }} className="hover:bg-violet/10 rounded p-0.5"><X size={10} /></button>
            </span>
          )}
          <button
            onClick={() => { setSearch(''); setStatusFilter(''); setPage(1); }}
            className="text-[11px] text-ink-3 hover:text-violet font-body underline transition-colors"
          >
            Réinitialiser
          </button>
        </div>
      )}

      {/* ── Table ──────────────────────────────────────────────────────────── */}
      {isLoading ? (
        <div className="bg-white/90 dark:bg-white/5 backdrop-blur-md border border-border/60 rounded-xl overflow-hidden shadow-card">
          <TableSkeleton />
        </div>
      ) : processed.length === 0 ? (
        <Card static className="py-16 flex flex-col items-center justify-center gap-3 rounded-xl border-border/60">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#3B1FA8]/10 to-[#00B894]/10 border border-border/40 flex items-center justify-center">
            <Package size={20} className="text-ink-3 opacity-40" />
          </div>
          <p className="font-display text-sm font-bold text-ink dark:text-white">
            {search || statusFilter ? 'Aucun résultat' : 'Aucun produit disponible'}
          </p>
          <p className="font-body text-xs text-ink-3 max-w-xs text-center">
            {search || statusFilter
              ? 'Essayez de modifier vos critères de recherche.'
              : 'Commencez par créer votre premier produit structuré.'}
          </p>
          {(search || statusFilter) && (
            <button
              onClick={() => { setSearch(''); setStatusFilter(''); setPage(1); }}
              className="font-body text-xs text-violet hover:underline mt-1"
            >
              Réinitialiser les filtres
            </button>
          )}
        </Card>
      ) : (
        <div className="bg-white/90 dark:bg-white/5 backdrop-blur-md border border-border/60 rounded-xl overflow-hidden shadow-card">
          {/* Desktop table */}
          <div className="overflow-x-auto hidden md:block">
            <table className="w-full text-sm font-body min-w-[800px]" aria-label="Tableau des produits">
              <thead>
                <tr className="border-b border-border dark:border-white/10 bg-surface-2/50 dark:bg-white/[0.03]">
                  <SortHeader label="ISIN" col="isin" sortCol={sortCol} sortDir={sortDir} onSort={handleSort} />
                  <SortHeader label="Nom" col="name" sortCol={sortCol} sortDir={sortDir} onSort={handleSort} />
                  <SortHeader label="Type" col="payoffType" sortCol={sortCol} sortDir={sortDir} onSort={handleSort} align="center" />
                  <SortHeader label="Coupon" col="couponPct" sortCol={sortCol} sortDir={sortDir} onSort={handleSort} align="center" />
                  <SortHeader label="SRI" col="sri" sortCol={sortCol} sortDir={sortDir} onSort={handleSort} align="center" />
                  <SortHeader label="Statut" col="status" sortCol={sortCol} sortDir={sortDir} onSort={handleSort} align="center" />
                  <th className="px-5 py-3 text-center text-xs uppercase tracking-widest text-ink-3 dark:text-white/50 font-semibold">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {paginated.map((product: any) => (
                  <tr
                    key={product.id}
                    className="border-b border-border/60 dark:border-white/5 last:border-0 hover:bg-violet/[0.04] dark:hover:bg-white/5 transition-colors duration-150 group"
                  >
                    <td className="px-5 py-3.5">
                      <IsinCell isin={product.isin ?? '—'} />
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex flex-col gap-0.5">
                        <Link
                          href={`/products/${product.id}`}
                          className="font-medium text-ink dark:text-white leading-snug truncate max-w-[240px] hover:text-violet transition-colors"
                        >
                          {product.name ?? '—'}
                        </Link>
                        {product.issuerName && (
                          <span className="text-xs text-ink-3 dark:text-white/50">{product.issuerName}</span>
                        )}
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-center">
                      <Badge variant={PAYOFF_VARIANT[product.payoffType] ?? 'muted'}>
                        {PAYOFF_LABELS[product.payoffType] ?? product.payoffType ?? '—'}
                      </Badge>
                    </td>
                    <td className="px-5 py-3.5 text-center">
                      {product.couponPct != null ? (
                        <span className="font-mono text-sm font-bold text-[#008B6E]">
                          {product.couponPct.toFixed(1)}%
                        </span>
                      ) : (
                        <span className="text-ink-3 dark:text-white/40 text-xs">—</span>
                      )}
                    </td>
                    <td className="px-5 py-3.5 text-center">
                      {product.sri != null ? (
                        <span
                          className="inline-flex items-center justify-center w-7 h-7 rounded-full text-white text-xs font-bold shadow-sm"
                          style={{ backgroundColor: SRI_COLORS[product.sri] ?? '#7B6FA0' }}
                          title={`SRI ${product.sri}/7`}
                        >
                          {product.sri}
                        </span>
                      ) : (
                        <span className="text-ink-3 dark:text-white/40 text-xs">—</span>
                      )}
                    </td>
                    <td className="px-5 py-3.5 text-center">
                      <Badge variant={STATUS_VARIANT[product.status] ?? 'muted'}>
                        {STATUS_LABEL[product.status] ?? product.status ?? '—'}
                      </Badge>
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center justify-center gap-1.5">
                        <Button variant="outline" size="sm" asChild>
                          <Link href={`/products/${product.id}`} className="flex items-center gap-1">
                            <Eye size={12} />
                          </Link>
                        </Button>
                        <Button variant="outline" size="sm" asChild>
                          <Link href={`/admin/products/${product.id}/edit`} className="flex items-center gap-1">
                            <Pencil size={12} />
                          </Link>
                        </Button>
                        {deleteConfirm === product.id ? (
                          <div className="flex items-center gap-1">
                            <Button
                              variant="danger"
                              size="sm"
                              onClick={() => setDeleteConfirm(null)}
                            >
                              <X size={12} />
                            </Button>
                            <Button
                              variant="danger"
                              size="sm"
                              onClick={() => {
                                setDeleteConfirm(null);
                                // Delete API call placeholder
                              }}
                            >
                              <Check size={12} />
                            </Button>
                          </div>
                        ) : (
                          <Button
                            variant="danger"
                            size="sm"
                            onClick={() => setDeleteConfirm(product.id)}
                          >
                            <Trash2 size={12} />
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <div className="md:hidden divide-y divide-border/60 dark:divide-white/5">
            {paginated.map((product: any) => (
              <div key={product.id} className="p-4 hover:bg-violet/[0.02] dark:hover:bg-white/5 transition-colors">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="min-w-0">
                    <Link
                      href={`/products/${product.id}`}
                      className="font-body text-sm font-semibold text-ink dark:text-white hover:text-violet transition-colors block truncate"
                    >
                      {product.name ?? '—'}
                    </Link>
                    {product.issuerName && (
                      <p className="text-xs text-ink-3 dark:text-white/50 mt-0.5">{product.issuerName}</p>
                    )}
                  </div>
                  <Badge variant={STATUS_VARIANT[product.status] ?? 'muted'} className="shrink-0">
                    {STATUS_LABEL[product.status] ?? product.status ?? '—'}
                  </Badge>
                </div>
                <div className="flex items-center gap-3 flex-wrap">
                  <span className="font-mono text-[10px] text-ink-3 dark:text-white/50 bg-surface-2 dark:bg-white/10 px-1.5 py-0.5 rounded border border-border dark:border-white/10">
                    {product.isin ?? '—'}
                  </span>
                  <Badge variant={PAYOFF_VARIANT[product.payoffType] ?? 'muted'}>
                    {PAYOFF_LABELS[product.payoffType] ?? '—'}
                  </Badge>
                  {product.couponPct != null && (
                    <span className="font-mono text-xs font-bold text-[#008B6E]">
                      {product.couponPct.toFixed(1)}%
                    </span>
                  )}
                  {product.sri != null && (
                    <span
                      className="inline-flex items-center justify-center w-5 h-5 rounded-full text-white text-[9px] font-bold"
                      style={{ backgroundColor: SRI_COLORS[product.sri] ?? '#7B6FA0' }}
                    >
                      {product.sri}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2 mt-3">
                  <Button variant="outline" size="sm" asChild className="flex-1">
                    <Link href={`/products/${product.id}`} className="flex items-center justify-center gap-1 text-[11px]">
                      <Eye size={11} /> Voir
                    </Link>
                  </Button>
                  <Button variant="outline" size="sm" asChild className="flex-1">
                    <Link href={`/admin/products/${product.id}/edit`} className="flex items-center justify-center gap-1 text-[11px]">
                      <Pencil size={11} /> Modifier
                    </Link>
                  </Button>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination footer */}
          <div className="px-5 py-3 border-t border-border/60 dark:border-white/10 bg-surface-2/30 dark:bg-white/[0.03] flex items-center justify-between gap-4">
            <span className="font-body text-xs text-ink-3 dark:text-white/50">
              <span className="font-mono">{(page - 1) * perPage + 1}</span>–<span className="font-mono">{Math.min(page * perPage, processed.length)}</span> sur{' '}
              <span className="font-mono font-semibold">{processed.length}</span> produit{processed.length !== 1 ? 's' : ''}
              {search ? ` pour «\u00A0${search}\u00A0»` : ''}
            </span>
            {totalPages > 1 && (
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className={cn(
                    'w-7 h-7 rounded-lg flex items-center justify-center transition-all duration-200',
                    page === 1 ? 'opacity-30 cursor-not-allowed' : 'hover:bg-violet/10 text-ink-3 hover:text-violet',
                  )}
                >
                  <ChevronLeft size={14} />
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1)
                  .filter((p) => p === 1 || p === totalPages || Math.abs(p - page) <= 1)
                  .map((p, idx, arr) => (
                    <span key={p} className="contents">
                      {idx > 0 && arr[idx - 1]! + 1 < p && (
                        <span className="text-ink-3 text-xs px-0.5">…</span>
                      )}
                      <button
                        onClick={() => setPage(p)}
                        className={cn(
                          'w-7 h-7 rounded-lg flex items-center justify-center font-mono text-xs font-semibold transition-all duration-200',
                          p === page
                            ? 'bg-gradient-to-r from-[#3B1FA8] to-[#5535C4] text-white shadow-sm'
                            : 'text-ink-3 hover:bg-violet/10 hover:text-violet',
                        )}
                      >
                        {p}
                      </button>
                    </span>
                  ))}
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className={cn(
                    'w-7 h-7 rounded-lg flex items-center justify-center transition-all duration-200',
                    page === totalPages ? 'opacity-30 cursor-not-allowed' : 'hover:bg-violet/10 text-ink-3 hover:text-violet',
                  )}
                >
                  <ChevronRight size={14} />
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </main>
  );
}
