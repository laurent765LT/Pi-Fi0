'use client';

import { useEffect, useState, useMemo } from 'react';
import {
  Layers,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  AlertTriangle,
  TrendingUp,
} from 'lucide-react';
import { cn } from '@/lib/cn';
import { api } from '@/lib/api';
import { Badge, type BadgeVariant } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { ProgressBar } from '@/components/ui/progress-bar';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatAmount(amount: number): string {
  if (amount >= 1_000_000) {
    return `${(amount / 1_000_000).toFixed(1)} M€`;
  }
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatDate(isoDate: string): string {
  if (!isoDate) return '—';
  return new Date(isoDate).toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

// ─── Status config ────────────────────────────────────────────────────────────

const SHELF_STATUS_VARIANT: Record<string, BadgeVariant> = {
  OPEN: 'teal',
  CLOSING_SOON: 'gold',
  CLOSED: 'red',
  PENDING: 'violet',
};

const SHELF_STATUS_LABEL: Record<string, string> = {
  OPEN: 'Ouvert',
  CLOSING_SOON: 'Fermeture proche',
  CLOSED: 'Fermé',
  PENDING: 'En attente',
};

type SortCol = 'productName' | 'targetAmount' | 'fillPct' | 'status' | 'closingDate' | 'commitmentCount';
type SortDir = 'asc' | 'desc';

// ─── Fill indicator ───────────────────────────────────────────────────────────

function FillCell({ fillPct, targetAmount }: { fillPct: number; targetAmount: number }) {
  return (
    <div className="flex flex-col gap-1 min-w-[120px]">
      <div className="flex items-center justify-between gap-2">
        <span className={cn(
          'font-body text-xs font-semibold',
          fillPct >= 90 ? 'text-[#E8334A]' : fillPct >= 70 ? 'text-[#D4A017]' : 'text-ink-2',
        )}>
          {Math.round(fillPct)}%
        </span>
        <span className="font-body text-[10px] text-ink-3">
          / {formatAmount(targetAmount)}
        </span>
      </div>
      <ProgressBar value={fillPct} heightClass="h-1.5" />
      {fillPct >= 90 && (
        <span className="flex items-center gap-1 text-[9px] font-bold text-[#E8334A] mt-0.5">
          <AlertTriangle size={8} /> Presque complet
        </span>
      )}
    </div>
  );
}

// ─── KPI Card ─────────────────────────────────────────────────────────────────

function ShelfKpi({ label, value, accent }: { label: string; value: React.ReactNode; accent: string }) {
  return (
    <div className="bg-white dark:bg-[#1A0A3E]/40 border border-border/60 rounded-xl p-4 flex items-center gap-3 shadow-sm hover:shadow-md transition-all duration-200 hover:-translate-y-0.5">
      <div
        className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ring-1 ring-black/5 dark:ring-white/10"
        style={{ background: `linear-gradient(135deg, ${accent}14, ${accent}08)`, color: accent }}
      >
        <TrendingUp size={16} />
      </div>
      <div className="flex flex-col gap-0.5">
        <span className="text-ink-3 text-[10px] uppercase tracking-widest font-body font-semibold">{label}</span>
        <span className="font-display text-lg font-bold text-ink dark:text-white leading-none">{value}</span>
      </div>
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
        'px-5 py-3 text-xs uppercase tracking-widest font-semibold cursor-pointer select-none group transition-colors duration-150 hover:text-violet',
        active ? 'text-violet' : 'text-ink-3',
        align === 'center' && 'text-center',
        align === 'right' && 'text-right',
        align === 'left' && 'text-left',
      )}
      onClick={() => onSort(col)}
    >
      <span className="inline-flex items-center gap-1">
        {label}
        {active ? (
          sortDir === 'asc' ? <ArrowUp size={11} className="text-violet" /> : <ArrowDown size={11} className="text-violet" />
        ) : (
          <ArrowUpDown size={11} className="opacity-0 group-hover:opacity-60 transition-opacity" />
        )}
      </span>
    </th>
  );
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function TableSkeleton() {
  return (
    <div className="animate-pulse">
      {Array.from({ length: 5 }).map((_, i) => (
        <div
          key={i}
          className="flex items-center gap-4 px-5 py-4 border-b border-border last:border-0"
        >
          <div className="h-3 flex-1 bg-surface-2 rounded" />
          <div className="h-3 w-20 bg-surface-2 rounded" />
          <div className="h-3 w-12 bg-surface-2 rounded" />
          <div className="flex flex-col gap-1 w-32">
            <div className="h-2.5 w-full bg-surface-2 rounded" />
            <div className="h-1.5 w-full bg-surface-2 rounded-full" />
          </div>
          <div className="h-5 w-16 bg-surface-2 rounded" />
          <div className="h-3 w-20 bg-surface-2 rounded" />
          <div className="h-3 w-8 bg-surface-2 rounded" />
        </div>
      ))}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function AdminShelvesPage() {
  const [shelves, setShelves] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sortCol, setSortCol] = useState<SortCol>('fillPct');
  const [sortDir, setSortDir] = useState<SortDir>('desc');

  useEffect(() => {
    api
      .getShelves()
      .then((data) => setShelves(Array.isArray(data) ? data : []))
      .catch((err) =>
        setError(err instanceof Error ? err.message : 'Erreur lors du chargement'),
      )
      .finally(() => setLoading(false));
  }, []);

  const handleSort = (col: SortCol) => {
    if (sortCol === col) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    else { setSortCol(col); setSortDir('asc'); }
  };

  const sorted = useMemo(() => {
    const list = [...shelves];
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
  }, [shelves, sortCol, sortDir]);

  // KPI aggregates
  const kpis = useMemo(() => {
    const open = shelves.filter((s: any) => s.status === 'OPEN').length;
    const totalTarget = shelves.reduce((acc: number, s: any) => acc + (s.targetAmount ?? 0), 0);
    const avgFill = shelves.length > 0 ? shelves.reduce((acc: number, s: any) => acc + (s.fillPct ?? 0), 0) / shelves.length : 0;
    const totalCommitments = shelves.reduce((acc: number, s: any) => acc + (s.commitmentCount ?? 0), 0);
    return { open, totalTarget, avgFill, totalCommitments };
  }, [shelves]);

  return (
    <main className="w-full animate-fade-in">
      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="flex items-center gap-3 mb-2">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#3B1FA8] to-[#1A0A3E] flex items-center justify-center shadow-sm shadow-[#3B1FA8]/20">
          <Layers size={18} className="text-white" />
        </div>
        <div>
          <h1 className="font-display text-2xl font-bold leading-tight bg-gradient-to-r from-[#3B1FA8] via-[#1A0A3E] to-[#3B1FA8] bg-clip-text text-transparent dark:from-white dark:via-[#C9BCFF] dark:to-white">
            Enveloppes
          </h1>
          <p className="font-body text-sm text-ink-3 mt-0.5">
            Suivi des enveloppes et de leur taux de remplissage
          </p>
        </div>
      </div>
      <div
        className="h-[2px] rounded-full mb-6"
        style={{ background: 'linear-gradient(90deg, #3B1FA8, #00B894 40%, #D4A017 70%, transparent)' }}
      />

      {/* ── KPIs ───────────────────────────────────────────────────────────── */}
      {!loading && !error && shelves.length > 0 && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
          <ShelfKpi label="Enveloppes ouvertes" value={kpis.open} accent="#00B894" />
          <ShelfKpi label="Volume cible total" value={formatAmount(kpis.totalTarget)} accent="#3B1FA8" />
          <ShelfKpi label="Remplissage moyen" value={`${Math.round(kpis.avgFill)}%`} accent="#D4A017" />
          <ShelfKpi label="Marques d'intérêt" value={kpis.totalCommitments} accent="#0A2799" />
        </div>
      )}

      {/* ── Table ──────────────────────────────────────────────────────────── */}
      {error ? (
        <Card static className="py-8 flex items-center justify-center">
          <p className="font-body text-sm text-red">{error}</p>
        </Card>
      ) : (
        <div className="bg-white/90 dark:bg-white/5 backdrop-blur-md border border-border/60 rounded-xl overflow-hidden shadow-card">
          {loading ? (
            <TableSkeleton />
          ) : shelves.length === 0 ? (
            <div className="py-16 flex flex-col items-center justify-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#3B1FA8]/10 to-[#00B894]/10 border border-border/40 flex items-center justify-center">
                <Layers size={20} className="text-ink-3 opacity-40" />
              </div>
              <p className="font-display text-sm font-bold text-ink dark:text-white">Aucune enveloppe</p>
              <p className="font-body text-xs text-ink-3 max-w-xs text-center">
                Les enveloppes apparaîtront ici dès qu&apos;un produit sera créé.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm font-body min-w-[800px]">
                <thead>
                  <tr className="border-b border-border bg-surface-2/50">
                    <SortHeader label="Produit" col="productName" sortCol={sortCol} sortDir={sortDir} onSort={handleSort} />
                    <SortHeader label="Montant cible" col="targetAmount" sortCol={sortCol} sortDir={sortDir} onSort={handleSort} align="right" />
                    <th className="px-5 py-3 text-right text-xs uppercase tracking-widest text-ink-3 font-semibold">
                      Surbooking
                    </th>
                    <SortHeader label="Remplissage" col="fillPct" sortCol={sortCol} sortDir={sortDir} onSort={handleSort} />
                    <SortHeader label="Statut" col="status" sortCol={sortCol} sortDir={sortDir} onSort={handleSort} align="center" />
                    <SortHeader label="Clôture" col="closingDate" sortCol={sortCol} sortDir={sortDir} onSort={handleSort} align="center" />
                    <SortHeader label="Marques" col="commitmentCount" sortCol={sortCol} sortDir={sortDir} onSort={handleSort} align="right" />
                  </tr>
                </thead>
                <tbody>
                  {sorted.map((shelf: any) => (
                    <tr
                      key={shelf.id}
                      className="border-b border-border/60 last:border-0 hover:bg-violet/[0.04] dark:hover:bg-white/5 transition-colors duration-150"
                    >
                      {/* Product */}
                      <td className="px-5 py-4">
                        <div className="flex flex-col gap-0.5">
                          <span className="font-medium text-ink leading-snug truncate max-w-[220px]">
                            {shelf.productName ?? shelf.productId ?? '—'}
                          </span>
                          {shelf.isin && (
                            <span className="font-mono text-[11px] text-ink-3">
                              {shelf.isin}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Target amount */}
                      <td className="px-5 py-4 text-right font-mono font-semibold text-ink">
                        {formatAmount(shelf.targetAmount ?? 0)}
                      </td>

                      {/* Overbooking % */}
                      <td className="px-5 py-4 text-right">
                        {shelf.overbookingPct != null ? (
                          <span className="font-mono text-sm text-ink-2">
                            +{shelf.overbookingPct}%
                          </span>
                        ) : (
                          <span className="text-ink-3 text-xs">—</span>
                        )}
                      </td>

                      {/* Fill progress */}
                      <td className="px-5 py-4">
                        <FillCell
                          fillPct={shelf.fillPct ?? 0}
                          targetAmount={shelf.targetAmount ?? 0}
                        />
                      </td>

                      {/* Status */}
                      <td className="px-5 py-4 text-center">
                        <Badge
                          variant={SHELF_STATUS_VARIANT[shelf.status] ?? 'muted'}
                        >
                          {SHELF_STATUS_LABEL[shelf.status] ?? shelf.status ?? '—'}
                        </Badge>
                      </td>

                      {/* Closing date */}
                      <td className="px-5 py-4 text-center text-xs text-ink-3">
                        {formatDate(shelf.closingDate)}
                      </td>

                      {/* Commitment count */}
                      <td className="px-5 py-4 text-right">
                        <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-violet-pale text-violet text-xs font-bold">
                          {shelf.commitmentCount ?? 0}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Footer */}
          {!loading && shelves.length > 0 && (
            <div className="px-5 py-3 border-t border-border/60 bg-surface-2/30">
              <span className="font-body text-xs text-ink-3">
                <span className="font-mono">{shelves.length}</span> enveloppe{shelves.length !== 1 ? 's' : ''}
              </span>
            </div>
          )}
        </div>
      )}
    </main>
  );
}
