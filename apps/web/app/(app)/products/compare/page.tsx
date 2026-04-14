'use client';

import { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import { ArrowLeft, Trophy, Shield, TrendingUp, X, Check, ToggleLeft, ToggleRight } from 'lucide-react';
import { useCompareStore } from '@/stores/compare-store';
import { useProduct } from '@/hooks/use-products';
import { cn } from '@/lib/cn';
import type { Product } from '@/components/products/product-card';

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
  CAPITAL_PROTECTED: 'Capital Protege',
  CONDITIONAL_RATE: 'Taux Cond.',
  BARRIER_NOTE: 'Barrier',
};

const STATUS_LABELS: Record<string, string> = {
  ACTIVE: 'Actif',
  CLOSED: 'Ferme',
  MATURED: 'Mature',
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

function getWorstIndex(values: (number | null | undefined)[], mode: HighlightMode): number | null {
  if (mode === 'none') return null;
  // worst is the opposite of best
  const flipped: HighlightMode = mode === 'highest' ? 'lowest' : 'highest';
  return getBestIndex(values, flipped);
}

function valuesAllSame(values: string[]): boolean {
  if (values.length <= 1) return true;
  return values.every((v) => v === values[0]);
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

// ─── Quick Metrics Summary ──────────────────────────────────────────────────

interface QuickMetric {
  label: string;
  getValue: (p: Product) => number | null | undefined;
  mode: HighlightMode;
  format: (v: number | null | undefined) => string;
}

const QUICK_METRICS: QuickMetric[] = [
  {
    label: 'Coupon',
    getValue: (p) => p.couponPct,
    mode: 'highest',
    format: (v) => v != null ? `${v.toFixed(1)}%` : '--',
  },
  {
    label: 'Barriere',
    getValue: (p) => p.barrierCapPct,
    mode: 'highest',
    format: (v) => v != null ? `${v}%` : '--',
  },
  {
    label: 'SRI',
    getValue: (p) => p.sri,
    mode: 'lowest',
    format: (v) => v != null ? `${v}/7` : '--',
  },
  {
    label: 'Frais',
    getValue: (p) => p.entryFeePct,
    mode: 'lowest',
    format: (v) => v != null ? `${v.toFixed(2)}%` : '--',
  },
];

function QuickMetricsSummary({ products }: { products: Product[] }) {
  return (
    <div className="rounded-2xl border border-border/60 bg-white dark:bg-white/5 shadow-sm p-4 overflow-hidden">
      <h3 className="text-xs font-display font-bold text-ink mb-3 flex items-center gap-2">
        <Trophy size={14} className="text-[#D4A017]" />
        Verdict rapide
      </h3>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {QUICK_METRICS.map((metric) => {
          const values = products.map((p) => metric.getValue(p));
          const bestIdx = getBestIndex(values, metric.mode);
          const winner = bestIdx != null ? products[bestIdx] : null;

          return (
            <div
              key={metric.label}
              className="flex flex-col items-center gap-1.5 py-2.5 px-2 rounded-xl bg-surface-2/50 dark:bg-white/[0.03] border border-border/40"
            >
              <span className="text-[9px] uppercase tracking-wider text-ink-3 font-semibold font-body">
                {metric.label}
              </span>
              {winner ? (
                <>
                  <div className="flex items-center gap-1">
                    <Check size={11} className="text-[#00B894]" />
                    <span className="text-xs font-bold font-display text-ink truncate max-w-[100px]">
                      {winner.name.split(' ').slice(0, 2).join(' ')}
                    </span>
                  </div>
                  <span className="text-[10px] font-mono font-semibold tabular-nums text-[#3B1FA8]">
                    {metric.format(metric.getValue(winner))}
                  </span>
                </>
              ) : (
                <span className="text-[10px] text-ink-3">Egalite</span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Mobile Card View ───────────────────────────────────────────────────────

interface Row {
  label: string;
  icon?: React.ReactNode;
  getValue: (p: Product) => string;
  getNumeric?: (p: Product) => number | null;
  highlight: HighlightMode;
}

function MobileCardView({ products, rows, removeProduct }: {
  products: Product[];
  rows: Row[];
  removeProduct: (id: string) => void;
}) {
  return (
    <div className="flex flex-col gap-4 md:hidden">
      {products.map((product, idx) => (
        <div key={product.id} className="animate-fade-in" style={{ animationDelay: `${idx * 100}ms` }}>
          {idx > 0 && (
            <div className="flex items-center justify-center gap-3 py-3">
              <div className="h-px flex-1 bg-border/60" />
              <span className="font-display text-sm font-bold text-[#3B1FA8] bg-[#3B1FA8]/10 px-3 py-1 rounded-full">
                VS
              </span>
              <div className="h-px flex-1 bg-border/60" />
            </div>
          )}
          <div className="rounded-2xl border border-border/60 bg-white dark:bg-white/5 shadow-sm overflow-hidden">
            {/* Card header */}
            <div
              className="relative px-4 py-4"
              style={{
                background: PAYOFF_GRADIENTS[product.payoffType] ?? PAYOFF_GRADIENTS.AUTOCALL_PHOENIX,
              }}
            >
              <button
                onClick={() => removeProduct(product.id)}
                className="absolute top-2 right-2 p-1.5 rounded-full bg-white/20 hover:bg-white/40 text-white transition-colors"
              >
                <X size={12} />
              </button>
              <span className="inline-block rounded-md px-2 py-0.5 text-[10px] font-bold text-white/80 bg-white/15 mb-2">
                {PAYOFF_LABELS[product.payoffType]}
              </span>
              <p className="text-sm font-bold text-white leading-snug">
                {product.name}
              </p>
              <p className="text-[10px] text-white/60 font-mono mt-1">
                {product.isin}
              </p>
            </div>
            {/* Card body */}
            <div className="divide-y divide-border/40">
              {rows.map((row) => (
                <div key={row.label} className="flex items-center justify-between px-4 py-2.5">
                  <div className="flex items-center gap-2">
                    {row.icon}
                    <span className="text-xs font-semibold text-ink-2 font-body">
                      {row.label}
                    </span>
                  </div>
                  <span className="text-sm font-body font-semibold text-ink tabular-nums">
                    {row.getValue(product)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Main Page ───────────────────────────────────────────────────────────────

export default function ComparePage() {
  const productIds = useCompareStore((s) => s.productIds);
  const removeProduct = useCompareStore((s) => s.removeProduct);
  const [products, setProducts] = useState<(Product | null)[]>([]);
  const [highlightDiffs, setHighlightDiffs] = useState(false);
  const [removingId, setRemovingId] = useState<string | null>(null);

  const handleSetProduct = (idx: number, p: Product) => {
    setProducts((prev) => {
      const next = [...prev];
      next[idx] = p;
      return next;
    });
  };

  const handleRemoveProduct = (id: string) => {
    setRemovingId(id);
    // Animate out, then remove
    setTimeout(() => {
      removeProduct(id);
      setRemovingId(null);
    }, 300);
  };

  // Reset products state when productIds change
  useEffect(() => {
    setProducts(new Array(productIds.length).fill(null));
  }, [productIds.length]);

  const loaded = products.filter(Boolean) as Product[];
  const allLoaded = loaded.length === productIds.length && productIds.length >= 2;

  // ── Row definitions ────────────────────────────────────────────────────────

  const rows: Row[] = useMemo(() => [
    {
      label: 'Nom',
      getValue: (p) => p.name,
      highlight: 'none',
    },
    {
      label: 'Emetteur',
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
      icon: <TrendingUp size={14} className="text-[#3B1FA8]" />,
      getValue: (p) => p.couponPct != null ? `${p.couponPct.toFixed(1)}%` : '--',
      getNumeric: (p) => p.couponPct,
      highlight: 'highest',
    },
    {
      label: 'Gain max',
      icon: <Trophy size={14} className="text-[#D4A017]" />,
      getValue: (p) => p.maxGainPct != null ? `${p.maxGainPct.toFixed(0)}%` : '--',
      getNumeric: (p) => p.maxGainPct ?? null,
      highlight: 'highest',
    },
    {
      label: 'Barriere capital',
      icon: <Shield size={14} className="text-emerald-500" />,
      getValue: (p) => p.barrierCapPct != null ? `${p.barrierCapPct}%` : '--',
      getNumeric: (p) => p.barrierCapPct,
      highlight: 'highest',
    },
    {
      label: 'Barriere autocall',
      getValue: (p) => p.autocallBarrierPct != null ? `${p.autocallBarrierPct}%` : '--',
      getNumeric: (p) => p.autocallBarrierPct,
      highlight: 'lowest',
    },
    {
      label: 'SRI',
      getValue: (p) => `${p.sri}/7`,
      getNumeric: (p) => p.sri,
      highlight: 'lowest',
    },
    {
      label: 'Maturite',
      getValue: (p) => formatDate(p.maturityDate),
      highlight: 'none',
    },
    {
      label: "Frais d'entree",
      getValue: (p) => `${p.entryFeePct.toFixed(2)}%`,
      getNumeric: (p) => p.entryFeePct,
      highlight: 'lowest',
    },
    {
      label: 'Status',
      getValue: (p) => STATUS_LABELS[p.status] ?? p.status,
      highlight: 'none',
    },
  ], []);

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
          <Shield size={36} className="text-[#3B1FA8]" />
        </div>
        <div className="text-center">
          <h2 className="text-xl font-display font-bold text-ink mb-2">
            Comparaison de produits
          </h2>
          <p className="text-sm text-ink-3 max-w-md font-body">
            Selectionnez au moins 2 produits depuis le catalogue pour les comparer
            cote a cote. Vous pouvez comparer jusqu&apos;a 3 produits.
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
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
        <div className="flex items-center gap-4 flex-1">
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
          <span className="text-sm text-ink-3 font-body">
            {productIds.length} produit{productIds.length > 1 ? 's' : ''}
          </span>
        </div>

        {/* Highlight differences toggle */}
        {allLoaded && (
          <button
            onClick={() => setHighlightDiffs(!highlightDiffs)}
            className={cn(
              'inline-flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-semibold font-body border transition-all duration-200',
              highlightDiffs
                ? 'bg-[#3B1FA8]/10 border-[#3B1FA8]/30 text-[#3B1FA8]'
                : 'bg-white dark:bg-white/5 border-border text-ink-3 hover:border-[#3B1FA8]/30 hover:text-[#3B1FA8]',
            )}
          >
            {highlightDiffs ? <ToggleRight size={16} /> : <ToggleLeft size={16} />}
            Mettre en evidence les differences
          </button>
        )}
      </div>

      {/* Loading state */}
      {!allLoaded && (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-2 border-[#3B1FA8]/30 border-t-[#3B1FA8] rounded-full animate-spin" />
        </div>
      )}

      {/* Quick Metrics Summary */}
      {allLoaded && <QuickMetricsSummary products={loaded} />}

      {/* Mobile Card Layout */}
      {allLoaded && (
        <MobileCardView
          products={loaded}
          rows={rows}
          removeProduct={handleRemoveProduct}
        />
      )}

      {/* Desktop Comparison table */}
      {allLoaded && (
        <div className="hidden md:block overflow-x-auto rounded-2xl border border-border/60 bg-white dark:bg-white/5 shadow-sm hover:shadow-md transition-shadow duration-200">
          <table className="w-full min-w-[600px]">
            {/* Column headers — product cards */}
            <thead>
              <tr>
                <th className="w-[160px] p-4 text-left align-bottom">
                  <span className="text-xs font-semibold uppercase tracking-wider text-ink-3">
                    Critere
                  </span>
                </th>
                {loaded.map((product) => (
                  <th
                    key={product.id}
                    className={cn(
                      'p-0 align-bottom min-w-[200px] transition-all duration-300',
                      removingId === product.id && 'opacity-0 scale-95',
                    )}
                  >
                    <div className="relative m-2 rounded-xl overflow-hidden">
                      <div
                        className="px-4 py-4 text-left"
                        style={{
                          background: PAYOFF_GRADIENTS[product.payoffType] ?? PAYOFF_GRADIENTS.AUTOCALL_PHOENIX,
                        }}
                      >
                        <button
                          onClick={() => handleRemoveProduct(product.id)}
                          className="absolute top-2 right-2 p-1.5 rounded-full bg-white/20 hover:bg-white/40 text-white transition-colors"
                          title="Retirer de la comparaison"
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
                const worstIdx = row.getNumeric
                  ? getWorstIndex(numericValues, row.highlight)
                  : null;

                // Check if values differ for this row (highlight diffs mode)
                const displayValues = loaded.map((p) => row.getValue(p));
                const isDifferent = !valuesAllSame(displayValues);

                return (
                  <tr
                    key={row.label}
                    className={cn(
                      'border-t border-border/40 hover:bg-[#3B1FA8]/[0.02] transition-colors',
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
                      const isWorst = worstIdx === colIdx && worstIdx !== bestIdx;

                      // Highlight diffs background
                      let cellBg = '';
                      if (highlightDiffs && isDifferent) {
                        if (isBest) {
                          cellBg = 'bg-[#00B894]/[0.06]';
                        } else if (isWorst) {
                          cellBg = 'bg-[#E8334A]/[0.05]';
                        } else {
                          cellBg = 'bg-[#D4A017]/[0.04]';
                        }
                      }

                      return (
                        <td
                          key={product.id}
                          className={cn(
                            'px-4 py-3 transition-colors duration-200',
                            cellBg,
                          )}
                        >
                          <div className="mx-2">
                            <span
                              className={cn(
                                'text-sm font-body',
                                isBest
                                  ? 'font-bold text-[#3B1FA8]'
                                  : isWorst && highlightDiffs
                                    ? 'text-ink-3'
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
                                  <Trophy size={9} className="text-[#3B1FA8]" />
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
