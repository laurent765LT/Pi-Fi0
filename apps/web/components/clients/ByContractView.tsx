'use client';

import { useState } from 'react';
import { ChevronDown, ChevronRight, Shield, TrendingUp, TrendingDown } from 'lucide-react';
import { cn } from '@/lib/cn';
import { Badge } from '@/components/ui/badge';
import {
  PAYOFF_LABELS,
  type ClientPortfolioAggregate,
} from '@/lib/portfolio/aggregation-engine';
import { INSURER_COLORS } from '@/stores/clients-consolidated-store';

interface ByContractViewProps {
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

export function ByContractView({ aggregate, className }: ByContractViewProps) {
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  if (aggregate.contracts.length === 0) {
    return (
      <div className="text-center py-10 text-ink-3 text-sm">
        Aucun contrat enregistré.
      </div>
    );
  }

  return (
    <div className={cn('grid grid-cols-1 md:grid-cols-2 gap-4', className)}>
      {aggregate.contracts.map((ctr) => {
        const isOpen = expanded[ctr.contract.id] ?? false;
        const color = INSURER_COLORS[ctr.contract.insurer];
        const ytdPositive = ctr.ytdPct >= 0;

        return (
          <article
            key={ctr.contract.id}
            className={cn(
              'rounded-xl border overflow-hidden bg-white dark:bg-white/[0.03]',
              'transition-all duration-200 hover:shadow-md',
            )}
            style={{ borderColor: `${color}30` }}
          >
            {/* Accent bar */}
            <div
              className="h-[3px]"
              style={{
                background: `linear-gradient(90deg, ${color} 0%, ${color}66 100%)`,
              }}
              aria-hidden
            />
            <header className="p-4 flex items-start justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                  style={{ background: `${color}16` }}
                >
                  <Shield size={18} style={{ color }} />
                </div>
                <div className="min-w-0">
                  <h4 className="font-display font-bold text-[15px] text-ink dark:text-white truncate">
                    {ctr.contract.insurer}
                  </h4>
                  <p className="text-[11px] text-ink-3 font-mono truncate">
                    {ctr.contract.id}
                  </p>
                </div>
              </div>
              <span
                className={cn(
                  'inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold font-mono tabular-nums',
                  ytdPositive ? 'bg-teal/10 text-teal' : 'bg-red/10 text-red',
                )}
              >
                {ytdPositive ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
                {ytdPositive ? '+' : ''}
                {ctr.ytdPct.toFixed(2)}% YTD
              </span>
            </header>

            <dl className="grid grid-cols-2 gap-2 px-4 pb-3 text-[12px]">
              <div>
                <dt className="text-[9px] uppercase tracking-[0.16em] text-ink-3 font-bold">
                  Produits
                </dt>
                <dd className="font-display font-bold text-[16px] text-ink dark:text-white mt-0.5 tabular-nums">
                  {ctr.productsCount}
                </dd>
              </div>
              <div>
                <dt className="text-[9px] uppercase tracking-[0.16em] text-ink-3 font-bold">
                  Montant total
                </dt>
                <dd className="font-display font-bold text-[16px] text-ink dark:text-white mt-0.5 tabular-nums">
                  {formatAmount(ctr.amountTotal)}
                </dd>
              </div>
            </dl>

            <button
              type="button"
              onClick={() =>
                setExpanded((prev) => ({
                  ...prev,
                  [ctr.contract.id]: !prev[ctr.contract.id],
                }))
              }
              aria-expanded={isOpen}
              aria-controls={`ctr-body-${ctr.contract.id}`}
              className={cn(
                'w-full px-4 py-2.5 border-t border-border/60',
                'flex items-center gap-1.5',
                'text-[12px] font-semibold text-ink-2 dark:text-white/80',
                'hover:bg-violet-pale/40 dark:hover:bg-white/[0.04]',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet focus-visible:ring-inset',
                'transition-colors duration-150',
              )}
            >
              {isOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
              Voir les {ctr.productsCount} produit{ctr.productsCount > 1 ? 's' : ''}
            </button>

            {isOpen && (
              <ul
                id={`ctr-body-${ctr.contract.id}`}
                className="border-t border-border/60 divide-y divide-border/60"
              >
                {ctr.products.map((p, i) => (
                  <li
                    key={`${p.productId}-${i}`}
                    className="px-4 py-2.5 flex items-center gap-3"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="text-[12.5px] font-semibold text-ink dark:text-white truncate">
                        {p.product?.name ?? p.productId}
                      </p>
                      <p className="text-[10.5px] text-ink-3 truncate">
                        {p.product?.issuerName ?? '—'}
                      </p>
                    </div>
                    <Badge variant="violet" size="sm" className="shrink-0">
                      {p.product?.payoffType
                        ? PAYOFF_LABELS[p.product.payoffType] ?? p.product.payoffType
                        : '—'}
                    </Badge>
                    <span className="font-mono text-[11.5px] font-semibold text-ink-2 dark:text-white/80 tabular-nums shrink-0">
                      {formatAmount(p.amount)}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </article>
        );
      })}
    </div>
  );
}
