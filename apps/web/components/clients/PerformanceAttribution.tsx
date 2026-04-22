'use client';

import {
  BarChart,
  Bar,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip as RTooltip,
  XAxis,
  YAxis,
  type TooltipProps,
} from 'recharts';
import { BarChart3 } from 'lucide-react';
import { cn } from '@/lib/cn';
import type { ClientPortfolioAggregate } from '@/lib/portfolio/aggregation-engine';
import { INSURER_COLORS } from '@/stores/clients-consolidated-store';

interface PerformanceAttributionProps {
  aggregate: ClientPortfolioAggregate;
  className?: string;
}

function formatAmount(amount: number): string {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
    maximumFractionDigits: 0,
  }).format(amount);
}

interface ChartDatum {
  insurer: string;
  ytd: number;
  amount: number;
  color: string;
}

function ChartTooltip({
  active,
  payload,
}: TooltipProps<number, string>) {
  if (!active || !payload || payload.length === 0) return null;
  const raw = payload[0].payload as ChartDatum;
  return (
    <div className="rounded-lg border border-border bg-white dark:bg-ink shadow-md p-3 min-w-[180px]">
      <p className="font-display font-bold text-[13px] text-ink dark:text-white mb-1">
        {raw.insurer}
      </p>
      <p className="text-[11px] text-ink-3">
        YTD :{' '}
        <span
          className={cn(
            'font-mono font-bold tabular-nums',
            raw.ytd >= 0 ? 'text-teal' : 'text-red',
          )}
        >
          {raw.ytd >= 0 ? '+' : ''}
          {raw.ytd.toFixed(2)}%
        </span>
      </p>
      <p className="text-[11px] text-ink-3">
        Exposition :{' '}
        <span className="font-mono font-semibold text-ink-2 dark:text-white/80 tabular-nums">
          {formatAmount(raw.amount)}
        </span>
      </p>
    </div>
  );
}

export function PerformanceAttribution({
  aggregate,
  className,
}: PerformanceAttributionProps) {
  const data: ChartDatum[] = aggregate.ytdByInsurer.map((row) => ({
    insurer: row.insurer,
    ytd: Number(row.ytdPct.toFixed(2)),
    amount: row.amount,
    color: INSURER_COLORS[row.insurer],
  }));

  const weightedYtd =
    aggregate.totalExposure > 0
      ? aggregate.ytdByInsurer.reduce(
          (acc, r) => acc + r.ytdPct * r.amount,
          0,
        ) / aggregate.totalExposure
      : 0;

  if (data.length === 0) {
    return (
      <div className={cn('text-center py-10 text-ink-3 text-sm', className)}>
        Aucune donnée d&apos;attribution disponible.
      </div>
    );
  }

  return (
    <div className={cn('space-y-4', className)}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          <BarChart3 size={16} className="text-violet" />
          <h3 className="font-display font-bold text-[15px] text-ink dark:text-white">
            Attribution de performance YTD
          </h3>
        </div>
        <div className="text-right">
          <p className="text-[10px] uppercase tracking-[0.16em] text-ink-3 font-bold">
            YTD pondéré
          </p>
          <p
            className={cn(
              'font-display font-extrabold text-[20px] tabular-nums',
              weightedYtd >= 0 ? 'text-teal' : 'text-red',
            )}
          >
            {weightedYtd >= 0 ? '+' : ''}
            {weightedYtd.toFixed(2)}%
          </p>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-white dark:bg-white/[0.03] p-4">
        <div className="h-[280px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={data}
              margin={{ top: 10, right: 10, left: 0, bottom: 10 }}
              barGap={4}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="currentColor"
                className="text-ink-3"
                strokeOpacity={0.15}
                vertical={false}
              />
              <XAxis
                dataKey="insurer"
                tick={{ fontSize: 11, fill: 'currentColor' }}
                className="text-ink-3"
                tickLine={false}
                axisLine={{ stroke: 'currentColor', strokeOpacity: 0.2 }}
              />
              <YAxis
                tick={{ fontSize: 11, fill: 'currentColor' }}
                className="text-ink-3"
                tickLine={false}
                axisLine={{ stroke: 'currentColor', strokeOpacity: 0.2 }}
                tickFormatter={(v) => `${v}%`}
              />
              <RTooltip
                cursor={{ fill: 'rgba(59,31,168,0.06)' }}
                content={<ChartTooltip />}
              />
              <Bar
                dataKey="ytd"
                radius={[6, 6, 0, 0]}
                isAnimationActive={false}
                label={{
                  position: 'top',
                  fill: 'currentColor',
                  fontSize: 11,
                  formatter: (v: number) => `${v >= 0 ? '+' : ''}${v}%`,
                }}
              >
                {data.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={entry.ytd >= 0 ? entry.color : '#E8334A'}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Breakdown table */}
      <div className="rounded-xl border border-border bg-white dark:bg-white/[0.03] overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="bg-surface-2 dark:bg-white/[0.02] border-b border-border">
              <th className="text-left px-4 py-2.5 text-[10px] uppercase tracking-wider text-ink-3 font-bold">
                Enveloppe
              </th>
              <th className="text-right px-4 py-2.5 text-[10px] uppercase tracking-wider text-ink-3 font-bold">
                Exposition
              </th>
              <th className="text-right px-4 py-2.5 text-[10px] uppercase tracking-wider text-ink-3 font-bold">
                Poids
              </th>
              <th className="text-right px-4 py-2.5 text-[10px] uppercase tracking-wider text-ink-3 font-bold">
                YTD
              </th>
              <th className="text-right px-4 py-2.5 text-[10px] uppercase tracking-wider text-ink-3 font-bold">
                Contribution
              </th>
            </tr>
          </thead>
          <tbody>
            {data.map((d, idx) => {
              const weight =
                aggregate.totalExposure > 0
                  ? (d.amount / aggregate.totalExposure) * 100
                  : 0;
              const contribution = (d.ytd * weight) / 100;
              return (
                <tr
                  key={d.insurer}
                  className={cn(
                    'border-b border-border/60 last:border-b-0',
                    idx % 2 === 0 ? '' : 'bg-surface/50 dark:bg-white/[0.01]',
                  )}
                >
                  <td className="px-4 py-2.5 text-[12.5px] font-semibold text-ink dark:text-white">
                    <span className="inline-flex items-center gap-2">
                      <span
                        aria-hidden
                        className="w-2.5 h-2.5 rounded-sm"
                        style={{ background: d.color }}
                      />
                      {d.insurer}
                    </span>
                  </td>
                  <td className="px-4 py-2.5 text-right font-mono text-[12px] text-ink-2 dark:text-white/80 tabular-nums">
                    {formatAmount(d.amount)}
                  </td>
                  <td className="px-4 py-2.5 text-right font-mono text-[12px] text-ink-2 dark:text-white/80 tabular-nums">
                    {weight.toFixed(1)}%
                  </td>
                  <td
                    className={cn(
                      'px-4 py-2.5 text-right font-mono text-[12px] font-semibold tabular-nums',
                      d.ytd >= 0 ? 'text-teal' : 'text-red',
                    )}
                  >
                    {d.ytd >= 0 ? '+' : ''}
                    {d.ytd.toFixed(2)}%
                  </td>
                  <td
                    className={cn(
                      'px-4 py-2.5 text-right font-mono text-[12px] font-semibold tabular-nums',
                      contribution >= 0 ? 'text-teal' : 'text-red',
                    )}
                  >
                    {contribution >= 0 ? '+' : ''}
                    {contribution.toFixed(2)} pts
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
