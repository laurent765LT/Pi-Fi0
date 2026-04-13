'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { X, ArrowRight, Trash2 } from 'lucide-react';
import { useCompareStore } from '@/stores/compare-store';
import { DEMO_PRODUCTS } from '@/lib/demo-data';
import { cn } from '@/lib/cn';

function getProductName(id: string): string {
  const found = DEMO_PRODUCTS.find((p) => p.id === id);
  return found?.name ?? id;
}

export function CompareBar() {
  const productIds = useCompareStore((s) => s.productIds);
  const removeProduct = useCompareStore((s) => s.removeProduct);
  const clearAll = useCompareStore((s) => s.clearAll);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted || productIds.length === 0) return null;

  return (
    <div
      className={cn(
        'fixed bottom-0 left-0 right-0 z-50 md:left-[248px]',
        'animate-in slide-in-from-bottom duration-300',
      )}
    >
      <div
        className="mx-4 mb-4 rounded-2xl border border-white/20 px-5 py-3.5 shadow-2xl"
        style={{
          background: 'linear-gradient(135deg, rgba(59, 31, 168, 0.92), rgba(85, 53, 196, 0.88))',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
        }}
      >
        <div className="flex items-center gap-4 flex-wrap">
          {/* Count */}
          <div className="flex items-center gap-2 shrink-0">
            <span
              className="inline-flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold text-violet"
              style={{ background: 'rgba(255,255,255,0.95)' }}
            >
              {productIds.length}
            </span>
            <span className="text-sm font-semibold text-white/90">
              produit{productIds.length > 1 ? 's' : ''} selectionne{productIds.length > 1 ? 's' : ''}
            </span>
          </div>

          {/* Product chips */}
          <div className="flex items-center gap-2 flex-1 min-w-0 overflow-x-auto scrollbar-hide">
            {productIds.map((id) => (
              <span
                key={id}
                className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium text-white shrink-0"
                style={{ background: 'rgba(255,255,255,0.15)' }}
              >
                <span className="truncate max-w-[120px]">{getProductName(id)}</span>
                <button
                  onClick={() => removeProduct(id)}
                  className="p-0.5 rounded-full hover:bg-white/20 transition-colors"
                >
                  <X size={12} />
                </button>
              </span>
            ))}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={clearAll}
              className="inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-medium text-white/70 hover:text-white hover:bg-white/10 transition-all"
            >
              <Trash2 size={13} />
              Effacer
            </button>

            {productIds.length >= 2 ? (
              <Link
                href="/products/compare"
                className="inline-flex items-center gap-1.5 rounded-lg px-4 py-2 text-xs font-bold text-violet transition-all hover:shadow-lg"
                style={{
                  background: 'linear-gradient(135deg, #FFFFFF, #F0EDFF)',
                }}
              >
                Comparer
                <ArrowRight size={13} />
              </Link>
            ) : (
              <span
                className="inline-flex items-center gap-1.5 rounded-lg px-4 py-2 text-xs font-bold text-white/40 cursor-not-allowed"
                style={{ background: 'rgba(255,255,255,0.1)' }}
              >
                Comparer
                <ArrowRight size={13} />
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
