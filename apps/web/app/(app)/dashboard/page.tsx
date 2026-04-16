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
  Brain,
  Sparkles,
  Shield,
  AlertTriangle,
  Zap,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  CalendarDays,
  Package,
  Search,
  Inbox,
} from 'lucide-react';
import { cn } from '@/lib/cn';
import { PageHeader } from '@/components/ui/page-header';
import { useAuthStore } from '@/stores/auth-store';
import { useProducts } from '@/hooks/use-products';
import { useMyCommitments } from '@/hooks/use-commitments';
import { useFavorites } from '@/hooks/use-favorites';
import { MarketTicker } from '@/components/ui/market-ticker';
import { useAnimatedCounter } from '@/hooks/use-animated-counter';
import { Tooltip } from '@/components/ui/tooltip';
import { Sparkline } from '@/components/ui/sparkline';

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
  { label: 'Capital Protege', pct: 24, color: '#00B894' },
  { label: 'Autocall Coupon', pct: 18, color: '#5535C4' },
  { label: 'Taux Conditionnel', pct: 14, color: '#3D63F5' },
  { label: 'Barrier Note', pct: 10, color: '#D4A017' },
];

const RECENT_COMMITMENTS = [
  { id: 1, product: 'Athena Relax ESG Mars 2026', amount: 250_000, date: '2026-04-11', status: 'CONFIRMED' },
  { id: 2, product: 'Phoenix Rendement Avril 2026', amount: 180_000, date: '2026-04-10', status: 'PENDING' },
  { id: 3, product: 'Selection Euro Climat', amount: 320_000, date: '2026-04-08', status: 'CONFIRMED' },
  { id: 4, product: 'Autocall BNP Diversifie', amount: 150_000, date: '2026-04-06', status: 'REVIEW' },
  { id: 5, product: 'Phoenix Mensuel SG Q2 2026', amount: 200_000, date: '2026-04-04', status: 'PENDING' },
];

const POPULAR_PRODUCTS = [
  { rank: 1, name: 'Athena Relax ESG Mars 2026', volume: '4,2M\u00A0\u20AC', pct: 92 },
  { rank: 2, name: 'Phoenix Rendement Avril 2026', volume: '3,1M\u00A0\u20AC', pct: 71 },
  { rank: 3, name: 'Selection Euro Climat', volume: '2,6M\u00A0\u20AC', pct: 58 },
];

const KPI_CARDS = [
  {
    icon: Layers,
    label: 'Produits actifs',
    value: '17',
    trend: '+3',
    trendUp: true,
    trendLabel: 'ce mois',
    accentFrom: 'from-violet',
    accentTo: 'to-violet-mid',
    iconBg: 'bg-violet-pale dark:bg-violet/15',
    iconColor: 'text-violet dark:text-violet-light',
  },
  {
    icon: BarChart3,
    label: 'Volume souscrit',
    value: '8,4M\u00A0\u20AC',
    trend: '+12%',
    trendUp: true,
    trendLabel: 'vs mois dernier',
    accentFrom: 'from-teal',
    accentTo: 'to-teal',
    iconBg: 'bg-teal-light dark:bg-teal/15',
    iconColor: 'text-teal',
  },
  {
    icon: Briefcase,
    label: 'Engagements',
    value: '43',
    trend: '+7',
    trendUp: true,
    trendLabel: 'cette semaine',
    accentFrom: 'from-gold',
    accentTo: 'to-gold',
    iconBg: 'bg-gold-light dark:bg-gold/15',
    iconColor: 'text-gold',
  },
  {
    icon: Target,
    label: 'Taux de conversion',
    value: '68%',
    trend: '-3%',
    trendUp: false,
    trendLabel: 'vs mois dernier',
    accentFrom: 'from-cobalt-light',
    accentTo: 'to-cobalt',
    iconBg: 'bg-cobalt-pale dark:bg-cobalt-light/15',
    iconColor: 'text-cobalt-light',
  },
];

const KPI_LINKS: Record<string, string> = {
  'Produits actifs': '/products',
  'Volume souscrit': '/portfolio',
  'Engagements': '/portfolio',
  'Taux de conversion': '/commissions',
};

// ─── Sort types for commitments table ──────────────────────────────────────

type SortCol = 'product' | 'amount' | 'date' | 'status';
type SortDir = 'asc' | 'desc';

const AI_MARKET_INSIGHTS = [
  {
    icon: TrendingUp,
    title: 'Euro Stoxx 50 en zone de resistance',
    analysis:
      'Signal haussier confirme, le support des 4\u00A0800 pts tient. Les autocalls sur indice beneficient de la dynamique.',
    sentiment: 'bullish' as const,
    confidence: 87,
  },
  {
    icon: Zap,
    title: 'Volatilite implicite en hausse',
    analysis:
      'Hausse de +2.1 pts sur le VSTOXX : fenetre attractive pour structurer des coupons eleves sur les Phoenix.',
    sentiment: 'bullish' as const,
    confidence: 92,
  },
  {
    icon: Shield,
    title: 'Spreads de credit stables',
    analysis:
      'Spread de credit BNP/SG stables : pas de tension sur les emetteurs principaux. Conditions de funding favorables.',
    sentiment: 'neutral' as const,
    confidence: 78,
  },
  {
    icon: AlertTriangle,
    title: 'Risque geopolitique modere',
    analysis:
      'Les barrieres \u2265 60% restent confortables a horizon 3 ans. Surveillance accrue sur le secteur energie.',
    sentiment: 'neutral' as const,
    confidence: 71,
  },
];

const SENTIMENT_CONFIG = {
  bullish: { label: 'Haussier', dotClass: 'bg-teal', textClass: 'text-teal' },
  bearish: { label: 'Baissier', dotClass: 'bg-red', textClass: 'text-red' },
  neutral: { label: 'Neutre', dotClass: 'bg-gold', textClass: 'text-gold' },
};

// ─── Quick Actions ──────────────────────────────────────────────────────────

const QUICK_ACTIONS = [
  { label: 'Nouveau produit', href: '/admin/products', icon: Package, accentFrom: 'from-violet', accentTo: 'to-violet-mid' },
  { label: 'Pricer', href: '/pricing', icon: Calculator, accentFrom: 'from-teal', accentTo: 'to-teal' },
  { label: 'Voir le catalogue', href: '/products', icon: Search, accentFrom: 'from-cobalt-light', accentTo: 'to-cobalt-light' },
];

// ─── Empty State Component ──────────────────────────────────────────────────

function EmptyState({
  icon: Icon,
  title,
  description,
}: {
  icon: React.ComponentType<any>;
  title: string;
  description: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-14 text-center">
      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#3B1FA8]/10 to-[#00B894]/10 border border-border/40 flex items-center justify-center">
        <Icon size={20} className="text-ink-3 opacity-40" />
      </div>
      <div>
        <p className="font-display text-[13px] font-bold text-ink dark:text-white">
          {title}
        </p>
        <p className="font-body text-[11px] text-ink-3 dark:text-white/40 mt-0.5 max-w-xs">
          {description}
        </p>
      </div>
    </div>
  );
}

// ─── Sortable Column Header Component ───────────────────────────────────────

function SortableHeader({
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
  align?: 'left' | 'right' | 'center';
}) {
  const isActive = sortCol === col;
  const alignClass = align === 'right' ? 'justify-end' : align === 'center' ? 'justify-center' : 'justify-start';
  return (
    <th
      className={cn(
        'px-4 py-2 text-[9px] uppercase tracking-[0.15em] font-semibold cursor-pointer select-none',
        'transition-colors duration-200 hover:text-violet dark:hover:text-violet-light',
        isActive ? 'text-violet dark:text-violet-light' : 'text-ink-4 dark:text-ink-3'
      )}
      onClick={() => onSort(col)}
    >
      <span className={cn('inline-flex items-center gap-1', alignClass)}>
        {label}
        <span className="transition-transform duration-200">
          {isActive ? (
            sortDir === 'asc' ? (
              <ArrowUp size={10} className="text-violet dark:text-violet-light" />
            ) : (
              <ArrowDown size={10} className="text-violet dark:text-violet-light" />
            )
          ) : (
            <ArrowUpDown size={10} className="opacity-30" />
          )}
        </span>
      </span>
    </th>
  );
}

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
    label: 'Confirme',
    classes:
      'bg-teal/10 text-teal ring-1 ring-teal/20 dark:bg-teal/15 dark:text-teal dark:ring-teal/25',
  },
  PENDING: {
    label: 'En attente',
    classes:
      'bg-gold/10 text-gold ring-1 ring-gold/20 dark:bg-gold/15 dark:text-gold dark:ring-gold/25',
  },
  REVIEW: {
    label: 'En revue',
    classes:
      'bg-cobalt-light/10 text-cobalt-light ring-1 ring-cobalt-light/20 dark:bg-cobalt-light/15 dark:text-cobalt-light dark:ring-cobalt-light/25',
  },
};

// ─── Section Header Component ───────────────────────────────────────────────

function SectionHeader({
  children,
  dotColor = 'bg-violet',
  action,
}: {
  children: React.ReactNode;
  dotColor?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between mb-3">
      <div className="flex items-center gap-2">
        <span className={cn('w-1.5 h-1.5 rounded-full', dotColor)} />
        <h2 className="font-display text-[10px] font-bold uppercase tracking-[0.2em] text-ink-3 dark:text-ink-3">
          {children}
        </h2>
      </div>
      {action}
    </div>
  );
}

// ─── SVG Area Chart ──────────────────────────────────────────────────────────

function AreaChart() {
  const [hoveredPoint, setHoveredPoint] = useState<number | null>(null);
  const w = 560;
  const h = 200;
  const padL = 52;
  const padR = 12;
  const padT = 12;
  const padB = 28;

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
          <stop offset="0%" stopColor="#3B1FA8" stopOpacity="0.22" />
          <stop offset="60%" stopColor="#3B1FA8" stopOpacity="0.06" />
          <stop offset="100%" stopColor="#3B1FA8" stopOpacity="0" />
        </linearGradient>
        <linearGradient id="line-grad" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#3B1FA8" />
          <stop offset="100%" stopColor="#3D63F5" />
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
            strokeDasharray="3 3"
            strokeWidth="0.5"
          />
          <text
            x={padL - 6}
            y={t.y + 3}
            textAnchor="end"
            className="fill-ink-4 dark:fill-ink-3"
            fontSize="8"
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
        stroke="url(#line-grad)"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="dark:stroke-violet-light"
      />

      {/* Dots + Hover tooltips */}
      {points.map((p, i) => (
        <g key={i}>
          {/* Visible dot */}
          <circle
            cx={p.x}
            cy={p.y}
            r="3"
            fill="white"
            stroke="#3B1FA8"
            strokeWidth="1.5"
            className={cn(
              'dark:fill-[#1E1636] dark:stroke-violet-light transition-opacity duration-150',
              hoveredPoint !== null && hoveredPoint !== i ? 'opacity-40' : 'opacity-100'
            )}
          />
          {/* Invisible larger hit area for hover */}
          <circle
            cx={p.x}
            cy={p.y}
            r="12"
            fill="transparent"
            className="cursor-pointer"
            onMouseEnter={() => setHoveredPoint(i)}
            onMouseLeave={() => setHoveredPoint(null)}
          />
          {/* Hover tooltip */}
          {hoveredPoint === i && (
            <>
              {/* Highlight ring */}
              <circle
                cx={p.x}
                cy={p.y}
                r="5"
                fill="#3B1FA8"
                fillOpacity="0.15"
                stroke="#3B1FA8"
                strokeWidth="1.5"
                className="dark:fill-violet-light/20 dark:stroke-violet-light"
              />
              {/* Value label */}
              <rect
                x={p.x - 28}
                y={p.y - 26}
                width="56"
                height="18"
                rx="4"
                fill="#1A0A3E"
                fillOpacity="0.92"
              />
              <text
                x={p.x}
                y={p.y - 14}
                textAnchor="middle"
                fill="white"
                fontSize="9"
                fontFamily="'DM Mono', monospace"
                fontWeight="600"
              >
                {(p.val / 1_000).toFixed(0)}k €
              </text>
            </>
          )}
        </g>
      ))}

      {/* X labels */}
      {MONTH_LABELS.map((label, i) => {
        const x = padL + (i / (MONTH_LABELS.length - 1)) * chartW;
        return (
          <text
            key={i}
            x={x}
            y={h - 4}
            textAnchor="middle"
            className="fill-ink-4 dark:fill-ink-3"
            fontSize="8"
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

function DonutChart({ data }: { data: typeof DONUT_DATA }) {
  const [hovered, setHovered] = useState<number | null>(null);
  const radius = 52;
  const strokeWidth = 16;
  const circumference = 2 * Math.PI * radius;
  let offset = 0;

  return (
    <div className="flex items-center gap-4">
      {/* Donut */}
      <div className="relative shrink-0">
        <svg width="130" height="130" viewBox="0 0 130 130">
          {data.map((d, i) => {
            const dashLen = (d.pct / 100) * circumference;
            const dashGap = circumference - dashLen;
            const currentOffset = offset;
            offset += dashLen;
            const isHov = hovered === i;
            return (
              <circle
                key={i}
                cx="65"
                cy="65"
                r={radius}
                fill="none"
                stroke={d.color}
                strokeWidth={isHov ? strokeWidth + 4 : strokeWidth}
                strokeDasharray={`${dashLen} ${dashGap}`}
                strokeDashoffset={-currentOffset}
                strokeLinecap="butt"
                opacity={hovered !== null && !isHov ? 0.3 : 1}
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
              <span className="font-display text-lg font-extrabold text-ink dark:text-ink tabular-nums">
                {data[hovered]!.pct}%
              </span>
              <span className="text-[9px] text-ink-3 font-body mt-0.5 max-w-[60px] text-center leading-tight">
                {data[hovered]!.label}
              </span>
            </>
          ) : (
            <>
              <span className="font-display text-lg font-extrabold text-ink dark:text-ink">{data.length}</span>
              <span className="text-[9px] text-ink-3 font-body mt-0.5">Types</span>
            </>
          )}
        </div>
      </div>

      {/* Legend — vertical, compact */}
      <div className="flex flex-col gap-1.5 min-w-0">
        {data.map((d, i) => (
          <div
            key={i}
            className="flex items-center gap-2 cursor-pointer group"
            onMouseEnter={() => setHovered(i)}
            onMouseLeave={() => setHovered(null)}
          >
            <span
              className="w-2 h-2 rounded-full shrink-0 transition-transform duration-200 group-hover:scale-125"
              style={{ backgroundColor: d.color }}
            />
            <span className="text-[11px] font-body text-ink-3 group-hover:text-ink transition-colors dark:group-hover:text-ink truncate">
              {d.label}
            </span>
            <span className="text-[11px] font-mono font-semibold text-ink-2 dark:text-ink tabular-nums ml-auto shrink-0">
              {d.pct}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Animated KPI Value ─────────────────────────────────────────────────────

function AnimatedKpiValue({ value, enabled }: { value: string; enabled: boolean }) {
  // Parse numeric part and suffix from KPI value strings like "17", "8,4M €", "43", "68%"
  const match = value.match(/^([\d,]+(?:[.,]\d+)?)\s*(.*)/);
  if (!match) return <>{value}</>;
  const rawNum = match[1]!.replace(',', '.');
  const target = parseFloat(rawNum);
  const suffix = match[2] ?? '';
  const hasDecimal = rawNum.includes('.');

  const animated = useAnimatedCounter(target, 1200, enabled);

  // Format back with French comma for decimals
  const formatted = hasDecimal
    ? animated.toFixed(1).replace('.', ',')
    : String(animated);

  return (
    <>
      {formatted}
      {suffix ? `\u00A0${suffix}` : ''}
    </>
  );
}

// ─── Sparkline Demo Data ────────────────────────────────────────────────────

const PRODUCT_SPARKLINE_DATA: Record<number, number[]> = {
  1: [12, 18, 15, 22, 28, 24, 32, 35, 30, 38],
  2: [8, 10, 14, 12, 18, 22, 19, 25, 23, 28],
  3: [5, 9, 7, 13, 11, 16, 15, 20, 18, 22],
};

// ─── Page Component ──────────────────────────────────────────────────────────

export default function DashboardPage() {
  const user = useAuthStore((s) => s.user);
  const firstName = (user as any)?.firstName ?? 'Utilisateur';

  // ── Live data from API hooks (with demo fallbacks) ──
  const { data: productsData } = useProducts();
  const { data: commitmentsData } = useMyCommitments();
  const { data: favoritesData } = useFavorites();

  const products = productsData?.data ?? [];
  const commitments = (commitmentsData as any[]) ?? [];
  const favorites = (favoritesData as any[]) ?? [];

  const activeProducts = products.filter((p: any) => p.status === 'ACTIVE' || p.status === 'OPEN').length || 17;
  const totalVolume = commitments.reduce((s: number, c: any) => s + (c.amount ?? 0), 0) || 8_400_000;
  const totalCommitments = commitments.length || 43;
  const favCount = favorites.length || 5;

  // Format volume for display (e.g. 8400000 -> "8,4M")
  const formattedVolume = totalVolume >= 1_000_000
    ? `${(totalVolume / 1_000_000).toFixed(1).replace('.', ',')}M\u00A0\u20AC`
    : `${(totalVolume / 1_000).toFixed(0)}k\u00A0\u20AC`;

  // Dynamic KPI cards — same shape as the static KPI_CARDS but with live values
  const dynamicKpiCards = useMemo(() => KPI_CARDS.map((kpi) => {
    switch (kpi.label) {
      case 'Produits actifs':
        return { ...kpi, value: String(activeProducts) };
      case 'Volume souscrit':
        return { ...kpi, value: formattedVolume };
      case 'Engagements':
        return { ...kpi, value: String(totalCommitments) };
      default:
        return kpi;
    }
  }), [activeProducts, formattedVolume, totalCommitments]);

  // Dynamic donut chart data — computed from products by payoff type, fallback to hardcoded
  const donutData = useMemo(() => {
    if (!products.length) return DONUT_DATA;
    const byType: Record<string, number> = {};
    products.forEach((p: any) => {
      const key = p.payoffType ?? 'Autre';
      byType[key] = (byType[key] ?? 0) + 1;
    });
    const total = products.length;
    const palette = ['#3B1FA8', '#00B894', '#5535C4', '#3D63F5', '#D4A017', '#E17055', '#6C5CE7'];
    return Object.entries(byType).map(([label, count], i) => ({
      label,
      pct: Math.round((count / total) * 100),
      color: palette[i % palette.length]!,
    }));
  }, [products]);

  // SEO: dynamic document title
  useEffect(() => { document.title = "Dashboard | Strick'in"; }, []);

  // Entrance animation
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  // Sort state for commitments table
  const [sortCol, setSortCol] = useState<SortCol>('date');
  const [sortDir, setSortDir] = useState<SortDir>('desc');

  const handleSort = (col: SortCol) => {
    if (sortCol === col) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortCol(col);
      setSortDir('desc');
    }
  };

  const sortedCommitments = useMemo(() => {
    const items = [...RECENT_COMMITMENTS];
    items.sort((a, b) => {
      let cmp = 0;
      switch (sortCol) {
        case 'product':
          cmp = a.product.localeCompare(b.product, 'fr');
          break;
        case 'amount':
          cmp = a.amount - b.amount;
          break;
        case 'date':
          cmp = a.date.localeCompare(b.date);
          break;
        case 'status':
          cmp = a.status.localeCompare(b.status);
          break;
      }
      return sortDir === 'asc' ? cmp : -cmp;
    });
    return items;
  }, [sortCol, sortDir]);

  return (
    <div className={cn('transition-opacity duration-500', mounted ? 'opacity-100' : 'opacity-0')}>
      {/* ── Market Ticker ───────────────────────────────────────── */}
      <MarketTicker className="rounded-xl mb-4" />

      <PageHeader
        icon={BarChart3}
        title={`Bonjour, ${firstName}`}
        subtitle={todayFormatted()}
        accentFrom="#3B1FA8"
        accentTo="#1A0A3E"
        className="mb-5"
      >
        <Link
          href="/pricing"
          className={cn(
            'inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg',
            'border border-border/60 dark:border-border-2/60',
            'bg-white dark:bg-white/5 backdrop-blur-sm',
            'text-ink-2 dark:text-ink font-body text-xs font-semibold',
            'hover:bg-surface-2 dark:hover:bg-white/10 hover:shadow-sm',
            'transition-all duration-200'
          )}
        >
          <Calculator size={14} />
          Pricing
        </Link>
        <Link
          href="/products"
          className={cn(
            'inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg',
            'bg-violet text-white font-body text-xs font-semibold',
            'hover:bg-violet-mid shadow-sm hover:shadow-violet',
            'transition-all duration-200'
          )}
        >
          <Layers size={14} />
          Voir les produits
        </Link>
      </PageHeader>

      {/* ── KPI Cards — unified glass container ───────────────── */}
      <section className="mb-5">
        <div className="relative rounded-xl bg-white/80 dark:bg-white/[0.03] backdrop-blur-md border border-border/50 dark:border-border-2/40 shadow-card overflow-hidden">
          {/* Top gradient accent bar */}
          <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-violet via-cobalt-light to-teal" />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 divide-x-0 sm:divide-x divide-border/40 dark:divide-border-2/30 divide-y sm:divide-y-0">
            {dynamicKpiCards.map((kpi, i) => {
              const Icon = kpi.icon;
              const kpiHref = KPI_LINKS[kpi.label] ?? '/dashboard';
              return (
                <Link
                  key={i}
                  href={kpiHref}
                  className={cn(
                    'group relative px-4 py-3.5 flex items-center gap-3',
                    'hover:bg-violet-ghost/30 dark:hover:bg-violet/5',
                    'transition-all duration-200 cursor-pointer',
                    'hover:scale-[1.02] active:scale-[0.99]'
                  )}
                >
                  {/* Icon */}
                  <div
                    className={cn(
                      'w-9 h-9 rounded-lg flex items-center justify-center shrink-0',
                      kpi.iconBg
                    )}
                  >
                    <Icon size={16} className={kpi.iconColor} />
                  </div>
                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <span className="font-display text-[9px] font-bold uppercase tracking-[0.2em] text-ink-4 dark:text-ink-3 block">
                      {kpi.label}
                    </span>
                    <div className="flex items-baseline gap-2 mt-0.5">
                      <span className="font-display text-xl font-extrabold text-ink dark:text-ink leading-none tabular-nums">
                        <AnimatedKpiValue value={kpi.value} enabled={mounted} />
                      </span>
                      <Tooltip content={kpi.trendLabel}>
                        <span
                          className={cn(
                            'inline-flex items-center gap-0.5 text-[10px] font-semibold font-body tabular-nums',
                            kpi.trendUp ? 'text-teal' : 'text-red'
                          )}
                        >
                          {kpi.trendUp ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
                          {kpi.trend}
                        </span>
                      </Tooltip>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-[9px] text-ink-4 dark:text-ink-4 font-body">{kpi.trendLabel}</span>
                      <span className="text-[9px] font-semibold font-body text-violet dark:text-violet-light opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center gap-0.5">
                        Voir details <ArrowRight size={9} />
                      </span>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── Quick Actions Bar ───────────────────────────────────── */}
      <section className="mb-5">
        <div className="flex items-center gap-2 flex-wrap">
          {QUICK_ACTIONS.map((action) => {
            const Icon = action.icon;
            return (
              <Link
                key={action.href}
                href={action.href}
                className={cn(
                  'inline-flex items-center gap-2 px-4 py-2 rounded-full',
                  'bg-white/80 dark:bg-white/[0.04] backdrop-blur-sm',
                  'border border-border/50 dark:border-border-2/40',
                  'text-xs font-semibold font-body text-ink-2 dark:text-ink',
                  'hover:bg-violet-ghost/40 dark:hover:bg-violet/8',
                  'hover:border-violet/30 dark:hover:border-violet-light/20',
                  'hover:text-violet dark:hover:text-violet-light',
                  'hover:shadow-sm hover:scale-[1.02]',
                  'active:scale-[0.98]',
                  'transition-all duration-200'
                )}
              >
                <Icon size={14} />
                {action.label}
              </Link>
            );
          })}
        </div>
      </section>

      {/* ── AI Market Pulse — tightly integrated ─────────────── */}
      <section className="mb-5">
        <div className="relative rounded-xl bg-white/80 dark:bg-white/[0.03] backdrop-blur-md border border-border/50 dark:border-border-2/40 shadow-card overflow-hidden">
          {/* Gradient accent bar */}
          <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-violet via-cobalt-light to-teal" />

          <div className="grid grid-cols-1 lg:grid-cols-4">
            {/* Main pulse content — 3 cols */}
            <div className="lg:col-span-3 p-4">
              {/* Header */}
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet to-cobalt-light flex items-center justify-center shadow-sm">
                    <Brain size={15} className="text-white" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="font-display text-[10px] font-bold uppercase tracking-[0.2em] text-ink dark:text-ink">
                        Pulse IA Marche
                      </h2>
                      <span className="inline-flex items-center gap-1 px-1.5 py-px rounded-full bg-teal/10 dark:bg-teal/15 text-[9px] font-bold uppercase tracking-wider text-teal">
                        <span className="relative flex h-1.5 w-1.5">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-teal opacity-75" />
                          <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-teal" />
                        </span>
                        Live
                      </span>
                    </div>
                    <p className="text-[10px] text-ink-4 dark:text-ink-4 font-body mt-px">
                      Derniere analyse : il y a 12 min
                    </p>
                  </div>
                </div>
                <Link
                  href="/research"
                  className="hidden sm:inline-flex items-center gap-1 text-[10px] font-semibold text-violet dark:text-violet-light hover:text-violet-mid transition-colors font-body"
                >
                  Voir l&apos;analyse complete <ArrowRight size={11} />
                </Link>
              </div>

              {/* Insights Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {AI_MARKET_INSIGHTS.map((insight, i) => {
                  const Icon = insight.icon;
                  const sentiment = SENTIMENT_CONFIG[insight.sentiment];
                  return (
                    <div
                      key={i}
                      className={cn(
                        'group relative rounded-lg border border-border/30 dark:border-border-2/30 p-3',
                        'bg-white/40 dark:bg-white/[0.02]',
                        'hover:bg-violet-ghost/30 dark:hover:bg-violet/5',
                        'transition-all duration-200 cursor-default'
                      )}
                    >
                      <div className="flex items-start gap-2.5">
                        <div className="w-7 h-7 rounded-md bg-violet-pale/60 dark:bg-violet/10 flex items-center justify-center shrink-0 mt-0.5">
                          <Icon size={13} className="text-violet dark:text-violet-light" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-body text-xs font-semibold text-ink dark:text-ink mb-0.5 leading-snug">
                            {insight.title}
                          </h3>
                          <p className="text-[10px] text-ink-3 dark:text-ink-3 font-body leading-relaxed mb-1.5">
                            {insight.analysis}
                          </p>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-1">
                              <span className={cn('w-1.5 h-1.5 rounded-full', sentiment.dotClass)} />
                              <span className={cn('text-[9px] font-semibold font-body', sentiment.textClass)}>
                                {sentiment.label}
                              </span>
                            </div>
                            <div className="flex items-center gap-0.5">
                              <Sparkles size={9} className="text-gold" />
                              <span className="text-[9px] font-mono font-bold text-ink-3 dark:text-ink-3 tabular-nums">
                                {insight.confidence}%
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Mobile link */}
              <div className="mt-3 sm:hidden">
                <Link
                  href="/research"
                  className="inline-flex items-center gap-1 text-[10px] font-semibold text-violet dark:text-violet-light hover:text-violet-mid transition-colors font-body"
                >
                  Voir l&apos;analyse complete <ArrowRight size={11} />
                </Link>
              </div>
            </div>

            {/* AI Quick Actions — right side, same card */}
            <div className="lg:col-span-1 border-t lg:border-t-0 lg:border-l border-border/40 dark:border-border-2/30 p-4 flex flex-col gap-2">
              <div className="flex items-center gap-1.5 mb-1">
                <span className="w-1.5 h-1.5 rounded-full bg-cobalt-light" />
                <span className="font-display text-[9px] font-bold uppercase tracking-[0.2em] text-ink-4 dark:text-ink-3">
                  Actions IA rapides
                </span>
              </div>

              <Link
                href="/pricing"
                className={cn(
                  'group relative overflow-hidden rounded-lg border border-border/30 dark:border-border-2/30 p-3',
                  'bg-white/40 dark:bg-white/[0.02]',
                  'hover:bg-violet-ghost/40 dark:hover:bg-violet/5 hover:shadow-sm',
                  'transition-all duration-200'
                )}
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-md bg-gradient-to-br from-violet to-violet-mid flex items-center justify-center shrink-0">
                    <Sparkles size={13} className="text-white" />
                  </div>
                  <div>
                    <span className="font-body text-xs font-semibold text-ink dark:text-ink block leading-snug">
                      Pricer un produit
                    </span>
                    <span className="text-[9px] text-ink-4 dark:text-ink-4 font-body">avec l&apos;IA</span>
                  </div>
                </div>
              </Link>

              <Link
                href="/pricing/live"
                className={cn(
                  'group relative overflow-hidden rounded-lg border border-border/30 dark:border-border-2/30 p-3',
                  'bg-white/40 dark:bg-white/[0.02]',
                  'hover:bg-violet-ghost/40 dark:hover:bg-violet/5 hover:shadow-sm',
                  'transition-all duration-200'
                )}
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-md bg-gradient-to-br from-cobalt-light to-teal flex items-center justify-center shrink-0">
                    <BarChart3 size={13} className="text-white" />
                  </div>
                  <div>
                    <span className="font-body text-xs font-semibold text-ink dark:text-ink block leading-snug">
                      Consulter les emetteurs
                    </span>
                    <span className="text-[9px] text-ink-4 dark:text-ink-4 font-body">prix live</span>
                  </div>
                </div>
              </Link>

              <Link
                href="/portfolio"
                className={cn(
                  'group relative overflow-hidden rounded-lg border border-border/30 dark:border-border-2/30 p-3',
                  'bg-white/40 dark:bg-white/[0.02]',
                  'hover:bg-violet-ghost/40 dark:hover:bg-violet/5 hover:shadow-sm',
                  'transition-all duration-200'
                )}
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-md bg-gradient-to-br from-teal to-gold flex items-center justify-center shrink-0">
                    <Briefcase size={13} className="text-white" />
                  </div>
                  <div>
                    <span className="font-body text-xs font-semibold text-ink dark:text-ink block leading-snug">
                      Analyser mon portefeuille
                    </span>
                    <span className="text-[9px] text-ink-4 dark:text-ink-4 font-body">diagnostic IA</span>
                  </div>
                </div>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── Main 2-Column Layout ────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 mb-5">
        {/* ─ Left Column (3/5 = 60%) ─ */}
        <div className="lg:col-span-3 flex flex-col gap-4">
          {/* Collecte du mois */}
          <div className="relative bg-white/80 dark:bg-white/[0.03] backdrop-blur-md rounded-xl border border-border/50 dark:border-border-2/40 shadow-card overflow-hidden">
            <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-violet to-cobalt-light" />
            <div className="p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-violet" />
                  <h2 className="font-display text-[10px] font-bold uppercase tracking-[0.2em] text-ink-3 dark:text-ink-3">
                    Collecte du mois
                  </h2>
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="font-display text-base font-extrabold text-ink dark:text-ink tabular-nums">
                    1,24M&nbsp;&euro;
                  </span>
                  <span className="text-[10px] font-mono text-ink-4 dark:text-ink-3 tabular-nums">2026</span>
                </div>
              </div>
              <AreaChart />
            </div>
          </div>

          {/* Derniers engagements */}
          <div className="relative bg-white/80 dark:bg-white/[0.03] backdrop-blur-md rounded-xl border border-border/50 dark:border-border-2/40 shadow-card overflow-hidden">
            <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-teal to-gold" />
            <div className="flex items-center justify-between px-4 py-3 border-b border-border/40 dark:border-border-2/30">
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-teal" />
                <h2 className="font-display text-[10px] font-bold uppercase tracking-[0.2em] text-ink-3 dark:text-ink-3">
                  Derniers engagements
                </h2>
              </div>
              <Link
                href="/portfolio"
                className="text-[10px] font-semibold text-violet dark:text-violet-light hover:text-violet-mid transition-colors flex items-center gap-1 font-body"
              >
                Voir tout <ArrowRight size={11} />
              </Link>
            </div>

            {sortedCommitments.length === 0 ? (
              <EmptyState
                icon={Inbox}
                title="Aucun engagement"
                description="Vos derniers engagements sur les produits structures apparaitront ici."
              />
            ) : (
              <>
                {/* ── Desktop Table ── */}
                <div className="hidden md:block overflow-x-auto">
                  <table className="w-full text-xs font-body">
                    <thead>
                      <tr className="bg-surface-2/30 dark:bg-white/[0.02]">
                        <SortableHeader label="Produit" col="product" sortCol={sortCol} sortDir={sortDir} onSort={handleSort} align="left" />
                        <SortableHeader label="Montant" col="amount" sortCol={sortCol} sortDir={sortDir} onSort={handleSort} align="right" />
                        <SortableHeader label="Statut" col="status" sortCol={sortCol} sortDir={sortDir} onSort={handleSort} align="center" />
                        <SortableHeader label="Date" col="date" sortCol={sortCol} sortDir={sortDir} onSort={handleSort} align="right" />
                      </tr>
                    </thead>
                    <tbody className="stagger-rows">
                      {sortedCommitments.map((c, idx) => {
                        const status = STATUS_CONFIG[c.status] ?? {
                          label: c.status,
                          classes: 'bg-surface-2 text-ink-3',
                        };
                        return (
                          <tr
                            key={c.id}
                            className={cn(
                              'border-b border-border/20 dark:border-border-2/20',
                              'hover:bg-violet-ghost/30 dark:hover:bg-violet/5',
                              'transition-colors duration-150',
                              idx % 2 === 1 && 'bg-surface-2/20 dark:bg-white/[0.01]'
                            )}
                          >
                            <td className="px-4 py-2.5 font-medium text-ink dark:text-ink truncate max-w-[200px]">
                              {c.product}
                            </td>
                            <td className="px-4 py-2.5 text-right font-mono font-semibold text-ink dark:text-ink tabular-nums">
                              {formatAmount(c.amount)}
                            </td>
                            <td className="px-4 py-2.5 text-center">
                              <span
                                className={cn(
                                  'inline-flex items-center px-2 py-px rounded-full text-[10px] font-semibold',
                                  status.classes
                                )}
                              >
                                {status.label}
                              </span>
                            </td>
                            <td className="px-4 py-2.5 text-right text-ink-3 text-[11px] tabular-nums font-mono">
                              {formatDateNice(c.date)}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* ── Mobile Card Layout ── */}
                <div className="md:hidden p-3 flex flex-col gap-2.5">
                  {sortedCommitments.map((c) => {
                    const status = STATUS_CONFIG[c.status] ?? {
                      label: c.status,
                      classes: 'bg-surface-2 text-ink-3',
                    };
                    return (
                      <div
                        key={c.id}
                        className={cn(
                          'rounded-lg border border-border/30 dark:border-border-2/30 p-3',
                          'bg-white/40 dark:bg-white/[0.02]',
                          'hover:bg-violet-ghost/30 dark:hover:bg-violet/5',
                          'transition-all duration-200'
                        )}
                      >
                        <div className="flex items-start justify-between mb-2">
                          <span className="font-body text-xs font-semibold text-ink dark:text-ink leading-snug pr-2">
                            {c.product}
                          </span>
                          <span
                            className={cn(
                              'inline-flex items-center px-2 py-px rounded-full text-[10px] font-semibold shrink-0',
                              status.classes
                            )}
                          >
                            {status.label}
                          </span>
                        </div>
                        <div className="font-display text-lg font-extrabold text-ink dark:text-ink tabular-nums mb-1">
                          {formatAmount(c.amount)}
                        </div>
                        <div className="text-[10px] text-ink-3 dark:text-ink-3 font-mono tabular-nums">
                          {formatDateNice(c.date)}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </div>
        </div>

        {/* ─ Right Column (2/5 = 40%) — unified card with donut + popular products ─ */}
        <div className="lg:col-span-2">
          <div className="relative bg-white/80 dark:bg-white/[0.03] backdrop-blur-md rounded-xl border border-border/50 dark:border-border-2/40 shadow-card overflow-hidden h-full">
            <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-cobalt-light to-violet" />

            {/* Donut section */}
            <div className="p-4 pb-3">
              <SectionHeader dotColor="bg-cobalt-light">Repartition par type</SectionHeader>
              {donutData.length === 0 ? (
                <EmptyState
                  icon={BarChart3}
                  title="Aucune donnee"
                  description="La repartition par type de produit apparaitra ici."
                />
              ) : (
                <DonutChart data={donutData} />
              )}
            </div>

            {/* Divider */}
            <div className="mx-4 border-t border-border/40 dark:border-border-2/30" />

            {/* Popular products section */}
            <div className="p-4 pt-3">
              <SectionHeader dotColor="bg-gold">Produits populaires</SectionHeader>
              {POPULAR_PRODUCTS.length === 0 ? (
                <EmptyState
                  icon={Layers}
                  title="Aucun produit populaire"
                  description="Les produits les plus souscrits apparaitront ici."
                />
              ) : (
                <div className="flex flex-col gap-2.5">
                  {POPULAR_PRODUCTS.map((p) => (
                    <div key={p.rank} className="flex items-center gap-2.5 group">
                      <span className="w-6 h-6 rounded-md bg-violet-pale/60 dark:bg-violet/10 flex items-center justify-center font-display text-[10px] font-extrabold text-violet dark:text-violet-light shrink-0">
                        {p.rank}
                      </span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs font-semibold text-ink dark:text-ink font-body truncate pr-2 inline-flex items-center gap-2">
                            {p.name}
                            <Sparkline
                              data={PRODUCT_SPARKLINE_DATA[p.rank] ?? []}
                              width={48}
                              height={16}
                              color="#3B1FA8"
                              strokeWidth={1.2}
                              className="opacity-60 group-hover:opacity-100 transition-opacity"
                            />
                          </span>
                          <span className="text-[10px] font-mono text-ink-3 dark:text-ink-3 shrink-0 tabular-nums">
                            {p.volume}
                          </span>
                        </div>
                        <div className="h-1 rounded-full bg-surface-2/80 dark:bg-white/5 overflow-hidden">
                          <div
                            className="h-full rounded-full bg-gradient-to-r from-violet to-cobalt-light transition-all duration-700 group-hover:opacity-80"
                            style={{ width: `${p.pct}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
