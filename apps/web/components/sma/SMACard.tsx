'use client';

import Link from 'next/link';
import { ArrowRight, ArrowUp, ArrowDown, Wallet, Percent } from 'lucide-react';
import { cn } from '@/lib/cn';
import { Sparkline } from '@/components/ui/sparkline';
import {
  SMA_STRATEGY_COLORS,
  SMA_STRATEGY_LABELS,
  type SMA,
} from '@/stores/sma-store';
import { computeCumulativePerformance } from '@/lib/sma/performance-engine';

interface SMACardProps {
  sma: SMA;
}

function formatPct(v: number): string {
  const sign = v > 0 ? '+' : '';
  return `${sign}${v.toFixed(2)}%`;
}

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

function PerfTile({ label, value }: { label: string; value: number }) {
  const positive = value >= 0;
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-[9px] uppercase tracking-widest font-body font-bold text-ink-3 dark:text-white/40">
        {label}
      </span>
      <span
        className={cn(
          'font-display text-[15px] font-bold leading-tight tabular-nums flex items-center gap-0.5',
          positive ? 'text-teal' : 'text-red',
        )}
      >
        {positive ? (
          <ArrowUp size={10} strokeWidth={2.8} />
        ) : (
          <ArrowDown size={10} strokeWidth={2.8} />
        )}
        {formatPct(value)}
      </span>
    </div>
  );
}

export function SMACard({ sma }: SMACardProps) {
  const colors = SMA_STRATEGY_COLORS[sma.strategy];
  const cumulative = computeCumulativePerformance(sma.monthlyReturns);
  const ytdPositive = sma.performance.ytd >= 0;

  return (
    <article
      className={cn(
        'group relative flex flex-col gap-4 p-5 rounded-xl',
        'bg-white dark:bg-white/[0.04] border border-border dark:border-white/10',
        'shadow-card hover:shadow-card-hover transition-all duration-200',
        'hover:-translate-y-0.5',
      )}
    >
      {/* Strategy accent bar */}
      <div
        className="absolute top-0 left-0 right-0 h-[3px] rounded-t-xl"
        style={{ background: colors.gradient }}
      />

      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex flex-col gap-0.5 min-w-0">
          <span
            className="inline-flex items-center gap-1.5 w-fit px-2 py-0.5 rounded-md text-[10px] font-body font-bold uppercase tracking-wider"
            style={{
              backgroundColor: colors.bg,
              color: colors.text,
              border: `1px solid ${colors.border}`,
            }}
          >
            <span
              className="w-1.5 h-1.5 rounded-full"
              style={{ background: colors.dot }}
            />
            {SMA_STRATEGY_LABELS[sma.strategy]}
          </span>
          <h3 className="font-display text-lg font-bold text-ink dark:text-white leading-tight truncate">
            {sma.name}
          </h3>
          <p className="text-xs font-body text-ink-3 dark:text-white/50 truncate">
            Géré par <span className="font-semibold text-ink-2 dark:text-white/70">{sma.manager}</span>
          </p>
        </div>
      </div>

      {/* Perf grid */}
      <div className="grid grid-cols-4 gap-2 p-3 rounded-md bg-surface-2 dark:bg-white/[0.03] border border-border/60 dark:border-white/[0.06]">
        <PerfTile label="YTD" value={sma.performance.ytd} />
        <PerfTile label="1 an" value={sma.performance.y1} />
        <PerfTile label="3 ans" value={sma.performance.y3} />
        <PerfTile label="5 ans" value={sma.performance.y5} />
      </div>

      {/* Sparkline */}
      <div className="flex items-center justify-between gap-3">
        <Sparkline
          data={cumulative}
          width={220}
          height={48}
          color={ytdPositive ? '#00B894' : '#E8334A'}
          strokeWidth={1.8}
          className="w-full max-w-[240px]"
        />
        <span className="text-[9px] font-body text-ink-3 dark:text-white/40 uppercase tracking-wider shrink-0">
          36 mois
        </span>
      </div>

      {/* Fees + ticket */}
      <div className="flex items-center justify-between pt-2 border-t border-border/60 dark:border-white/5">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 text-xs font-body text-ink-2 dark:text-white/70">
            <Wallet size={12} className="text-ink-3 dark:text-white/40" />
            <span className="font-semibold tabular-nums">{formatEur(sma.ticketMin)}</span>
          </div>
          <span className="text-[10px] font-body text-ink-3/50">|</span>
          <div className="flex items-center gap-1 text-xs font-body text-ink-2 dark:text-white/70">
            <Percent size={12} className="text-ink-3 dark:text-white/40" />
            <span className="font-semibold tabular-nums">{formatBps(sma.fees)}</span>
          </div>
        </div>
        <Link
          href={`/sma/${sma.id}`}
          className="inline-flex items-center gap-1 h-8 px-3 rounded-md text-xs font-body font-semibold bg-violet text-white hover:bg-violet-dark shadow-xs hover:shadow-violet transition-all"
        >
          Voir détails
          <ArrowRight size={12} />
        </Link>
      </div>
    </article>
  );
}
