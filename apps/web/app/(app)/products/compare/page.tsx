'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Trophy, Shield, TrendingUp, X } from 'lucide-react';
import { useCompareStore } from '@/stores/compare-store';
import { useProduct } from '@/hooks/use-products';
import { cn } from '@/lib/cn';
import type { Product, PayoffType } from '@/components/products/product-card';

// ─── Constants ───────────────────────────────────────────────────────────────

const PAYOFF_GRADIENTS: Record<string, string> = {
  AUTOCALL_PHOENIX: 'linear-gradient(135deg, #3B1FA8, #7B5FE0)',
  AUTOCALL_COUPON: 'linear-gradient(135deg, #5535C4, #9B7FF0)',
  CAPITAL_PROTECTED: 'linear-gradient(135deg, #008B6E, #00D4AA)',
  CONDITIONAL_RATE: 'linear-gradient(135deg, #0A2799, #3D63F5)',
  BARRIER_NOTE: 'linear-gradient(135deg, #D4A017, #F0C84D)',
};

const PAYOFF_LABELS: Record<string, string> = {
  AUTOCALL_PHOENIX: 'Phoenix',
  AUTOCALL_COUPON: 'Autocall',
  CAPITAL_PROTECTED: 'Capital Protégé',
  CONDITIONAL_RATE: 'Taux Cond.',
  BARRIER_NOTE: 'Barrier',
};

const STATUS_LABELS: Record<string, string> = {
  ACTIVE: 'Actif',
  CLOSED: 'Fermé',
  MATURED: 'Maturé',
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatDate(isoDate: string): string {
  return new Date(isoDate).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

type HighlightMode = 'highest' | 'lowest' | 'none';

function getBestIndex(values: (number | null | undefined)[], mode: HighlightMode): number | null {
  if (mode === 'none') return null;
  let bestIdx: number | null = null;
  let bestVal: number | null = null;
  values.forEach((v, i) => {
    if (v == null) return;
    if (bestVal == null) {
      bestVal = v;
      bestIdx = i;
    } else if (mode === 'highest' && v > bestVal) {
      bestVal = v;
      bestIdx = i;
    } else if (mode === 'lowest' && v < bestVal) {
      bestVal = v;
      bestIdx = i;
    }
  });
  return bestIdx;
}

// ─── Product column fetcher ──────────────────────────────────────────────────

function ProductColumn({ id, index, products, setProduct }: {
  id: string;
  index: number;
  products: (Product | null)[];
  setProduct: (idx: number, p: Product) => void;
}) {
  const { data } = useProduct(id);
  useEffect(() => {
    if (data && !products[index]) {
      setProduct(index, data as Product);
    }
  }, [data, index, products, setProduct]);
  return null;
}

// ─── Main Page ───────────────────────────────────────────────────────────────

export default function ComparePage() {
  const productIds = useCompareStore((s) => s.productIds);
  const removeProduct = useCompareStore((s) => s.removeProduct);
  const [products, setProducts] = useState<(Product | null)[]>([]);

  const handleSetProduct = (idx: number, p: Product) => {
    setProducts((prev) => {
      const next = [...prev];
      next[idx] = p;
      return next;
    });
  };

  // Reset products state when productIds change
  useEffect(() => {
    setProducts(new Array(productIds.length).fill(null));
  }, [productIds.length]);

  const loaded = products.filter(Boolean) as Product[];
  const allLoaded = loaded.length === productIds.length && productIds.length >= 2;

  // ── Row definitions ────────────────────────────────────────────────────────

  interface Row {
    label: string;
    icon?: React.ReactNode;
    getValue: (p: Product) => string;
    getNumeric?: (p: Product) => number | null;
    highlight: HighlightMode;
  }

  const rows: Row[] = [
    {
      label: 'Nom',
      getValue: (p) => p.name,
      highlight: 'none',
    },
    {
      label: 'Émetteur',
      getValue: (p) => p.issuerName,
      highlight: 'none',
    },
    {
      label: 'Type',
      getValue: (p) => PAYOFF_LABELS[p.payoffType] ?? p.payoffType,
      highlight: 'none',
    },
    {
      label: 'Sous-jacent',
      getValue: (p) => p.underlyingYahoo,
      highlight: 'none',
    },
    {
      label: 'Coupon',
      icon: <TrendingUp size={14} className="text-violet" />,
      getValue: (p) => p.couponPct != null ? `${p.couponPct.toFixed(1)}%` : '--',
      getNumeric: (p) => p.couponPct,
      highlight: 'highest',
    },
    {
      label: 'Gain max',
      icon: <Trophy size={14} className="text-gold" />,
      getValue: (p) => p.maxGainPct != null ? `${p.maxGainPct.toFixed(0)}%` : '--',
      getNumeric: (p) => p.maxGainPct ?? null,
      highlight: 'highest',
    },
    {
      label: 'Barrière capital',
      icon: <Shield size={14} className="text-emerald-500" />,
      getValue: (p) => p.barrierCapPct != null ? `${p.barrierCapPct}%` : '--',
      getNumeric: (p) => p.barrierCapPct,
      highlight: 'highest', // Higher barrier = more protection
    },
    {
      label: 'Barrière autocall',
      getValue: (p) => p.autocallBarrierPct != null ? `${p.autocallBarrierPct}%` : '--',
      getNumeric: (p) => p.autocallBarrierPct,
      highlight: 'lowest', // Lower autocall barrier = easier to trigger
    },
    {
      label: 'SRI',
      getValue: (p) => `${p.sri}/7`,
      getNumeric: (p) => p.sri,
      highlight: 'lowest', // Lower SRI = less risk
    },
    {
      label: 'Maturité',
      getValue: (p) => formatDate(p.maturityDate),
      highlight: 'none',
    },
    {
      label: 'Frais d\'entrée',
      getValue: (p) => `${p.entryFeePct.toFixed(2)}%`,
      getNumeric: (p) => p.entryFeePct,
      highlight: 'lowest', // Lower fees = better
    },
    {
      label: 'Status',
      getValue: (p) => STATUS_LABELS[p.status] ?? p.status,
      highlight: 'none',
    },
  ];

  // ── Empty state ────────────────────────────────────────────────────────────

  if (productIds.length < 2) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6">
        <div
          className="w-20 h-20 rounded-2xl flex items-center justify-center"
          style={{
            background: 'linear-gradient(135deg, rgba(59,31,168,0.1), rgba(123,95,224,0.1))',
          }}
        >
          <Shield size={36} className="text-violet" />
        </div>
        <div className="text-center">
          <h2 className="text-xl font-display font-bold text-ink mb-2">
            Comparaison de produits
          </h2>
          <p className="text-sm text-ink-3 max-w-md">
            Sélectionnez au moins 2 produits depuis le catalogue pour les comparer
            côte à côte. Vous pouvez comparer jusqu&apos;à 3 produits.
          </p>
        </div>
        <Link
          href="/products"
          className="inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold text-white transition-all hover:shadow-lg"
          style={{ background: 'linear-gradient(135deg, #3B1FA8, #5535C4)' }}
        >
          <ArrowLeft size={16} />
          Retour au catalogue
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Fetch products */}
      {productIds.map((id, i) => (
        <ProductColumn key={id} id={id} index={i} products={products} setProduct={handleSetProduct} />
      ))}

      {/* Header */}
      <div className="flex items-center gap-4">
        <Link
          href="/products"
          className="inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium text-ink-3 hover:text-ink hover:bg-surface-2 transition-all"
        >
          <ArrowLeft size={16} />
          Retour
        </Link>
        <h1 className="text-2xl font-display font-bold text-ink">
          Comparaison
        </h1>
        <span className="text-sm text-ink-3">
          {productIds.length} produit{productIds.length > 1 ? 's' : ''}
        </span>
      </div>

      {/* Loading state */}
      {!allLoaded && (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-2 border-violet/30 border-t-violet rounded-full animate-spin" />
        </div>
      )}

      {/* Comparison table */}
      {allLoaded && (
        <div className="overflow-x-auto rounded-2xl border border-border/60 bg-white dark:bg-white/5 shadow-sm hover:shadow-md transition-shadow duration-200">
          <table className="w-full min-w-[600px]">
            {/* Column headers — product cards */}
            <thead>
              <tr>
                <th className="w-[160px] p-4 text-left align-bottom">
                  <span className="text-xs font-semibold uppercase tracking-wider text-ink-3">
                    Critere
                  </span>
                </th>
                {loaded.map((product, colIdx) => (
                  <th key={product.id} className="p-0 align-bottom min-w-[200px]">
                    <div className="relative m-2 rounded-xl overflow-hidden">
                      <div
                        className="px-4 py-4 text-left"
                        style={{
                          background: PAYOFF_GRADIENTS[product.payoffType] ?? PAYOFF_GRADIENTS.AUTOCALL_PHOENIX,
                        }}
                      >
                        <button
                          onClick={() => removeProduct(product.id)}
                          className="absolute top-2 right-2 p-1 rounded-full bg-white/20 hover:bg-white/40 text-white transition-colors"
                        >
                          <X size={12} />
                        </button>
                        <span className="inline-block rounded-md px-2 py-0.5 text-[10px] font-bold text-white/80 bg-white/15 mb-2">
                          {PAYOFF_LABELS[product.payoffType]}
                        </span>
                        <p className="text-sm font-bold text-white leading-snug line-clamp-2">
                          {product.name}
                        </p>
                        <p className="text-[10px] text-white/60 font-mono mt-1">
                          {product.isin}
                        </p>
                      </div>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>

            {/* Data rows */}
            <tbody>
              {rows.map((row, rowIdx) => {
                const numericValues = row.getNumeric
                  ? loaded.map((p) => row.getNumeric!(p))
                  : [];
                const bestIdx = row.getNumeric
                  ? getBestIndex(numericValues, row.highlight)
                  : null;

                return (
                  <tr
                    key={row.label}
                    className={cn(
                      'border-t border-border/40 hover:bg-violet/[0.02] transition-colors',
                      rowIdx % 2 === 0 ? 'bg-white dark:bg-transparent' : 'bg-surface/30 dark:bg-white/[0.02]',
                    )}
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        {row.icon}
                        <span className="text-xs font-semibold text-ink-2">
                          {row.label}
                        </span>
                      </div>
                    </td>
                    {loaded.map((product, colIdx) => {
                      const isBest = bestIdx === colIdx;
                      return (
                        <td key={product.id} className="px-4 py-3">
                          <div className="mx-2">
                            <span
                              className={cn(
                                'text-sm font-body',
                                isBest
                                  ? 'font-bold text-violet'
                                  : 'text-ink',
                              )}
                            >
                              {row.getValue(product)}
                              {isBest && (
                                <span
                                  className="inline-flex items-center justify-center w-4 h-4 rounded-full ml-1.5 align-middle"
                                  style={{
                                    background: 'linear-gradient(135deg, rgba(59,31,168,0.12), rgba(123,95,224,0.12))',
                                  }}
                                >
                                  <Trophy size={9} className="text-violet" />
                                </span>
                              )}
                            </span>
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Bottom action */}
      {allLoaded && (
        <div className="flex justify-center pt-2 pb-8">
          <Link
            href="/products"
            className="inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold text-white transition-all hover:shadow-lg"
            style={{ background: 'linear-gradient(135deg, #3B1FA8, #5535C4)' }}
          >
            <ArrowLeft size={16} />
            Retour au catalogue
          </Link>
        </div>
      )}
    </div>
  );
}
