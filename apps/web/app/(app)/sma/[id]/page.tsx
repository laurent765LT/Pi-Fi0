'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import {
  Layers,
  ArrowLeft,
  TrendingUp,
  Activity,
  AlertTriangle,
  Target,
  FileText,
  Users,
  Calendar,
  Wallet,
  Percent,
} from 'lucide-react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts';
import { cn } from '@/lib/cn';
import { PageHeader } from '@/components/ui/page-header';
import { Button } from '@/components/ui/button';
import {
  useSMAStore,
  SMA_STRATEGY_LABELS,
  SMA_STRATEGY_COLORS,
} from '@/stores/sma-store';
import { SMAPerformanceChart } from '@/components/sma/SMAPerformanceChart';
import { SMAComposition } from '@/components/sma/SMAComposition';
import { RecommendSMAModal } from '@/components/sma/RecommendSMAModal';
import { computeRollingVolatility } from '@/lib/sma/performance-engine';

const MONTH_LABELS_SHORT = [
  'J', 'F', 'M', 'A', 'M', 'J', 'J', 'A', 'S', 'O', 'N', 'D',
];

function formatEur(n: number): string {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
    maximumFractionDigits: 0,
  }).format(n);
}

function formatBps(fees: number): string {
  return `${Math.round(fees * 10_000)} bps`;
}

function formatDateFr(iso: string): string {
  return new Date(iso).toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

function KpiBig({
  icon,
  label,
  value,
  accent,
  trend,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  accent: string;
  trend?: string;
}) {
  return (
    <div
      className={cn(
        'relative flex flex-col gap-1 rounded-xl border border-border/60 dark:border-white/10 p-4',
        'bg-white/80 dark:bg-white/5 backdrop-blur-md',
        'shadow-card',
      )}
    >
      <div
        className="absolute top-0 left-0 right-0 h-[3px] rounded-t-xl"
        style={{ background: accent }}
      />
      <div className="flex items-center gap-2">
        <div
          className="w-7 h-7 rounded-md flex items-center justify-center ring-1 ring-black/[0.04] dark:ring-white/[0.08]"
          style={{ background: `${accent}14` }}
        >
          {icon}
        </div>
        <span className="text-[10px] uppercase tracking-widest font-body font-bold text-ink-3 dark:text-white/50">
          {label}
        </span>
      </div>
      <div className="font-display text-2xl font-bold text-ink dark:text-white tabular-nums">
        {value}
      </div>
      {trend && (
        <div className="text-[11px] font-body text-ink-3 dark:text-white/50">{trend}</div>
      )}
    </div>
  );
}

// ─── Monthly returns heatmap ─────────────────────────────────────────────────

function HeatmapTooltip(
  props: {
    active?: boolean;
    payload?: Array<{ payload?: { month: string; vol: number } }>;
  },
) {
  const { active, payload } = props;
  if (!active || !payload || payload.length === 0) return null;
  const p = payload[0].payload;
  if (!p) return null;
  return (
    <div className="rounded-md border border-border bg-white dark:bg-ink/95 dark:border-white/10 shadow-md px-3 py-2">
      <div className="text-[10px] font-body uppercase tracking-widest text-ink-3 font-bold">
        {p.month}
      </div>
      <div className="text-xs font-body font-semibold text-ink dark:text-white tabular-nums">
        Volatilité: {p.vol.toFixed(2)}%
      </div>
    </div>
  );
}

function MonthlyReturnsHeatmap({ returns }: { returns: number[] }) {
  // Group returns by year — newest months at the right
  const cells = useMemo(() => {
    const now = new Date();
    const out: Array<{
      r: number;
      year: number;
      month: number;
      label: string;
    }> = [];
    for (let i = 0; i < returns.length; i++) {
      const d = new Date(now.getFullYear(), now.getMonth() - (returns.length - 1 - i), 1);
      out.push({
        r: returns[i],
        year: d.getFullYear(),
        month: d.getMonth(),
        label: `${MONTH_LABELS_SHORT[d.getMonth()]}${String(d.getFullYear()).slice(-2)}`,
      });
    }
    return out;
  }, [returns]);

  const years = Array.from(new Set(cells.map((c) => c.year))).sort();

  // Find max abs return for color scaling
  const maxAbs = Math.max(...returns.map((r) => Math.abs(r))) || 0.001;

  function cellColor(r: number): { bg: string; text: string } {
    const intensity = Math.min(1, Math.abs(r) / maxAbs);
    if (r >= 0) {
      const alpha = 0.15 + intensity * 0.55;
      return { bg: `rgba(0, 184, 148, ${alpha.toFixed(2)})`, text: intensity > 0.55 ? '#FFFFFF' : '#007A63' };
    }
    const alpha = 0.15 + intensity * 0.55;
    return { bg: `rgba(232, 51, 74, ${alpha.toFixed(2)})`, text: intensity > 0.55 ? '#FFFFFF' : '#B3283A' };
  }

  return (
    <div className="flex flex-col gap-2 overflow-x-auto">
      <div className="flex gap-1">
        <div className="w-10 shrink-0" />
        {MONTH_LABELS_SHORT.map((m, i) => (
          <div
            key={i}
            className="w-8 text-center text-[9px] font-body uppercase font-bold text-ink-3 dark:text-white/40"
          >
            {m}
          </div>
        ))}
      </div>
      {years.map((year) => (
        <div key={year} className="flex gap-1">
          <div className="w-10 shrink-0 text-[10px] font-mono font-bold text-ink-3 dark:text-white/40 self-center">
            {year}
          </div>
          {Array.from({ length: 12 }, (_, m) => {
            const cell = cells.find((c) => c.year === year && c.month === m);
            if (!cell) {
              return <div key={m} className="w-8 h-8 rounded-md bg-surface-3 dark:bg-white/[0.02]" />;
            }
            const { bg, text } = cellColor(cell.r);
            return (
              <div
                key={m}
                className="w-8 h-8 rounded-md flex items-center justify-center text-[9px] font-body font-bold transition-transform hover:scale-110 cursor-help tabular-nums"
                style={{ backgroundColor: bg, color: text }}
                title={`${cell.label} : ${(cell.r * 100).toFixed(2)}%`}
              >
                {(cell.r * 100).toFixed(1)}
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
}

export default function SMADetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const sma = useSMAStore((s) =>
    params?.id ? s.smas.find((x) => x.id === params.id) : undefined,
  );

  useEffect(() => {
    if (sma) document.title = `${sma.name} | Strick'in`;
  }, [sma]);

  const [recommendOpen, setRecommendOpen] = useState(false);

  const rollingVol = useMemo(
    () => (sma ? computeRollingVolatility(sma.monthlyReturns, 6) : []),
    [sma],
  );

  const volData = useMemo(() => {
    if (!sma) return [];
    const now = new Date();
    return rollingVol.map((v, i) => {
      const d = new Date(
        now.getFullYear(),
        now.getMonth() - (sma.monthlyReturns.length - 1 - i),
        1,
      );
      return {
        month: `${MONTH_LABELS_SHORT[d.getMonth()]}${String(d.getFullYear()).slice(-2)}`,
        vol: v,
      };
    });
  }, [rollingVol, sma]);

  if (!sma) {
    return (
      <div className="flex flex-col gap-6 pb-12">
        <div className="rounded-xl border border-dashed border-border dark:border-white/10 py-12 text-center">
          <Layers size={24} className="mx-auto text-ink-3 mb-2" />
          <p className="text-sm font-body text-ink-2 mb-3">SMA introuvable.</p>
          <Link
            href="/sma"
            className="inline-flex items-center gap-1 text-xs font-body font-semibold text-violet hover:underline"
          >
            <ArrowLeft size={12} />
            Retour à la marketplace
          </Link>
        </div>
      </div>
    );
  }

  const colors = SMA_STRATEGY_COLORS[sma.strategy];

  return (
    <div className="flex flex-col gap-6 pb-12">
      {/* Back + header */}
      <div>
        <Link
          href="/sma"
          className="inline-flex items-center gap-1 text-xs font-body text-ink-3 dark:text-white/50 hover:text-violet mb-3"
        >
          <ArrowLeft size={12} />
          Retour à la marketplace
        </Link>
        <PageHeader
          icon={Layers}
          title={sma.name}
          subtitle={sma.description}
          accentFrom={colors.dot}
          accentTo="#1A0A3E"
        >
          <Button variant="outline" size="md" onClick={() => setRecommendOpen(true)}>
            <Users size={14} />
            Recommander à un client
          </Button>
          <Button
            variant="primary"
            size="md"
            onClick={() => {
              // eslint-disable-next-line no-console
              console.info(`[sma] open documentation for ${sma.id}`);
            }}
          >
            <FileText size={14} />
            Documentation
          </Button>
        </PageHeader>
      </div>

      {/* Manager bio */}
      <div className="rounded-xl border border-border dark:border-white/10 bg-white dark:bg-white/[0.04] p-5 flex flex-col sm:flex-row gap-4 items-start">
        <div
          className="w-12 h-12 rounded-lg flex items-center justify-center shrink-0 shadow-md"
          style={{ background: colors.gradient }}
        >
          <Users size={20} className="text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span
              className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[10px] font-body font-bold uppercase tracking-wider"
              style={{
                backgroundColor: colors.bg,
                color: colors.text,
                border: `1px solid ${colors.border}`,
              }}
            >
              {SMA_STRATEGY_LABELS[sma.strategy]}
            </span>
            <span className="text-xs font-body text-ink-3 dark:text-white/50">
              Depuis le {formatDateFr(sma.inceptionDate)}
            </span>
          </div>
          <p className="font-display text-base font-bold text-ink dark:text-white mb-1">
            {sma.manager}
          </p>
          <p className="text-xs font-body text-ink-2 dark:text-white/70 leading-relaxed">
            {sma.managerBio}
          </p>
        </div>
        <div className="grid grid-cols-3 sm:grid-cols-1 gap-2 sm:gap-1 shrink-0 sm:text-right">
          <div>
            <div className="text-[10px] uppercase tracking-widest font-body font-bold text-ink-3 dark:text-white/40">
              AUM
            </div>
            <div className="font-display text-sm font-bold text-ink dark:text-white tabular-nums">
              {formatEur(sma.aum)}
            </div>
          </div>
          <div>
            <div className="text-[10px] uppercase tracking-widest font-body font-bold text-ink-3 dark:text-white/40">
              Ticket min.
            </div>
            <div className="font-display text-sm font-bold text-ink dark:text-white tabular-nums">
              {formatEur(sma.ticketMin)}
            </div>
          </div>
          <div>
            <div className="text-[10px] uppercase tracking-widest font-body font-bold text-ink-3 dark:text-white/40">
              Frais
            </div>
            <div className="font-display text-sm font-bold text-ink dark:text-white tabular-nums">
              {formatBps(sma.fees)}
            </div>
          </div>
        </div>
      </div>

      {/* 4 large KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <KpiBig
          icon={<TrendingUp size={14} className="text-teal" />}
          label="Perf. depuis inception"
          value={`${sma.performance.since >= 0 ? '+' : ''}${sma.performance.since.toFixed(2)}%`}
          accent="#00B894"
          trend={`YTD ${sma.performance.ytd >= 0 ? '+' : ''}${sma.performance.ytd.toFixed(2)}%`}
        />
        <KpiBig
          icon={<Activity size={14} className="text-cobalt" />}
          label="Volatilité ann."
          value={`${sma.volatility.toFixed(2)}%`}
          accent="#0A2799"
        />
        <KpiBig
          icon={<AlertTriangle size={14} className="text-red" />}
          label="Max Drawdown"
          value={`${sma.maxDrawdown.toFixed(2)}%`}
          accent="#E8334A"
        />
        <KpiBig
          icon={<Target size={14} className="text-violet" />}
          label="Sharpe Ratio"
          value={`${sma.sharpeRatio.toFixed(2)}`}
          accent="#3B1FA8"
          trend="vs risk-free 2.5%"
        />
      </div>

      {/* Cumulative performance chart */}
      <div className="rounded-xl border border-border dark:border-white/10 bg-white dark:bg-white/[0.04] p-5">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-display text-base font-bold text-ink dark:text-white">
            Performance cumulée vs. CAC 40
          </h2>
          <span className="inline-flex items-center gap-1 text-[10px] font-body text-ink-3 dark:text-white/40 uppercase tracking-wider">
            <Calendar size={10} />
            36 mois
          </span>
        </div>
        <SMAPerformanceChart monthlyReturns={sma.monthlyReturns} />
      </div>

      {/* Rolling volatility */}
      <div className="rounded-xl border border-border dark:border-white/10 bg-white dark:bg-white/[0.04] p-5">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-display text-base font-bold text-ink dark:text-white">
            Volatilité glissante (6 mois)
          </h2>
          <span className="inline-flex items-center gap-1 text-[10px] font-body text-ink-3 dark:text-white/40 uppercase tracking-wider">
            <Percent size={10} />
            Annualisée
          </span>
        </div>
        <div style={{ width: '100%', height: 200 }}>
          <ResponsiveContainer>
            <LineChart data={volData} margin={{ top: 8, right: 8, left: 0, bottom: 8 }}>
              <CartesianGrid stroke="#E2DFF5" strokeDasharray="3 3" vertical={false} />
              <XAxis
                dataKey="month"
                tick={{ fontSize: 10, fill: '#7B6FA0' }}
                tickLine={false}
                axisLine={{ stroke: '#E2DFF5' }}
                interval="preserveStartEnd"
              />
              <YAxis
                tick={{ fontSize: 10, fill: '#7B6FA0' }}
                tickLine={false}
                axisLine={{ stroke: '#E2DFF5' }}
                width={44}
                tickFormatter={(v) => `${(v as number).toFixed(0)}%`}
              />
              <Tooltip content={<HeatmapTooltip />} />
              <Line
                type="monotone"
                dataKey="vol"
                stroke="#0A2799"
                strokeWidth={2}
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Monthly returns heatmap */}
      <div className="rounded-xl border border-border dark:border-white/10 bg-white dark:bg-white/[0.04] p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display text-base font-bold text-ink dark:text-white">
            Rendements mensuels
          </h2>
          <span className="inline-flex items-center gap-2 text-[10px] font-body text-ink-3 dark:text-white/40">
            <span className="w-3 h-3 rounded-sm" style={{ background: 'rgba(232,51,74,0.5)' }} />
            Négatif
            <span className="w-3 h-3 rounded-sm" style={{ background: 'rgba(0,184,148,0.5)' }} />
            Positif
          </span>
        </div>
        <MonthlyReturnsHeatmap returns={sma.monthlyReturns} />
      </div>

      {/* Composition */}
      <div className="rounded-xl border border-border dark:border-white/10 bg-white dark:bg-white/[0.04] p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display text-base font-bold text-ink dark:text-white">
            Composition du portefeuille
          </h2>
          <span className="inline-flex items-center gap-1 text-[10px] font-body text-ink-3 dark:text-white/40 uppercase tracking-wider">
            <Wallet size={10} />
            {sma.composition.length} produits
          </span>
        </div>
        <SMAComposition composition={sma.composition} />
      </div>

      {/* Recommend modal */}
      <RecommendSMAModal
        isOpen={recommendOpen}
        onClose={() => setRecommendOpen(false)}
        sma={sma}
      />
    </div>
  );
}
