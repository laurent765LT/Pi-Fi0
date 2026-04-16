'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { ArrowLeft, Calendar, Shield, Clock, Users, TrendingUp, FileText, ExternalLink, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/cn';
import {
  PRODUITS, ENVELOPPES, ENGAGEMENTS, getProduit, getEnveloppe, getEngagements,
  formatMontant, formatMontantFull, formatDateFR, formatDateShortFR,
  TYPE_LABELS, TYPE_COLORS, SRI_COLORS, STATUT_ENGAGEMENT,
} from '@/lib/mock-data-assureur';

function DetailRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4 py-2.5 border-b border-border/40 last:border-b-0">
      <span className="text-[11px] uppercase tracking-[0.15em] font-semibold font-body shrink-0 text-ink-3 dark:text-ink-4">
        {label}
      </span>
      <span className="text-[13px] font-semibold font-body text-right text-ink dark:text-white">
        {value}
      </span>
    </div>
  );
}

export default function ProduitDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [activeTab, setActiveTab] = useState<'caract' | 'dates' | 'scenarios'>('caract');

  const produit = getProduit(id);
  if (!produit) {
    return (
      <div className="text-center py-24">
        <p className="text-[14px] font-body text-red dark:text-red-light">Produit introuvable.</p>
        <Link href="/assureur/produits" className="text-[13px] font-semibold font-body mt-2 inline-block text-violet dark:text-violet-light hover:opacity-80 transition-opacity">
          Retour au catalogue
        </Link>
      </div>
    );
  }

  const env = getEnveloppe(id);
  const engagements = env ? getEngagements(env.id) : [];
  const typeStyle = TYPE_COLORS[produit.type];
  const sriStyle = SRI_COLORS[produit.sri];
  const maxAmount = env ? env.montantCible * (1 + env.surbookingPct / 100) : 0;
  const fillPct = env ? Math.min(100, (env.montantConfirme / maxAmount) * 100) : 0;
  const daysLeft = env ? Math.ceil((new Date(env.dateCloture).getTime() - Date.now()) / (1000 * 60 * 60 * 24)) : null;

  let barColorClass = 'bg-violet';
  if (env && env.montantConfirme > env.montantCible) barColorClass = 'bg-red';
  else if (fillPct > 85) barColorClass = 'bg-amber-600';
  else if (fillPct > 50) barColorClass = 'bg-cobalt-light';

  const scenarios = [
    { name: 'Stress', pct: -(produit.barrierePct ?? 50), colorClass: 'text-red' },
    { name: 'Défavorable', pct: -((produit.barrierePct ?? 50) * 0.5), colorClass: 'text-amber-600' },
    { name: 'Modéré', pct: produit.couponPct ?? (produit.gainMaxPct ?? 0) * 0.4, colorClass: 'text-gold' },
    { name: 'Favorable', pct: produit.gainMaxPct ?? produit.couponPct ?? 0, colorClass: 'text-teal' },
  ];

  const tabs = [
    { key: 'caract' as const, label: 'Caractéristiques' },
    { key: 'dates' as const, label: "Dates d'observation" },
    { key: 'scenarios' as const, label: 'Scénarios' },
  ];

  return (
    <div>
      {/* Breadcrumb */}
      <Link
        href="/assureur/produits"
        className="inline-flex items-center gap-1.5 text-[13px] font-body mb-5 text-ink-3 dark:text-ink-4 hover:text-ink dark:hover:text-white transition-colors"
      >
        <ArrowLeft size={14} /> Retour au catalogue
      </Link>

      {/* Header */}
      <div className="mb-6">
        <div className="flex flex-wrap items-center gap-2 mb-2">
          <span
            className="inline-flex items-center rounded-sm px-2.5 py-1 text-[11px] font-semibold font-body"
            style={{ background: typeStyle.bg, color: typeStyle.text }}
          >
            {TYPE_LABELS[produit.type]}
          </span>
          <span
            className="inline-flex items-center rounded-sm px-2.5 py-1 text-[11px] font-bold font-mono"
            style={{ background: sriStyle.bg, color: sriStyle.text }}
          >
            SRI {produit.sri} · {sriStyle.label}
          </span>
          <span className="inline-flex items-center rounded-sm px-2.5 py-1 text-[11px] font-semibold font-body bg-teal-light text-teal dark:bg-teal/20 dark:text-teal">
            {produit.status === 'ACTIF' ? 'Actif' : 'Fermé'}
          </span>
        </div>
        <h1 className="text-[28px] font-bold font-display mb-1 text-ink dark:text-white">
          {produit.nom}
        </h1>
        <div className="flex items-center gap-3 text-[13px] font-body text-ink-3 dark:text-ink-4">
          <span className="font-mono text-[12px] px-2 py-0.5 rounded-sm bg-surface-2 dark:bg-white/5">
            {produit.isin}
          </span>
          <span>{produit.emetteur} / {produit.garant}</span>
        </div>
      </div>

      {/* Key metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        {[
          { label: produit.couponPct ? 'Coupon' : 'Gain max', value: produit.couponPct ? `+${produit.couponPct}%/an` : produit.gainMaxPct ? `+${produit.gainMaxPct}%` : '---' },
          { label: 'Barrière', value: produit.barrierePct ? `${produit.barrierePct}%` : 'N/A' },
          { label: 'Rappel', value: produit.rappelPct ? `${produit.rappelPct}%` : 'N/A' },
          { label: 'Maturité', value: new Date(produit.maturite).toLocaleDateString('fr-FR', { month: 'short', year: 'numeric' }) },
        ].map(({ label, value }) => (
          <div
            key={label}
            className="relative group/metric bg-white/90 dark:bg-white/5 backdrop-blur-md rounded-lg p-4 text-center border border-border/60 shadow-xs hover:shadow-sm transition-all duration-200"
          >
            <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-violet/60 to-teal/40 rounded-t-lg opacity-0 group-hover/metric:opacity-100 transition-opacity" />
            <span className="text-[10px] uppercase tracking-[0.15em] font-semibold font-body block mb-1 text-ink-3 dark:text-ink-4">
              {label}
            </span>
            <span className="text-[18px] font-bold font-body text-ink dark:text-white">
              {value}
            </span>
          </div>
        ))}
      </div>

      {/* Two columns */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Main */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          {/* Tabs card */}
          <div className="bg-white/90 dark:bg-white/5 backdrop-blur-md rounded-lg overflow-hidden border border-border/60 shadow-card">
            <div className="flex border-b border-border/60">
              {tabs.map(({ key, label }) => (
                <button
                  key={key}
                  onClick={() => setActiveTab(key)}
                  className={cn(
                    'px-5 py-3 text-[13px] font-medium font-body transition-colors border-b-2',
                    activeTab === key
                      ? 'text-violet dark:text-violet-light border-violet dark:border-violet-light'
                      : 'text-ink-3 dark:text-ink-4 border-transparent hover:text-ink dark:hover:text-white hover:border-border/60'
                  )}
                >
                  {label}
                </button>
              ))}
            </div>

            <div className="p-5">
              {activeTab === 'caract' && (
                <div>
                  <DetailRow label="Emetteur" value={produit.emetteur} />
                  <DetailRow label="Garant" value={produit.garant} />
                  <DetailRow label="Sous-jacent" value={produit.sousJacent} />
                  {produit.barrierePct != null && (
                    <DetailRow label="Barrière capital" value={<span className="text-red">{produit.barrierePct}%</span>} />
                  )}
                  {produit.rappelPct != null && (
                    <DetailRow label="Barrière de rappel" value={`${produit.rappelPct}%`} />
                  )}
                  {produit.couponPct != null && (
                    <DetailRow label="Coupon" value={<span className="text-teal">{produit.couponPct}% p.a.</span>} />
                  )}
                  {produit.gainMaxPct != null && (
                    <DetailRow label="Gain maximum" value={`+${produit.gainMaxPct}%`} />
                  )}
                  {produit.protectionCapitalPct != null && (
                    <DetailRow label="Protection capital" value={`${produit.protectionCapitalPct}%`} />
                  )}
                  <DetailRow label="Maturité" value={formatDateFR(produit.maturite)} />
                  <DetailRow label="Frais d'entrée" value={`${produit.fraisEntree}%`} />
                  <DetailRow
                    label="SRI"
                    value={
                      <span style={{ color: sriStyle.text }}>
                        {produit.sri}/7 ({sriStyle.label})
                      </span>
                    }
                  />
                </div>
              )}

              {activeTab === 'dates' && (
                produit.datesObservation.length > 0 ? (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                    {produit.datesObservation.map((date, i) => {
                      const isPast = new Date(date) < new Date();
                      return (
                        <div
                          key={date}
                          className={cn(
                            'flex items-center gap-2 rounded-md px-3 py-2.5 border border-border/60 transition-all',
                            isPast
                              ? 'bg-surface dark:bg-white/[0.02] opacity-50'
                              : 'bg-violet-ghost dark:bg-violet/10'
                          )}
                        >
                          <Calendar size={12} className={cn(
                            isPast ? 'text-ink-3 dark:text-ink-4' : 'text-violet dark:text-violet-light'
                          )} />
                          <div>
                            <span className={cn(
                              'font-mono text-[12px] font-semibold text-ink dark:text-white',
                              isPast && 'line-through'
                            )}>
                              {formatDateShortFR(date)}
                            </span>
                            <span className="block text-[9px] font-body text-ink-3 dark:text-ink-4">Année {i + 1}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-center py-10 text-[13px] font-body text-ink-3 dark:text-ink-4">
                    Pas de dates d&apos;observation pour ce produit.
                  </p>
                )
              )}

              {activeTab === 'scenarios' && (
                <div>
                  <p className="text-[12px] font-body mb-4 text-ink-3 dark:text-ink-4">
                    Estimation des performances pour un investissement de 10 000 euros.
                  </p>
                  <div className="rounded-md overflow-hidden border border-border/60">
                    <table className="w-full text-[13px] font-body">
                      <thead>
                        <tr className="bg-surface dark:bg-white/[0.03] border-b border-border/60">
                          <th className="px-4 py-2.5 text-left text-[10px] uppercase tracking-[0.15em] font-semibold text-ink-3 dark:text-ink-4">
                            Scénario
                          </th>
                          <th className="px-4 py-2.5 text-right text-[10px] uppercase tracking-[0.15em] font-semibold text-ink-3 dark:text-ink-4">
                            Perf. %
                          </th>
                          <th className="px-4 py-2.5 text-right text-[10px] uppercase tracking-[0.15em] font-semibold text-ink-3 dark:text-ink-4">
                            Pour 10 000 euros
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {scenarios.map((s) => (
                          <tr key={s.name} className="border-b border-border/40 last:border-b-0">
                            <td className={cn('px-4 py-2.5 font-semibold', s.colorClass)}>{s.name}</td>
                            <td className={cn('px-4 py-2.5 text-right font-mono font-semibold', s.colorClass)}>
                              {s.pct >= 0 ? '+' : ''}{s.pct.toFixed(1)}%
                            </td>
                            <td className="px-4 py-2.5 text-right font-mono text-ink-2 dark:text-ink-3">
                              {formatMontantFull(10_000 * (1 + s.pct / 100))}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Description */}
          {produit.description && (
            <div className="bg-white/90 dark:bg-white/5 backdrop-blur-md rounded-lg p-5 border border-border/60 shadow-card">
              <h3 className="text-[13px] font-bold font-body mb-3 text-ink dark:text-white">
                Mécanisme du produit
              </h3>
              <p className="text-[13px] font-body leading-relaxed text-ink-2 dark:text-ink-3">
                {produit.description}
              </p>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="flex flex-col gap-5">
          {/* Enveloppe card */}
          {env && (
            <div className="relative bg-white/90 dark:bg-white/5 backdrop-blur-md rounded-lg p-5 sticky top-6 border border-border/60 shadow-card">
              {/* Gradient accent bar */}
              <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-violet/60 to-teal/40 rounded-t-lg" />

              <h3 className="text-[11px] uppercase tracking-[0.15em] font-semibold font-body mb-4 text-ink-3 dark:text-ink-4">
                Enveloppe {env.id}
              </h3>

              {/* Progress */}
              <div className="mb-4">
                <div className="flex items-center justify-between text-[12px] font-body mb-1.5">
                  <span className="text-ink-2 dark:text-ink-3">{fillPct.toFixed(0)}%</span>
                  <span className="font-mono text-ink-3 dark:text-ink-4">{formatMontant(env.montantConfirme)}</span>
                </div>
                <div className="h-2.5 w-full rounded-full overflow-hidden bg-surface-2 dark:bg-white/10">
                  <div
                    className={cn('h-full rounded-full transition-all duration-1000', barColorClass)}
                    style={{ width: `${fillPct}%` }}
                  />
                </div>
              </div>

              <div className="flex flex-col gap-2 text-[13px] font-body mb-4">
                <div className="flex justify-between">
                  <span className="text-ink-3 dark:text-ink-4">Confirmé</span>
                  <span className="font-semibold text-teal">{formatMontant(env.montantConfirme)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-ink-3 dark:text-ink-4">En attente</span>
                  <span className="font-semibold text-gold">{formatMontant(env.montantAttente)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-ink-3 dark:text-ink-4">Cible</span>
                  <span className="font-semibold text-ink dark:text-white">{formatMontant(env.montantCible)} (+{env.surbookingPct}% surb.)</span>
                </div>
              </div>

              <div className="flex items-center gap-2 py-2.5 px-3 rounded-md mb-4 bg-surface dark:bg-white/[0.03]">
                <Users size={14} className="text-violet dark:text-violet-light" />
                <span className="text-[13px] font-semibold font-body text-ink dark:text-white">
                  {env.nbInteresses} distributeurs intéressés
                </span>
              </div>

              {daysLeft !== null && daysLeft > 0 && (
                <div className={cn(
                  'flex items-center gap-2 py-2.5 px-3 rounded-md mb-4',
                  daysLeft <= 30
                    ? 'bg-red-light dark:bg-red/10'
                    : 'bg-surface dark:bg-white/[0.03]'
                )}>
                  <Clock size={14} className={cn(
                    daysLeft <= 30 ? 'text-red' : 'text-ink-3 dark:text-ink-4'
                  )} />
                  <div className="flex-1">
                    <p className="text-[10px] uppercase tracking-wider font-body text-ink-3 dark:text-ink-4">Clôture</p>
                    <p className="text-[13px] font-semibold font-body text-ink dark:text-white">{formatDateFR(env.dateCloture)}</p>
                  </div>
                  {daysLeft <= 30 && (
                    <span className="text-[10px] font-bold font-body px-2 py-0.5 rounded-full bg-red text-white">
                      J-{daysLeft}
                    </span>
                  )}
                </div>
              )}

              <Link
                href="/assureur/enveloppes"
                className="w-full h-10 rounded-lg bg-violet hover:bg-violet-dark text-white font-semibold font-body text-[13px] flex items-center justify-center gap-2 transition-all duration-200 hover:shadow-violet active:scale-[0.98]"
              >
                Gérer l&apos;enveloppe
              </Link>
            </div>
          )}

          {/* Commission + Docs */}
          <div className="bg-white/90 dark:bg-white/5 backdrop-blur-md rounded-lg p-5 border border-border/60 shadow-card">
            <DetailRow label="Commission" value={`${(produit.fraisEntree * 0.1).toFixed(1)}% entry fee`} />
            <div className="mt-3 flex flex-col gap-2">
              <span className="text-[10px] uppercase tracking-[0.15em] font-semibold font-body text-ink-3 dark:text-ink-4">
                Documents
              </span>
              {['KID (PRIIPS)', 'Fiche produit'].map((doc) => (
                <button
                  key={doc}
                  onClick={() => {
                    const content = `${produit.nom}\nISIN: ${produit.isin}\nEmetteur: ${produit.emetteur}\nType: ${TYPE_LABELS[produit.type] ?? produit.type}\nSRI: ${produit.sri}/7\nCoupon: ${produit.couponPct ?? '-'}%\nBarriere: ${produit.barrierePct ?? '-'}%\nMaturite: ${produit.maturite}\nFrais: ${produit.fraisEntree}%\n\nDocument: ${doc}`;
                    const blob = new Blob([content], { type: 'text/plain' });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `${produit.nom.replace(/\s+/g, '_')}_${doc.replace(/[\s()]/g, '')}.txt`;
                    a.click();
                    URL.revokeObjectURL(url);
                  }}
                  className="flex items-center gap-2 px-3 py-2 rounded-md w-full text-left border border-border/60 transition-all duration-200 hover:bg-surface-2 dark:hover:bg-white/5 hover:shadow-xs"
                >
                  <FileText size={14} className="text-ink-3 dark:text-ink-4" />
                  <span className="flex-1 text-[12px] font-medium font-body text-ink-2 dark:text-ink-3">{doc}</span>
                  <ExternalLink size={12} className="text-ink-3 dark:text-ink-4" />
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
