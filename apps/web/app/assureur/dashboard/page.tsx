'use client';

import Link from 'next/link';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { TrendingUp, Users, Package, Clock, ArrowRight, AlertTriangle, Eye, DollarSign, Calendar } from 'lucide-react';
import {
  PRODUITS, ENVELOPPES, EVENEMENTS, COLLECTE_MENSUELLE,
  formatMontant, formatMontantFull, formatDateFR, getProduit,
  TYPE_LABELS, TYPE_COLORS, SRI_COLORS, STATUT_ENVELOPPE, EVENT_CONFIG,
} from '@/lib/mock-data-assureur';

// ─── Stat Card ───────────────────────────────────────────────────────────────

function StatCard({ icon, label, value, sub, urgent = false }: {
  icon: React.ReactNode; label: string; value: React.ReactNode; sub?: string; urgent?: boolean;
}) {
  return (
    <div
      className="relative bg-white rounded-[12px] p-5 flex flex-col gap-3"
      style={{
        boxShadow: '0 1px 3px rgba(0,0,0,0.08), 0 1px 2px rgba(0,0,0,0.06)',
        border: '1px solid #E5E7EB',
        borderLeft: urgent ? '4px solid #DC2626' : '1px solid #E5E7EB',
      }}
    >
      <div className="flex items-center justify-between">
        <div className="w-9 h-9 rounded-[8px] flex items-center justify-center" style={{ background: '#EEF0FD' }}>
          {icon}
        </div>
      </div>
      <div>
        <span className="text-[11px] uppercase tracking-[0.15em] font-semibold" style={{ color: '#9CA3AF' }}>{label}</span>
        <div className="text-[22px] font-bold mt-0.5" style={{ color: urgent ? '#DC2626' : '#111827' }}>{value}</div>
        {sub && <span className="text-[12px]" style={{ color: '#9CA3AF' }}>{sub}</span>}
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

  let barColor = '#3B28CC';
  if (fillPct > 85) barColor = '#EA580C';
  else if (fillPct > 50) barColor = '#2563EB';

  return (
    <div className="bg-white rounded-[12px] p-5" style={{ border: '1px solid #E5E7EB', boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}>
      <div className="flex items-start justify-between mb-3">
        <div>
          <p className="text-[15px] font-bold" style={{ color: '#111827' }}>{produit.nom}</p>
          <p className="text-[12px] font-mono" style={{ color: '#9CA3AF' }}>{produit.isin}</p>
        </div>
        <span className="inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-semibold" style={{ background: statut.bg, color: statut.text }}>
          {statut.label}
        </span>
      </div>

      {/* Progress bar */}
      <div className="mb-3">
        <div className="flex items-center justify-between text-[12px] mb-1.5">
          <span style={{ color: '#4B5563' }}>{fillPct.toFixed(0)}% rempli</span>
          <span style={{ color: '#9CA3AF' }}>{formatMontant(env.montantConfirme)} / {formatMontant(env.montantCible)}</span>
        </div>
        <div className="h-2 w-full rounded-full overflow-hidden" style={{ background: '#F3F4F6' }}>
          <div
            className="h-full rounded-full transition-all duration-1000 ease-out"
            style={{ width: `${fillPct}%`, background: barColor }}
          />
        </div>
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4 text-[12px]" style={{ color: '#9CA3AF' }}>
          <span className="flex items-center gap-1"><Users size={12} /> {env.nbInteresses} distributeurs</span>
          {daysLeft > 0 && (
            <span className="flex items-center gap-1" style={{ color: daysLeft <= 30 ? '#DC2626' : '#9CA3AF' }}>
              <Clock size={12} /> J-{daysLeft}
            </span>
          )}
        </div>
        <Link href={`/assureur/enveloppes`} className="text-[12px] font-semibold flex items-center gap-1 transition-opacity hover:opacity-80" style={{ color: '#3B28CC' }}>
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
    <Link href={`/assureur/produits/${evt.produitId}`} className="flex items-center gap-3 py-2.5 hover:bg-gray-50 rounded-[8px] px-2 transition-colors -mx-2">
      <div className="w-8 h-8 rounded-[8px] flex items-center justify-center shrink-0" style={{ background: config.bg }}>
        <Icon size={14} style={{ color: config.color }} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[13px] font-medium" style={{ color: '#111827' }}>{evt.produitNom}</p>
        <p className="text-[11px]" style={{ color: '#9CA3AF' }}>
          {config.label} · {formatDateFR(evt.date)}
        </p>
      </div>
      {evt.joursRestants <= 30 && (
        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: '#FEE2E2', color: '#DC2626' }}>
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
    <div className="bg-white rounded-[8px] px-3 py-2 text-[12px]" style={{ border: '1px solid #E5E7EB', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
      <p className="font-semibold" style={{ color: '#111827' }}>{label}</p>
      <p style={{ color: '#3B28CC' }}>{formatMontantFull(payload[0].value)}</p>
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
          icon={<TrendingUp size={16} style={{ color: '#3B28CC' }} />}
          label="Volume engagé"
          value={formatMontant(totalVolume)}
          sub="ce mois"
        />
        <StatCard
          icon={<Users size={16} style={{ color: '#3B28CC' }} />}
          label="Distributeurs actifs"
          value={totalDistributeurs}
        />
        <StatCard
          icon={<Package size={16} style={{ color: '#3B28CC' }} />}
          label="Produits actifs"
          value={`${activeProducts} produits`}
        />
        <StatCard
          icon={<Clock size={16} style={{ color: '#DC2626' }} />}
          label="Prochaine clôture"
          value={nextEvent ? `J-${nextEvent.joursRestants}` : '—'}
          sub={nextEvent?.produitNom}
          urgent={nextEvent ? nextEvent.joursRestants <= 30 : false}
        />
      </div>

      {/* Chart + Events */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Collecte Chart */}
        <div className="lg:col-span-2 bg-white rounded-[12px] p-5" style={{ border: '1px solid #E5E7EB', boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}>
          <h3 className="text-[15px] font-bold mb-4" style={{ color: '#111827' }}>Collecte mensuelle</h3>
          <div style={{ height: 220 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={COLLECTE_MENSUELLE} barSize={32}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
                <XAxis dataKey="mois" tick={{ fontSize: 12, fill: '#9CA3AF' }} axisLine={false} tickLine={false} />
                <YAxis
                  tick={{ fontSize: 11, fill: '#9CA3AF' }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(v: number) => `${(v / 1_000_000).toFixed(1)}M`}
                />
                <Tooltip content={<ChartTooltip />} cursor={{ fill: 'rgba(59,40,204,0.05)' }} />
                <Bar dataKey="montant" fill="#3B28CC" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Events */}
        <div className="bg-white rounded-[12px] p-5" style={{ border: '1px solid #E5E7EB', boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}>
          <h3 className="text-[15px] font-bold mb-4" style={{ color: '#111827' }}>Prochains événements</h3>
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
          <h3 className="text-[15px] font-bold" style={{ color: '#111827' }}>Enveloppes actives</h3>
          <Link href="/assureur/enveloppes" className="text-[12px] font-semibold flex items-center gap-1 hover:opacity-80 transition-opacity" style={{ color: '#3B28CC' }}>
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
