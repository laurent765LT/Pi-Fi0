'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { Badge, type BadgeVariant } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { ProgressBar } from '@/components/ui/progress-bar';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatAmount(amount: number): string {
  if (amount >= 1_000_000) {
    return `${(amount / 1_000_000).toFixed(1)} M€`;
  }
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatDate(isoDate: string): string {
  if (!isoDate) return '—';
  return new Date(isoDate).toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

// ─── Status config ────────────────────────────────────────────────────────────

const SHELF_STATUS_VARIANT: Record<string, BadgeVariant> = {
  OPEN: 'teal',
  CLOSING_SOON: 'gold',
  CLOSED: 'red',
  PENDING: 'violet',
};

const SHELF_STATUS_LABEL: Record<string, string> = {
  OPEN: 'Ouvert',
  CLOSING_SOON: 'Fermeture proche',
  CLOSED: 'Fermé',
  PENDING: 'En attente',
};

// ─── Fill indicator ───────────────────────────────────────────────────────────

function FillCell({ fillPct, targetAmount }: { fillPct: number; targetAmount: number }) {
  return (
    <div className="flex flex-col gap-1 min-w-[120px]">
      <div className="flex items-center justify-between gap-2">
        <span className="font-body text-xs font-semibold text-ink-2">
          {Math.round(fillPct)}%
        </span>
        <span className="font-body text-[10px] text-ink-3">
          / {formatAmount(targetAmount)}
        </span>
      </div>
      <ProgressBar value={fillPct} heightClass="h-1.5" />
    </div>
  );
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function TableSkeleton() {
  return (
    <div className="animate-pulse">
      {Array.from({ length: 5 }).map((_, i) => (
        <div
          key={i}
          className="flex items-center gap-4 px-5 py-4 border-b border-border last:border-0"
        >
          <div className="h-3 flex-1 bg-surface-2 rounded" />
          <div className="h-3 w-20 bg-surface-2 rounded" />
          <div className="h-3 w-12 bg-surface-2 rounded" />
          <div className="flex flex-col gap-1 w-32">
            <div className="h-2.5 w-full bg-surface-2 rounded" />
            <div className="h-1.5 w-full bg-surface-2 rounded-full" />
          </div>
          <div className="h-5 w-16 bg-surface-2 rounded" />
          <div className="h-3 w-20 bg-surface-2 rounded" />
          <div className="h-3 w-8 bg-surface-2 rounded" />
        </div>
      ))}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function AdminShelvesPage() {
  const [shelves, setShelves] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api
      .getShelves()
      .then((data) => setShelves(Array.isArray(data) ? data : []))
      .catch((err) =>
        setError(err instanceof Error ? err.message : 'Erreur lors du chargement'),
      )
      .finally(() => setLoading(false));
  }, []);

  return (
    <main className="max-w-container mx-auto px-6 py-8">
      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <h1 className="font-display text-3xl font-bold text-ink mb-3">
        Enveloppes
      </h1>
      <div className="gradient-bar h-1 rounded-full mb-8" />

      {/* ── Table ──────────────────────────────────────────────────────────── */}
      {error ? (
        <Card static className="py-8 flex items-center justify-center">
          <p className="font-body text-sm text-red">{error}</p>
        </Card>
      ) : (
        <div className="bg-white border border-border rounded-lg overflow-hidden shadow-xs">
          {loading ? (
            <TableSkeleton />
          ) : shelves.length === 0 ? (
            <div className="py-16 flex flex-col items-center justify-center gap-3">
              <p className="font-body text-sm text-ink-3">
                Aucune enveloppe disponible.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm font-body min-w-[800px]">
                <thead>
                  <tr className="border-b border-border bg-surface-2">
                    <th className="px-5 py-3 text-left text-xs uppercase tracking-widest text-ink-3 font-semibold">
                      Produit
                    </th>
                    <th className="px-5 py-3 text-right text-xs uppercase tracking-widest text-ink-3 font-semibold">
                      Montant cible
                    </th>
                    <th className="px-5 py-3 text-right text-xs uppercase tracking-widest text-ink-3 font-semibold">
                      Surbooking
                    </th>
                    <th className="px-5 py-3 text-left text-xs uppercase tracking-widest text-ink-3 font-semibold min-w-[160px]">
                      Remplissage
                    </th>
                    <th className="px-5 py-3 text-center text-xs uppercase tracking-widest text-ink-3 font-semibold">
                      Statut
                    </th>
                    <th className="px-5 py-3 text-center text-xs uppercase tracking-widest text-ink-3 font-semibold">
                      Clôture
                    </th>
                    <th className="px-5 py-3 text-right text-xs uppercase tracking-widest text-ink-3 font-semibold">
                      Marques
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {shelves.map((shelf: any) => (
                    <tr
                      key={shelf.id}
                      className="border-b border-border last:border-0 hover:bg-surface transition-colors duration-150"
                    >
                      {/* Product */}
                      <td className="px-5 py-4">
                        <div className="flex flex-col gap-0.5">
                          <span className="font-medium text-ink leading-snug truncate max-w-[220px]">
                            {shelf.productName ?? shelf.productId ?? '—'}
                          </span>
                          {shelf.isin && (
                            <span className="font-mono text-[11px] text-ink-3">
                              {shelf.isin}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Target amount */}
                      <td className="px-5 py-4 text-right font-mono font-semibold text-ink">
                        {formatAmount(shelf.targetAmount ?? 0)}
                      </td>

                      {/* Overbooking % */}
                      <td className="px-5 py-4 text-right">
                        {shelf.overbookingPct != null ? (
                          <span className="font-mono text-sm text-ink-2">
                            +{shelf.overbookingPct}%
                          </span>
                        ) : (
                          <span className="text-ink-3 text-xs">—</span>
                        )}
                      </td>

                      {/* Fill progress */}
                      <td className="px-5 py-4">
                        <FillCell
                          fillPct={shelf.fillPct ?? 0}
                          targetAmount={shelf.targetAmount ?? 0}
                        />
                      </td>

                      {/* Status */}
                      <td className="px-5 py-4 text-center">
                        <Badge
                          variant={SHELF_STATUS_VARIANT[shelf.status] ?? 'muted'}
                        >
                          {SHELF_STATUS_LABEL[shelf.status] ?? shelf.status ?? '—'}
                        </Badge>
                      </td>

                      {/* Closing date */}
                      <td className="px-5 py-4 text-center text-xs text-ink-3">
                        {formatDate(shelf.closingDate)}
                      </td>

                      {/* Commitment count */}
                      <td className="px-5 py-4 text-right">
                        <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-violet-pale text-violet text-xs font-bold">
                          {shelf.commitmentCount ?? 0}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Footer */}
          {!loading && shelves.length > 0 && (
            <div className="px-5 py-3 border-t border-border bg-surface-2">
              <span className="font-body text-xs text-ink-3">
                {shelves.length} enveloppe{shelves.length !== 1 ? 's' : ''}
              </span>
            </div>
          )}
        </div>
      )}
    </main>
  );
}
