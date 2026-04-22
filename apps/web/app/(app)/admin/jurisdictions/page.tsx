'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import {
  Globe,
  Users,
  Package,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  MinusCircle,
} from 'lucide-react';
import { cn } from '@/lib/cn';
import {
  JURISDICTIONS,
  JURISDICTION_CONFIGS,
  getAvailableProducts,
  type Jurisdiction,
} from '@/lib/regulatory/jurisdiction-rules';
import { useProducts } from '@/hooks/use-products';
import type { Product } from '@/components/products/product-card';

// ─── Mock per-jurisdiction user counts ──────────────────────────────────────
//
// Until the backend exposes a `/admin/jurisdictions/stats` endpoint, we
// surface a realistic mock distribution so the page is visually complete.

const USER_DISTRIBUTION: Record<Jurisdiction, number> = {
  FR: 142,
  LU: 37,
  BE: 21,
  CH: 12,
};

type ComplianceStatus = 'ok' | 'warn' | 'pending';

const COMPLIANCE_STATUS: Record<Jurisdiction, ComplianceStatus> = {
  FR: 'ok',
  LU: 'ok',
  BE: 'warn',
  CH: 'pending',
};

const STATUS_CONFIG: Record<
  ComplianceStatus,
  { label: string; color: string; bg: string; icon: typeof CheckCircle2 }
> = {
  ok: {
    label: 'Conforme',
    color: '#00B894',
    bg: 'rgba(0,184,148,0.10)',
    icon: CheckCircle2,
  },
  warn: {
    label: 'Attention',
    color: '#D4A017',
    bg: 'rgba(212,160,23,0.12)',
    icon: AlertTriangle,
  },
  pending: {
    label: 'En cours',
    color: '#3D63F5',
    bg: 'rgba(61,99,245,0.10)',
    icon: MinusCircle,
  },
};

// ─── Stat card ──────────────────────────────────────────────────────────────

function JurisdictionStatCard({
  jurisdiction,
  userCount,
  productCount,
}: {
  jurisdiction: Jurisdiction;
  userCount: number;
  productCount: number;
}) {
  const cfg = JURISDICTION_CONFIGS[jurisdiction];
  const status = COMPLIANCE_STATUS[jurisdiction];
  const statusCfg = STATUS_CONFIG[status];
  const StatusIcon = statusCfg.icon;

  return (
    <div className="rounded-xl border border-border/60 bg-white dark:bg-white/5 p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3 min-w-0">
          <span className="text-3xl leading-none" aria-hidden="true">
            {cfg.flag}
          </span>
          <div className="min-w-0">
            <p className="font-display font-bold text-base text-ink dark:text-white leading-tight">
              {cfg.name}
            </p>
            <p className="font-body text-[11px] text-ink-3 mt-0.5">
              {cfg.regulator} &middot; {cfg.currency}
            </p>
          </div>
        </div>

        <span
          className={cn(
            'inline-flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-bold font-body uppercase tracking-wider',
          )}
          style={{ background: statusCfg.bg, color: statusCfg.color }}
        >
          <StatusIcon size={11} strokeWidth={2.2} />
          {statusCfg.label}
        </span>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3">
        <div className="rounded-lg border border-border/30 bg-surface-2/40 dark:bg-white/[0.02] px-3 py-2.5">
          <div className="flex items-center gap-1.5 text-[10px] font-body font-semibold text-ink-3 uppercase tracking-wider">
            <Users size={11} />
            Utilisateurs
          </div>
          <p className="mt-1 font-display text-xl font-bold text-ink dark:text-white leading-none">
            {userCount}
          </p>
        </div>

        <div className="rounded-lg border border-border/30 bg-surface-2/40 dark:bg-white/[0.02] px-3 py-2.5">
          <div className="flex items-center gap-1.5 text-[10px] font-body font-semibold text-ink-3 uppercase tracking-wider">
            <Package size={11} />
            Produits
          </div>
          <p className="mt-1 font-display text-xl font-bold text-ink dark:text-white leading-none">
            {productCount}
          </p>
        </div>
      </div>

      <div className="mt-3 flex flex-wrap gap-1">
        {cfg.requiredDocs.map((doc) => (
          <span
            key={doc}
            className="text-[9px] uppercase tracking-wider font-bold font-body px-1.5 py-0.5 rounded-full bg-[#3B1FA8]/10 text-[#3B1FA8]"
          >
            {doc}
          </span>
        ))}
      </div>
    </div>
  );
}

// ─── Matrix cell ────────────────────────────────────────────────────────────

function MatrixCell({ available }: { available: boolean }) {
  return available ? (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#00B894]/10 text-[#00B894] text-[10px] font-bold font-body uppercase tracking-wider">
      <CheckCircle2 size={10} />
      Oui
    </span>
  ) : (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#E8334A]/10 text-[#E8334A] text-[10px] font-bold font-body uppercase tracking-wider">
      <MinusCircle size={10} />
      Non
    </span>
  );
}

// ─── Page ───────────────────────────────────────────────────────────────────

export default function AdminJurisdictionsPage() {
  const { data: allProducts } = useProducts();
  const products: Product[] = useMemo(
    () => (Array.isArray(allProducts) ? (allProducts as Product[]) : []),
    [allProducts],
  );

  // Per-jurisdiction counts
  const productCounts = useMemo(() => {
    const out: Record<Jurisdiction, number> = { FR: 0, LU: 0, BE: 0, CH: 0 };
    for (const j of JURISDICTIONS) {
      out[j] = getAvailableProducts(j, products).length;
    }
    return out;
  }, [products]);

  // Matrix: availability per payoff type x jurisdiction
  const payoffTypes = useMemo(() => {
    return Array.from(new Set(products.map((p) => p.payoffType))).sort();
  }, [products]);

  return (
    <main className="w-full animate-fade-in">
      {/* Header */}
      <div className="flex items-center gap-3 mb-2">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#3B1FA8] to-[#1A0A3E] flex items-center justify-center shadow-sm shadow-[#3B1FA8]/20">
          <Globe size={20} className="text-white" />
        </div>
        <div>
          <h1 className="font-display text-2xl font-bold leading-tight bg-gradient-to-r from-[#3B1FA8] via-[#1A0A3E] to-[#3B1FA8] bg-clip-text text-transparent dark:from-white dark:via-[#C9BCFF] dark:to-white">
            Juridictions
          </h1>
          <p className="font-body text-sm text-ink-3 mt-0.5">
            Vue multi-pays &mdash; utilisateurs, produits et conformit&eacute; par juridiction
          </p>
        </div>
      </div>
      <div
        className="h-[2px] rounded-full mb-6"
        style={{
          background:
            'linear-gradient(90deg, #3B1FA8, #00B894 40%, #D4A017 70%, transparent)',
        }}
      />

      {/* Per-jurisdiction overview cards */}
      <section aria-label="Vue par juridiction" className="mb-10">
        <h2 className="font-display text-sm font-bold text-ink dark:text-white uppercase tracking-wide mb-4">
          Vue d&apos;ensemble
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
          {JURISDICTIONS.map((j) => (
            <JurisdictionStatCard
              key={j}
              jurisdiction={j}
              userCount={USER_DISTRIBUTION[j]}
              productCount={productCounts[j]}
            />
          ))}
        </div>
      </section>

      {/* Products-per-jurisdiction matrix */}
      <section aria-label="Matrice des produits disponibles" className="mb-10">
        <h2 className="font-display text-sm font-bold text-ink dark:text-white uppercase tracking-wide mb-4">
          Disponibilit&eacute; des produits
        </h2>
        <div className="rounded-xl border border-border/60 bg-white dark:bg-white/5 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm font-body">
              <thead>
                <tr className="bg-surface-2/60 dark:bg-white/[0.03] border-b border-border/50">
                  <th className="text-left px-4 py-3 font-semibold text-ink-3 text-[11px] uppercase tracking-wider">
                    Type de produit
                  </th>
                  {JURISDICTIONS.map((j) => {
                    const cfg = JURISDICTION_CONFIGS[j];
                    return (
                      <th
                        key={j}
                        className="px-4 py-3 text-left font-semibold text-ink-3 text-[11px] uppercase tracking-wider"
                      >
                        <span className="inline-flex items-center gap-1.5">
                          <span aria-hidden="true">{cfg.flag}</span>
                          {cfg.name}
                        </span>
                      </th>
                    );
                  })}
                </tr>
              </thead>
              <tbody>
                {payoffTypes.length === 0 ? (
                  <tr>
                    <td
                      colSpan={1 + JURISDICTIONS.length}
                      className="px-4 py-6 text-center text-ink-3 text-[12px]"
                    >
                      Aucun produit disponible.
                    </td>
                  </tr>
                ) : (
                  payoffTypes.map((payoff) => {
                    const byJurisdiction: Record<Jurisdiction, boolean> = {
                      FR: false,
                      LU: false,
                      BE: false,
                      CH: false,
                    };
                    for (const j of JURISDICTIONS) {
                      const available = getAvailableProducts(
                        j,
                        products.filter((p) => p.payoffType === payoff),
                      );
                      byJurisdiction[j] = available.length > 0;
                    }
                    return (
                      <tr
                        key={payoff}
                        className="border-b border-border/30 last:border-0 hover:bg-surface-2/30 dark:hover:bg-white/[0.02] transition-colors"
                      >
                        <td className="px-4 py-3 font-semibold text-ink dark:text-white text-[12px]">
                          {payoff.replace(/_/g, ' ')}
                        </td>
                        {JURISDICTIONS.map((j) => (
                          <td key={j} className="px-4 py-3">
                            <MatrixCell available={byJurisdiction[j]} />
                          </td>
                        ))}
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Compliance section */}
      <section aria-label="Statut de conformit&eacute;" className="mb-10">
        <h2 className="font-display text-sm font-bold text-ink dark:text-white uppercase tracking-wide mb-4">
          Statut de conformit&eacute;
        </h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {JURISDICTIONS.map((j) => {
            const cfg = JURISDICTION_CONFIGS[j];
            const status = COMPLIANCE_STATUS[j];
            const statusCfg = STATUS_CONFIG[status];
            const Icon = statusCfg.icon;
            return (
              <div
                key={j}
                className="rounded-xl border border-border/60 bg-white dark:bg-white/5 p-4 flex items-start gap-4"
              >
                <div
                  className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
                  style={{ background: statusCfg.bg, color: statusCfg.color }}
                >
                  <ShieldCheck size={18} strokeWidth={2} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span aria-hidden="true">{cfg.flag}</span>
                    <p className="font-display font-bold text-sm text-ink dark:text-white">
                      {cfg.name}
                    </p>
                    <span
                      className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[9px] font-bold font-body uppercase tracking-wider"
                      style={{
                        background: statusCfg.bg,
                        color: statusCfg.color,
                      }}
                    >
                      <Icon size={9} />
                      {statusCfg.label}
                    </span>
                  </div>
                  <p className="font-body text-[11px] text-ink-3 mt-1 leading-relaxed">
                    R&eacute;gulateur : <strong>{cfg.regulator}</strong> &middot; Registre :{' '}
                    <strong>{cfg.registryName}</strong>
                  </p>
                  <div className="mt-2 flex flex-wrap gap-1">
                    {cfg.requiredDocs.map((doc) => (
                      <span
                        key={doc}
                        className="text-[9px] uppercase tracking-wider font-bold font-body px-1.5 py-0.5 rounded-full bg-[#3B1FA8]/10 text-[#3B1FA8]"
                      >
                        {doc}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Back to admin */}
      <div className="mt-8">
        <Link
          href="/admin"
          className="inline-flex items-center gap-1.5 text-[12px] font-body font-semibold text-[#3B1FA8] hover:underline"
        >
          &larr; Retour &agrave; l&apos;administration
        </Link>
      </div>
    </main>
  );
}
