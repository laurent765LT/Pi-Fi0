'use client';

import { useMemo, useState, useEffect } from 'react';
import {
  TrendingUp,
  Clock,
  CheckCircle2,
  Download,
  FileSpreadsheet,
  Filter,
  CircleDollarSign,
  BarChart3,
  PieChart,
  ChevronUp,
  ChevronDown,
  ChevronsUpDown,
  ChevronLeft,
  ChevronRight,
  Calendar,
  Layers,
  Tag,
} from 'lucide-react';
import { cn } from '@/lib/cn';
import { Badge } from '@/components/ui/badge';
import { PageHeader } from '@/components/ui/page-header';
import { Tooltip } from '@/components/ui/tooltip';
import { Dropdown, DropdownItem, DropdownSeparator } from '@/components/ui/dropdown';
import { exportToExcel } from '@/lib/export-utils';
import { useCommissionSummary } from '@/hooks/use-commissions';

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

// ─── Types ──────────────────────────────────────────────────────────────────

type SortCol = 'productName' | 'type' | 'ratePct' | 'amount' | 'status' | 'period';
type SortDir = 'asc' | 'desc';

type PeriodPreset = 'all' | 'month' | 'quarter' | 'year';

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

// ─── Sortable Table Head ────────────────────────────────────────────────────

function SortableTh({
  children,
  className,
  column,
  sortCol,
  sortDir,
  onSort,
}: {
  children: React.ReactNode;
  className?: string;
  column: SortCol;
  sortCol: SortCol;
  sortDir: SortDir;
  onSort: (col: SortCol) => void;
}) {
  const isActive = sortCol === column;
  return (
    <th
      className={cn(
        'px-3 py-2.5 text-[10px] uppercase tracking-[0.18em] font-bold',
        'font-body cursor-pointer select-none group/th transition-colors duration-200',
        isActive
          ? 'text-[#3B1FA8] dark:text-[#C9BCFF]'
          : 'text-[#1A0A3E]/55 dark:text-white/50 hover:text-[#3B1FA8]/80 dark:hover:text-[#C9BCFF]/80',
        className,
      )}
      onClick={() => onSort(column)}
    >
      <span className="inline-flex items-center gap-1">
        {children}
        {isActive ? (
          sortDir === 'asc' ? (
            <ChevronUp size={11} className="text-[#3B1FA8] dark:text-[#C9BCFF]" />
          ) : (
            <ChevronDown size={11} className="text-[#3B1FA8] dark:text-[#C9BCFF]" />
          )
        ) : (
          <ChevronsUpDown size={11} className="opacity-0 group-hover/th:opacity-50 transition-opacity" />
        )}
      </span>
    </th>
  );
}

// ─── Non-sortable Table Head ────────────────────────────────────────────────

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

// ─── Stacked Quarterly Bar Chart ────────────────────────────────────────────

const STATUS_COLORS: Record<string, string> = {
  PAID: '#00B894',
  PAYABLE: '#D4A017',
  ACCRUED: '#6B7280',
};

type QuarterlyStackedData = {
  period: string;
  total: number;
  segments: { status: string; amount: number; color: string }[];
};

function StackedQuarterlyChart({ data }: { data: QuarterlyStackedData[] }) {
  const max = Math.max(...data.map(d => d.total), 1);
  return (
    <div className="flex items-end gap-3 h-36">
      {data.map((d) => {
        const barHeight = (d.total / max) * 100;
        return (
          <div key={d.period} className="flex-1 flex flex-col items-center gap-1.5 group/bar">
            <span className="text-[9px] font-mono text-ink-3 dark:text-white/40 opacity-0 group-hover/bar:opacity-100 transition-opacity duration-200 tabular-nums">
              {formatEur(d.total)}
            </span>
            <div
              className="w-full rounded-t-lg overflow-hidden flex flex-col-reverse transition-all duration-500 group-hover/bar:shadow-md group-hover/bar:shadow-[#3B1FA8]/15"
              style={{ height: `${barHeight}%`, minHeight: 8 }}
            >
              {d.segments.map((seg, i) => {
                const segPct = d.total > 0 ? (seg.amount / d.total) * 100 : 0;
                return (
                  <div
                    key={seg.status}
                    className="w-full transition-all duration-500 group-hover/bar:brightness-110"
                    style={{
                      height: `${segPct}%`,
                      backgroundColor: seg.color,
                      borderRadius: i === d.segments.length - 1 ? '0.5rem 0.5rem 0 0' : '0',
                    }}
                    title={`${STATUS_LABEL[seg.status]}: ${formatEur(seg.amount)}`}
                  />
                );
              })}
            </div>
            <span className="text-[9px] text-ink-3 dark:text-white/40 font-mono">{d.period}</span>
          </div>
        );
      })}
    </div>
  );
}

function StackedBarLegend() {
  return (
    <div className="flex items-center gap-3 mt-3">
      {(['PAID', 'PAYABLE', 'ACCRUED'] as const).map((s) => (
        <div key={s} className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full ring-1 ring-black/[0.04] dark:ring-white/10" style={{ backgroundColor: STATUS_COLORS[s] }} />
          <span className="text-[10px] text-ink-3 dark:text-white/50 font-body">{STATUS_LABEL[s]}</span>
        </div>
      ))}
    </div>
  );
}

// ─── Product Breakdown Bar ──────────────────────────────────────────────────

const PRODUCT_COLORS = ['#3B1FA8', '#00B894', '#D4A017', '#3D63F5', '#E84393', '#6C5CE7', '#00CEC9', '#FD79A8'];

type ProductBreakdown = {
  name: string;
  total: number;
  pct: number;
};

function ProductBreakdownChart({ products, grandTotal }: { products: ProductBreakdown[]; grandTotal: number }) {
  if (products.length === 0) return null;
  const maxAmount = products[0]?.total ?? 1;
  return (
    <div className="flex flex-col gap-2.5">
      {products.map((p, i) => (
        <div key={p.name} className="group/prod">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[11px] font-body font-semibold text-ink dark:text-white/80 truncate max-w-[55%]">{p.name}</span>
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-mono font-bold text-ink dark:text-white tabular-nums">{formatEur(p.total)}</span>
              <span className="text-[9px] font-mono text-ink-3 dark:text-white/40 tabular-nums w-[38px] text-right">{p.pct.toFixed(1)}%</span>
            </div>
          </div>
          <div className="w-full h-2.5 rounded-full bg-surface-2/40 dark:bg-white/5 overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-700 group-hover/prod:brightness-110"
              style={{
                width: `${(p.total / maxAmount) * 100}%`,
                backgroundColor: PRODUCT_COLORS[i % PRODUCT_COLORS.length],
                minWidth: '4px',
              }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Commission Type Horizontal Stacked Bar ─────────────────────────────────

const TYPE_COLORS: Record<string, string> = {
  ENTRY_FEE: '#3B1FA8',
  DISTRIBUTION_FEE: '#00B894',
  MANAGEMENT_FEE: '#D4A017',
  TRAILER_FEE: '#3D63F5',
  STRUCTURING_FEE: '#E84393',
};

type TypeBreakdown = {
  type: string;
  label: string;
  amount: number;
  pct: number;
  color: string;
};

function CommissionTypeBar({ types }: { types: TypeBreakdown[] }) {
  const total = types.reduce((s, t) => s + t.amount, 0);
  if (total === 0) return null;
  return (
    <div>
      {/* Stacked horizontal bar */}
      <div className="w-full h-6 rounded-full overflow-hidden flex shadow-inner ring-1 ring-black/[0.04] dark:ring-white/[0.06]">
        {types.map((t, i) => (
          <div
            key={t.type}
            className="h-full transition-all duration-700 hover:brightness-110 relative group/seg"
            style={{
              width: `${t.pct}%`,
              backgroundColor: t.color,
              borderRadius: i === 0 ? '9999px 0 0 9999px' : i === types.length - 1 ? '0 9999px 9999px 0' : '0',
              minWidth: t.pct > 0 ? '4px' : '0',
            }}
            title={`${t.label}: ${formatEur(t.amount)} (${t.pct.toFixed(1)}%)`}
          >
            {t.pct >= 12 && (
              <span className="absolute inset-0 flex items-center justify-center text-[9px] font-mono font-bold text-white/90 tabular-nums">
                {t.pct.toFixed(0)}%
              </span>
            )}
          </div>
        ))}
      </div>
      {/* Legend */}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 mt-3">
        {types.map((t) => (
          <div key={t.type} className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full ring-1 ring-black/[0.04] dark:ring-white/10" style={{ backgroundColor: t.color }} />
            <span className="text-[10px] text-ink-3 dark:text-white/50 font-body">{t.label}</span>
            <span className="text-[10px] font-mono font-semibold text-ink dark:text-white tabular-nums">{formatEur(t.amount)}</span>
          </div>
        ))}
      </div>
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

// ─── Mobile Commission Card ─────────────────────────────────────────────────

function CommissionCard({ c }: { c: typeof DEMO_COMMISSIONS[number] }) {
  return (
    <div className={cn(
      'relative rounded-xl border border-border/60 dark:border-white/10 p-4',
      'bg-white/80 dark:bg-white/5 backdrop-blur-md',
      'ring-1 ring-black/[0.03] dark:ring-white/[0.06]',
      'shadow-card hover:shadow-card-hover transition-all duration-200',
    )}>
      <div
        className="absolute top-0 left-0 right-0 h-[2px] rounded-t-xl opacity-50"
        style={{
          background: c.status === 'PAID'
            ? 'linear-gradient(90deg, #00B894, #00B89480)'
            : c.status === 'PAYABLE'
            ? 'linear-gradient(90deg, #D4A017, #D4A01780)'
            : 'linear-gradient(90deg, #3D63F5, #3D63F580)',
        }}
      />
      <div className="flex items-start justify-between gap-3 mb-2">
        <h3 className="font-body text-[13px] font-semibold text-ink dark:text-white leading-tight">
          {c.productName}
        </h3>
        <Badge variant={STATUS_VARIANT[c.status] ?? 'muted'} size="sm">{STATUS_LABEL[c.status]}</Badge>
      </div>
      <div className="flex items-center gap-2 mb-3">
        <span className="text-[10px] font-body font-medium text-ink-3 dark:text-white/50 bg-surface-2/40 dark:bg-white/5 border border-border/20 px-2 py-0.5 rounded-md">
          {TYPE_LABELS[c.type] ?? c.type}
        </span>
        <span className="text-[10px] font-mono text-ink-3 dark:text-white/40 tabular-nums">{c.period}</span>
      </div>
      <div className="flex items-end justify-between">
        <div>
          <p className="text-[9px] text-ink-3 dark:text-white/40 font-body uppercase tracking-wider">Montant</p>
          <p className="font-display text-lg font-bold text-ink dark:text-white tabular-nums [font-variant-numeric:tabular-nums] tracking-tight">
            {formatEur(c.amount)}
          </p>
        </div>
        <div className="text-right">
          <p className="text-[9px] text-ink-3 dark:text-white/40 font-body uppercase tracking-wider">Taux</p>
          <p className="text-[13px] font-mono font-semibold text-ink dark:text-white/80 tabular-nums">{c.ratePct}%</p>
        </div>
      </div>
      {c.paidDate && (
        <p className="text-[10px] text-ink-3 dark:text-white/40 font-mono mt-2 pt-2 border-t border-border/20 tabular-nums">
          Verse le {c.paidDate}
        </p>
      )}
    </div>
  );
}

// ─── Period helpers ─────────────────────────────────────────────────────────

function matchesPeriodPreset(period: string, preset: PeriodPreset): boolean {
  if (preset === 'all') return true;
  // period format: "2026-Q1", "2025-Q4"
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1; // 1-12
  const currentQ = Math.ceil(month / 3);

  const [pYear, pQ] = period.split('-Q');
  const periodYear = parseInt(pYear, 10);
  const periodQuarter = parseInt(pQ, 10);

  if (preset === 'month') {
    // Current quarter only (closest approximation since data is quarterly)
    return periodYear === year && periodQuarter === currentQ;
  }
  if (preset === 'quarter') {
    return periodYear === year && periodQuarter === currentQ;
  }
  if (preset === 'year') {
    return periodYear === year;
  }
  return true;
}

const PERIOD_PRESETS: { key: PeriodPreset; label: string }[] = [
  { key: 'all', label: 'Tout' },
  { key: 'month', label: 'Ce mois' },
  { key: 'quarter', label: 'Ce trimestre' },
  { key: 'year', label: 'Cette annee' },
];

// ─── Page ────────────────────────────────────────────────────────────────────

export default function CommissionsPage() {
  useEffect(() => { document.title = "Commissions | Strick'in"; }, []);
  const { data: summaryData } = useCommissionSummary();

  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [periodFilter, setPeriodFilter] = useState<string | null>(null);
  const [periodPreset, setPeriodPreset] = useState<PeriodPreset>('all');

  // Sorting
  const [sortCol, setSortCol] = useState<SortCol>('amount');
  const [sortDir, setSortDir] = useState<SortDir>('desc');

  // Pagination
  const [page, setPage] = useState(1);
  const perPage = 10;

  const handleSort = (col: SortCol) => {
    if (sortCol === col) {
      setSortDir((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortCol(col);
      setSortDir('desc');
    }
    setPage(1);
  };

  const filtered = useMemo(() => {
    let data = [...DEMO_COMMISSIONS];
    if (statusFilter) data = data.filter(c => c.status === statusFilter);
    if (periodFilter) data = data.filter(c => c.period === periodFilter);
    if (periodPreset !== 'all') data = data.filter(c => matchesPeriodPreset(c.period, periodPreset));

    // Sort
    data.sort((a, b) => {
      let cmp = 0;
      switch (sortCol) {
        case 'productName':
          cmp = a.productName.localeCompare(b.productName);
          break;
        case 'type':
          cmp = (TYPE_LABELS[a.type] ?? a.type).localeCompare(TYPE_LABELS[b.type] ?? b.type);
          break;
        case 'ratePct':
          cmp = a.ratePct - b.ratePct;
          break;
        case 'amount':
          cmp = a.amount - b.amount;
          break;
        case 'status':
          cmp = a.status.localeCompare(b.status);
          break;
        case 'period':
          cmp = a.period.localeCompare(b.period);
          break;
      }
      return sortDir === 'asc' ? cmp : -cmp;
    });

    return data;
  }, [statusFilter, periodFilter, periodPreset, sortCol, sortDir]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage));
  const paginatedData = filtered.slice((page - 1) * perPage, page * perPage);

  const demoTotalPaid = DEMO_COMMISSIONS.filter(c => c.status === 'PAID').reduce((s, c) => s + c.amount, 0);
  const demoTotalPayable = DEMO_COMMISSIONS.filter(c => c.status === 'PAYABLE').reduce((s, c) => s + c.amount, 0);
  const demoTotalAccrued = DEMO_COMMISSIONS.filter(c => c.status === 'ACCRUED').reduce((s, c) => s + c.amount, 0);

  const totalPaid = summaryData?.totalPaid ?? demoTotalPaid;
  const totalPayable = summaryData?.totalPayable ?? demoTotalPayable;
  const totalAccrued = summaryData?.totalAccrued ?? demoTotalAccrued;
  const grandTotal = totalPaid + totalPayable + totalAccrued;
  const filteredTotal = filtered.reduce((s, c) => s + c.amount, 0);

  const periods = [...new Set(DEMO_COMMISSIONS.map(c => c.period))].sort();

  // ── Stacked quarterly data (by status per period) ──
  const stackedQuarterlyData = useMemo<QuarterlyStackedData[]>(() => {
    return periods.map(p => {
      const periodItems = DEMO_COMMISSIONS.filter(c => c.period === p);
      const segments = (['PAID', 'PAYABLE', 'ACCRUED'] as const).map(status => ({
        status,
        amount: periodItems.filter(c => c.status === status).reduce((s, c) => s + c.amount, 0),
        color: STATUS_COLORS[status],
      }));
      return {
        period: p,
        total: periodItems.reduce((s, c) => s + c.amount, 0),
        segments,
      };
    });
  }, []);

  // ── Product breakdown ──
  const productBreakdown = useMemo<ProductBreakdown[]>(() => {
    const byProduct: Record<string, number> = {};
    DEMO_COMMISSIONS.forEach(c => {
      byProduct[c.productName] = (byProduct[c.productName] ?? 0) + c.amount;
    });
    const total = DEMO_COMMISSIONS.reduce((s, c) => s + c.amount, 0);
    return Object.entries(byProduct)
      .map(([name, amt]) => ({ name, total: amt, pct: total > 0 ? (amt / total) * 100 : 0 }))
      .sort((a, b) => b.total - a.total);
  }, []);

  // ── Commission type breakdown ──
  const typeBreakdown = useMemo<TypeBreakdown[]>(() => {
    const byType: Record<string, number> = {};
    DEMO_COMMISSIONS.forEach(c => {
      byType[c.type] = (byType[c.type] ?? 0) + c.amount;
    });
    const total = DEMO_COMMISSIONS.reduce((s, c) => s + c.amount, 0);
    return Object.entries(byType)
      .map(([type, amt]) => ({
        type,
        label: TYPE_LABELS[type] ?? type,
        amount: amt,
        pct: total > 0 ? (amt / total) * 100 : 0,
        color: TYPE_COLORS[type] ?? '#6B7280',
      }))
      .sort((a, b) => b.amount - a.amount);
  }, []);

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
      <PageHeader
        icon={CircleDollarSign}
        title="Commissions"
        subtitle="Suivi et rapprochement de vos commissions"
        accentFrom="#3B1FA8"
        accentTo="#5B3FD4"
        className="mb-4"
      >
        <Dropdown
          align="right"
          trigger={
            <button
              className={cn(
                'h-8 px-3.5 rounded-xl border border-border/60 dark:border-white/15',
                'bg-white/80 dark:bg-white/5 backdrop-blur-sm text-ink-3 dark:text-white/60',
                'text-[11px] font-medium font-body flex items-center gap-1.5',
                'hover:border-[#3B1FA8]/40 hover:text-[#3B1FA8] dark:hover:text-[#C9BCFF]',
                'hover:shadow-sm transition-all duration-200',
              )}
            >
              <Download size={12} />
              Exporter
              <ChevronDown size={10} className="ml-0.5 opacity-60" />
            </button>
          }
        >
          <DropdownItem
            icon={<Download size={14} />}
            label="Exporter CSV"
            onClick={handleExportCSV}
          />
          <DropdownSeparator />
          <DropdownItem
            icon={<FileSpreadsheet size={14} />}
            label="Exporter Excel"
            onClick={handleExportExcel}
          />
        </Dropdown>
      </PageHeader>

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

      {/* ── Tendance trimestrielle (Stacked Bars) ─────────────────── */}
      <div className={cn(
        'relative rounded-xl border border-border/60 dark:border-white/10 p-4',
        'bg-white/80 dark:bg-white/5 backdrop-blur-md',
        'ring-1 ring-black/[0.04] dark:ring-white/[0.06]',
        'shadow-card hover:shadow-card-hover transition-shadow duration-200',
      )}>
        <div
          className="absolute top-0 left-0 right-0 h-[2px] rounded-t-xl opacity-40"
          style={{ background: 'linear-gradient(90deg, #3B1FA8, #00B894 50%, #D4A017)' }}
        />
        <div className="flex items-center gap-2 mb-4">
          <div className="w-6 h-6 rounded-md bg-[#3B1FA8]/8 dark:bg-[#3B1FA8]/20 flex items-center justify-center">
            <BarChart3 size={12} className="text-[#3B1FA8] dark:text-[#C9BCFF]" />
          </div>
          <h3 className="font-display text-[13px] font-bold text-ink dark:text-white">Tendance trimestrielle</h3>
          <span className="text-[10px] font-body text-ink-3 dark:text-white/40 ml-auto">Ventilation par statut</span>
        </div>
        <StackedQuarterlyChart data={stackedQuarterlyData} />
        <StackedBarLegend />
      </div>

      {/* ── Repartition par produit + Type breakdown ─────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        {/* Product breakdown */}
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
              <Layers size={12} className="text-[#3B1FA8] dark:text-[#C9BCFF]" />
            </div>
            <h3 className="font-display text-[13px] font-bold text-ink dark:text-white">Repartition par produit</h3>
          </div>
          <ProductBreakdownChart products={productBreakdown} grandTotal={grandTotal} />
        </div>

        {/* Commission type donut / stacked bar + Status donut */}
        <div className="flex flex-col gap-3">
          {/* Commission Type bar */}
          <div className={cn(
            'relative rounded-xl border border-border/60 dark:border-white/10 p-4',
            'bg-white/80 dark:bg-white/5 backdrop-blur-md',
            'ring-1 ring-black/[0.04] dark:ring-white/[0.06]',
            'shadow-card hover:shadow-card-hover transition-shadow duration-200',
          )}>
            <div
              className="absolute top-0 left-0 right-0 h-[2px] rounded-t-xl opacity-40"
              style={{ background: 'linear-gradient(90deg, #3B1FA8, #00B894, #D4A017, #3D63F5, #E84393)' }}
            />
            <div className="flex items-center gap-2 mb-4">
              <div className="w-6 h-6 rounded-md bg-[#3B1FA8]/8 dark:bg-[#3B1FA8]/20 flex items-center justify-center">
                <Tag size={12} className="text-[#3B1FA8] dark:text-[#C9BCFF]" />
              </div>
              <h3 className="font-display text-[13px] font-bold text-ink dark:text-white">Par type de commission</h3>
            </div>
            <CommissionTypeBar types={typeBreakdown} />
          </div>

          {/* Existing status donut */}
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

      {/* ── Period Preset Filter ───────────────────────────────────── */}
      <div className="flex items-center gap-1.5 flex-wrap">
        <div className="w-6 h-6 rounded-md bg-[#D4A017]/8 dark:bg-[#D4A017]/20 flex items-center justify-center mr-0.5">
          <Calendar size={11} className="text-[#D4A017]" />
        </div>
        {PERIOD_PRESETS.map((preset) => (
          <button
            key={preset.key}
            onClick={() => {
              setPeriodPreset(preset.key);
              setPeriodFilter(null);
              setPage(1);
            }}
            className={cn(
              'text-[11px] px-3 py-1.5 rounded-full font-semibold font-body border transition-all duration-200',
              periodPreset === preset.key
                ? 'bg-gradient-to-r from-[#D4A017] to-[#D4A017]/80 text-white border-transparent shadow-sm shadow-[#D4A017]/20'
                : 'border-border/60 dark:border-white/15 text-ink-3 dark:text-white/50 hover:text-ink dark:hover:text-white/80 hover:border-[#D4A017]/40',
            )}
          >
            {preset.label}
          </button>
        ))}
        {periodPreset !== 'all' && (
          <span className="text-[11px] font-mono font-semibold text-[#D4A017] ml-2 tabular-nums">
            Total filtre : {formatEur(filteredTotal)}
          </span>
        )}
      </div>

      {/* ── Desktop Table ─────────────────────────────────────────── */}
      <div className={cn(
        'relative rounded-xl border border-border/60 dark:border-white/10 overflow-hidden',
        'bg-white/80 dark:bg-white/5 backdrop-blur-md',
        'ring-1 ring-black/[0.04] dark:ring-white/[0.06]',
        'shadow-card hover:shadow-card-hover transition-shadow duration-200',
        'hidden md:block',
      )}>
        <div
          className="absolute top-0 left-0 right-0 h-[2px] rounded-t-xl opacity-40"
          style={{ background: 'linear-gradient(90deg, #3B1FA8, #00B894 50%, transparent)' }}
        />
        <div className="overflow-x-auto">
          <table className="w-full text-[12px] font-body" aria-label="Tableau des commissions">
            <thead>
              <tr className="border-b border-border/60 dark:border-white/10 bg-gradient-to-r from-[#F8F6FF]/60 to-[#F0ECFF]/30 dark:from-white/[0.02] dark:to-transparent">
                <SortableTh column="productName" sortCol={sortCol} sortDir={sortDir} onSort={handleSort} className="text-left">Produit</SortableTh>
                <SortableTh column="type" sortCol={sortCol} sortDir={sortDir} onSort={handleSort} className="text-left">Type</SortableTh>
                <SortableTh column="ratePct" sortCol={sortCol} sortDir={sortDir} onSort={handleSort} className="text-right">Taux</SortableTh>
                <SortableTh column="amount" sortCol={sortCol} sortDir={sortDir} onSort={handleSort} className="text-right">Montant</SortableTh>
                <SortableTh column="status" sortCol={sortCol} sortDir={sortDir} onSort={handleSort} className="text-center">Statut</SortableTh>
                <SortableTh column="period" sortCol={sortCol} sortDir={sortDir} onSort={handleSort} className="text-left">Periode</SortableTh>
                <PremiumTh className="text-right">Date versement</PremiumTh>
              </tr>
            </thead>
            <tbody className="stagger-rows">
              {paginatedData.map(c => (
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

        {/* Table Footer with Pagination */}
        <div className="px-4 py-2.5 border-t border-border/60 dark:border-white/10 flex items-center justify-between bg-gradient-to-r from-[#F8F6FF]/40 to-transparent dark:from-white/[0.02] dark:to-transparent">
          <span className="text-[10px] text-ink-3 dark:text-white/40 font-body">
            {filtered.length} commission{filtered.length > 1 ? 's' : ''}
          </span>

          {/* Pagination controls */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className={cn(
                'h-7 px-2.5 rounded-lg text-[11px] font-body font-semibold flex items-center gap-1 transition-all duration-200',
                page === 1
                  ? 'text-ink-3/30 dark:text-white/20 cursor-not-allowed'
                  : 'text-ink-3 dark:text-white/50 hover:text-[#3B1FA8] dark:hover:text-[#C9BCFF] hover:bg-[#3B1FA8]/5',
              )}
            >
              <ChevronLeft size={12} />
              Precedent
            </button>
            <span className="text-[11px] font-body text-ink-3 dark:text-white/50">
              Page <span className="font-mono font-bold text-[#3B1FA8] dark:text-[#C9BCFF] tabular-nums">{page}</span> sur{' '}
              <span className="font-mono font-bold tabular-nums">{totalPages}</span>
            </span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className={cn(
                'h-7 px-2.5 rounded-lg text-[11px] font-body font-semibold flex items-center gap-1 transition-all duration-200',
                page === totalPages
                  ? 'text-ink-3/30 dark:text-white/20 cursor-not-allowed'
                  : 'text-ink-3 dark:text-white/50 hover:text-[#3B1FA8] dark:hover:text-[#C9BCFF] hover:bg-[#3B1FA8]/5',
              )}
            >
              Suivant
              <ChevronRight size={12} />
            </button>
          </div>

          <span className="font-display font-bold text-[13px] text-ink dark:text-white tabular-nums [font-variant-numeric:tabular-nums]">
            Total: {formatEur(filteredTotal)}
          </span>
        </div>
      </div>

      {/* ── Mobile Cards ──────────────────────────────────────────── */}
      <div className="md:hidden space-y-3">
        {paginatedData.map((c) => (
          <CommissionCard key={c.id} c={c} />
        ))}

        {/* Mobile Pagination */}
        <div className="flex items-center justify-between px-2 py-3">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className={cn(
              'h-8 px-3 rounded-xl text-[11px] font-body font-semibold flex items-center gap-1 border transition-all duration-200',
              page === 1
                ? 'text-ink-3/30 dark:text-white/20 border-border/20 dark:border-white/5 cursor-not-allowed'
                : 'text-ink-3 dark:text-white/50 border-border/40 dark:border-white/10 hover:text-[#3B1FA8] dark:hover:text-[#C9BCFF] hover:border-[#3B1FA8]/40',
            )}
          >
            <ChevronLeft size={12} />
            Precedent
          </button>
          <span className="text-[11px] font-body text-ink-3 dark:text-white/50">
            <span className="font-mono font-bold text-[#3B1FA8] dark:text-[#C9BCFF] tabular-nums">{page}</span>
            <span className="mx-1">/</span>
            <span className="font-mono font-bold tabular-nums">{totalPages}</span>
          </span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className={cn(
              'h-8 px-3 rounded-xl text-[11px] font-body font-semibold flex items-center gap-1 border transition-all duration-200',
              page === totalPages
                ? 'text-ink-3/30 dark:text-white/20 border-border/20 dark:border-white/5 cursor-not-allowed'
                : 'text-ink-3 dark:text-white/50 border-border/40 dark:border-white/10 hover:text-[#3B1FA8] dark:hover:text-[#C9BCFF] hover:border-[#3B1FA8]/40',
            )}
          >
            Suivant
            <ChevronRight size={12} />
          </button>
        </div>

        {/* Mobile footer total */}
        <div className="flex items-center justify-between px-3 py-2.5 rounded-xl bg-white/80 dark:bg-white/5 border border-border/60 dark:border-white/10">
          <span className="text-[10px] text-ink-3 dark:text-white/40 font-body">
            {filtered.length} commission{filtered.length > 1 ? 's' : ''}
          </span>
          <span className="font-display font-bold text-[13px] text-ink dark:text-white tabular-nums">
            Total: {formatEur(filteredTotal)}
          </span>
        </div>
      </div>
    </div>
  );
}
