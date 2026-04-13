'use client';

import { useState, useMemo } from 'react';
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
  Heart,
  Eye,
  Sparkles,
  Calculator,
  FileSearch,
  BookOpen,
  Star,
  Wallet,
  X,
} from 'lucide-react';
import { useProducts } from '@/hooks/use-products';
import { useMyCommitments } from '@/hooks/use-commitments';
import { useAuthStore } from '@/stores/auth-store';
import { useRecommendations, useGenerateRecommendations, useDismissRecommendation } from '@/hooks/use-recommendations';
import { useFavorites, useRecentViews } from '@/hooks/use-favorites';
import { useCommissionSummary } from '@/hooks/use-commissions';
import { ProductCard } from '@/components/products/product-card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatAmount(amount: number): string {
  if (amount >= 1_000_000) {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency', currency: 'EUR', maximumFractionDigits: 1, notation: 'compact',
    }).format(amount);
  }
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency', currency: 'EUR', maximumFractionDigits: 0,
  }).format(amount);
}

function formatDate(isoDate: string): string {
  return new Date(isoDate).toLocaleDateString('fr-FR', {
    day: '2-digit', month: 'short', year: 'numeric',
  });
}

function daysUntil(isoDate: string): number {
  return Math.ceil((new Date(isoDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
}

// ─── Stat Card ────────────────────────────────────────────────────────────────

function StatCard({ icon, label, value, sub, accentColor = '#3B1FA8' }: {
  icon: React.ReactNode; label: string; value: React.ReactNode; sub?: React.ReactNode; accentColor?: string;
}) {
  return (
    <div className="group relative bg-white rounded-xl border border-border/80 p-5 flex flex-col gap-3 transition-all duration-300 hover:shadow-md hover:-translate-y-0.5">
      <div className="absolute top-0 left-4 right-4 h-[2px] rounded-b-full opacity-60 group-hover:opacity-100 transition-opacity" style={{ background: accentColor }} />
      <div className="flex items-center justify-between">
        <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: `${accentColor}10` }}>
          {icon}
        </div>
        {sub && <span className="text-[11px] font-medium text-ink-3 font-body">{sub}</span>}
      </div>
      <div className="flex flex-col gap-0.5">
        <span className="text-[10px] uppercase tracking-[0.2em] text-ink-3 font-semibold font-body">{label}</span>
        <span className="font-display text-2xl font-bold text-ink leading-none tracking-tight">{value}</span>
      </div>
    </div>
  );
}

function SkeletonCard() {
  return (
    <div className="bg-white rounded-xl border border-border/80 p-5 animate-pulse">
      <div className="flex items-center gap-3 mb-4"><div className="h-8 w-8 bg-violet-pale rounded-lg" /></div>
      <div className="h-2.5 w-20 bg-surface-2 rounded mb-2" />
      <div className="h-7 w-16 bg-surface-2 rounded" />
    </div>
  );
}

// ─── Status maps ──────────────────────────────────────────────────────────────

const STATUS_VARIANT: Record<string, 'teal' | 'gold' | 'red' | 'muted'> = {
  CONFIRMED: 'teal', PENDING: 'gold', CANCELLED: 'red',
};
const STATUS_LABEL: Record<string, string> = {
  CONFIRMED: 'Confirme', PENDING: 'En attente', CANCELLED: 'Annule',
};

const PAYOFF_COLORS: Record<string, string> = {
  AUTOCALL_PHOENIX: '#3B1FA8', AUTOCALL_COUPON: '#5535C4',
  CAPITAL_PROTECTED: '#00B894', CONDITIONAL_RATE: '#1A3FCC', BARRIER_NOTE: '#D4A017',
};
const PAYOFF_LABELS: Record<string, string> = {
  AUTOCALL_PHOENIX: 'Phoenix', AUTOCALL_COUPON: 'Coupon',
  CAPITAL_PROTECTED: 'Protege', CONDITIONAL_RATE: 'Taux Cond.', BARRIER_NOTE: 'Barrier',
};

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const { data: productsData, isLoading: loadingProducts } = useProducts({ status: 'ACTIVE' });
  const { data: commitments, isLoading: loadingCommitments } = useMyCommitments();
  const { data: recommendations } = useRecommendations();
  const { data: favorites } = useFavorites();
  const { data: recentViewsData } = useRecentViews(5);
  const { data: commissionSummary } = useCommissionSummary();
  const generateRecs = useGenerateRecommendations();
  const dismissRec = useDismissRecommendation();
  const user = useAuthStore((s) => s.user);

  const products = productsData?.data ?? [];
  const activeProductCount = products.length;
  const recentViews: any[] = Array.isArray(recentViewsData) ? recentViewsData : [];
  const recs: any[] = Array.isArray(recommendations) ? recommendations : [];
  const favs: any[] = Array.isArray(favorites) ? favorites : [];

  const totalVolume = useMemo(() => {
    if (!commitments) return 0;
    return commitments.reduce((sum: number, c: any) => sum + (c.amount ?? 0), 0);
  }, [commitments]);

  const myCommitmentCount = commitments?.length ?? 0;

  const nextClosing = useMemo(() => {
    const now = Date.now();
    const upcoming = products
      .filter((p: any) => p.shelfClosingDate && new Date(p.shelfClosingDate).getTime() > now)
      .sort((a: any, b: any) => new Date(a.shelfClosingDate).getTime() - new Date(b.shelfClosingDate).getTime());
    return upcoming[0]?.shelfClosingDate ?? null;
  }, [products]);

  const recentCommitments = useMemo(() => {
    if (!commitments) return [];
    return [...commitments]
      .sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 5);
  }, [commitments]);

  // Commission totals
  const totalCommissions = (commissionSummary as any)?.accrued?.distributor ?? 0;

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
              Voici votre tableau de bord personnalise.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button asChild variant="outline" size="md">
              <Link href="/pricing" className="flex items-center gap-2">
                <Calculator size={15} />
                Pricer
              </Link>
            </Button>
            <Button asChild variant="primary" size="md">
              <Link href="/products" className="flex items-center gap-2">
                <Layers size={15} />
                Explorer
              </Link>
            </Button>
          </div>
        </div>
        <div className="gradient-bar h-[2px] rounded-full mt-5 opacity-60" />
      </div>

      {/* ── Stats row ──────────────────────────────────────────── */}
      <section className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-10 stagger-children">
        {loadingProducts || loadingCommitments ? (
          <>{[1,2,3,4,5].map(i => <SkeletonCard key={i} />)}</>
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
              label="Volume engage"
              value={formatAmount(totalVolume)}
              sub={`${myCommitmentCount} engagement${myCommitmentCount > 1 ? 's' : ''}`}
              accentColor="#3D63F5"
            />
            <StatCard
              icon={<Heart size={16} className="text-red" />}
              label="Mes favoris"
              value={favs.length}
              accentColor="#E8334A"
            />
            <StatCard
              icon={<Wallet size={16} className="text-teal" />}
              label="Commissions"
              value={formatAmount(totalCommissions)}
              sub="A percevoir"
              accentColor="#00B894"
            />
            <StatCard
              icon={<Clock size={16} className="text-gold" />}
              label="Prochain closing"
              value={nextClosing ? <span className="text-xl">{formatDate(nextClosing)}</span> : <span className="text-ink-3 text-sm">—</span>}
              sub={nextClosing ? `J-${daysUntil(nextClosing)}` : undefined}
              accentColor="#D4A017"
            />
          </>
        )}
      </section>

      {/* ── AI Recommendations ────────────────────────────────── */}
      {recs.length > 0 && (
        <section className="mb-10">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-violet to-cobalt-light flex items-center justify-center">
                <Sparkles size={14} className="text-white" />
              </div>
              <h2 className="font-display text-lg font-bold text-ink">Recommandations IA</h2>
              <span className="text-[10px] bg-violet-pale text-violet px-2 py-0.5 rounded-full font-body font-bold">
                {recs.length} suggestions
              </span>
            </div>
            <button
              onClick={() => generateRecs.mutate()}
              disabled={generateRecs.isPending}
              className="text-xs font-semibold text-violet hover:text-violet-mid transition-colors flex items-center gap-1"
            >
              <Sparkles size={11} />
              Rafraichir
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {recs.slice(0, 3).map((rec: any) => (
              <div key={rec.productId ?? rec.id} className="relative bg-white border border-border/80 rounded-xl p-4 hover:shadow-sm transition-all group">
                <button
                  onClick={() => dismissRec.mutate(rec.productId)}
                  className="absolute top-2 right-2 p-1 rounded-md text-ink-3 hover:text-red hover:bg-red-light transition opacity-0 group-hover:opacity-100"
                  title="Masquer"
                >
                  <X size={12} />
                </button>

                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-violet-pale to-cobalt-pale flex items-center justify-center shrink-0">
                    <Star size={16} className="text-violet" />
                  </div>
                  <div className="min-w-0">
                    <Link href={`/products/${rec.product?.id ?? rec.productId}`} className="font-body text-sm font-semibold text-ink hover:text-violet transition truncate block">
                      {rec.product?.name ?? 'Produit'}
                    </Link>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-[10px] font-body text-ink-3">{rec.product?.issuerName}</span>
                      {rec.score && (
                        <span className="text-[10px] font-mono font-bold text-violet bg-violet-pale px-1.5 py-0.5 rounded">
                          {rec.score.toFixed(0)}pts
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {rec.reason && (
                  <p className="text-[11px] font-body text-ink-3 mt-3 leading-relaxed">
                    {rec.reason}
                  </p>
                )}

                <div className="flex items-center gap-3 mt-3 pt-3 border-t border-border/50">
                  {rec.product?.couponPct != null && (
                    <span className="text-[10px] font-body text-teal font-semibold">
                      {rec.product.couponPct}% coupon
                    </span>
                  )}
                  {rec.product?.barrierCapPct != null && (
                    <span className="text-[10px] font-body text-ink-3">
                      Barriere {rec.product.barrierCapPct}%
                    </span>
                  )}
                  {rec.product?.sri != null && (
                    <span className="text-[10px] font-body text-ink-3">
                      SRI {rec.product.sri}/7
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ── Two-column layout ──────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-10">
        {/* Left column */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          {/* Payoff Type Distribution */}
          {!loadingProducts && products.length > 0 && (
            <div className="bg-white rounded-xl border border-border/80 p-5">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <BarChart3 size={16} className="text-violet" />
                  <h3 className="font-display text-sm font-bold text-ink">Repartition par type</h3>
                </div>
                <span className="text-[11px] text-ink-3 font-mono">{products.length} produits</span>
              </div>
              <DonutChart products={products} />
            </div>
          )}

          {/* Collection Curve */}
          {!loadingCommitments && (commitments?.length ?? 0) >= 2 && (
            <div className="bg-white rounded-xl border border-border/80 p-5">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <TrendingUp size={16} className="text-violet" />
                  <h3 className="font-display text-sm font-bold text-ink">Courbe de collecte</h3>
                </div>
                <span className="text-[11px] text-ink-3 font-mono">Cumul des engagements</span>
              </div>
              <CollectionCurve commitments={commitments ?? []} />
            </div>
          )}

          {/* Recent Activity */}
          <div className="bg-white rounded-xl border border-border/80 overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-border/60">
              <div className="flex items-center gap-2">
                <Zap size={16} className="text-violet" />
                <h3 className="font-display text-sm font-bold text-ink">Activite recente</h3>
              </div>
              <Link href="/portfolio" className="text-[11px] font-semibold text-violet hover:text-violet-mid transition-colors flex items-center gap-1">
                Voir tout <ArrowRight size={12} />
              </Link>
            </div>

            {loadingCommitments ? (
              <div className="p-5 animate-pulse space-y-3">
                {[1, 2, 3].map(i => (
                  <div key={i} className="flex items-center gap-3">
                    <div className="h-3 w-40 bg-surface-2 rounded" />
                    <div className="h-3 w-20 bg-surface-2 rounded ml-auto" />
                  </div>
                ))}
              </div>
            ) : recentCommitments.length === 0 ? (
              <div className="px-5 py-10 text-center">
                <p className="text-sm text-ink-3 font-body">Aucune activite recente.</p>
                <p className="text-xs text-ink-3/60 font-body mt-1">Vos marques d&apos;interet apparaitront ici.</p>
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
                      <td className="font-medium text-ink truncate max-w-[200px]">{c.productName ?? c.shelfId ?? '—'}</td>
                      <td className="text-right font-mono font-semibold text-ink tabular-nums">{formatAmount(c.amount)}</td>
                      <td className="text-center">
                        <Badge variant={STATUS_VARIANT[c.status] ?? 'muted'}>{STATUS_LABEL[c.status] ?? c.status}</Badge>
                      </td>
                      <td className="text-right text-ink-3 text-xs tabular-nums">{c.createdAt ? formatDate(c.createdAt) : '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Right column */}
        <div className="flex flex-col gap-6">
          {/* Quick Actions — Enhanced */}
          <div className="bg-white rounded-xl border border-border/80 p-5">
            <h3 className="font-display text-sm font-bold text-ink mb-4">Actions rapides</h3>
            <div className="flex flex-col gap-2">
              {[
                { href: '/products', icon: Layers, color: '#3B1FA8', label: 'Catalogue produits', sub: `${activeProductCount} produits` },
                { href: '/evenements', icon: Clock, color: '#C41F36', label: 'Événements', sub: 'Clôtures, observations, coupons' },
                { href: '/pricing', icon: Calculator, color: '#0A2799', label: 'Pricing Engine', sub: 'Pricer un produit' },
                { href: '/rfq', icon: FileSearch, color: '#00B894', label: 'RFQ Screener', sub: 'Demande de cotation' },
                { href: '/portfolio', icon: ShieldCheck, color: '#D4A017', label: 'Mon portfolio', sub: `${myCommitmentCount} engagements` },
                { href: '/research', icon: BookOpen, color: '#3D63F5', label: 'Research IA', sub: 'Analyse de marché' },
              ].map(({ href, icon: Icon, color, label, sub }) => (
                <Link key={href} href={href}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-surface-2 border border-transparent hover:border-border transition-all duration-200 group"
                >
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: `${color}10` }}>
                    <Icon size={14} style={{ color }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="text-xs font-semibold text-ink block">{label}</span>
                    <span className="text-[10px] text-ink-3">{sub}</span>
                  </div>
                  <ArrowUpRight size={14} className="text-ink-3 group-hover:text-violet transition-colors" />
                </Link>
              ))}
            </div>
          </div>

          {/* Recently Viewed */}
          {recentViews.length > 0 && (
            <div className="bg-white rounded-xl border border-border/80 p-5">
              <div className="flex items-center gap-2 mb-3">
                <Eye size={14} className="text-ink-3" />
                <h3 className="font-display text-sm font-bold text-ink">Vus recemment</h3>
              </div>
              <div className="flex flex-col gap-1.5">
                {recentViews.slice(0, 5).map((v: any) => (
                  <Link key={v.id} href={`/products/${v.product?.id ?? v.productId}`}
                    className="flex items-center justify-between px-2 py-1.5 rounded-md hover:bg-surface-2 transition text-xs font-body"
                  >
                    <span className="text-ink truncate max-w-[140px]">{v.product?.name ?? '—'}</span>
                    <span className="text-ink-3 text-[10px] shrink-0">{v.product?.issuerName}</span>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Issuers Distribution */}
          {!loadingProducts && products.length > 0 && (
            <div className="bg-white rounded-xl border border-border/80 p-5">
              <h3 className="font-display text-sm font-bold text-ink mb-4">Emetteurs</h3>
              <div className="flex flex-col gap-2.5">
                {Array.from(new Set(products.map((p: any) => p.issuerName))).slice(0, 6).map((issuer: any) => {
                  const count = products.filter((p: any) => p.issuerName === issuer).length;
                  const pct = (count / products.length) * 100;
                  return (
                    <div key={issuer} className="flex flex-col gap-1">
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-ink-2 font-medium truncate">{issuer}</span>
                        <span className="text-[10px] font-mono text-ink-3 tabular-nums">{count}</span>
                      </div>
                      <div className="h-1 rounded-full bg-surface-2 overflow-hidden">
                        <div className="h-full rounded-full bg-violet-light transition-all duration-700" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Recommended Products ───────────────────────────────── */}
      <section className="mb-6">
        <div className="flex items-center justify-between mb-5">
          <h2 className="section-header font-display text-lg font-bold text-ink">Produits populaires</h2>
          <Link href="/products" className="text-xs font-semibold text-violet hover:text-violet-mid transition-colors flex items-center gap-1">
            Tous les produits <ArrowRight size={13} />
          </Link>
        </div>

        {loadingProducts ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 stagger-children">
            {[1,2,3].map(i => (
              <div key={i} className="bg-white rounded-xl border border-border/80 p-5 animate-pulse flex flex-col gap-3">
                <div className="h-5 w-28 bg-violet-pale rounded-md" />
                <div className="h-4 w-36 bg-surface-2 rounded" />
                <div className="h-9 w-full bg-violet-pale rounded-md mt-auto" />
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 stagger-children">
            {products.slice(0, 3).map((product: any) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

// ─── Donut Chart Component ────────────────────────────────────────────────────

function DonutChart({ products }: { products: any[] }) {
  const [hovered, setHovered] = useState<string | null>(null);
  const distribution = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const p of products) counts[p.payoffType] = (counts[p.payoffType] || 0) + 1;
    const total = products.length || 1;
    return Object.entries(counts).map(([type, count]) => ({
      type, count, pct: (count / total) * 100,
      color: PAYOFF_COLORS[type] || '#7B6FA0',
      label: PAYOFF_LABELS[type] || type,
    }));
  }, [products]);

  if (!distribution.length) return null;

  const radius = 60;
  const strokeWidth = 18;
  const circumference = 2 * Math.PI * radius;
  let offset = 0;

  return (
    <div className="flex items-center gap-6">
      <div className="relative shrink-0">
        <svg width="160" height="160" viewBox="0 0 160 160">
          {distribution.map((d) => {
            const dashLen = (d.pct / 100) * circumference;
            const dashGap = circumference - dashLen;
            const currentOffset = offset;
            offset += dashLen;
            const isHov = hovered === d.type;
            return (
              <circle
                key={d.type}
                cx="80" cy="80" r={radius}
                fill="none"
                stroke={d.color}
                strokeWidth={isHov ? strokeWidth + 4 : strokeWidth}
                strokeDasharray={dashLen + ' ' + dashGap}
                strokeDashoffset={-currentOffset}
                strokeLinecap="butt"
                opacity={hovered && !isHov ? 0.4 : 1}
                onMouseEnter={() => setHovered(d.type)}
                onMouseLeave={() => setHovered(null)}
                className="transition-all duration-300 cursor-pointer"
                style={{ transformOrigin: 'center', transform: 'rotate(-90deg)' }}
              />
            );
          })}
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          {hovered ? (
            <>
              <span className="font-display text-xl font-bold text-ink">{distribution.find(d => d.type === hovered)?.count}</span>
              <span className="text-[9px] text-ink-3 font-body">{distribution.find(d => d.type === hovered)?.label}</span>
            </>
          ) : (
            <>
              <span className="font-display text-xl font-bold text-ink">{products.length}</span>
              <span className="text-[9px] text-ink-3 font-body">Produits</span>
            </>
          )}
        </div>
      </div>
      <div className="flex flex-col gap-2">
        {distribution.map(d => (
          <div
            key={d.type}
            className="flex items-center gap-2 cursor-pointer group"
            onMouseEnter={() => setHovered(d.type)}
            onMouseLeave={() => setHovered(null)}
          >
            <span className="w-2.5 h-2.5 rounded-full shrink-0 transition-transform group-hover:scale-125" style={{ backgroundColor: d.color }} />
            <span className="text-[11px] text-ink-3 font-body group-hover:text-ink transition-colors">
              {d.label}
              <span className="font-semibold text-ink-2 ml-1.5">{d.count}</span>
              <span className="text-ink-4 ml-1">({d.pct.toFixed(0)}%)</span>
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Collection Curve Component ──────────────────────────────────────────────

function CollectionCurve({ commitments }: { commitments: any[] }) {
  const data = useMemo(() => {
    if (!commitments?.length) return [];
    const sorted = [...commitments].sort((a: any, b: any) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
    let cumulative = 0;
    const points = sorted.map((c: any) => {
      cumulative += c.amount ?? 0;
      return { date: new Date(c.createdAt), amount: cumulative };
    });
    return points;
  }, [commitments]);

  if (data.length < 2) return null;

  const maxAmount = data[data.length - 1]!.amount;
  const minDate = data[0]!.date.getTime();
  const maxDate = data[data.length - 1]!.date.getTime();
  const dateRange = maxDate - minDate || 1;

  const w = 400;
  const h = 120;
  const padX = 40;
  const padY = 10;

  const points = data.map((d) => {
    const x = padX + ((d.date.getTime() - minDate) / dateRange) * (w - padX * 2);
    const y = h - padY - ((d.amount / (maxAmount || 1)) * (h - padY * 2));
    return { x, y, amount: d.amount, date: d.date };
  });

  const pathD = points.map((p, i) => (i === 0 ? 'M' : 'L') + p.x + ',' + p.y).join(' ');
  const areaD = pathD + ' L' + points[points.length - 1]!.x + ',' + (h - padY) + ' L' + points[0]!.x + ',' + (h - padY) + ' Z';

  return (
    <div className="w-full">
      <svg viewBox={'0 0 ' + w + ' ' + h} className="w-full h-auto">
        <defs>
          <linearGradient id="curve-grad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#3B1FA8" stopOpacity="0.2" />
            <stop offset="100%" stopColor="#3B1FA8" stopOpacity="0" />
          </linearGradient>
        </defs>
        <path d={areaD} fill="url(#curve-grad)" />
        <path d={pathD} fill="none" stroke="#3B1FA8" strokeWidth="2" strokeLinejoin="round" />
        {points.map((p, i) => (
          <circle key={i} cx={p.x} cy={p.y} r="3" fill="#3B1FA8" stroke="white" strokeWidth="1.5" />
        ))}
        {/* Y-axis labels */}
        <text x={padX - 4} y={padY + 4} textAnchor="end" className="fill-ink-3" fontSize="8" fontFamily="DM Mono">{(maxAmount / 1e6).toFixed(1)}M</text>
        <text x={padX - 4} y={h - padY + 4} textAnchor="end" className="fill-ink-3" fontSize="8" fontFamily="DM Mono">0</text>
      </svg>
    </div>
  );
}
