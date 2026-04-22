'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import { Sparkles, ArrowUpRight } from 'lucide-react';
import { cn } from '@/lib/cn';
import { useSecondaryPricingStore } from '@/stores/secondary-pricing-store';
import {
  opportunityTypeColor,
  opportunityTypeLabel,
} from '@/lib/secondary/opportunity-scorer';
import { DEMO_PRODUCTS } from '@/lib/demo-data';

interface SecondaryOpportunityBannerProps {
  /** Restrict to products the user actually holds. */
  portfolioProductIds?: string[];
  className?: string;
}

export function SecondaryOpportunityBanner({
  portfolioProductIds,
  className,
}: SecondaryOpportunityBannerProps) {
  const opportunities = useSecondaryPricingStore((s) => s.opportunities);

  const relevant = useMemo(() => {
    if (portfolioProductIds && portfolioProductIds.length > 0) {
      const set = new Set(portfolioProductIds);
      return opportunities.filter((opp) => set.has(opp.productId));
    }
    return opportunities;
  }, [opportunities, portfolioProductIds]);

  const top3 = relevant.slice(0, 3);
  const productMap = useMemo(() => new Map(DEMO_PRODUCTS.map((p) => [p.id, p])), []);

  if (top3.length === 0) return null;

  return (
    <div
      className={cn(
        'relative bg-gradient-to-r from-[#D4A017]/8 via-[#3B1FA8]/5 to-[#5B3FD4]/5 border border-[#D4A017]/25 rounded-xl p-4 overflow-hidden',
        className,
      )}
    >
      <div
        className="absolute top-0 left-0 right-0 h-[3px] rounded-b-full"
        style={{ background: 'linear-gradient(90deg, #D4A017, #3B1FA8, #5B3FD4)' }}
      />

      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#D4A017] to-[#E8B83A] flex items-center justify-center shadow-md shadow-[#D4A017]/20 shrink-0">
            <Sparkles size={16} className="text-white" />
          </div>
          <div>
            <div className="font-display text-sm font-bold text-ink">
              {relevant.length} opportunité{relevant.length > 1 ? 's' : ''} secondaire
              {relevant.length > 1 ? 's' : ''} détectée{relevant.length > 1 ? 's' : ''} sur votre portefeuille
            </div>
            <div className="text-[11px] font-body text-ink-3">
              Top 3 ci-dessous · cliquez pour explorer le marché secondaire
            </div>
          </div>
        </div>

        <Link
          href="/secondaire"
          className="inline-flex items-center gap-1.5 h-9 px-4 rounded-lg font-body text-[12px] font-semibold bg-[#3B1FA8] text-white hover:bg-[#2E1883] transition-colors"
        >
          Voir le marché secondaire
          <ArrowUpRight size={13} />
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-2 mt-4">
        {top3.map((opp) => {
          const product = productMap.get(opp.productId);
          if (!product) return null;
          const color = opportunityTypeColor(opp.type);

          return (
            <div
              key={`${opp.productId}-${opp.type}`}
              className="bg-white/70 dark:bg-white/5 backdrop-blur-sm rounded-lg border border-border/40 p-3"
            >
              <div className="flex items-center justify-between mb-1">
                <span
                  className="text-[9px] uppercase tracking-wider font-bold px-1.5 py-0.5 rounded-full border"
                  style={{
                    background: `${color}15`,
                    color,
                    borderColor: `${color}40`,
                  }}
                >
                  {opportunityTypeLabel(opp.type)}
                </span>
                <span className="font-display text-sm font-bold text-ink">
                  {opp.score.toFixed(0)}
                </span>
              </div>
              <div className="font-body text-[12px] font-semibold text-ink truncate">
                {product.name}
              </div>
              <div className="text-[10px] font-body text-ink-3 line-clamp-2 mt-0.5">
                {opp.reason}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
