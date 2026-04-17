'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  Activity,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Clock,
  Mail,
  Bell,
  TrendingUp,
} from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────

type ServiceStatus = 'operational' | 'degraded' | 'incident';
type DayStatus = 'operational' | 'degraded' | 'incident';

interface Service {
  id: string;
  name: string;
  responseMs: number;
  uptimePct: number;
  status: ServiceStatus;
}

interface Incident {
  title: string;
  date: string;
  resolution: string;
  severity: 'minor' | 'maintenance';
}

// ─── Data (mocked but deterministic) ──────────────────────────────────────

const services: Service[] = [
  { id: 'api-core', name: 'API Core', responseMs: 98, uptimePct: 99.99, status: 'operational' },
  { id: 'pricing', name: 'Moteur de pricing', responseMs: 142, uptimePct: 99.95, status: 'operational' },
  { id: 'db', name: 'Base de données', responseMs: 12, uptimePct: 100, status: 'operational' },
  { id: 'market-data', name: 'Données de marché', responseMs: 203, uptimePct: 99.92, status: 'operational' },
  { id: 'auth', name: 'Authentification', responseMs: 45, uptimePct: 100, status: 'operational' },
  { id: 'email', name: 'Service email', responseMs: 312, uptimePct: 99.87, status: 'operational' },
];

const historicalIncidents: Incident[] = [
  {
    title: 'Latence augmentée sur le moteur de pricing',
    date: '3 mars 2026',
    resolution: 'Résolu en 23 min',
    severity: 'minor',
  },
  {
    title: 'Maintenance planifiée',
    date: '15 février 2026',
    resolution: 'Durée 2h',
    severity: 'maintenance',
  },
];

// ─── Helpers ──────────────────────────────────────────────────────────────

/** Deterministic pseudo-random generator (mulberry32). */
function mulberry32(seed: number) {
  return function () {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Hash a string to a stable 32-bit seed. */
function hashSeed(str: string): number {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/** Build 90 daily statuses per service, deterministically. */
function generateUptimeHistory(serviceId: string): { date: string; status: DayStatus }[] {
  const rand = mulberry32(hashSeed(serviceId));
  const days: { date: string; status: DayStatus }[] = [];
  // Anchored to a fixed "today" so SSR and hydration match.
  const today = new Date('2026-04-18T00:00:00Z');

  for (let i = 89; i >= 0; i--) {
    const d = new Date(today);
    d.setUTCDate(d.getUTCDate() - i);
    const r = rand();
    let status: DayStatus = 'operational';
    // ~3% degraded, <1% incident, rest operational
    if (r > 0.995) status = 'incident';
    else if (r > 0.97) status = 'degraded';
    days.push({
      date: d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }),
      status,
    });
  }
  return days;
}

function formatTime(d: Date): string {
  return d.toLocaleTimeString('fr-FR', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}

// ─── Page ─────────────────────────────────────────────────────────────────

export default function StatusPage() {
  const [now, setNow] = useState<Date | null>(null);
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    setNow(new Date());
    const id = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(id);
  }, []);

  const allOperational = useMemo(
    () => services.every((s) => s.status === 'operational'),
    [],
  );

  const globalUptime = '99.98%';
  const activeIncidents = 0;

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (email.trim()) {
      setSubscribed(true);
      setEmail('');
      setTimeout(() => setSubscribed(false), 4000);
    }
  };

  return (
    <div className="min-h-screen bg-surface dark:bg-ink font-body">
      {/* Top nav / back link */}
      <div className="border-b border-border/60 dark:border-white/5 bg-white/60 dark:bg-white/[0.02] backdrop-blur-sm">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm text-ink-3 dark:text-white/60 hover:text-violet dark:hover:text-white transition-colors duration-200"
          >
            <ArrowLeft className="w-4 h-4" />
            Retour à l&apos;accueil
          </Link>
          <span className="font-display text-sm font-bold text-ink dark:text-white">
            Strick&apos;in
          </span>
        </div>
      </div>

      <main
        className={`max-w-4xl mx-auto px-6 py-10 md:py-14 transition-opacity duration-700 ${
          mounted ? 'opacity-100' : 'opacity-0'
        }`}
      >
        {/* ─── Header ─────────────────────────────────────────────────── */}
        <header className="mb-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal/10 border border-teal/20 mb-5">
            <Activity className="w-3.5 h-3.5 text-teal" />
            <span className="text-[11px] font-semibold tracking-[0.15em] text-teal uppercase">
              Statut en direct
            </span>
          </div>

          <div className="flex items-center gap-3 mb-3">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-teal opacity-60" />
              <span className="relative inline-flex rounded-full h-3 w-3 bg-teal" />
            </span>
            <h1 className="font-display text-3xl md:text-5xl font-extrabold text-ink dark:text-white leading-tight">
              État du système
            </h1>
          </div>

          <p
            className={`font-display text-xl md:text-2xl font-bold mb-3 ${
              allOperational ? 'text-teal' : 'text-gold'
            }`}
          >
            {allOperational ? 'Tous les systèmes opérationnels' : 'Dégradation en cours'}
          </p>

          <p className="text-sm md:text-base text-ink-3 dark:text-white/60 leading-relaxed mb-2">
            Surveillance en temps réel de la plateforme Strick&apos;in
          </p>

          <p className="inline-flex items-center gap-1.5 text-xs text-ink-4 dark:text-white/40">
            <Clock className="w-3 h-3" />
            Dernière mise à jour&nbsp;:&nbsp;
            <span suppressHydrationWarning className="font-mono tabular-nums">
              {now ? formatTime(now) : '--:--:--'}
            </span>
            <span className="ml-1 text-ink-4/70 dark:text-white/30">
              (mise à jour automatique toutes les 60 s)
            </span>
          </p>
        </header>

        {/* ─── Global health banner ─────────────────────────────────── */}
        <section
          className="relative overflow-hidden rounded-2xl border border-teal/20 bg-gradient-to-r from-teal/10 via-teal/5 to-transparent dark:from-teal/15 dark:via-teal/5 dark:to-transparent p-6 md:p-8 mb-12 shadow-card"
          aria-label="État global"
        >
          <div className="absolute -top-12 -right-12 w-40 h-40 rounded-full bg-teal/20 blur-3xl pointer-events-none" />
          <div className="relative flex flex-col md:flex-row md:items-center gap-6 md:gap-10">
            {/* Pulse circle */}
            <div className="flex-shrink-0">
              <div className="relative w-16 h-16">
                <span className="absolute inset-0 rounded-full bg-teal/30 animate-ping" />
                <span className="absolute inset-0 rounded-full bg-teal/20 animate-pulse-subtle" />
                <span className="relative flex items-center justify-center w-16 h-16 rounded-full bg-teal shadow-lg shadow-teal/30">
                  <CheckCircle2 className="w-8 h-8 text-white" strokeWidth={2.2} />
                </span>
              </div>
            </div>

            {/* Main copy */}
            <div className="flex-1">
              <h2 className="font-display text-xl md:text-2xl font-extrabold text-ink dark:text-white mb-1">
                Tous les systèmes opérationnels
              </h2>
              <p className="text-sm text-ink-3 dark:text-white/60 leading-relaxed">
                Toutes les plateformes Strick&apos;in fonctionnent normalement.
              </p>
            </div>

            {/* Stats */}
            <div className="flex gap-6 md:gap-10 md:border-l md:border-teal/20 md:pl-10">
              <div>
                <div className="flex items-baseline gap-1">
                  <span className="font-display text-2xl md:text-3xl font-extrabold text-ink dark:text-white tabular-nums">
                    {globalUptime}
                  </span>
                </div>
                <p className="text-[11px] uppercase tracking-[0.12em] text-ink-4 dark:text-white/40 font-semibold mt-0.5">
                  Uptime / 90 j
                </p>
              </div>
              <div>
                <div className="flex items-baseline gap-1">
                  <span className="font-display text-2xl md:text-3xl font-extrabold text-ink dark:text-white tabular-nums">
                    {activeIncidents}
                  </span>
                </div>
                <p className="text-[11px] uppercase tracking-[0.12em] text-ink-4 dark:text-white/40 font-semibold mt-0.5">
                  Incident actif
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ─── Service status grid ──────────────────────────────────── */}
        <section className="mb-12">
          <div className="flex items-baseline justify-between mb-5">
            <h2 className="font-display text-xl md:text-2xl font-bold text-ink dark:text-white">
              Services
            </h2>
            <span className="text-xs text-ink-4 dark:text-white/40">
              {services.length} services surveillés
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {services.map((svc, i) => (
              <ServiceCard key={svc.id} service={svc} delay={i * 60} />
            ))}
          </div>
        </section>

        {/* ─── Uptime history (90 days) ─────────────────────────────── */}
        <section className="mb-12">
          <div className="flex items-baseline justify-between mb-5">
            <h2 className="font-display text-xl md:text-2xl font-bold text-ink dark:text-white">
              Historique de disponibilité
            </h2>
            <span className="text-xs text-ink-4 dark:text-white/40">
              Derniers 90 jours
            </span>
          </div>

          <div className="bg-white dark:bg-white/[0.03] rounded-2xl border border-border/60 dark:border-white/5 shadow-card overflow-hidden">
            <div className="divide-y divide-border/50 dark:divide-white/5">
              {services.map((svc) => (
                <UptimeRow key={svc.id} service={svc} />
              ))}
            </div>

            {/* Legend */}
            <div className="flex items-center justify-between gap-4 px-5 md:px-6 py-4 border-t border-border/50 dark:border-white/5 bg-surface-2/40 dark:bg-white/[0.02]">
              <span className="text-[11px] text-ink-4 dark:text-white/40">Il y a 90 jours</span>
              <div className="flex items-center gap-4 text-[11px] text-ink-3 dark:text-white/50">
                <span className="inline-flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-sm bg-teal" />
                  Opérationnel
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-sm bg-gold" />
                  Dégradé
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-sm bg-red" />
                  Incident
                </span>
              </div>
              <span className="text-[11px] text-ink-4 dark:text-white/40">Aujourd&apos;hui</span>
            </div>
          </div>
        </section>

        {/* ─── Recent incidents ─────────────────────────────────────── */}
        <section className="mb-12">
          <div className="flex items-baseline justify-between mb-5">
            <h2 className="font-display text-xl md:text-2xl font-bold text-ink dark:text-white">
              Incidents récents
            </h2>
            <span className="text-xs text-ink-4 dark:text-white/40">30 derniers jours</span>
          </div>

          {/* Empty state */}
          <div className="bg-white dark:bg-white/[0.03] rounded-2xl border border-border/60 dark:border-white/5 shadow-card p-6 md:p-8 mb-6">
            <div className="flex items-center gap-4">
              <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-teal/10 flex items-center justify-center">
                <CheckCircle2 className="w-6 h-6 text-teal" strokeWidth={2} />
              </div>
              <div>
                <p className="font-display text-base font-bold text-ink dark:text-white mb-1">
                  Aucun incident au cours des 30 derniers jours
                </p>
                <p className="text-sm text-ink-3 dark:text-white/60">
                  Notre équipe infrastructure veille 24/7 sur la plateforme.
                </p>
              </div>
            </div>
          </div>

          {/* Historical resolved incidents */}
          <div>
            <p className="text-[11px] uppercase tracking-[0.15em] font-semibold text-ink-4 dark:text-white/40 mb-3">
              Historique résolu
            </p>
            <div className="space-y-3">
              {historicalIncidents.map((inc) => (
                <IncidentItem key={inc.title} incident={inc} />
              ))}
            </div>
          </div>
        </section>

        {/* ─── Subscribe to updates ─────────────────────────────────── */}
        <section className="mb-12">
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-violet to-cobalt dark:from-violet-dark dark:to-cobalt p-6 md:p-10 shadow-violet">
            <div className="absolute inset-0 pointer-events-none">
              <div className="absolute -top-20 -right-20 w-60 h-60 rounded-full bg-white/5 blur-3xl" />
              <div className="absolute -bottom-20 -left-20 w-60 h-60 rounded-full bg-cobalt-light/10 blur-3xl" />
            </div>
            <div className="relative flex flex-col md:flex-row items-start md:items-center gap-6">
              <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center">
                <Bell className="w-6 h-6 text-gold" strokeWidth={2} />
              </div>
              <div className="flex-1">
                <h2 className="font-display text-xl md:text-2xl font-extrabold text-white mb-1">
                  S&apos;abonner aux mises à jour
                </h2>
                <p className="text-sm text-white/70 leading-relaxed">
                  Recevez les notifications d&apos;incidents par email.
                </p>
              </div>

              <form
                onSubmit={handleSubscribe}
                className="w-full md:w-auto flex flex-col sm:flex-row gap-3"
              >
                <div className="relative flex-1 md:w-72">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/50" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="votre@email.com"
                    aria-label="Adresse email"
                    className="w-full h-11 rounded-xl pl-9 pr-4 text-sm font-body bg-white/10 border border-white/20 text-white placeholder:text-white/40 focus:ring-2 focus:ring-white/30 focus:border-white/40 focus:bg-white/15 transition-all outline-none"
                  />
                </div>
                <button
                  type="submit"
                  className="h-11 px-6 rounded-xl bg-white text-violet font-display font-bold text-sm tracking-wide shadow-lg hover:shadow-xl hover:scale-[1.02] active:scale-[0.99] transition-all duration-200 whitespace-nowrap"
                >
                  {subscribed ? 'Abonné !' : 'S\u2019abonner'}
                </button>
              </form>
            </div>
            {subscribed && (
              <p className="relative mt-4 text-xs text-teal-light inline-flex items-center gap-1.5 animate-fade-in">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Confirmation envoyée — consultez votre boîte de réception.
              </p>
            )}
          </div>
        </section>

        {/* ─── Footer ────────────────────────────────────────────────── */}
        <footer className="border-t border-border/60 dark:border-white/5 pt-6 pb-2 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <p className="text-xs text-ink-4 dark:text-white/40">
            Page publique — aucun compte requis
          </p>
          <div className="flex items-center gap-5 text-xs text-ink-3 dark:text-white/50">
            <Link href="/" className="hover:text-violet dark:hover:text-white transition-colors">
              Accueil
            </Link>
            <Link
              href="/cgu"
              className="hover:text-violet dark:hover:text-white transition-colors"
            >
              CGU
            </Link>
            <Link
              href="/confidentialite"
              className="hover:text-violet dark:hover:text-white transition-colors"
            >
              Confidentialité
            </Link>
          </div>
        </footer>
      </main>
    </div>
  );
}

// ─── Service card ────────────────────────────────────────────────────────

function ServiceCard({ service, delay }: { service: Service; delay: number }) {
  const { color, label, bg, ring } = statusTheme(service.status);

  return (
    <div
      className="group relative bg-white dark:bg-white/[0.03] rounded-xl border border-border/60 dark:border-white/5 p-5 shadow-card hover:shadow-card-hover hover:-translate-y-0.5 transition-all duration-300 animate-slide-up"
      style={{ animationDelay: `${delay}ms`, animationFillMode: 'backwards' }}
    >
      <div className="flex items-start justify-between mb-4">
        <div className="min-w-0">
          <h3 className="font-display text-[15px] font-bold text-ink dark:text-white truncate">
            {service.name}
          </h3>
        </div>
        <div
          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full ${bg} ${ring} flex-shrink-0`}
        >
          <span className="relative flex h-2 w-2">
            <span
              className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-50 ${color.replace(
                'text-',
                'bg-',
              )}`}
            />
            <span
              className={`relative inline-flex rounded-full h-2 w-2 ${color.replace(
                'text-',
                'bg-',
              )}`}
            />
          </span>
          <span className={`text-[11px] font-semibold ${color}`}>{label}</span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 text-xs">
        <div>
          <p className="text-[10px] uppercase tracking-[0.12em] text-ink-4 dark:text-white/40 font-semibold mb-0.5">
            Réponse
          </p>
          <p className="font-mono text-sm font-bold text-ink dark:text-white tabular-nums">
            {service.responseMs}
            <span className="text-ink-3 dark:text-white/50 font-body font-normal ml-0.5">ms</span>
          </p>
        </div>
        <div>
          <p className="text-[10px] uppercase tracking-[0.12em] text-ink-4 dark:text-white/40 font-semibold mb-0.5">
            Uptime
          </p>
          <p className="font-mono text-sm font-bold text-ink dark:text-white tabular-nums inline-flex items-center gap-1">
            {service.uptimePct.toFixed(2)}%
            <TrendingUp className="w-3 h-3 text-teal" />
          </p>
        </div>
      </div>
    </div>
  );
}

function statusTheme(status: ServiceStatus): {
  color: string;
  label: string;
  bg: string;
  ring: string;
} {
  switch (status) {
    case 'operational':
      return {
        color: 'text-teal',
        label: 'Opérationnel',
        bg: 'bg-teal/10',
        ring: 'ring-1 ring-inset ring-teal/20',
      };
    case 'degraded':
      return {
        color: 'text-gold',
        label: 'Dégradé',
        bg: 'bg-gold/10',
        ring: 'ring-1 ring-inset ring-gold/30',
      };
    case 'incident':
      return {
        color: 'text-red',
        label: 'Incident',
        bg: 'bg-red/10',
        ring: 'ring-1 ring-inset ring-red/30',
      };
  }
}

// ─── Uptime row ──────────────────────────────────────────────────────────

function UptimeRow({ service }: { service: Service }) {
  const days = useMemo(() => generateUptimeHistory(service.id), [service.id]);

  const operationalDays = days.filter((d) => d.status === 'operational').length;
  const uptimeDisplay = ((operationalDays / days.length) * 100).toFixed(2);

  return (
    <div className="px-5 md:px-6 py-4">
      <div className="flex items-center justify-between mb-2.5">
        <div className="flex items-center gap-2 min-w-0">
          <span className="font-display text-sm font-bold text-ink dark:text-white truncate">
            {service.name}
          </span>
          {service.status === 'operational' ? (
            <CheckCircle2 className="w-3.5 h-3.5 text-teal flex-shrink-0" />
          ) : service.status === 'degraded' ? (
            <AlertTriangle className="w-3.5 h-3.5 text-gold flex-shrink-0" />
          ) : (
            <XCircle className="w-3.5 h-3.5 text-red flex-shrink-0" />
          )}
        </div>
        <span className="text-xs font-mono tabular-nums text-ink-3 dark:text-white/60">
          {uptimeDisplay}%
        </span>
      </div>

      <div className="flex items-center gap-[2px] w-full">
        {days.map((d, i) => {
          const cls =
            d.status === 'operational'
              ? 'bg-teal/80 hover:bg-teal'
              : d.status === 'degraded'
              ? 'bg-gold hover:bg-gold/90'
              : 'bg-red hover:bg-red/90';
          const labelStatus =
            d.status === 'operational'
              ? 'Opérationnel'
              : d.status === 'degraded'
              ? 'Dégradé'
              : 'Incident';
          return (
            <span
              key={i}
              title={`${d.date} — ${labelStatus}`}
              className={`flex-1 h-6 rounded-[2px] ${cls} transition-colors cursor-help`}
              aria-label={`${d.date} : ${labelStatus}`}
            />
          );
        })}
      </div>
    </div>
  );
}

// ─── Incident item ───────────────────────────────────────────────────────

function IncidentItem({ incident }: { incident: Incident }) {
  const isMaint = incident.severity === 'maintenance';
  return (
    <div className="bg-white dark:bg-white/[0.03] rounded-xl border border-border/60 dark:border-white/5 p-4 md:p-5 flex items-center gap-4 shadow-card hover:shadow-card-hover transition-shadow">
      <div
        className={`flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center ${
          isMaint ? 'bg-cobalt/10' : 'bg-teal/10'
        }`}
      >
        {isMaint ? (
          <Clock className="w-5 h-5 text-cobalt" strokeWidth={2} />
        ) : (
          <CheckCircle2 className="w-5 h-5 text-teal" strokeWidth={2} />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-display text-sm font-bold text-ink dark:text-white truncate">
          {incident.title}
        </p>
        <p className="text-xs text-ink-3 dark:text-white/60 mt-0.5">
          {incident.date} — {incident.resolution}
        </p>
      </div>
      <span
        className={`hidden sm:inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-semibold uppercase tracking-[0.12em] flex-shrink-0 ${
          isMaint
            ? 'bg-cobalt/10 text-cobalt ring-1 ring-inset ring-cobalt/20'
            : 'bg-teal/10 text-teal ring-1 ring-inset ring-teal/20'
        }`}
      >
        {isMaint ? 'Maintenance' : 'Résolu'}
      </span>
    </div>
  );
}
