'use client';

import { useState } from 'react';
import {
  BarChart3,
  Users,
  ShieldCheck,
  Package,
  TrendingUp,
  Percent,
  Building2,
  Clock,
  Activity,
  FileText,
  UserPlus,
  CheckCircle2,
  AlertCircle,
  PlusCircle,
  ArrowUpRight,
  CalendarDays,
  type LucideIcon,
} from 'lucide-react';
import { cn } from '@/lib/cn';
import { PageHeader } from '@/components/ui/page-header';
import { Badge } from '@/components/ui/badge';

// ─── Design tokens ───────────────────────────────────────────────────────────

const VIOLET = '#3B1FA8';
const TEAL = '#00B894';
const GOLD = '#D4A017';
const DARK = '#1A0A3E';

// ─── KPI Data ────────────────────────────────────────────────────────────────

interface KPIItem {
  label: string;
  value: string;
  icon: LucideIcon;
  accent: string;
  accentTo: string;
  trend?: string;
  trendUp?: boolean;
}

const KPI_DATA: KPIItem[] = [
  {
    label: 'Total utilisateurs',
    value: '156',
    icon: Users,
    accent: VIOLET,
    accentTo: '#6C4FE0',
    trend: '+12',
    trendUp: true,
  },
  {
    label: 'CGPs actifs',
    value: '89',
    icon: ShieldCheck,
    accent: TEAL,
    accentTo: '#00D4AA',
    trend: '+5',
    trendUp: true,
  },
  {
    label: 'Assureurs',
    value: '12',
    icon: Building2,
    accent: DARK,
    accentTo: VIOLET,
    trend: '+2',
    trendUp: true,
  },
  {
    label: 'Produits au catalogue',
    value: '17',
    icon: Package,
    accent: '#5535C4',
    accentTo: '#7C66E3',
    trend: '+3',
    trendUp: true,
  },
  {
    label: 'Volume total engage',
    value: '8,4M\u00A0\u20AC',
    icon: TrendingUp,
    accent: TEAL,
    accentTo: '#00D4AA',
    trend: '+18%',
    trendUp: true,
  },
  {
    label: 'Taux de conversion',
    value: '68%',
    icon: Percent,
    accent: GOLD,
    accentTo: '#E8B84A',
    trend: '-3%',
    trendUp: false,
  },
];

// ─── Activity Chart Data ─────────────────────────────────────────────────────

const CHART_MONTHS = ['Oct', 'Nov', 'Dec', 'Jan', 'Fev', 'Mars'];
const CHART_VALUES = [12, 18, 24, 31, 28, 43];
const CHART_MAX = Math.max(...CHART_VALUES);

// ─── Top CGPs ────────────────────────────────────────────────────────────────

interface TopCGP {
  nom: string;
  cabinet: string;
  volume: string;
  engagements: number;
  derniereActivite: string;
}

const TOP_CGPS: TopCGP[] = [
  {
    nom: 'Paul Desplechin',
    cabinet: 'Patrimoine & Conseil',
    volume: '2,1M\u00A0\u20AC',
    engagements: 14,
    derniereActivite: 'Aujourd\'hui',
  },
  {
    nom: 'Marie Dupont',
    cabinet: 'WealthVista',
    volume: '1,8M\u00A0\u20AC',
    engagements: 11,
    derniereActivite: 'Hier',
  },
  {
    nom: 'Thomas Bernard',
    cabinet: 'FinAdvance',
    volume: '1,4M\u00A0\u20AC',
    engagements: 9,
    derniereActivite: 'Il y a 2j',
  },
  {
    nom: 'Sophie Laurent',
    cabinet: 'GPI Conseil',
    volume: '1,2M\u00A0\u20AC',
    engagements: 7,
    derniereActivite: 'Il y a 3j',
  },
  {
    nom: 'Nicolas Martin',
    cabinet: 'Selecta Finance',
    volume: '980k\u00A0\u20AC',
    engagements: 6,
    derniereActivite: 'Il y a 5j',
  },
];

// ─── Activity Log ────────────────────────────────────────────────────────────

type ActivityType = 'engagement' | 'onboarding' | 'product' | 'validation' | 'alert';

interface ActivityItem {
  id: number;
  text: string;
  time: string;
  type: ActivityType;
  icon: LucideIcon;
}

const ACTIVITY_TYPE_CONFIG: Record<
  ActivityType,
  { badge: string; badgeVariant: 'violet' | 'teal' | 'gold' | 'cobalt' | 'red' }
> = {
  engagement: { badge: 'Engagement', badgeVariant: 'violet' },
  onboarding: { badge: 'Onboarding', badgeVariant: 'teal' },
  product: { badge: 'Produit', badgeVariant: 'gold' },
  validation: { badge: 'Validation', badgeVariant: 'cobalt' },
  alert: { badge: 'Alerte', badgeVariant: 'red' },
};

const ACTIVITY_LOG: ActivityItem[] = [
  {
    id: 1,
    text: 'Paul Desplechin a cree un engagement de 250k\u20AC sur M Rendement 13',
    time: 'Il y a 12 min',
    type: 'engagement',
    icon: FileText,
  },
  {
    id: 2,
    text: 'Marie Dupont a finalise son onboarding',
    time: 'Il y a 34 min',
    type: 'onboarding',
    icon: UserPlus,
  },
  {
    id: 3,
    text: 'Nouveau produit M Equilibre 8 ajoute au catalogue',
    time: 'Il y a 1h',
    type: 'product',
    icon: PlusCircle,
  },
  {
    id: 4,
    text: 'Thomas Bernard a valide un engagement de 180k\u20AC sur Phoenix Avril',
    time: 'Il y a 1h30',
    type: 'validation',
    icon: CheckCircle2,
  },
  {
    id: 5,
    text: 'Sophie Laurent a souscrit a Athena Relax ESG pour 320k\u20AC',
    time: 'Il y a 2h',
    type: 'engagement',
    icon: FileText,
  },
  {
    id: 6,
    text: 'Alerte : enveloppe Selection Euro Climat a 92% de remplissage',
    time: 'Il y a 2h15',
    type: 'alert',
    icon: AlertCircle,
  },
  {
    id: 7,
    text: 'Nicolas Martin a debute son onboarding',
    time: 'Il y a 3h',
    type: 'onboarding',
    icon: UserPlus,
  },
  {
    id: 8,
    text: 'Mise a jour des conditions du produit Autocall BNP Diversifie',
    time: 'Il y a 4h',
    type: 'product',
    icon: Package,
  },
  {
    id: 9,
    text: 'Claire Moreau a valide 2 engagements pour un total de 410k\u20AC',
    time: 'Il y a 5h',
    type: 'validation',
    icon: CheckCircle2,
  },
  {
    id: 10,
    text: 'Nouvel assureur Generali connecte a la plateforme',
    time: 'Hier, 18:42',
    type: 'onboarding',
    icon: Building2,
  },
];

// ─── KPI Card ────────────────────────────────────────────────────────────────

function KPICard({ label, value, icon: Icon, accent, accentTo, trend, trendUp }: KPIItem) {
  return (
    <div
      className={cn(
        'group relative overflow-hidden',
        'bg-white dark:bg-[#1A0A3E]/40 border border-border/60 rounded-xl p-5',
        'flex items-start gap-4',
        'shadow-sm hover:shadow-md',
        'transition-all duration-200 ease-out',
        'hover:-translate-y-0.5',
      )}
    >
      {/* Top gradient accent */}
      <div
        className="absolute inset-x-0 top-0 h-[2px] opacity-60 group-hover:opacity-100 transition-opacity duration-200"
        style={{
          background: `linear-gradient(90deg, ${accent}, ${accentTo}88)`,
        }}
      />

      <div
        className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ring-1 ring-black/5 dark:ring-white/10"
        style={{
          background: `linear-gradient(135deg, ${accent}14, ${accent}08)`,
          color: accent,
        }}
      >
        <Icon size={18} strokeWidth={2} className="text-current" />
      </div>

      <div className="flex flex-col gap-1 min-w-0">
        <span className="text-ink-3 dark:text-ink-3 text-[11px] uppercase tracking-widest font-body font-semibold">
          {label}
        </span>
        <span className="font-display text-2xl font-bold text-ink dark:text-white leading-none tracking-tight">
          {value}
        </span>
        {trend && (
          <span
            className={cn(
              'text-[10px] font-body font-bold flex items-center gap-0.5 mt-0.5',
              trendUp ? 'text-[#00B894]' : 'text-[#E74C3C]',
            )}
          >
            <ArrowUpRight
              size={10}
              className={cn(!trendUp && 'rotate-90')}
            />
            {trend}
            <span className="text-ink-3 font-semibold ml-0.5">vs mois dernier</span>
          </span>
        )}
      </div>
    </div>
  );
}

// ─── Section Header ──────────────────────────────────────────────────────────

function SectionHeader({
  icon: Icon,
  title,
  iconColor = VIOLET,
}: {
  icon: LucideIcon;
  title: string;
  iconColor?: string;
}) {
  return (
    <div className="flex items-center gap-2 mb-5">
      <Icon size={16} style={{ color: iconColor }} />
      <h2 className="font-display text-base font-bold text-ink dark:text-white uppercase tracking-wide">
        {title}
      </h2>
    </div>
  );
}

// ─── Page Component ──────────────────────────────────────────────────────────

export default function AdminStatsPage() {
  const [selectedMonth, setSelectedMonth] = useState<number | null>(null);

  return (
    <main className="w-full animate-fade-in">
      {/* ── Header ──────────────────────────────────────────────────────── */}
      <PageHeader
        icon={BarChart3}
        title="Statistiques plateforme"
        subtitle="Tableau de bord analytique complet"
        accentFrom={VIOLET}
        accentTo={DARK}
      >
        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-violet-pale/50 dark:bg-violet/10 border border-violet/10 text-violet text-[11px] font-semibold font-body">
          <CalendarDays size={12} />
          Avril 2026
        </span>
      </PageHeader>

      {/* ── KPI Cards ───────────────────────────────────────────────────── */}
      <section aria-label="Indicateurs cles" className="mb-10">
        <SectionHeader icon={TrendingUp} title="Indicateurs cles" iconColor={VIOLET} />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {KPI_DATA.map((kpi) => (
            <KPICard key={kpi.label} {...kpi} />
          ))}
        </div>
      </section>

      {/* ── Activity Chart ──────────────────────────────────────────────── */}
      <section aria-label="Activite mensuelle" className="mb-10">
        <SectionHeader icon={Activity} title="Activite mensuelle (engagements)" iconColor={TEAL} />
        <div className="bg-white dark:bg-[#1A0A3E]/40 border border-border/60 rounded-xl p-6 shadow-sm">
          {/* Chart container */}
          <div className="flex items-end gap-3 h-[200px]">
            {CHART_VALUES.map((val, i) => {
              const heightPct = (val / CHART_MAX) * 100;
              const isSelected = selectedMonth === i;
              const isHovered = selectedMonth === null || selectedMonth === i;

              return (
                <div
                  key={CHART_MONTHS[i]}
                  className="flex-1 flex flex-col items-center gap-2 cursor-pointer group"
                  onMouseEnter={() => setSelectedMonth(i)}
                  onMouseLeave={() => setSelectedMonth(null)}
                >
                  {/* Value label */}
                  <span
                    className={cn(
                      'font-display text-xs font-bold transition-all duration-200',
                      isSelected
                        ? 'text-[#3B1FA8] dark:text-[#C9BCFF] opacity-100 -translate-y-1'
                        : 'text-ink-3 opacity-0 group-hover:opacity-100',
                    )}
                  >
                    {val}
                  </span>

                  {/* Bar */}
                  <div className="w-full flex justify-center" style={{ height: '160px' }}>
                    <div
                      className={cn(
                        'w-full max-w-[48px] rounded-t-lg transition-all duration-300 ease-out relative overflow-hidden',
                        isHovered ? 'opacity-100' : 'opacity-50',
                      )}
                      style={{
                        height: `${heightPct}%`,
                        background: isSelected
                          ? `linear-gradient(180deg, ${VIOLET}, ${TEAL})`
                          : `linear-gradient(180deg, ${VIOLET}CC, ${VIOLET}44)`,
                      }}
                    >
                      {/* Shine effect on hover */}
                      <div
                        className={cn(
                          'absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent',
                          'translate-x-[-100%] group-hover:translate-x-[100%]',
                          'transition-transform duration-700 ease-out',
                        )}
                      />
                    </div>
                  </div>

                  {/* Month label */}
                  <span
                    className={cn(
                      'font-body text-[11px] font-semibold uppercase tracking-wider transition-colors duration-200',
                      isSelected ? 'text-[#3B1FA8] dark:text-[#C9BCFF]' : 'text-ink-3',
                    )}
                  >
                    {CHART_MONTHS[i]}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Chart summary */}
          <div className="mt-5 pt-4 border-t border-border/60 flex items-center justify-between">
            <span className="font-body text-xs text-ink-3">
              Total sur la periode :{' '}
              <span className="font-bold text-ink dark:text-white">
                {CHART_VALUES.reduce((a, b) => a + b, 0)} engagements
              </span>
            </span>
            <span className="inline-flex items-center gap-1 text-[10px] font-body font-bold text-[#00B894]">
              <ArrowUpRight size={10} />
              +54% vs semestre precedent
            </span>
          </div>
        </div>
      </section>

      {/* ── Two-column layout: Top CGPs + Activity Log ──────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* ── Top CGPs Table ──────────────────────────────────────────── */}
        <section aria-label="Top CGPs">
          <SectionHeader icon={Users} title="Top CGPs" iconColor={VIOLET} />
          <div className="bg-white dark:bg-[#1A0A3E]/40 border border-border/60 rounded-xl shadow-sm overflow-hidden">
            {/* Table header */}
            <div className="grid grid-cols-[1fr_auto_auto_auto] gap-4 px-5 py-3 bg-surface-2/50 dark:bg-[#1A0A3E]/60 border-b border-border/60">
              <span className="font-body text-[10px] font-bold uppercase tracking-widest text-ink-3">
                Nom / Cabinet
              </span>
              <span className="font-body text-[10px] font-bold uppercase tracking-widest text-ink-3 text-right w-[80px]">
                Volume
              </span>
              <span className="font-body text-[10px] font-bold uppercase tracking-widest text-ink-3 text-center w-[32px]">
                Nb
              </span>
              <span className="font-body text-[10px] font-bold uppercase tracking-widest text-ink-3 text-right w-[80px]">
                Activite
              </span>
            </div>

            {/* Table rows */}
            {TOP_CGPS.map((cgp, i) => (
              <div
                key={cgp.nom}
                className={cn(
                  'grid grid-cols-[1fr_auto_auto_auto] gap-4 px-5 py-3.5 items-center',
                  'hover:bg-violet-pale/30 dark:hover:bg-violet/5 transition-colors duration-150',
                  i < TOP_CGPS.length - 1 && 'border-b border-border/40',
                )}
              >
                <div className="flex items-center gap-3 min-w-0">
                  {/* Rank badge */}
                  <div
                    className={cn(
                      'w-6 h-6 rounded-md flex items-center justify-center shrink-0',
                      'font-display text-[10px] font-bold',
                      i === 0
                        ? 'bg-gradient-to-br from-[#D4A017] to-[#E8B84A] text-white'
                        : i === 1
                          ? 'bg-gradient-to-br from-[#9CA3AF] to-[#D1D5DB] text-white'
                          : i === 2
                            ? 'bg-gradient-to-br from-[#B87333] to-[#D4956A] text-white'
                            : 'bg-surface-2 dark:bg-white/5 text-ink-3',
                    )}
                  >
                    {i + 1}
                  </div>
                  <div className="min-w-0">
                    <p className="font-body text-sm font-semibold text-ink dark:text-white truncate">
                      {cgp.nom}
                    </p>
                    <p className="font-body text-[10px] text-ink-3 truncate">
                      {cgp.cabinet}
                    </p>
                  </div>
                </div>

                <span className="font-display text-sm font-bold text-ink dark:text-white text-right w-[80px]">
                  {cgp.volume}
                </span>

                <span className="font-display text-sm font-bold text-[#3B1FA8] dark:text-[#C9BCFF] text-center w-[32px]">
                  {cgp.engagements}
                </span>

                <span className="font-body text-[11px] text-ink-3 text-right w-[80px]">
                  {cgp.derniereActivite}
                </span>
              </div>
            ))}
          </div>
        </section>

        {/* ── Activity Log ────────────────────────────────────────────── */}
        <section aria-label="Activite recente">
          <SectionHeader icon={Clock} title="Activite recente" iconColor={GOLD} />
          <div className="bg-white dark:bg-[#1A0A3E]/40 border border-border/60 rounded-xl shadow-sm overflow-hidden">
            {ACTIVITY_LOG.map((item, i) => {
              const config = ACTIVITY_TYPE_CONFIG[item.type];
              const Icon = item.icon;

              return (
                <div
                  key={item.id}
                  className={cn(
                    'flex items-start gap-3 px-5 py-3.5',
                    'hover:bg-violet-pale/30 dark:hover:bg-violet/5 transition-colors duration-150',
                    i < ACTIVITY_LOG.length - 1 && 'border-b border-border/40',
                  )}
                >
                  {/* Timeline dot and line */}
                  <div className="flex flex-col items-center shrink-0 pt-0.5">
                    <div
                      className={cn(
                        'w-7 h-7 rounded-lg flex items-center justify-center',
                        'ring-1 ring-black/5 dark:ring-white/10',
                      )}
                      style={{
                        background:
                          item.type === 'engagement'
                            ? `linear-gradient(135deg, ${VIOLET}14, ${VIOLET}08)`
                            : item.type === 'onboarding'
                              ? `linear-gradient(135deg, ${TEAL}14, ${TEAL}08)`
                              : item.type === 'product'
                                ? `linear-gradient(135deg, ${GOLD}14, ${GOLD}08)`
                                : item.type === 'alert'
                                  ? 'linear-gradient(135deg, #E74C3C14, #E74C3C08)'
                                  : `linear-gradient(135deg, #3D63F514, #3D63F508)`,
                        color:
                          item.type === 'engagement'
                            ? VIOLET
                            : item.type === 'onboarding'
                              ? TEAL
                              : item.type === 'product'
                                ? GOLD
                                : item.type === 'alert'
                                  ? '#E74C3C'
                                  : '#3D63F5',
                      }}
                    >
                      <Icon size={13} strokeWidth={2.5} className="text-current" />
                    </div>
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <p className="font-body text-[12.5px] text-ink dark:text-white/90 leading-snug">
                      {item.text}
                    </p>
                    <div className="flex items-center gap-2 mt-1.5">
                      <Badge variant={config.badgeVariant} size="sm">
                        {config.badge}
                      </Badge>
                      <span className="font-body text-[10px] text-ink-3">
                        {item.time}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      </div>
    </main>
  );
}
