'use client';

import { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import {
  Package,
  TrendingUp,
  Calendar,
  Wallet,
  Clock,
  Download,
  ArrowUpRight,
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

function PremiumTh({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <th className={cn(
      'px-3 py-2.5 text-[10px] uppercase tracking-[0.18em] font-bold',
      'text-[#1A0A3E]/50 dark:text-white/45 font-body whitespace-nowrap',
      className,
    )}>
      {children}
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
        <div className="grid grid-cols-7 gap-0">
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

function AiPortfolioHealth() {
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

      {/* By Payoff Type */}
      <div className="bg-white/90 dark:bg-white/[0.04] backdrop-blur-sm rounded-xl border border-border/50 dark:border-white/8 ring-1 ring-black/[0.03] dark:ring-white/[0.04] overflow-hidden shadow-sm">
        <div className="px-4 py-3 border-b border-border/50 dark:border-white/8 bg-gradient-to-r from-[#F8F6FF]/80 to-transparent dark:from-white/[0.02] dark:to-transparent">
          <h3 className="font-display text-[13px] font-bold text-ink dark:text-white flex items-center gap-1.5">
            <Layers size={12} className="text-[#3B1FA8]" />
            Par type de payoff
          </h3>
        </div>
        <div className="p-4 space-y-2.5">
          {allocData.payoffs.map((payoff) => (
            <div key={payoff.name}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-[11px] font-body text-ink dark:text-white font-medium">
                  {PAYOFF_LABELS[payoff.name] ?? payoff.name}
                </span>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-mono text-ink-3 dark:text-white/35 tabular-nums">{payoff.count} produit{payoff.count > 1 ? 's' : ''}</span>
                  <span className="text-[10px] font-mono font-semibold tabular-nums" style={{ color: payoff.color }}>
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

  // Map products by id for quick lookups
  const productMap = useMemo(() => {
    const map = new Map<string, any>();
    for (const p of products as any[]) {
      map.set(p.id, p);
    }
    return map;
  }, [products]);

  // Animated counter for "Total Engage" KPI
  const animatedTotal = useAnimatedCounter(stats.total, 800, !loadingCommitments);

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
    <div className="animate-fade-in space-y-4">
      {/* ── Header ─────────────────────────────────────────────────── */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-4">
            <h1 className="font-display text-[24px] font-bold leading-none bg-gradient-to-r from-[#3B1FA8] via-[#1A0A3E] to-[#3B1FA8] bg-clip-text text-transparent dark:from-white dark:via-[#C9BCFF] dark:to-white whitespace-nowrap">
              Mon Portfolio
            </h1>
            <div className="h-5 w-px bg-border/60 dark:bg-white/10 shrink-0" />
            <p className="text-[12px] text-ink-3 dark:text-white/45 font-body truncate hidden sm:block">
              Suivez vos investissements et engagements en produits structures.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          {['Rapport global', 'Export Excel'].map((label) => (
            <button
              key={label}
              className={cn(
                'h-8 px-3 rounded-lg border border-border/50 dark:border-white/12',
                'bg-white/70 dark:bg-white/[0.04] backdrop-blur-sm text-ink-3 dark:text-white/55',
                'text-[11px] font-medium font-body flex items-center gap-1.5',
                'hover:border-[#3B1FA8]/35 hover:text-[#3B1FA8] dark:hover:text-[#C9BCFF]',
                'hover:shadow-sm transition-all duration-150',
              )}
            >
              <Download size={12} />
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Gradient divider */}
      <div
        className="h-[2px] rounded-full -mt-1 mb-1"
        style={{
          background: 'linear-gradient(90deg, #3B1FA8, #00B894 40%, #D4A017 70%, transparent)',
        }}
      />

      {/* ── KPI Cards ──────────────────────────────────────────────── */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 stagger-grid">
        <KpiCard
          icon={<Wallet size={15} className="text-[#3B1FA8]" />}
          label="Total engage"
          value={loadingCommitments ? '...' : formatAmount(animatedTotal)}
          accent="#3B1FA8"
          trend="up"
          trendLabel="+12.3%"
          sparkData={sparklinePoints('total-engaged', 12)}
        />
        <KpiCard
          icon={<CheckCircle2 size={15} className="text-[#00B894]" />}
          label="Confirmes"
          value={loadingCommitments ? '...' : stats.confirmed}
          accent="#00B894"
          trend="up"
          trendLabel="+2"
          sparkData={sparklinePoints('confirmed', 12)}
        />
        <KpiCard
          icon={<Clock size={15} className="text-[#D4A017]" />}
          label="En attente"
          value={loadingCommitments ? '...' : stats.waiting}
          accent="#D4A017"
          trend="neutral"
          trendLabel="stable"
          sparkData={sparklinePoints('waiting', 12)}
        />
        <KpiCard
          icon={<X size={15} className="text-[#E8334A]" />}
          label="Annules"
          value={loadingCommitments ? '...' : stats.cancelled}
          accent="#E8334A"
        />
      </section>

      {/* ── AI Portfolio Health ───────────────────────────────────────── */}
      <AiPortfolioHealth />

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
            <div className="overflow-x-auto">
              <table className="w-full text-[12px] font-body">
                <thead>
                  <tr className="border-b border-border/50 dark:border-white/8 bg-gradient-to-r from-[#F8F6FF]/50 to-[#F0ECFF]/20 dark:from-white/[0.015] dark:to-transparent">
                    <PremiumTh className="text-left">Produit</PremiumTh>
                    <PremiumTh className="text-left">Sous-jacent</PremiumTh>
                    <PremiumTh className="text-right">Montant</PremiumTh>
                    <PremiumTh className="text-center">SRI</PremiumTh>
                    <PremiumTh className="text-right">Coupon</PremiumTh>
                    <PremiumTh className="text-right">Barriere</PremiumTh>
                    <PremiumTh className="text-center">Statut</PremiumTh>
                    <PremiumTh className="text-center">Rang</PremiumTh>
                    <PremiumTh className="text-right">Date</PremiumTh>
                    <PremiumTh className="text-center">Action</PremiumTh>
                  </tr>
                </thead>
                <tbody className="stagger-rows">
                  {commitments.map((c: any, rowIdx: number) => {
                    const status = c.status ?? 'PENDING';
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
          )}
        </div>
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
            <button className={cn(
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
              <table className="w-full text-[12px] font-body">
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
            <button className={cn(
              'h-7 px-2.5 rounded-lg border border-border/50 dark:border-white/12 bg-white/70 dark:bg-white/[0.04] text-ink-3 dark:text-white/45',
              'text-[10px] font-medium font-body flex items-center gap-1',
              'hover:text-[#3B1FA8] dark:hover:text-[#C9BCFF] hover:border-[#3B1FA8]/35 transition-all duration-150',
            )}>
              <Download size={11} />
              Export Excel
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-[12px] font-body">
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
    </div>
  );
}
