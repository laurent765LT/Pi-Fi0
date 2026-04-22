'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  CalendarDays,
  LayoutGrid,
  List,
  Bell,
  Megaphone,
  TrendingUp,
  Filter,
  X,
} from 'lucide-react';
import { cn } from '@/lib/cn';
import { PageHeader } from '@/components/ui/page-header';
import { Badge } from '@/components/ui/badge';
import {
  useEmissionsStore,
  EMISSION_TYPE_LABELS,
  type EmissionIssuer,
  type EmissionType,
  type UpcomingEmission,
} from '@/stores/emissions-store';
import { EmissionCard } from '@/components/emissions/EmissionCard';
import { EmissionsCalendar } from '@/components/emissions/EmissionsCalendar';

type ViewMode = 'calendar' | 'list';

const ALL_ISSUERS: EmissionIssuer[] = [
  'BNP Paribas',
  'Société Générale',
  'Natixis',
  'Goldman Sachs',
  'Marex',
];

const ALL_TYPES: EmissionType[] = [
  'AUTOCALL_PHOENIX',
  'AUTOCALL_COUPON',
  'CAPITAL_PROTECTED',
  'CONDITIONAL_RATE',
  'BARRIER_NOTE',
];

function KpiTile({
  icon,
  label,
  value,
  accent,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  accent: string;
}) {
  return (
    <div
      className={cn(
        'relative flex items-center gap-3 rounded-xl border border-border/60 dark:border-white/10 p-3.5',
        'bg-white/80 dark:bg-white/5 backdrop-blur-md',
        'shadow-card hover:shadow-card-hover transition-all duration-200',
      )}
    >
      <div
        className="absolute top-0 left-0 right-0 h-[2px] rounded-t-xl opacity-70"
        style={{ background: `linear-gradient(90deg, ${accent}, ${accent}80)` }}
      />
      <div
        className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ring-1 ring-black/[0.04] dark:ring-white/[0.08]"
        style={{ background: `${accent}14` }}
      >
        {icon}
      </div>
      <div className="min-w-0 flex-1">
        <div className="text-[10px] uppercase tracking-widest font-body text-ink-3 dark:text-white/50 font-bold">
          {label}
        </div>
        <div className="font-display text-xl font-bold text-ink dark:text-white leading-tight tabular-nums">
          {value}
        </div>
      </div>
    </div>
  );
}

function MultiChip<T extends string>({
  options,
  labelOf,
  value,
  onChange,
  placeholder,
}: {
  options: readonly T[];
  labelOf: (opt: T) => string;
  value: T[];
  onChange: (next: T[]) => void;
  placeholder: string;
}) {
  function toggle(opt: T) {
    if (value.includes(opt)) onChange(value.filter((v) => v !== opt));
    else onChange([...value, opt]);
  }
  return (
    <div className="flex flex-wrap gap-1.5">
      {options.map((opt) => {
        const active = value.includes(opt);
        return (
          <button
            key={opt}
            type="button"
            onClick={() => toggle(opt)}
            aria-pressed={active}
            className={cn(
              'h-7 px-2.5 rounded-full text-[11px] font-body font-semibold border transition-all',
              active
                ? 'bg-violet text-white border-violet shadow-xs'
                : 'bg-white dark:bg-white/5 text-ink-2 dark:text-white/70 border-border dark:border-white/10 hover:border-violet/50',
            )}
          >
            {labelOf(opt)}
          </button>
        );
      })}
      {value.length === 0 && (
        <span className="text-[10px] font-body text-ink-3 dark:text-white/40 italic self-center">
          {placeholder}
        </span>
      )}
    </div>
  );
}

export default function EmissionsPage() {
  useEffect(() => {
    document.title = "Émissions à venir | Strick'in";
  }, []);

  const emissions = useEmissionsStore((s) => s.emissions);
  const alerts = useEmissionsStore((s) => s.alerts);

  const [view, setView] = useState<ViewMode>('calendar');
  const [issuerFilter, setIssuerFilter] = useState<EmissionIssuer[]>([]);
  const [typeFilter, setTypeFilter] = useState<EmissionType[]>([]);
  const [underlyingQuery, setUnderlyingQuery] = useState('');
  const [minTicketMax, setMinTicketMax] = useState(25_000);

  const filtered = useMemo<UpcomingEmission[]>(() => {
    return emissions.filter((em) => {
      if (issuerFilter.length > 0 && !issuerFilter.includes(em.issuer)) return false;
      if (typeFilter.length > 0 && !typeFilter.includes(em.type)) return false;
      if (
        underlyingQuery &&
        !em.underlying.toLowerCase().includes(underlyingQuery.toLowerCase())
      ) {
        return false;
      }
      if (em.minTicket > minTicketMax) return false;
      return true;
    });
  }, [emissions, issuerFilter, typeFilter, underlyingQuery, minTicketMax]);

  // Stats
  const totalAnnounced = emissions.length;
  const thisMonth = useMemo(() => {
    const now = new Date();
    const y = now.getFullYear();
    const m = now.getMonth();
    return emissions.filter((em) => {
      const d = new Date(em.subscriptionStart);
      return d.getFullYear() === y && d.getMonth() === m;
    }).length;
  }, [emissions]);
  const myAlerts = alerts.length;

  const hasFilters =
    issuerFilter.length > 0 || typeFilter.length > 0 || underlyingQuery !== '' || minTicketMax < 25_000;

  return (
    <div className="flex flex-col gap-6 pb-12">
      <PageHeader
        icon={CalendarDays}
        title="Émissions à venir"
        subtitle="Calendrier des prochaines émissions primaires et alertes sur l'ouverture des souscriptions."
      >
        <div className="flex items-center rounded-md border border-border dark:border-white/10 bg-white dark:bg-white/5 p-0.5">
          <button
            type="button"
            onClick={() => setView('calendar')}
            aria-pressed={view === 'calendar'}
            className={cn(
              'flex items-center gap-1.5 h-7 px-3 rounded text-xs font-body font-semibold transition-all',
              view === 'calendar'
                ? 'bg-violet text-white shadow-xs'
                : 'text-ink-2 dark:text-white/70 hover:text-violet',
            )}
          >
            <LayoutGrid size={12} />
            Calendrier
          </button>
          <button
            type="button"
            onClick={() => setView('list')}
            aria-pressed={view === 'list'}
            className={cn(
              'flex items-center gap-1.5 h-7 px-3 rounded text-xs font-body font-semibold transition-all',
              view === 'list'
                ? 'bg-violet text-white shadow-xs'
                : 'text-ink-2 dark:text-white/70 hover:text-violet',
            )}
          >
            <List size={12} />
            Liste
          </button>
        </div>
      </PageHeader>

      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <KpiTile
          icon={<Megaphone size={16} className="text-violet" />}
          label="Total annoncées"
          value={totalAnnounced}
          accent="#3B1FA8"
        />
        <KpiTile
          icon={<TrendingUp size={16} className="text-teal" />}
          label="Ce mois"
          value={thisMonth}
          accent="#00B894"
        />
        <KpiTile
          icon={<Bell size={16} className="text-[#D4A017]" />}
          label="Mes alertes"
          value={myAlerts}
          accent="#D4A017"
        />
      </div>

      {/* Filters card */}
      <div className="rounded-xl border border-border dark:border-white/10 bg-white/80 dark:bg-white/[0.04] backdrop-blur-md p-4 flex flex-col gap-3">
        <div className="flex items-center gap-2 text-[11px] font-body uppercase tracking-widest font-bold text-ink-3 dark:text-white/50">
          <Filter size={12} />
          Filtres
          {hasFilters && (
            <button
              type="button"
              onClick={() => {
                setIssuerFilter([]);
                setTypeFilter([]);
                setUnderlyingQuery('');
                setMinTicketMax(25_000);
              }}
              className="ml-auto inline-flex items-center gap-1 h-6 px-2 rounded-md text-[10px] font-body font-semibold text-violet hover:bg-violet-pale"
            >
              <X size={10} />
              Réinitialiser
            </button>
          )}
        </div>

        {/* Issuer */}
        <div className="flex flex-col gap-1.5">
          <label className="text-[10px] uppercase tracking-widest font-body font-bold text-ink-3 dark:text-white/40">
            Émetteur
          </label>
          <MultiChip<EmissionIssuer>
            options={ALL_ISSUERS}
            labelOf={(x) => x}
            value={issuerFilter}
            onChange={setIssuerFilter}
            placeholder="Tous les émetteurs"
          />
        </div>

        {/* Type */}
        <div className="flex flex-col gap-1.5">
          <label className="text-[10px] uppercase tracking-widest font-body font-bold text-ink-3 dark:text-white/40">
            Type de produit
          </label>
          <MultiChip<EmissionType>
            options={ALL_TYPES}
            labelOf={(t) => EMISSION_TYPE_LABELS[t]}
            value={typeFilter}
            onChange={setTypeFilter}
            placeholder="Tous les types"
          />
        </div>

        {/* Underlying + ticket slider on same row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] uppercase tracking-widest font-body font-bold text-ink-3 dark:text-white/40">
              Sous-jacent
            </label>
            <input
              type="text"
              value={underlyingQuery}
              onChange={(e) => setUnderlyingQuery(e.target.value)}
              placeholder="Ex. Euro Stoxx, Nasdaq, Or…"
              className={cn(
                'h-9 rounded-md border border-border dark:border-white/10 bg-white dark:bg-white/5 px-3',
                'text-sm font-body text-ink dark:text-white',
                'placeholder:text-ink-3/60',
                'focus:outline-none focus:ring-2 focus:ring-violet/30 focus:border-violet',
              )}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="flex items-center justify-between text-[10px] uppercase tracking-widest font-body font-bold text-ink-3 dark:text-white/40">
              <span>Ticket minimum max.</span>
              <span className="font-display text-xs font-bold text-violet dark:text-[#C9BCFF] normal-case tracking-normal tabular-nums">
                {new Intl.NumberFormat('fr-FR').format(minTicketMax)} €
              </span>
            </label>
            <input
              type="range"
              min={5_000}
              max={25_000}
              step={5_000}
              value={minTicketMax}
              onChange={(e) => setMinTicketMax(Number(e.target.value))}
              className="w-full accent-violet"
            />
          </div>
        </div>

        <div className="flex items-center justify-between pt-1 border-t border-border/60 dark:border-white/5">
          <span className="text-xs font-body text-ink-3 dark:text-white/50">
            {filtered.length} émission{filtered.length > 1 ? 's' : ''}{' '}
            {filtered.length > 0 ? 'affichée(s)' : 'trouvée(s)'}
          </span>
          {myAlerts > 0 && (
            <Badge variant="teal" size="sm">
              {myAlerts} alerte{myAlerts > 1 ? 's' : ''} active{myAlerts > 1 ? 's' : ''}
            </Badge>
          )}
        </div>
      </div>

      {/* Content */}
      {view === 'calendar' ? (
        <EmissionsCalendar emissions={filtered} />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
          {filtered.length === 0 ? (
            <div className="col-span-full rounded-xl border border-dashed border-border dark:border-white/10 py-12 text-center">
              <CalendarDays size={24} className="mx-auto text-ink-3 dark:text-white/30 mb-2" />
              <p className="text-sm font-body text-ink-2 dark:text-white/60">
                Aucune émission ne correspond aux filtres sélectionnés.
              </p>
            </div>
          ) : (
            filtered.map((em) => <EmissionCard key={em.id} emission={em} />)
          )}
        </div>
      )}
    </div>
  );
}
