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
  BarChart3,
  Shield,
  Layers,
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
  if (v == null) return '--';
  return v.toFixed(1) + '%';
}

// ─── Tab Config ──────────────────────────────────────────────────────────────

const TABS: { id: PortfolioTab; label: string; icon: React.ElementType }[] = [
  { id: 'products', label: 'Mes produits', icon: Package },
  { id: 'underlyings', label: 'Sous-jacents', icon: BarChart3 },
  { id: 'timeline', label: 'Timeline', icon: Calendar },
  { id: 'allocations', label: 'Allocations', icon: Layers },
  { id: 'expired', label: 'Produits expires', icon: Clock },
];

const STATUS_VARIANT: Record<string, 'teal' | 'gold' | 'violet' | 'red' | 'muted'> = {
  CONFIRMED: 'teal',
  WAITING: 'gold',
  PENDING: 'violet',
  REVIEW: 'gold',
  CANCELLED: 'red',
};

const STATUS_LABEL: Record<string, string> = {
  CONFIRMED: 'Confirme',
  WAITING: 'En attente',
  PENDING: 'En cours',
  REVIEW: 'En examen',
  CANCELLED: 'Annule',
};

const BARRIER_FILTERS: { id: BarrierStatus | ''; label: string; color: string }[] = [
  { id: '', label: 'Tous', color: '#7B6FA0' },
  { id: 'above', label: 'Au-dessus du strike', color: '#00B894' },
  { id: 'below', label: 'Sous le strike', color: '#3D63F5' },
  { id: 'watch', label: 'A surveiller', color: '#D4A017' },
  { id: 'barrier', label: 'Sous la barriere', color: '#E8334A' },
];

// ─── KPI Card ───────────────────────────────────────────────────────────────

function KpiCard({ icon, label, value, accent, trend }: {
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
  accent: string;
  trend?: string;
}) {
  return (
    <div className={cn(
      'group relative rounded-xl border border-border/60 p-5 flex flex-col gap-3',
      'bg-white/80 dark:bg-white/5 backdrop-blur-md',
      'shadow-sm hover:shadow-md transition-all duration-200',
      'ring-1 ring-black/[0.03] dark:ring-white/[0.06]',
    )}>
      <div
        className="absolute top-0 left-0 right-0 h-[3px] rounded-t-xl opacity-60 group-hover:opacity-100 transition-opacity duration-200"
        style={{ background: `linear-gradient(90deg, ${accent}, ${accent}80)` }}
      />
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div
            className="w-9 h-9 rounded-full flex items-center justify-center ring-1 ring-black/[0.04] dark:ring-white/[0.08]"
            style={{ background: `${accent}12` }}
          >
            {icon}
          </div>
          <span className="text-[10px] uppercase tracking-[0.2em] text-ink-3 dark:text-ink-3/80 font-semibold font-body">{label}</span>
        </div>
        {trend && (
          <span className="text-[10px] font-mono font-semibold text-[#00B894] bg-[#00B894]/8 px-1.5 py-0.5 rounded-md">
            {trend}
          </span>
        )}
      </div>
      <span className="font-display text-2xl font-bold text-ink dark:text-white leading-none tracking-tight [font-variant-numeric:tabular-nums]">
        {value}
      </span>
    </div>
  );
}

// ─── Premium Table Head ─────────────────────────────────────────────────────

function PremiumTh({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <th className={cn(
      'px-4 py-3.5 text-[10px] uppercase tracking-[0.18em] font-bold',
      'text-[#1A0A3E]/55 dark:text-white/50 font-body',
      className,
    )}>
      {children}
    </th>
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
    <div className="bg-white/90 dark:bg-white/5 backdrop-blur-sm rounded-xl border border-border/60 dark:border-white/10 ring-1 ring-black/[0.04] dark:ring-white/[0.06] overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-200">
      <div className="px-5 py-4 border-b border-border/60 dark:border-white/10 flex items-center justify-between bg-gradient-to-r from-[#F8F6FF] to-transparent dark:from-white/[0.03] dark:to-transparent">
        <h3 className="font-display text-sm font-bold text-ink dark:text-white flex items-center gap-2">
          <Calendar size={15} className="text-[#3B1FA8]" />
          Calendrier
        </h3>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setDate(new Date(year, month - 1, 1))}
            className={cn(
              'w-7 h-7 rounded-lg border border-border/80 dark:border-white/15 flex items-center justify-center',
              'text-ink-3 dark:text-white/60 hover:text-[#3B1FA8] hover:border-[#3B1FA8]/40',
              'hover:shadow-sm transition-all duration-200',
            )}
          >
            <ChevronLeft size={14} />
          </button>
          <span className="text-sm font-semibold text-ink dark:text-white capitalize min-w-[120px] text-center font-display">{monthName}</span>
          <button
            onClick={() => setDate(new Date(year, month + 1, 1))}
            className={cn(
              'w-7 h-7 rounded-lg border border-border/80 dark:border-white/15 flex items-center justify-center',
              'text-ink-3 dark:text-white/60 hover:text-[#3B1FA8] hover:border-[#3B1FA8]/40',
              'hover:shadow-sm transition-all duration-200',
            )}
          >
            <ChevronRight size={14} />
          </button>
        </div>
        <div className="flex items-center gap-3 text-[10px] font-body">
          <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-[#D4A017]" />Observation</span>
          <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-[#3D63F5]" />Autocall</span>
          <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-ink-3" />Maturité</span>
        </div>
      </div>
      <div className="p-4">
        <div className="grid grid-cols-7 gap-0">
          {dayNames.map((d) => (
            <div key={d} className="text-center text-[10px] text-ink-3 dark:text-white/40 font-semibold uppercase py-2">{d}</div>
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
                  'h-10 flex items-center justify-center text-[13px] font-body rounded-lg transition-all duration-200',
                  isToday
                    ? 'bg-gradient-to-br from-[#3B1FA8] to-[#5B3FD4] text-white font-bold shadow-md shadow-[#3B1FA8]/25'
                    : 'text-ink dark:text-white/80 hover:bg-[#3B1FA8]/5 dark:hover:bg-white/5 cursor-pointer',
                )}
              >
                {day}
              </div>
            );
          })}
        </div>
        <div className="mt-6 p-5 bg-gradient-to-br from-[#F8F6FF] to-[#F0ECFF] dark:from-white/[0.03] dark:to-white/[0.01] rounded-xl text-center border border-[#3B1FA8]/5 dark:border-white/5">
          <p className="text-sm text-ink-3 dark:text-white/50 font-body">Aucun evenement pour la periode selectionnee.</p>
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
    if (window.confirm("Etes-vous sur de vouloir annuler cette marque d'interet ?")) {
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
    <div className="animate-fade-in space-y-6">
      {/* ── Header ──────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-[28px] font-bold leading-tight bg-gradient-to-r from-[#3B1FA8] via-[#1A0A3E] to-[#3B1FA8] bg-clip-text text-transparent dark:from-white dark:via-[#C9BCFF] dark:to-white">
            Mon Portfolio
          </h1>
          <p className="text-sm text-ink-3 dark:text-white/50 font-body mt-1">
            Suivez vos investissements et engagements en produits structures.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {['Rapport global', 'Export Excel'].map((label) => (
            <button
              key={label}
              className={cn(
                'h-9 px-3.5 rounded-xl border border-border/60 dark:border-white/15',
                'bg-white/80 dark:bg-white/5 backdrop-blur-sm text-ink-3 dark:text-white/60',
                'text-[12px] font-medium font-body flex items-center gap-1.5',
                'hover:border-[#3B1FA8]/40 hover:text-[#3B1FA8] dark:hover:text-[#C9BCFF]',
                'hover:shadow-sm transition-all duration-200',
              )}
            >
              <Download size={13} />
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="h-px bg-gradient-to-r from-[#3B1FA8]/20 via-[#3B1FA8]/10 to-transparent dark:from-[#3B1FA8]/30 dark:via-[#3B1FA8]/10" />

      {/* ── KPI Cards ──────────────────────────────────────────────── */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          icon={<Wallet size={16} className="text-[#3B1FA8]" />}
          label="Total engage"
          value={loadingCommitments ? '...' : formatAmount(stats.total)}
          accent="#3B1FA8"
        />
        <KpiCard
          icon={<CheckCircle2 size={16} className="text-[#00B894]" />}
          label="Confirmes"
          value={loadingCommitments ? '...' : stats.confirmed}
          accent="#00B894"
        />
        <KpiCard
          icon={<Clock size={16} className="text-[#D4A017]" />}
          label="En attente"
          value={loadingCommitments ? '...' : stats.waiting}
          accent="#D4A017"
        />
        <KpiCard
          icon={<X size={16} className="text-[#E8334A]" />}
          label="Annules"
          value={loadingCommitments ? '...' : stats.cancelled}
          accent="#E8334A"
        />
      </section>

      {/* ── Tab Navigation ──────────────────────────────────────────── */}
      <div className="flex items-center gap-1 overflow-x-auto rounded-xl bg-[#F8F6FF]/60 dark:bg-white/[0.03] p-1 border border-border/40 dark:border-white/8">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                'px-4 py-2 rounded-lg text-[13px] font-semibold font-body transition-all duration-200 whitespace-nowrap flex items-center gap-2',
                activeTab === tab.id
                  ? 'bg-white dark:bg-white/10 text-[#3B1FA8] dark:text-[#C9BCFF] shadow-sm ring-1 ring-black/[0.04] dark:ring-white/[0.08]'
                  : 'text-ink-3 dark:text-white/50 hover:text-ink dark:hover:text-white/80 hover:bg-white/60 dark:hover:bg-white/5',
              )}
            >
              <Icon size={14} className={activeTab === tab.id ? 'text-[#3B1FA8] dark:text-[#C9BCFF]' : 'text-ink-3/60 dark:text-white/30'} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* ── Tab Content ─────────────────────────────────────────────── */}
      {activeTab === 'products' && (
        <div className="bg-white/90 dark:bg-white/5 backdrop-blur-sm rounded-xl border border-border/60 dark:border-white/10 ring-1 ring-black/[0.04] dark:ring-white/[0.06] overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-200">
          <div className="px-5 py-4 border-b border-border/60 dark:border-white/10 flex items-center justify-between bg-gradient-to-r from-[#F8F6FF] to-transparent dark:from-white/[0.03] dark:to-transparent">
            <h2 className="font-display text-sm font-bold text-ink dark:text-white flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-[#3B1FA8]/8 dark:bg-[#3B1FA8]/20 flex items-center justify-center">
                <Package size={14} className="text-[#3B1FA8] dark:text-[#C9BCFF]" />
              </div>
              Mes produits
            </h2>
            <span className="text-[11px] text-ink-3 dark:text-white/40 font-body font-mono tabular-nums">
              {(commitments ?? []).length} engagement{(commitments ?? []).length > 1 ? 's' : ''}
            </span>
          </div>

          {loadingCommitments ? (
            <div className="p-5 space-y-3">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="flex items-center gap-4 py-3 animate-pulse">
                  <div className="h-4 w-48 bg-[#3B1FA8]/5 dark:bg-white/5 rounded-lg" />
                  <div className="h-4 w-24 bg-[#3B1FA8]/5 dark:bg-white/5 rounded-lg ml-auto" />
                  <div className="h-5 w-16 bg-[#3B1FA8]/5 dark:bg-white/5 rounded-lg" />
                  <div className="h-4 w-16 bg-[#3B1FA8]/5 dark:bg-white/5 rounded-lg" />
                  <div className="h-7 w-14 bg-[#3B1FA8]/5 dark:bg-white/5 rounded-lg" />
                </div>
              ))}
            </div>
          ) : !commitments || commitments.length === 0 ? (
            <div className="p-16 flex flex-col items-center justify-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#3B1FA8]/10 to-[#3B1FA8]/5 flex items-center justify-center ring-1 ring-[#3B1FA8]/10 shadow-sm">
                <Package size={28} className="text-[#3B1FA8]/30" />
              </div>
              <p className="font-body text-sm text-ink-3 dark:text-white/50">Aucune marque d&apos;interet pour le moment.</p>
              <Link
                href="/products"
                className={cn(
                  'text-xs text-[#3B1FA8] dark:text-[#C9BCFF] font-semibold flex items-center gap-1',
                  'px-4 py-2 rounded-xl bg-[#3B1FA8]/5 dark:bg-[#3B1FA8]/15',
                  'hover:bg-[#3B1FA8]/10 dark:hover:bg-[#3B1FA8]/25 transition-all duration-200',
                  'ring-1 ring-[#3B1FA8]/10 dark:ring-[#3B1FA8]/30',
                )}
              >
                Explorer les produits <ArrowUpRight size={12} />
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-[13px] font-body">
                <thead>
                  <tr className="border-b border-border/60 dark:border-white/10 bg-gradient-to-r from-[#F8F6FF]/60 to-[#F0ECFF]/30 dark:from-white/[0.02] dark:to-transparent">
                    <PremiumTh className="text-left">Produit</PremiumTh>
                    <PremiumTh className="text-right">Montant</PremiumTh>
                    <PremiumTh className="text-center">Statut</PremiumTh>
                    <PremiumTh className="text-center">Rang</PremiumTh>
                    <PremiumTh className="text-right">Date</PremiumTh>
                    <PremiumTh className="text-center">Action</PremiumTh>
                  </tr>
                </thead>
                <tbody>
                  {commitments.map((c: any) => {
                    const status = c.status ?? 'PENDING';
                    return (
                      <tr
                        key={c.id}
                        className={cn(
                          'border-b border-border/30 dark:border-white/5 last:border-0',
                          'even:bg-[#F8F6FF]/30 dark:even:bg-white/[0.015]',
                          'hover:bg-[#3B1FA8]/[0.04] dark:hover:bg-white/[0.04]',
                          'transition-colors duration-200 group/row',
                        )}
                      >
                        <td className="px-4 py-3.5">
                          <div className="flex flex-col gap-0.5">
                            <span className="font-medium text-ink dark:text-white leading-snug truncate max-w-[220px]">
                              {c.productName ?? c.shelfId ?? '--'}
                            </span>
                            {c.isin && <span className="font-mono text-[10px] text-ink-3 dark:text-white/40">{c.isin}</span>}
                          </div>
                        </td>
                        <td className="px-4 py-3.5 text-right font-mono font-semibold text-ink dark:text-white tabular-nums text-[14px] tracking-tight [font-variant-numeric:tabular-nums]">
                          {formatAmount(c.amount ?? 0)}
                        </td>
                        <td className="px-4 py-3.5 text-center">
                          <Badge variant={STATUS_VARIANT[status] ?? 'muted'}>{STATUS_LABEL[status] ?? status}</Badge>
                        </td>
                        <td className="px-4 py-3.5 text-center">
                          {status === 'WAITING' && c.rank != null ? (
                            <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-gradient-to-br from-[#D4A017]/15 to-[#D4A017]/5 border border-[#D4A017]/30 text-[#D4A017] text-xs font-bold shadow-sm shadow-[#D4A017]/10">
                              {c.rank}
                            </span>
                          ) : (
                            <span className="text-ink-3 dark:text-white/30 text-xs">--</span>
                          )}
                        </td>
                        <td className="px-4 py-3.5 text-right text-xs text-ink-3 dark:text-white/40 font-mono">
                          {c.createdAt ? formatDate(c.createdAt) : '--'}
                        </td>
                        <td className="px-4 py-3.5 text-center">
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
                              <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-[#00B894]/10 text-[#00B894] ring-1 ring-[#00B894]/20">
                                <CheckCircle2 size={14} />
                              </span>
                            )}
                            {status === 'CANCELLED' && (
                              <span className="text-[#E8334A] text-xs font-semibold">
                                {c.rejectionReason ? `Rejete : ${c.rejectionReason}` : 'Rejete'}
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
        <div className="space-y-4">
          {/* Barrier status filters */}
          <div className="flex items-center gap-2 flex-wrap">
            {BARRIER_FILTERS.map((f) => (
              <button
                key={f.id}
                onClick={() => setBarrierFilter(f.id as any)}
                className={cn(
                  'px-3.5 py-1.5 rounded-xl text-[11px] font-semibold font-body border transition-all duration-200',
                  barrierFilter === f.id
                    ? 'text-white border-transparent shadow-sm'
                    : 'bg-white/80 dark:bg-white/5 backdrop-blur-sm border-border/60 dark:border-white/15 text-ink-3 dark:text-white/50 hover:text-ink dark:hover:text-white/80 hover:shadow-sm',
                )}
                style={barrierFilter === f.id ? { backgroundColor: f.color, borderColor: f.color } : undefined}
              >
                {f.label}
              </button>
            ))}
            <button className={cn(
              'ml-auto h-8 px-3 rounded-xl border border-border/60 dark:border-white/15 bg-white/80 dark:bg-white/5 backdrop-blur-sm text-ink-3 dark:text-white/50',
              'text-[11px] font-medium font-body flex items-center gap-1.5',
              'hover:text-[#3B1FA8] dark:hover:text-[#C9BCFF] hover:border-[#3B1FA8]/40 hover:shadow-sm transition-all duration-200',
            )}>
              <Download size={12} />
              Export Excel
            </button>
          </div>

          <div className="bg-white/90 dark:bg-white/5 backdrop-blur-sm rounded-xl border border-border/60 dark:border-white/10 ring-1 ring-black/[0.04] dark:ring-white/[0.06] overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-200">
            <div className="overflow-x-auto">
              <table className="w-full text-[13px] font-body">
                <thead>
                  <tr className="border-b border-border/60 dark:border-white/10 bg-gradient-to-r from-[#F8F6FF]/60 to-[#F0ECFF]/30 dark:from-white/[0.02] dark:to-transparent">
                    <PremiumTh className="text-left">Sous-jacent</PremiumTh>
                    <PremiumTh className="text-right">Strike</PremiumTh>
                    <PremiumTh className="text-right">Dernier prix</PremiumTh>
                    <PremiumTh className="text-right">Performance</PremiumTh>
                    <PremiumTh className="text-right">Barrière capital</PremiumTh>
                    <PremiumTh className="text-right">Distance barrière</PremiumTh>
                    <PremiumTh className="text-left">ISIN</PremiumTh>
                    <PremiumTh className="text-left">Produit</PremiumTh>
                  </tr>
                </thead>
                <tbody>
                  {products.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="px-4 py-16 text-center text-sm text-ink-3 dark:text-white/50">
                        Aucun sous-jacent a afficher pour le moment.
                      </td>
                    </tr>
                  ) : (
                    products.slice(0, 10).map((p: any) => (
                      <tr
                        key={p.id}
                        className={cn(
                          'border-b border-border/30 dark:border-white/5 last:border-0',
                          'even:bg-[#F8F6FF]/30 dark:even:bg-white/[0.015]',
                          'hover:bg-[#3B1FA8]/[0.04] dark:hover:bg-white/[0.04]',
                          'transition-colors duration-200',
                        )}
                      >
                        <td className="px-4 py-3.5 font-medium text-ink dark:text-white">{p.underlyingYahoo ?? p.underlyingName ?? '--'}</td>
                        <td className="px-4 py-3.5 text-right font-mono tabular-nums text-ink-2 dark:text-white/60">100.00</td>
                        <td className="px-4 py-3.5 text-right font-mono tabular-nums text-ink dark:text-white">--</td>
                        <td className="px-4 py-3.5 text-right font-mono tabular-nums text-[#00B894] font-semibold">--</td>
                        <td className="px-4 py-3.5 text-right font-mono tabular-nums text-[#E8334A]">{formatPct(p.barrierCapPct)}</td>
                        <td className="px-4 py-3.5 text-right font-mono tabular-nums font-semibold text-ink dark:text-white">--</td>
                        <td className="px-4 py-3.5 font-mono text-[11px] text-ink-3 dark:text-white/40">{p.isin}</td>
                        <td className="px-4 py-3.5 text-ink-2 dark:text-white/60 truncate max-w-[160px]">{p.name}</td>
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
        <div className="bg-white/90 dark:bg-white/5 backdrop-blur-sm rounded-xl border border-border/60 dark:border-white/10 ring-1 ring-black/[0.04] dark:ring-white/[0.06] overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-200">
          <div className="px-5 py-4 border-b border-border/60 dark:border-white/10 flex items-center justify-between bg-gradient-to-r from-[#F8F6FF] to-transparent dark:from-white/[0.03] dark:to-transparent">
            <div className="flex items-center gap-2">
              <button className={cn(
                'px-4 py-1.5 rounded-xl text-[12px] font-semibold font-body',
                'bg-white dark:bg-white/10 text-[#3B1FA8] dark:text-[#C9BCFF] shadow-sm ring-1 ring-black/[0.04] dark:ring-white/[0.08]',
              )}>
                Tous les comptes
              </button>
              <button className={cn(
                'px-4 py-1.5 rounded-xl text-[12px] font-semibold font-body',
                'bg-transparent border border-border/60 dark:border-white/15 text-ink-3 dark:text-white/50',
                'hover:text-ink dark:hover:text-white/80 hover:shadow-sm transition-all duration-200',
              )}>
                A allouer
              </button>
            </div>
            <button className={cn(
              'h-8 px-3 rounded-xl border border-border/60 dark:border-white/15 bg-white/80 dark:bg-white/5 backdrop-blur-sm text-ink-3 dark:text-white/50',
              'text-[11px] font-medium font-body flex items-center gap-1.5',
              'hover:text-[#3B1FA8] dark:hover:text-[#C9BCFF] hover:border-[#3B1FA8]/40 hover:shadow-sm transition-all duration-200',
            )}>
              <Download size={12} />
              Rapport global
            </button>
          </div>
          <div className="p-16 flex flex-col items-center justify-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#3B1FA8]/10 to-[#3B1FA8]/5 flex items-center justify-center ring-1 ring-[#3B1FA8]/10 shadow-sm">
              <Wallet size={28} className="text-[#3B1FA8]/30" />
            </div>
            <p className="font-body text-sm text-ink-3 dark:text-white/50">Aucune allocation pour le moment.</p>
            <p className="font-body text-[11px] text-ink-3/60 dark:text-white/30">
              Les allocations seront visibles une fois vos engagements confirmes.
            </p>
          </div>
        </div>
      )}

      {activeTab === 'expired' && (
        <div className="bg-white/90 dark:bg-white/5 backdrop-blur-sm rounded-xl border border-border/60 dark:border-white/10 ring-1 ring-black/[0.04] dark:ring-white/[0.06] overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-200">
          <div className="px-5 py-4 border-b border-border/60 dark:border-white/10 flex items-center justify-between bg-gradient-to-r from-[#F8F6FF] to-transparent dark:from-white/[0.03] dark:to-transparent">
            <h2 className="font-display text-sm font-bold text-ink dark:text-white flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-ink-3/8 dark:bg-white/10 flex items-center justify-center">
                <Clock size={14} className="text-ink-3 dark:text-white/50" />
              </div>
              Produits expires
            </h2>
            <button className={cn(
              'h-8 px-3 rounded-xl border border-border/60 dark:border-white/15 bg-white/80 dark:bg-white/5 text-ink-3 dark:text-white/50',
              'text-[11px] font-medium font-body flex items-center gap-1.5',
              'hover:text-[#3B1FA8] dark:hover:text-[#C9BCFF] hover:border-[#3B1FA8]/40 hover:shadow-sm transition-all duration-200',
            )}>
              <Download size={12} />
              Export Excel
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-[13px] font-body">
              <thead>
                <tr className="border-b border-border/60 dark:border-white/10 bg-gradient-to-r from-[#F8F6FF]/60 to-[#F0ECFF]/30 dark:from-white/[0.02] dark:to-transparent">
                  <PremiumTh className="text-left">Produit</PremiumTh>
                  <PremiumTh className="text-left">ISIN</PremiumTh>
                  <PremiumTh className="text-left">Emetteur</PremiumTh>
                  <PremiumTh className="text-right">Maturité</PremiumTh>
                  <PremiumTh className="text-right">Coupon</PremiumTh>
                  <PremiumTh className="text-right">Protection</PremiumTh>
                  <PremiumTh className="text-right">Prix expiration</PremiumTh>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td colSpan={7} className="px-4 py-16 text-center text-sm text-ink-3 dark:text-white/50">
                    Aucun produit expire pour le moment.
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
