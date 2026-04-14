'use client';

import { useMemo, useState } from 'react';
import {
  Wallet,
  TrendingUp,
  Clock,
  CheckCircle2,
  Download,
  FileSpreadsheet,
  Filter,
  CircleDollarSign,
  ArrowUpRight,
  BarChart3,
  PieChart,
} from 'lucide-react';
import { cn } from '@/lib/cn';
import { useCommissionSummary } from '@/hooks/use-commissions';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tooltip } from '@/components/ui/tooltip';
import { exportToExcel } from '@/lib/export-utils';

// ─── Demo Commission Data ────────────────────────────────────────────────────

const DEMO_COMMISSIONS = [
  { id: 'com-1', productName: 'M Rendement 13', type: 'ENTRY_FEE', ratePct: 2.5, amount: 6250, status: 'PAID', period: '2026-Q1', paidDate: '2026-03-15' },
  { id: 'com-2', productName: 'M Rendement OR', type: 'DISTRIBUTION_FEE', ratePct: 1.0, amount: 1000, status: 'PAID', period: '2026-Q1', paidDate: '2026-03-10' },
  { id: 'com-3', productName: 'M Rendement Mixte', type: 'ENTRY_FEE', ratePct: 3.0, amount: 10500, status: 'ACCRUED', period: '2026-Q1', paidDate: null },
  { id: 'com-4', productName: 'M Equilibre CT', type: 'MANAGEMENT_FEE', ratePct: 0.5, amount: 5000, status: 'PAYABLE', period: '2026-Q1', paidDate: null },
  { id: 'com-5', productName: 'M Equilibre 7', type: 'TRAILER_FEE', ratePct: 0.3, amount: 1500, status: 'PAID', period: '2026-Q1', paidDate: '2026-02-28' },
  { id: 'com-6', productName: 'M Ambition 10', type: 'ENTRY_FEE', ratePct: 1.8, amount: 1350, status: 'ACCRUED', period: '2026-Q1', paidDate: null },
  { id: 'com-7', productName: 'M Equilibre 5', type: 'DISTRIBUTION_FEE', ratePct: 1.2, amount: 3600, status: 'PAYABLE', period: '2026-Q1', paidDate: null },
  { id: 'com-8', productName: 'Selection Souverainete Europe', type: 'STRUCTURING_FEE', ratePct: 0.8, amount: 1600, status: 'PAID', period: '2026-Q1', paidDate: '2026-03-20' },
  { id: 'com-9', productName: 'M Rendement 13', type: 'TRAILER_FEE', ratePct: 0.3, amount: 750, status: 'PAID', period: '2025-Q4', paidDate: '2025-12-31' },
  { id: 'com-10', productName: 'M Equilibre CT', type: 'ENTRY_FEE', ratePct: 4.0, amount: 40000, status: 'PAID', period: '2025-Q4', paidDate: '2025-12-20' },
  { id: 'com-11', productName: 'M Equilibre 7', type: 'MANAGEMENT_FEE', ratePct: 0.5, amount: 2880, status: 'PAID', period: '2025-Q4', paidDate: '2025-12-31' },
  { id: 'com-12', productName: 'M Rendement OR', type: 'ENTRY_FEE', ratePct: 1.3, amount: 1300, status: 'PAID', period: '2025-Q4', paidDate: '2025-11-15' },
];

const TYPE_LABELS: Record<string, string> = {
  ENTRY_FEE: "Frais d'entree",
  DISTRIBUTION_FEE: 'Distribution',
  MANAGEMENT_FEE: 'Gestion',
  TRAILER_FEE: 'Retrocession',
  STRUCTURING_FEE: 'Structuration',
};

const STATUS_VARIANT: Record<string, 'teal' | 'gold' | 'muted'> = {
  PAID: 'teal',
  PAYABLE: 'gold',
  ACCRUED: 'muted',
};

const STATUS_LABEL: Record<string, string> = {
  PAID: 'Verse',
  PAYABLE: 'A verser',
  ACCRUED: 'Comptabilise',
};

function formatEur(n: number) {
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(n);
}

// ─── KPI Card ───────────────────────────────────────────────────────────────

function KpiCard({ icon, label, value, accent, subtitle }: {
  icon: React.ReactNode;
  label: string;
  value: string;
  accent: string;
  subtitle?: string;
}) {
  return (
    <div className={cn(
      'group relative rounded-xl border border-border/60 dark:border-white/10 p-3.5 flex items-center gap-3',
      'bg-white/80 dark:bg-white/5 backdrop-blur-md',
      'shadow-card hover:shadow-card-hover transition-all duration-200',
      'ring-1 ring-black/[0.03] dark:ring-white/[0.06]',
    )}>
      <div
        className="absolute top-0 left-0 right-0 h-[2px] rounded-t-xl opacity-60 group-hover:opacity-100 transition-opacity duration-200"
        style={{ background: `linear-gradient(90deg, ${accent}, ${accent}80)` }}
      />
      <div
        className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ring-1 ring-black/[0.04] dark:ring-white/[0.08]"
        style={{ background: `${accent}12` }}
      >
        {icon}
      </div>
      <div className="min-w-0">
        <span className="text-[9px] uppercase tracking-[0.2em] text-ink-3 dark:text-ink-3/80 font-semibold font-body block">{label}</span>
        <span className="font-display text-lg font-bold text-ink dark:text-white leading-none tracking-tight [font-variant-numeric:tabular-nums]">
          {value}
        </span>
        {subtitle && (
          <p className="text-[9px] text-ink-3 dark:text-white/40 font-body mt-0.5 truncate">{subtitle}</p>
        )}
      </div>
    </div>
  );
}

// ─── Premium Table Head ─────────────────────────────────────────────────────

function PremiumTh({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <th className={cn(
      'px-3 py-2.5 text-[10px] uppercase tracking-[0.18em] font-bold',
      'text-[#1A0A3E]/55 dark:text-white/50 font-body',
      className,
    )}>
      {children}
    </th>
  );
}

// ─── Quarterly Bar Chart ────────────────────────────────────────────────────

function QuarterlyChart({ data }: { data: { period: string; amount: number }[] }) {
  const max = Math.max(...data.map(d => d.amount), 1);
  return (
    <div className="flex items-end gap-2.5 h-32">
      {data.map((d) => (
        <div key={d.period} className="flex-1 flex flex-col items-center gap-1 group/bar">
          <span className="text-[9px] font-mono text-ink-3 dark:text-white/40 opacity-0 group-hover/bar:opacity-100 transition-opacity duration-200">
            {formatEur(d.amount)}
          </span>
          <div
            className={cn(
              'w-full rounded-t-lg transition-all duration-500',
              'bg-gradient-to-t from-[#3B1FA8] to-[#5B3FD4]',
              'group-hover/bar:from-[#3B1FA8] group-hover/bar:to-[#7B5FE4]',
              'group-hover/bar:shadow-md group-hover/bar:shadow-[#3B1FA8]/20',
            )}
            style={{ height: `${(d.amount / max) * 100}%`, minHeight: 6 }}
          />
          <span className="text-[9px] text-ink-3 dark:text-white/40 font-mono">{d.period}</span>
        </div>
      ))}
    </div>
  );
}

// ─── Donut Chart ─────────────────────────────────────────────────────────────

function DonutChart({ segments }: { segments: { label: string; value: number; color: string }[] }) {
  const total = segments.reduce((s, seg) => s + seg.value, 0);
  if (total === 0) return null;

  let cumulative = 0;
  const size = 110;
  const strokeWidth = 18;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  return (
    <div className="flex items-center gap-5">
      <div className="relative">
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="transform -rotate-90">
          {segments.map((seg, i) => {
            const pct = seg.value / total;
            const offset = cumulative * circumference;
            cumulative += pct;
            return (
              <circle
                key={i}
                cx={size / 2} cy={size / 2} r={radius}
                fill="none" stroke={seg.color} strokeWidth={strokeWidth}
                strokeDasharray={`${pct * circumference} ${circumference}`}
                strokeDashoffset={-offset}
                strokeLinecap="round"
                className="transition-all duration-700"
              />
            );
          })}
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-[9px] text-ink-3 dark:text-white/40 font-body">Total</span>
          <span className="text-[12px] font-display font-bold text-ink dark:text-white">{formatEur(total)}</span>
        </div>
      </div>
      <div className="flex flex-col gap-1.5">
        {segments.map((seg, i) => (
          <div key={i} className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full ring-1 ring-black/[0.04] dark:ring-white/10" style={{ backgroundColor: seg.color }} />
            <span className="text-[11px] text-ink-3 dark:text-white/50 font-body min-w-[70px]">{seg.label}</span>
            <span className="text-[11px] font-mono font-semibold text-ink dark:text-white ml-auto tabular-nums">{formatEur(seg.value)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Page ────────────────────────────────────────────────────────────────────

export default function CommissionsPage() {
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [periodFilter, setPeriodFilter] = useState<string | null>(null);

  const filtered = useMemo(() => {
    let data = [...DEMO_COMMISSIONS];
    if (statusFilter) data = data.filter(c => c.status === statusFilter);
    if (periodFilter) data = data.filter(c => c.period === periodFilter);
    return data;
  }, [statusFilter, periodFilter]);

  const totalPaid = DEMO_COMMISSIONS.filter(c => c.status === 'PAID').reduce((s, c) => s + c.amount, 0);
  const totalPayable = DEMO_COMMISSIONS.filter(c => c.status === 'PAYABLE').reduce((s, c) => s + c.amount, 0);
  const totalAccrued = DEMO_COMMISSIONS.filter(c => c.status === 'ACCRUED').reduce((s, c) => s + c.amount, 0);
  const grandTotal = totalPaid + totalPayable + totalAccrued;

  const periods = [...new Set(DEMO_COMMISSIONS.map(c => c.period))].sort();
  const quarterlyData = periods.map(p => ({
    period: p,
    amount: DEMO_COMMISSIONS.filter(c => c.period === p).reduce((s, c) => s + c.amount, 0),
  }));

  const handleExportCSV = () => {
    const header = 'Produit,Type,Taux,Montant,Statut,Periode,Date versement\n';
    const rows = filtered.map(c =>
      `"${c.productName}","${TYPE_LABELS[c.type]}",${c.ratePct}%,${c.amount},${STATUS_LABEL[c.status]},${c.period},${c.paidDate ?? ''}`
    ).join('\n');
    const blob = new Blob([header + rows], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `commissions_strickin_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleExportExcel = () => {
    const excelData = filtered.map(c => ({
      Produit: c.productName,
      Type: TYPE_LABELS[c.type] ?? c.type,
      'Taux (%)': c.ratePct,
      Montant: c.amount,
      Statut: STATUS_LABEL[c.status],
      Periode: c.period,
      'Date versement': c.paidDate ?? '',
    }));
    exportToExcel(excelData, `commissions_strickin_${new Date().toISOString().slice(0, 10)}`, 'Commissions');
  };

  return (
    <div className="animate-fade-in space-y-4">
      {/* ── Header ──────────────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-[22px] font-bold leading-tight bg-gradient-to-r from-[#3B1FA8] via-[#1A0A3E] to-[#3B1FA8] bg-clip-text text-transparent dark:from-white dark:via-[#C9BCFF] dark:to-white">
            Commissions
          </h1>
          <p className="text-[12px] text-ink-3 dark:text-white/50 font-body mt-0.5">
            Suivi et rapprochement de vos commissions
          </p>
        </div>
        <div className="flex items-center gap-1.5">
          <button
            onClick={handleExportCSV}
            className={cn(
              'h-8 px-3 rounded-xl border border-border/60 dark:border-white/15',
              'bg-white/80 dark:bg-white/5 backdrop-blur-sm text-ink-3 dark:text-white/60',
              'text-[11px] font-medium font-body flex items-center gap-1.5',
              'hover:border-[#3B1FA8]/40 hover:text-[#3B1FA8] dark:hover:text-[#C9BCFF]',
              'hover:shadow-sm transition-all duration-200',
            )}
          >
            <Download size={12} />
            CSV
          </button>
          <button
            onClick={handleExportExcel}
            className={cn(
              'h-8 px-3 rounded-xl border border-border/60 dark:border-white/15',
              'bg-white/80 dark:bg-white/5 backdrop-blur-sm text-ink-3 dark:text-white/60',
              'text-[11px] font-medium font-body flex items-center gap-1.5',
              'hover:border-[#3B1FA8]/40 hover:text-[#3B1FA8] dark:hover:text-[#C9BCFF]',
              'hover:shadow-sm transition-all duration-200',
            )}
          >
            <FileSpreadsheet size={12} />
            Excel
          </button>
        </div>
      </div>

      <div className="h-px bg-gradient-to-r from-[#3B1FA8]/20 via-[#3B1FA8]/10 to-transparent dark:from-[#3B1FA8]/30 dark:via-[#3B1FA8]/10" />

      {/* ── KPI Cards ──────────────────────────────────────────────── */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <KpiCard
          icon={<CircleDollarSign size={15} className="text-[#3B1FA8]" />}
          label="Total cumule"
          value={formatEur(grandTotal)}
          accent="#3B1FA8"
          subtitle="Toutes periodes"
        />
        <KpiCard
          icon={<CheckCircle2 size={15} className="text-[#00B894]" />}
          label="Verse"
          value={formatEur(totalPaid)}
          accent="#00B894"
        />
        <KpiCard
          icon={<Clock size={15} className="text-[#D4A017]" />}
          label="A verser"
          value={formatEur(totalPayable)}
          accent="#D4A017"
        />
        <KpiCard
          icon={<TrendingUp size={15} className="text-[#3D63F5]" />}
          label="Comptabilise"
          value={formatEur(totalAccrued)}
          accent="#3D63F5"
        />
      </section>

      {/* ── Charts ─────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        <div className={cn(
          'relative rounded-xl border border-border/60 dark:border-white/10 p-4',
          'bg-white/80 dark:bg-white/5 backdrop-blur-md',
          'ring-1 ring-black/[0.04] dark:ring-white/[0.06]',
          'shadow-card hover:shadow-card-hover transition-shadow duration-200',
        )}>
          <div
            className="absolute top-0 left-0 right-0 h-[2px] rounded-t-xl opacity-40"
            style={{ background: 'linear-gradient(90deg, #3B1FA8, #5B3FD4)' }}
          />
          <div className="flex items-center gap-2 mb-4">
            <div className="w-6 h-6 rounded-md bg-[#3B1FA8]/8 dark:bg-[#3B1FA8]/20 flex items-center justify-center">
              <BarChart3 size={12} className="text-[#3B1FA8] dark:text-[#C9BCFF]" />
            </div>
            <h3 className="font-display text-[13px] font-bold text-ink dark:text-white">Evolution trimestrielle</h3>
          </div>
          <QuarterlyChart data={quarterlyData} />
        </div>
        <div className={cn(
          'relative rounded-xl border border-border/60 dark:border-white/10 p-4',
          'bg-white/80 dark:bg-white/5 backdrop-blur-md',
          'ring-1 ring-black/[0.04] dark:ring-white/[0.06]',
          'shadow-card hover:shadow-card-hover transition-shadow duration-200',
        )}>
          <div
            className="absolute top-0 left-0 right-0 h-[2px] rounded-t-xl opacity-40"
            style={{ background: 'linear-gradient(90deg, #00B894, #3D63F5)' }}
          />
          <div className="flex items-center gap-2 mb-4">
            <div className="w-6 h-6 rounded-md bg-[#3B1FA8]/8 dark:bg-[#3B1FA8]/20 flex items-center justify-center">
              <PieChart size={12} className="text-[#3B1FA8] dark:text-[#C9BCFF]" />
            </div>
            <h3 className="font-display text-[13px] font-bold text-ink dark:text-white">Repartition par statut</h3>
          </div>
          <DonutChart segments={[
            { label: 'Verse', value: totalPaid, color: '#00B894' },
            { label: 'A verser', value: totalPayable, color: '#D4A017' },
            { label: 'Comptabilise', value: totalAccrued, color: '#3D63F5' },
          ]} />
        </div>
      </div>

      {/* ── Filters ────────────────────────────────────────────────── */}
      <div className="flex items-center gap-1.5 flex-wrap rounded-xl bg-white/80 dark:bg-white/[0.03] backdrop-blur-md p-2 border border-border/60 dark:border-white/8 shadow-sm">
        <div className="w-6 h-6 rounded-md bg-[#3B1FA8]/8 dark:bg-[#3B1FA8]/20 flex items-center justify-center mr-0.5">
          <Filter size={11} className="text-[#3B1FA8] dark:text-[#C9BCFF]" />
        </div>

        <button
          onClick={() => setStatusFilter(null)}
          className={cn(
            'text-[11px] px-2.5 py-1 rounded-lg font-semibold font-body border transition-all duration-200',
            !statusFilter
              ? 'bg-gradient-to-r from-[#3B1FA8] to-[#5B3FD4] text-white border-transparent shadow-sm'
              : 'border-border/60 dark:border-white/15 text-ink-3 dark:text-white/50 hover:text-ink dark:hover:text-white/80 hover:border-[#3B1FA8]/40',
          )}
        >
          Tous
        </button>
        {['PAID', 'PAYABLE', 'ACCRUED'].map(s => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className={cn(
              'text-[11px] px-2.5 py-1 rounded-lg font-semibold font-body border transition-all duration-200',
              statusFilter === s
                ? 'bg-gradient-to-r from-[#3B1FA8] to-[#5B3FD4] text-white border-transparent shadow-sm'
                : 'border-border/60 dark:border-white/15 text-ink-3 dark:text-white/50 hover:text-ink dark:hover:text-white/80 hover:border-[#3B1FA8]/40',
            )}
          >
            {STATUS_LABEL[s]}
          </button>
        ))}

        <span className="mx-0.5 w-px h-4 bg-border/60 dark:bg-white/10" />

        <button
          onClick={() => setPeriodFilter(null)}
          className={cn(
            'text-[11px] px-2.5 py-1 rounded-lg font-semibold font-body border transition-all duration-200',
            !periodFilter
              ? 'bg-[#1A0A3E] dark:bg-white/15 text-white border-transparent shadow-sm'
              : 'border-border/60 dark:border-white/15 text-ink-3 dark:text-white/50 hover:text-ink dark:hover:text-white/80 hover:border-[#1A0A3E]/40',
          )}
        >
          Toutes periodes
        </button>
        {periods.map(p => (
          <button
            key={p}
            onClick={() => setPeriodFilter(p)}
            className={cn(
              'text-[11px] px-2.5 py-1 rounded-lg font-semibold font-body border transition-all duration-200',
              periodFilter === p
                ? 'bg-[#1A0A3E] dark:bg-white/15 text-white border-transparent shadow-sm'
                : 'border-border/60 dark:border-white/15 text-ink-3 dark:text-white/50 hover:text-ink dark:hover:text-white/80 hover:border-[#1A0A3E]/40',
            )}
          >
            {p}
          </button>
        ))}
      </div>

      {/* ── Table ──────────────────────────────────────────────────── */}
      <div className={cn(
        'relative rounded-xl border border-border/60 dark:border-white/10 overflow-hidden',
        'bg-white/80 dark:bg-white/5 backdrop-blur-md',
        'ring-1 ring-black/[0.04] dark:ring-white/[0.06]',
        'shadow-card hover:shadow-card-hover transition-shadow duration-200',
      )}>
        <div
          className="absolute top-0 left-0 right-0 h-[2px] rounded-t-xl opacity-40"
          style={{ background: 'linear-gradient(90deg, #3B1FA8, #00B894 50%, transparent)' }}
        />
        <div className="overflow-x-auto">
          <table className="w-full text-[12px] font-body">
            <thead>
              <tr className="border-b border-border/60 dark:border-white/10 bg-gradient-to-r from-[#F8F6FF]/60 to-[#F0ECFF]/30 dark:from-white/[0.02] dark:to-transparent">
                <PremiumTh className="text-left">Produit</PremiumTh>
                <PremiumTh className="text-left">Type</PremiumTh>
                <PremiumTh className="text-right">Taux</PremiumTh>
                <PremiumTh className="text-right">Montant</PremiumTh>
                <PremiumTh className="text-center">Statut</PremiumTh>
                <PremiumTh className="text-left">Periode</PremiumTh>
                <PremiumTh className="text-right">Date versement</PremiumTh>
              </tr>
            </thead>
            <tbody className="stagger-rows">
              {filtered.map(c => (
                <tr
                  key={c.id}
                  className={cn(
                    'border-b border-border/30 dark:border-white/5 last:border-0',
                    'even:bg-[#F8F6FF]/30 dark:even:bg-white/[0.015]',
                    'hover:bg-[#3B1FA8]/[0.03] dark:hover:bg-white/[0.04]',
                    'transition-colors duration-200',
                  )}
                >
                  <td className="px-3 py-2.5 font-medium text-ink dark:text-white">{c.productName}</td>
                  <td className="px-3 py-2.5 text-ink-3 dark:text-white/50">{TYPE_LABELS[c.type] ?? c.type}</td>
                  <td className="px-3 py-2.5 text-right font-mono tabular-nums text-ink dark:text-white/80">
                    <Tooltip content={`Taux calcule sur le nominal investi (${TYPE_LABELS[c.type] ?? c.type})`} side="top">
                      <span className="cursor-help border-b border-dotted border-ink-3/30">{c.ratePct}%</span>
                    </Tooltip>
                  </td>
                  <td className="px-3 py-2.5 text-right font-mono font-semibold text-ink dark:text-white tabular-nums text-[13px] tracking-tight font-display">
                    {formatEur(c.amount)}
                  </td>
                  <td className="px-3 py-2.5 text-center">
                    <Badge variant={STATUS_VARIANT[c.status] ?? 'muted'}>{STATUS_LABEL[c.status]}</Badge>
                  </td>
                  <td className="px-3 py-2.5 text-ink-3 dark:text-white/40 font-mono text-[11px] tabular-nums">{c.period}</td>
                  <td className="px-3 py-2.5 text-right text-ink-3 dark:text-white/40 text-[11px] font-mono">{c.paidDate ?? '--'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="px-4 py-2.5 border-t border-border/60 dark:border-white/10 flex items-center justify-between bg-gradient-to-r from-[#F8F6FF]/40 to-transparent dark:from-white/[0.02] dark:to-transparent">
          <span className="text-[10px] text-ink-3 dark:text-white/40 font-body">
            {filtered.length} commission{filtered.length > 1 ? 's' : ''}
          </span>
          <span className="font-display font-bold text-[13px] text-ink dark:text-white tabular-nums [font-variant-numeric:tabular-nums]">
            Total: {formatEur(filtered.reduce((s, c) => s + c.amount, 0))}
          </span>
        </div>
      </div>
    </div>
  );
}
