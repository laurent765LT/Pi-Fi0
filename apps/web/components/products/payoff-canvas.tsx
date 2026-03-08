'use client';

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { cn } from '@/lib/cn';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface PayoffDataPoint {
  date: string; // ISO date string
  value: number; // EUR value
}

export interface PayoffScenario {
  name: string;
  color: string;
  data: PayoffDataPoint[];
}

interface PayoffCanvasProps {
  scenarios: PayoffScenario[];
  /** Height of the chart in px, defaults to 300 */
  height?: number;
  className?: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Merge all scenario data arrays into a single array keyed by date.
 * Each entry: { date: string, [scenarioName]: number }
 */
function mergeScenarios(
  scenarios: PayoffScenario[],
): Record<string, number | string>[] {
  const dateMap = new Map<string, Record<string, number | string>>();

  for (const scenario of scenarios) {
    for (const point of scenario.data) {
      if (!dateMap.has(point.date)) {
        dateMap.set(point.date, { date: point.date });
      }
      const entry = dateMap.get(point.date)!;
      entry[scenario.name] = point.value;
    }
  }

  return Array.from(dateMap.values()).sort((a, b) =>
    String(a.date).localeCompare(String(b.date)),
  );
}

function formatDateLabel(isoDate: string): string {
  const date = new Date(isoDate);
  return date.toLocaleDateString('fr-FR', {
    month: 'short',
    year: '2-digit',
  });
}

function formatEuro(value: number): string {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
    maximumFractionDigits: 0,
  }).format(value);
}

// ─── Custom tooltip ──────────────────────────────────────────────────────────

interface TooltipPayloadEntry {
  name: string;
  value: number;
  color: string;
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: TooltipPayloadEntry[];
  label?: string;
}

function CustomTooltip({ active, payload, label }: CustomTooltipProps) {
  if (!active || !payload || payload.length === 0) return null;

  const date = label ? new Date(label) : null;
  const dateLabel = date
    ? date.toLocaleDateString('fr-FR', {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
      })
    : label;

  return (
    <div className="rounded-md border border-border bg-white px-3 py-2 shadow-md">
      <p className="mb-1.5 text-[11px] font-semibold text-ink-3 font-body">
        {dateLabel}
      </p>
      <div className="flex flex-col gap-1">
        {payload.map((entry) => (
          <div
            key={entry.name}
            className="flex items-center justify-between gap-4 text-xs font-body"
          >
            <span className="flex items-center gap-1.5">
              <span
                className="inline-block h-2 w-2 rounded-full"
                style={{ background: entry.color }}
              />
              <span className="text-ink-2">{entry.name}</span>
            </span>
            <span className="font-semibold text-ink" style={{ color: entry.color }}>
              {formatEuro(entry.value)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Custom legend ───────────────────────────────────────────────────────────

interface LegendEntry {
  value: string;
  color: string;
}

interface CustomLegendProps {
  payload?: LegendEntry[];
}

function CustomLegend({ payload }: CustomLegendProps) {
  if (!payload) return null;
  return (
    <div className="mt-3 flex flex-wrap justify-center gap-4">
      {payload.map((entry) => (
        <div
          key={entry.value}
          className="flex items-center gap-1.5 text-xs font-body text-ink-3"
        >
          <span
            className="inline-block h-2.5 w-2.5 rounded-full"
            style={{ background: entry.color }}
          />
          {entry.value}
        </div>
      ))}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function PayoffCanvas({
  scenarios,
  height = 300,
  className,
}: PayoffCanvasProps) {
  const chartData = mergeScenarios(scenarios);

  if (scenarios.length === 0 || chartData.length === 0) {
    return (
      <div
        className={cn(
          'flex items-center justify-center rounded-lg border border-border bg-surface text-sm text-ink-3 font-body',
          className,
        )}
        style={{ height }}
      >
        Aucune donnée de simulation disponible.
      </div>
    );
  }

  return (
    <div className={cn('w-full', className)}>
      <ResponsiveContainer width="100%" height={height}>
        <LineChart
          data={chartData}
          margin={{ top: 8, right: 16, left: 8, bottom: 0 }}
        >
          <CartesianGrid
            strokeDasharray="3 3"
            stroke="#E2DFF5"
            vertical={false}
          />

          <XAxis
            dataKey="date"
            tickFormatter={formatDateLabel}
            tick={{ fontSize: 11, fill: '#7B6FA0', fontFamily: 'DM Sans, sans-serif' }}
            tickLine={false}
            axisLine={{ stroke: '#E2DFF5' }}
            dy={6}
          />

          <YAxis
            tickFormatter={(v: number) =>
              new Intl.NumberFormat('fr-FR', {
                notation: 'compact',
                style: 'currency',
                currency: 'EUR',
                maximumFractionDigits: 0,
              }).format(v)
            }
            tick={{ fontSize: 11, fill: '#7B6FA0', fontFamily: 'DM Sans, sans-serif' }}
            tickLine={false}
            axisLine={false}
            width={56}
          />

          <Tooltip
            content={<CustomTooltip />}
            cursor={{ stroke: '#3B1FA8', strokeWidth: 1, strokeDasharray: '4 4' }}
          />

          <Legend content={<CustomLegend />} />

          {scenarios.map((scenario) => (
            <Line
              key={scenario.name}
              type="monotone"
              dataKey={scenario.name}
              stroke={scenario.color}
              strokeWidth={2}
              dot={false}
              activeDot={{
                r: 4,
                fill: scenario.color,
                stroke: 'white',
                strokeWidth: 2,
              }}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

// ─── Preset scenario helpers ─────────────────────────────────────────────────

/** Helper to build a best/worst/base 3-scenario set from raw data. */
export function buildDefaultScenarios(
  bestData: PayoffDataPoint[],
  baseData: PayoffDataPoint[],
  worstData: PayoffDataPoint[],
): PayoffScenario[] {
  return [
    { name: 'Scénario favorable', color: '#00B894', data: bestData },
    { name: 'Scénario central', color: '#3B1FA8', data: baseData },
    { name: 'Scénario défavorable', color: '#E8334A', data: worstData },
  ];
}
