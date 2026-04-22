'use client';

import { Package, TrendingUp } from 'lucide-react';
import { cn } from '@/lib/cn';
import { Badge } from '@/components/ui/badge';
import {
  PAYOFF_LABELS,
  type ClientPortfolioAggregate,
} from '@/lib/portfolio/aggregation-engine';
import { INSURER_COLORS } from '@/stores/clients-consolidated-store';

interface ConsolidatedViewProps {
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

// ─── Donut chart (SVG, no deps) ─────────────────────────────────────────────

interface DonutSlice {
  label: string;
  value: number;
  color: string;
}

function DonutChart({ slices, size = 180 }: { slices: DonutSlice[]; size?: number }) {
  const total = slices.reduce((acc, s) => acc + s.value, 0);
  if (total === 0) return null;
  const cx = size / 2;
  const cy = size / 2;
  const r = size / 2 - 12;
  const stroke = 22;
  const circ = 2 * Math.PI * r;

  let acc = 0;

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      role="img"
      aria-label="Répartition par sous-jacent"
    >
      <circle
        cx={cx}
        cy={cy}
        r={r}
        fill="none"
        stroke="currentColor"
        strokeOpacity={0.08}
        strokeWidth={stroke}
      />
      {slices.map((slice, i) => {
        const frac = slice.value / total;
        const length = circ * frac;
        const offset = circ * (acc / total);
        acc += slice.value;
        return (
          <circle
            key={`${slice.label}-${i}`}
            cx={cx}
            cy={cy}
            r={r}
            fill="none"
            stroke={slice.color}
            strokeWidth={stroke}
            strokeDasharray={`${length} ${circ - length}`}
            strokeDashoffset={-offset}
            strokeLinecap="butt"
            transform={`rotate(-90 ${cx} ${cy})`}
          />
        );
      })}
      <text
        x={cx}
        y={cy - 4}
        textAnchor="middle"
        className="font-display font-bold fill-ink dark:fill-white"
        style={{ fontSize: 14 }}
      >
        Total
      </text>
      <text
        x={cx}
        y={cy + 14}
        textAnchor="middle"
        className="font-mono fill-ink-2 dark:fill-white/70"
        style={{ fontSize: 12 }}
      >
        {formatAmount(total)}
      </text>
    </svg>
  );
}

// ─── Main ───────────────────────────────────────────────────────────────────

export function ConsolidatedView({ aggregate, className }: ConsolidatedViewProps) {
  const topUnderlyings = aggregate.underlyings.slice(0, 6);
  const totalOther = aggregate.underlyings
    .slice(6)
    .reduce((acc, u) => acc + u.amount, 0);

  const slices: DonutSlice[] = topUnderlyings.map((u, i) => ({
    label: u.underlying,
    value: u.amount,
    color: ['#3B1FA8', '#5B3FD4', '#00B894', '#D4A017', '#3D63F5', '#7B5FE0'][i % 6],
  }));
  if (totalOther > 0) {
    slices.push({ label: 'Autres', value: totalOther, color: '#A99EC4' });
  }

  return (
    <div className={cn('space-y-5', className)}>
      {/* Header totals */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="rounded-xl border border-border bg-white dark:bg-white/[0.03] p-4">
          <p className="text-[10px] uppercase tracking-[0.18em] text-ink-3 font-bold">
            Exposition totale
          </p>
          <p className="font-display text-[28px] font-extrabold text-ink dark:text-white mt-1 tabular-nums">
            {formatAmount(aggregate.totalExposure)}
          </p>
          <p className="text-[11px] text-ink-3 mt-1">
            Agrégé sur {aggregate.contractsCount} contrat
            {aggregate.contractsCount > 1 ? 's' : ''}
          </p>
        </div>
        <div className="rounded-xl border border-border bg-white dark:bg-white/[0.03] p-4">
          <p className="text-[10px] uppercase tracking-[0.18em] text-ink-3 font-bold">
            Produits structurés
          </p>
          <p className="font-display text-[28px] font-extrabold text-ink dark:text-white mt-1 tabular-nums">
            {aggregate.productsCount}
          </p>
          <p className="text-[11px] text-ink-3 mt-1">
            {aggregate.underlyings.length} sous-jacents distincts
          </p>
        </div>
        <div className="rounded-xl border border-border bg-white dark:bg-white/[0.03] p-4">
          <p className="text-[10px] uppercase tracking-[0.18em] text-ink-3 font-bold">
            SRI moyen pondéré
          </p>
          <p className="font-display text-[28px] font-extrabold text-ink dark:text-white mt-1 tabular-nums">
            {aggregate.avgSri > 0 ? aggregate.avgSri.toFixed(1) : '--'}
            <span className="text-[12px] text-ink-3 font-semibold ml-1">/ 7</span>
          </p>
          <p className="text-[11px] text-ink-3 mt-1">
            Coupon moyen :{' '}
            {aggregate.avgCoupon > 0 ? `${aggregate.avgCoupon.toFixed(1)}%` : '--'}
          </p>
        </div>
      </div>

      {/* Donut + legend */}
      <div className="rounded-xl border border-border bg-white dark:bg-white/[0.03] p-4">
        <div className="flex items-center gap-2 mb-4">
          <Package size={14} className="text-violet" />
          <h3 className="font-display font-bold text-[14px] text-ink dark:text-white">
            Exposition par sous-jacent
          </h3>
        </div>
        <div className="flex flex-col md:flex-row gap-6 items-center">
          <div className="shrink-0 text-ink-3">
            <DonutChart slices={slices} size={200} />
          </div>
          <ul className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-2 w-full">
            {slices.map((slice) => {
              const pct =
                aggregate.totalExposure > 0
                  ? (slice.value / aggregate.totalExposure) * 100
                  : 0;
              return (
                <li
                  key={slice.label}
                  className="flex items-center gap-2 py-1.5 px-2 rounded-md hover:bg-violet-pale/40 dark:hover:bg-white/[0.04] transition-colors"
                >
                  <span
                    aria-hidden
                    className="w-3 h-3 rounded-sm shrink-0"
                    style={{ background: slice.color }}
                  />
                  <span
                    className="flex-1 min-w-0 truncate text-[12px] text-ink-2 dark:text-white/80"
                    title={slice.label}
                  >
                    {slice.label}
                  </span>
                  <span className="text-[11px] font-mono text-ink-3 tabular-nums whitespace-nowrap">
                    {pct.toFixed(1)}%
                  </span>
                </li>
              );
            })}
          </ul>
        </div>
      </div>

      {/* Product list */}
      <div className="rounded-xl border border-border bg-white dark:bg-white/[0.03] overflow-hidden">
        <div className="flex items-center gap-2 px-4 py-3 border-b border-border bg-violet-pale/30 dark:bg-white/[0.02]">
          <TrendingUp size={14} className="text-violet" />
          <h3 className="font-display font-bold text-[14px] text-ink dark:text-white">
            Produits consolidés (toutes enveloppes)
          </h3>
          <span className="ml-auto text-[11px] text-ink-3 tabular-nums">
            {aggregate.products.length} ligne
            {aggregate.products.length > 1 ? 's' : ''}
          </span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-surface-2 dark:bg-white/[0.02] border-b border-border">
                <th className="text-left px-4 py-2.5 text-[10px] uppercase tracking-wider text-ink-3 font-bold">
                  Produit
                </th>
                <th className="text-left px-4 py-2.5 text-[10px] uppercase tracking-wider text-ink-3 font-bold">
                  Émetteur
                </th>
                <th className="text-left px-4 py-2.5 text-[10px] uppercase tracking-wider text-ink-3 font-bold">
                  Payoff
                </th>
                <th className="text-left px-4 py-2.5 text-[10px] uppercase tracking-wider text-ink-3 font-bold">
                  Contrat
                </th>
                <th className="text-right px-4 py-2.5 text-[10px] uppercase tracking-wider text-ink-3 font-bold">
                  Montant
                </th>
              </tr>
            </thead>
            <tbody>
              {aggregate.products.map((p, idx) => (
                <tr
                  key={`${p.productId}-${p.contractId}-${idx}`}
                  className={cn(
                    'border-b border-border/60 last:border-b-0 transition-colors duration-150 hover:bg-violet-pale/30 dark:hover:bg-white/[0.03]',
                    idx % 2 === 0 ? '' : 'bg-surface/50 dark:bg-white/[0.01]',
                  )}
                >
                  <td className="px-4 py-2.5">
                    <p className="text-[13px] font-semibold text-ink dark:text-white">
                      {p.product?.name ?? p.productId}
                    </p>
                    <p className="text-[10px] font-mono text-ink-3 mt-0.5">
                      {p.product?.isin ?? '—'}
                    </p>
                  </td>
                  <td className="px-4 py-2.5 text-[12px] text-ink-2 dark:text-white/70">
                    {p.product?.issuerName ?? '—'}
                  </td>
                  <td className="px-4 py-2.5">
                    <Badge variant="violet" size="sm">
                      {p.product?.payoffType
                        ? PAYOFF_LABELS[p.product.payoffType] ?? p.product.payoffType
                        : '—'}
                    </Badge>
                  </td>
                  <td className="px-4 py-2.5">
                    <span
                      className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider"
                      style={{
                        background: `${INSURER_COLORS[p.insurer]}18`,
                        color: INSURER_COLORS[p.insurer],
                      }}
                    >
                      <span
                        aria-hidden
                        className="w-1.5 h-1.5 rounded-full"
                        style={{ background: INSURER_COLORS[p.insurer] }}
                      />
                      {p.insurer}
                    </span>
                  </td>
                  <td className="px-4 py-2.5 text-right font-mono text-[13px] font-semibold text-ink dark:text-white tabular-nums">
                    {formatAmount(p.amount)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
