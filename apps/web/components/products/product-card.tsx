'use client';

import Link from 'next/link';
import { Calendar, ArrowUpRight, Heart } from 'lucide-react';
import { cn } from '@/lib/cn';
import { useToggleFavorite } from '@/hooks/use-favorites';

// ─── Types ────────────────────────────────────────────────────────────────────

export type PayoffType =
  | 'AUTOCALL_PHOENIX'
  | 'AUTOCALL_COUPON'
  | 'CAPITAL_PROTECTED'
  | 'CONDITIONAL_RATE'
  | 'BARRIER_NOTE';

export interface Product {
  id: string;
  isin: string;
  name: string;
  payoffType: PayoffType;
  issuerName: string;
  underlyingYahoo: string;
  barrierCapPct: number | null;
  autocallBarrierPct: number | null;
  couponPct: number | null;
  maxGainPct: number | null;
  sri: 1 | 2 | 3 | 4 | 5 | 6 | 7;
  maturityDate: string;
  entryFeePct: number;
  status: string;
  fillPct?: number | null;
  targetAmount?: number | null;
}

interface ProductCardProps {
  product: Product;
  className?: string;
  isFavorited?: boolean;
  recommendationScore?: number | null;
}

// ─── Constants ───────────────────────────────────────────────────────────────

const PAYOFF_COLORS: Record<PayoffType, { bg: string; text: string; border: string }> = {
  AUTOCALL_PHOENIX: { bg: '#EDE8FF', text: '#3B1FA8', border: '#D5CCFA' },
  AUTOCALL_COUPON: { bg: '#EDE8FF', text: '#5535C4', border: '#D5CCFA' },
  CAPITAL_PROTECTED: { bg: '#E6FAF5', text: '#008B6E', border: '#B3F0DE' },
  CONDITIONAL_RATE: { bg: '#E4EAFF', text: '#0A2799', border: '#C5D2FA' },
  BARRIER_NOTE: { bg: '#FFF8E7', text: '#A07800', border: '#F0E0A8' },
};

const PAYOFF_LABELS: Record<PayoffType, string> = {
  AUTOCALL_PHOENIX: 'Phoenix',
  AUTOCALL_COUPON: 'Autocall',
  CAPITAL_PROTECTED: 'Capital Prot\u00e9g\u00e9',
  CONDITIONAL_RATE: 'Taux Cond.',
  BARRIER_NOTE: 'Barrier',
};

const SRI_COLORS: Record<number, { bg: string; text: string }> = {
  1: { bg: '#E6FAF5', text: '#008B6E' },
  2: { bg: '#E6FAF5', text: '#008B6E' },
  3: { bg: '#F0FAE6', text: '#4A8C1F' },
  4: { bg: '#FFF8E7', text: '#A07800' },
  5: { bg: '#FFF0E6', text: '#C25700' },
  6: { bg: '#FFF0F2', text: '#C41F36' },
  7: { bg: '#FFF0F2', text: '#C41F36' },
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(isoDate: string): string {
  return new Date(isoDate).toLocaleDateString('fr-FR', {
    month: 'short',
    year: 'numeric',
  });
}

function formatCompact(amount: number): string {
  if (amount >= 1_000_000) {
    return `${(amount / 1_000_000).toFixed(0)}M\u20ac`;
  }
  if (amount >= 1_000) {
    return `${(amount / 1_000).toFixed(0)}k\u20ac`;
  }
  return `${amount}\u20ac`;
}

// ─── Component ───────────────────────────────────────────────────────────────

export function ProductCard({ product, className, isFavorited = false, recommendationScore }: ProductCardProps) {
  const {
    id,
    name,
    isin,
    payoffType,
    issuerName,
    barrierCapPct,
    maxGainPct,
    couponPct,
    sri,
    maturityDate,
    fillPct = 0,
    targetAmount = 0,
    status,
  } = product;

  const toggleFavorite = useToggleFavorite();
  const payoff = PAYOFF_COLORS[payoffType] ?? PAYOFF_COLORS.AUTOCALL_PHOENIX;
  const sriStyle = SRI_COLORS[sri] ?? SRI_COLORS[4];
  const clampedFill = Math.min(100, Math.max(0, fillPct ?? 0));
  const isClosed = status === 'CLOSED' || status === 'MATURED';

  const handleFavorite = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    toggleFavorite.mutate(id);
  };

  return (
    <Link
      href={`/products/${id}`}
      className={cn(
        'group relative flex flex-col rounded-xl border border-border/80 bg-white overflow-hidden',
        'transition-all duration-300 hover:shadow-card-hover hover:-translate-y-0.5',
        isClosed && 'opacity-60',
        className,
      )}
    >
      {/* Top color accent */}
      <div
        className="h-[3px] w-full"
        style={{ background: payoff.text }}
      />

      {/* Favorite button */}
      <button
        onClick={handleFavorite}
        className={cn(
          'absolute top-4 right-3 z-10 p-1.5 rounded-full transition-all duration-200',
          isFavorited
            ? 'text-red bg-red-light hover:bg-red/20'
            : 'text-ink-3/40 hover:text-red hover:bg-red-light opacity-0 group-hover:opacity-100',
        )}
        title={isFavorited ? 'Retirer des favoris' : 'Ajouter aux favoris'}
      >
        <Heart size={14} fill={isFavorited ? 'currentColor' : 'none'} />
      </button>

      {/* AI Recommendation badge */}
      {recommendationScore != null && recommendationScore >= 70 && (
        <div className="absolute top-4 left-3 z-10">
          <span className="inline-flex items-center gap-1 rounded-full bg-violet/10 text-violet px-2 py-0.5 text-[9px] font-bold">
            <span className="w-1.5 h-1.5 rounded-full bg-violet animate-pulse" />
            IA {recommendationScore}%
          </span>
        </div>
      )}

      <div className="flex flex-col gap-3.5 px-5 py-4 flex-1">
        {/* Header: Badges row */}
        <div className="flex items-center justify-between gap-2">
          <span
            className="inline-flex items-center rounded-md px-2 py-[3px] text-[10px] font-semibold font-body tracking-wide"
            style={{
              backgroundColor: payoff.bg,
              color: payoff.text,
              border: `1px solid ${payoff.border}`,
            }}
          >
            {PAYOFF_LABELS[payoffType]}
          </span>
          <span
            className="inline-flex items-center rounded-md px-2 py-[3px] text-[10px] font-bold font-mono tabular-nums"
            style={{
              backgroundColor: sriStyle.bg,
              color: sriStyle.text,
            }}
            title={`Risque : ${sri}/7`}
          >
            SRI {sri}
          </span>
        </div>

        {/* Product name + ISIN */}
        <div>
          <p className="text-[13px] font-semibold text-ink leading-snug font-body line-clamp-2 group-hover:text-violet transition-colors">
            {name}
          </p>
          <p className="text-[10px] font-mono text-ink-3 mt-0.5 tabular-nums">
            {isin}
          </p>
        </div>

        {/* Issuer */}
        <p className="text-[11px] text-ink-3 truncate font-body -mt-1">
          {issuerName}
        </p>

        {/* Key metrics grid */}
        <div className="grid grid-cols-3 gap-2 bg-surface rounded-lg p-3 -mx-0.5">
          <div className="flex flex-col">
            <span className="text-[9px] uppercase tracking-wider text-ink-3 font-semibold">
              Gain max
            </span>
            <span className="font-display text-base font-bold text-ink leading-tight">
              {(maxGainPct ?? 0).toFixed(0)}
              <span className="text-xs text-ink-3">%</span>
            </span>
          </div>
          <div className="flex flex-col">
            <span className="text-[9px] uppercase tracking-wider text-ink-3 font-semibold">
              Barri\u00e8re
            </span>
            <span className="font-display text-base font-bold text-red leading-tight">
              {(barrierCapPct ?? 0).toFixed(0)}
              <span className="text-xs text-red/60">%</span>
            </span>
          </div>
          <div className="flex flex-col">
            <span className="text-[9px] uppercase tracking-wider text-ink-3 font-semibold">
              {couponPct != null ? 'Coupon' : '\u00c9ch\u00e9ance'}
            </span>
            <span className="font-display text-base font-bold text-ink leading-tight">
              {couponPct != null ? (
                <>
                  {couponPct.toFixed(1)}
                  <span className="text-xs text-ink-3">%</span>
                </>
              ) : (
                <span className="text-xs font-body font-semibold flex items-center gap-1">
                  <Calendar size={10} className="text-ink-3" />
                  {formatDate(maturityDate)}
                </span>
              )}
            </span>
          </div>
        </div>

        {/* Fill progress */}
        <div className="flex flex-col gap-1.5 mt-auto">
          <div className="flex items-center justify-between text-[11px] font-body">
            <span className="text-ink-3">Enveloppe</span>
            <span className="font-semibold text-ink-2 tabular-nums font-mono text-[11px]">
              {(fillPct ?? 0).toFixed(0)}%
              <span className="font-normal text-ink-3 ml-1">
                / {formatCompact(targetAmount ?? 0)}
              </span>
            </span>
          </div>
          <div className="h-1 w-full overflow-hidden rounded-full bg-surface-2">
            <div
              className="h-full rounded-full transition-all duration-700 ease-out"
              style={{
                width: `${clampedFill}%`,
                background: clampedFill > 80
                  ? 'linear-gradient(90deg, #00B894, #00D4AA)'
                  : 'linear-gradient(90deg, #3B1FA8, #5535C4)',
              }}
            />
          </div>
        </div>
      </div>

      {/* Footer CTA */}
      <div className="px-5 py-3 border-t border-border/50 bg-surface/50 flex items-center justify-between">
        <span className="text-[11px] font-semibold text-violet group-hover:text-violet-mid transition-colors">
          {isClosed ? 'Ferm\u00e9' : "Marque d\u2019int\u00e9r\u00eat"}
        </span>
        <ArrowUpRight
          size={14}
          className="text-violet/50 group-hover:text-violet group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all duration-200"
        />
      </div>
    </Link>
  );
}
