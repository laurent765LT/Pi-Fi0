'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import {
  Layers,
  Calculator,
  TrendingUp,
  TrendingDown,
  BarChart3,
  Briefcase,
  Target,
  ArrowRight,
} from 'lucide-react';
import { useAuthStore } from '@/stores/auth-store';

// ─── Demo Data ───────────────────────────────────────────────────────────────

const MONTH_LABELS = [
  'Jan', 'Fev', 'Mar', 'Avr', 'Mai', 'Jun',
  'Jul', 'Aou', 'Sep', 'Oct', 'Nov', 'Dec',
];

const COLLECTION_DATA = [
  320_000, 480_000, 410_000, 620_000, 570_000, 740_000,
  680_000, 850_000, 920_000, 1_060_000, 980_000, 1_240_000,
];

const DONUT_DATA = [
  { label: 'Autocall Phoenix', pct: 34, color: '#3B1FA8' },
  { label: 'Capital Protégé', pct: 24, color: '#00B894' },
  { label: 'Autocall Coupon', pct: 18, color: '#5535C4' },
  { label: 'Taux Conditionnel', pct: 14, color: '#3D63F5' },
  { label: 'Barrier Note', pct: 10, color: '#D4A017' },
];

const RECENT_COMMITMENTS = [
  { id: 1, product: 'Athéna Relax ESG Mars 2026', amount: 250_000, date: '2026-04-11', status: 'CONFIRMED' },
  { id: 2, product: 'Phoenix Rendement Avril 2026', amount: 180_000, date: '2026-04-10', status: 'PENDING' },
  { id: 3, product: 'Sélection Euro Climat', amount: 320_000, date: '2026-04-08', status: 'CONFIRMED' },
  { id: 4, product: 'Autocall BNP Diversifié', amount: 150_000, date: '2026-04-06', status: 'REVIEW' },
  { id: 5, product: 'Phoenix Mensuel SG Q2 2026', amount: 200_000, date: '2026-04-04', status: 'PENDING' },
];

const POPULAR_PRODUCTS = [
  { rank: 1, name: 'Athéna Relax ESG Mars 2026', volume: '4,2M\u00A0€', pct: 92 },
  { rank: 2, name: 'Phoenix Rendement Avril 2026', volume: '3,1M\u00A0€', pct: 71 },
  { rank: 3, name: 'Sélection Euro Climat', volume: '2,6M\u00A0€', pct: 58 },
];

const KPI_CARDS = [
  {
    icon: Layers,
    label: 'Produits actifs',
    value: '17',
    trend: '+3',
    trendUp: true,
    trendLabel: 'ce mois',
    iconBg: 'bg-violet-pale',
    iconColor: 'text-violet',
  },
  {
    icon: BarChart3,
    label: 'Volume souscrit',
    value: '8,4M\u00A0€',
    trend: '+12%',
    trendUp: true,
    trendLabel: 'vs mois dernier',
    iconBg: 'bg-teal-light',
    iconColor: 'text-teal',
  },
  {
    icon: Briefcase,
    label: 'Engagements',
    value: '43',
    trend: '+7',
    trendUp: true,
    trendLabel: 'cette semaine',
    iconBg: 'bg-gold-light',
    iconColor: 'text-gold',
  },
  {
    icon: Target,
    label: 'Taux de conversion',
    value: '68%',
    trend: '-3%',
    trendUp: false,
    trendLabel: 'vs mois dernier',
    iconBg: 'bg-cobalt-pale',
    iconColor: 'text-cobalt-light',
  },
];

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatAmount(n: number): string {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
    maximumFractionDigits: 0,
  }).format(n);
}

function formatDateNice(iso: string): string {
  return new Date(iso).toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

function todayFormatted(): string {
  return new Date().toLocaleDateString('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

// ─── Status Badges ───────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<string, { label: string; classes: string }> = {
  CONFIRMED: {
    label: 'Confirmé',
    classes:
      'bg-teal-light text-teal dark:bg-teal/20 dark:text-teal',
  },
  PENDING: {
    label: 'En attente',
    classes:
      'bg-gold-light text-gold dark:bg-gold/20 dark:text-gold',
  },
  REVIEW: {
    label: 'En revue',
    classes:
      'bg-cobalt-pale text-cobalt-light dark:bg-cobalt-light/20 dark:text-cobalt-light',
  },
};

// ─── SVG Area Chart ──────────────────────────────────────────────────────────

function AreaChart() {
  const w = 560;
  const h = 220;
  const padL = 56;
  const padR = 16;
  const padT = 16;
  const padB = 32;

  const chartW = w - padL - padR;
  const chartH = h - padT - padB;
  const max = Math.max(...COLLECTION_DATA);

  const points = COLLECTION_DATA.map((val, i) => {
    const x = padL + (i / (COLLECTION_DATA.length - 1)) * chartW;
    const y = padT + chartH - (val / max) * chartH;
    return { x, y, val };
  });

  // Smooth cubic bezier path
  function smoothPath(pts: { x: number; y: number }[]): string {
    if (pts.length < 2) return '';
    let d = `M${pts[0]!.x},${pts[0]!.y}`;
    for (let i = 0; i < pts.length - 1; i++) {
      const p0 = pts[Math.max(0, i - 1)]!;
      const p1 = pts[i]!;
      const p2 = pts[i + 1]!;
      const p3 = pts[Math.min(pts.length - 1, i + 2)]!;
      const cp1x = p1.x + (p2.x - p0.x) / 6;
      const cp1y = p1.y + (p2.y - p0.y) / 6;
      const cp2x = p2.x - (p3.x - p1.x) / 6;
      const cp2y = p2.y - (p3.y - p1.y) / 6;
      d += ` C${cp1x},${cp1y} ${cp2x},${cp2y} ${p2.x},${p2.y}`;
    }
    return d;
  }

  const linePath = smoothPath(points);
  const areaPath =
    linePath +
    ` L${points[points.length - 1]!.x},${padT + chartH} L${points[0]!.x},${padT + chartH} Z`;

  // Y-axis ticks
  const yTicks = [0, 0.25, 0.5, 0.75, 1].map((f) => ({
    y: padT + chartH - f * chartH,
    label: `${((f * max) / 1_000_000).toFixed(1)}M`,
  }));

  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-auto" preserveAspectRatio="xMidYMid meet">
      <defs>
        <linearGradient id="area-fill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#3B1FA8" stopOpacity="0.18" />
          <stop offset="100%" stopColor="#3B1FA8" stopOpacity="0.01" />
        </linearGradient>
      </defs>

      {/* Grid lines */}
      {yTicks.map((t, i) => (
        <g key={i}>
          <line
            x1={padL}
            y1={t.y}
            x2={w - padR}
            y2={t.y}
            stroke="currentColor"
            className="text-border dark:text-border-2"
            strokeDasharray="4 4"
            strokeWidth="0.5"
          />
          <text
            x={padL - 8}
            y={t.y + 3}
            textAnchor="end"
            className="fill-ink-3 dark:fill-ink-3"
            fontSize="9"
            fontFamily="'DM Mono', monospace"
          >
            {t.label}
          </text>
        </g>
      ))}

      {/* Area + Line */}
      <path d={areaPath} fill="url(#area-fill)" />
      <path
        d={linePath}
        fill="none"
        stroke="#3B1FA8"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="dark:stroke-violet-light"
      />

      {/* Dots */}
      {points.map((p, i) => (
        <circle
          key={i}
          cx={p.x}
          cy={p.y}
          r="3.5"
          fill="white"
          stroke="#3B1FA8"
          strokeWidth="2"
          className="dark:fill-[#1E1636] dark:stroke-violet-light"
        />
      ))}

      {/* X labels */}
      {MONTH_LABELS.map((label, i) => {
        const x = padL + (i / (MONTH_LABELS.length - 1)) * chartW;
        return (
          <text
            key={i}
            x={x}
            y={h - 6}
            textAnchor="middle"
            className="fill-ink-3 dark:fill-ink-3"
            fontSize="9"
            fontFamily="'DM Mono', monospace"
          >
            {label}
          </text>
        );
      })}
    </svg>
  );
}

// ─── SVG Donut Chart ─────────────────────────────────────────────────────────

function DonutChart() {
  const [hovered, setHovered] = useState<number | null>(null);
  const radius = 62;
  const strokeWidth = 20;
  const circumference = 2 * Math.PI * radius;
  let offset = 0;

  return (
    <div className="flex flex-col items-center gap-5">
      <div className="relative">
        <svg width="170" height="170" viewBox="0 0 170 170">
          {DONUT_DATA.map((d, i) => {
            const dashLen = (d.pct / 100) * circumference;
            const dashGap = circumference - dashLen;
            const currentOffset = offset;
            offset += dashLen;
            const isHov = hovered === i;
            return (
              <circle
                key={i}
                cx="85"
                cy="85"
                r={radius}
                fill="none"
                stroke={d.color}
                strokeWidth={isHov ? strokeWidth + 5 : strokeWidth}
                strokeDasharray={`${dashLen} ${dashGap}`}
                strokeDashoffset={-currentOffset}
                strokeLinecap="butt"
                opacity={hovered !== null && !isHov ? 0.35 : 1}
                onMouseEnter={() => setHovered(i)}
                onMouseLeave={() => setHovered(null)}
                className="transition-all duration-300 cursor-pointer"
                style={{ transformOrigin: 'center', transform: 'rotate(-90deg)' }}
              />
            );
          })}
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          {hovered !== null ? (
            <>
              <span className="font-display text-2xl font-extrabold text-ink dark:text-ink">
                {DONUT_DATA[hovered]!.pct}%
              </span>
              <span className="text-[10px] text-ink-3 font-body mt-0.5">
                {DONUT_DATA[hovered]!.label}
              </span>
            </>
          ) : (
            <>
              <span className="font-display text-2xl font-extrabold text-ink dark:text-ink">5</span>
              <span className="text-[10px] text-ink-3 font-body mt-0.5">Types</span>
            </>
          )}
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap justify-center gap-x-4 gap-y-2">
        {DONUT_DATA.map((d, i) => (
          <div
            key={i}
            className="flex items-center gap-1.5 cursor-pointer group"
            onMouseEnter={() => setHovered(i)}
            onMouseLeave={() => setHovered(null)}
          >
            <span
              className="w-2.5 h-2.5 rounded-full shrink-0 transition-transform duration-200 group-hover:scale-125"
              style={{ backgroundColor: d.color }}
            />
            <span className="text-[11px] font-body text-ink-3 group-hover:text-ink transition-colors dark:group-hover:text-ink">
              {d.label}
              <span className="font-semibold text-ink-2 dark:text-ink ml-1">{d.pct}%</span>
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Page Component ──────────────────────────────────────────────────────────

export default function DashboardPage() {
  const user = useAuthStore((s) => s.user);
  const firstName = (user as any)?.firstName ?? 'Utilisateur';

  // Entrance animation
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <div className={`transition-opacity duration-500 ${mounted ? 'opacity-100' : 'opacity-0'}`}>
      {/* ── Page Header ─────────────────────────────────────────── */}
      <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="font-display text-2xl font-bold text-ink dark:text-ink">
            Bonjour, {firstName}{' '}
            <span role="img" aria-label="wave">
              👋
            </span>
          </h1>
          <p className="text-sm text-ink-3 font-body mt-1 capitalize">{todayFormatted()}</p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/pricing"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg border border-border dark:border-border-2 bg-white dark:bg-[#1E1636] text-ink-2 dark:text-ink font-body text-sm font-semibold hover:bg-surface-2 dark:hover:bg-[#2D2347] transition-all duration-200"
          >
            <Calculator size={15} />
            Pricing
          </Link>
          <Link
            href="/products"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-violet text-white font-body text-sm font-semibold hover:bg-violet-mid shadow-sm hover:shadow-violet transition-all duration-200"
          >
            <Layers size={15} />
            Voir les produits
          </Link>
        </div>
      </header>

      {/* ── KPI Cards ───────────────────────────────────────────── */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-10 stagger-children">
        {KPI_CARDS.map((kpi, i) => {
          const Icon = kpi.icon;
          return (
            <div
              key={i}
              className="group bg-white dark:bg-[#1E1636] rounded-xl border border-border/50 dark:border-border-2/50 shadow-sm p-5 flex flex-col gap-3 transition-all duration-300 hover:shadow-md hover:-translate-y-0.5 cursor-default"
            >
              <div className="flex items-center justify-between">
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center ${kpi.iconBg} dark:bg-opacity-20`}
                >
                  <Icon size={18} className={kpi.iconColor} />
                </div>
                <div
                  className={`flex items-center gap-1 text-xs font-semibold font-body ${
                    kpi.trendUp
                      ? 'text-teal dark:text-teal'
                      : 'text-red dark:text-red'
                  }`}
                >
                  {kpi.trendUp ? <TrendingUp size={13} /> : <TrendingDown size={13} />}
                  {kpi.trend}
                </div>
              </div>
              <div>
                <span className="font-display text-[10px] font-bold uppercase tracking-[0.2em] text-ink-3 dark:text-ink-3 block mb-1">
                  {kpi.label}
                </span>
                <span className="font-display text-2xl font-extrabold text-ink dark:text-ink leading-none tracking-tight">
                  {kpi.value}
                </span>
              </div>
              <span className="text-[10px] text-ink-4 dark:text-ink-3 font-body">{kpi.trendLabel}</span>
            </div>
          );
        })}
      </section>

      {/* ── Main 2-Column Layout ────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 mb-10">
        {/* ─ Left Column (3/5 = 60%) ─ */}
        <div className="lg:col-span-3 flex flex-col gap-6 stagger-children">
          {/* Collecte du mois */}
          <div className="bg-white dark:bg-[#1E1636] rounded-xl border border-border/50 dark:border-border-2/50 p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-display text-sm font-bold uppercase tracking-wider text-ink-3 dark:text-ink-3">
                Collecte du mois
              </h2>
              <span className="text-[11px] font-mono text-ink-4 dark:text-ink-3">2026</span>
            </div>
            <AreaChart />
          </div>

          {/* Derniers engagements */}
          <div className="bg-white dark:bg-[#1E1636] rounded-xl border border-border/50 dark:border-border-2/50 overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-border/50 dark:border-border-2/50">
              <h2 className="font-display text-sm font-bold uppercase tracking-wider text-ink-3 dark:text-ink-3">
                Derniers engagements
              </h2>
              <Link
                href="/portfolio"
                className="text-[11px] font-semibold text-violet dark:text-violet-light hover:text-violet-mid transition-colors flex items-center gap-1 font-body"
              >
                Voir tout <ArrowRight size={12} />
              </Link>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm font-body">
                <thead>
                  <tr className="bg-surface-2/50 dark:bg-[#2D2347]/40">
                    <th className="px-6 py-3 text-left text-[10px] uppercase tracking-[0.15em] text-ink-3 font-semibold">
                      Produit
                    </th>
                    <th className="px-6 py-3 text-right text-[10px] uppercase tracking-[0.15em] text-ink-3 font-semibold">
                      Montant
                    </th>
                    <th className="px-6 py-3 text-center text-[10px] uppercase tracking-[0.15em] text-ink-3 font-semibold">
                      Statut
                    </th>
                    <th className="px-6 py-3 text-right text-[10px] uppercase tracking-[0.15em] text-ink-3 font-semibold">
                      Date
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {RECENT_COMMITMENTS.map((c) => {
                    const status = STATUS_CONFIG[c.status] ?? {
                      label: c.status,
                      classes: 'bg-surface-2 text-ink-3',
                    };
                    return (
                      <tr
                        key={c.id}
                        className="border-b border-border/30 dark:border-border-2/30 hover:bg-violet-ghost/40 dark:hover:bg-violet/5 transition-colors duration-150"
                      >
                        <td className="px-6 py-3.5 font-medium text-ink dark:text-ink truncate max-w-[220px]">
                          {c.product}
                        </td>
                        <td className="px-6 py-3.5 text-right font-mono font-semibold text-ink dark:text-ink tabular-nums">
                          {formatAmount(c.amount)}
                        </td>
                        <td className="px-6 py-3.5 text-center">
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${status.classes}`}
                          >
                            {status.label}
                          </span>
                        </td>
                        <td className="px-6 py-3.5 text-right text-ink-3 text-xs tabular-nums font-mono">
                          {formatDateNice(c.date)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* ─ Right Column (2/5 = 40%) ─ */}
        <div className="lg:col-span-2 flex flex-col gap-6 stagger-children">
          {/* Répartition par type */}
          <div className="bg-white dark:bg-[#1E1636] rounded-xl border border-border/50 dark:border-border-2/50 p-6">
            <h2 className="font-display text-sm font-bold uppercase tracking-wider text-ink-3 dark:text-ink-3 mb-5">
              Répartition par type
            </h2>
            <DonutChart />
          </div>

          {/* Produits populaires */}
          <div className="bg-white dark:bg-[#1E1636] rounded-xl border border-border/50 dark:border-border-2/50 p-6">
            <h2 className="font-display text-sm font-bold uppercase tracking-wider text-ink-3 dark:text-ink-3 mb-4">
              Produits populaires
            </h2>
            <div className="flex flex-col gap-4">
              {POPULAR_PRODUCTS.map((p) => (
                <div key={p.rank} className="flex items-center gap-3 group">
                  <span className="w-7 h-7 rounded-lg bg-violet-pale dark:bg-violet/20 flex items-center justify-center font-display text-xs font-extrabold text-violet dark:text-violet-light shrink-0">
                    {p.rank}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-sm font-semibold text-ink dark:text-ink font-body truncate pr-2">
                        {p.name}
                      </span>
                      <span className="text-[11px] font-mono text-ink-3 dark:text-ink-3 shrink-0 tabular-nums">
                        {p.volume}
                      </span>
                    </div>
                    <div className="h-1.5 rounded-full bg-surface-2 dark:bg-[#2D2347] overflow-hidden">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-violet to-cobalt-light transition-all duration-700 group-hover:opacity-90"
                        style={{ width: `${p.pct}%` }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
