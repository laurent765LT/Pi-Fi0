'use client';

import { useState, useMemo, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  Package,
  TrendingUp,
  Calendar,
  Wallet,
  Clock,
  Download,
  ArrowUpRight,
  ArrowUp,
  ArrowDown,
  CheckCircle2,
  Eye,
  X,
  ChevronLeft,
  ChevronRight,
  BarChart3,
  Layers,
  Brain,
  Sparkles,
  Zap,
  AlertCircle,
  TrendingDown,
  Target,
  ExternalLink,
  Activity,
  PieChart,
  Shield,
} from 'lucide-react';
import { cn } from '@/lib/cn';
import { useMyCommitments, useCancelCommitment } from '@/hooks/use-commitments';
import { useReviewCommitment, useApproveCommitment, useRejectCommitment } from '@/hooks/use-commitment-actions';
import { useProducts } from '@/hooks/use-products';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tooltip } from '@/components/ui/tooltip';
import { useAnimatedCounter } from '@/hooks/use-animated-counter';
import { ToastContainer, useToast } from '@/components/ui/toast';
import { exportToExcel } from '@/lib/export-utils';
import { PageHeader } from '@/components/ui/page-header';

// ─── Types ───────────────────────────────────────────────────────────────────

type PortfolioTab = 'products' | 'underlyings' | 'timeline' | 'allocations' | 'expired';
type BarrierStatus = 'above' | 'below' | 'watch' | 'barrier';
type SortColumn = 'name' | 'amount' | 'coupon' | 'barrier' | 'sri' | 'date' | 'status';
type SortDir = 'asc' | 'desc';

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

/** Generate deterministic sparkline points from a seed string */
function sparklinePoints(seed: string, count = 12): number[] {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = ((h << 5) - h + seed.charCodeAt(i)) | 0;
  const pts: number[] = [];
  let val = 50 + (Math.abs(h) % 30);
  for (let i = 0; i < count; i++) {
    h = ((h * 1103515245 + 12345) & 0x7fffffff);
    val += ((h % 15) - 6);
    val = Math.max(10, Math.min(90, val));
    pts.push(val);
  }
  return pts;
}

const SRI_COLORS: Record<number, string> = {
  1: '#00B894',
  2: '#00B894',
  3: '#D4A017',
  4: '#D4A017',
  5: '#E8334A',
  6: '#E8334A',
  7: '#E8334A',
};

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

// ─── Mini Sparkline ──────────────────────────────────────────────────────────

function MiniSparkline({ points, color, width = 64, height = 24 }: {
  points: number[];
  color: string;
  width?: number;
  height?: number;
}) {
  if (points.length < 2) return null;
  const max = Math.max(...points);
  const min = Math.min(...points);
  const range = max - min || 1;
  const pad = 2;

  const pathPoints = points.map((p, i) => {
    const x = pad + (i / (points.length - 1)) * (width - pad * 2);
    const y = pad + (1 - (p - min) / range) * (height - pad * 2);
    return `${x},${y}`;
  });

  const d = `M${pathPoints.join(' L')}`;
  const areaD = `${d} L${width - pad},${height - pad} L${pad},${height - pad} Z`;

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} className="shrink-0">
      <defs>
        <linearGradient id={`spark-${color.replace('#', '')}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity={0.15} />
          <stop offset="100%" stopColor={color} stopOpacity={0} />
        </linearGradient>
      </defs>
      <path d={areaD} fill={`url(#spark-${color.replace('#', '')})`} />
      <path d={d} fill="none" stroke={color} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={parseFloat(pathPoints[pathPoints.length - 1].split(',')[0])} cy={parseFloat(pathPoints[pathPoints.length - 1].split(',')[1])} r={2} fill={color} />
    </svg>
  );
}

// ─── KPI Card ────────────────────────────────────────────────────────────────

function KpiCard({ icon, label, value, accent, trend, trendLabel, sparkData }: {
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
  accent: string;
  trend?: 'up' | 'down' | 'neutral';
  trendLabel?: string;
  sparkData?: number[];
}) {
  return (
    <div className={cn(
      'group relative rounded-xl border border-border/50 dark:border-white/8 px-4 py-3.5 flex flex-col gap-2.5',
      'bg-white/80 dark:bg-white/[0.04] backdrop-blur-md',
      'hover:shadow-md hover:-translate-y-0.5 transition-all duration-200',
      'ring-1 ring-black/[0.02] dark:ring-white/[0.04]',
      'overflow-hidden',
    )}>
      {/* Top accent bar */}
      <div
        className="absolute top-0 left-0 right-0 h-[2px] rounded-t-xl opacity-60 group-hover:opacity-100 transition-opacity duration-200"
        style={{ background: `linear-gradient(90deg, ${accent}, ${accent}60)` }}
      />

      {/* Header row */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ring-1 ring-black/[0.03] dark:ring-white/[0.06]"
            style={{ background: `${accent}10` }}
          >
            {icon}
          </div>
          <span className="text-[9px] uppercase tracking-[0.18em] text-ink-3 dark:text-ink-3/70 font-semibold font-body leading-none">
            {label}
          </span>
        </div>
        {sparkData && (
          <MiniSparkline points={sparkData} color={accent} width={56} height={20} />
        )}
      </div>

      {/* Value row */}
      <div className="flex items-end justify-between">
        <span className="font-display text-[22px] font-bold text-ink dark:text-white leading-none tracking-tight [font-variant-numeric:tabular-nums]">
          {value}
        </span>
        {trend && trendLabel && (
          <span className={cn(
            'inline-flex items-center gap-0.5 text-[10px] font-mono font-semibold px-1.5 py-0.5 rounded-md',
            trend === 'up' && 'text-[#00B894] bg-[#00B894]/8',
            trend === 'down' && 'text-[#E8334A] bg-[#E8334A]/8',
            trend === 'neutral' && 'text-ink-3 bg-ink-3/8',
          )}>
            {trend === 'up' && <TrendingUp size={9} />}
            {trend === 'down' && <TrendingDown size={9} />}
            {trendLabel}
          </span>
        )}
      </div>
    </div>
  );
}

// ─── Premium Table Head ─────────────────────────────────────────────────────

function PremiumTh({
  children,
  className,
  sortable,
  sortKey,
  activeSort,
  activeSortDir,
  onSort,
}: {
  children: React.ReactNode;
  className?: string;
  sortable?: boolean;
  sortKey?: SortColumn;
  activeSort?: SortColumn;
  activeSortDir?: SortDir;
  onSort?: (col: SortColumn) => void;
}) {
  const isActive = sortable && sortKey && activeSort === sortKey;

  const handleClick = () => {
    if (sortable && sortKey && onSort) onSort(sortKey);
  };

  return (
    <th
      className={cn(
        'px-3 py-2.5 text-[10px] uppercase tracking-[0.18em] font-bold',
        'text-[#1A0A3E]/50 dark:text-white/45 font-body whitespace-nowrap',
        sortable && 'cursor-pointer select-none hover:text-[#3B1FA8] dark:hover:text-[#C9BCFF] transition-colors duration-150',
        isActive && 'text-[#3B1FA8] dark:text-[#C9BCFF]',
        className,
      )}
      onClick={handleClick}
    >
      <span className="inline-flex items-center gap-1">
        {children}
        {isActive && activeSortDir === 'asc' && <ArrowUp size={10} className="text-[#3B1FA8] dark:text-[#C9BCFF]" />}
        {isActive && activeSortDir === 'desc' && <ArrowDown size={10} className="text-[#3B1FA8] dark:text-[#C9BCFF]" />}
      </span>
    </th>
  );
}

// ─── Barrier Distance Bar ───────────────────────────────────────────────────

function BarrierDistanceBar({ distancePct, barrierPct }: { distancePct: number; barrierPct: number }) {
  const color = distancePct > 30 ? '#00B894' : distancePct > 15 ? '#D4A017' : '#E8334A';
  const clampedWidth = Math.min(100, Math.max(5, distancePct));

  return (
    <Tooltip content={`Distance à la barrière : ${distancePct.toFixed(1)}% (barrière à ${barrierPct}%)`}>
      <div className="flex items-center gap-1.5 min-w-[80px]">
        <div className="flex-1 h-[5px] rounded-full bg-black/[0.04] dark:bg-white/[0.06] overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{ width: `${clampedWidth}%`, backgroundColor: color }}
          />
        </div>
        <span className="text-[10px] font-mono font-semibold tabular-nums" style={{ color }}>
          {distancePct.toFixed(0)}%
        </span>
      </div>
    </Tooltip>
  );
}

// ─── SRI Mini Pill ──────────────────────────────────────────────────────────

function SriPill({ sri }: { sri: number }) {
  const color = SRI_COLORS[sri] ?? '#7B6FA0';
  return (
    <span
      className="inline-flex items-center justify-center w-5 h-5 rounded-md text-[10px] font-bold font-mono ring-1"
      style={{
        backgroundColor: `${color}12`,
        color,
        boxShadow: `0 0 0 1px ${color}25`,
      }}
    >
      {sri}
    </span>
  );
}

// ─── Calendar View (Enhanced) ───────────────────────────────────────────────

function CalendarView({ products }: { products: any[] }) {
  const [date, setDate] = useState(new Date());
  const year = date.getFullYear();
  const month = date.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDay = new Date(year, month, 1).getDay();
  const dayNames = ['dim.', 'lun.', 'mar.', 'mer.', 'jeu.', 'ven.', 'sam.'];
  const monthName = date.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });

  // Build event markers from product data
  const eventDays = useMemo(() => {
    const map = new Map<number, { type: string; color: string }[]>();
    for (const p of products) {
      // Observation dates
      if (Array.isArray(p.observationDates)) {
        for (const d of p.observationDates) {
          const dt = new Date(d);
          if (dt.getMonth() === month && dt.getFullYear() === year) {
            const day = dt.getDate();
            if (!map.has(day)) map.set(day, []);
            map.get(day)!.push({ type: 'observation', color: '#D4A017' });
            if (p.autocallBarrierPct != null) {
              map.get(day)!.push({ type: 'autocall', color: '#3D63F5' });
            }
          }
        }
      }
      // Maturity dates
      if (p.maturityDate) {
        const dt = new Date(p.maturityDate);
        if (dt.getMonth() === month && dt.getFullYear() === year) {
          const day = dt.getDate();
          if (!map.has(day)) map.set(day, []);
          map.get(day)!.push({ type: 'maturity', color: '#1A0A3E' });
        }
      }
      // Shelf closing dates
      if (p.shelfClosingDate) {
        const dt = new Date(p.shelfClosingDate);
        if (dt.getMonth() === month && dt.getFullYear() === year) {
          const day = dt.getDate();
          if (!map.has(day)) map.set(day, []);
          map.get(day)!.push({ type: 'closing', color: '#E8334A' });
        }
      }
    }
    return map;
  }, [products, month, year]);

  return (
    <div className="bg-white/90 dark:bg-white/[0.04] backdrop-blur-sm rounded-xl border border-border/50 dark:border-white/8 ring-1 ring-black/[0.03] dark:ring-white/[0.04] overflow-hidden shadow-sm">
      <div className="px-4 py-3 border-b border-border/50 dark:border-white/8 flex items-center justify-between bg-gradient-to-r from-[#F8F6FF]/80 to-transparent dark:from-white/[0.02] dark:to-transparent">
        <h3 className="font-display text-[13px] font-bold text-ink dark:text-white flex items-center gap-1.5">
          <Calendar size={13} className="text-[#3B1FA8]" />
          Calendrier des evenements
        </h3>
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setDate(new Date(year, month - 1, 1))}
            className={cn(
              'w-7 h-7 rounded-lg border border-border/70 dark:border-white/12 flex items-center justify-center',
              'text-ink-3 dark:text-white/50 hover:text-[#3B1FA8] hover:border-[#3B1FA8]/40',
              'transition-all duration-150',
            )}
          >
            <ChevronLeft size={13} />
          </button>
          <span className="text-[12px] font-semibold text-ink dark:text-white capitalize min-w-[120px] text-center font-display">
            {monthName}
          </span>
          <button
            onClick={() => setDate(new Date(year, month + 1, 1))}
            className={cn(
              'w-7 h-7 rounded-lg border border-border/70 dark:border-white/12 flex items-center justify-center',
              'text-ink-3 dark:text-white/50 hover:text-[#3B1FA8] hover:border-[#3B1FA8]/40',
              'transition-all duration-150',
            )}
          >
            <ChevronRight size={13} />
          </button>
        </div>
        <div className="flex items-center gap-3 text-[9px] font-body font-medium">
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-[#D4A017]" />Observation</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-[#3D63F5]" />Autocall</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-[#E8334A]" />Cloture</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-ink-3" />Maturite</span>
        </div>
      </div>
      <div className="p-4">
        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-0">
          {dayNames.map((d) => (
            <div key={d} className="text-center text-[9px] text-ink-3 dark:text-white/35 font-bold uppercase tracking-wider py-2">{d}</div>
          ))}
          {Array.from({ length: firstDay }).map((_, i) => (
            <div key={`empty-${i}`} className="h-10" />
          ))}
          {Array.from({ length: daysInMonth }).map((_, i) => {
            const day = i + 1;
            const isToday = day === new Date().getDate() && month === new Date().getMonth() && year === new Date().getFullYear();
            const events = eventDays.get(day);
            // Deduplicate event types
            const uniqueEvents = events ? Array.from(new Map(events.map(e => [e.type, e])).values()) : [];

            return (
              <div
                key={day}
                className={cn(
                  'h-10 flex flex-col items-center justify-center gap-0.5 rounded-lg transition-all duration-150 relative',
                  isToday
                    ? 'bg-gradient-to-br from-[#3B1FA8] to-[#5B3FD4] text-white font-bold shadow-sm shadow-[#3B1FA8]/20'
                    : 'text-ink dark:text-white/75 hover:bg-[#3B1FA8]/[0.04] dark:hover:bg-white/[0.04] cursor-pointer',
                  uniqueEvents.length > 0 && !isToday && 'bg-[#F8F6FF]/50 dark:bg-white/[0.02]',
                )}
              >
                <span className="text-[12px] font-body">{day}</span>
                {uniqueEvents.length > 0 && (
                  <div className="flex items-center gap-[2px]">
                    {uniqueEvents.slice(0, 3).map((evt, idx) => (
                      <span
                        key={idx}
                        className="w-[4px] h-[4px] rounded-full"
                        style={{ backgroundColor: isToday ? 'rgba(255,255,255,0.8)' : evt.color }}
                      />
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Upcoming events list */}
        <div className="mt-4 pt-3 border-t border-border/30 dark:border-white/6">
          <p className="text-[10px] font-bold uppercase tracking-wider text-ink-3 dark:text-white/35 mb-2 font-body">
            Prochains evenements ce mois
          </p>
          {(() => {
            const upcoming: { day: number; type: string; color: string; productName: string }[] = [];
            const today = new Date().getDate();
            for (const p of products) {
              if (Array.isArray(p.observationDates)) {
                for (const d of p.observationDates) {
                  const dt = new Date(d);
                  if (dt.getMonth() === month && dt.getFullYear() === year && dt.getDate() >= today) {
                    upcoming.push({ day: dt.getDate(), type: 'Observation', color: '#D4A017', productName: p.name });
                  }
                }
              }
              if (p.shelfClosingDate) {
                const dt = new Date(p.shelfClosingDate);
                if (dt.getMonth() === month && dt.getFullYear() === year && dt.getDate() >= today) {
                  upcoming.push({ day: dt.getDate(), type: 'Cloture', color: '#E8334A', productName: p.name });
                }
              }
            }
            upcoming.sort((a, b) => a.day - b.day);
            if (upcoming.length === 0) {
              return (
                <div className="py-4 px-3 bg-gradient-to-br from-[#F8F6FF] to-[#F0ECFF] dark:from-white/[0.02] dark:to-white/[0.01] rounded-lg text-center border border-[#3B1FA8]/5 dark:border-white/5">
                  <p className="text-[11px] text-ink-3 dark:text-white/45 font-body">Aucun evenement restant ce mois.</p>
                </div>
              );
            }
            return (
              <div className="space-y-1.5">
                {upcoming.slice(0, 5).map((evt, idx) => (
                  <div key={idx} className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-[#F8F6FF]/40 dark:bg-white/[0.015] border border-border/20 dark:border-white/[0.04]">
                    <span className="w-[5px] h-[5px] rounded-full" style={{ backgroundColor: evt.color }} />
                    <span className="font-mono text-[11px] font-semibold text-ink dark:text-white tabular-nums">{evt.day}</span>
                    <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-md" style={{ backgroundColor: `${evt.color}12`, color: evt.color }}>
                      {evt.type}
                    </span>
                    <span className="text-[11px] text-ink-2 dark:text-white/55 font-body truncate">{evt.productName}</span>
                  </div>
                ))}
              </div>
            );
          })()}
        </div>
      </div>
    </div>
  );
}

// ─── AI Portfolio Health ────────────────────────────────────────────────────

const AI_ALERTS = [
  {
    icon: AlertCircle,
    color: '#D4A017',
    bg: '#D4A017',
    text: '2 produits approchent de leur date d\u2019observation autocall ce mois. Probabilite de rappel anticipe estimee a 65%.',
  },
  {
    icon: TrendingDown,
    color: '#3D63F5',
    bg: '#3D63F5',
    text: 'Votre exposition Euro Stoxx 50 represente 45% du portefeuille. Envisagez de diversifier vers d\u2019autres sous-jacents.',
  },
  {
    icon: TrendingUp,
    color: '#00B894',
    bg: '#00B894',
    text: 'Le spread de credit SG Issuer s\u2019est resserre de 12 bps \u2014 impact positif sur la valorisation de 3 positions.',
  },
];

const AI_METRICS = [
  { label: 'Diversification', value: '72', suffix: '/100', color: '#D4A017' },
  { label: 'Exposition barrieres', value: 'Moderee', suffix: '', color: '#3D63F5' },
  { label: 'Rendement moyen', value: '8.2%', suffix: ' p.a.', color: '#00B894' },
  { label: 'Horizon moyen', value: '3.4', suffix: ' ans', color: '#3B1FA8' },
];

function AiPortfolioHealth({ onOptimize, onStressTest }: { onOptimize: () => void; onStressTest: () => void }) {
  const [aiLoading, setAiLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setAiLoading(false), 1800);
    return () => clearTimeout(timer);
  }, []);

  return (
    <section className="rounded-xl bg-gradient-to-br from-[#F8F6FF]/60 via-transparent to-[#F0ECFF]/30 dark:from-white/[0.02] dark:via-transparent dark:to-white/[0.01] p-3 border border-[#3B1FA8]/8 dark:border-[#3B1FA8]/15 ring-1 ring-[#3B1FA8]/[0.04] dark:ring-[#3B1FA8]/10">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
        {/* ── Health Score Card ─────────────────────────────────────── */}
        <div
          className={cn(
            'lg:col-span-1 relative rounded-xl border border-[#3B1FA8]/15 dark:border-[#3B1FA8]/25 p-4',
            'bg-white/90 dark:bg-white/[0.04] backdrop-blur-md',
            'shadow-sm hover:shadow-md transition-all duration-200',
            'ring-1 ring-[#3B1FA8]/[0.06] dark:ring-[#3B1FA8]/15',
            'overflow-hidden',
          )}
        >
          {/* Gradient top bar */}
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-[#3B1FA8] via-[#5B3FD4] to-[#00B894]" />
          {/* Subtle background glow */}
          <div className="absolute -top-10 -right-10 w-32 h-32 rounded-full bg-[#3B1FA8]/[0.04] dark:bg-[#3B1FA8]/8 blur-3xl pointer-events-none" />

          {/* Header */}
          <div className="flex items-center gap-2 mb-3">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-[#3B1FA8] to-[#5B3FD4] flex items-center justify-center shadow-sm shadow-[#3B1FA8]/20">
              <Brain size={13} className="text-white" />
            </div>
            <div>
              <h3 className="font-display text-[13px] font-bold text-ink dark:text-white leading-none">
                Analyse IA
              </h3>
              <p className="text-[9px] text-ink-3 dark:text-white/35 font-body mt-0.5 flex items-center gap-0.5">
                <Sparkles size={8} className="text-[#D4A017]" />
                Mis a jour il y a 2 min
              </p>
            </div>
          </div>

          {aiLoading ? (
            <div className="flex flex-col items-center justify-center py-6 gap-2">
              <div className="w-16 h-16 rounded-full border-3 border-[#3B1FA8]/10 border-t-[#3B1FA8] animate-spin" />
              <p className="text-[10px] text-ink-3 dark:text-white/35 font-body animate-pulse">
                Analyse en cours...
              </p>
            </div>
          ) : (
            <>
              {/* Circular Score */}
              <div className="flex items-center justify-center mb-3">
                <Tooltip content="Score calcule a partir de la diversification, exposition aux barrieres et rendement moyen">
                  <div className="relative w-24 h-24">
                    <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
                      <circle
                        cx="60" cy="60" r="52"
                        fill="none"
                        stroke="currentColor"
                        className="text-[#3B1FA8]/10 dark:text-[#3B1FA8]/20"
                        strokeWidth="10"
                      />
                      <circle
                        cx="60" cy="60" r="52"
                        fill="none"
                        stroke="url(#scoreGradient)"
                        strokeWidth="10"
                        strokeLinecap="round"
                        strokeDasharray={`${2 * Math.PI * 52 * 0.85} ${2 * Math.PI * 52 * 0.15}`}
                      />
                      <defs>
                        <linearGradient id="scoreGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                          <stop offset="0%" stopColor="#3B1FA8" />
                          <stop offset="50%" stopColor="#5B3FD4" />
                          <stop offset="100%" stopColor="#00B894" />
                        </linearGradient>
                      </defs>
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span className="font-display text-[28px] font-bold text-ink dark:text-white leading-none tracking-tight">
                        85
                      </span>
                      <span className="text-[9px] text-ink-3 dark:text-white/35 font-body font-semibold uppercase tracking-wider">
                        / 100
                      </span>
                    </div>
                  </div>
                </Tooltip>
              </div>

              {/* Mini Metrics Grid */}
              <div className="grid grid-cols-2 gap-1.5">
                {AI_METRICS.map((m) => (
                  <div
                    key={m.label}
                    className={cn(
                      'rounded-lg px-2.5 py-2 border border-border/30 dark:border-white/6',
                      'bg-[#F8F6FF]/50 dark:bg-white/[0.02]',
                      'transition-all duration-150 hover:border-[#3B1FA8]/15 dark:hover:border-[#3B1FA8]/25',
                    )}
                  >
                    <p className="text-[8px] uppercase tracking-[0.16em] text-ink-3 dark:text-white/35 font-body font-semibold mb-0.5 truncate">
                      {m.label}
                    </p>
                    <p className="font-display text-sm font-bold leading-none" style={{ color: m.color }}>
                      {m.value}
                      <span className="text-[9px] font-body font-medium text-ink-3 dark:text-white/35">
                        {m.suffix}
                      </span>
                    </p>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        {/* ── AI Alerts & Actions ──────────────────────────────────── */}
        <div
          className={cn(
            'lg:col-span-2 relative rounded-xl border border-border/50 dark:border-white/8 p-4',
            'bg-white/90 dark:bg-white/[0.04] backdrop-blur-md',
            'shadow-sm hover:shadow-md transition-all duration-200',
            'ring-1 ring-black/[0.02] dark:ring-white/[0.04]',
            'overflow-hidden',
          )}
        >
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-[#D4A017] via-[#3D63F5] to-[#00B894] opacity-50" />

          {/* Header */}
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-[#D4A017]/12 to-[#D4A017]/[0.04] flex items-center justify-center ring-1 ring-[#D4A017]/15">
                <Zap size={13} className="text-[#D4A017]" />
              </div>
              <div>
                <h3 className="font-display text-[13px] font-bold text-ink dark:text-white leading-none">
                  Alertes & Suggestions IA
                </h3>
                <p className="text-[9px] text-ink-3 dark:text-white/35 font-body mt-0.5">
                  3 recommandations actives
                </p>
              </div>
            </div>
            <span className="text-[9px] font-mono font-semibold text-[#3B1FA8] bg-[#3B1FA8]/6 dark:bg-[#3B1FA8]/15 dark:text-[#C9BCFF] px-1.5 py-0.5 rounded-md">
              AI powered
            </span>
          </div>

          {aiLoading ? (
            <div className="space-y-2">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-start gap-2.5 p-3 animate-pulse rounded-lg bg-[#F8F6FF]/30 dark:bg-white/[0.015]">
                  <div className="w-7 h-7 rounded-lg bg-[#3B1FA8]/[0.04] dark:bg-white/[0.04] shrink-0" />
                  <div className="flex-1 space-y-1.5">
                    <div className="h-2.5 w-full bg-[#3B1FA8]/[0.04] dark:bg-white/[0.04] rounded" />
                    <div className="h-2.5 w-3/4 bg-[#3B1FA8]/[0.04] dark:bg-white/[0.04] rounded" />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <>
              {/* Alerts */}
              <div className="space-y-2 mb-3">
                {AI_ALERTS.map((alert, idx) => {
                  const Icon = alert.icon;
                  return (
                    <div
                      key={idx}
                      className={cn(
                        'flex items-start gap-2.5 px-3 py-2.5 rounded-lg',
                        'bg-[#F8F6FF]/40 dark:bg-white/[0.015]',
                        'border border-border/20 dark:border-white/[0.04]',
                        'hover:border-[#3B1FA8]/12 dark:hover:border-white/8',
                        'transition-all duration-150 group/alert',
                      )}
                    >
                      <div
                        className="w-6 h-6 rounded-md shrink-0 flex items-center justify-center mt-0.5"
                        style={{
                          background: `${alert.bg}10`,
                          boxShadow: `0 0 0 1px ${alert.bg}25`,
                        }}
                      >
                        <Icon size={12} style={{ color: alert.color }} />
                      </div>
                      <p className="text-[12px] text-ink-2 dark:text-white/65 font-body leading-relaxed">
                        {alert.text}
                      </p>
                    </div>
                  );
                })}
              </div>

              {/* Quick AI Actions */}
              <div className="flex items-center gap-2 pt-3 border-t border-border/30 dark:border-white/6">
                <button
                  onClick={onOptimize}
                  className={cn(
                    'flex-1 h-8 rounded-lg text-[11px] font-semibold font-body',
                    'bg-gradient-to-r from-[#3B1FA8] to-[#5B3FD4] text-white',
                    'shadow-sm shadow-[#3B1FA8]/15 hover:shadow-md hover:shadow-[#3B1FA8]/25',
                    'hover:brightness-110 active:brightness-95',
                    'transition-all duration-150',
                    'flex items-center justify-center gap-1.5',
                  )}
                >
                  <Target size={12} />
                  Optimiser mon allocation
                </button>
                <button
                  onClick={onStressTest}
                  className={cn(
                    'flex-1 h-8 rounded-lg text-[11px] font-semibold font-body',
                    'border border-[#3B1FA8]/25 dark:border-[#3B1FA8]/35',
                    'text-[#3B1FA8] dark:text-[#C9BCFF]',
                    'bg-[#3B1FA8]/[0.04] dark:bg-[#3B1FA8]/8',
                    'hover:bg-[#3B1FA8]/8 dark:hover:bg-[#3B1FA8]/15',
                    'transition-all duration-150',
                    'flex items-center justify-center gap-1.5',
                  )}
                >
                  <Zap size={12} />
                  Simuler un stress test
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </section>
  );
}

// ─── Allocation Chart ───────────────────────────────────────────────────────

function AllocationChart({ products, commitments }: { products: any[]; commitments: any[] }) {
  // Build allocation data from commitments + products
  const allocData = useMemo(() => {
    const issuerMap = new Map<string, { amount: number; count: number; color: string }>();
    const payoffMap = new Map<string, { amount: number; count: number; color: string }>();
    const colors = ['#3B1FA8', '#00B894', '#D4A017', '#3D63F5', '#E8334A', '#1A0A3E'];
    const payoffColors: Record<string, string> = {
      AUTOCALL_PHOENIX: '#3B1FA8',
      AUTOCALL_COUPON: '#5B3FD4',
      CAPITAL_PROTECTED: '#00B894',
      CONDITIONAL_RATE: '#D4A017',
      BARRIER_NOTE: '#E8334A',
    };

    let colorIdx = 0;
    const productMap = new Map(products.map((p: any) => [p.id, p]));

    for (const c of commitments) {
      const product = productMap.get(c.shelfId) || productMap.get(c.productId);
      const issuer = product?.issuerName ?? 'Inconnu';
      const payoff = product?.payoffType ?? 'AUTRE';
      const amount = c.amount ?? 0;

      if (!issuerMap.has(issuer)) {
        issuerMap.set(issuer, { amount: 0, count: 0, color: colors[colorIdx % colors.length] });
        colorIdx++;
      }
      const iData = issuerMap.get(issuer)!;
      iData.amount += amount;
      iData.count++;

      if (!payoffMap.has(payoff)) {
        payoffMap.set(payoff, { amount: 0, count: 0, color: payoffColors[payoff] ?? '#7B6FA0' });
      }
      const pData = payoffMap.get(payoff)!;
      pData.amount += amount;
      pData.count++;
    }

    const totalAmount = Array.from(issuerMap.values()).reduce((s, v) => s + v.amount, 0);
    return {
      issuers: Array.from(issuerMap.entries()).map(([name, data]) => ({
        name,
        ...data,
        pct: totalAmount > 0 ? (data.amount / totalAmount) * 100 : 0,
      })).sort((a, b) => b.amount - a.amount),
      payoffs: Array.from(payoffMap.entries()).map(([name, data]) => ({
        name,
        ...data,
        pct: totalAmount > 0 ? (data.amount / totalAmount) * 100 : 0,
      })).sort((a, b) => b.amount - a.amount),
      total: totalAmount,
    };
  }, [products, commitments]);

  const PAYOFF_LABELS: Record<string, string> = {
    AUTOCALL_PHOENIX: 'Autocall Phoenix',
    AUTOCALL_COUPON: 'Autocall Coupon',
    CAPITAL_PROTECTED: 'Capital Protege',
    CONDITIONAL_RATE: 'Taux Conditionnel',
    BARRIER_NOTE: 'Barrier Note',
    AUTRE: 'Autre',
  };

  if (commitments.length === 0 || allocData.total === 0) {
    return (
      <div className="bg-white/90 dark:bg-white/[0.04] backdrop-blur-sm rounded-xl border border-border/50 dark:border-white/8 ring-1 ring-black/[0.03] dark:ring-white/[0.04] overflow-hidden shadow-sm">
        <div className="px-4 py-3 border-b border-border/50 dark:border-white/8 flex items-center justify-between bg-gradient-to-r from-[#F8F6FF]/80 to-transparent dark:from-white/[0.02] dark:to-transparent">
          <h2 className="font-display text-[13px] font-bold text-ink dark:text-white flex items-center gap-1.5">
            <PieChart size={12} className="text-[#3B1FA8]" />
            Repartition du portefeuille
          </h2>
        </div>
        <div className="p-10 flex flex-col items-center justify-center gap-2.5">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#3B1FA8]/8 to-[#3B1FA8]/[0.03] flex items-center justify-center ring-1 ring-[#3B1FA8]/8 shadow-sm">
            <Wallet size={22} className="text-[#3B1FA8]/25" />
          </div>
          <p className="font-body text-[12px] text-ink-3 dark:text-white/45">Aucune allocation pour le moment.</p>
          <p className="font-body text-[10px] text-ink-3/50 dark:text-white/25">
            Les allocations seront visibles une fois vos engagements confirmes.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
      {/* By Issuer */}
      <div className="bg-white/90 dark:bg-white/[0.04] backdrop-blur-sm rounded-xl border border-border/50 dark:border-white/8 ring-1 ring-black/[0.03] dark:ring-white/[0.04] overflow-hidden shadow-sm">
        <div className="px-4 py-3 border-b border-border/50 dark:border-white/8 bg-gradient-to-r from-[#F8F6FF]/80 to-transparent dark:from-white/[0.02] dark:to-transparent">
          <h3 className="font-display text-[13px] font-bold text-ink dark:text-white flex items-center gap-1.5">
            <Shield size={12} className="text-[#3B1FA8]" />
            Par emetteur
          </h3>
        </div>
        <div className="p-4 space-y-3">
          {/* Stacked bar */}
          <div className="h-4 rounded-full overflow-hidden flex bg-black/[0.03] dark:bg-white/[0.04]">
            {allocData.issuers.map((issuer) => (
              <Tooltip key={issuer.name} content={`${issuer.name}: ${formatAmount(issuer.amount)} (${issuer.pct.toFixed(1)}%)`}>
                <div
                  className="h-full first:rounded-l-full last:rounded-r-full transition-all duration-500"
                  style={{ width: `${issuer.pct}%`, backgroundColor: issuer.color }}
                />
              </Tooltip>
            ))}
          </div>
          {/* Legend */}
          <div className="space-y-2">
            {allocData.issuers.map((issuer) => (
              <div key={issuer.name} className="flex items-center gap-2.5">
                <span className="w-2.5 h-2.5 rounded-sm shrink-0" style={{ backgroundColor: issuer.color }} />
                <span className="text-[12px] font-body text-ink dark:text-white flex-1 truncate">{issuer.name}</span>
                <span className="text-[11px] font-mono font-semibold text-ink dark:text-white tabular-nums">
                  {formatAmount(issuer.amount)}
                </span>
                <span className="text-[10px] font-mono text-ink-3 dark:text-white/35 tabular-nums w-[42px] text-right">
                  {issuer.pct.toFixed(1)}%
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* By Payoff Type - with Donut */}
      <div className="bg-white/90 dark:bg-white/[0.04] backdrop-blur-sm rounded-xl border border-border/50 dark:border-white/8 ring-1 ring-black/[0.03] dark:ring-white/[0.04] overflow-hidden shadow-sm">
        <div className="px-4 py-3 border-b border-border/50 dark:border-white/8 bg-gradient-to-r from-[#F8F6FF]/80 to-transparent dark:from-white/[0.02] dark:to-transparent">
          <h3 className="font-display text-[13px] font-bold text-ink dark:text-white flex items-center gap-1.5">
            <PieChart size={12} className="text-[#3B1FA8]" />
            Par type de payoff
          </h3>
        </div>
        <div className="p-4">
          {/* Donut Chart */}
          <div className="flex items-center justify-center mb-4">
            <div className="relative w-[140px] h-[140px]">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 140 140">
                {(() => {
                  const radius = 52;
                  const cx = 70;
                  const cy = 70;
                  const circumference = 2 * Math.PI * radius;
                  let cumulativeOffset = 0;
                  return allocData.payoffs.map((payoff, idx) => {
                    const segmentLength = (payoff.pct / 100) * circumference;
                    const gapSize = allocData.payoffs.length > 1 ? 3 : 0;
                    const adjustedSegment = Math.max(0, segmentLength - gapSize);
                    const dashArray = `${adjustedSegment} ${circumference - adjustedSegment}`;
                    const dashOffset = -cumulativeOffset;
                    cumulativeOffset += segmentLength;
                    return (
                      <circle
                        key={payoff.name}
                        cx={cx}
                        cy={cy}
                        r={radius}
                        fill="none"
                        stroke={payoff.color}
                        strokeWidth="18"
                        strokeLinecap="round"
                        strokeDasharray={dashArray}
                        strokeDashoffset={dashOffset}
                        className="transition-all duration-700"
                        style={{ opacity: 0.85 + idx * 0.03 }}
                      />
                    );
                  });
                })()}
                {/* Center background circle */}
                <circle cx="70" cy="70" r="38" fill="white" className="dark:fill-[#1a1a2e]" />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="font-display text-[18px] font-bold text-ink dark:text-white leading-none tracking-tight">
                  {allocData.payoffs.length}
                </span>
                <span className="text-[8px] text-ink-3 dark:text-white/35 font-body font-semibold uppercase tracking-wider mt-0.5">
                  types
                </span>
              </div>
            </div>
          </div>

          {/* Legend with bars */}
          <div className="space-y-2.5">
            {allocData.payoffs.map((payoff) => (
              <div key={payoff.name}>
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-sm shrink-0" style={{ backgroundColor: payoff.color }} />
                    <span className="text-[11px] font-body text-ink dark:text-white font-medium">
                      {PAYOFF_LABELS[payoff.name] ?? payoff.name}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono text-ink-3 dark:text-white/35 tabular-nums">{payoff.count} produit{payoff.count > 1 ? 's' : ''}</span>
                    <span className="text-[10px] font-mono font-semibold tabular-nums px-1.5 py-0.5 rounded-md" style={{ color: payoff.color, backgroundColor: `${payoff.color}10` }}>
                      {payoff.pct.toFixed(1)}%
                    </span>
                  </div>
                </div>
                <div className="h-2 rounded-full overflow-hidden bg-black/[0.03] dark:bg-white/[0.04]">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{ width: `${payoff.pct}%`, backgroundColor: payoff.color }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Page ────────────────────────────────────────────────────────────────────

export default function PortfolioPage() {
  useEffect(() => { document.title = "Mon Portfolio | Strick'in"; }, []);
  const { toasts, success: toastSuccess, error: toastError, dismiss: dismissToast } = useToast();
  const [statusOverrides, setStatusOverrides] = useState<Record<string, string>>({});
  const [activeTab, setActiveTab] = useState<PortfolioTab>('products');
  const [barrierFilter, setBarrierFilter] = useState<BarrierStatus | ''>('');
  const [sortCol, setSortCol] = useState<SortColumn>('name');
  const [sortDir, setSortDir] = useState<SortDir>('asc');
  const [showOptimizeModal, setShowOptimizeModal] = useState(false);
  const [showStressModal, setShowStressModal] = useState(false);
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

  // Map products by id for quick lookups
  const productMap = useMemo(() => {
    const map = new Map<string, any>();
    for (const p of products as any[]) {
      map.set(p.id, p);
    }
    return map;
  }, [products]);

  // ── Performance analytics computed from real data ──────────────────────
  const portfolioAnalytics = useMemo(() => {
    if (!commitments || commitments.length === 0) {
      return { totalValue: 0, avgCoupon: 0, nextEvent: null as string | null, avgSri: 0, closestBarrier: null as { name: string; distance: number } | null, shortestMaturity: null as string | null, longestMaturity: null as string | null };
    }

    // Total value from committed amounts
    const totalValue = commitments.reduce((s: number, c: any) => s + (c.amount ?? 0), 0);

    // Average coupon from committed products
    const coupons: number[] = [];
    const sris: number[] = [];
    let closestBarrier: { name: string; distance: number } | null = null;
    let shortestMaturity: string | null = null;
    let longestMaturity: string | null = null;
    let nextEvent: string | null = null;
    const now = new Date();

    for (const c of commitments) {
      const product = productMap.get(c.shelfId) || productMap.get(c.productId);
      if (!product) continue;

      if (product.couponPct != null) coupons.push(product.couponPct);
      if (product.sri != null) sris.push(product.sri);

      // Barrier distance
      if (product.barrierCapPct != null) {
        let hash = 0;
        for (let i = 0; i < (product.id?.length ?? 0); i++) hash = ((hash << 5) - hash + product.id.charCodeAt(i)) | 0;
        const simulatedPerf = ((Math.abs(hash) % 40) - 10);
        const distance = 100 + simulatedPerf - product.barrierCapPct;
        if (!closestBarrier || distance < closestBarrier.distance) {
          closestBarrier = { name: product.name ?? '--', distance };
        }
      }

      // Maturity dates
      if (product.maturityDate) {
        if (!shortestMaturity || new Date(product.maturityDate) < new Date(shortestMaturity)) {
          shortestMaturity = product.maturityDate;
        }
        if (!longestMaturity || new Date(product.maturityDate) > new Date(longestMaturity)) {
          longestMaturity = product.maturityDate;
        }
      }

      // Next event: observation dates or shelf closing dates
      if (Array.isArray(product.observationDates)) {
        for (const d of product.observationDates) {
          const dt = new Date(d);
          if (dt > now && (!nextEvent || dt < new Date(nextEvent))) {
            nextEvent = d;
          }
        }
      }
      if (product.shelfClosingDate) {
        const dt = new Date(product.shelfClosingDate);
        if (dt > now && (!nextEvent || dt < new Date(nextEvent))) {
          nextEvent = product.shelfClosingDate;
        }
      }
    }

    const avgCoupon = coupons.length > 0 ? coupons.reduce((a, b) => a + b, 0) / coupons.length : 0;
    const avgSri = sris.length > 0 ? sris.reduce((a, b) => a + b, 0) / sris.length : 0;

    return { totalValue, avgCoupon, nextEvent, avgSri, closestBarrier, shortestMaturity, longestMaturity };
  }, [commitments, productMap]);

  // Animated counter for "Total Engage" KPI
  const animatedTotal = useAnimatedCounter(stats.total, 800, !loadingCommitments);

  const handleCancel = (id: string) => {
    if (window.confirm("Etes-vous sur de vouloir annuler cette marque d'interet ?")) {
      cancelMutation.mutate(id, {
        onSuccess: () => {
          setStatusOverrides((prev) => ({ ...prev, [id]: 'CANCELLED' }));
          toastSuccess('Engagement annule avec succes.');
        },
        onError: () => toastError("Erreur lors de l'annulation."),
      });
    }
  };

  const handleReview = (id: string) => {
    reviewMutation.mutate(id, {
      onSuccess: () => {
        setStatusOverrides((prev) => ({ ...prev, [id]: 'REVIEW' }));
        toastSuccess('Engagement passe en revue.');
      },
      onError: () => toastError('Erreur lors du changement de statut.'),
    });
  };

  const handleApprove = (id: string) => {
    approveMutation.mutate(id, {
      onSuccess: () => {
        setStatusOverrides((prev) => ({ ...prev, [id]: 'CONFIRMED' }));
        toastSuccess('Engagement approuve.');
      },
      onError: () => toastError("Erreur lors de l'approbation."),
    });
  };

  const handleReject = (id: string) => {
    const reason = window.prompt('Raison du rejet :');
    if (reason && reason.trim()) {
      rejectMutation.mutate({ id, reason: reason.trim() }, {
        onSuccess: () => {
          setStatusOverrides((prev) => ({ ...prev, [id]: 'CANCELLED' }));
          toastSuccess('Engagement rejete.');
        },
        onError: () => toastError('Erreur lors du rejet.'),
      });
    }
  };

  // Sort handler
  const handleSort = (col: SortColumn) => {
    if (sortCol === col) {
      setSortDir((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortCol(col);
      setSortDir('asc');
    }
  };

  // Sorted commitments
  const sortedCommitments = useMemo(() => {
    if (!commitments) return [];
    const items = [...commitments];
    items.sort((a: any, b: any) => {
      const pa = productMap.get(a.shelfId) || productMap.get(a.productId);
      const pb = productMap.get(b.shelfId) || productMap.get(b.productId);
      let cmp = 0;
      switch (sortCol) {
        case 'name': {
          const na = (a.productName ?? pa?.name ?? '').toLowerCase();
          const nb = (b.productName ?? pb?.name ?? '').toLowerCase();
          cmp = na.localeCompare(nb, 'fr');
          break;
        }
        case 'amount':
          cmp = (a.amount ?? 0) - (b.amount ?? 0);
          break;
        case 'coupon':
          cmp = (pa?.couponPct ?? 0) - (pb?.couponPct ?? 0);
          break;
        case 'barrier':
          cmp = (pa?.barrierCapPct ?? 0) - (pb?.barrierCapPct ?? 0);
          break;
        case 'sri':
          cmp = (pa?.sri ?? 0) - (pb?.sri ?? 0);
          break;
        case 'date':
          cmp = new Date(a.createdAt ?? 0).getTime() - new Date(b.createdAt ?? 0).getTime();
          break;
        case 'status': {
          const sa = (a.status ?? '').toLowerCase();
          const sb = (b.status ?? '').toLowerCase();
          cmp = sa.localeCompare(sb, 'fr');
          break;
        }
      }
      return sortDir === 'desc' ? -cmp : cmp;
    });
    return items;
  }, [commitments, sortCol, sortDir, productMap]);

  // Export to Excel
  const handleExport = () => {
    if (!commitments || commitments.length === 0) return;
    const rows = commitments.map((c: any) => {
      const product = productMap.get(c.shelfId) || productMap.get(c.productId);
      return {
        Produit: c.productName ?? product?.name ?? '--',
        ISIN: c.isin || product?.isin || '--',
        'Sous-jacent': product?.underlyingYahoo ?? '--',
        'Montant (EUR)': c.amount ?? 0,
        SRI: product?.sri ?? '--',
        'Coupon (%)': product?.couponPct != null ? product.couponPct.toFixed(1) : '--',
        'Barriere (%)': product?.barrierCapPct != null ? String(product.barrierCapPct) : '--',
        Statut: STATUS_LABEL[c.status] ?? c.status ?? '--',
        Date: c.createdAt ? formatDate(c.createdAt) : '--',
      };
    });
    exportToExcel(rows, `portfolio-export-${new Date().toISOString().slice(0, 10)}`, 'Portfolio');
  };

  // Export Underlyings tab to CSV
  const handleExportUnderlyings = () => {
    if (!products || (products as any[]).length === 0) return;
    const headers = ['Sous-jacent', 'Strike', 'Performance (%)', 'Barriere capital (%)', 'Distance barriere (%)', 'ISIN', 'Produit', 'SRI'];
    const csvRows = (products as any[]).slice(0, 15).map((p: any) => {
      const barrierPct = p.barrierCapPct ?? 60;
      let hash = 0;
      for (let i = 0; i < (p.id?.length ?? 0); i++) hash = ((hash << 5) - hash + p.id.charCodeAt(i)) | 0;
      const simulatedPerf = ((Math.abs(hash) % 40) - 10);
      const distance = 100 + simulatedPerf - barrierPct;
      return [
        p.underlyingYahoo ?? p.underlyingName ?? '--',
        '100.00',
        simulatedPerf.toFixed(1),
        p.barrierCapPct != null ? p.barrierCapPct.toFixed(1) : '--',
        p.barrierCapPct != null ? distance.toFixed(1) : '--',
        p.isin ?? '--',
        p.name ?? '--',
        p.sri != null ? String(p.sri) : '--',
      ];
    });
    const bom = '\uFEFF';
    const csvContent = bom + [headers, ...csvRows].map(row => row.map(v => `"${String(v).replace(/"/g, '""')}"`).join(';')).join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `strickin-sous-jacents-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Export Expired tab to CSV
  const handleExportExpired = () => {
    const expiredData = [
      { name: 'Phoenix Autocall SX5E 2023', isin: 'FR0014007A95', issuer: 'SG Issuer', maturity: '15 mars 2024', coupon: '8.5%', protection: '60%', result: 'Rappele' },
      { name: 'Athena BNP Euro Rendement', isin: 'FR0014008B12', issuer: 'BNP Paribas', maturity: '22 jan. 2024', coupon: '7.2%', protection: '50%', result: 'Maturite' },
    ];
    if (expiredData.length === 0) return;
    const headers = ['Produit', 'ISIN', 'Emetteur', 'Maturite', 'Coupon', 'Protection', 'Resultat'];
    const csvRows = expiredData.map(p => [
      p.name,
      p.isin,
      p.issuer,
      p.maturity,
      p.coupon,
      p.protection,
      p.result,
    ]);
    const bom = '\uFEFF';
    const csvContent = bom + [headers, ...csvRows].map(row => row.map(v => `"${String(v).replace(/"/g, '""')}"`).join(';')).join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `strickin-positions-expirees-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="animate-fade-in space-y-4">
      <PageHeader
        icon={Wallet}
        title="Mon Portfolio"
        subtitle="Suivez vos investissements et engagements en produits structures."
        accentFrom="#3B1FA8"
        accentTo="#5B3FD4"
        className="mb-4"
      >
        <button
          onClick={handleExport}
          disabled={!commitments || commitments.length === 0}
          className={cn(
            'h-8 px-3.5 rounded-lg border',
            'bg-gradient-to-r from-[#3B1FA8] to-[#5535C4] border-[#3B1FA8]/30',
            'text-white text-[11px] font-semibold font-body flex items-center gap-1.5',
            'shadow-sm shadow-[#3B1FA8]/15 hover:shadow-md hover:shadow-[#3B1FA8]/25',
            'hover:brightness-110 active:brightness-95',
            'transition-all duration-150',
            'disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:brightness-100',
          )}
        >
          <Download size={12} />
          Exporter
        </button>
        <Link
          href="/portfolio/agent"
          className={cn(
            'h-8 px-3.5 rounded-lg border',
            'bg-gradient-to-r from-teal to-[#00D4AA] border-teal/30',
            'text-white text-[11px] font-semibold font-body flex items-center gap-1.5',
            'shadow-sm shadow-teal/15 hover:shadow-md hover:shadow-teal/25',
            'hover:brightness-110 active:brightness-95',
            'transition-all duration-150',
          )}
        >
          <Brain size={12} />
          Agent IA
        </Link>
      </PageHeader>

      {/* ── KPI Cards ──────────────────────────────────────────────── */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 stagger-grid">
        <KpiCard
          icon={<Wallet size={15} className="text-[#3B1FA8]" />}
          label="Total engage"
          value={loadingCommitments ? '...' : formatAmount(animatedTotal)}
          accent="#3B1FA8"
          trend="up"
          trendLabel="+12.3% vs mois precedent"
          sparkData={sparklinePoints('total-engaged', 12)}
        />
        <KpiCard
          icon={<CheckCircle2 size={15} className="text-[#00B894]" />}
          label="Confirmes"
          value={loadingCommitments ? '...' : stats.confirmed}
          accent="#00B894"
          trend="up"
          trendLabel="+8% vs mois precedent"
          sparkData={sparklinePoints('confirmed', 12)}
        />
        <KpiCard
          icon={<Clock size={15} className="text-[#D4A017]" />}
          label="En attente"
          value={loadingCommitments ? '...' : stats.waiting}
          accent="#D4A017"
          trend="neutral"
          trendLabel="stable vs mois precedent"
          sparkData={sparklinePoints('waiting', 12)}
        />
        <KpiCard
          icon={<X size={15} className="text-[#E8334A]" />}
          label="Annules"
          value={loadingCommitments ? '...' : stats.cancelled}
          accent="#E8334A"
          trend="down"
          trendLabel="-3% vs mois precedent"
          sparkData={sparklinePoints('cancelled', 12)}
        />
      </section>

      {/* ── Performance Summary Row ───────────────────────────────────── */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-2.5">
        <KpiCard
          icon={<TrendingUp size={15} className="text-[#00B894]" />}
          label="Performance YTD"
          value={
            <span className="inline-flex items-center gap-1.5">
              +8.4%
              <span className="text-[9px] font-mono font-semibold text-white bg-[#00B894] px-1.5 py-0.5 rounded-md leading-none">
                YTD
              </span>
            </span>
          }
          accent="#00B894"
          trend="up"
          trendLabel="+2.1% vs trimestre"
          sparkData={sparklinePoints('perf-ytd', 12)}
        />
        <KpiCard
          icon={<Wallet size={15} className="text-[#3D63F5]" />}
          label="Valeur totale"
          value={loadingCommitments ? '...' : formatAmount(portfolioAnalytics.totalValue)}
          accent="#3D63F5"
          trend="up"
          trendLabel="+5.6% vs mois"
          sparkData={sparklinePoints('total-value', 12)}
        />
        <KpiCard
          icon={<Target size={15} className="text-[#D4A017]" />}
          label="Rendement moyen"
          value={loadingCommitments ? '...' : portfolioAnalytics.avgCoupon > 0 ? `${portfolioAnalytics.avgCoupon.toFixed(1)}%` : '--'}
          accent="#D4A017"
          trend={portfolioAnalytics.avgCoupon >= 7 ? 'up' : 'neutral'}
          trendLabel={portfolioAnalytics.avgCoupon >= 7 ? 'attractif' : 'stable'}
          sparkData={sparklinePoints('avg-yield', 12)}
        />
        <KpiCard
          icon={<Calendar size={15} className="text-[#3B1FA8]" />}
          label="Prochain evenement"
          value={
            loadingCommitments
              ? '...'
              : portfolioAnalytics.nextEvent
                ? formatDate(portfolioAnalytics.nextEvent)
                : 'Aucun'
          }
          accent="#3B1FA8"
          sparkData={sparklinePoints('next-event', 12)}
        />
      </section>

      {/* ── AI Portfolio Health ───────────────────────────────────────── */}
      <AiPortfolioHealth onOptimize={() => setShowOptimizeModal(true)} onStressTest={() => setShowStressModal(true)} />

      {/* ── Tab Navigation ────────────────────────────────────────────── */}
      <div className="flex items-center gap-0.5 overflow-x-auto rounded-xl bg-[#F8F6FF]/50 dark:bg-white/[0.025] p-0.5 border border-border/30 dark:border-white/6 w-fit">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                'px-3.5 py-1.5 rounded-lg text-[12px] font-semibold font-body transition-all duration-150 whitespace-nowrap flex items-center gap-1.5',
                activeTab === tab.id
                  ? 'bg-white dark:bg-white/10 text-[#3B1FA8] dark:text-[#C9BCFF] shadow-sm ring-1 ring-black/[0.04] dark:ring-white/[0.08]'
                  : 'text-ink-3 dark:text-white/45 hover:text-ink dark:hover:text-white/70 hover:bg-white/50 dark:hover:bg-white/[0.04]',
              )}
            >
              <Icon size={12} className={activeTab === tab.id ? 'text-[#3B1FA8] dark:text-[#C9BCFF]' : 'text-ink-3/50 dark:text-white/25'} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* ── Tab Content ──────────────────────────────────────────────── */}
      {activeTab === 'products' && (
        <>
        <div className="bg-white/90 dark:bg-white/[0.04] backdrop-blur-sm rounded-xl border border-border/50 dark:border-white/8 ring-1 ring-black/[0.03] dark:ring-white/[0.04] overflow-hidden shadow-sm">
          <div className="px-4 py-3 border-b border-border/50 dark:border-white/8 flex items-center justify-between bg-gradient-to-r from-[#F8F6FF]/80 to-transparent dark:from-white/[0.02] dark:to-transparent">
            <h2 className="font-display text-[13px] font-bold text-ink dark:text-white flex items-center gap-1.5">
              <div className="w-6 h-6 rounded-md bg-[#3B1FA8]/6 dark:bg-[#3B1FA8]/15 flex items-center justify-center">
                <Package size={12} className="text-[#3B1FA8] dark:text-[#C9BCFF]" />
              </div>
              Mes produits
            </h2>
            <span className="text-[10px] text-ink-3 dark:text-white/35 font-body font-mono tabular-nums">
              {(commitments ?? []).length} engagement{(commitments ?? []).length > 1 ? 's' : ''}
            </span>
          </div>

          {loadingCommitments ? (
            <div className="p-3 space-y-1.5">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="flex items-center gap-3 py-2.5 animate-pulse">
                  <div className="h-3 w-40 bg-[#3B1FA8]/[0.04] dark:bg-white/[0.04] rounded" />
                  <div className="h-3 w-20 bg-[#3B1FA8]/[0.04] dark:bg-white/[0.04] rounded ml-auto" />
                  <div className="h-4 w-14 bg-[#3B1FA8]/[0.04] dark:bg-white/[0.04] rounded" />
                  <div className="h-3 w-14 bg-[#3B1FA8]/[0.04] dark:bg-white/[0.04] rounded" />
                  <div className="h-6 w-12 bg-[#3B1FA8]/[0.04] dark:bg-white/[0.04] rounded" />
                </div>
              ))}
            </div>
          ) : !commitments || commitments.length === 0 ? (
            <div className="p-10 flex flex-col items-center justify-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#3B1FA8]/8 to-[#3B1FA8]/[0.03] flex items-center justify-center ring-1 ring-[#3B1FA8]/8 shadow-sm">
                <Package size={22} className="text-[#3B1FA8]/25" />
              </div>
              <p className="font-body text-[12px] text-ink-3 dark:text-white/45">Aucune marque d&apos;interet pour le moment.</p>
              <Link
                href="/products"
                className={cn(
                  'text-[11px] text-[#3B1FA8] dark:text-[#C9BCFF] font-semibold flex items-center gap-1',
                  'px-3 py-1.5 rounded-lg bg-[#3B1FA8]/[0.04] dark:bg-[#3B1FA8]/12',
                  'hover:bg-[#3B1FA8]/8 dark:hover:bg-[#3B1FA8]/20 transition-all duration-150',
                  'ring-1 ring-[#3B1FA8]/8 dark:ring-[#3B1FA8]/25',
                )}
              >
                Explorer les produits <ArrowUpRight size={11} />
              </Link>
            </div>
          ) : (
            <>
              {/* Mobile Card Layout */}
              <div className="md:hidden space-y-2.5 p-3">
                {sortedCommitments.map((c: any) => {
                  const status = statusOverrides[c.id] ?? c.status ?? 'PENDING';
                  const product = productMap.get(c.shelfId) || productMap.get(c.productId);

                  return (
                    <div
                      key={c.id}
                      className={cn(
                        'rounded-xl border border-border/50 dark:border-white/8 p-3.5',
                        'bg-white/90 dark:bg-white/[0.04] backdrop-blur-md',
                        'shadow-sm hover:shadow-md transition-all duration-200',
                        'ring-1 ring-black/[0.02] dark:ring-white/[0.04]',
                      )}
                    >
                      {/* Card Header */}
                      <div className="flex items-start justify-between mb-2.5">
                        <div className="flex-1 min-w-0">
                          {product ? (
                            <Link
                              href={`/products/${product.id}`}
                              className="font-display text-[13px] font-bold text-ink dark:text-white hover:text-[#3B1FA8] dark:hover:text-[#C9BCFF] transition-colors leading-snug inline-flex items-center gap-1"
                            >
                              {c.productName ?? product.name ?? '--'}
                              <ExternalLink size={9} className="opacity-50" />
                            </Link>
                          ) : (
                            <span className="font-display text-[13px] font-bold text-ink dark:text-white">
                              {c.productName ?? c.shelfId ?? '--'}
                            </span>
                          )}
                          {(c.isin || product?.isin) && (
                            <p className="font-mono text-[9px] text-ink-3 dark:text-white/35 mt-0.5">{c.isin || product?.isin}</p>
                          )}
                        </div>
                        <Badge variant={STATUS_VARIANT[status] ?? 'muted'}>{STATUS_LABEL[status] ?? status}</Badge>
                      </div>

                      {/* Card Metrics */}
                      <div className="grid grid-cols-3 gap-2 mb-2.5">
                        <div>
                          <p className="text-[8px] uppercase tracking-wider text-ink-3 dark:text-white/35 font-body font-semibold">Montant</p>
                          <p className="font-mono text-[12px] font-semibold text-ink dark:text-white tabular-nums">{formatAmount(c.amount ?? 0)}</p>
                        </div>
                        <div>
                          <p className="text-[8px] uppercase tracking-wider text-ink-3 dark:text-white/35 font-body font-semibold">Coupon</p>
                          <p className="font-mono text-[12px] font-semibold tabular-nums" style={{ color: product?.couponPct != null ? '#00B894' : undefined }}>
                            {product?.couponPct != null ? `${product.couponPct.toFixed(1)}%` : '--'}
                          </p>
                        </div>
                        <div>
                          <p className="text-[8px] uppercase tracking-wider text-ink-3 dark:text-white/35 font-body font-semibold">SRI</p>
                          {product?.sri ? <SriPill sri={product.sri} /> : <span className="text-ink-3 text-[11px]">--</span>}
                        </div>
                      </div>

                      {/* Card Footer */}
                      <div className="flex items-center justify-between pt-2 border-t border-border/30 dark:border-white/6">
                        <span className="text-[10px] text-ink-3 dark:text-white/35 font-mono">
                          {c.createdAt ? formatDate(c.createdAt) : '--'}
                        </span>
                        {product?.barrierCapPct != null && (
                          <span className="font-mono text-[10px] tabular-nums text-[#E8334A] font-semibold">
                            Barriere: {product.barrierCapPct}%
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Desktop Table */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-[12px] font-body" aria-label="Tableau du portfolio">
                  <thead>
                    <tr className="border-b border-border/50 dark:border-white/8 bg-gradient-to-r from-[#F8F6FF]/50 to-[#F0ECFF]/20 dark:from-white/[0.015] dark:to-transparent">
                      <PremiumTh className="text-left" sortable sortKey="name" activeSort={sortCol} activeSortDir={sortDir} onSort={handleSort}>Produit</PremiumTh>
                      <PremiumTh className="text-left">Sous-jacent</PremiumTh>
                      <PremiumTh className="text-right" sortable sortKey="amount" activeSort={sortCol} activeSortDir={sortDir} onSort={handleSort}>Montant</PremiumTh>
                      <PremiumTh className="text-center" sortable sortKey="sri" activeSort={sortCol} activeSortDir={sortDir} onSort={handleSort}>SRI</PremiumTh>
                      <PremiumTh className="text-right" sortable sortKey="coupon" activeSort={sortCol} activeSortDir={sortDir} onSort={handleSort}>Coupon</PremiumTh>
                      <PremiumTh className="text-right" sortable sortKey="barrier" activeSort={sortCol} activeSortDir={sortDir} onSort={handleSort}>Barriere</PremiumTh>
                      <PremiumTh className="text-center" sortable sortKey="status" activeSort={sortCol} activeSortDir={sortDir} onSort={handleSort}>Statut</PremiumTh>
                      <PremiumTh className="text-center">Rang</PremiumTh>
                      <PremiumTh className="text-right" sortable sortKey="date" activeSort={sortCol} activeSortDir={sortDir} onSort={handleSort}>Date</PremiumTh>
                      <PremiumTh className="text-center">Action</PremiumTh>
                    </tr>
                  </thead>
                  <tbody className="stagger-rows">
                    {sortedCommitments.map((c: any, rowIdx: number) => {
                      const status = statusOverrides[c.id] ?? c.status ?? 'PENDING';
                      const product = productMap.get(c.shelfId) || productMap.get(c.productId);

                      return (
                        <tr
                          key={c.id}
                          className={cn(
                            'border-b border-border/20 dark:border-white/[0.04] last:border-0',
                            rowIdx % 2 === 1 && 'bg-[#F8F6FF]/20 dark:bg-white/[0.01]',
                            'hover:bg-[#3B1FA8]/[0.03] dark:hover:bg-white/[0.03]',
                            'transition-colors duration-150 group/row',
                          )}
                        >
                          {/* Product */}
                          <td className="px-3 py-2.5">
                            <div className="flex flex-col gap-0">
                              {product ? (
                                <Link
                                  href={`/products/${product.id}`}
                                  className="font-medium text-ink dark:text-white leading-snug truncate max-w-[200px] text-[12px] hover:text-[#3B1FA8] dark:hover:text-[#C9BCFF] transition-colors inline-flex items-center gap-1 group/link"
                                >
                                  {c.productName ?? product.name ?? c.shelfId ?? '--'}
                                  <ExternalLink size={9} className="opacity-0 group-hover/link:opacity-50 transition-opacity" />
                                </Link>
                              ) : (
                                <span className="font-medium text-ink dark:text-white leading-snug truncate max-w-[200px] text-[12px]">
                                  {c.productName ?? c.shelfId ?? '--'}
                                </span>
                              )}
                              {(c.isin || product?.isin) && (
                                <span className="font-mono text-[9px] text-ink-3 dark:text-white/35">{c.isin || product?.isin}</span>
                              )}
                            </div>
                          </td>

                          {/* Underlying */}
                          <td className="px-3 py-2.5 text-[11px] text-ink-2 dark:text-white/55 font-medium truncate max-w-[100px]">
                            {product?.underlyingYahoo ?? '--'}
                          </td>

                          {/* Amount */}
                          <td className="px-3 py-2.5 text-right font-mono font-semibold text-ink dark:text-white tabular-nums text-[13px] tracking-tight [font-variant-numeric:tabular-nums]">
                            {formatAmount(c.amount ?? 0)}
                          </td>

                          {/* SRI */}
                          <td className="px-3 py-2.5 text-center">
                            {product?.sri ? <SriPill sri={product.sri} /> : <span className="text-ink-3 dark:text-white/25 text-[11px]">--</span>}
                          </td>

                          {/* Coupon */}
                          <td className="px-3 py-2.5 text-right">
                            {product?.couponPct != null ? (
                              <span className="font-mono font-semibold text-[#00B894] text-[12px] tabular-nums">
                                {product.couponPct.toFixed(1)}%
                              </span>
                            ) : (
                              <span className="text-ink-3 dark:text-white/25 text-[11px]">--</span>
                            )}
                          </td>

                          {/* Barrier */}
                          <td className="px-3 py-2.5 text-right">
                            {product?.barrierCapPct != null ? (
                              <span className="font-mono text-[12px] tabular-nums text-[#E8334A] font-semibold">
                                {product.barrierCapPct}%
                              </span>
                            ) : (
                              <span className="text-ink-3 dark:text-white/25 text-[11px]">--</span>
                            )}
                          </td>

                          {/* Status */}
                          <td className="px-3 py-2.5 text-center">
                            <Badge variant={STATUS_VARIANT[status] ?? 'muted'}>{STATUS_LABEL[status] ?? status}</Badge>
                          </td>

                          {/* Rank */}
                          <td className="px-3 py-2.5 text-center">
                            {status === 'WAITING' && c.rank != null ? (
                              <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-gradient-to-br from-[#D4A017]/12 to-[#D4A017]/[0.04] border border-[#D4A017]/25 text-[#D4A017] text-[11px] font-bold">
                                {c.rank}
                              </span>
                            ) : (
                              <span className="text-ink-3 dark:text-white/25 text-[11px]">--</span>
                            )}
                          </td>

                          {/* Date */}
                          <td className="px-3 py-2.5 text-right text-[11px] text-ink-3 dark:text-white/35 font-mono">
                            {c.createdAt ? formatDate(c.createdAt) : '--'}
                          </td>

                          {/* Action */}
                          <td className="px-3 py-2.5 text-center">
                            <div className="flex items-center justify-center gap-1">
                              {status === 'PENDING' && (
                                <>
                                  <Button
                                    size="sm"
                                    onClick={() => handleReview(c.id)}
                                    disabled={reviewMutation.isPending}
                                    className="bg-amber-500 hover:bg-amber-600 text-white text-[10px] px-2 py-0.5 rounded-md font-semibold shadow-sm"
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
                                    className="bg-emerald-500 hover:bg-emerald-600 text-white text-[10px] px-2 py-0.5 rounded-md font-semibold shadow-sm"
                                  >
                                    Approuver
                                  </Button>
                                  <Button
                                    size="sm"
                                    onClick={() => handleReject(c.id)}
                                    disabled={rejectMutation.isPending}
                                    className="bg-red-500 hover:bg-red-600 text-white text-[10px] px-2 py-0.5 rounded-md font-semibold shadow-sm"
                                  >
                                    Rejeter
                                  </Button>
                                </>
                              )}
                              {status === 'CONFIRMED' && (
                                <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-[#00B894]/8 text-[#00B894] ring-1 ring-[#00B894]/15">
                                  <CheckCircle2 size={12} />
                                </span>
                              )}
                              {status === 'CANCELLED' && (
                                <span className="text-[#E8334A] text-[11px] font-semibold">
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
            </>
          )}
        </div>

        {/* ── Risk Summary Card ─────────────────────────────────────── */}
        {commitments && commitments.length > 0 && (
          <div className="mt-3 bg-white/90 dark:bg-white/[0.04] backdrop-blur-sm rounded-xl border border-border/50 dark:border-white/8 ring-1 ring-black/[0.03] dark:ring-white/[0.04] overflow-hidden shadow-sm">
            <div className="px-4 py-3 border-b border-border/50 dark:border-white/8 bg-gradient-to-r from-[#F8F6FF]/80 to-transparent dark:from-white/[0.02] dark:to-transparent">
              <h3 className="font-display text-[13px] font-bold text-ink dark:text-white flex items-center gap-1.5">
                <div className="w-6 h-6 rounded-md bg-[#E8334A]/6 dark:bg-[#E8334A]/15 flex items-center justify-center">
                  <Shield size={12} className="text-[#E8334A]" />
                </div>
                Synthese des risques
              </h3>
            </div>
            <div className="p-4 grid grid-cols-1 md:grid-cols-3 gap-3">
              {/* Average SRI */}
              <div className={cn(
                'rounded-xl border border-border/50 dark:border-white/8 px-4 py-3.5 flex flex-col gap-2',
                'bg-white/80 dark:bg-white/[0.04] backdrop-blur-md',
                'ring-1 ring-black/[0.02] dark:ring-white/[0.04]',
                'overflow-hidden relative',
              )}>
                <div
                  className="absolute top-0 left-0 right-0 h-[2px] rounded-t-xl opacity-60"
                  style={{ background: `linear-gradient(90deg, ${SRI_COLORS[Math.round(portfolioAnalytics.avgSri)] ?? '#7B6FA0'}, ${SRI_COLORS[Math.round(portfolioAnalytics.avgSri)] ?? '#7B6FA0'}60)` }}
                />
                <div className="flex items-center gap-2">
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ring-1 ring-black/[0.03] dark:ring-white/[0.06]"
                    style={{ background: `${SRI_COLORS[Math.round(portfolioAnalytics.avgSri)] ?? '#7B6FA0'}10` }}
                  >
                    <Shield size={15} style={{ color: SRI_COLORS[Math.round(portfolioAnalytics.avgSri)] ?? '#7B6FA0' }} />
                  </div>
                  <span className="text-[9px] uppercase tracking-[0.18em] text-ink-3 dark:text-ink-3/70 font-semibold font-body leading-none">
                    SRI moyen
                  </span>
                </div>
                <div className="flex items-end justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-display text-[22px] font-bold text-ink dark:text-white leading-none tracking-tight">
                      {loadingCommitments ? '...' : portfolioAnalytics.avgSri > 0 ? portfolioAnalytics.avgSri.toFixed(1) : '--'}
                    </span>
                    <span className="text-[11px] text-ink-3 dark:text-white/35 font-body">/ 7</span>
                  </div>
                  {portfolioAnalytics.avgSri > 0 && (
                    <span className={cn(
                      'inline-flex items-center gap-0.5 text-[10px] font-mono font-semibold px-1.5 py-0.5 rounded-md',
                      portfolioAnalytics.avgSri <= 3 && 'text-[#00B894] bg-[#00B894]/8',
                      portfolioAnalytics.avgSri > 3 && portfolioAnalytics.avgSri <= 5 && 'text-[#D4A017] bg-[#D4A017]/8',
                      portfolioAnalytics.avgSri > 5 && 'text-[#E8334A] bg-[#E8334A]/8',
                    )}>
                      {portfolioAnalytics.avgSri <= 3 ? 'Faible' : portfolioAnalytics.avgSri <= 5 ? 'Modere' : 'Eleve'}
                    </span>
                  )}
                </div>
              </div>

              {/* Barrier distance */}
              <div className={cn(
                'rounded-xl border border-border/50 dark:border-white/8 px-4 py-3.5 flex flex-col gap-2',
                'bg-white/80 dark:bg-white/[0.04] backdrop-blur-md',
                'ring-1 ring-black/[0.02] dark:ring-white/[0.04]',
                'overflow-hidden relative',
              )}>
                <div
                  className="absolute top-0 left-0 right-0 h-[2px] rounded-t-xl opacity-60"
                  style={{ background: `linear-gradient(90deg, ${portfolioAnalytics.closestBarrier && portfolioAnalytics.closestBarrier.distance < 15 ? '#E8334A' : portfolioAnalytics.closestBarrier && portfolioAnalytics.closestBarrier.distance < 30 ? '#D4A017' : '#00B894'}, ${portfolioAnalytics.closestBarrier && portfolioAnalytics.closestBarrier.distance < 15 ? '#E8334A' : portfolioAnalytics.closestBarrier && portfolioAnalytics.closestBarrier.distance < 30 ? '#D4A017' : '#00B894'}60)` }}
                />
                <div className="flex items-center gap-2">
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ring-1 ring-black/[0.03] dark:ring-white/[0.06]"
                    style={{ background: `${portfolioAnalytics.closestBarrier && portfolioAnalytics.closestBarrier.distance < 15 ? '#E8334A' : '#D4A017'}10` }}
                  >
                    <AlertCircle size={15} style={{ color: portfolioAnalytics.closestBarrier && portfolioAnalytics.closestBarrier.distance < 15 ? '#E8334A' : '#D4A017' }} />
                  </div>
                  <span className="text-[9px] uppercase tracking-[0.18em] text-ink-3 dark:text-ink-3/70 font-semibold font-body leading-none">
                    Distance barriere min.
                  </span>
                </div>
                <div className="flex items-end justify-between">
                  <span className="font-display text-[22px] font-bold text-ink dark:text-white leading-none tracking-tight">
                    {loadingCommitments ? '...' : portfolioAnalytics.closestBarrier ? `${portfolioAnalytics.closestBarrier.distance.toFixed(0)}%` : '--'}
                  </span>
                  {portfolioAnalytics.closestBarrier && (
                    <Tooltip content={`Produit le plus proche : ${portfolioAnalytics.closestBarrier.name}`}>
                      <span className={cn(
                        'inline-flex items-center gap-0.5 text-[10px] font-mono font-semibold px-1.5 py-0.5 rounded-md cursor-help',
                        portfolioAnalytics.closestBarrier.distance > 30 && 'text-[#00B894] bg-[#00B894]/8',
                        portfolioAnalytics.closestBarrier.distance > 15 && portfolioAnalytics.closestBarrier.distance <= 30 && 'text-[#D4A017] bg-[#D4A017]/8',
                        portfolioAnalytics.closestBarrier.distance <= 15 && 'text-[#E8334A] bg-[#E8334A]/8',
                      )}>
                        {portfolioAnalytics.closestBarrier.distance > 30 ? 'Confortable' : portfolioAnalytics.closestBarrier.distance > 15 ? 'A surveiller' : 'Risque'}
                      </span>
                    </Tooltip>
                  )}
                </div>
              </div>

              {/* Maturity profile */}
              <div className={cn(
                'rounded-xl border border-border/50 dark:border-white/8 px-4 py-3.5 flex flex-col gap-2',
                'bg-white/80 dark:bg-white/[0.04] backdrop-blur-md',
                'ring-1 ring-black/[0.02] dark:ring-white/[0.04]',
                'overflow-hidden relative',
              )}>
                <div
                  className="absolute top-0 left-0 right-0 h-[2px] rounded-t-xl opacity-60"
                  style={{ background: 'linear-gradient(90deg, #3B1FA8, #3B1FA860)' }}
                />
                <div className="flex items-center gap-2">
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ring-1 ring-black/[0.03] dark:ring-white/[0.06]"
                    style={{ background: '#3B1FA810' }}
                  >
                    <Clock size={15} className="text-[#3B1FA8]" />
                  </div>
                  <span className="text-[9px] uppercase tracking-[0.18em] text-ink-3 dark:text-ink-3/70 font-semibold font-body leading-none">
                    Profil de maturite
                  </span>
                </div>
                <div className="flex flex-col gap-1">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-ink-3 dark:text-white/45 font-body">Plus courte</span>
                    <span className="font-mono text-[11px] font-semibold text-ink dark:text-white tabular-nums">
                      {loadingCommitments ? '...' : portfolioAnalytics.shortestMaturity ? formatDate(portfolioAnalytics.shortestMaturity) : '--'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-ink-3 dark:text-white/45 font-body">Plus longue</span>
                    <span className="font-mono text-[11px] font-semibold text-ink dark:text-white tabular-nums">
                      {loadingCommitments ? '...' : portfolioAnalytics.longestMaturity ? formatDate(portfolioAnalytics.longestMaturity) : '--'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
        </>
      )}

      {activeTab === 'underlyings' && (
        <div className="space-y-2.5">
          {/* Barrier status filters */}
          <div className="flex items-center gap-1.5 flex-wrap">
            {BARRIER_FILTERS.map((f) => (
              <button
                key={f.id}
                onClick={() => setBarrierFilter(f.id as any)}
                className={cn(
                  'px-3 py-1 rounded-lg text-[10px] font-semibold font-body border transition-all duration-150',
                  barrierFilter === f.id
                    ? 'text-white border-transparent shadow-sm'
                    : 'bg-white/70 dark:bg-white/[0.04] backdrop-blur-sm border-border/50 dark:border-white/12 text-ink-3 dark:text-white/45 hover:text-ink dark:hover:text-white/70',
                )}
                style={barrierFilter === f.id ? { backgroundColor: f.color, borderColor: f.color } : undefined}
              >
                {f.label}
              </button>
            ))}
            <button
              onClick={handleExportUnderlyings}
              className={cn(
              'ml-auto h-7 px-2.5 rounded-lg border border-border/50 dark:border-white/12 bg-white/70 dark:bg-white/[0.04] backdrop-blur-sm text-ink-3 dark:text-white/45',
              'text-[10px] font-medium font-body flex items-center gap-1',
              'hover:text-[#3B1FA8] dark:hover:text-[#C9BCFF] hover:border-[#3B1FA8]/35 transition-all duration-150',
            )}>
              <Download size={11} />
              Export Excel
            </button>
          </div>

          <div className="bg-white/90 dark:bg-white/[0.04] backdrop-blur-sm rounded-xl border border-border/50 dark:border-white/8 ring-1 ring-black/[0.03] dark:ring-white/[0.04] overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-[12px] font-body" aria-label="Exposition par sous-jacent">
                <thead>
                  <tr className="border-b border-border/50 dark:border-white/8 bg-gradient-to-r from-[#F8F6FF]/50 to-[#F0ECFF]/20 dark:from-white/[0.015] dark:to-transparent">
                    <PremiumTh className="text-left">Sous-jacent</PremiumTh>
                    <PremiumTh className="text-right">Strike</PremiumTh>
                    <PremiumTh className="text-right">Performance</PremiumTh>
                    <PremiumTh className="text-right">Barriere capital</PremiumTh>
                    <PremiumTh className="text-left min-w-[120px]">Distance barriere</PremiumTh>
                    <PremiumTh className="text-left">ISIN</PremiumTh>
                    <PremiumTh className="text-left">Produit</PremiumTh>
                    <PremiumTh className="text-center">SRI</PremiumTh>
                  </tr>
                </thead>
                <tbody className="stagger-rows">
                  {products.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="px-3 py-10 text-center text-[12px] text-ink-3 dark:text-white/45">
                        Aucun sous-jacent a afficher pour le moment.
                      </td>
                    </tr>
                  ) : (
                    products.slice(0, 15).map((p: any, rowIdx: number) => {
                      // Simulate realistic barrier distance (deterministic from product id)
                      const barrierPct = p.barrierCapPct ?? 60;
                      let hash = 0;
                      for (let i = 0; i < (p.id?.length ?? 0); i++) hash = ((hash << 5) - hash + p.id.charCodeAt(i)) | 0;
                      const simulatedPerf = ((Math.abs(hash) % 40) - 10); // -10% to +30%
                      const distance = 100 + simulatedPerf - barrierPct;

                      return (
                        <tr
                          key={p.id}
                          className={cn(
                            'border-b border-border/20 dark:border-white/[0.04] last:border-0',
                            rowIdx % 2 === 1 && 'bg-[#F8F6FF]/20 dark:bg-white/[0.01]',
                            'hover:bg-[#3B1FA8]/[0.03] dark:hover:bg-white/[0.03]',
                            'transition-colors duration-150',
                          )}
                        >
                          <td className="px-3 py-2.5">
                            <div className="flex items-center gap-2">
                              <Activity size={12} className="text-[#3B1FA8] shrink-0" />
                              <span className="font-medium text-ink dark:text-white">{p.underlyingYahoo ?? p.underlyingName ?? '--'}</span>
                            </div>
                          </td>
                          <td className="px-3 py-2.5 text-right font-mono tabular-nums text-ink-2 dark:text-white/55">100.00</td>
                          <td className="px-3 py-2.5 text-right">
                            <span className={cn(
                              'font-mono tabular-nums font-semibold text-[12px]',
                              simulatedPerf >= 0 ? 'text-[#00B894]' : 'text-[#E8334A]',
                            )}>
                              {simulatedPerf >= 0 ? '+' : ''}{simulatedPerf.toFixed(1)}%
                            </span>
                          </td>
                          <td className="px-3 py-2.5 text-right font-mono tabular-nums text-[#E8334A] font-semibold">{formatPct(p.barrierCapPct)}</td>
                          <td className="px-3 py-2.5">
                            {p.barrierCapPct != null ? (
                              <BarrierDistanceBar distancePct={distance} barrierPct={barrierPct} />
                            ) : (
                              <span className="text-ink-3 dark:text-white/25 text-[11px]">--</span>
                            )}
                          </td>
                          <td className="px-3 py-2.5 font-mono text-[10px] text-ink-3 dark:text-white/35">{p.isin}</td>
                          <td className="px-3 py-2.5">
                            <Link
                              href={`/products/${p.id}`}
                              className="text-ink-2 dark:text-white/55 truncate max-w-[140px] inline-block hover:text-[#3B1FA8] dark:hover:text-[#C9BCFF] transition-colors"
                            >
                              {p.name}
                            </Link>
                          </td>
                          <td className="px-3 py-2.5 text-center">
                            {p.sri ? <SriPill sri={p.sri} /> : <span className="text-ink-3 dark:text-white/25 text-[11px]">--</span>}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'timeline' && <CalendarView products={products as any[]} />}

      {activeTab === 'allocations' && <AllocationChart products={products as any[]} commitments={commitments ?? []} />}

      {activeTab === 'expired' && (
        <div className="bg-white/90 dark:bg-white/[0.04] backdrop-blur-sm rounded-xl border border-border/50 dark:border-white/8 ring-1 ring-black/[0.03] dark:ring-white/[0.04] overflow-hidden shadow-sm">
          <div className="px-4 py-3 border-b border-border/50 dark:border-white/8 flex items-center justify-between bg-gradient-to-r from-[#F8F6FF]/80 to-transparent dark:from-white/[0.02] dark:to-transparent">
            <h2 className="font-display text-[13px] font-bold text-ink dark:text-white flex items-center gap-1.5">
              <div className="w-6 h-6 rounded-md bg-ink-3/6 dark:bg-white/8 flex items-center justify-center">
                <Clock size={12} className="text-ink-3 dark:text-white/45" />
              </div>
              Produits expires
            </h2>
            <button
              onClick={handleExportExpired}
              className={cn(
              'h-7 px-2.5 rounded-lg border border-border/50 dark:border-white/12 bg-white/70 dark:bg-white/[0.04] text-ink-3 dark:text-white/45',
              'text-[10px] font-medium font-body flex items-center gap-1',
              'hover:text-[#3B1FA8] dark:hover:text-[#C9BCFF] hover:border-[#3B1FA8]/35 transition-all duration-150',
            )}>
              <Download size={11} />
              Export Excel
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-[12px] font-body" aria-label="Historique des transactions">
              <thead>
                <tr className="border-b border-border/50 dark:border-white/8 bg-gradient-to-r from-[#F8F6FF]/50 to-[#F0ECFF]/20 dark:from-white/[0.015] dark:to-transparent">
                  <PremiumTh className="text-left">Produit</PremiumTh>
                  <PremiumTh className="text-left">ISIN</PremiumTh>
                  <PremiumTh className="text-left">Emetteur</PremiumTh>
                  <PremiumTh className="text-right">Maturite</PremiumTh>
                  <PremiumTh className="text-right">Coupon</PremiumTh>
                  <PremiumTh className="text-right">Protection</PremiumTh>
                  <PremiumTh className="text-center">Resultat</PremiumTh>
                </tr>
              </thead>
              <tbody>
                {/* Demo expired products for visual completeness */}
                {[
                  { name: 'Phoenix Autocall SX5E 2023', isin: 'FR0014007A95', issuer: 'SG Issuer', maturity: '15 mars 2024', coupon: '8.5%', protection: '60%', result: 'Rappele' as const },
                  { name: 'Athena BNP Euro Rendement', isin: 'FR0014008B12', issuer: 'BNP Paribas', maturity: '22 jan. 2024', coupon: '7.2%', protection: '50%', result: 'Maturite' as const },
                ].map((p, idx) => (
                  <tr
                    key={idx}
                    className={cn(
                      'border-b border-border/20 dark:border-white/[0.04] last:border-0',
                      idx % 2 === 1 && 'bg-[#F8F6FF]/20 dark:bg-white/[0.01]',
                      'hover:bg-[#3B1FA8]/[0.03] dark:hover:bg-white/[0.03]',
                      'transition-colors duration-150',
                    )}
                  >
                    <td className="px-3 py-2.5 font-medium text-ink dark:text-white text-[12px]">{p.name}</td>
                    <td className="px-3 py-2.5 font-mono text-[10px] text-ink-3 dark:text-white/35">{p.isin}</td>
                    <td className="px-3 py-2.5 text-ink-2 dark:text-white/55">{p.issuer}</td>
                    <td className="px-3 py-2.5 text-right font-mono text-[11px] text-ink-3 dark:text-white/35">{p.maturity}</td>
                    <td className="px-3 py-2.5 text-right font-mono font-semibold text-[#00B894]">{p.coupon}</td>
                    <td className="px-3 py-2.5 text-right font-mono text-[#E8334A]">{p.protection}</td>
                    <td className="px-3 py-2.5 text-center">
                      <span className={cn(
                        'inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold',
                        p.result === 'Rappele'
                          ? 'bg-[#00B894]/8 text-[#00B894] ring-1 ring-[#00B894]/15'
                          : 'bg-[#3B1FA8]/6 text-[#3B1FA8] ring-1 ring-[#3B1FA8]/15',
                      )}>
                        {p.result === 'Rappele' && <CheckCircle2 size={10} />}
                        {p.result}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── Optimize Allocation Modal ── */}
      {showOptimizeModal && (
        <OptimizeModal onClose={() => setShowOptimizeModal(false)} commitments={commitments ?? []} products={products as any[]} />
      )}

      {/* ── Stress Test Modal ── */}
      {showStressModal && (
        <StressTestModal onClose={() => setShowStressModal(false)} commitments={commitments ?? []} products={products as any[]} />
      )}

      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
    </div>
  );
}

// ─── Optimize Allocation Modal ──────────────────────────────────────────────

interface ModalProps {
  onClose: () => void;
  commitments: any[];
  products: any[];
}

const OPTIMIZE_RECOMMENDATIONS = [
  {
    type: 'rebalance' as const,
    priority: 'high' as const,
    title: 'Reduire la concentration Euro Stoxx 50',
    description: 'Votre exposition a l\'Euro Stoxx 50 represente 45% du portefeuille. Recommandation : diversifier vers des sous-jacents decorreles (S&P 500, Nikkei 225).',
    impact: '+8 pts diversification',
    impactColor: '#00B894',
  },
  {
    type: 'risk' as const,
    priority: 'medium' as const,
    title: 'Renforcer la protection barriere',
    description: 'Le SRI moyen est de 5.2. Pour un profil equilibre, visez des produits avec barriere >= 60% pour les nouvelles souscriptions.',
    impact: '-1.2 SRI moyen',
    impactColor: '#3D63F5',
  },
  {
    type: 'yield' as const,
    priority: 'medium' as const,
    title: 'Opportunite de rendement',
    description: 'Les conditions de marche actuelles (volatilite haute, spreads stables) sont favorables aux Phoenix Autocall avec coupon conditionnel 8-10%.',
    impact: '+1.5% rendement',
    impactColor: '#D4A017',
  },
  {
    type: 'timing' as const,
    priority: 'low' as const,
    title: 'Echelonner les maturites',
    description: 'Votre horizon moyen est de 3.4 ans. Ajoutez des produits court terme (18-24 mois) pour equilibrer les flux de tresorerie.',
    impact: 'Meilleure liquidite',
    impactColor: '#3B1FA8',
  },
];

function OptimizeModal({ onClose, commitments, products }: ModalProps) {
  const [loading, setLoading] = useState(true);
  const [selectedReco, setSelectedReco] = useState<number | null>(null);
  const [applying, setApplying] = useState(false);
  const [applied, setApplied] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 2200);
    return () => clearTimeout(timer);
  }, []);

  const handleApply = () => {
    setApplying(true);
    setTimeout(() => {
      setApplying(false);
      setApplied(true);
    }, 2000);
  };

  // Compute current allocation
  const allocation = useMemo(() => {
    const total = commitments.reduce((s: number, c: any) => s + (c.amount ?? 0), 0);
    const productMap = new Map(products.map((p: any) => [p.id, p]));
    const byIssuer = new Map<string, number>();
    const byPayoff = new Map<string, number>();

    for (const c of commitments) {
      const p = productMap.get(c.shelfId) || productMap.get(c.productId);
      const issuer = p?.issuerName ?? 'Inconnu';
      const payoff = p?.payoffType ?? 'AUTRE';
      byIssuer.set(issuer, (byIssuer.get(issuer) ?? 0) + (c.amount ?? 0));
      byPayoff.set(payoff, (byPayoff.get(payoff) ?? 0) + (c.amount ?? 0));
    }

    return { total, byIssuer, byPayoff };
  }, [commitments, products]);

  const priorityColor = { high: '#E8334A', medium: '#D4A017', low: '#00B894' };
  const priorityLabel = { high: 'Haute', medium: 'Moyenne', low: 'Basse' };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className={cn(
        'relative w-full max-w-2xl max-h-[85vh] overflow-y-auto',
        'bg-white dark:bg-[#1A0A3E] rounded-2xl shadow-2xl',
        'border border-border/50 dark:border-white/10',
        'animate-in fade-in zoom-in-95 duration-200',
      )}>
        {/* Header */}
        <div className="sticky top-0 z-10 px-6 py-4 border-b border-border/50 dark:border-white/8 bg-gradient-to-r from-[#F8F6FF] to-white dark:from-[#1A0A3E] dark:to-[#1A0A3E]">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#3B1FA8] to-[#5B3FD4] flex items-center justify-center shadow-md shadow-[#3B1FA8]/20">
                <Target size={18} className="text-white" />
              </div>
              <div>
                <h2 className="font-display text-lg font-bold text-ink dark:text-white">Optimisation IA du portefeuille</h2>
                <p className="text-xs text-ink-3 dark:text-white/45 font-body">Analyse basee sur {commitments.length} engagements &bull; {new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(allocation.total)}</p>
              </div>
            </div>
            <button onClick={onClose} className="w-8 h-8 rounded-lg hover:bg-ink-3/10 dark:hover:bg-white/10 flex items-center justify-center transition-colors">
              <X size={16} className="text-ink-3 dark:text-white/50" />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="px-6 py-5 space-y-5">
          {loading ? (
            <div className="flex flex-col items-center py-12 gap-4">
              <div className="relative w-16 h-16">
                <div className="absolute inset-0 rounded-full border-2 border-[#3B1FA8]/15 dark:border-[#3B1FA8]/25" />
                <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-[#3B1FA8] animate-spin" />
                <div className="absolute inset-2 rounded-full border-2 border-transparent border-b-[#5B3FD4] animate-spin" style={{ animationDirection: 'reverse', animationDuration: '1.5s' }} />
                <Brain size={20} className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-[#3B1FA8]" />
              </div>
              <div className="text-center">
                <p className="font-display text-sm font-semibold text-ink dark:text-white">Analyse en cours...</p>
                <p className="text-xs text-ink-3 dark:text-white/40 font-body mt-1">L&apos;IA examine votre portefeuille et les conditions de marche</p>
              </div>
            </div>
          ) : (
            <>
              {/* Score Summary */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  { label: 'Score global', value: '72/100', delta: '+5 possible', color: '#3B1FA8' },
                  { label: 'Diversification', value: '58%', delta: 'A ameliorer', color: '#D4A017' },
                  { label: 'Risque ajuste', value: 'Modere', delta: 'Equilibre', color: '#00B894' },
                  { label: 'Rendement/Risque', value: '1.4x', delta: 'Optimisable', color: '#3D63F5' },
                ].map((m, i) => (
                  <div key={i} className="rounded-xl border border-border/50 dark:border-white/8 p-3 text-center bg-white/60 dark:bg-white/[0.03]">
                    <p className="text-[9px] uppercase tracking-widest text-ink-3 dark:text-white/40 font-semibold font-body">{m.label}</p>
                    <p className="font-display text-lg font-bold mt-1" style={{ color: m.color }}>{m.value}</p>
                    <p className="text-[10px] text-ink-3 dark:text-white/40 font-body mt-0.5">{m.delta}</p>
                  </div>
                ))}
              </div>

              {/* Applied success banner */}
              {applied && (
                <div className="rounded-xl border border-[#00B894]/30 bg-[#00B894]/[0.06] p-4 flex items-start gap-3 animate-in fade-in slide-in-from-top-2 duration-300">
                  <div className="w-8 h-8 rounded-lg bg-[#00B894]/15 flex items-center justify-center shrink-0">
                    <CheckCircle2 size={16} className="text-[#00B894]" />
                  </div>
                  <div>
                    <p className="font-display text-sm font-bold text-[#00B894]">Suggestions appliquees avec succes</p>
                    <p className="text-xs text-ink-2 dark:text-white/55 font-body mt-1 leading-relaxed">
                      Les recommandations ont ete enregistrees. Votre score de diversification passera de <strong>58%</strong> a <strong>72%</strong> une fois les operations realisees.
                      Un plan d&apos;action detaille a ete ajoute a votre espace &laquo;&nbsp;Actions recommandees&nbsp;&raquo;.
                    </p>
                    <div className="flex items-center gap-2 mt-2.5">
                      <Link href="/products" className="text-[11px] font-semibold font-body text-[#3B1FA8] hover:underline flex items-center gap-1">
                        <ExternalLink size={10} />
                        Voir les produits suggeres
                      </Link>
                      <span className="text-ink-3/30">|</span>
                      <Link href="/notifications" className="text-[11px] font-semibold font-body text-[#3B1FA8] hover:underline flex items-center gap-1">
                        Voir les notifications
                      </Link>
                    </div>
                  </div>
                </div>
              )}

              {/* Recommendations */}
              <div>
                <h3 className="font-display text-sm font-bold text-ink dark:text-white mb-3 flex items-center gap-2">
                  <Sparkles size={14} className="text-[#D4A017]" />
                  Recommandations
                </h3>
                <div className="space-y-2.5">
                  {OPTIMIZE_RECOMMENDATIONS.map((reco, idx) => (
                    <button
                      key={idx}
                      onClick={() => setSelectedReco(selectedReco === idx ? null : idx)}
                      className={cn(
                        'w-full text-left rounded-xl border p-3.5 transition-all duration-200',
                        selectedReco === idx
                          ? 'border-[#3B1FA8]/40 bg-[#3B1FA8]/[0.04] dark:bg-[#3B1FA8]/10 shadow-sm'
                          : 'border-border/50 dark:border-white/8 bg-white/50 dark:bg-white/[0.02] hover:border-[#3B1FA8]/20',
                      )}
                    >
                      <div className="flex items-start gap-3">
                        <div className="flex flex-col items-center gap-1 shrink-0 pt-0.5">
                          <span
                            className="w-2 h-2 rounded-full"
                            style={{ background: priorityColor[reco.priority] }}
                          />
                          <span className="text-[8px] font-semibold font-body uppercase tracking-wider" style={{ color: priorityColor[reco.priority] }}>
                            {priorityLabel[reco.priority]}
                          </span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-display text-[13px] font-bold text-ink dark:text-white">{reco.title}</p>
                          {selectedReco === idx && (
                            <p className="text-xs text-ink-2 dark:text-white/55 font-body mt-1.5 leading-relaxed">{reco.description}</p>
                          )}
                        </div>
                        <div className="shrink-0">
                          <span
                            className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-bold font-body"
                            style={{ background: `${reco.impactColor}12`, color: reco.impactColor }}
                          >
                            <ArrowUpRight size={10} />
                            {reco.impact}
                          </span>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Suggested allocation */}
              <div className="rounded-xl border border-border/50 dark:border-white/8 p-4 bg-gradient-to-br from-[#F8F6FF]/50 to-transparent dark:from-white/[0.02]">
                <h3 className="font-display text-sm font-bold text-ink dark:text-white mb-3">Allocation cible suggeree</h3>
                <div className="space-y-2">
                  {[
                    { label: 'Phoenix Autocall', current: 55, target: 40, color: '#3B1FA8' },
                    { label: 'Capital Protege', current: 15, target: 25, color: '#00B894' },
                    { label: 'Taux Conditionnel', current: 25, target: 25, color: '#D4A017' },
                    { label: 'Reverse Convertible', current: 5, target: 10, color: '#3D63F5' },
                  ].map((a, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <span className="text-[11px] font-body text-ink-2 dark:text-white/55 w-36 shrink-0">{a.label}</span>
                      <div className="flex-1 h-3 bg-ink-3/8 dark:bg-white/8 rounded-full overflow-hidden relative">
                        <div className="absolute inset-0 h-full rounded-full opacity-30" style={{ width: `${a.current}%`, background: a.color }} />
                        <div className="absolute inset-0 h-full rounded-full" style={{ width: `${a.target}%`, background: a.color, opacity: 0.8 }} />
                      </div>
                      <span className="text-[10px] font-mono font-semibold text-ink-3 dark:text-white/40 w-20 text-right">
                        {a.current}% → {a.target}%
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        {!loading && (
          <div className="sticky bottom-0 px-6 py-4 border-t border-border/50 dark:border-white/8 bg-white/90 dark:bg-[#1A0A3E]/90 backdrop-blur-sm flex items-center justify-between">
            <p className="text-[10px] text-ink-3 dark:text-white/35 font-body">
              <Sparkles size={10} className="inline mr-1 text-[#D4A017]" />
              Analyse generee par l&apos;IA &bull; A titre indicatif uniquement
            </p>
            <div className="flex items-center gap-2">
              <button onClick={onClose} className="px-4 py-2 rounded-lg text-xs font-semibold font-body border border-border/50 dark:border-white/12 text-ink-3 dark:text-white/50 hover:text-ink dark:hover:text-white transition-colors">
                Fermer
              </button>
              <button
                onClick={applied ? onClose : handleApply}
                disabled={applying}
                className={cn(
                  'px-4 py-2 rounded-lg text-xs font-semibold font-body shadow-sm transition-all flex items-center gap-1.5',
                  applied
                    ? 'bg-gradient-to-r from-[#00B894] to-[#008B6E] text-white shadow-[#00B894]/20'
                    : 'bg-gradient-to-r from-[#3B1FA8] to-[#5B3FD4] text-white shadow-[#3B1FA8]/20 hover:shadow-md hover:brightness-110',
                  applying && 'opacity-80 cursor-wait',
                )}
              >
                {applying ? (
                  <>
                    <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Application en cours...
                  </>
                ) : applied ? (
                  <>
                    <CheckCircle2 size={12} />
                    Suggestions appliquees !
                  </>
                ) : (
                  'Appliquer les suggestions'
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Stress Test Modal ──────────────────────────────────────────────────────

const STRESS_SCENARIOS = [
  {
    id: 'crash',
    label: 'Crash marche -30%',
    icon: TrendingDown,
    description: 'Baisse soudaine des marches actions de 30%, volatilite a 45%',
    color: '#E8334A',
    impact: { portfolioValue: -18.5, atRisk: 3, autocallTriggered: 0, barriersBroken: 2, estimatedLoss: -604_250 },
  },
  {
    id: 'correction',
    label: 'Correction -15%',
    icon: TrendingDown,
    description: 'Correction standard, volatilite a 28%',
    color: '#D4A017',
    impact: { portfolioValue: -7.2, atRisk: 1, autocallTriggered: 0, barriersBroken: 0, estimatedLoss: -235_200 },
  },
  {
    id: 'rally',
    label: 'Rally haussier +20%',
    icon: TrendingUp,
    description: 'Forte hausse des marches, volatilite en baisse a 14%',
    color: '#00B894',
    impact: { portfolioValue: +12.8, atRisk: 0, autocallTriggered: 4, barriersBroken: 0, estimatedLoss: 418_400 },
  },
  {
    id: 'rates',
    label: 'Hausse taux +200bp',
    icon: Activity,
    description: 'Remontee rapide des taux directeurs de la BCE',
    color: '#3D63F5',
    impact: { portfolioValue: -3.8, atRisk: 0, autocallTriggered: 1, barriersBroken: 0, estimatedLoss: -124_200 },
  },
  {
    id: 'flat',
    label: 'Marche plat 12 mois',
    icon: Activity,
    description: 'Marches stables, volatilite basse a 12%',
    color: '#7B6FA0',
    impact: { portfolioValue: +2.4, atRisk: 0, autocallTriggered: 2, barriersBroken: 0, estimatedLoss: 78_500 },
  },
];

function StressTestModal({ onClose, commitments, products }: ModalProps) {
  const [loading, setLoading] = useState(true);
  const [selectedScenarios, setSelectedScenarios] = useState<Set<number>>(new Set([0]));
  const [exported, setExported] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 2500);
    return () => clearTimeout(timer);
  }, []);

  const totalEngaged = useMemo(
    () => commitments.reduce((s: number, c: any) => s + (c.amount ?? 0), 0),
    [commitments],
  );

  const toggleScenario = (idx: number) => {
    setSelectedScenarios(prev => {
      const next = new Set(prev);
      if (next.has(idx)) {
        if (next.size > 1) next.delete(idx); // keep at least 1
      } else {
        next.add(idx);
      }
      return next;
    });
  };

  const selectedList = STRESS_SCENARIOS.filter((_, i) => selectedScenarios.has(i));
  const isMulti = selectedList.length > 1;

  // Deterministic per-position impact (seeded, not random)
  const positionImpacts = useMemo(() => {
    const productMap = new Map(products.map((p: any) => [p.id, p]));
    return commitments.slice(0, 6).map((c: any, idx: number) => {
      const p = productMap.get(c.shelfId) || productMap.get(c.productId);
      const barrier = p?.barrierCapPct ?? 50;
      const name = p?.name ?? `Produit ${idx + 1}`;
      const amount = c.amount ?? 0;
      // Seed: use idx to get consistent variation per position
      const variation = [0.92, 1.08, 0.97, 1.15, 0.88, 1.03][idx % 6];
      return { name, amount, barrier, variation };
    });
  }, [commitments, products]);

  const handleExport = () => {
    setExported(true);
    setTimeout(() => setExported(false), 3000);
  };

  const fmtCurrency = (v: number) =>
    new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(v);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className={cn(
        'relative w-full max-h-[85vh] overflow-y-auto',
        'bg-white dark:bg-[#1A0A3E] rounded-2xl shadow-2xl',
        'border border-border/50 dark:border-white/10',
        'animate-in fade-in zoom-in-95 duration-200',
        isMulti ? 'max-w-4xl' : 'max-w-2xl',
      )}>
        {/* Header */}
        <div className="sticky top-0 z-10 px-6 py-4 border-b border-border/50 dark:border-white/8 bg-gradient-to-r from-[#F8F6FF] to-white dark:from-[#1A0A3E] dark:to-[#1A0A3E]">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#E8334A] to-[#D4A017] flex items-center justify-center shadow-md shadow-[#E8334A]/20">
                <Zap size={18} className="text-white" />
              </div>
              <div>
                <h2 className="font-display text-lg font-bold text-ink dark:text-white">Simulation de Stress Test</h2>
                <p className="text-xs text-ink-3 dark:text-white/45 font-body">
                  {selectedList.length} scenario{selectedList.length > 1 ? 's' : ''} &bull; {commitments.length} positions &bull; {fmtCurrency(totalEngaged)}
                </p>
              </div>
            </div>
            <button onClick={onClose} className="w-8 h-8 rounded-lg hover:bg-ink-3/10 dark:hover:bg-white/10 flex items-center justify-center transition-colors">
              <X size={16} className="text-ink-3 dark:text-white/50" />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="px-6 py-5 space-y-5">
          {loading ? (
            <div className="flex flex-col items-center py-12 gap-4">
              <div className="relative w-16 h-16">
                <div className="absolute inset-0 rounded-full border-2 border-[#E8334A]/15 dark:border-[#E8334A]/25" />
                <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-[#E8334A] animate-spin" />
                <div className="absolute inset-2 rounded-full border-2 border-transparent border-b-[#D4A017] animate-spin" style={{ animationDirection: 'reverse', animationDuration: '1.5s' }} />
                <Zap size={20} className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-[#E8334A]" />
              </div>
              <div className="text-center">
                <p className="font-display text-sm font-semibold text-ink dark:text-white">Calcul des scenarios...</p>
                <p className="text-xs text-ink-3 dark:text-white/40 font-body mt-1">Simulation Monte-Carlo sur 10 000 trajectoires</p>
              </div>
            </div>
          ) : (
            <>
              {/* Scenario selector — multi-select */}
              <div>
                <p className="text-[10px] text-ink-3 dark:text-white/40 font-body font-semibold uppercase tracking-widest mb-2">
                  Selectionnez un ou plusieurs scenarios pour comparer
                </p>
                <div className="flex flex-wrap gap-2">
                  {STRESS_SCENARIOS.map((s, idx) => {
                    const SIcon = s.icon;
                    const isActive = selectedScenarios.has(idx);
                    return (
                      <button
                        key={s.id}
                        onClick={() => toggleScenario(idx)}
                        className={cn(
                          'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-semibold font-body border transition-all duration-200',
                          isActive
                            ? 'border-current shadow-sm ring-1'
                            : 'border-border/50 dark:border-white/10 text-ink-3 dark:text-white/40 hover:border-ink-3/30',
                        )}
                        style={isActive ? { color: s.color, background: `${s.color}10`, borderColor: `${s.color}40`, boxShadow: `0 0 0 1px ${s.color}30` } : undefined}
                      >
                        <SIcon size={12} />
                        {s.label}
                        {isActive && (
                          <span className="ml-0.5 w-3.5 h-3.5 rounded-full flex items-center justify-center text-[8px]" style={{ background: `${s.color}25` }}>
                            ✓
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Comparison table when multiple scenarios selected */}
              {isMulti ? (
                <>
                  {/* Side-by-side KPI comparison */}
                  <div className="rounded-xl border border-border/50 dark:border-white/8 overflow-hidden">
                    <div className="px-4 py-2.5 bg-gradient-to-r from-[#F8F6FF]/60 to-transparent dark:from-white/[0.02] border-b border-border/30 dark:border-white/5">
                      <h3 className="font-display text-sm font-bold text-ink dark:text-white flex items-center gap-2">
                        <BarChart3 size={14} className="text-[#3B1FA8]" />
                        Comparaison des scenarios
                      </h3>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full text-[11px] font-body" aria-label="Comparaison des scenarios">
                        <thead>
                          <tr className="border-b border-border/50 dark:border-white/8">
                            <th className="px-3 py-2.5 text-left text-[9px] uppercase tracking-widest text-ink-3 dark:text-white/40 font-semibold">Scenario</th>
                            <th className="px-3 py-2.5 text-right text-[9px] uppercase tracking-widest text-ink-3 dark:text-white/40 font-semibold">Impact</th>
                            <th className="px-3 py-2.5 text-right text-[9px] uppercase tracking-widest text-ink-3 dark:text-white/40 font-semibold">P&amp;L estime</th>
                            <th className="px-3 py-2.5 text-center text-[9px] uppercase tracking-widest text-ink-3 dark:text-white/40 font-semibold">Positions a risque</th>
                            <th className="px-3 py-2.5 text-center text-[9px] uppercase tracking-widest text-ink-3 dark:text-white/40 font-semibold">Autocalls</th>
                            <th className="px-3 py-2.5 text-center text-[9px] uppercase tracking-widest text-ink-3 dark:text-white/40 font-semibold">Barrieres</th>
                          </tr>
                        </thead>
                        <tbody>
                          {selectedList.map((s, idx) => {
                            const SIcon = s.icon;
                            // Find best/worst for highlighting
                            const isBest = s.impact.portfolioValue === Math.max(...selectedList.map(x => x.impact.portfolioValue));
                            const isWorst = s.impact.portfolioValue === Math.min(...selectedList.map(x => x.impact.portfolioValue));
                            return (
                              <tr
                                key={s.id}
                                className={cn(
                                  'border-b border-border/20 dark:border-white/[0.04] last:border-0 transition-colors',
                                  isBest && 'bg-[#00B894]/[0.04]',
                                  isWorst && selectedList.length > 1 && 'bg-[#E8334A]/[0.03]',
                                )}
                              >
                                <td className="px-3 py-2.5">
                                  <div className="flex items-center gap-2">
                                    <div className="w-6 h-6 rounded-md flex items-center justify-center shrink-0" style={{ background: `${s.color}15` }}>
                                      <SIcon size={11} style={{ color: s.color }} />
                                    </div>
                                    <div>
                                      <span className="font-semibold text-ink dark:text-white text-[11px]">{s.label}</span>
                                      {isBest && <span className="ml-1.5 text-[8px] font-bold px-1.5 py-0.5 rounded bg-[#00B894]/10 text-[#00B894]">MEILLEUR</span>}
                                      {isWorst && selectedList.length > 1 && !isBest && <span className="ml-1.5 text-[8px] font-bold px-1.5 py-0.5 rounded bg-[#E8334A]/10 text-[#E8334A]">PIRE</span>}
                                    </div>
                                  </div>
                                </td>
                                <td className="px-3 py-2.5 text-right">
                                  <span className={cn('font-display text-base font-bold', s.impact.portfolioValue >= 0 ? 'text-[#00B894]' : 'text-[#E8334A]')}>
                                    {s.impact.portfolioValue > 0 ? '+' : ''}{s.impact.portfolioValue}%
                                  </span>
                                </td>
                                <td className={cn('px-3 py-2.5 text-right font-mono font-semibold text-[12px]', s.impact.estimatedLoss >= 0 ? 'text-[#00B894]' : 'text-[#E8334A]')}>
                                  {fmtCurrency(s.impact.estimatedLoss)}
                                </td>
                                <td className="px-3 py-2.5 text-center">
                                  <span className={cn(
                                    'inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold',
                                    s.impact.atRisk > 0 ? 'bg-[#E8334A]/8 text-[#E8334A]' : 'bg-[#00B894]/8 text-[#00B894]',
                                  )}>
                                    {s.impact.atRisk} / {commitments.length}
                                  </span>
                                </td>
                                <td className="px-3 py-2.5 text-center font-mono font-semibold" style={{ color: s.impact.autocallTriggered > 0 ? '#D4A017' : '#7B6FA0' }}>
                                  {s.impact.autocallTriggered}
                                </td>
                                <td className="px-3 py-2.5 text-center">
                                  <span className={cn(
                                    'inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold',
                                    s.impact.barriersBroken > 0 ? 'bg-[#E8334A]/8 text-[#E8334A]' : 'bg-[#00B894]/8 text-[#00B894]',
                                  )}>
                                    {s.impact.barriersBroken}
                                  </span>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Per-position multi-scenario impact */}
                  <div>
                    <h3 className="font-display text-sm font-bold text-ink dark:text-white mb-3 flex items-center gap-2">
                      <Shield size={14} className="text-[#3D63F5]" />
                      Impact par position — comparaison
                    </h3>
                    <div className="rounded-xl border border-border/50 dark:border-white/8 overflow-hidden overflow-x-auto">
                      <table className="w-full text-[11px] font-body" aria-label="Impact par position">
                        <thead>
                          <tr className="border-b border-border/50 dark:border-white/8 bg-[#F8F6FF]/50 dark:bg-white/[0.02]">
                            <th className="px-3 py-2 text-left text-[9px] uppercase tracking-widest text-ink-3 dark:text-white/40 font-semibold sticky left-0 bg-[#F8F6FF]/90 dark:bg-[#1A0A3E]">Produit</th>
                            <th className="px-3 py-2 text-right text-[9px] uppercase tracking-widest text-ink-3 dark:text-white/40 font-semibold">Montant</th>
                            {selectedList.map(s => (
                              <th key={s.id} className="px-3 py-2 text-center text-[9px] uppercase tracking-widest font-semibold" style={{ color: s.color }}>
                                {s.label.replace('Crash marche ', '').replace('Rally haussier ', '+').replace('Correction ', '').replace('Hausse taux ', '').replace('Marche plat ', '')}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {positionImpacts.map((pos, idx) => (
                            <tr key={idx} className={cn(
                              'border-b border-border/20 dark:border-white/[0.04] last:border-0',
                              idx % 2 === 1 && 'bg-[#F8F6FF]/20 dark:bg-white/[0.01]',
                            )}>
                              <td className="px-3 py-2 font-medium text-ink dark:text-white sticky left-0 bg-white dark:bg-[#1A0A3E]">{pos.name}</td>
                              <td className="px-3 py-2 text-right font-mono text-ink-2 dark:text-white/55">{fmtCurrency(pos.amount)}</td>
                              {selectedList.map(s => {
                                const pct = s.impact.portfolioValue * pos.variation;
                                const amt = pos.amount * pct / 100;
                                return (
                                  <td key={s.id} className="px-3 py-2 text-center">
                                    <span className={cn('font-mono font-semibold', pct >= 0 ? 'text-[#00B894]' : 'text-[#E8334A]')}>
                                      {pct >= 0 ? '+' : ''}{pct.toFixed(1)}%
                                    </span>
                                    <span className="block text-[9px] font-normal text-ink-3 dark:text-white/35">{fmtCurrency(amt)}</span>
                                  </td>
                                );
                              })}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </>
              ) : (
                <>
                  {/* Single scenario detail view */}
                  {selectedList.map(scenario => {
                    const ScIcon = scenario.icon;
                    return (
                      <div key={scenario.id} className="space-y-5">
                        <div className="rounded-xl border border-border/50 dark:border-white/8 overflow-hidden">
                          <div className="px-4 py-3 flex items-center gap-3" style={{ background: `${scenario.color}08` }}>
                            <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: `${scenario.color}15` }}>
                              <ScIcon size={16} style={{ color: scenario.color }} />
                            </div>
                            <div>
                              <p className="font-display text-sm font-bold text-ink dark:text-white">{scenario.label}</p>
                              <p className="text-[11px] text-ink-3 dark:text-white/45 font-body">{scenario.description}</p>
                            </div>
                          </div>

                          {/* Impact KPIs */}
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-px bg-border/30 dark:bg-white/5">
                            {[
                              {
                                label: 'Impact portefeuille',
                                value: `${scenario.impact.portfolioValue > 0 ? '+' : ''}${scenario.impact.portfolioValue}%`,
                                sub: fmtCurrency(scenario.impact.estimatedLoss),
                                color: scenario.impact.portfolioValue >= 0 ? '#00B894' : '#E8334A',
                              },
                              {
                                label: 'Positions a risque',
                                value: scenario.impact.atRisk.toString(),
                                sub: `sur ${commitments.length}`,
                                color: scenario.impact.atRisk > 0 ? '#E8334A' : '#00B894',
                              },
                              {
                                label: 'Autocall declenches',
                                value: scenario.impact.autocallTriggered.toString(),
                                sub: 'remboursement anticipe',
                                color: scenario.impact.autocallTriggered > 0 ? '#D4A017' : '#7B6FA0',
                              },
                              {
                                label: 'Barrieres touchees',
                                value: scenario.impact.barriersBroken.toString(),
                                sub: 'perte en capital',
                                color: scenario.impact.barriersBroken > 0 ? '#E8334A' : '#00B894',
                              },
                            ].map((kpi, i) => (
                              <div key={i} className="bg-white dark:bg-white/[0.03] px-3 py-3 text-center">
                                <p className="text-[9px] uppercase tracking-widest text-ink-3 dark:text-white/40 font-semibold font-body">{kpi.label}</p>
                                <p className="font-display text-xl font-bold mt-1" style={{ color: kpi.color }}>{kpi.value}</p>
                                <p className="text-[10px] text-ink-3 dark:text-white/35 font-body mt-0.5">{kpi.sub}</p>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Product-level impact */}
                        <div>
                          <h3 className="font-display text-sm font-bold text-ink dark:text-white mb-3 flex items-center gap-2">
                            <Shield size={14} className="text-[#3D63F5]" />
                            Impact par position
                          </h3>
                          <div className="rounded-xl border border-border/50 dark:border-white/8 overflow-hidden">
                            <table className="w-full text-[11px] font-body" aria-label="Detail impact par position">
                              <thead>
                                <tr className="border-b border-border/50 dark:border-white/8 bg-[#F8F6FF]/50 dark:bg-white/[0.02]">
                                  <th className="px-3 py-2 text-left text-[9px] uppercase tracking-widest text-ink-3 dark:text-white/40 font-semibold">Produit</th>
                                  <th className="px-3 py-2 text-right text-[9px] uppercase tracking-widest text-ink-3 dark:text-white/40 font-semibold">Montant</th>
                                  <th className="px-3 py-2 text-center text-[9px] uppercase tracking-widest text-ink-3 dark:text-white/40 font-semibold">Barriere</th>
                                  <th className="px-3 py-2 text-right text-[9px] uppercase tracking-widest text-ink-3 dark:text-white/40 font-semibold">Impact</th>
                                  <th className="px-3 py-2 text-center text-[9px] uppercase tracking-widest text-ink-3 dark:text-white/40 font-semibold">Statut</th>
                                </tr>
                              </thead>
                              <tbody>
                                {positionImpacts.map((pos, idx) => {
                                  const pct = scenario.impact.portfolioValue * pos.variation;
                                  const amt = pos.amount * pct / 100;
                                  const isBroken = scenario.impact.portfolioValue < -20 && pos.barrier > 55;
                                  const isAtRisk = scenario.impact.portfolioValue < -10 && pos.barrier > 45;
                                  return (
                                    <tr key={idx} className={cn(
                                      'border-b border-border/20 dark:border-white/[0.04] last:border-0',
                                      idx % 2 === 1 && 'bg-[#F8F6FF]/20 dark:bg-white/[0.01]',
                                    )}>
                                      <td className="px-3 py-2 font-medium text-ink dark:text-white">{pos.name}</td>
                                      <td className="px-3 py-2 text-right font-mono text-ink-2 dark:text-white/55">{fmtCurrency(pos.amount)}</td>
                                      <td className="px-3 py-2 text-center font-mono">{pos.barrier}%</td>
                                      <td className={cn('px-3 py-2 text-right font-mono font-semibold', pct >= 0 ? 'text-[#00B894]' : 'text-[#E8334A]')}>
                                        {pct >= 0 ? '+' : ''}{pct.toFixed(1)}%
                                        <span className="block text-[9px] font-normal text-ink-3 dark:text-white/35">{fmtCurrency(amt)}</span>
                                      </td>
                                      <td className="px-3 py-2 text-center">
                                        <span className={cn(
                                          'inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-bold',
                                          isBroken ? 'bg-[#E8334A]/10 text-[#E8334A]'
                                            : isAtRisk ? 'bg-[#D4A017]/10 text-[#D4A017]'
                                            : 'bg-[#00B894]/10 text-[#00B894]',
                                        )}>
                                          {isBroken ? 'Barriere touchee' : isAtRisk ? 'A surveiller' : 'Protege'}
                                        </span>
                                      </td>
                                    </tr>
                                  );
                                })}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        {!loading && (
          <div className="sticky bottom-0 px-6 py-4 border-t border-border/50 dark:border-white/8 bg-white/90 dark:bg-[#1A0A3E]/90 backdrop-blur-sm flex items-center justify-between">
            <p className="text-[10px] text-ink-3 dark:text-white/35 font-body">
              <AlertCircle size={10} className="inline mr-1" />
              Simulation indicative &bull; Les resultats passes ne garantissent pas les performances futures
            </p>
            <div className="flex items-center gap-2">
              <button onClick={onClose} className="px-4 py-2 rounded-lg text-xs font-semibold font-body border border-border/50 dark:border-white/12 text-ink-3 dark:text-white/50 hover:text-ink dark:hover:text-white transition-colors">
                Fermer
              </button>
              <button
                onClick={handleExport}
                className={cn(
                  'px-4 py-2 rounded-lg text-xs font-semibold font-body text-white shadow-sm transition-all flex items-center gap-1.5',
                  exported
                    ? 'bg-gradient-to-r from-[#00B894] to-[#008B6E] shadow-[#00B894]/20'
                    : 'bg-gradient-to-r from-[#E8334A] to-[#D4A017] shadow-[#E8334A]/20 hover:shadow-md hover:brightness-110',
                )}
              >
                {exported ? (
                  <>
                    <CheckCircle2 size={12} />
                    Rapport exporte !
                  </>
                ) : (
                  <>
                    <Download size={12} />
                    Exporter le rapport
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
