'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { ArrowRight, Heart, Layers, Check, Clock, Sparkles as SparkleIcon, Copy, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/cn';
import { useToggleFavorite } from '@/hooks/use-favorites';
import { useCompareStore } from '@/stores/compare-store';
import { Tooltip } from '@/components/ui/tooltip';

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
  aiReason?: string | null;
}

// ─── Constants ───────────────────────────────────────────────────────────────

const PAYOFF_COLORS: Record<PayoffType, { gradient: string; dot: string }> = {
  AUTOCALL_PHOENIX: { gradient: 'linear-gradient(135deg, #3B1FA8, #7B5FE0)', dot: '#7B5FE0' },
  AUTOCALL_COUPON: { gradient: 'linear-gradient(135deg, #5535C4, #9B7FF0)', dot: '#9B7FF0' },
  CAPITAL_PROTECTED: { gradient: 'linear-gradient(135deg, #008B6E, #00D4AA)', dot: '#00D4AA' },
  CONDITIONAL_RATE: { gradient: 'linear-gradient(135deg, #0A2799, #3D63F5)', dot: '#3D63F5' },
  BARRIER_NOTE: { gradient: 'linear-gradient(135deg, #D4A017, #F0C84D)', dot: '#F0C84D' },
};

const PAYOFF_LABELS: Record<PayoffType, string> = {
  AUTOCALL_PHOENIX: 'Phoenix',
  AUTOCALL_COUPON: 'Autocall',
  CAPITAL_PROTECTED: 'Capital Protege',
  CONDITIONAL_RATE: 'Taux Cond.',
  BARRIER_NOTE: 'Barrier',
};

const SRI_PILL_COLORS: Record<number, { bg: string; text: string; darkBg: string; darkText: string }> = {
  1: { bg: 'bg-emerald-50', text: 'text-emerald-700', darkBg: 'dark:bg-emerald-950', darkText: 'dark:text-emerald-400' },
  2: { bg: 'bg-emerald-50', text: 'text-emerald-700', darkBg: 'dark:bg-emerald-950', darkText: 'dark:text-emerald-400' },
  3: { bg: 'bg-amber-50', text: 'text-amber-700', darkBg: 'dark:bg-amber-950', darkText: 'dark:text-amber-400' },
  4: { bg: 'bg-amber-50', text: 'text-amber-700', darkBg: 'dark:bg-amber-950', darkText: 'dark:text-amber-400' },
  5: { bg: 'bg-orange-50', text: 'text-orange-700', darkBg: 'dark:bg-orange-950', darkText: 'dark:text-orange-400' },
  6: { bg: 'bg-red-50', text: 'text-red-700', darkBg: 'dark:bg-red-950', darkText: 'dark:text-red-400' },
  7: { bg: 'bg-red-50', text: 'text-red-700', darkBg: 'dark:bg-red-950', darkText: 'dark:text-red-400' },
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(isoDate: string): string {
  return new Date(isoDate).toLocaleDateString('fr-FR', {
    month: 'short',
    year: 'numeric',
  });
}

function formatCompact(amount: number): string {
  if (amount >= 1_000_000) return `${(amount / 1_000_000).toFixed(0)}M\u20AC`;
  if (amount >= 1_000) return `${(amount / 1_000).toFixed(0)}k\u20AC`;
  return `${amount}\u20AC`;
}

// ─── Component ───────────────────────────────────────────────────────────────

export function ProductCard({ product, className, isFavorited = false, recommendationScore, aiReason }: ProductCardProps) {
  const {
    id,
    name,
    isin,
    payoffType,
    issuerName,
    underlyingYahoo,
    barrierCapPct,
    couponPct,
    maxGainPct,
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
  const [mounted, setMounted] = useState(false);
  const [isinCopied, setIsinCopied] = useState(false);
  const barRef = useRef<HTMLDivElement>(null);

  // Animate progress bar on mount
  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 50);
    return () => clearTimeout(t);
  }, []);

  // Badge logic
  const isNew = createdAt ? (Date.now() - new Date(createdAt).getTime()) < 7 * 24 * 60 * 60 * 1000 : false;
  const closingDays = shelfClosingDate ? Math.ceil((new Date(shelfClosingDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)) : null;
  const isClosingSoon = closingDays !== null && closingDays > 0 && closingDays <= 30;

  const sriStyle = SRI_PILL_COLORS[sri] ?? SRI_PILL_COLORS[4];

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

  const handleCopyIsin = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    navigator.clipboard.writeText(isin).then(() => {
      setIsinCopied(true);
      setTimeout(() => setIsinCopied(false), 2000);
    });
  };

  return (
    <Link
      href={`/products/${id}`}
      className={cn(
        'stagger-item group relative flex flex-col rounded-xl overflow-hidden',
        'bg-white dark:bg-[#1E1636]',
        'border border-border/50 dark:border-white/[0.06]',
        'transition-all duration-300 ease-out',
        'hover:shadow-xl hover:shadow-violet/[0.08] dark:hover:shadow-violet/[0.15]',
        'hover:scale-[1.01] hover:border-violet/20 dark:hover:border-violet-light/20',
        isClosed && 'opacity-55 saturate-[0.6]',
        className,
      )}
    >
      {/* ── Top accent strip (3px, gradient by payoff type) ── */}
      <div
        className="h-[3px] w-full shrink-0"
        style={{ background: payoff.gradient }}
      />

      {/* ── Hover overlay actions: heart + compare ── */}
      <div className="absolute top-[15px] right-3 z-10 flex items-center gap-1.5">
        <button
          onClick={handleCompare}
          className={cn(
            'p-1.5 rounded-lg transition-all duration-200',
            // Always visible on mobile, hover-only on desktop
            isCompared
              ? 'bg-violet text-white shadow-sm'
              : cn(
                  'bg-white/90 dark:bg-white/10 text-ink-3/40 dark:text-ink-3 border border-transparent',
                  'opacity-100 md:opacity-0 md:group-hover:opacity-100',
                  'hover:text-violet dark:hover:text-violet-light hover:border-violet/20 hover:bg-violet-pale/50 dark:hover:bg-violet/20',
                ),
          )}
          title={isCompared ? 'Retirer de la comparaison' : 'Comparer'}
        >
          {isCompared ? <Check size={13} strokeWidth={3} /> : <Layers size={13} />}
        </button>

        <button
          onClick={handleFavorite}
          className={cn(
            'p-1.5 rounded-lg transition-all duration-200',
            // Larger touch targets on mobile
            'min-w-[28px] min-h-[28px] flex items-center justify-center',
            heartBounce && 'animate-heart-bounce',
            isFavorited
              ? 'text-red bg-red-light dark:bg-red/20'
              : cn(
                  'bg-white/90 dark:bg-white/10 text-ink-3/40 dark:text-ink-3 border border-transparent',
                  'opacity-100 md:opacity-0 md:group-hover:opacity-100',
                  'hover:text-red hover:border-red/20 hover:bg-red-light/50 dark:hover:bg-red/10',
                ),
          )}
          title={isFavorited ? 'Retirer des favoris' : 'Favoris'}
        >
          <Heart size={13} fill={isFavorited ? 'currentColor' : 'none'} />
        </button>
      </div>

      <div className="flex flex-col gap-4 p-5 flex-1">
        {/* ── Header: Payoff badge + status pills + SRI ── */}
        <div className="flex items-center gap-1.5 min-w-0 pr-16">
          {/* Payoff type pill */}
          <span
            className="inline-flex items-center rounded-full px-2.5 py-[3px] text-[10px] font-bold uppercase tracking-wider text-white shrink-0"
            style={{ background: payoff.gradient }}
          >
            {PAYOFF_LABELS[payoffType]}
          </span>

          {/* New badge */}
          {isNew && (
            <span
              className="inline-flex items-center gap-1 rounded-full px-2 py-[3px] text-[9px] font-bold text-white shrink-0"
              style={{ background: 'linear-gradient(135deg, #3D63F5, #5535C4)' }}
            >
              <SparkleIcon size={8} />
              Nouveau
            </span>
          )}

          {/* Closing soon badge */}
          {isClosingSoon && (
            <span
              className="inline-flex items-center gap-1 rounded-full px-2 py-[3px] text-[9px] font-bold text-white shrink-0 animate-pulse-closing"
              style={{ background: 'linear-gradient(135deg, #E8334A, #FF6B81)' }}
            >
              <Clock size={8} />
              J-{closingDays}
            </span>
          )}

          {/* AI recommendation */}
          {recommendationScore != null && recommendationScore >= 70 && (
            <span className="inline-flex items-center gap-1 rounded-full px-2 py-[3px] bg-violet/10 dark:bg-violet/20 text-violet dark:text-violet-light text-[9px] font-bold shrink-0">
              <span className="w-1.5 h-1.5 rounded-full bg-violet dark:bg-violet-light animate-pulse" />
              IA {recommendationScore}%
            </span>
          )}

          <span className="flex-1 min-w-0" />

          {/* SRI numbered pill */}
          <span
            className={cn(
              'inline-flex items-center gap-1 rounded-full px-2 py-[2px] text-[11px] font-bold shrink-0',
              sriStyle.bg, sriStyle.text, sriStyle.darkBg, sriStyle.darkText,
            )}
          >
            SRI {sri}
          </span>
        </div>

        {/* ── Product name + ISIN with copy button ── */}
        <div className="space-y-0.5">
          <p className="font-display text-[15px] font-bold text-ink dark:text-white leading-snug truncate group-hover:text-violet dark:group-hover:text-violet-light transition-colors duration-200">
            {name}
          </p>
          <div className="flex items-center gap-1.5">
            <p className="font-mono text-[11px] text-ink-3 dark:text-ink-3 tabular-nums">
              {isin}
            </p>
            <button
              onClick={handleCopyIsin}
              className={cn(
                'p-0.5 rounded transition-all duration-200',
                'hover:bg-surface-2 dark:hover:bg-white/10',
                isinCopied
                  ? 'text-teal'
                  : 'text-ink-3/40 hover:text-ink-3 dark:hover:text-ink-3',
              )}
              title="Copier l'ISIN"
            >
              {isinCopied ? <Check size={11} strokeWidth={2.5} /> : <Copy size={11} />}
            </button>
          </div>
        </div>

        {/* ── Issuer + Underlying row ── */}
        <div className="flex items-center gap-2 -mt-1 flex-wrap">
          <span
            className="w-2 h-2 rounded-full shrink-0"
            style={{ backgroundColor: payoff.dot }}
          />
          <p className="text-[12px] text-ink-2 dark:text-ink-3 truncate font-body">
            {issuerName}
          </p>
          {underlyingYahoo && (
            <>
              <span className="text-ink-3/20 dark:text-ink-3/15">·</span>
              <span className="text-[10px] font-mono text-ink-3/70 dark:text-ink-3/50 bg-surface-2/80 dark:bg-white/[0.04] px-1.5 py-[1px] rounded-md truncate">
                {underlyingYahoo}
              </span>
            </>
          )}
        </div>

        {/* ── AI Insight (when available) ── */}
        {aiReason && (
          <div className="flex items-start gap-2 px-2.5 py-2 rounded-lg bg-gradient-to-r from-violet/[0.06] to-cobalt-pale/30 border border-violet/10 -mt-0.5">
            <SparkleIcon size={11} className="text-violet shrink-0 mt-0.5" />
            <p className="text-[10px] text-ink-2 dark:text-ink-3 font-body leading-relaxed line-clamp-2">
              {aiReason}
            </p>
          </div>
        )}

        {/* ── Key metrics grid (2 cols mobile, 4 cols desktop) ── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          {/* Coupon (hero) */}
          <Tooltip content="Taux de coupon annuel conditionnel" side="top">
            <div className="flex flex-col gap-0.5 cursor-default">
              <span className="text-[8px] uppercase tracking-widest text-ink-3/70 dark:text-ink-3/50 font-semibold">
                Coupon
              </span>
              <span className="font-display text-[18px] font-extrabold leading-none" style={{ color: couponPct != null && couponPct > 0 ? '#008B6E' : undefined }}>
                {couponPct != null && couponPct > 0 ? (
                  <>{couponPct.toFixed(1)}<span className="text-[12px] font-bold opacity-50">%</span></>
                ) : (
                  <span className="text-[13px] text-ink-3/40 dark:text-ink-3/30">&mdash;</span>
                )}
              </span>
            </div>
          </Tooltip>

          {/* Gain max */}
          <Tooltip content="Gain maximum potentiel a maturite" side="top">
            <div className="flex flex-col gap-0.5 cursor-default">
              <span className="text-[8px] uppercase tracking-widest text-ink-3/70 dark:text-ink-3/50 font-semibold">
                Gain max
              </span>
              <span className="font-display text-[18px] font-extrabold text-ink dark:text-white leading-none">
                {(maxGainPct ?? 0).toFixed(0)}
                <span className="text-[12px] font-bold text-ink-3/50 dark:text-ink-3/40">%</span>
              </span>
            </div>
          </Tooltip>

          {/* Barriere */}
          <Tooltip content="Niveau de protection du capital" side="top">
            <div className="flex flex-col gap-0.5 cursor-default">
              <span className="text-[8px] uppercase tracking-widest text-ink-3/70 dark:text-ink-3/50 font-semibold">
                Barriere
              </span>
              <span className="font-display text-[18px] font-extrabold text-orange-600 dark:text-orange-400 leading-none">
                {(barrierCapPct ?? 0).toFixed(0)}
                <span className="text-[12px] font-bold text-orange-400/60 dark:text-orange-500/50">%</span>
              </span>
            </div>
          </Tooltip>

          {/* Echeance */}
          <Tooltip content="Date de maturite du produit" side="top">
            <div className="flex flex-col gap-0.5 cursor-default">
              <span className="text-[8px] uppercase tracking-widest text-ink-3/70 dark:text-ink-3/50 font-semibold">
                Echeance
              </span>
              <span className="font-display text-[13px] font-bold text-ink dark:text-white leading-none mt-[3px]">
                {formatDate(maturityDate)}
              </span>
            </div>
          </Tooltip>
        </div>

        {/* ── Enveloppe progress bar with shimmer and threshold markers ── */}
        <div className="flex flex-col gap-1.5 mt-auto">
          <div className="flex items-center justify-between">
            <span className="text-[11px] text-ink-3 dark:text-ink-3 font-body flex items-center gap-1.5">
              Enveloppe
              {clampedFill > 90 && (
                <span className="inline-flex items-center gap-0.5 px-1.5 py-[1px] rounded-full text-[9px] font-bold text-white bg-gradient-to-r from-[#E8334A] to-[#FF6B81] animate-pulse">
                  <AlertTriangle size={8} />
                  Presque complet
                </span>
              )}
            </span>
            <span className="text-[11px] font-semibold text-ink-2 dark:text-ink-3 tabular-nums font-mono">
              {(fillPct ?? 0).toFixed(0)}%
              <span className="font-normal text-ink-3/70 dark:text-ink-3/50 ml-1">
                / {formatCompact(targetAmount ?? 0)}
              </span>
            </span>
          </div>
          <div className="relative h-[6px] w-full overflow-hidden rounded-full bg-ink/[0.05] dark:bg-white/[0.06]">
            {/* Threshold markers when fill >= 80% */}
            {clampedFill >= 80 && (
              <>
                <div
                  className="absolute top-0 h-full w-[1px] bg-ink/20 dark:bg-white/20 z-10"
                  style={{ left: '80%' }}
                />
                <div
                  className="absolute top-0 h-full w-[1px] bg-ink/30 dark:bg-white/30 z-10"
                  style={{ left: '100%' }}
                />
              </>
            )}
            <div
              ref={barRef}
              className={cn(
                'h-full rounded-full transition-[width] duration-700 ease-out relative overflow-hidden',
              )}
              style={{
                width: mounted ? `${clampedFill}%` : '0%',
                background: clampedFill >= 80
                  ? 'linear-gradient(90deg, #00B894, #2ECC71, #00D4AA)'
                  : 'linear-gradient(90deg, #3B1FA8, #5535C4, #7B5FE0)',
              }}
            >
              {/* Shimmer effect */}
              <div
                className="absolute inset-0 opacity-30"
                style={{
                  background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.6) 50%, transparent 100%)',
                  animation: 'shimmer 2s ease-in-out infinite',
                }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* ── Footer CTA ── */}
      <div className="px-5 py-3 border-t border-border/30 dark:border-white/[0.04] flex items-center justify-between">
        <span className={cn(
          'text-[12px] font-semibold transition-colors duration-200',
          isClosed
            ? 'text-ink-3'
            : 'text-ink-3 group-hover:text-violet dark:group-hover:text-violet-light',
        )}>
          {isClosed ? 'Produit ferme' : "Marque d'interet"}
        </span>
        {!isClosed && (
          <ArrowRight
            size={14}
            className="text-ink-3/30 dark:text-ink-3/20 group-hover:text-violet dark:group-hover:text-violet-light group-hover:translate-x-1 transition-all duration-200"
          />
        )}
      </div>

    </Link>
  );
}
