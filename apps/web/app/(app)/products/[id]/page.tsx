'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import {
  ArrowLeft, Heart, Share2, FileText, AlertTriangle, Calendar,
  Shield, TrendingUp, Info, ExternalLink, Clock, Users, Download,
  Sparkles,
} from 'lucide-react';
import { cn } from '@/lib/cn';
import { useProduct, useProductPayoff } from '@/hooks/use-products';
import { useFavorites, useToggleFavorite, useTrackView } from '@/hooks/use-favorites';
import { PayoffCanvas, buildDefaultScenarios } from '@/components/products/payoff-canvas';
import { BarrierGauge } from '@/components/products/barrier-gauge';
import { CommitmentModal } from '@/components/commitments/commitment-modal';
import { useMyCommitments } from '@/hooks/use-commitments';
import { Button } from '@/components/ui/button';
import { ProductPdfExport } from '@/components/products/product-pdf-export';
import { Tabs, TabPanel } from '@/components/ui/tabs';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatAmount(amount: number): string {
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(amount);
}

function formatDate(isoDate: string): string {
  return new Date(isoDate).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' });
}

function formatDateShort(isoDate: string): string {
  return new Date(isoDate).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' });
}

function formatPct(value: number | null | undefined): string {
  if (value == null) return '—';
  return value.toFixed(1) + ' %';
}

function daysUntil(isoDate: string): number {
  return Math.max(0, Math.ceil((new Date(isoDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)));
}

// ─── Constants ────────────────────────────────────────────────────────────────

const PAYOFF_LABELS: Record<string, string> = {
  AUTOCALL_PHOENIX: 'Autocall Phoenix',
  AUTOCALL_COUPON: 'Autocall Coupon',
  CAPITAL_PROTECTED: 'Capital Protégé',
  CONDITIONAL_RATE: 'Taux Conditionnel',
  BARRIER_NOTE: 'Barrier Note',
};

const PAYOFF_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  AUTOCALL_PHOENIX: { bg: '#EDE8FF', text: '#3B1FA8', border: '#D5CCFA' },
  AUTOCALL_COUPON: { bg: '#EDE8FF', text: '#5535C4', border: '#D5CCFA' },
  CAPITAL_PROTECTED: { bg: '#E6FAF5', text: '#008B6E', border: '#B3F0DE' },
  CONDITIONAL_RATE: { bg: '#E4EAFF', text: '#0A2799', border: '#C5D2FA' },
  BARRIER_NOTE: { bg: '#FFF8E7', text: '#A07800', border: '#F0E0A8' },
};

const SRI_COLORS: Record<number, { bg: string; text: string }> = {
  1: { bg: '#E6FAF5', text: '#008B6E' },
  2: { bg: '#E6FAF5', text: '#008B6E' },
  3: { bg: '#F0FAE6', text: '#4A8C1F' },
  4: { bg: '#FFF8E7', text: '#A07800' },
  5: { bg: '#FFF0E6', text: '#C25700' },
  6: { bg: '#FFF0F2', text: '#C41F36' },
  7: { bg: '#FFF0F2', text: '#C41F36' },
};

const REGULATORY_DISCLAIMERS = [
  { icon: AlertTriangle, text: "Ce produit est un instrument financier complexe au sens de la directive MIF2. Il est destiné aux investisseurs avertis." },
  { icon: Shield, text: "Le capital n'est pas garanti. L'investisseur peut subir une perte en capital partielle ou totale à l'échéance." },
  { icon: FileText, text: "Avant toute souscription, le client doit prendre connaissance du Document d'Informations Clés (KID/PRIIPS)." },
  { icon: Info, text: "Les performances passées ne préjugent pas des performances futures. Les scénarios présentés sont des estimations." },
  { icon: AlertTriangle, text: "L'investisseur est exposé au risque de crédit de l'émetteur et du garant éventuel." },
  { icon: Clock, text: "La liquidité du produit n'est pas garantie avant l'échéance. Le prix de rachat peut être inférieur au prix d'achat." },
];

// ─── Sub-components ──────────────────────────────────────────────────────────

function DetailRow({ label, value, className }: { label: string; value: React.ReactNode; className?: string }) {
  return (
    <div className={cn("flex items-start justify-between gap-4 py-2.5 border-b border-border/50 last:border-0", className)}>
      <span className="text-[11px] text-ink-3 font-body uppercase tracking-widest shrink-0">{label}</span>
      <span className="text-sm font-semibold text-ink font-body text-right">{value}</span>
    </div>
  );
}

function StatBox({ label, value, color, icon: Icon }: { label: string; value: string; color?: string; icon?: any }) {
  return (
    <div className="relative flex flex-col items-center gap-1.5 py-4 px-3 rounded-xl bg-white dark:bg-white/5 border border-border/60 shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden group">
      <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-violet/60 to-teal/40 opacity-0 group-hover:opacity-100 transition-opacity" />
      {Icon && <Icon size={13} className="text-ink-3/50 mb-0.5" />}
      <span className="text-[9px] uppercase tracking-wider text-ink-3 font-semibold font-body">{label}</span>
      <span className={cn("font-display text-xl font-bold leading-none", color ?? 'text-ink')}>{value}</span>
    </div>
  );
}

function SriGauge({ sri }: { sri: number }) {
  const sriStyle = SRI_COLORS[sri] ?? SRI_COLORS[4];
  return (
    <div className="flex flex-col items-center gap-2">
      <div className="flex gap-0.5">
        {[1, 2, 3, 4, 5, 6, 7].map((n) => (
          <div
            key={n}
            className={cn(
              "h-5 w-5 rounded-sm flex items-center justify-center text-[9px] font-bold font-mono transition-all",
              n === sri ? 'ring-2 ring-offset-1 scale-110' : n <= sri ? 'opacity-80' : 'opacity-30',
            )}
            style={{
              backgroundColor: n <= sri ? SRI_COLORS[n]?.bg ?? '#F4F3EF' : '#F4F3EF',
              color: n <= sri ? SRI_COLORS[n]?.text ?? '#7B6FA0' : '#7B6FA0',
            }}
          >
            {n}
          </div>
        ))}
      </div>
      <p className="text-[10px] text-ink-3 font-body">
        Risque : <span className="font-semibold" style={{ color: sriStyle.text }}>{sri}/7</span>
        {sri <= 2 && ' (faible)'}
        {sri >= 3 && sri <= 4 && ' (modéré)'}
        {sri >= 5 && sri <= 6 && ' (élevé)'}
        {sri === 7 && ' (très élevé)'}
      </p>
    </div>
  );
}

function ScenarioTable({ product }: { product: any }) {
  const scenarios = [
    { name: 'Stress', pct: -(product.barrierCapPct ?? 50), color: '#C41F36' },
    { name: 'Défavorable', pct: -((product.barrierCapPct ?? 50) * 0.5), color: '#C25700' },
    { name: 'Modéré', pct: product.couponPct ?? (product.maxGainPct ?? 0) * 0.4, color: '#A07800' },
    { name: 'Favorable', pct: product.maxGainPct ?? 0, color: '#008B6E' },
  ];
  const investBase = 10_000;

  return (
    <div className="overflow-hidden rounded-xl border border-border/60 shadow-sm">
      <table className="w-full text-sm font-body">
        <thead>
          <tr className="bg-gradient-to-r from-surface-2 to-surface-2/60 dark:from-white/5 dark:to-white/[0.02] border-b border-border/60">
            <th className="px-4 py-3 text-left text-[10px] uppercase tracking-wider text-ink-3 font-semibold">Scénario</th>
            <th className="px-4 py-3 text-right text-[10px] uppercase tracking-wider text-ink-3 font-semibold">Perf. %</th>
            <th className="px-4 py-3 text-right text-[10px] uppercase tracking-wider text-ink-3 font-semibold">Pour 10 000 €</th>
          </tr>
        </thead>
        <tbody>
          {scenarios.map((s) => (
            <tr key={s.name} className="border-b border-border/30 last:border-0 hover:bg-surface-2/50 dark:hover:bg-white/[0.02] transition-colors">
              <td className="px-4 py-3 font-semibold" style={{ color: s.color }}>
                <span className="inline-flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: s.color }} />
                  {s.name}
                </span>
              </td>
              <td className="px-4 py-3 text-right font-mono tabular-nums font-semibold">
                <span className="inline-flex items-center rounded-md px-2 py-0.5 text-xs" style={{ backgroundColor: s.color + '15', color: s.color }}>
                  {s.pct >= 0 ? '+' : ''}{s.pct.toFixed(1)}%
                </span>
              </td>
              <td className="px-4 py-3 text-right font-mono tabular-nums text-ink-2">
                {formatAmount(investBase * (1 + s.pct / 100))}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function PageSkeleton() {
  return (
    <main className="mx-auto max-w-5xl px-6 py-8 animate-pulse">
      <div className="h-4 w-32 bg-surface-2 rounded mb-6" />
      <div className="h-8 w-2/3 bg-surface-2 rounded mb-3" />
      <div className="h-4 w-1/3 bg-surface-2 rounded mb-6" />
      <div className="flex gap-2 mb-8">
        <div className="h-6 w-28 bg-surface-2 rounded-md" />
        <div className="h-6 w-16 bg-surface-2 rounded-md" />
        <div className="h-6 w-20 bg-surface-2 rounded-md" />
      </div>
      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 h-96 bg-surface-2 rounded-xl" />
        <div className="h-96 bg-surface-2 rounded-xl" />
      </div>
    </main>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ProductDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { data: product, isLoading, isError } = useProduct(id);
  const { data: payoffData } = useProductPayoff(id);
  const { data: favoritesData } = useFavorites();
  const toggleFavorite = useToggleFavorite();
  const trackView = useTrackView();

  const { data: myCommitments } = useMyCommitments();
  const alreadyCommitted = (myCommitments ?? []).some((c: any) => c.shelfId === (product?.shelfId ?? product?.id));

  const [modalOpen, setModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    if (id) trackView.mutate(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  if (isLoading) return <PageSkeleton />;

  if (isError || !product) {
    return (
      <main className="mx-auto max-w-5xl px-6 py-8">
        <Link href="/products" className="inline-flex items-center gap-1.5 text-sm text-ink-3 font-body hover:text-violet transition-colors mb-6">
          <ArrowLeft size={14} /> Retour aux produits
        </Link>
        <div className="flex flex-col items-center justify-center py-24 gap-3">
          <p className="font-body text-sm text-red">
            {isError ? 'Erreur lors du chargement du produit.' : 'Produit introuvable.'}
          </p>
          <Button variant="outline" asChild size="md">
            <Link href="/products">Retour aux produits</Link>
          </Button>
        </div>
      </main>
    );
  }

  const payoff = PAYOFF_COLORS[product.payoffType] ?? PAYOFF_COLORS.AUTOCALL_PHOENIX;
  const sriStyle = SRI_COLORS[product.sri] ?? SRI_COLORS[4];
  const isClosed = product.status === 'CLOSED' || product.status === 'MATURED';
  const favoriteIds = new Set(
    (favoritesData as any[])?.map((f: any) => f.productId ?? f.product?.id) ?? []
  );
  const isFav = favoriteIds.has(product.id);

  const scenarios =
    payoffData?.scenarios ??
    (payoffData
      ? buildDefaultScenarios(payoffData.best ?? [], payoffData.base ?? [], payoffData.worst ?? [])
      : []);

  const closingDays = product.shelfClosingDate ? daysUntil(product.shelfClosingDate) : null;

  return (
    <>
      <main className="mx-auto max-w-5xl px-6 py-8 animate-fade-in">
        {/* ── Breadcrumb ──────────────────────────────────────────── */}
        <div className="flex items-center justify-between mb-6">
          <Link href="/products" className="inline-flex items-center gap-1.5 text-sm text-ink-3 font-body hover:text-violet transition-colors">
            <ArrowLeft size={14} /> Retour aux produits
          </Link>
          <div className="flex items-center gap-2">
            <button
              onClick={() => toggleFavorite.mutate(product.id)}
              className={cn(
                'p-2 rounded-lg border transition-all duration-200',
                isFav
                  ? 'text-red border-red/30 bg-red-light hover:bg-red/20'
                  : 'text-ink-3 border-border hover:text-red hover:border-red/30 hover:bg-red-light',
              )}
              title={isFav ? 'Retirer des favoris' : 'Ajouter aux favoris'}
            >
              <Heart size={16} fill={isFav ? 'currentColor' : 'none'} />
            </button>
            <button className="p-2 rounded-lg border border-border text-ink-3 hover:text-violet hover:border-violet/30 hover:bg-violet-pale transition-all duration-200" title="Partager">
              <Share2 size={16} />
            </button>
            <ProductPdfExport product={product} />
          </div>
        </div>

        {/* ── Product Header ──────────────────────────────────────── */}
        <div className="mb-8">
          <div className="h-1 w-24 rounded-full mb-4" style={{ background: payoff.text }} />
          <div className="flex flex-wrap items-start gap-3 mb-3">
            <span
              className="inline-flex items-center rounded-md px-2.5 py-1 text-[11px] font-semibold font-body"
              style={{ backgroundColor: payoff.bg, color: payoff.text, border: `1px solid ${payoff.border}` }}
            >
              {PAYOFF_LABELS[product.payoffType] ?? product.payoffType}
            </span>
            <span
              className="inline-flex items-center rounded-md px-2.5 py-1 text-[11px] font-bold font-mono tabular-nums"
              style={{ backgroundColor: sriStyle.bg, color: sriStyle.text }}
            >
              SRI {product.sri}/7
            </span>
            {!isClosed && (
              <span className="inline-flex items-center rounded-md px-2.5 py-1 text-[11px] font-semibold font-body bg-[#E6FAF5] text-[#008B6E] border border-[#B3F0DE]">
                En cours
              </span>
            )}
            {isClosed && (
              <span className="inline-flex items-center rounded-md px-2.5 py-1 text-[11px] font-semibold font-body bg-[#F4F3EF] text-[#7B6FA0] border border-[#E2DFD8]">
                Fermé
              </span>
            )}
            {product.createdAt && (Date.now() - new Date(product.createdAt).getTime()) < 7 * 24 * 60 * 60 * 1000 && (
              <span className="inline-flex items-center gap-1 rounded-md px-2.5 py-1 text-[11px] font-bold font-body bg-[#E4EAFF] text-[#0A2799] border border-[#C5D2FA]">
                <Sparkles size={10} />
                Nouveau
              </span>
            )}
            {closingDays != null && closingDays > 0 && closingDays <= 30 && (
              <span className="inline-flex items-center gap-1 rounded-md px-2.5 py-1 text-[11px] font-bold font-body bg-[#FFF0F2] text-[#C41F36] border border-[#F8D0D5]">
                <Clock size={10} />
                Clôture J-{closingDays}
              </span>
            )}
          </div>

          <h1 className="font-display text-2xl md:text-3xl font-bold text-ink leading-tight mb-1.5">
            {product.name}
          </h1>
          <div className="flex items-center gap-3 text-sm text-ink-3 font-body">
            <span className="font-mono text-xs bg-surface-2 border border-border rounded px-2 py-0.5 tabular-nums">
              {product.isin}
            </span>
            <span>{product.issuerName}</span>
          </div>

          {/* Compatible insurers */}
          {Array.isArray(product.compatibleInsurers) && product.compatibleInsurers.length > 0 && (
            <div className="flex items-center gap-2 mt-3 flex-wrap">
              <span className="text-[10px] uppercase tracking-widest text-ink-3 font-semibold font-body">Assureurs :</span>
              {product.compatibleInsurers.map((ins: string) => (
                <span key={ins} className="inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium font-body bg-surface-2 text-ink-2 border border-border/60">
                  {ins}
                </span>
              ))}
            </div>
          )}

          {product.description && (
            <p className="mt-4 text-sm text-ink-2 font-body leading-relaxed max-w-3xl">
              {product.description}
            </p>
          )}
        </div>

        {/* ── Key Metrics ─────────────────────────────────────────── */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
          <StatBox label="Gain max" value={formatPct(product.maxGainPct)} color="text-gold" icon={TrendingUp} />
          <StatBox label="Barrière" value={formatPct(product.barrierCapPct)} color="text-red" icon={Shield} />
          <StatBox
            label={product.couponPct != null ? 'Coupon' : 'Autocall'}
            value={product.couponPct != null ? formatPct(product.couponPct) : formatPct(product.autocallBarrierPct)}
            color="text-teal"
            icon={Sparkles}
          />
          <StatBox label="Échéance" value={product.maturityDate ? formatDateShort(product.maturityDate) : '—'} icon={Calendar} />
        </div>

        {/* ── Two-column layout ───────────────────────────────────── */}
        <div className="grid lg:grid-cols-3 gap-6 mb-8">
          {/* Left: Main content (2/3) */}
          <div className="lg:col-span-2 flex flex-col gap-6">
            {/* SRI Gauge */}
            <div className="bg-white dark:bg-white/5 rounded-xl border border-border/60 shadow-sm p-5">
              <h3 className="font-body text-xs uppercase tracking-widest text-ink-3 font-semibold mb-4">
                Indicateur de risque (SRI)
              </h3>
              <SriGauge sri={product.sri} />
            </div>

            {/* Tabs */}
            <div className="bg-white dark:bg-white/5 rounded-xl border border-border/60 shadow-sm overflow-hidden">
              <Tabs
                tabs={[
                  { label: 'Caractéristiques', value: 'overview' },
                  { label: 'Scénarios', value: 'scenarios' },
                  { label: "Dates d'observation", value: 'dates' },
                ]}
                activeTab={activeTab}
                onChange={setActiveTab}
                className="px-5"
              />

              <TabPanel value="overview" activeTab={activeTab} className="p-5">
                <div className="divide-y divide-border/50">
                  <DetailRow label="Émetteur" value={product.issuerName} />
                  {product.underlyingName && <DetailRow label="Sous-jacent" value={product.underlyingName} />}
                  {product.underlyingYahoo && !product.underlyingName && (
                    <DetailRow label="Sous-jacent" value={<span className="font-mono">{product.underlyingYahoo}</span>} />
                  )}
                  {product.barrierCapPct != null && (
                    <DetailRow label="Barrière capital" value={<span className="text-red font-bold">{formatPct(product.barrierCapPct)}</span>} />
                  )}
                  {product.autocallBarrierPct != null && (
                    <DetailRow label="Barrière autocall" value={formatPct(product.autocallBarrierPct)} />
                  )}
                  {product.couponPct != null && (
                    <DetailRow label="Coupon" value={<span className="text-teal">{formatPct(product.couponPct)}</span>} />
                  )}
                  {product.maxGainPct != null && (
                    <DetailRow label="Gain maximum" value={<span className="text-gold font-bold">{formatPct(product.maxGainPct)}</span>} />
                  )}
                  {product.maturityDate && <DetailRow label="Échéance" value={formatDate(product.maturityDate)} />}
                  {product.entryFeePct != null && <DetailRow label="Frais d'entrée" value={formatPct(product.entryFeePct)} />}
                </div>

                {/* Regulatory disclaimers */}
                <div className="mt-6 pt-5 border-t border-border/50">
                  <h4 className="text-[11px] uppercase tracking-widest text-ink-3 font-semibold font-body mb-3 flex items-center gap-1.5">
                    <AlertTriangle size={12} />
                    Mentions réglementaires
                  </h4>
                  <div className="flex flex-col gap-2">
                    {REGULATORY_DISCLAIMERS.map((d, i) => (
                      <div key={i} className="flex items-start gap-2 text-[11px] text-ink-3 font-body leading-relaxed">
                        <d.icon size={11} className="shrink-0 mt-0.5 text-ink-3/60" />
                        <span>{d.text}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </TabPanel>

              <TabPanel value="scenarios" activeTab={activeTab} className="p-5">
                <p className="text-xs text-ink-3 font-body mb-4">
                  Estimation des performances selon différents scénarios de marché, pour un investissement initial de 10 000 €.
                </p>
                <ScenarioTable product={product} />
                {scenarios.length > 0 && (
                  <div className="mt-6">
                    <h4 className="text-[11px] uppercase tracking-widest text-ink-3 font-semibold font-body mb-3">
                      Simulation graphique
                    </h4>
                    <PayoffCanvas scenarios={scenarios} height={280} />
                  </div>
                )}
              </TabPanel>

              <TabPanel value="dates" activeTab={activeTab} className="p-5">
                {Array.isArray(product.observationDates) && product.observationDates.length > 0 ? (
                  <>
                    <p className="text-xs text-ink-3 font-body mb-4">
                      Dates de constatation pour le mécanisme de remboursement anticipé automatique.
                    </p>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                      {product.observationDates.map((date: string, i: number) => {
                        const isPast = new Date(date) < new Date();
                        return (
                          <div
                            key={date}
                            className={cn(
                              "flex items-center gap-2 rounded-lg border px-3 py-2.5",
                              isPast
                                ? 'border-border/40 bg-surface-2 text-ink-3'
                                : 'border-violet/20 bg-violet-pale text-violet',
                            )}
                          >
                            <Calendar size={12} className={isPast ? 'text-ink-3/50' : 'text-violet'} />
                            <div>
                              <span className={cn("font-mono text-xs tabular-nums font-semibold", isPast && 'line-through opacity-60')}>
                                {formatDateShort(date)}
                              </span>
                              <span className="block text-[9px] font-body opacity-60">
                                Année {i + 1}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </>
                ) : (
                  <div className="text-center py-12 text-ink-3 font-body text-sm">
                    <Calendar size={24} className="mx-auto mb-2 opacity-40" />
                    <p>Aucune date d&apos;observation disponible pour ce produit.</p>
                  </div>
                )}
              </TabPanel>
            </div>

            {/* Barrier Gauge */}
            {product.barrierCapPct != null && (
              <div className="bg-white dark:bg-white/5 rounded-xl border border-border/60 shadow-sm p-5">
                <h3 className="font-body text-xs uppercase tracking-widest text-ink-3 font-semibold mb-4">
                  Jauge barrière
                </h3>
                <div className="flex justify-center py-2">
                  <BarrierGauge barrierPct={product.barrierCapPct} currentPct={product.currentPct ?? 100} size={220} />
                </div>
              </div>
            )}
          </div>

          {/* Right: CTA Card (1/3) */}
          <div className="flex flex-col gap-5">
            <div className="bg-white dark:bg-white/5 rounded-xl border border-border/60 shadow-sm p-5 flex flex-col gap-4 sticky top-6">
              <h3 className="font-body text-xs uppercase tracking-widest text-ink-3 font-semibold">Étagère</h3>

              <div>
                <div className="flex items-center justify-between text-xs font-body mb-1.5">
                  <span className="text-ink-3">Remplissage</span>
                  <span className="font-bold text-ink tabular-nums font-mono">{(product.fillPct ?? 0).toFixed(0)}%</span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-surface-2">
                  <div
                    className="h-full rounded-full transition-all duration-700 ease-out"
                    style={{
                      width: `${Math.min(100, product.fillPct ?? 0)}%`,
                      background: (product.fillPct ?? 0) > 80
                        ? 'linear-gradient(90deg, #00B894, #00D4AA)'
                        : `linear-gradient(90deg, ${payoff.text}, ${payoff.text}dd)`,
                    }}
                  />
                </div>
              </div>

              {product.targetAmount != null && <DetailRow label="Objectif" value={formatAmount(product.targetAmount)} />}

              {/* Interests & engagement */}
              {(product.interestedCount != null || product.totalEngaged != null) && (
                <div className="grid grid-cols-2 gap-2">
                  {product.interestedCount != null && (
                    <div className="flex flex-col items-center py-2 rounded-md bg-surface-2">
                      <Users size={13} className="text-violet mb-1" />
                      <span className="font-display text-lg font-bold text-ink">{product.interestedCount}</span>
                      <span className="text-[9px] uppercase tracking-wider text-ink-3 font-body">CGP intéressés</span>
                    </div>
                  )}
                  {product.totalEngaged != null && (
                    <div className="flex flex-col items-center py-2 rounded-md bg-surface-2">
                      <TrendingUp size={13} className="text-teal mb-1" />
                      <span className="font-display text-lg font-bold text-ink">{formatAmount(product.totalEngaged)}</span>
                      <span className="text-[9px] uppercase tracking-wider text-ink-3 font-body">Engagé</span>
                    </div>
                  )}
                </div>
              )}

              {product.shelfClosingDate && (
                <div className="flex items-center gap-2 px-3 py-2 rounded-md bg-surface-2 border border-border/50">
                  <Clock size={12} className="text-ink-3" />
                  <div className="flex-1">
                    <p className="text-[10px] text-ink-3 font-body uppercase tracking-wider">Clôture</p>
                    <p className="text-xs font-semibold text-ink font-body">{formatDate(product.shelfClosingDate)}</p>
                  </div>
                  {closingDays != null && closingDays <= 30 && (
                    <span className="text-[10px] font-bold text-red bg-red-light px-1.5 py-0.5 rounded">J-{closingDays}</span>
                  )}
                </div>
              )}

              <div className="mt-2">
                <Button
                  variant={alreadyCommitted ? 'outline' : 'primary'}
                  size="lg"
                  className={cn("w-full rounded-xl", !alreadyCommitted && !isClosed && "bg-gradient-to-r from-violet to-violet/85 shadow-md shadow-violet/20 hover:shadow-lg hover:shadow-violet/30")}
                  disabled={isClosed}
                  onClick={() => setModalOpen(true)}
                >
                  {alreadyCommitted ? (
                    <><Shield size={16} /> Intérêt déjà enregistré</>
                  ) : (
                    <><TrendingUp size={16} /> {isClosed ? 'Produit fermé' : "Marquer mon intérêt"}</>
                  )}
                </Button>
                {!isClosed && (
                  <p className="mt-2 text-center text-[10px] text-ink-3 font-body leading-relaxed">
                    Sans engagement ferme de souscription. Votre marque d&apos;intérêt sera transmise aux équipes de distribution.
                  </p>
                )}
              </div>

              {/* Documents section */}
              <div className="flex flex-col gap-2">
                <h4 className="text-[10px] uppercase tracking-widest text-ink-3 font-semibold font-body">Documents</h4>
                {[
                  { label: 'Document KID (PRIIPS)', sub: "Document d'informations clés", icon: FileText },
                  { label: 'Fiche produit', sub: 'Présentation détaillée', icon: FileText },
                  { label: 'Présentation client', sub: 'Support commercial', icon: Download },
                ].map(({ label, sub, icon: Icon }) => {
                  const isRecent = product.createdAt && (Date.now() - new Date(product.createdAt).getTime()) < 7 * 24 * 60 * 60 * 1000;
                  return (
                    <button key={label} className="flex items-center gap-2 px-3 py-2.5 rounded-md border border-border/80 bg-surface-2 hover:border-violet/40 hover:bg-violet-pale text-ink-3 hover:text-violet transition-all duration-150 w-full text-left">
                      <Icon size={14} />
                      <div className="flex-1">
                        <p className="text-xs font-semibold font-body flex items-center gap-1.5">
                          {label}
                          {isRecent && (
                            <span className="inline-flex items-center rounded-full bg-[#E4EAFF] text-[#0A2799] px-1.5 py-0 text-[8px] font-bold">
                              Nouveau
                            </span>
                          )}
                        </p>
                        <p className="text-[10px] font-body opacity-60">{sub}</p>
                      </div>
                      <ExternalLink size={12} />
                    </button>
                  );
                })}
              </div>
            </div>

            {product.entryFeePct != null && (
              <div className="bg-white rounded-xl border border-border/80 p-4">
                <h4 className="text-[10px] uppercase tracking-widest text-ink-3 font-semibold font-body mb-2">Commission</h4>
                <p className="text-lg font-display font-bold text-ink">
                  {product.entryFeePct.toFixed(2)}%
                  <span className="text-xs text-ink-3 font-body font-normal ml-1">frais d&apos;entrée</span>
                </p>
              </div>
            )}
          </div>
        </div>
      </main>

      <CommitmentModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        shelfId={product.shelfId ?? product.id}
        productName={product.name}
        alreadyCommitted={alreadyCommitted}
      />
    </>
  );
}
