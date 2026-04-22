'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  TrendingUp,
  RefreshCw,
  Loader2,
  Sparkles,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
  Wallet,
  Search,
  Briefcase,
  DollarSign,
} from 'lucide-react';
import { cn } from '@/lib/cn';
import { PageHeader } from '@/components/ui/page-header';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useSecondaryPricingStore, type LiquidityTier } from '@/stores/secondary-pricing-store';
import {
  opportunityTypeLabel,
  opportunityTypeColor,
  type OpportunityType,
} from '@/lib/secondary/opportunity-scorer';
import { DEMO_PRODUCTS } from '@/lib/demo-data';
import { useMyCommitments } from '@/hooks/use-commitments';
import { SellBeforeMaturityModal } from '@/components/portfolio/SellBeforeMaturityModal';

// ─── Helpers ────────────────────────────────────────────────────────────────

function fmtPct(v: number, digits = 2) {
  return `${v.toFixed(digits)}%`;
}

function fmtBps(bps: number) {
  return `${bps.toFixed(0)}bps`;
}

function fmtTimeAgo(iso: string) {
  const diffMs = Date.now() - new Date(iso).getTime();
  const minutes = Math.floor(diffMs / 60_000);
  if (minutes < 1) return 'à l\u2019instant';
  if (minutes < 60) return `il y a ${minutes} min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `il y a ${hours}h`;
  const days = Math.floor(hours / 24);
  return `il y a ${days}j`;
}

const LIQUIDITY_COLOR: Record<LiquidityTier, { bg: string; text: string; border: string; variant: 'teal' | 'gold' | 'muted' | 'red' }> = {
  Excellent: { bg: 'bg-[#D6F7EF]', text: 'text-[#007A63]', border: 'border-[#A3EDD9]', variant: 'teal' },
  Bon: { bg: 'bg-[#FDF3D6]', text: 'text-[#9B7210]', border: 'border-[#F0D98A]', variant: 'gold' },
  Moyen: { bg: 'bg-[#FFE9D6]', text: 'text-[#B85A00]', border: 'border-[#F3C59A]', variant: 'muted' },
  Faible: { bg: 'bg-[#FDE8EB]', text: 'text-red', border: 'border-[#F8B4BC]', variant: 'red' },
};

// ─── Page ───────────────────────────────────────────────────────────────────

type Tab = 'all' | 'opportunities' | 'my-positions';

export default function SecondaireMarketPage() {
  useEffect(() => {
    document.title = "Marché secondaire | Strick'in";
  }, []);

  const quotes = useSecondaryPricingStore((s) => s.quotes);
  const opportunities = useSecondaryPricingStore((s) => s.opportunities);
  const lastSync = useSecondaryPricingStore((s) => s.lastSync);
  const isSyncing = useSecondaryPricingStore((s) => s.isSyncing);
  const syncQuotes = useSecondaryPricingStore((s) => s.syncQuotes);

  const { data: commitmentsData } = useMyCommitments();
  const commitments = useMemo(() => {
    const list = (commitmentsData as unknown) as Array<{ shelfId?: string; productId?: string; productName?: string; amount?: number; status?: string; id?: string }> | undefined;
    return Array.isArray(list) ? list : [];
  }, [commitmentsData]);

  const productMap = useMemo(() => new Map(DEMO_PRODUCTS.map((p) => [p.id, p])), []);

  const [tab, setTab] = useState<Tab>('all');
  const [search, setSearch] = useState('');
  const [sellTarget, setSellTarget] = useState<{ productId: string; commitmentId: string | null; amount: number } | null>(null);

  const quotesList = useMemo(() => Object.values(quotes), [quotes]);

  const avgSpread = useMemo(() => {
    if (quotesList.length === 0) return 0;
    return quotesList.reduce((sum, q) => sum + q.spread, 0) / quotesList.length;
  }, [quotesList]);

  const filteredAll = useMemo(() => {
    const term = search.trim().toLowerCase();
    const rows = DEMO_PRODUCTS.map((product) => ({ product, quote: quotes[product.id] }))
      .filter((row): row is { product: (typeof DEMO_PRODUCTS)[number]; quote: NonNullable<(typeof quotes)[string]> } => Boolean(row.quote));
    if (!term) return rows;
    return rows.filter(({ product }) =>
      `${product.name} ${product.isin} ${product.issuerName}`.toLowerCase().includes(term),
    );
  }, [quotes, search]);

  const topOpportunities = useMemo(() => opportunities.slice(0, 20), [opportunities]);

  const myCommitments = useMemo(() => {
    return commitments
      .map((c) => {
        const product = productMap.get(c.shelfId ?? '') ?? productMap.get(c.productId ?? '');
        if (!product) return null;
        const quote = quotes[product.id];
        if (!quote) return null;
        return { commitment: c, product, quote };
      })
      .filter((r): r is { commitment: (typeof commitments)[number]; product: (typeof DEMO_PRODUCTS)[number]; quote: NonNullable<(typeof quotes)[string]> } => r !== null);
  }, [commitments, productMap, quotes]);

  const handleSync = async () => {
    await syncQuotes();
  };

  return (
    <div className="animate-fade-in min-h-screen">
      <PageHeader
        icon={TrendingUp}
        title="Marché secondaire"
        subtitle="Valorisations liquides, opportunités et revente anticipée"
        accentFrom="#3B1FA8"
        accentTo="#5B3FD4"
      >
        <button
          onClick={handleSync}
          disabled={isSyncing}
          className={cn(
            'h-10 px-5 rounded-xl font-body text-[13px] font-semibold inline-flex items-center gap-2',
            'bg-gradient-to-r from-[#3B1FA8] to-[#5B3FD4] text-white shadow-md shadow-violet/20',
            'hover:shadow-lg hover:shadow-violet/30 hover:scale-[1.02] active:scale-[0.98] transition-all duration-200',
            'disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100',
          )}
        >
          {isSyncing ? <Loader2 size={14} className="animate-spin" /> : <RefreshCw size={14} />}
          {isSyncing ? 'Synchronisation' : 'Synchroniser'}
        </button>
      </PageHeader>

      {/* ── Stats ─────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-6">
        <StatCard
          icon={<DollarSign size={18} className="text-[#3B1FA8]" />}
          label="Cotations disponibles"
          value={quotesList.length.toString()}
          hint={`Dernière sync ${fmtTimeAgo(lastSync)}`}
          accent="#3B1FA8"
        />
        <StatCard
          icon={<TrendingUp size={18} className="text-[#007A63]" />}
          label="Spread moyen"
          value={fmtBps(avgSpread)}
          hint="bid/ask pondéré"
          accent="#007A63"
        />
        <StatCard
          icon={<Sparkles size={18} className="text-[#D4A017]" />}
          label="Opportunités détectées"
          value={opportunities.length.toString()}
          hint={opportunities.length > 0 ? `top ${Math.min(opportunities.length, 20)} classées` : '—'}
          accent="#D4A017"
        />
      </div>

      {/* ── Tabs ──────────────────────────────────────────────────────────── */}
      <div className="flex gap-1 mb-6 bg-white/60 dark:bg-white/5 backdrop-blur-sm p-1 rounded-xl border border-border/60 w-fit">
        {[
          { key: 'all' as const, label: 'Toutes les cotations', icon: DollarSign, count: filteredAll.length },
          { key: 'opportunities' as const, label: 'Top opportunités', icon: Sparkles, count: topOpportunities.length },
          { key: 'my-positions' as const, label: 'Mes positions', icon: Briefcase, count: myCommitments.length },
        ].map((t) => {
          const Icon = t.icon;
          return (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={cn(
                'relative inline-flex items-center gap-1.5 px-4 py-2 rounded-lg',
                'font-body text-[13px] font-semibold transition-all duration-200',
                tab === t.key
                  ? 'bg-gradient-to-r from-[#3B1FA8] to-[#5B3FD4] text-white shadow-md shadow-violet/20'
                  : 'text-ink-3 hover:text-ink hover:bg-white/80 dark:hover:bg-white/10',
              )}
            >
              <Icon size={13} />
              {t.label}
              <span
                className={cn(
                  'ml-1 px-1.5 py-0.5 rounded-full text-[10px] font-bold',
                  tab === t.key ? 'bg-white/20 text-white' : 'bg-surface-2 text-ink-3',
                )}
              >
                {t.count}
              </span>
            </button>
          );
        })}
      </div>

      {/* ── Content ───────────────────────────────────────────────────────── */}
      {tab === 'all' && (
        <AllQuotesPanel
          rows={filteredAll}
          search={search}
          onSearchChange={setSearch}
          onSell={(productId, amount) =>
            setSellTarget({ productId, commitmentId: null, amount })
          }
        />
      )}

      {tab === 'opportunities' && <OpportunitiesPanel />}

      {tab === 'my-positions' && (
        <MyPositionsPanel
          rows={myCommitments}
          onSell={(productId, commitmentId, amount) =>
            setSellTarget({ productId, commitmentId, amount })
          }
        />
      )}

      {sellTarget && (
        <SellBeforeMaturityModal
          isOpen
          onClose={() => setSellTarget(null)}
          productId={sellTarget.productId}
          holdingAmount={sellTarget.amount}
        />
      )}
    </div>
  );
}

// ─── Panels ─────────────────────────────────────────────────────────────────

function AllQuotesPanel({
  rows,
  search,
  onSearchChange,
  onSell,
}: {
  rows: Array<{ product: (typeof DEMO_PRODUCTS)[number]; quote: NonNullable<ReturnType<typeof useSecondaryPricingStore.getState>['quotes'][string]> }>;
  search: string;
  onSearchChange: (v: string) => void;
  onSell: (productId: string, amount: number) => void;
}) {
  return (
    <div className="space-y-3">
      <div className="relative bg-white/90 dark:bg-white/5 backdrop-blur-md rounded-xl border border-border/60 ring-1 ring-black/[0.03] p-3 shadow-sm flex items-center gap-2">
        <Search size={14} className="text-ink-3 ml-1" />
        <input
          type="search"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Rechercher par nom, ISIN ou émetteur"
          className="premium-input flex-1 border-0 shadow-none bg-transparent"
          aria-label="Rechercher un produit"
        />
      </div>

      <div className="bg-white/90 dark:bg-white/5 backdrop-blur-md rounded-xl border border-border/60 ring-1 ring-black/[0.03] overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-[12px] font-body">
            <thead className="bg-surface-2/40 text-[10px] uppercase tracking-[0.15em] font-bold text-ink-3">
              <tr>
                <th className="px-4 py-3">Produit</th>
                <th className="px-4 py-3">Émetteur</th>
                <th className="px-4 py-3 text-right">Bid</th>
                <th className="px-4 py-3 text-right">Ask</th>
                <th className="px-4 py-3 text-right">Spread</th>
                <th className="px-4 py-3 text-right">24h</th>
                <th className="px-4 py-3 text-right">YTM</th>
                <th className="px-4 py-3">Liquidité</th>
                <th className="px-4 py-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/30">
              {rows.map(({ product, quote }) => {
                const liqColor = LIQUIDITY_COLOR[quote.liquidity];
                const trendIcon = quote.change24h > 0.05 ? ArrowUpRight : quote.change24h < -0.05 ? ArrowDownRight : Minus;
                const trendColor = quote.change24h > 0.05 ? '#00B894' : quote.change24h < -0.05 ? '#E8334A' : '#7B6FA0';
                const TrendIcon = trendIcon;

                return (
                  <tr key={product.id} className="hover:bg-[#3B1FA8]/[0.02] transition-colors">
                    <td className="px-4 py-3">
                      <div className="font-semibold text-ink">{product.name}</div>
                      <div className="font-mono text-[10px] text-ink-3">{product.isin}</div>
                    </td>
                    <td className="px-4 py-3 text-ink-2">{product.issuerName}</td>
                    <td className="px-4 py-3 text-right font-mono font-semibold text-ink">
                      {quote.bid.toFixed(2)}
                    </td>
                    <td className="px-4 py-3 text-right font-mono font-semibold text-ink">
                      {quote.ask.toFixed(2)}
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-ink-2">{fmtBps(quote.spread)}</td>
                    <td className="px-4 py-3 text-right">
                      <span
                        className="inline-flex items-center gap-0.5 font-semibold font-mono"
                        style={{ color: trendColor }}
                      >
                        <TrendIcon size={12} />
                        {quote.change24h > 0 ? '+' : ''}
                        {quote.change24h.toFixed(2)}%
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right font-mono font-semibold text-[#007A63]">
                      {fmtPct(quote.yieldToMaturity)}
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={liqColor.variant} size="sm">
                        {quote.liquidity}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => onSell(product.id, 100_000)}
                      >
                        Simuler revente
                      </Button>
                    </td>
                  </tr>
                );
              })}
              {rows.length === 0 && (
                <tr>
                  <td colSpan={9} className="px-4 py-10 text-center text-ink-3">
                    Aucun résultat.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function OpportunitiesPanel() {
  const opportunities = useSecondaryPricingStore((s) => s.opportunities);
  const quotes = useSecondaryPricingStore((s) => s.quotes);
  const productMap = useMemo(() => new Map(DEMO_PRODUCTS.map((p) => [p.id, p])), []);
  const top = opportunities.slice(0, 20);

  if (top.length === 0) {
    return (
      <div className="bg-white/90 dark:bg-white/5 backdrop-blur-md rounded-xl border border-dashed border-border/60 p-10 text-center">
        <Sparkles size={32} className="text-ink-3/40 mx-auto mb-2" />
        <p className="text-ink-3 font-body text-sm">Aucune opportunité détectée pour le moment.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
      {top.map((opp, idx) => {
        const product = productMap.get(opp.productId);
        const quote = quotes[opp.productId];
        if (!product || !quote) return null;
        const color = opportunityTypeColor(opp.type);

        return (
          <div
            key={`${opp.productId}-${opp.type}`}
            className="relative bg-white/90 dark:bg-white/5 backdrop-blur-md rounded-xl border border-border/60 ring-1 ring-black/[0.03] overflow-hidden p-5 shadow-sm hover:shadow-md transition-all"
          >
            <div
              className="absolute top-0 left-0 right-0 h-[3px] rounded-b-full"
              style={{ background: `linear-gradient(90deg, ${color}, ${color}60)` }}
            />
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center font-display font-bold text-[11px] text-white shadow"
                  style={{ background: color }}
                >
                  #{idx + 1}
                </div>
                <div>
                  <div className="font-body text-[13px] font-semibold text-ink">{product.name}</div>
                  <div className="font-mono text-[10px] text-ink-3">{product.isin}</div>
                </div>
              </div>
              <div className="text-right">
                <div className="font-display text-xl font-bold text-ink">{opp.score.toFixed(0)}</div>
                <div className="text-[10px] uppercase tracking-wider font-bold text-ink-3">Score</div>
              </div>
            </div>
            <div className="flex items-center gap-2 mb-3">
              <span
                className="text-[10px] uppercase tracking-wider font-bold px-2 py-0.5 rounded-full border"
                style={{
                  background: `${color}15`,
                  color,
                  borderColor: `${color}40`,
                }}
              >
                {opportunityTypeLabel(opp.type)}
              </span>
              <span className="text-[10px] font-body text-ink-3">
                Bid {quote.bid.toFixed(2)} · YTM {fmtPct(quote.yieldToMaturity)}
              </span>
            </div>
            <p className="text-[12px] font-body text-ink-2 leading-relaxed">{opp.reason}</p>
          </div>
        );
      })}
    </div>
  );
}

function MyPositionsPanel({
  rows,
  onSell,
}: {
  rows: Array<{
    commitment: { id?: string; amount?: number; status?: string; productName?: string };
    product: (typeof DEMO_PRODUCTS)[number];
    quote: NonNullable<ReturnType<typeof useSecondaryPricingStore.getState>['quotes'][string]>;
  }>;
  onSell: (productId: string, commitmentId: string | null, amount: number) => void;
}) {
  if (rows.length === 0) {
    return (
      <div className="bg-white/90 dark:bg-white/5 backdrop-blur-md rounded-xl border border-dashed border-border/60 p-10 text-center">
        <Briefcase size={32} className="text-ink-3/40 mx-auto mb-2" />
        <p className="text-ink-3 font-body text-sm">Aucune position dans votre portefeuille.</p>
        <Link
          href="/portfolio"
          className="inline-flex items-center gap-1 mt-3 text-[12px] font-semibold text-violet hover:text-violet-dark"
        >
          Voir le portefeuille
          <ArrowUpRight size={12} />
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {rows.map(({ commitment, product, quote }) => {
        const liqColor = LIQUIDITY_COLOR[quote.liquidity];
        const amount = commitment.amount ?? 0;
        const estValue = amount * (quote.bid / 100);
        const pnl = estValue - amount;

        return (
          <div
            key={commitment.id ?? product.id}
            className="bg-white/90 dark:bg-white/5 backdrop-blur-md rounded-xl border border-border/60 ring-1 ring-black/[0.03] p-5 shadow-sm flex items-center gap-5"
          >
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#3B1FA8]/10 to-[#5B3FD4]/5 flex items-center justify-center shrink-0">
              <Wallet size={18} className="text-[#3B1FA8]" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="font-body text-[13px] font-semibold text-ink truncate">{product.name}</div>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="font-mono text-[10px] text-ink-3">{product.isin}</span>
                <Badge variant={liqColor.variant} size="sm">
                  {quote.liquidity}
                </Badge>
              </div>
            </div>
            <div className="text-right">
              <div className="text-[10px] uppercase font-bold text-ink-3 tracking-wider">Détenu</div>
              <div className="font-mono text-[13px] font-semibold text-ink">
                {new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(amount)}
              </div>
            </div>
            <div className="text-right">
              <div className="text-[10px] uppercase font-bold text-ink-3 tracking-wider">Bid/Ask</div>
              <div className="font-mono text-[13px] font-semibold text-ink">
                {quote.bid.toFixed(2)} / {quote.ask.toFixed(2)}
              </div>
            </div>
            <div className="text-right">
              <div className="text-[10px] uppercase font-bold text-ink-3 tracking-wider">P&L estimé</div>
              <div
                className={cn(
                  'font-mono text-[13px] font-semibold',
                  pnl >= 0 ? 'text-[#007A63]' : 'text-red',
                )}
              >
                {pnl >= 0 ? '+' : ''}
                {new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(pnl)}
              </div>
            </div>
            <Button
              variant="primary"
              size="sm"
              onClick={() => onSell(product.id, commitment.id ?? null, amount)}
            >
              Vendre anticipé
            </Button>
          </div>
        );
      })}
    </div>
  );
}

// ─── Shared ─────────────────────────────────────────────────────────────────

function StatCard({
  icon,
  label,
  value,
  hint,
  accent,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  hint: string;
  accent: string;
}) {
  return (
    <div className="relative bg-white/90 dark:bg-white/5 backdrop-blur-md rounded-xl border border-border/60 ring-1 ring-black/[0.03] overflow-hidden p-4 shadow-sm">
      <div
        className="absolute top-0 left-0 right-0 h-[2px] rounded-b-full"
        style={{ background: `linear-gradient(90deg, ${accent}, ${accent}60)` }}
      />
      <div className="flex items-center gap-3">
        <div
          className="w-10 h-10 rounded-lg flex items-center justify-center"
          style={{ background: `${accent}10` }}
        >
          {icon}
        </div>
        <div>
          <div className="text-[10px] uppercase tracking-wider font-bold text-ink-3">{label}</div>
          <div className="font-display text-xl font-bold text-ink">{value}</div>
          <div className="text-[10px] font-body text-ink-3">{hint}</div>
        </div>
      </div>
    </div>
  );
}
