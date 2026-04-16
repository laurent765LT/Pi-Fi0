'use client';

import Link from 'next/link';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { TrendingUp, Users, Package, Clock, ArrowRight, AlertTriangle, Eye, DollarSign, Calendar, BarChart3, Layers, Percent, Brain, Sparkles, Star, ChevronRight, Zap, ShieldAlert, Target } from 'lucide-react';
import {
  PRODUITS, ENVELOPPES, EVENEMENTS, COLLECTE_MENSUELLE, ENGAGEMENTS,
  formatMontant, formatMontantFull, formatDateFR, formatDateShortFR, getProduit, getEngagements,
  TYPE_LABELS, TYPE_COLORS, SRI_COLORS, STATUT_ENVELOPPE, STATUT_ENGAGEMENT, EVENT_CONFIG,
  ASSUREUR_DEMO,
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

// ─── Quick Action ───────────────────────────────────────────────────────────

function QuickAction({ href, icon, label, description }: {
  href: string; icon: React.ReactNode; label: string; description: string;
}) {
  return (
    <Link
      href={href}
      className="group relative flex items-center gap-4 bg-white/90 dark:bg-white/5 backdrop-blur-md rounded-xl p-4 border border-border/60 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200"
    >
      <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-violet/60 to-teal/40 opacity-0 group-hover:opacity-100 transition-opacity" />
      <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-gradient-to-br from-violet/10 to-cobalt/10 shrink-0">
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[14px] font-semibold text-ink dark:text-white font-body group-hover:text-violet transition-colors">{label}</p>
        <p className="text-[12px] text-ink-3 dark:text-white/40 font-body">{description}</p>
      </div>
      <ArrowRight size={16} className="text-ink-3 dark:text-white/30 group-hover:text-violet transition-colors shrink-0" />
    </Link>
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
  const totalDistributeurs = new Set(ENGAGEMENTS.map((e) => e.distributeur)).size;
  const nextEvent = EVENEMENTS.find((e) => e.joursRestants > 0);

  // Average fill rate across open envelopes
  const avgFillRate = activeEnveloppes.length > 0
    ? activeEnveloppes.reduce((sum, env) => {
        const maxAmount = env.montantCible * (1 + env.surbookingPct / 100);
        return sum + Math.min(100, (env.montantConfirme / maxAmount) * 100);
      }, 0) / activeEnveloppes.length
    : 0;

  // Quick stats for engagement statuses
  const pendingCount = ENGAGEMENTS.filter((e) => e.statut === 'EN_ATTENTE').length;
  const reviewCount = ENGAGEMENTS.filter((e) => e.statut === 'LISTE_ATTENTE').length;
  const now = new Date();
  const thisMonthTotal = ENGAGEMENTS
    .filter((e) => {
      const d = new Date(e.date);
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    })
    .reduce((sum, e) => sum + e.montant, 0);

  // Last 5 engagements sorted by date desc
  const recentEngagements = [...ENGAGEMENTS]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 5)
    .map((eng) => {
      const env = ENVELOPPES.find((e) => e.id === eng.enveloppeId);
      const produit = env ? getProduit(env.produitId) : undefined;
      return { ...eng, produitNom: produit?.nom ?? '—' };
    });

  // Extract first name from ASSUREUR_DEMO contact
  const firstName = ASSUREUR_DEMO.contact.split(' ')[0];

  return (
    <div>
      {/* Personalized Greeting */}
      <div className="mb-8">
        <h1 className="text-[26px] font-bold font-display text-ink dark:text-white">
          Bonjour {firstName}
        </h1>
        <p className="text-[14px] font-body text-ink-3 dark:text-white/50 mt-1">
          Espace Assureur — {ASSUREUR_DEMO.nom}
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard
          icon={<Package size={16} className="text-violet" />}
          label="Produits actifs"
          value={activeProducts}
          sub={`${PRODUITS.length} au total`}
        />
        <StatCard
          icon={<TrendingUp size={16} className="text-violet" />}
          label="Volume total"
          value={formatMontant(totalVolume)}
          sub="engagements cumules"
        />
        <StatCard
          icon={<Users size={16} className="text-violet" />}
          label="Distributeurs"
          value={totalDistributeurs}
          sub={`${ENGAGEMENTS.length} engagements`}
        />
        <StatCard
          icon={<Percent size={16} className="text-cobalt" />}
          label="Taux remplissage moy."
          value={`${avgFillRate.toFixed(0)}%`}
          sub={`${activeEnveloppes.length} enveloppes ouvertes`}
        />
      </div>

      {/* Quick Stats Row */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="flex items-center gap-3 bg-amber-50 dark:bg-amber-900/20 rounded-xl px-5 py-4 border border-amber-200/60 dark:border-amber-700/30">
          <div className="w-9 h-9 rounded-lg flex items-center justify-center bg-amber-100 dark:bg-amber-800/30">
            <Clock size={16} className="text-amber-600" />
          </div>
          <div>
            <span className="text-[22px] font-bold font-display text-amber-700 dark:text-amber-400">{pendingCount}</span>
            <p className="text-[11px] uppercase tracking-[0.12em] font-semibold text-amber-600/70 dark:text-amber-500/60 font-body">Engagements en attente</p>
          </div>
        </div>
        <div className="flex items-center gap-3 bg-blue-50 dark:bg-blue-900/20 rounded-xl px-5 py-4 border border-blue-200/60 dark:border-blue-700/30">
          <div className="w-9 h-9 rounded-lg flex items-center justify-center bg-blue-100 dark:bg-blue-800/30">
            <Eye size={16} className="text-blue-600" />
          </div>
          <div>
            <span className="text-[22px] font-bold font-display text-blue-700 dark:text-blue-400">{reviewCount}</span>
            <p className="text-[11px] uppercase tracking-[0.12em] font-semibold text-blue-600/70 dark:text-blue-500/60 font-body">A valider</p>
          </div>
        </div>
        <div className="flex items-center gap-3 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl px-5 py-4 border border-emerald-200/60 dark:border-emerald-700/30">
          <div className="w-9 h-9 rounded-lg flex items-center justify-center bg-emerald-100 dark:bg-emerald-800/30">
            <DollarSign size={16} className="text-emerald-600" />
          </div>
          <div>
            <span className="text-[22px] font-bold font-display text-emerald-700 dark:text-emerald-400">{formatMontant(thisMonthTotal)}</span>
            <p className="text-[11px] uppercase tracking-[0.12em] font-semibold text-emerald-600/70 dark:text-emerald-500/60 font-body">Ce mois</p>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <QuickAction
          href="/assureur/enveloppes"
          icon={<Layers size={16} className="text-violet" />}
          label="Voir les enveloppes"
          description="Suivi des bookings en temps reel"
        />
        <QuickAction
          href="/assureur/produits"
          icon={<BarChart3 size={16} className="text-cobalt" />}
          label="Mes produits"
          description={`${activeProducts} produits en distribution`}
        />
        <QuickAction
          href="/assureur/distributeurs"
          icon={<Users size={16} className="text-teal" />}
          label="Distributeurs"
          description={`${totalDistributeurs} cabinets actifs`}
        />
      </div>

      {/* ─── Intelligence IA ──────────────────────────────────────────────── */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-gradient-to-br from-violet to-teal">
            <Brain size={16} className="text-white" />
          </div>
          <h2 className="text-[18px] font-bold font-display text-ink dark:text-white">Intelligence IA</h2>
          <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-gradient-to-r from-violet to-teal text-white">
            <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
            Live
          </span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

          {/* ── AI Market Pulse ───────────────────────────────────────────── */}
          <div className="group relative overflow-hidden bg-white/90 dark:bg-white/5 backdrop-blur-md rounded-xl border border-border/60 shadow-sm hover:shadow-md transition-all duration-200">
            <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-violet/80 via-teal/60 to-gold/40" />
            <div className="p-5">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-lg flex items-center justify-center bg-gradient-to-br from-violet/15 to-teal/10">
                    <Brain size={16} className="text-violet" />
                  </div>
                  <div>
                    <h3 className="text-[14px] font-bold text-ink dark:text-white font-display">Analyse IA Marche</h3>
                    <span className="text-[10px] text-ink-3 dark:text-white/40 font-body">Mis a jour il y a 2h</span>
                  </div>
                </div>
                <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Live
                </span>
              </div>

              <div className="flex flex-col gap-3">
                {/* Insight 1 */}
                <div className="rounded-lg bg-violet/[0.04] dark:bg-violet/[0.08] border border-violet/10 p-3">
                  <div className="flex items-start gap-2.5">
                    <TrendingUp size={14} className="text-violet mt-0.5 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-[12px] font-medium text-ink dark:text-white/90 font-body leading-relaxed">
                        Demande en hausse sur les Autocall Phoenix (+23% vs Q4)
                      </p>
                      <div className="flex items-center gap-2 mt-1.5">
                        <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 font-body">
                          <TrendingUp size={10} /> Haussier
                        </span>
                        <span className="text-[10px] font-mono font-semibold text-violet/80 dark:text-violet-light/80">89% confiance</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Insight 2 */}
                <div className="rounded-lg bg-amber-50/60 dark:bg-amber-900/10 border border-amber-200/40 dark:border-amber-700/20 p-3">
                  <div className="flex items-start gap-2.5">
                    <ShieldAlert size={14} className="text-amber-600 dark:text-amber-400 mt-0.5 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-[12px] font-medium text-ink dark:text-white/90 font-body leading-relaxed">
                        Barrieres a 60% tres demandees — ajuster vos regles d&apos;eligibilite
                      </p>
                      <div className="flex items-center gap-2 mt-1.5">
                        <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 font-body">
                          <Zap size={10} /> Action
                        </span>
                        <span className="text-[10px] font-mono font-semibold text-violet/80 dark:text-violet-light/80">85% confiance</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Insight 3 */}
                <div className="rounded-lg bg-violet/[0.04] dark:bg-violet/[0.08] border border-violet/10 p-3">
                  <div className="flex items-start gap-2.5">
                    <TrendingUp size={14} className="text-teal mt-0.5 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-[12px] font-medium text-ink dark:text-white/90 font-body leading-relaxed">
                        Volume CGP en acceleration sur les maturites courtes (3-5 ans)
                      </p>
                      <div className="flex items-center gap-2 mt-1.5">
                        <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 font-body">
                          <TrendingUp size={10} /> Haussier
                        </span>
                        <span className="text-[10px] font-mono font-semibold text-violet/80 dark:text-violet-light/80">78% confiance</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ── AI Recommendations ────────────────────────────────────────── */}
          <div className="group relative overflow-hidden bg-white/90 dark:bg-white/5 backdrop-blur-md rounded-xl border border-border/60 shadow-sm hover:shadow-md transition-all duration-200">
            <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-teal/60 via-violet/60 to-gold/40" />
            <div className="p-5">
              <div className="flex items-center gap-2.5 mb-4">
                <div className="w-9 h-9 rounded-lg flex items-center justify-center bg-gradient-to-br from-teal/15 to-violet/10">
                  <Sparkles size={16} className="text-teal" />
                </div>
                <h3 className="text-[14px] font-bold text-ink dark:text-white font-display">Recommandations IA</h3>
              </div>

              <div className="flex flex-col gap-3">
                {/* Recommendation 1 */}
                <div className="rounded-lg bg-violet/[0.04] dark:bg-violet/[0.08] border border-violet/10 p-3">
                  <div className="flex items-start gap-2.5">
                    <Target size={14} className="text-violet mt-0.5 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-[12px] font-medium text-ink dark:text-white/90 font-body leading-relaxed">
                        Ouvrir une nouvelle enveloppe Autocall Phoenix — forte demande detectee
                      </p>
                      <div className="flex items-center justify-between mt-2">
                        <span className="text-[10px] font-mono font-semibold text-violet/80 dark:text-violet-light/80">92% confiance</span>
                        <Link
                          href="/assureur/enveloppes"
                          className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-[11px] font-semibold bg-gradient-to-r from-violet to-cobalt text-white hover:opacity-90 transition-opacity font-body"
                        >
                          Creer l&apos;enveloppe <ChevronRight size={12} />
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Recommendation 2 */}
                <div className="rounded-lg bg-red-50/60 dark:bg-red-900/10 border border-red-200/40 dark:border-red-700/20 p-3">
                  <div className="flex items-start gap-2.5">
                    <AlertTriangle size={14} className="text-red mt-0.5 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-[12px] font-medium text-ink dark:text-white/90 font-body leading-relaxed">
                        3 engagements en attente depuis &gt;48h — risque de perte de CGPs
                      </p>
                      <div className="flex items-center justify-between mt-2">
                        <span className="text-[10px] font-mono font-semibold text-red/80">Urgent</span>
                        <Link
                          href="/assureur/engagements"
                          className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-[11px] font-semibold bg-gradient-to-r from-red to-orange-500 text-white hover:opacity-90 transition-opacity font-body"
                        >
                          Voir les engagements <ChevronRight size={12} />
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Recommendation 3 */}
                <div className="rounded-lg bg-amber-50/60 dark:bg-amber-900/10 border border-amber-200/40 dark:border-amber-700/20 p-3">
                  <div className="flex items-start gap-2.5">
                    <ShieldAlert size={14} className="text-amber-600 dark:text-amber-400 mt-0.5 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-[12px] font-medium text-ink dark:text-white/90 font-body leading-relaxed">
                        Vos regles SRI max=5 excluent 2 produits populaires — envisagez SRI 6
                      </p>
                      <div className="flex items-center justify-between mt-2">
                        <span className="text-[10px] font-mono font-semibold text-violet/80 dark:text-violet-light/80">76% confiance</span>
                        <Link
                          href="/assureur/regles"
                          className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-[11px] font-semibold bg-gradient-to-r from-amber-500 to-orange-500 text-white hover:opacity-90 transition-opacity font-body"
                        >
                          Ajuster les regles <ChevronRight size={12} />
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ── AI Distributor Score ──────────────────────────────────────── */}
          <div className="group relative overflow-hidden bg-white/90 dark:bg-white/5 backdrop-blur-md rounded-xl border border-border/60 shadow-sm hover:shadow-md transition-all duration-200">
            <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-gold/60 via-violet/40 to-teal/40" />
            <div className="p-5">
              <div className="flex items-center gap-2.5 mb-4">
                <div className="w-9 h-9 rounded-lg flex items-center justify-center bg-gradient-to-br from-amber-100 to-violet/10 dark:from-amber-900/30 dark:to-violet/10">
                  <Star size={16} className="text-amber-600 dark:text-amber-400" />
                </div>
                <div>
                  <h3 className="text-[14px] font-bold text-ink dark:text-white font-display">Score IA Distributeurs</h3>
                  <span className="text-[10px] text-ink-3 dark:text-white/40 font-body">Top 3 CGPs ce mois</span>
                </div>
              </div>

              <div className="flex flex-col gap-3">
                {/* CGP 1 - Jean Dupont */}
                <div className="rounded-lg bg-gradient-to-r from-violet/[0.06] to-teal/[0.04] dark:from-violet/[0.12] dark:to-teal/[0.06] border border-violet/10 p-3">
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-gradient-to-br from-violet to-teal flex items-center justify-center text-[11px] font-bold text-white font-display">
                        JD
                      </div>
                      <span className="text-[13px] font-semibold text-ink dark:text-white font-body">Jean Dupont</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-[18px] font-bold font-display bg-gradient-to-r from-violet to-teal bg-clip-text text-transparent">94</span>
                      <span className="text-[9px] font-semibold uppercase tracking-wider text-ink-3 dark:text-white/40 font-body">/100</span>
                    </div>
                  </div>
                  <div className="h-1.5 w-full rounded-full overflow-hidden bg-surface-2 dark:bg-white/10 mb-1.5">
                    <div className="h-full rounded-full bg-gradient-to-r from-violet to-teal" style={{ width: '94%' }} />
                  </div>
                  <p className="text-[10px] text-ink-3 dark:text-white/50 font-body">Volume croissant, diversifie, fidele</p>
                </div>

                {/* CGP 2 - Marie Laurent */}
                <div className="rounded-lg bg-gradient-to-r from-cobalt/[0.05] to-violet/[0.03] dark:from-cobalt/[0.10] dark:to-violet/[0.06] border border-cobalt/10 p-3">
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-gradient-to-br from-cobalt to-violet flex items-center justify-center text-[11px] font-bold text-white font-display">
                        ML
                      </div>
                      <span className="text-[13px] font-semibold text-ink dark:text-white font-body">Marie Laurent</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-[18px] font-bold font-display bg-gradient-to-r from-cobalt to-violet bg-clip-text text-transparent">87</span>
                      <span className="text-[9px] font-semibold uppercase tracking-wider text-ink-3 dark:text-white/40 font-body">/100</span>
                    </div>
                  </div>
                  <div className="h-1.5 w-full rounded-full overflow-hidden bg-surface-2 dark:bg-white/10 mb-1.5">
                    <div className="h-full rounded-full bg-gradient-to-r from-cobalt to-violet" style={{ width: '87%' }} />
                  </div>
                  <p className="text-[10px] text-ink-3 dark:text-white/50 font-body">Nouveau CGP prometteur, bon profil</p>
                </div>

                {/* CGP 3 - Pierre Martin */}
                <div className="rounded-lg bg-surface/60 dark:bg-white/[0.04] border border-border/40 p-3">
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-gradient-to-br from-ink-3/60 to-ink-3/40 dark:from-white/30 dark:to-white/20 flex items-center justify-center text-[11px] font-bold text-white font-display">
                        PM
                      </div>
                      <span className="text-[13px] font-semibold text-ink dark:text-white font-body">Pierre Martin</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-[18px] font-bold font-display text-ink-2 dark:text-white/60">72</span>
                      <span className="text-[9px] font-semibold uppercase tracking-wider text-ink-3 dark:text-white/40 font-body">/100</span>
                    </div>
                  </div>
                  <div className="h-1.5 w-full rounded-full overflow-hidden bg-surface-2 dark:bg-white/10 mb-1.5">
                    <div className="h-full rounded-full bg-ink-3/40 dark:bg-white/30" style={{ width: '72%' }} />
                  </div>
                  <p className="text-[10px] text-ink-3 dark:text-white/50 font-body">Actif mais concentre sur un seul produit</p>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* Derniers engagements */}
      <div className="bg-white/90 dark:bg-white/5 backdrop-blur-md rounded-xl border border-border/60 shadow-sm mb-8 overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-border/40">
          <h3 className="text-[15px] font-bold text-ink dark:text-white font-display">Derniers engagements</h3>
          <Link
            href="/assureur/enveloppes"
            className="text-[12px] font-semibold flex items-center gap-1 hover:opacity-80 transition-opacity text-violet font-body"
          >
            Tout voir <ArrowRight size={12} />
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-[13px] font-body">
            <thead>
              <tr className="border-b border-border/40 bg-surface/50 dark:bg-white/[0.02]">
                <th className="text-left px-5 py-2.5 text-[11px] uppercase tracking-[0.12em] font-semibold text-ink-3 dark:text-white/40">CGP</th>
                <th className="text-left px-5 py-2.5 text-[11px] uppercase tracking-[0.12em] font-semibold text-ink-3 dark:text-white/40">Produit</th>
                <th className="text-right px-5 py-2.5 text-[11px] uppercase tracking-[0.12em] font-semibold text-ink-3 dark:text-white/40">Montant</th>
                <th className="text-left px-5 py-2.5 text-[11px] uppercase tracking-[0.12em] font-semibold text-ink-3 dark:text-white/40">Date</th>
                <th className="text-left px-5 py-2.5 text-[11px] uppercase tracking-[0.12em] font-semibold text-ink-3 dark:text-white/40">Statut</th>
              </tr>
            </thead>
            <tbody>
              {recentEngagements.map((eng) => {
                const statutStyle = STATUT_ENGAGEMENT[eng.statut];
                return (
                  <tr key={eng.id} className="border-b border-border/20 last:border-0 hover:bg-violet/[0.03] dark:hover:bg-white/[0.03] transition-colors">
                    <td className="px-5 py-3 font-medium text-ink dark:text-white">{eng.distributeur}</td>
                    <td className="px-5 py-3 text-ink-2 dark:text-white/70">{eng.produitNom}</td>
                    <td className="px-5 py-3 text-right font-mono font-semibold text-ink dark:text-white">{formatMontant(eng.montant)}</td>
                    <td className="px-5 py-3 text-ink-3 dark:text-white/50">{formatDateShortFR(eng.date)}</td>
                    <td className="px-5 py-3">
                      <span
                        className="inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold"
                        style={{ background: statutStyle.bg, color: statutStyle.text }}
                      >
                        {statutStyle.label}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Chart + Events */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Collecte Chart */}
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

        {/* Events */}
        <div className="bg-white/90 dark:bg-white/5 backdrop-blur-md rounded-xl p-5 border border-border/60 shadow-sm">
          <h3 className="text-[15px] font-bold mb-4 text-ink dark:text-white font-display">Prochains evenements</h3>
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
