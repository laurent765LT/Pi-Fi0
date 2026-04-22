'use client';

import { useMemo } from 'react';
import { DollarSign, Wallet } from 'lucide-react';
import { cn } from '@/lib/cn';
import { Badge } from '@/components/ui/badge';
import { useSecondaryPricingStore, type LiquidityTier } from '@/stores/secondary-pricing-store';

const LIQUIDITY_VARIANT: Record<LiquidityTier, 'teal' | 'gold' | 'muted' | 'red'> = {
  Excellent: 'teal',
  Bon: 'gold',
  Moyen: 'muted',
  Faible: 'red',
};

interface SecondaryPricingProps {
  productId: string;
  onSell?: () => void;
  className?: string;
}

function fmtTimeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const minutes = Math.max(1, Math.floor(diff / 60_000));
  if (minutes < 60) return `il y a ${minutes} min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `il y a ${hours}h`;
  const days = Math.floor(hours / 24);
  return `il y a ${days}j`;
}

export function SecondaryPricing({ productId, onSell, className }: SecondaryPricingProps) {
  const quote = useSecondaryPricingStore((s) => s.quotes[productId]);
  const lastSync = useSecondaryPricingStore((s) => s.lastSync);

  const relativeAgo = useMemo(() => (quote ? fmtTimeAgo(quote.timestamp || lastSync) : ''), [quote, lastSync]);

  if (!quote) {
    return (
      <div
        className={cn(
          'flex items-center gap-2 text-[11px] font-body text-ink-3 italic',
          className,
        )}
      >
        Cotation secondaire indisponible.
      </div>
    );
  }

  return (
    <div
      className={cn(
        'flex items-center flex-wrap gap-3 text-[11px] font-body',
        className,
      )}
    >
      <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-surface-2/60 border border-border/40">
        <DollarSign size={12} className="text-[#3B1FA8]" />
        <span className="text-ink-3 font-semibold uppercase tracking-wider text-[9px]">Bid/Ask</span>
        <span className="font-mono font-semibold text-ink">
          {quote.bid.toFixed(2)} / {quote.ask.toFixed(2)}
        </span>
        <span className="text-ink-3">({quote.spread.toFixed(0)}bps)</span>
      </div>

      <Badge variant={LIQUIDITY_VARIANT[quote.liquidity]} size="sm">
        {quote.liquidity}
      </Badge>

      <span className="text-ink-3 text-[10px]">MàJ {relativeAgo}</span>

      {onSell && (
        <button
          type="button"
          onClick={onSell}
          className={cn(
            'inline-flex items-center gap-1 h-7 px-3 rounded-lg font-body font-semibold text-[11px]',
            'bg-gradient-to-r from-[#3B1FA8] to-[#5B3FD4] text-white shadow-sm shadow-violet/15',
            'hover:shadow-md hover:shadow-violet/25 active:scale-[0.98] transition-all duration-200',
          )}
          aria-label="Vendre anticipé"
        >
          <Wallet size={12} />
          Vendre anticipé
        </button>
      )}
    </div>
  );
}
