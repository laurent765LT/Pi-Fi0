'use client';

import { useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  Users,
  FileText,
  Layers,
  TrendingUp,
  Calendar,
  Mail,
  Phone,
  Activity,
  Heart,
} from 'lucide-react';
import { cn } from '@/lib/cn';
import { PageHeader } from '@/components/ui/page-header';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabPanel } from '@/components/ui/tabs';
import { EmptyState } from '@/components/ui/empty-state';
import { ConsolidatedView } from '@/components/clients/ConsolidatedView';
import { ByContractView } from '@/components/clients/ByContractView';
import { PerformanceAttribution } from '@/components/clients/PerformanceAttribution';
import { ConsolidatedTimeline } from '@/components/clients/ConsolidatedTimeline';
import { useConsolidatedClientsStore } from '@/stores/clients-consolidated-store';
import {
  aggregateClientPortfolio,
  getClientEvents,
  getClientHealthScore,
} from '@/lib/portfolio/aggregation-engine';
import { generatePortfolioReport } from '@/lib/portfolio-pdf';
import { DEMO_PRODUCTS } from '@/lib/demo-data';

type ClientTab = 'consolidated' | 'contracts' | 'attribution' | 'timeline';

function formatAmount(amount: number): string {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
    maximumFractionDigits: 0,
  }).format(amount);
}

function getInitials(first: string, last: string): string {
  return ((first[0] ?? '') + (last[0] ?? '')).toUpperCase() || 'CL';
}

// ─── Health score gauge ─────────────────────────────────────────────────────

function HealthScoreBadge({ score }: { score: number }) {
  const color = score >= 75 ? '#00B894' : score >= 50 ? '#D4A017' : '#E8334A';
  const label =
    score >= 75 ? 'Excellent' : score >= 50 ? 'Satisfaisant' : 'À surveiller';

  // Circle gauge
  const r = 28;
  const c = 2 * Math.PI * r;
  const offset = c - (score / 100) * c;

  return (
    <div className="flex items-center gap-3">
      <div className="relative shrink-0" aria-hidden>
        <svg width={72} height={72} viewBox="0 0 72 72">
          <circle
            cx={36}
            cy={36}
            r={r}
            fill="none"
            stroke="currentColor"
            strokeOpacity={0.12}
            strokeWidth={6}
          />
          <circle
            cx={36}
            cy={36}
            r={r}
            fill="none"
            stroke={color}
            strokeWidth={6}
            strokeLinecap="round"
            strokeDasharray={c}
            strokeDashoffset={offset}
            transform="rotate(-90 36 36)"
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span
            className="font-display font-extrabold text-[18px] tabular-nums"
            style={{ color }}
          >
            {score}
          </span>
        </div>
      </div>
      <div>
        <p className="text-[10px] uppercase tracking-[0.16em] text-ink-3 font-bold">
          Health score IA
        </p>
        <p className="font-display text-[14px] font-bold" style={{ color }}>
          {label}
        </p>
        <p className="text-[10.5px] text-ink-3">
          Diversification, risque &amp; concentration
        </p>
      </div>
    </div>
  );
}

// ─── Page ───────────────────────────────────────────────────────────────────

export default function ClientDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const clientId = params?.id ?? '';
  const client = useConsolidatedClientsStore((s) => s.getById(clientId));
  const [tab, setTab] = useState<ClientTab>('consolidated');

  const aggregate = useMemo(
    () => (clientId ? aggregateClientPortfolio(clientId) : null),
    [clientId, client],
  );
  const events = useMemo(
    () => (clientId ? getClientEvents(clientId) : []),
    [clientId, client],
  );
  const healthScore = useMemo(
    () => (clientId ? getClientHealthScore(clientId) : 0),
    [clientId, client],
  );

  if (!client || !aggregate) {
    return (
      <div className="max-w-[720px] mx-auto pt-8">
        <EmptyState
          icon={Users}
          title="Client introuvable"
          description="Ce client n'existe pas ou a été supprimé."
          actionLabel="Retour à la liste"
          actionHref="/clients"
        />
      </div>
    );
  }

  const upcomingNext = events.slice(0, 1)[0];

  // ── Consolidated PDF export ──────────────────────────────────────────────
  const handleExportPdf = () => {
    // Build synthetic commitments matching the portfolio-pdf input shape.
    const syntheticCommitments = aggregate.products.map((p) => ({
      id: `${p.contractId}-${p.productId}`,
      shelfId: p.productId,
      productId: p.productId,
      productName: p.product?.name ?? p.productId,
      isin: p.product?.isin ?? '',
      amount: p.amount,
      status: 'CONFIRMED',
      createdAt: client.createdAt,
    }));

    const stats = {
      total: aggregate.totalExposure,
      confirmed: aggregate.productsCount,
      waiting: 0,
      cancelled: 0,
    };

    const analytics = {
      totalValue: aggregate.totalExposure,
      avgCoupon: aggregate.avgCoupon,
      nextEvent: upcomingNext?.date ?? null,
      avgSri: aggregate.avgSri,
      closestBarrier: null,
      shortestMaturity:
        aggregate.products
          .map((p) => p.product?.maturityDate)
          .filter((d): d is string => !!d)
          .sort()[0] ?? null,
      longestMaturity:
        aggregate.products
          .map((p) => p.product?.maturityDate)
          .filter((d): d is string => !!d)
          .sort()
          .pop() ?? null,
    };

    const html = generatePortfolioReport({
      commitments: syntheticCommitments,
      products: DEMO_PRODUCTS as unknown as Array<Record<string, unknown>>,
      user: {
        firstName: client.firstName,
        lastName: client.lastName,
        email: client.email,
        company: `${aggregate.contractsCount} contrats consolidés`,
      },
      stats,
      analytics,
    });
    const win = window.open('', '_blank');
    if (win) {
      win.document.open();
      win.document.write(html);
      win.document.close();
    }
  };

  const tabs = [
    { value: 'consolidated', label: 'Vue consolidée', icon: <Layers size={14} /> },
    { value: 'contracts', label: 'Par contrat', icon: <FileText size={14} /> },
    {
      value: 'attribution',
      label: 'Attribution performance',
      icon: <TrendingUp size={14} />,
    },
    { value: 'timeline', label: 'Timeline', icon: <Calendar size={14} /> },
  ];

  return (
    <div className="max-w-[1180px] mx-auto animate-fade-in">
      {/* Back link */}
      <button
        type="button"
        onClick={() => router.push('/clients')}
        className={cn(
          'inline-flex items-center gap-1 mb-3',
          'text-[12px] font-semibold text-ink-3 hover:text-violet',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet rounded',
          'transition-colors duration-150',
        )}
      >
        <ArrowLeft size={14} />
        Retour aux clients
      </button>

      <PageHeader
        icon={Users}
        title={`${client.firstName} ${client.lastName}`}
        subtitle={client.email}
      >
        <Button variant="outline" onClick={handleExportPdf}>
          <FileText size={14} />
          Rapport consolidé
        </Button>
      </PageHeader>

      {/* Identity + health */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
        <div className="lg:col-span-2 rounded-xl border border-border bg-white dark:bg-white/[0.03] p-5 flex items-center gap-4">
          <div
            className="w-16 h-16 rounded-full flex items-center justify-center shrink-0 text-white"
            style={{
              background: 'linear-gradient(135deg, #3B1FA8 0%, #5535C4 100%)',
            }}
          >
            <span className="font-display font-extrabold text-[20px] leading-none">
              {getInitials(client.firstName, client.lastName)}
            </span>
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="font-display text-[20px] font-extrabold text-ink dark:text-white leading-tight">
              {client.firstName} {client.lastName}
            </h2>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1 text-[12px] text-ink-3">
              <span className="inline-flex items-center gap-1">
                <Mail size={11} aria-hidden />
                {client.email}
              </span>
              {client.phone && (
                <span className="inline-flex items-center gap-1">
                  <Phone size={11} aria-hidden />
                  {client.phone}
                </span>
              )}
            </div>
            <div className="flex flex-wrap gap-1.5 mt-2">
              <Badge variant="violet" size="sm">
                {aggregate.contractsCount} contrat
                {aggregate.contractsCount > 1 ? 's' : ''}
              </Badge>
              <Badge variant="teal" size="sm">
                {aggregate.productsCount} produits
              </Badge>
              <Badge variant="gold" size="sm">
                {formatAmount(aggregate.totalExposure)}
              </Badge>
            </div>
          </div>
        </div>
        <div className="rounded-xl border border-border bg-white dark:bg-white/[0.03] p-5 flex items-center justify-between gap-2">
          <HealthScoreBadge score={healthScore} />
          <Heart
            size={22}
            className={cn(
              healthScore >= 75
                ? 'text-teal'
                : healthScore >= 50
                  ? 'text-gold'
                  : 'text-red',
            )}
            aria-hidden
          />
        </div>
      </section>

      {/* Tabs */}
      <div className="mb-4">
        <Tabs
          tabs={tabs}
          activeTab={tab}
          onChange={(v) => setTab(v as ClientTab)}
        />
      </div>

      <TabPanel value="consolidated" activeTab={tab}>
        <ConsolidatedView aggregate={aggregate} />
      </TabPanel>
      <TabPanel value="contracts" activeTab={tab}>
        <ByContractView aggregate={aggregate} />
      </TabPanel>
      <TabPanel value="attribution" activeTab={tab}>
        <PerformanceAttribution aggregate={aggregate} />
      </TabPanel>
      <TabPanel value="timeline" activeTab={tab}>
        <div className="flex items-center gap-2 mb-4">
          <Activity size={14} className="text-violet" />
          <h3 className="font-display font-bold text-[15px] text-ink dark:text-white">
            Événements à venir (toutes enveloppes)
          </h3>
          <span className="ml-auto text-[11px] text-ink-3 tabular-nums">
            {events.length} événement{events.length > 1 ? 's' : ''}
          </span>
        </div>
        <ConsolidatedTimeline events={events} limit={40} />
      </TabPanel>
    </div>
  );
}
