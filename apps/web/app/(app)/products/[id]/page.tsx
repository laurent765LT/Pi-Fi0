'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useProduct, useProductPayoff } from '@/hooks/use-products';
import { BarrierGauge } from '@/components/products/barrier-gauge';
import { PayoffCanvas, buildDefaultScenarios } from '@/components/products/payoff-canvas';
import { CommitmentModal } from '@/components/commitments/commitment-modal';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatAmount(amount: number): string {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatDate(isoDate: string): string {
  return new Date(isoDate).toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });
}

function formatPct(value: number): string {
  return value.toFixed(1) + ' %';
}

// ─── Payoff type labels ───────────────────────────────────────────────────────

const PAYOFF_LABELS: Record<string, string> = {
  AUTOCALL_PHOENIX: 'Autocall Phoenix',
  AUTOCALL_COUPON: 'Autocall Coupon',
  CAPITAL_PROTECTED: 'Capital Protégé',
  CONDITIONAL_RATE: 'Taux Conditionnel',
  BARRIER_NOTE: 'Barrier Note',
};

// ─── Detail Row ───────────────────────────────────────────────────────────────

interface DetailRowProps {
  label: string;
  value: React.ReactNode;
}

function DetailRow({ label, value }: DetailRowProps) {
  return (
    <div className="flex items-start justify-between gap-4 py-2.5 border-b border-border last:border-0">
      <span className="text-xs text-ink-3 font-body uppercase tracking-widest shrink-0">
        {label}
      </span>
      <span className="text-sm font-semibold text-ink font-body text-right">
        {value}
      </span>
    </div>
  );
}

// ─── Progress Bar ─────────────────────────────────────────────────────────────

function ShelfProgressBar({ pct }: { pct: number }) {
  const clamped = Math.min(100, Math.max(0, pct));
  return (
    <div className="h-2 w-full overflow-hidden rounded-full bg-surface-2">
      <div
        className="h-full rounded-full bg-violet transition-all duration-500"
        style={{ width: `${clamped}%` }}
      />
    </div>
  );
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function PageSkeleton() {
  return (
    <main className="mx-auto max-w-container px-6 py-8">
      <div className="h-4 w-32 bg-surface-2 rounded animate-pulse mb-6" />
      <div className="h-8 w-64 bg-surface-2 rounded animate-pulse mb-2" />
      <div className="h-1 w-full bg-surface-2 rounded animate-pulse mb-6" />
      <div className="flex gap-2 mb-8">
        <div className="h-5 w-28 bg-surface-2 rounded animate-pulse" />
        <div className="h-5 w-16 bg-surface-2 rounded animate-pulse" />
        <div className="h-5 w-32 bg-surface-2 rounded animate-pulse" />
      </div>
      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 h-80 bg-surface-2 rounded-lg animate-pulse" />
        <div className="h-80 bg-surface-2 rounded-lg animate-pulse" />
      </div>
    </main>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ProductDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { data: product, isLoading, isError } = useProduct(id);
  const { data: payoffData } = useProductPayoff(id);

  const [modalOpen, setModalOpen] = useState(false);

  if (isLoading) return <PageSkeleton />;

  if (isError || !product) {
    return (
      <main className="mx-auto max-w-container px-6 py-8">
        <Link
          href="/products"
          className="inline-flex items-center gap-1.5 text-sm text-ink-3 font-body hover:text-violet transition-colors duration-150 mb-6"
        >
          ← Retour à l&apos;étagère
        </Link>
        <div className="flex flex-col items-center justify-center py-24 gap-3 text-red">
          <p className="font-body text-sm">
            {isError
              ? 'Une erreur est survenue lors du chargement du produit.'
              : 'Produit introuvable.'}
          </p>
          <Button variant="outline" asChild size="md">
            <Link href="/products">Retour à l&apos;étagère</Link>
          </Button>
        </div>
      </main>
    );
  }

  // Build payoff scenarios from API data if available
  const scenarios =
    payoffData?.scenarios ??
    (payoffData
      ? buildDefaultScenarios(
          payoffData.best ?? [],
          payoffData.base ?? [],
          payoffData.worst ?? [],
        )
      : []);

  const isProductClosed =
    product.status === 'CLOSED' || product.status === 'MATURED';

  return (
    <>
      <main className="mx-auto max-w-container px-6 py-8">
        {/* ── Back button ──────────────────────────────────────────────── */}
        <Link
          href="/products"
          className="inline-flex items-center gap-1.5 text-sm text-ink-3 font-body hover:text-violet transition-colors duration-150 mb-6"
        >
          ← Retour à l&apos;étagère
        </Link>

        {/* ── Product header ───────────────────────────────────────────── */}
        <div className="mb-2">
          <h1 className="font-display text-3xl font-bold text-ink leading-tight mb-2">
            {product.name}
          </h1>
          <div className="gradient-bar h-1 rounded-full mb-4" />
        </div>

        {/* Badges row */}
        <div className="flex flex-wrap items-center gap-2 mb-8">
          <Badge variant="violet">
            {PAYOFF_LABELS[product.payoffType] ?? product.payoffType}
          </Badge>
          <Badge variant={product.sri >= 5 ? 'red' : product.sri >= 3 ? 'gold' : 'teal'}>
            SRI {product.sri}/7
          </Badge>
          {product.isin && (
            <span className="font-mono text-xs text-ink-3 border border-border rounded-sm px-2 py-0.5 bg-surface-2">
              {product.isin}
            </span>
          )}
          {product.status && (
            <Badge
              variant={
                product.status === 'OPEN'
                  ? 'teal'
                  : product.status === 'UPCOMING'
                  ? 'cobalt'
                  : 'muted'
              }
            >
              {product.status === 'OPEN'
                ? 'Ouvert'
                : product.status === 'UPCOMING'
                ? 'À venir'
                : product.status === 'CLOSED'
                ? 'Fermé'
                : 'Échu'}
            </Badge>
          )}
        </div>

        {/* ── Two-column layout ────────────────────────────────────────── */}
        <div className="grid lg:grid-cols-3 gap-6 mb-8">
          {/* Left: Product info card (2/3) */}
          <Card static className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Caractéristiques du produit</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="divide-y divide-border">
                {product.issuerName && (
                  <DetailRow label="Émetteur" value={product.issuerName} />
                )}
                {product.guarantorName && (
                  <DetailRow label="Garant" value={product.guarantorName} />
                )}
                {product.underlyingYahoo && (
                  <DetailRow
                    label="Sous-jacent"
                    value={
                      <span className="font-mono">
                        {product.underlyingYahoo}
                      </span>
                    }
                  />
                )}
                {product.barrierCapPct != null && (
                  <DetailRow
                    label="Barrière capital"
                    value={
                      <span className="text-red">
                        {formatPct(product.barrierCapPct)}
                      </span>
                    }
                  />
                )}
                {product.autocallBarrierPct != null && (
                  <DetailRow
                    label="Barrière autocall"
                    value={formatPct(product.autocallBarrierPct)}
                  />
                )}
                {product.couponPct != null && (
                  <DetailRow
                    label="Coupon"
                    value={
                      <span className="text-teal">
                        {formatPct(product.couponPct)}
                      </span>
                    }
                  />
                )}
                {product.maxGainPct != null && (
                  <DetailRow
                    label="Gain maximum"
                    value={
                      <span className="text-gold font-bold">
                        {formatPct(product.maxGainPct)}
                      </span>
                    }
                  />
                )}
                {product.maturityDate && (
                  <DetailRow
                    label="Échéance"
                    value={formatDate(product.maturityDate)}
                  />
                )}
                {product.entryFeePct != null && (
                  <DetailRow
                    label="Frais d'entrée"
                    value={formatPct(product.entryFeePct)}
                  />
                )}
              </div>

              {/* Observation dates */}
              {Array.isArray(product.observationDates) &&
                product.observationDates.length > 0 && (
                  <div className="mt-4">
                    <p className="text-xs text-ink-3 font-body uppercase tracking-widest mb-2">
                      Dates d&apos;observation
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {product.observationDates.map((date: string) => (
                        <span
                          key={date}
                          className="font-mono text-[11px] text-ink-2 border border-border rounded-sm px-2 py-0.5 bg-surface-2"
                        >
                          {formatDate(date)}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
            </CardContent>
          </Card>

          {/* Right: Shelf card (1/3) */}
          <Card static className="flex flex-col">
            <CardHeader>
              <CardTitle>Étagère</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-4 flex-1">
              {/* Fill progress */}
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between text-xs font-body">
                  <span className="text-ink-3">Remplissage</span>
                  <span className="font-bold text-ink">
                    {(product.fillPct ?? 0).toFixed(0)}%
                  </span>
                </div>
                <ShelfProgressBar pct={product.fillPct ?? 0} />
              </div>

              {/* Target amount */}
              {product.targetAmount != null && (
                <DetailRow
                  label="Objectif"
                  value={formatAmount(product.targetAmount)}
                />
              )}

              {/* Closing date */}
              {product.shelfClosingDate && (
                <DetailRow
                  label="Date de closing"
                  value={formatDate(product.shelfClosingDate)}
                />
              )}

              {/* CTA */}
              <div className="mt-auto pt-4">
                <Button
                  variant="primary"
                  size="lg"
                  className="w-full"
                  disabled={isProductClosed}
                  onClick={() => setModalOpen(true)}
                >
                  {isProductClosed
                    ? 'Produit fermé'
                    : "Exprimer une marque d\u2019intérêt"}
                </Button>
                {!isProductClosed && (
                  <p className="mt-2 text-center text-[11px] text-ink-3 font-body">
                    Sans engagement ferme de souscription
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* ── Barrier Gauge ─────────────────────────────────────────────── */}
        {product.barrierCapPct != null && (
          <Card static className="mb-6">
            <CardHeader>
              <CardTitle>Jauge barrière</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex justify-center py-4">
                <BarrierGauge
                  barrierPct={product.barrierCapPct}
                  currentPct={product.currentPct ?? 100}
                  size={240}
                />
              </div>
            </CardContent>
          </Card>
        )}

        {/* ── Payoff Canvas ─────────────────────────────────────────────── */}
        <Card static>
          <CardHeader>
            <CardTitle>Simulation de scénarios</CardTitle>
          </CardHeader>
          <CardContent>
            <PayoffCanvas scenarios={scenarios} height={320} />
          </CardContent>
        </Card>
      </main>

      {/* ── Commitment Modal ──────────────────────────────────────────────── */}
      {product.shelfId && (
        <CommitmentModal
          isOpen={modalOpen}
          onClose={() => setModalOpen(false)}
          shelfId={product.shelfId}
          productName={product.name}
        />
      )}
      {!product.shelfId && modalOpen && (
        <CommitmentModal
          isOpen={modalOpen}
          onClose={() => setModalOpen(false)}
          shelfId={product.id}
          productName={product.name}
        />
      )}
    </>
  );
}
