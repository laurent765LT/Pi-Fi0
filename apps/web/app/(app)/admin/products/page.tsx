'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { useProducts } from '@/hooks/use-products';
import { Badge, type BadgeVariant } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

// ─── Type maps ────────────────────────────────────────────────────────────────

const PAYOFF_LABELS: Record<string, string> = {
  AUTOCALL_PHOENIX: 'Autocall Phoenix',
  AUTOCALL_COUPON: 'Autocall Coupon',
  CAPITAL_PROTECTED: 'Capital Protégé',
  CONDITIONAL_RATE: 'Taux Conditionnel',
  BARRIER_NOTE: 'Barrier Note',
};

const STATUS_VARIANT: Record<string, BadgeVariant> = {
  OPEN: 'teal',
  UPCOMING: 'violet',
  CLOSED: 'muted',
  MATURED: 'red',
};

const STATUS_LABEL: Record<string, string> = {
  OPEN: 'Ouvert',
  UPCOMING: 'À venir',
  CLOSED: 'Fermé',
  MATURED: 'Arrivé à maturité',
};

const PAYOFF_VARIANT: Record<string, BadgeVariant> = {
  AUTOCALL_PHOENIX: 'violet',
  AUTOCALL_COUPON: 'cobalt',
  CAPITAL_PROTECTED: 'teal',
  CONDITIONAL_RATE: 'cobalt',
  BARRIER_NOTE: 'gold',
};

const SRI_COLORS: Record<number, string> = {
  1: '#00B894', 2: '#00B894', 3: '#6FCF97',
  4: '#F2C94C', 5: '#F2994A', 6: '#EB5757', 7: '#E8334A',
};

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function TableSkeleton() {
  return (
    <div className="animate-pulse">
      {Array.from({ length: 5 }).map((_, i) => (
        <div
          key={i}
          className="flex items-center gap-4 px-5 py-3.5 border-b border-border last:border-0"
        >
          <div className="h-3 w-28 bg-surface-2 rounded font-mono" />
          <div className="h-3 flex-1 bg-surface-2 rounded" />
          <div className="h-5 w-20 bg-surface-2 rounded" />
          <div className="h-5 w-8 bg-surface-2 rounded" />
          <div className="h-5 w-16 bg-surface-2 rounded" />
          <div className="h-7 w-20 bg-surface-2 rounded" />
        </div>
      ))}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function AdminProductsPage() {
  const { data, isLoading } = useProducts();
  const products = data?.data ?? [];

  const [search, setSearch] = useState('');

  const filtered = products.filter((p: any) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      p.name?.toLowerCase().includes(q) ||
      p.isin?.toLowerCase().includes(q) ||
      p.issuerName?.toLowerCase().includes(q)
    );
  });

  return (
    <main className="w-full">
      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="flex items-start justify-between gap-4 mb-3">
        <div>
          <h1 className="font-display text-3xl font-bold text-ink dark:text-white">
            Produits
          </h1>
        </div>
        <Button variant="primary" size="md" asChild>
          <Link href="/admin/products/new" className="flex items-center gap-2">
            <Plus size={16} strokeWidth={2.5} />
            Nouveau produit
          </Link>
        </Button>
      </div>
      <div className="gradient-bar h-1 rounded-full mb-8" />

      {/* ── Search ─────────────────────────────────────────────────────────── */}
      <div className="mb-5">
        <input
          type="text"
          placeholder="Rechercher par nom, ISIN, émetteur…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full max-w-sm rounded-md bg-surface-2 border border-border-2 font-body text-sm text-ink px-3 h-9 placeholder:text-ink-3 focus:outline-none focus:ring-2 focus:ring-violet focus:border-violet transition-all duration-150"
        />
      </div>

      {/* ── Table ──────────────────────────────────────────────────────────── */}
      {isLoading ? (
        <div className="bg-white/90 dark:bg-white/5 backdrop-blur-md border border-border/60 rounded-lg overflow-hidden shadow-sm">
          <TableSkeleton />
        </div>
      ) : filtered.length === 0 ? (
        <Card static className="py-16 flex flex-col items-center justify-center gap-3">
          <p className="font-body text-sm text-ink-3">
            {search ? 'Aucun produit ne correspond à cette recherche.' : 'Aucun produit disponible.'}
          </p>
          {search && (
            <button
              onClick={() => setSearch('')}
              className="font-body text-xs text-violet hover:underline"
            >
              Effacer la recherche
            </button>
          )}
        </Card>
      ) : (
        <div className="bg-white/90 dark:bg-white/5 backdrop-blur-md border border-border/60 rounded-lg overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-sm font-body min-w-[700px]">
              <thead>
                <tr className="border-b border-border bg-surface-2">
                  <th className="px-5 py-3 text-left text-xs uppercase tracking-widest text-ink-3 font-semibold">
                    ISIN
                  </th>
                  <th className="px-5 py-3 text-left text-xs uppercase tracking-widest text-ink-3 font-semibold">
                    Nom
                  </th>
                  <th className="px-5 py-3 text-center text-xs uppercase tracking-widest text-ink-3 font-semibold">
                    Type
                  </th>
                  <th className="px-5 py-3 text-center text-xs uppercase tracking-widest text-ink-3 font-semibold">
                    SRI
                  </th>
                  <th className="px-5 py-3 text-center text-xs uppercase tracking-widest text-ink-3 font-semibold">
                    Statut
                  </th>
                  <th className="px-5 py-3 text-center text-xs uppercase tracking-widest text-ink-3 font-semibold">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((product: any) => (
                  <tr
                    key={product.id}
                    className="border-b border-border last:border-0 hover:bg-violet/[0.04] dark:hover:bg-white/5 transition-colors duration-150"
                  >
                    {/* ISIN */}
                    <td className="px-5 py-3.5">
                      <span className="font-mono text-xs font-medium text-ink bg-surface-2 px-2 py-0.5 rounded-xs border border-border">
                        {product.isin ?? '—'}
                      </span>
                    </td>

                    {/* Name */}
                    <td className="px-5 py-3.5">
                      <div className="flex flex-col gap-0.5">
                        <span className="font-medium text-ink leading-snug truncate max-w-[240px]">
                          {product.name ?? '—'}
                        </span>
                        {product.issuerName && (
                          <span className="text-xs text-ink-3">{product.issuerName}</span>
                        )}
                      </div>
                    </td>

                    {/* Type */}
                    <td className="px-5 py-3.5 text-center">
                      <Badge
                        variant={PAYOFF_VARIANT[product.payoffType] ?? 'muted'}
                      >
                        {PAYOFF_LABELS[product.payoffType] ?? product.payoffType ?? '—'}
                      </Badge>
                    </td>

                    {/* SRI */}
                    <td className="px-5 py-3.5 text-center">
                      {product.sri != null ? (
                        <span
                          className="inline-flex items-center justify-center w-7 h-7 rounded-full text-white text-xs font-bold"
                          style={{
                            backgroundColor: SRI_COLORS[product.sri] ?? '#7B6FA0',
                          }}
                          title={`SRI ${product.sri}/7`}
                        >
                          {product.sri}
                        </span>
                      ) : (
                        <span className="text-ink-3 text-xs">—</span>
                      )}
                    </td>

                    {/* Status */}
                    <td className="px-5 py-3.5 text-center">
                      <Badge variant={STATUS_VARIANT[product.status] ?? 'muted'}>
                        {STATUS_LABEL[product.status] ?? product.status ?? '—'}
                      </Badge>
                    </td>

                    {/* Actions */}
                    <td className="px-5 py-3.5">
                      <div className="flex items-center justify-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          asChild
                        >
                          <Link href={`/admin/products/${product.id}/edit`} className="flex items-center gap-1">
                            <Pencil size={12} strokeWidth={2.5} />
                            Modifier
                          </Link>
                        </Button>
                        <Button
                          variant="danger"
                          size="sm"
                          onClick={() => {
                            if (window.confirm(`Supprimer "${product.name}" ?`)) {
                              // Delete action — API call to be wired
                            }
                          }}
                        >
                          <Trash2 size={12} strokeWidth={2.5} />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Footer count */}
          <div className="px-5 py-3 border-t border-border bg-surface-2">
            <span className="font-body text-xs text-ink-3">
              {filtered.length} produit{filtered.length !== 1 ? 's' : ''}
              {search ? ` correspondant à « ${search} »` : ' au total'}
            </span>
          </div>
        </div>
      )}
    </main>
  );
}
