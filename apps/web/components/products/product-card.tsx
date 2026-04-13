'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Calendar, ArrowUpRight, Heart, Clock, Sparkles as SparkleIcon, Layers, Check } from 'lucide-react';
import { cn } from '@/lib/cn';
import { useToggleFavorite } from '@/hooks/use-favorites';
import { useCompareStore } from '@/stores/compare-store';

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
  createdAt?: string;
  shelfClosingDate?: string;
}

interface ProductCardProps {
  product: Product;
  className?: string;
  isFavorited?: boolean;
  recommendationScore?: number | null;
}

// ─── Constants ───────────────────────────────────────────────────────────────

const PAYOFF_COLORS: Record<PayoffType, { bg: string; text: string; border: string; gradient: string }> = {
  AUTOCALL_PHOENIX: { bg: '#EDE8FF', text: '#3B1FA8', border: '#D5CCFA', gradient: 'linear-gradient(135deg, #3B1FA8, #7B5FE0)' },
  AUTOCALL_COUPON: { bg: '#EDE8FF', text: '#5535C4', border: '#D5CCFA', gradient: 'linear-gradient(135deg, #5535C4, #9B7FF0)' },
  CAPITAL_PROTECTED: { bg: '#E6FAF5', text: '#008B6E', border: '#B3F0DE', gradient: 'linear-gradient(135deg, #008B6E, #00D4AA)' },
  CONDITIONAL_RATE: { bg: '#E4EAFF', text: '#0A2799', border: '#C5D2FA', gradient: 'linear-gradient(135deg, #0A2799, #3D63F5)' },
  BARRIER_NOTE: { bg: '#FFF8E7', text: '#A07800', border: '#F0E0A8', gradient: 'linear-gradient(135deg, #D4A017, #F0C84D)' },
};

const PAYOFF_LABELS: Record<PayoffType, string> = {
  AUTOCALL_PHOENIX: 'Phoenix',
  AUTOCALL_COUPON: 'Autocall',
  CAPITAL_PROTECTED: 'Capital Prot\u00E9g\u00E9',
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

/** Color for each SRI dot position (1-7): green -> yellow -> red */
const SRI_DOT_COLORS = [
  '#00B894', // 1
  '#2ECC71', // 2
  '#82C91E', // 3
  '#D4A017', // 4
  '#E67E22', // 5
  '#E8334A', // 6
  '#C41F36', // 7
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(isoDate: string): string {
  return new Date(isoDate).toLocaleDateString('fr-FR', {
    month: 'short',
    year: 'numeric',
  });
}

function formatCompact(amount: number): string {
  if (amount >= 1_000_000) {
    return `${(amount / 1_000_000).toFixed(0)}M\u20AC`;
  }
  if (amount >= 1_000) {
    return `${(amount / 1_000).toFixed(0)}k\u20AC`;
  }
  return `${amount}\u20AC`;
}

// ─── Sub-components ─────────────────────────────────────────────────────────

/** Mini SRI gauge: 7 dots colored green->yellow->red, filled up to SRI level */
function SriGauge({ level }: { level: number }) {
  return (
    <div className="inline-flex items-center gap-[3px]" title={`Risque : ${level}/7`}>
      <span className="text-[9px] font-bold font-mono text-ink-3 mr-1">SRI</span>
      {Array.from({ length: 7 }, (_, i) => {
        const filled = i < level;
        return (
          <span
            key={i}
            className="block rounded-full transition-all duration-300"
            style={{
              width: 6,
              height: 6,
              backgroundColor: filled ? SRI_DOT_COLORS[i] : '#E2DFF5',
              boxShadow: filled ? `0 0 4px ${SRI_DOT_COLORS[i]}40` : 'none',
            }}
          />
        );
      })}
    </div>
  );
}

/** Issuer avatar: colored circle with first 2 letters */
function IssuerAvatar({ name, color }: { name: string; color: string }) {
  const initials = name
    .split(/[\s-]+/)
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase();

  return (
    <span
      className="inline-flex items-center justify-center rounded-full text-[8px] font-bold text-white shrink-0"
      style={{
        width: 20,
        height: 20,
        background: `linear-gradient(135deg, ${color}, ${color}CC)`,
      }}
    >
      {initials}
    </span>
  );
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
    createdAt,
    shelfClosingDate,
  } = product;

  const toggleFavorite = useToggleFavorite();
  const addToCompare = useCompareStore((s) => s.addProduct);
  const removeFromCompare = useCompareStore((s) => s.removeProduct);
  const compareIds = useCompareStore((s) => s.productIds);
  const isCompared = compareIds.includes(id);

  const payoff = PAYOFF_COLORS[payoffType] ?? PAYOFF_COLORS.AUTOCALL_PHOENIX;
  const clampedFill = Math.min(100, Math.max(0, fillPct ?? 0));
  const isClosed = status === 'CLOSED' || status === 'MATURED';

  const [heartBounce, setHeartBounce] = useState(false);

  // Badge logic
  const isNew = createdAt ? (Date.now() - new Date(createdAt).getTime()) < 7 * 24 * 60 * 60 * 1000 : false;
  const closingDays = shelfClosingDate ? Math.ceil((new Date(shelfClosingDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)) : null;
  const isClosingSoon = closingDays !== null && closingDays > 0 && closingDays <= 30;

  const highCoupon = couponPct != null && couponPct > 8;

  const handleFavorite = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setHeartBounce(true);
    setTimeout(() => setHeartBounce(false), 400);
    toggleFavorite.mutate(id);
  };

  const handleCompare = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (isCompared) {
      removeFromCompare(id);
    } else {
      addToCompare(id);
    }
  };

  return (
    <Link
      href={`/products/${id}`}
      className={cn(
        'group relative flex flex-col rounded-xl border border-border/80 bg-white overflow-hidden',
        'transition-all duration-300 ease-out',
        'hover:shadow-lg hover:-translate-y-[2px]',
        'hover:border-transparent',
        isClosed && 'opacity-60',
        className,
      )}
    >
      {/* ── Compare toggle (top-right corner) ── */}
      <button
        onClick={handleCompare}
        className={cn(
          'absolute top-3 right-3 z-10 p-1.5 rounded-lg border transition-all duration-200',
          isCompared
            ? 'bg-violet text-white border-violet shadow-md'
            : 'bg-white/90 text-ink-3/50 border-border/60 opacity-0 group-hover:opacity-100 hover:text-violet hover:border-violet/40 hover:bg-violet-p/30',
        )}
        title={isCompared ? 'Retirer de la comparaison' : 'Ajouter a la comparaison'}
      >
        {isCompared ? <Check size={13} strokeWidth={3} /> : <Layers size={13} />}
      </button>

      {/* ── Gradient accent strip (2px, color by payoff type) ── */}
      <div
        className="h-[2px] w-full shrink-0"
        style={{ background: payoff.gradient }}
      />

      <div className="flex flex-col gap-3.5 px-5 py-4 flex-1">
        {/* Header: Badges row -- type, SRI, status, favorite */}
        <div className="flex items-center gap-1.5 flex-wrap">
          {/* Type badge with gradient background */}
          <span
            className="inline-flex items-center rounded-md px-2 py-[3px] text-[10px] font-semibold font-body tracking-wide text-white"
            style={{
              background: payoff.gradient,
            }}
          >
            {PAYOFF_LABELS[payoffType]}
          </span>

          {/* Status badges */}
          {isNew && (
            <span
              className="inline-flex items-center gap-1 rounded-md px-1.5 py-[3px] text-[9px] font-bold font-body text-white"
              style={{
                background: 'linear-gradient(135deg, #3D63F5, #5535C4)',
              }}
            >
              <SparkleIcon size={8} />
              Nouveau
            </span>
          )}
          {isClosingSoon && (
            <span
              className="inline-flex items-center gap-1 rounded-md px-1.5 py-[3px] text-[9px] font-bold font-body text-white animate-pulse-closing"
              style={{
                background: 'linear-gradient(135deg, #E8334A, #FF6B81)',
              }}
            >
              <Clock size={8} />
              J-{closingDays}
            </span>
          )}

          {/* AI badge */}
          {recommendationScore != null && recommendationScore >= 70 && (
            <span className="inline-flex items-center gap-1 rounded-md px-1.5 py-[3px] bg-violet/10 text-violet text-[9px] font-bold">
              <span className="w-1.5 h-1.5 rounded-full bg-violet animate-pulse" />
              IA {recommendationScore}%
            </span>
          )}

          {/* Spacer + SRI gauge + Favorite */}
          <span className="flex-1" />

          <SriGauge level={sri} />

          <button
            onClick={handleFavorite}
            className={cn(
              'p-1 rounded-full transition-all duration-200 shrink-0',
              heartBounce && 'animate-heart-bounce',
              isFavorited
                ? 'text-red'
                : 'text-ink-3/30 hover:text-red opacity-0 group-hover:opacity-100',
            )}
            title={isFavorited ? 'Retirer des favoris' : 'Ajouter aux favoris'}
          >
            <Heart size={13} fill={isFavorited ? 'currentColor' : 'none'} />
          </button>
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

        {/* Issuer with avatar */}
        <div className="flex items-center gap-1.5 -mt-1">
          <IssuerAvatar name={issuerName} color={payoff.text} />
          <p className="text-[11px] text-ink-3 truncate font-body">
            {issuerName}
          </p>
        </div>

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
              Barri{'\u00E8'}re
            </span>
            <span className="font-display text-base font-bold text-red leading-tight">
              {(barrierCapPct ?? 0).toFixed(0)}
              <span className="text-xs text-red/60">%</span>
            </span>
          </div>
          <div className="flex flex-col">
            <span className="text-[9px] uppercase tracking-wider text-ink-3 font-semibold">
              {couponPct != null ? 'Coupon' : '\u00C9ch\u00E9ance'}
            </span>
            <span className="font-display text-base font-bold text-ink leading-tight">
              {couponPct != null ? (
                <span className={cn(highCoupon && 'coupon-glow')}>
                  {couponPct.toFixed(1)}
                  <span className={cn('text-xs', highCoupon ? 'text-gold' : 'text-ink-3')}>%</span>
                </span>
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
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-surface-2">
            <div
              className="h-full rounded-full transition-all duration-700 ease-out progress-bar-animated"
              style={{
                width: `${clampedFill}%`,
                background: clampedFill > 80
                  ? 'linear-gradient(90deg, #00B894, #2ECC71, #00D4AA)'
                  : 'linear-gradient(90deg, #3B1FA8, #5535C4, #7B5FE0)',
              }}
            />
          </div>
        </div>
      </div>

      {/* Footer CTA */}
      <div className="px-5 py-3 border-t border-border/50 bg-surface/50 flex items-center justify-between">
        <span className="text-[11px] font-semibold text-violet group-hover:text-violet-mid transition-colors">
          {isClosed ? 'Ferm\u00E9' : "Marque d\u2019int\u00E9r\u00EAt"}
        </span>
        <ArrowUpRight
          size={14}
          className="text-violet/50 group-hover:text-violet group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all duration-200"
        />
      </div>
    </Link>
  );
}
