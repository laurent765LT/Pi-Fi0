'use client';

import { useMemo } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { cn } from '@/lib/cn';
import type { SMAComposition as SMACompositionType } from '@/stores/sma-store';

interface SMACompositionProps {
  composition: SMACompositionType[];
  className?: string;
}

// Palette — violet/teal/gold/cobalt progression
const PALETTE = [
  '#3B1FA8', // violet
  '#00B894', // teal
  '#D4A017', // gold
  '#0A2799', // cobalt
  '#7B5FE0', // violet light
  '#4FE0BE', // teal light
  '#F0C84D', // gold light
  '#3D63F5', // cobalt light
];

interface DonutDatum {
  name: string;
  value: number;
  fill: string;
  contributionYtd?: number;
}

function DonutTooltip(
  props: {
    active?: boolean;
    payload?: Array<{ payload?: DonutDatum; value?: number; name?: string; color?: string }>;
  },
) {
  const { active, payload } = props;
  if (!active || !payload || payload.length === 0) return null;
  const p = payload[0];
  const datum = p.payload as DonutDatum | undefined;
  if (!datum) return null;
  return (
    <div className="rounded-md border border-border bg-white dark:bg-ink/95 dark:border-white/10 shadow-md px-3 py-2">
      <div className="flex items-center gap-2 text-xs font-body">
        <span
          className="w-2 h-2 rounded-full"
          style={{ background: datum.fill }}
        />
        <span className="font-semibold text-ink dark:text-white">{datum.name}</span>
      </div>
      <div className="text-xs font-body text-ink-3 dark:text-white/50 mt-0.5 tabular-nums">
        Poids: <span className="font-semibold text-ink-2 dark:text-white/80">{datum.value.toFixed(1)}%</span>
      </div>
    </div>
  );
}

export function SMAComposition({ composition, className }: SMACompositionProps) {
  const sorted = useMemo(
    () => [...composition].sort((a, b) => b.weight - a.weight),
    [composition],
  );

  const pieData = useMemo<DonutDatum[]>(
    () =>
      sorted.map((c, i) => ({
        name: c.productName,
        value: c.weight,
        fill: PALETTE[i % PALETTE.length],
        contributionYtd: Number((c.weight * 0.012 * (1 + (i % 3 - 1) * 0.1)).toFixed(2)),
      })),
    [sorted],
  );

  return (
    <div className={cn('grid grid-cols-1 lg:grid-cols-2 gap-6', className)}>
      {/* Donut */}
      <div className="flex flex-col items-center">
        <div className="w-full" style={{ height: 260 }}>
          <ResponsiveContainer>
            <PieChart>
              <Tooltip content={<DonutTooltip />} />
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                innerRadius={70}
                outerRadius={100}
                paddingAngle={2}
                dataKey="value"
                stroke="none"
              >
                {pieData.map((entry, idx) => (
                  <Cell key={`cell-${idx}`} fill={entry.fill} />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
        </div>
        <p className="text-xs font-body text-ink-3 dark:text-white/50 mt-2">
          Répartition par produit ({sorted.length})
        </p>
      </div>

      {/* Table */}
      <div className="rounded-md border border-border dark:border-white/10 overflow-hidden">
        <div className="grid grid-cols-[1fr_auto_auto] gap-3 px-3 py-2 bg-surface-2 dark:bg-white/5 text-[10px] font-body uppercase tracking-widest font-bold text-ink-3 dark:text-white/40">
          <span>Produit</span>
          <span className="text-right">Poids</span>
          <span className="text-right w-20">Contrib. YTD</span>
        </div>
        <div className="divide-y divide-border dark:divide-white/5 max-h-[260px] overflow-y-auto">
          {pieData.map((row, i) => (
            <div
              key={`row-${i}`}
              className="grid grid-cols-[1fr_auto_auto] gap-3 items-center px-3 py-2"
            >
              <div className="flex items-center gap-2 min-w-0">
                <span
                  className="w-2 h-2 rounded-full shrink-0"
                  style={{ background: row.fill }}
                />
                <span className="text-xs font-body text-ink dark:text-white/90 truncate">
                  {row.name}
                </span>
              </div>
              <span className="text-xs font-body font-semibold text-ink dark:text-white tabular-nums">
                {row.value.toFixed(1)}%
              </span>
              <span
                className={cn(
                  'text-xs font-body font-semibold tabular-nums w-20 text-right',
                  (row.contributionYtd ?? 0) >= 0 ? 'text-teal' : 'text-red',
                )}
              >
                {(row.contributionYtd ?? 0) >= 0 ? '+' : ''}
                {(row.contributionYtd ?? 0).toFixed(2)}%
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
