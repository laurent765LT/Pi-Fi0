'use client';

import { useMemo, useState } from 'react';
import {
  ResponsiveContainer,
  ComposedChart,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
} from 'recharts';
import { cn } from '@/lib/cn';
import { computeCumulativePerformance } from '@/lib/sma/performance-engine';

interface SMAPerformanceChartProps {
  monthlyReturns: number[];
  /** Optional benchmark monthly returns (same length); defaults to a synthetic CAC 40. */
  benchmarkReturns?: number[];
  className?: string;
  height?: number;
}

type Period = '1M' | '3M' | '6M' | 'YTD' | '1Y' | '3Y' | 'All';
const PERIODS: Period[] = ['1M', '3M', '6M', 'YTD', '1Y', '3Y', 'All'];

const MONTH_LABELS = [
  'Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun',
  'Jul', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc',
];

function monthLabelOffset(monthsAgo: number, total: number): string {
  const now = new Date();
  const idx = total - 1 - monthsAgo; // not used, kept for readability
  // Derive label from (now - (total - 1 - monthsAgo) months)
  const d = new Date(now.getFullYear(), now.getMonth() - (total - 1 - monthsAgo), 1);
  return `${MONTH_LABELS[d.getMonth()]}${String(d.getFullYear()).slice(-2)}`;
}

function buildSyntheticBenchmark(length: number): number[] {
  // Deterministic moderately-volatile series → mimics CAC 40
  let seed = 98_765 >>> 0;
  const rnd = () => {
    seed ^= seed << 13;
    seed ^= seed >>> 17;
    seed ^= seed << 5;
    return ((seed >>> 0) % 1_000_000) / 1_000_000;
  };
  const out: number[] = [];
  for (let i = 0; i < length; i++) {
    const u1 = Math.max(1e-6, rnd());
    const u2 = rnd();
    const z = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
    // Mean 6%/yr, vol 15%/yr
    out.push(0.005 + (0.15 / Math.sqrt(12)) * z);
  }
  return out;
}

function periodSlice(total: number, period: Period): number {
  switch (period) {
    case '1M': return Math.max(0, total - 1);
    case '3M': return Math.max(0, total - 3);
    case '6M': return Math.max(0, total - 6);
    case 'YTD': {
      const now = new Date();
      const startOfYear = new Date(now.getFullYear(), 0, 1);
      const monthsSince = (now.getFullYear() - startOfYear.getFullYear()) * 12
        + (now.getMonth() - startOfYear.getMonth());
      return Math.max(0, total - monthsSince);
    }
    case '1Y': return Math.max(0, total - 12);
    case '3Y': return Math.max(0, total - 36);
    case 'All':
    default:
      return 0;
  }
}

interface TooltipPayloadItem {
  color?: string;
  name?: string;
  value?: number;
}

function CustomTooltip(
  props: { active?: boolean; payload?: TooltipPayloadItem[]; label?: string },
) {
  const { active, payload, label } = props;
  if (!active || !payload || payload.length === 0) return null;
  return (
    <div className="rounded-md border border-border bg-white dark:bg-ink/95 dark:border-white/10 shadow-md px-3 py-2">
      <div className="text-[10px] font-body uppercase tracking-widest text-ink-3 dark:text-white/50 font-bold mb-1">
        {label}
      </div>
      {payload.map((p, idx) => (
        <div key={idx} className="flex items-center gap-2 text-xs font-body">
          <span
            className="w-2 h-2 rounded-full"
            style={{ background: p.color ?? '#3B1FA8' }}
          />
          <span className="text-ink-2 dark:text-white/70">{p.name}</span>
          <span className="ml-auto font-semibold tabular-nums text-ink dark:text-white">
            {typeof p.value === 'number'
              ? `${p.value >= 0 ? '+' : ''}${p.value.toFixed(2)}%`
              : ''}
          </span>
        </div>
      ))}
    </div>
  );
}

export function SMAPerformanceChart({
  monthlyReturns,
  benchmarkReturns,
  className,
  height = 280,
}: SMAPerformanceChartProps) {
  const [period, setPeriod] = useState<Period>('All');

  const bench = benchmarkReturns ?? buildSyntheticBenchmark(monthlyReturns.length);

  const data = useMemo(() => {
    const cumSma = computeCumulativePerformance(monthlyReturns);
    const cumBench = computeCumulativePerformance(bench);
    const start = periodSlice(monthlyReturns.length, period);

    return cumSma.slice(start).map((v, i) => {
      const month = start + i;
      return {
        month: monthLabelOffset(month, monthlyReturns.length),
        sma: v,
        benchmark: cumBench[month] ?? 0,
      };
    });
  }, [monthlyReturns, bench, period]);

  return (
    <div className={cn('flex flex-col gap-3', className)}>
      {/* Period selector */}
      <div className="flex items-center justify-end gap-1 flex-wrap">
        {PERIODS.map((p) => (
          <button
            key={p}
            type="button"
            onClick={() => setPeriod(p)}
            aria-pressed={period === p}
            className={cn(
              'h-7 px-2.5 rounded-md text-[10px] font-body font-bold uppercase tracking-widest border transition-all',
              period === p
                ? 'bg-violet text-white border-violet shadow-xs'
                : 'bg-white dark:bg-white/5 text-ink-2 dark:text-white/70 border-border dark:border-white/10 hover:border-violet/50',
            )}
          >
            {p}
          </button>
        ))}
      </div>

      <div style={{ width: '100%', height }}>
        <ResponsiveContainer>
          <ComposedChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 8 }}>
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
            <Tooltip content={<CustomTooltip />} />
            <Legend
              iconType="circle"
              wrapperStyle={{ fontSize: 11, paddingTop: 8 }}
            />
            <Line
              name="SMA"
              type="monotone"
              dataKey="sma"
              stroke="#00B894"
              strokeWidth={2.2}
              dot={false}
              activeDot={{ r: 3 }}
            />
            <Line
              name="CAC 40"
              type="monotone"
              dataKey="benchmark"
              stroke="#7B6FA0"
              strokeWidth={1.5}
              strokeDasharray="4 3"
              dot={false}
              activeDot={{ r: 3 }}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
