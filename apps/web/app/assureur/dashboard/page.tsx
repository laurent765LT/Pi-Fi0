'use client';

import Link from 'next/link';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { TrendingUp, Users, Package, Clock, ArrowRight, AlertTriangle, Eye, DollarSign, Calendar } from 'lucide-react';
import {
  PRODUITS, ENVELOPPES, EVENEMENTS, COLLECTE_MENSUELLE,
  formatMontant, formatMontantFull, formatDateFR, getProduit,
  TYPE_LABELS, TYPE_COLORS, SRI_COLORS, STATUT_ENVELOPPE, EVENT_CONFIG,
} from '@/lib/mock-data-assureur';
import { cn } from '@/lib/cn';

// ─── Stat Card ───────────────────────────────────────────────────────────────

function StatCard({ icon, label, value, sub, urgent = false }: {
  icon: React.ReactNode; label: string; value: React.ReactNode; sub?: string; urgent?: boolean;
}) {
  return (
    <div
      className={cn(
        'group relative overflow-hidden bg-white/90 dark:bg-white/5 backdrop-blur-md rounded-xl p-5 flex flex-col gap-3',
        'border border-border/60 shadow-sm hover:shadow-md transition-all duration-200',
        urgent && 'border-l-4 border-l-red',
      )}
    >
      {/* Gradient accent bar on hover */}
      <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-violet/60 to-teal/40 opacity-0 group-hover:opacity-100 transition-opacity" />

      <div className="flex items-center justify-between">
        <div className="w-9 h-9 rounded-lg flex items-center justify-center bg-gradient-to-br from-violet/10 to-cobalt/10">
          {icon}
        </div>
      </div>
      <div>
        <span className="text-[11px] uppercase tracking-[0.15em] font-semibold text-ink-3 dark:text-white/40 font-body">
          {label}
        </span>
        <div className={cn(
          'text-[22px] font-bold mt-0.5 font-display',
          urgent ? 'text-red' : 'text-ink dark:text-white',
        )}>
          {value}
        </div>
        {sub && (
          <span className="text-[12px] text-ink-3 dark:text-white/40 font-body">{sub}</span>
        )}
      </div>
    </div>
  );
}

// ─── Enveloppe Row ───────────────────────────────────────────────────────────

function EnveloppeRow({ env }: { env: typeof ENVELOPPES[0] }) {
  const produit = getProduit(env.produitId);
  if (!produit) return null;
  const maxAmount = env.montantCible * (1 + env.surbookingPct / 100);
  const fillPct = Math.min(100, (env.montantConfirme / maxAmount) * 100);
  const statut = STATUT_ENVELOPPE[env.statut];
  const daysLeft = Math.ceil((new Date(env.dateCloture).getTime() - Date.now()) / (1000 * 60 * 60 * 24));

  return (
    <div className="group relative overflow-hidden bg-white/90 dark:bg-white/5 backdrop-blur-md rounded-xl p-5 border border-border/60 shadow-sm hover:shadow-md transition-all duration-200">
      {/* Gradient accent bar on hover */}
      <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-violet/60 to-teal/40 opacity-0 group-hover:opacity-100 transition-opacity" />

      <div className="flex items-start justify-between mb-3">
        <div>
          <p className="text-[15px] font-bold text-ink dark:text-white font-display">{produit.nom}</p>
          <p className="text-[12px] font-mono text-ink-3 dark:text-white/40">{produit.isin}</p>
        </div>
        <span
          className="inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-semibold font-body"
          style={{ background: statut.bg, color: statut.text }}
        >
          {statut.label}
        </span>
      </div>

      {/* Progress bar */}
      <div className="mb-3">
        <div className="flex items-center justify-between text-[12px] mb-1.5 font-body">
          <span className="text-ink-2 dark:text-white/60">{fillPct.toFixed(0)}% rempli</span>
          <span className="text-ink-3 dark:text-white/40">{formatMontant(env.montantConfirme)} / {formatMontant(env.montantCible)}</span>
        </div>
        <div className="h-2 w-full rounded-full overflow-hidden bg-surface-2 dark:bg-white/10">
          <div
            className={cn(
              'h-full rounded-full transition-all duration-1000 ease-out',
              fillPct > 85 ? 'bg-orange-500' : fillPct > 50 ? 'bg-cobalt-light' : 'bg-violet',
            )}
            style={{ width: `${fillPct}%` }}
          />
        </div>
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4 text-[12px] text-ink-3 dark:text-white/40 font-body">
          <span className="flex items-center gap-1"><Users size={12} /> {env.nbInteresses} distributeurs</span>
          {daysLeft > 0 && (
            <span className={cn(
              'flex items-center gap-1',
              daysLeft <= 30 ? 'text-red' : 'text-ink-3 dark:text-white/40',
            )}>
              <Clock size={12} /> J-{daysLeft}
            </span>
          )}
        </div>
        <Link
          href={`/assureur/enveloppes`}
          className="text-[12px] font-semibold flex items-center gap-1 transition-opacity hover:opacity-80 text-violet font-body"
        >
          Voir détails <ArrowRight size={12} />
        </Link>
      </div>
    </div>
  );
}

// ─── Event Item ──────────────────────────────────────────────────────────────

function EventItem({ evt }: { evt: typeof EVENEMENTS[0] }) {
  const config = EVENT_CONFIG[evt.type];
  const IconMap = { CLOTURE: Calendar, OBSERVATION: Eye, COUPON: DollarSign, AUTOCALL: TrendingUp };
  const Icon = IconMap[evt.type] ?? Calendar;

  return (
    <Link
      href={`/assureur/produits/${evt.produitId}`}
      className="flex items-center gap-3 py-2.5 hover:bg-violet/[0.04] dark:hover:bg-white/5 rounded-lg px-2 transition-colors -mx-2"
    >
      <div
        className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
        style={{ background: config.bg }}
      >
        <Icon size={14} style={{ color: config.color }} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[13px] font-medium text-ink dark:text-white font-body">{evt.produitNom}</p>
        <p className="text-[11px] text-ink-3 dark:text-white/40 font-body">
          {config.label} · {formatDateFR(evt.date)}
        </p>
      </div>
      {evt.joursRestants <= 30 && (
        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-light text-red font-body">
          J-{evt.joursRestants}
        </span>
      )}
    </Link>
  );
}

// ─── Custom Tooltip ──────────────────────────────────────────────────────────

function ChartTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div
      className="bg-white dark:bg-ink rounded-lg px-3 py-2 text-[12px] border border-border/60 font-body"
      style={{ boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
    >
      <p className="font-semibold text-ink dark:text-white">{label}</p>
      <p className="text-violet">{formatMontantFull(payload[0].value)}</p>
    </div>
  );
}

// ─── Page ────────────────────────────────────────────────────────────────────

export default function AssureurDashboard() {
  const activeProducts = PRODUITS.filter((p) => p.status === 'ACTIF').length;
  const activeEnveloppes = ENVELOPPES.filter((e) => e.statut === 'OUVERT');
  const totalVolume = ENVELOPPES.reduce((s, e) => s + e.montantConfirme + e.montantAttente, 0);
  const totalDistributeurs = new Set(ENVELOPPES.flatMap((e) => {
    const { getEngagements } = require('@/lib/mock-data-assureur');
    return getEngagements(e.id).map((eng: any) => eng.distributeur);
  })).size;
  const nextEvent = EVENEMENTS.find((e) => e.joursRestants > 0);

  return (
    <div>
      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard
          icon={<TrendingUp size={16} className="text-violet" />}
          label="Volume engagé"
          value={formatMontant(totalVolume)}
          sub="ce mois"
        />
        <StatCard
          icon={<Users size={16} className="text-violet" />}
          label="Distributeurs actifs"
          value={totalDistributeurs}
        />
        <StatCard
          icon={<Package size={16} className="text-violet" />}
          label="Produits actifs"
          value={`${activeProducts} produits`}
        />
        <StatCard
          icon={<Clock size={16} className="text-red" />}
          label="Prochaine clôture"
          value={nextEvent ? `J-${nextEvent.joursRestants}` : '—'}
          sub={nextEvent?.produitNom}
          urgent={nextEvent ? nextEvent.joursRestants <= 30 : false}
        />
      </div>

      {/* Chart + Events */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Collecte Chart — glass container */}
        <div className="lg:col-span-2 bg-white/90 dark:bg-white/5 backdrop-blur-md rounded-xl p-5 border border-border/60 shadow-sm">
          <h3 className="text-[15px] font-bold mb-4 text-ink dark:text-white font-display">Collecte mensuelle</h3>
          <div className="h-[220px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={COLLECTE_MENSUELLE} barSize={32}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E2DFF5" />
                <XAxis dataKey="mois" tick={{ fontSize: 12, fill: '#7B6FA0' }} axisLine={false} tickLine={false} />
                <YAxis
                  tick={{ fontSize: 11, fill: '#7B6FA0' }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(v: number) => `${(v / 1_000_000).toFixed(1)}M`}
                />
                <Tooltip content={<ChartTooltip />} cursor={{ fill: 'rgba(59,31,168,0.05)' }} />
                <Bar dataKey="montant" fill="#3B1FA8" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Events — glass container */}
        <div className="bg-white/90 dark:bg-white/5 backdrop-blur-md rounded-xl p-5 border border-border/60 shadow-sm">
          <h3 className="text-[15px] font-bold mb-4 text-ink dark:text-white font-display">Prochains événements</h3>
          <div className="flex flex-col">
            {EVENEMENTS.filter((e) => e.joursRestants > 0).map((evt) => (
              <EventItem key={evt.id} evt={evt} />
            ))}
          </div>
        </div>
      </div>

      {/* Active Enveloppes */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-[15px] font-bold text-ink dark:text-white font-display">Enveloppes actives</h3>
          <Link
            href="/assureur/enveloppes"
            className="text-[12px] font-semibold flex items-center gap-1 hover:opacity-80 transition-opacity text-violet font-body"
          >
            Tout voir <ArrowRight size={12} />
          </Link>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {activeEnveloppes.map((env) => (
            <EnveloppeRow key={env.id} env={env} />
          ))}
        </div>
      </div>
    </div>
  );
}
