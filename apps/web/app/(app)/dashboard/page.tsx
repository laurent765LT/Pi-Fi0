'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import {
  TrendingUp,
  ShieldCheck,
  Clock,
  ArrowUpRight,
  ArrowRight,
  Layers,
  BarChart3,
  Zap,
} from 'lucide-react';
import { useProducts } from '@/hooks/use-products';
import { useMyCommitments } from '@/hooks/use-commitments';
import { useAuthStore } from '@/stores/auth-store';
import { ProductCard } from '@/components/products/product-card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatAmount(amount: number): string {
  if (amount >= 1_000_000) {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR',
      maximumFractionDigits: 1,
      notation: 'compact',
    }).format(amount);
  }
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatDate(isoDate: string): string {
  return new Date(isoDate).toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

function daysUntil(isoDate: string): number {
  const now = new Date();
  const target = new Date(isoDate);
  return Math.ceil((target.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
}

// ─── Stat Card ────────────────────────────────────────────────────────────────

interface StatCardProps {
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
  sub?: React.ReactNode;
  accentColor?: string;
}

function StatCard({ icon, label, value, sub, accentColor = '#3B1FA8' }: StatCardProps) {
  return (
    <div className="group relative bg-white rounded-xl border border-border/80 p-5 flex flex-col gap-3 transition-all duration-300 hover:shadow-md hover:-translate-y-0.5">
      {/* Top accent line */}
      <div
        className="absolute top-0 left-4 right-4 h-[2px] rounded-b-full opacity-60 group-hover:opacity-100 transition-opacity"
        style={{ background: accentColor }}
      />

      <div className="flex items-center justify-between">
        <div
          className="w-8 h-8 rounded-lg flex items-center justify-center"
          style={{ background: `${accentColor}10` }}
        >
          {icon}
        </div>
        {sub && (
          <span className="text-[11px] font-medium text-ink-3 font-body">{sub}</span>
        )}
      </div>

      <div className="flex flex-col gap-0.5">
        <span className="text-[10px] uppercase tracking-[0.2em] text-ink-3 font-semibold font-body">
          {label}
        </span>
        <span className="font-display text-2xl font-bold text-ink leading-none tracking-tight">
          {value}
        </span>
      </div>
    </div>
  );
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function SkeletonCard() {
  return (
    <div className="bg-white rounded-xl border border-border/80 p-5 animate-pulse">
      <div className="flex items-center gap-3 mb-4">
        <div className="h-8 w-8 bg-violet-pale rounded-lg" />
      </div>
      <div className="h-2.5 w-20 bg-surface-2 rounded mb-2" />
      <div className="h-7 w-16 bg-surface-2 rounded" />
    </div>
  );
}

function SkeletonProductCard() {
  return (
    <div className="bg-white rounded-xl border border-border/80 p-5 animate-pulse flex flex-col gap-3">
      <div className="flex justify-between">
        <div className="h-5 w-28 bg-violet-pale rounded-md" />
        <div className="h-5 w-12 bg-surface-2 rounded-md" />
      </div>
      <div className="h-4 w-36 bg-surface-2 rounded" />
      <div className="h-3 w-full bg-surface-2 rounded mt-2" />
      <div className="h-1.5 w-full bg-surface-2 rounded-full mt-1" />
      <div className="h-9 w-full bg-violet-pale rounded-md mt-auto" />
    </div>
  );
}

// ─── Commitment Row ───────────────────────────────────────────────────────────

const STATUS_VARIANT: Record<string, 'teal' | 'gold' | 'red' | 'muted'> = {
  CONFIRMED: 'teal',
  PENDING: 'gold',
  CANCELLED: 'red',
};

const STATUS_LABEL: Record<string, string> = {
  CONFIRMED: 'Confirm\u00e9',
  PENDING: 'En attente',
  CANCELLED: 'Annul\u00e9',
};

// ─── Mini Bar Chart (payoff type distribution) ────────────────────────────────

const PAYOFF_COLORS: Record<string, string> = {
  AUTOCALL_PHOENIX: '#3B1FA8',
  AUTOCALL_COUPON: '#5535C4',
  CAPITAL_PROTECTED: '#00B894',
  CONDITIONAL_RATE: '#1A3FCC',
  BARRIER_NOTE: '#D4A017',
};

const PAYOFF_LABELS: Record<string, string> = {
  AUTOCALL_PHOENIX: 'Phoenix',
  AUTOCALL_COUPON: 'Coupon',
  CAPITAL_PROTECTED: 'Prot\u00e9g\u00e9',
  CONDITIONAL_RATE: 'Taux Cond.',
  BARRIER_NOTE: 'Barrier',
};

function PayoffDistribution({ products }: { products: any[] }) {
  const distribution = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const p of products) {
      counts[p.payoffType] = (counts[p.payoffType] || 0) + 1;
    }
    const total = products.length || 1;
    return Object.entries(counts).map(([type, count]) => ({
      type,
      count,
      pct: (count / total) * 100,
      color: PAYOFF_COLORS[type] || '#7B6FA0',
      label: PAYOFF_LABELS[type] || type,
    }));
  }, [products]);

  if (!distribution.length) return null;

  return (
    <div className="flex flex-col gap-3">
      {/* Stacked horizontal bar */}
      <div className="flex h-2 rounded-full overflow-hidden bg-surface-2">
        {distribution.map((d) => (
          <div
            key={d.type}
            className="h-full transition-all duration-700"
            style={{ width: `${d.pct}%`, backgroundColor: d.color }}
          />
        ))}
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-x-4 gap-y-1">
        {distribution.map((d) => (
          <div key={d.type} className="flex items-center gap-1.5">
            <span
              className="w-2 h-2 rounded-full shrink-0"
              style={{ backgroundColor: d.color }}
            />
            <span className="text-[11px] text-ink-3 font-body">
              {d.label}
              <span className="font-semibold text-ink-2 ml-1">{d.count}</span>
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const { data: productsData, isLoading: loadingProducts } = useProducts({ status: 'ACTIVE' });
  const { data: commitments, isLoading: loadingCommitments } = useMyCommitments();
  const user = useAuthStore((s) => s.user);

  const products = productsData?.data ?? [];
  const activeProductCount = products.length;

  const totalVolume = useMemo(() => {
    if (!commitments) return 0;
    return commitments.reduce((sum: number, c: any) => sum + (c.amount ?? 0), 0);
  }, [commitments]);

  const myCommitmentCount = commitments?.length ?? 0;

  const nextClosing = useMemo(() => {
    if (!products.length) return null;
    const now = Date.now();
    const upcoming = products
      .filter((p: any) => p.shelfClosingDate && new Date(p.shelfClosingDate).getTime() > now)
      .sort((a: any, b: any) =>
        new Date(a.shelfClosingDate).getTime() - new Date(b.shelfClosingDate).getTime(),
      );
    return upcoming[0]?.shelfClosingDate ?? null;
  }, [products]);

  const recommendedProducts = products.slice(0, 3);

  const recentCommitments = useMemo(() => {
    if (!commitments) return [];
    return [...commitments]
      .sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 5);
  }, [commitments]);

  const firstName = (user as any)?.firstName ?? 'Utilisateur';

  return (
    <div className="animate-fade-in">
      {/* ── Welcome header ─────────────────────────────────────── */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-display text-[28px] font-bold text-ink leading-tight">
              Bonjour, {firstName}
            </h1>
            <p className="text-sm text-ink-3 font-body mt-1">
              Voici un aper\u00e7u de votre activit\u00e9 sur la plateforme.
            </p>
          </div>
          <Button asChild variant="primary" size="md">
            <Link href="/products" className="flex items-center gap-2">
              <Layers size={15} />
              Explorer les produits
            </Link>
          </Button>
        </div>
        <div className="gradient-bar h-[2px] rounded-full mt-5 opacity-60" />
      </div>

      {/* ── Stats row ──────────────────────────────────────────── */}
      <section aria-label="Statistiques" className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10 stagger-children">
        {loadingProducts || loadingCommitments ? (
          <>
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </>
        ) : (
          <>
            <StatCard
              icon={<Layers size={16} className="text-violet" />}
              label="Produits actifs"
              value={activeProductCount}
              accentColor="#3B1FA8"
            />
            <StatCard
              icon={<TrendingUp size={16} className="text-cobalt-light" />}
              label="Volume engag\u00e9"
              value={formatAmount(totalVolume)}
              sub={`${myCommitmentCount} engagement${myCommitmentCount > 1 ? 's' : ''}`}
              accentColor="#3D63F5"
            />
            <StatCard
              icon={<ShieldCheck size={16} className="text-teal" />}
              label="Mes engagements"
              value={myCommitmentCount}
              accentColor="#00B894"
            />
            <StatCard
              icon={<Clock size={16} className="text-gold" />}
              label="Prochain closing"
              value={
                nextClosing ? (
                  <span className="text-xl">{formatDate(nextClosing)}</span>
                ) : (
                  <span className="text-ink-3 text-sm">\u2014</span>
                )
              }
              sub={nextClosing ? `J-${daysUntil(nextClosing)}` : undefined}
              accentColor="#D4A017"
            />
          </>
        )}
      </section>

      {/* ── Two-column layout ──────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-10">
        {/* Left: Distribution + Activity */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          {/* Payoff Type Distribution */}
          {!loadingProducts && products.length > 0 && (
            <div className="bg-white rounded-xl border border-border/80 p-5">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <BarChart3 size={16} className="text-violet" />
                  <h3 className="font-display text-sm font-bold text-ink">
                    R\u00e9partition par type de payoff
                  </h3>
                </div>
                <span className="text-[11px] text-ink-3 font-mono">
                  {products.length} produit{products.length > 1 ? 's' : ''}
                </span>
              </div>
              <PayoffDistribution products={products} />
            </div>
          )}

          {/* Recent Activity */}
          <div className="bg-white rounded-xl border border-border/80 overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-border/60">
              <div className="flex items-center gap-2">
                <Zap size={16} className="text-violet" />
                <h3 className="font-display text-sm font-bold text-ink">
                  Activit\u00e9 r\u00e9cente
                </h3>
              </div>
              <Link
                href="/portfolio"
                className="text-[11px] font-semibold text-violet hover:text-violet-mid transition-colors flex items-center gap-1"
              >
                Voir tout <ArrowRight size={12} />
              </Link>
            </div>

            {loadingCommitments ? (
              <div className="p-5 animate-pulse space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex items-center gap-3">
                    <div className="h-3 w-40 bg-surface-2 rounded" />
                    <div className="h-3 w-20 bg-surface-2 rounded ml-auto" />
                    <div className="h-5 w-16 bg-surface-2 rounded-md" />
                  </div>
                ))}
              </div>
            ) : recentCommitments.length === 0 ? (
              <div className="px-5 py-10 text-center">
                <p className="text-sm text-ink-3 font-body">
                  Aucune activit\u00e9 r\u00e9cente.
                </p>
                <p className="text-xs text-ink-4 font-body mt-1">
                  Vos marques d&apos;int\u00e9r\u00eat appara\u00eetront ici.
                </p>
              </div>
            ) : (
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Produit</th>
                    <th className="text-right">Montant</th>
                    <th className="text-center">Statut</th>
                    <th className="text-right">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {recentCommitments.map((c: any) => (
                    <tr key={c.id}>
                      <td className="font-medium text-ink truncate max-w-[200px]">
                        {c.productName ?? c.shelfId ?? '\u2014'}
                      </td>
                      <td className="text-right font-mono font-semibold text-ink tabular-nums">
                        {formatAmount(c.amount)}
                      </td>
                      <td className="text-center">
                        <Badge variant={STATUS_VARIANT[c.status] ?? 'muted'}>
                          {STATUS_LABEL[c.status] ?? c.status}
                        </Badge>
                      </td>
                      <td className="text-right text-ink-3 text-xs tabular-nums">
                        {c.createdAt ? formatDate(c.createdAt) : '\u2014'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Right: Quick Actions + Issuers */}
        <div className="flex flex-col gap-6">
          {/* Quick Actions */}
          <div className="bg-white rounded-xl border border-border/80 p-5">
            <h3 className="font-display text-sm font-bold text-ink mb-4">
              Actions rapides
            </h3>
            <div className="flex flex-col gap-2">
              <Link
                href="/products"
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg bg-violet-ghost hover:bg-violet-pale border border-transparent hover:border-border transition-all duration-200 group"
              >
                <div className="w-8 h-8 rounded-lg bg-violet/10 flex items-center justify-center">
                  <Layers size={14} className="text-violet" />
                </div>
                <div className="flex-1 min-w-0">
                  <span className="text-xs font-semibold text-ink block">
                    Catalogue produits
                  </span>
                  <span className="text-[10px] text-ink-3">
                    {activeProductCount} produit{activeProductCount > 1 ? 's' : ''} disponible{activeProductCount > 1 ? 's' : ''}
                  </span>
                </div>
                <ArrowUpRight
                  size={14}
                  className="text-ink-3 group-hover:text-violet transition-colors"
                />
              </Link>

              <Link
                href="/portfolio"
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg bg-surface hover:bg-teal-light border border-transparent hover:border-border transition-all duration-200 group"
              >
                <div className="w-8 h-8 rounded-lg bg-teal/10 flex items-center justify-center">
                  <ShieldCheck size={14} className="text-teal" />
                </div>
                <div className="flex-1 min-w-0">
                  <span className="text-xs font-semibold text-ink block">
                    Mon portfolio
                  </span>
                  <span className="text-[10px] text-ink-3">
                    {myCommitmentCount} engagement{myCommitmentCount > 1 ? 's' : ''}
                  </span>
                </div>
                <ArrowUpRight
                  size={14}
                  className="text-ink-3 group-hover:text-teal transition-colors"
                />
              </Link>
            </div>
          </div>

          {/* Issuers Distribution */}
          {!loadingProducts && products.length > 0 && (
            <div className="bg-white rounded-xl border border-border/80 p-5">
              <h3 className="font-display text-sm font-bold text-ink mb-4">
                \u00c9metteurs
              </h3>
              <div className="flex flex-col gap-2.5">
                {Array.from(new Set(products.map((p: any) => p.issuerName))).map(
                  (issuer: any) => {
                    const count = products.filter(
                      (p: any) => p.issuerName === issuer,
                    ).length;
                    const pct = (count / products.length) * 100;
                    return (
                      <div key={issuer} className="flex flex-col gap-1">
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-ink-2 font-medium truncate">
                            {issuer}
                          </span>
                          <span className="text-[10px] font-mono text-ink-3 tabular-nums">
                            {count}
                          </span>
                        </div>
                        <div className="h-1 rounded-full bg-surface-2 overflow-hidden">
                          <div
                            className="h-full rounded-full bg-violet-light transition-all duration-700"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    );
                  },
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Recommended Products ───────────────────────────────── */}
      <section className="mb-6">
        <div className="flex items-center justify-between mb-5">
          <h2 className="section-header font-display text-lg font-bold text-ink">
            Produits recommand\u00e9s
          </h2>
          <Link
            href="/products"
            className="text-xs font-semibold text-violet hover:text-violet-mid transition-colors flex items-center gap-1"
          >
            Tous les produits <ArrowRight size={13} />
          </Link>
        </div>

        {loadingProducts ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 stagger-children">
            <SkeletonProductCard />
            <SkeletonProductCard />
            <SkeletonProductCard />
          </div>
        ) : recommendedProducts.length === 0 ? (
          <div className="bg-white rounded-xl border border-border/80 py-12 flex items-center justify-center">
            <p className="text-ink-3 font-body text-sm">
              Aucun produit disponible pour le moment.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 stagger-children">
            {recommendedProducts.map((product: any) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
