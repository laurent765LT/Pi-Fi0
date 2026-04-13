'use client';

import { useMemo, useState } from 'react';
import { Wallet, TrendingUp, Clock, CheckCircle2, Download, FileSpreadsheet, Filter } from 'lucide-react';
import { useCommissionSummary } from '@/hooks/use-commissions';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
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

// ─── Mini Bar Chart ──────────────────────────────────────────────────────────

function QuarterlyChart({ data }: { data: { period: string; amount: number }[] }) {
  const max = Math.max(...data.map(d => d.amount), 1);
  return (
    <div className="flex items-end gap-2 h-32">
      {data.map((d) => (
        <div key={d.period} className="flex-1 flex flex-col items-center gap-1">
          <span className="text-[10px] font-mono text-ink-3">{formatEur(d.amount)}</span>
          <div className="w-full rounded-t-md bg-violet transition-all duration-700" style={{ height: `${(d.amount / max) * 100}%`, minHeight: 4 }} />
          <span className="text-[10px] text-ink-3">{d.period}</span>
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
  const size = 120;
  const strokeWidth = 20;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  return (
    <div className="flex items-center gap-6">
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
              className="transition-all duration-700"
            />
          );
        })}
      </svg>
      <div className="flex flex-col gap-1.5">
        {segments.map((seg, i) => (
          <div key={i} className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: seg.color }} />
            <span className="text-xs text-ink-3">{seg.label}</span>
            <span className="text-xs font-mono font-semibold text-ink ml-auto">{formatEur(seg.value)}</span>
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
    <div className="animate-fade-in">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display text-[28px] font-bold text-ink">Commissions</h1>
          <p className="text-sm text-ink-3 mt-1">Suivi et rapprochement de vos commissions</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="md" onClick={handleExportCSV} className="flex items-center gap-2">
            <Download size={15} /> Export CSV
          </Button>
          <Button variant="outline" size="md" onClick={handleExportExcel} className="flex items-center gap-2">
            <FileSpreadsheet size={15} /> Export Excel
          </Button>
        </div>
      </div>
      <div className="gradient-bar h-[2px] rounded-full mb-8 opacity-60" />

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Total cumule', value: formatEur(grandTotal), icon: Wallet, color: '#3B1FA8' },
          { label: 'Verse', value: formatEur(totalPaid), icon: CheckCircle2, color: '#00B894' },
          { label: 'A verser', value: formatEur(totalPayable), icon: Clock, color: '#D4A017' },
          { label: 'Comptabilise', value: formatEur(totalAccrued), icon: TrendingUp, color: '#3D63F5' },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="bg-white rounded-xl border border-border/80 p-5 group hover:shadow-md transition-all">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center mb-3" style={{ background: `${color}10` }}>
              <Icon size={16} style={{ color }} />
            </div>
            <span className="text-[10px] uppercase tracking-widest text-ink-3 font-semibold">{label}</span>
            <div className="font-display text-2xl font-bold text-ink mt-0.5">{value}</div>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <div className="bg-white rounded-xl border border-border/80 p-5">
          <h3 className="font-display text-sm font-bold text-ink mb-4">Evolution trimestrielle</h3>
          <QuarterlyChart data={quarterlyData} />
        </div>
        <div className="bg-white rounded-xl border border-border/80 p-5">
          <h3 className="font-display text-sm font-bold text-ink mb-4">Repartition par statut</h3>
          <DonutChart segments={[
            { label: 'Verse', value: totalPaid, color: '#00B894' },
            { label: 'A verser', value: totalPayable, color: '#D4A017' },
            { label: 'Comptabilise', value: totalAccrued, color: '#3D63F5' },
          ]} />
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-2 mb-4">
        <Filter size={14} className="text-ink-3" />
        <button onClick={() => setStatusFilter(null)} className={`text-xs px-3 py-1 rounded-full border transition ${!statusFilter ? 'bg-violet text-white border-violet' : 'border-border text-ink-3 hover:border-violet'}`}>Tous</button>
        {['PAID', 'PAYABLE', 'ACCRUED'].map(s => (
          <button key={s} onClick={() => setStatusFilter(s)} className={`text-xs px-3 py-1 rounded-full border transition ${statusFilter === s ? 'bg-violet text-white border-violet' : 'border-border text-ink-3 hover:border-violet'}`}>
            {STATUS_LABEL[s]}
          </button>
        ))}
        <span className="mx-2 text-border">|</span>
        <button onClick={() => setPeriodFilter(null)} className={`text-xs px-3 py-1 rounded-full border transition ${!periodFilter ? 'bg-ink text-white border-ink' : 'border-border text-ink-3 hover:border-ink'}`}>Toutes periodes</button>
        {periods.map(p => (
          <button key={p} onClick={() => setPeriodFilter(p)} className={`text-xs px-3 py-1 rounded-full border transition ${periodFilter === p ? 'bg-ink text-white border-ink' : 'border-border text-ink-3 hover:border-ink'}`}>{p}</button>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-border/80 overflow-hidden">
        <table className="data-table">
          <thead>
            <tr>
              <th>Produit</th>
              <th>Type</th>
              <th className="text-right">Taux</th>
              <th className="text-right">Montant</th>
              <th className="text-center">Statut</th>
              <th>Periode</th>
              <th className="text-right">Date versement</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(c => (
              <tr key={c.id}>
                <td className="font-medium text-ink">{c.productName}</td>
                <td className="text-ink-3">{TYPE_LABELS[c.type] ?? c.type}</td>
                <td className="text-right font-mono">{c.ratePct}%</td>
                <td className="text-right font-mono font-semibold text-ink">{formatEur(c.amount)}</td>
                <td className="text-center"><Badge variant={STATUS_VARIANT[c.status] ?? 'muted'}>{STATUS_LABEL[c.status]}</Badge></td>
                <td className="text-ink-3 font-mono text-xs">{c.period}</td>
                <td className="text-right text-ink-3 text-xs">{c.paidDate ?? '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="px-5 py-3 border-t border-border/60 flex items-center justify-between text-xs text-ink-3">
          <span>{filtered.length} commission(s)</span>
          <span className="font-mono font-semibold text-ink">Total: {formatEur(filtered.reduce((s, c) => s + c.amount, 0))}</span>
        </div>
      </div>
    </div>
  );
}
