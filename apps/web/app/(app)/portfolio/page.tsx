'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  Package,
  TrendingUp,
  Calendar,
  Wallet,
  Clock,
  Download,
  ArrowUpRight,
  AlertTriangle,
  CheckCircle2,
  Eye,
  X,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { cn } from '@/lib/cn';
import { useMyCommitments, useCancelCommitment } from '@/hooks/use-commitments';
import { useReviewCommitment, useApproveCommitment, useRejectCommitment } from '@/hooks/use-commitment-actions';
import { useProducts } from '@/hooks/use-products';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

// ─── Types ───────────────────────────────────────────────────────────────────

type PortfolioTab = 'products' | 'underlyings' | 'timeline' | 'allocations' | 'expired';
type BarrierStatus = 'above' | 'below' | 'watch' | 'barrier';

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatAmount(amount: number) {
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(amount);
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' });
}

function formatPct(v: number | null | undefined) {
  if (v == null) return '—';
  return v.toFixed(1) + '%';
}

// ─── Tab Config ──────────────────────────────────────────────────────────────

const TABS: { id: PortfolioTab; label: string }[] = [
  { id: 'products', label: 'Mes produits' },
  { id: 'underlyings', label: 'Sous-jacents' },
  { id: 'timeline', label: 'Timeline' },
  { id: 'allocations', label: 'Allocations' },
  { id: 'expired', label: 'Produits expirés' },
];

const STATUS_VARIANT: Record<string, 'teal' | 'gold' | 'violet' | 'red' | 'muted'> = {
  CONFIRMED: 'teal',
  WAITING: 'gold',
  PENDING: 'violet',
  REVIEW: 'gold',
  CANCELLED: 'red',
};

const STATUS_LABEL: Record<string, string> = {
  CONFIRMED: 'Confirmé',
  WAITING: 'En attente',
  PENDING: 'En cours',
  REVIEW: 'En examen',
  CANCELLED: 'Annulé',
};

const BARRIER_FILTERS: { id: BarrierStatus | ''; label: string; color: string }[] = [
  { id: '', label: 'Tous', color: '#7B6FA0' },
  { id: 'above', label: 'Au-dessus du strike', color: '#00B894' },
  { id: 'below', label: 'Sous le strike', color: '#3D63F5' },
  { id: 'watch', label: 'À surveiller', color: '#D4A017' },
  { id: 'barrier', label: 'Sous la barrière', color: '#E8334A' },
];

// ─── Summary Card ────────────────────────────────────────────────────────────

function SummaryCard({ icon, label, value, accent }: {
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
  accent: string;
}) {
  return (
    <div className="group relative bg-white/80 backdrop-blur-md rounded-xl border border-white/60 p-5 flex flex-col gap-3 transition-all duration-300 hover:shadow-lg hover:shadow-violet/8 hover:-translate-y-1 ring-1 ring-black/[0.03]">
      <div
        className="absolute top-0 left-0 right-0 h-[3px] rounded-b-full opacity-70 group-hover:opacity-100 transition-all duration-300"
        style={{ background: accent }}
      />
      <div className="flex items-center gap-2.5">
        <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: `${accent}15` }}>
          {icon}
        </div>
        <span className="text-[10px] uppercase tracking-[0.2em] text-ink-3 font-semibold font-body">{label}</span>
      </div>
      <span className="font-display text-2xl font-bold text-ink leading-none tracking-tight [font-variant-numeric:tabular-nums]">{value}</span>
    </div>
  );
}

// ─── Calendar View ───────────────────────────────────────────────────────────

function CalendarView() {
  const [date, setDate] = useState(new Date());
  const year = date.getFullYear();
  const month = date.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDay = new Date(year, month, 1).getDay();
  const dayNames = ['dim.', 'lun.', 'mar.', 'mer.', 'jeu.', 'ven.', 'sam.'];
  const monthName = date.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });

  return (
    <div className="bg-white/90 backdrop-blur-sm rounded-xl border border-white/60 ring-1 ring-black/[0.04] overflow-hidden shadow-sm">
      <div className="px-5 py-4 border-b border-border/60 flex items-center justify-between">
        <h3 className="font-display text-sm font-bold text-ink">Calendrier</h3>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setDate(new Date(year, month - 1, 1))}
            className="w-7 h-7 rounded-md border border-border/80 flex items-center justify-center text-ink-3 hover:text-violet hover:border-violet hover:shadow-sm hover:scale-105 active:scale-95 transition-all duration-200"
          >
            <ChevronLeft size={14} />
          </button>
          <span className="text-sm font-semibold text-ink capitalize min-w-[120px] text-center">{monthName}</span>
          <button
            onClick={() => setDate(new Date(year, month + 1, 1))}
            className="w-7 h-7 rounded-md border border-border/80 flex items-center justify-center text-ink-3 hover:text-violet hover:border-violet hover:shadow-sm hover:scale-105 active:scale-95 transition-all duration-200"
          >
            <ChevronRight size={14} />
          </button>
        </div>
        <div className="flex items-center gap-3 text-[10px] font-body">
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-gold" />Observation</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-cobalt-light" />Autocall</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-ink-3" />Maturité</span>
        </div>
      </div>
      <div className="p-4">
        <div className="grid grid-cols-7 gap-0">
          {dayNames.map((d) => (
            <div key={d} className="text-center text-[10px] text-ink-3 font-semibold uppercase py-2">{d}</div>
          ))}
          {Array.from({ length: firstDay }).map((_, i) => (
            <div key={`empty-${i}`} className="h-10" />
          ))}
          {Array.from({ length: daysInMonth }).map((_, i) => {
            const day = i + 1;
            const isToday = day === new Date().getDate() && month === new Date().getMonth() && year === new Date().getFullYear();
            return (
              <div
                key={day}
                className={cn(
                  'h-10 flex items-center justify-center text-[13px] font-body rounded-md transition-colors',
                  isToday ? 'bg-gradient-to-br from-[#3B1FA8] to-[#5B3FD4] text-white font-bold shadow-md shadow-violet/30 scale-105' : 'text-ink hover:bg-violet-ghost hover:scale-[1.08] active:scale-95 cursor-pointer',
                )}
              >
                {day}
              </div>
            );
          })}
        </div>
        <div className="mt-6 p-5 bg-gradient-to-br from-[#F8F6FF] to-[#F0ECFF] rounded-xl text-center border border-[#3B1FA8]/5">
          <p className="text-sm text-ink-3 font-body">Aucun événement pour la période sélectionnée.</p>
        </div>
      </div>
    </div>
  );
}

// ─── Page ────────────────────────────────────────────────────────────────────

export default function PortfolioPage() {
  const [activeTab, setActiveTab] = useState<PortfolioTab>('products');
  const [barrierFilter, setBarrierFilter] = useState<BarrierStatus | ''>('');
  const { data: commitments, isLoading: loadingCommitments } = useMyCommitments();
  const { data: productsData, isLoading: loadingProducts } = useProducts({});
  const cancelMutation = useCancelCommitment();
  const reviewMutation = useReviewCommitment();
  const approveMutation = useApproveCommitment();
  const rejectMutation = useRejectCommitment();

  const products = productsData?.data ?? [];

  const stats = useMemo(() => {
    if (!commitments) return { total: 0, confirmed: 0, waiting: 0, cancelled: 0 };
    return {
      total: commitments.reduce((s: number, c: any) => s + (c.amount ?? 0), 0),
      confirmed: commitments.filter((c: any) => c.status === 'CONFIRMED').length,
      waiting: commitments.filter((c: any) => c.status === 'WAITING' || c.status === 'PENDING').length,
      cancelled: commitments.filter((c: any) => c.status === 'CANCELLED').length,
    };
  }, [commitments]);

  const handleCancel = (id: string) => {
    if (window.confirm("Êtes-vous sûr de vouloir annuler cette marque d'intérêt ?")) {
      cancelMutation.mutate(id);
    }
  };

  const handleReview = (id: string) => {
    reviewMutation.mutate(id);
  };

  const handleApprove = (id: string) => {
    approveMutation.mutate(id);
  };

  const handleReject = (id: string) => {
    const reason = window.prompt('Raison du rejet :');
    if (reason && reason.trim()) {
      rejectMutation.mutate({ id, reason: reason.trim() });
    }
  };

  return (
    <div className="animate-fade-in">
      {/* ── Header ──────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display text-[28px] font-bold leading-tight bg-gradient-to-r from-[#3B1FA8] via-[#1A0A3E] to-[#3B1FA8] bg-clip-text text-transparent">Mon Portfolio</h1>
          <p className="text-sm text-ink-3 font-body mt-1">Suivez vos investissements et engagements en produits structurés.</p>
        </div>
        <div className="flex items-center gap-2">
          <button className={cn(
            'h-9 px-3 rounded-lg border border-border/80 bg-white/80 backdrop-blur-sm text-ink-3',
            'text-[12px] font-medium font-body flex items-center gap-1.5',
            'hover:border-violet hover:text-violet hover:bg-violet-ghost hover:shadow-md hover:shadow-violet/10 hover:scale-[1.02] active:scale-[0.98] transition-all duration-200',
          )}>
            <Download size={13} />
            Rapport global
          </button>
          <button className={cn(
            'h-9 px-3 rounded-lg border border-border/80 bg-white/80 backdrop-blur-sm text-ink-3',
            'text-[12px] font-medium font-body flex items-center gap-1.5',
            'hover:border-violet hover:text-violet hover:bg-violet-ghost hover:shadow-md hover:shadow-violet/10 hover:scale-[1.02] active:scale-[0.98] transition-all duration-200',
          )}>
            <Download size={13} />
            Export Excel
          </button>
        </div>
      </div>

      <div className="gradient-bar h-[2px] rounded-full mb-6 opacity-80" />

      {/* ── Summary cards ───────────────────────────────────────────── */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8 stagger-children">
        <SummaryCard
          icon={<Wallet size={16} className="text-violet" />}
          label="Total engagé"
          value={loadingCommitments ? '…' : formatAmount(stats.total)}
          accent="#3B1FA8"
        />
        <SummaryCard
          icon={<CheckCircle2 size={16} className="text-teal" />}
          label="Confirmés"
          value={loadingCommitments ? '…' : stats.confirmed}
          accent="#00B894"
        />
        <SummaryCard
          icon={<Clock size={16} className="text-gold" />}
          label="En attente"
          value={loadingCommitments ? '…' : stats.waiting}
          accent="#D4A017"
        />
        <SummaryCard
          icon={<X size={16} className="text-red" />}
          label="Annulés"
          value={loadingCommitments ? '…' : stats.cancelled}
          accent="#E8334A"
        />
      </section>

      {/* ── Tab Navigation ──────────────────────────────────────────── */}
      <div className="flex items-center gap-1 mb-6 overflow-x-auto">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              'px-4 py-2 rounded-lg text-[13px] font-semibold font-body transition-all duration-200 whitespace-nowrap',
              activeTab === tab.id
                ? 'bg-gradient-to-r from-[#3B1FA8] to-[#5B3FD4] text-white shadow-md shadow-violet/20 scale-[1.02]'
                : 'text-ink-3 hover:text-ink hover:bg-surface-2 hover:scale-[1.01] active:scale-[0.98]',
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* ── Tab Content ─────────────────────────────────────────────── */}
      {activeTab === 'products' && (
        <div className="bg-white/90 backdrop-blur-sm rounded-xl border border-white/60 ring-1 ring-black/[0.04] overflow-hidden shadow-sm">
          <div className="px-5 py-4 border-b border-border/60 flex items-center justify-between">
            <h2 className="font-display text-sm font-bold text-ink flex items-center gap-2">
              <Package size={15} className="text-violet" />
              Mes produits
            </h2>
            <span className="text-[11px] text-ink-3 font-body">{(commitments ?? []).length} engagement{(commitments ?? []).length > 1 ? 's' : ''}</span>
          </div>

          {loadingCommitments ? (
            <div className="p-5 animate-pulse space-y-3">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="flex items-center gap-4 py-3">
                  <div className="h-4 w-48 bg-surface-2 rounded" />
                  <div className="h-4 w-24 bg-surface-2 rounded ml-auto" />
                  <div className="h-5 w-16 bg-surface-2 rounded" />
                  <div className="h-4 w-16 bg-surface-2 rounded" />
                  <div className="h-7 w-14 bg-surface-2 rounded" />
                </div>
              ))}
            </div>
          ) : !commitments || commitments.length === 0 ? (
            <div className="p-16 flex flex-col items-center justify-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#3B1FA8]/10 to-[#3B1FA8]/5 flex items-center justify-center ring-1 ring-[#3B1FA8]/10 shadow-sm">
                <Package size={28} className="text-[#3B1FA8]/30" />
              </div>
              <p className="font-body text-sm text-ink-3">Aucune marque d&apos;intérêt pour le moment.</p>
              <Link href="/products" className="text-xs text-violet font-semibold hover:underline flex items-center gap-1 px-4 py-2 rounded-lg bg-violet-ghost/60 hover:bg-violet-ghost transition-all hover:scale-[1.02] active:scale-[0.98]">
                Explorer les produits <ArrowUpRight size={12} />
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-[13px] font-body">
                <thead>
                  <tr className="border-b border-border/60" style={{ background: 'linear-gradient(135deg, rgba(237,232,255,0.4), rgba(219,210,255,0.2))' }}>
                    <th className="px-4 py-3.5 text-left text-[10px] uppercase tracking-[0.18em] text-[#1A0A3E]/60 font-bold">Produit</th>
                    <th className="px-4 py-3.5 text-right text-[10px] uppercase tracking-[0.18em] text-[#1A0A3E]/60 font-bold">Montant</th>
                    <th className="px-4 py-3.5 text-center text-[10px] uppercase tracking-[0.18em] text-[#1A0A3E]/60 font-bold">Statut</th>
                    <th className="px-4 py-3.5 text-center text-[10px] uppercase tracking-[0.18em] text-[#1A0A3E]/60 font-bold">Rang</th>
                    <th className="px-4 py-3.5 text-right text-[10px] uppercase tracking-[0.18em] text-[#1A0A3E]/60 font-bold">Date</th>
                    <th className="px-4 py-3.5 text-center text-[10px] uppercase tracking-[0.18em] text-[#1A0A3E]/60 font-bold">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {commitments.map((c: any) => {
                    const status = c.status ?? 'PENDING';
                    return (
                      <tr key={c.id} className="border-b border-border/40 last:border-0 even:bg-[#F8F6FF]/40 hover:bg-violet-ghost/60 transition-all duration-200 group/row">
                        <td className="px-4 py-3">
                          <div className="flex flex-col gap-0.5">
                            <span className="font-medium text-ink leading-snug truncate max-w-[220px]">{c.productName ?? c.shelfId ?? '—'}</span>
                            {c.isin && <span className="font-mono text-[10px] text-ink-3">{c.isin}</span>}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-right font-mono font-semibold text-ink tabular-nums text-[14px] tracking-tight [font-variant-numeric:tabular-nums]">{formatAmount(c.amount ?? 0)}</td>
                        <td className="px-4 py-3 text-center">
                          <Badge variant={STATUS_VARIANT[status] ?? 'muted'}>{STATUS_LABEL[status] ?? status}</Badge>
                        </td>
                        <td className="px-4 py-3 text-center">
                          {status === 'WAITING' && c.rank != null ? (
                            <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-gradient-to-br from-[#D4A017]/15 to-[#D4A017]/5 border border-[#D4A017]/30 text-[#D4A017] text-xs font-bold shadow-sm shadow-[#D4A017]/10">{c.rank}</span>
                          ) : (
                            <span className="text-ink-3 text-xs">—</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-right text-xs text-ink-3">{c.createdAt ? formatDate(c.createdAt) : '—'}</td>
                        <td className="px-4 py-3 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            {status === 'PENDING' && (
                              <>
                                <Button
                                  size="sm"
                                  onClick={() => handleReview(c.id)}
                                  disabled={reviewMutation.isPending}
                                  className="bg-amber-500 hover:bg-amber-600 text-white text-[11px] px-2.5 py-1 rounded-md font-semibold shadow-sm"
                                >
                                  Examiner
                                </Button>
                                <Button variant="danger" size="sm" onClick={() => handleCancel(c.id)} disabled={cancelMutation.isPending}>
                                  Annuler
                                </Button>
                              </>
                            )}
                            {status === 'REVIEW' && (
                              <>
                                <Button
                                  size="sm"
                                  onClick={() => handleApprove(c.id)}
                                  disabled={approveMutation.isPending}
                                  className="bg-emerald-500 hover:bg-emerald-600 text-white text-[11px] px-2.5 py-1 rounded-md font-semibold shadow-sm"
                                >
                                  Approuver
                                </Button>
                                <Button
                                  size="sm"
                                  onClick={() => handleReject(c.id)}
                                  disabled={rejectMutation.isPending}
                                  className="bg-red-500 hover:bg-red-600 text-white text-[11px] px-2.5 py-1 rounded-md font-semibold shadow-sm"
                                >
                                  Rejeter
                                </Button>
                              </>
                            )}
                            {status === 'CONFIRMED' && (
                              <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-emerald-100 text-emerald-600">
                                <CheckCircle2 size={14} />
                              </span>
                            )}
                            {status === 'CANCELLED' && (
                              <span className="text-red-500 text-xs font-semibold">
                                {c.rejectionReason ? `Rejeté : ${c.rejectionReason}` : 'Rejeté'}
                              </span>
                            )}
                            {status === 'WAITING' && (
                              <Button variant="danger" size="sm" onClick={() => handleCancel(c.id)} disabled={cancelMutation.isPending}>
                                Annuler
                              </Button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {activeTab === 'underlyings' && (
        <div>
          {/* Barrier status filters */}
          <div className="flex items-center gap-2 mb-4">
            {BARRIER_FILTERS.map((f) => (
              <button
                key={f.id}
                onClick={() => setBarrierFilter(f.id as any)}
                className={cn(
                  'px-3.5 py-1.5 rounded-full text-[11px] font-semibold font-body border transition-all duration-200',
                  barrierFilter === f.id
                    ? 'text-white border-transparent shadow-md shadow-black/10 scale-[1.03]'
                    : 'bg-white/80 backdrop-blur-sm border-border/80 text-ink-3 hover:text-ink hover:shadow-sm hover:scale-[1.01] active:scale-[0.98]',
                )}
                style={barrierFilter === f.id ? { backgroundColor: f.color, borderColor: f.color } : undefined}
              >
                {f.label}
              </button>
            ))}
            <button className={cn(
              'ml-auto h-8 px-3 rounded-lg border border-border/80 bg-white/80 backdrop-blur-sm text-ink-3',
              'text-[11px] font-medium font-body flex items-center gap-1.5',
              'hover:text-violet hover:border-violet hover:shadow-sm hover:scale-[1.02] active:scale-[0.98] transition-all duration-200',
            )}>
              <Download size={12} />
              Export Excel
            </button>
          </div>

          <div className="bg-white/90 backdrop-blur-sm rounded-xl border border-white/60 ring-1 ring-black/[0.04] overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-[13px] font-body">
                <thead>
                  <tr className="border-b border-border/60" style={{ background: 'linear-gradient(135deg, rgba(237,232,255,0.4), rgba(219,210,255,0.2))' }}>
                    <th className="px-4 py-3.5 text-left text-[10px] uppercase tracking-[0.18em] text-[#1A0A3E]/60 font-bold">Sous-jacent</th>
                    <th className="px-4 py-3 text-right text-[10px] uppercase tracking-[0.15em] text-ink-3 font-semibold">Strike</th>
                    <th className="px-4 py-3 text-right text-[10px] uppercase tracking-[0.15em] text-ink-3 font-semibold">Dernier prix</th>
                    <th className="px-4 py-3 text-right text-[10px] uppercase tracking-[0.15em] text-ink-3 font-semibold">Performance</th>
                    <th className="px-4 py-3 text-right text-[10px] uppercase tracking-[0.15em] text-ink-3 font-semibold">Barrière capital</th>
                    <th className="px-4 py-3 text-right text-[10px] uppercase tracking-[0.15em] text-ink-3 font-semibold">Distance barrière</th>
                    <th className="px-4 py-3 text-left text-[10px] uppercase tracking-[0.15em] text-ink-3 font-semibold">ISIN</th>
                    <th className="px-4 py-3 text-left text-[10px] uppercase tracking-[0.15em] text-ink-3 font-semibold">Produit</th>
                  </tr>
                </thead>
                <tbody>
                  {products.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="px-4 py-16 text-center text-sm text-ink-3">
                        Aucun sous-jacent à afficher pour le moment.
                      </td>
                    </tr>
                  ) : (
                    products.slice(0, 10).map((p: any) => (
                      <tr key={p.id} className="border-b border-border/40 last:border-0 even:bg-[#F8F6FF]/40 hover:bg-violet-ghost/60 transition-all duration-200">
                        <td className="px-4 py-3 font-medium text-ink">{p.underlyingYahoo ?? p.underlyingName ?? '—'}</td>
                        <td className="px-4 py-3 text-right font-mono tabular-nums text-ink-2">100.00</td>
                        <td className="px-4 py-3 text-right font-mono tabular-nums text-ink">—</td>
                        <td className="px-4 py-3 text-right font-mono tabular-nums text-teal font-semibold">—</td>
                        <td className="px-4 py-3 text-right font-mono tabular-nums text-red">{formatPct(p.barrierCapPct)}</td>
                        <td className="px-4 py-3 text-right font-mono tabular-nums font-semibold text-ink">—</td>
                        <td className="px-4 py-3 font-mono text-[11px] text-ink-3">{p.isin}</td>
                        <td className="px-4 py-3 text-ink-2 truncate max-w-[160px]">{p.name}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'timeline' && <CalendarView />}

      {activeTab === 'allocations' && (
        <div className="bg-white/90 backdrop-blur-sm rounded-xl border border-white/60 ring-1 ring-black/[0.04] overflow-hidden shadow-sm">
          <div className="px-5 py-4 border-b border-border/60 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <button className={cn(
                'px-4 py-1.5 rounded-lg text-[12px] font-semibold font-body',
                'bg-gradient-to-r from-[#3B1FA8] to-[#5B3FD4] text-white shadow-md shadow-violet/20',
              )}>
                Tous les comptes
              </button>
              <button className={cn(
                'px-4 py-1.5 rounded-lg text-[12px] font-semibold font-body',
                'bg-white/80 border border-border/80 text-ink-3 hover:text-ink hover:shadow-sm hover:scale-[1.02] active:scale-[0.98] transition-all duration-200',
              )}>
                À allouer
              </button>
            </div>
            <button className={cn(
              'h-8 px-3 rounded-lg border border-border/80 bg-white/80 backdrop-blur-sm text-ink-3',
              'text-[11px] font-medium font-body flex items-center gap-1.5',
              'hover:text-violet hover:border-violet hover:shadow-sm hover:scale-[1.02] active:scale-[0.98] transition-all duration-200',
            )}>
              <Download size={12} />
              Rapport global
            </button>
          </div>
          <div className="p-16 flex flex-col items-center justify-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#3B1FA8]/10 to-[#3B1FA8]/5 flex items-center justify-center ring-1 ring-[#3B1FA8]/10 shadow-sm">
              <Wallet size={28} className="text-[#3B1FA8]/30" />
            </div>
            <p className="font-body text-sm text-ink-3">Aucune allocation pour le moment.</p>
            <p className="font-body text-[11px] text-ink-3/60">Les allocations seront visibles une fois vos engagements confirmés.</p>
          </div>
        </div>
      )}

      {activeTab === 'expired' && (
        <div className="bg-white/90 backdrop-blur-sm rounded-xl border border-white/60 ring-1 ring-black/[0.04] overflow-hidden shadow-sm">
          <div className="px-5 py-4 border-b border-border/60 flex items-center justify-between">
            <h2 className="font-display text-sm font-bold text-ink flex items-center gap-2">
              <Clock size={15} className="text-ink-3" />
              Produits expirés
            </h2>
            <button className={cn(
              'h-8 px-3 rounded-lg border border-border/80 bg-white text-ink-3',
              'text-[11px] font-medium font-body flex items-center gap-1.5',
              'hover:text-violet hover:border-violet transition-all',
            )}>
              <Download size={12} />
              Export Excel
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-[13px] font-body">
              <thead>
                <tr className="border-b border-border/60" style={{ background: 'linear-gradient(135deg, rgba(237,232,255,0.4), rgba(219,210,255,0.2))' }}>
                  <th className="px-4 py-3.5 text-left text-[10px] uppercase tracking-[0.18em] text-[#1A0A3E]/60 font-bold">Produit</th>
                  <th className="px-4 py-3.5 text-left text-[10px] uppercase tracking-[0.18em] text-[#1A0A3E]/60 font-bold">ISIN</th>
                  <th className="px-4 py-3.5 text-left text-[10px] uppercase tracking-[0.18em] text-[#1A0A3E]/60 font-bold">Émetteur</th>
                  <th className="px-4 py-3.5 text-right text-[10px] uppercase tracking-[0.18em] text-[#1A0A3E]/60 font-bold">Maturité</th>
                  <th className="px-4 py-3.5 text-right text-[10px] uppercase tracking-[0.18em] text-[#1A0A3E]/60 font-bold">Coupon</th>
                  <th className="px-4 py-3.5 text-right text-[10px] uppercase tracking-[0.18em] text-[#1A0A3E]/60 font-bold">Protection</th>
                  <th className="px-4 py-3.5 text-right text-[10px] uppercase tracking-[0.18em] text-[#1A0A3E]/60 font-bold">Prix expiration</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td colSpan={7} className="px-4 py-16 text-center text-sm text-ink-3">
                    Aucun produit expiré pour le moment.
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
