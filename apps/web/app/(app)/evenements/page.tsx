'use client';

import { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import { Calendar, Eye, DollarSign, RefreshCw, ArrowRight, ArrowLeft, Search, X, CalendarX } from 'lucide-react';
import { cn } from '@/lib/cn';
import { PageHeader } from '@/components/ui/page-header';
import { useProducts } from '@/hooks/use-products';

// --- Types -------------------------------------------------------------------

interface ProductEvent {
  date: string;
  type: 'closing' | 'observation' | 'coupon' | 'autocall';
  productId: string;
  productName: string;
  productIsin: string;
  detail?: string;
}

type EventFilter = 'all' | 'closing' | 'observation' | 'coupon' | 'autocall';

// --- Constants ---------------------------------------------------------------

const EVENT_CONFIG: Record<string, { icon: typeof Calendar; label: string; color: string; bg: string }> = {
  closing: { icon: Calendar, label: 'Clôture', color: '#E8334A', bg: '#FFF0F2' },
  observation: { icon: Eye, label: 'Observation', color: '#3B1FA8', bg: '#F0ECFF' },
  coupon: { icon: DollarSign, label: 'Coupon', color: '#00B894', bg: '#E6FAF5' },
  autocall: { icon: RefreshCw, label: 'Autocall potentiel', color: '#D4A017', bg: '#FFF8E7' },
};

const FILTER_OPTIONS: { value: EventFilter; label: string }[] = [
  { value: 'all', label: 'Tous' },
  { value: 'closing', label: 'Clôtures' },
  { value: 'observation', label: 'Observations' },
  { value: 'coupon', label: 'Coupons' },
  { value: 'autocall', label: 'Autocalls' },
];

// --- Helpers -----------------------------------------------------------------

function formatDateShort(iso: string): string {
  return new Date(iso).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' });
}

function getWeekLabel(iso: string): string {
  const date = new Date(iso);
  const monday = new Date(date);
  monday.setDate(date.getDate() - ((date.getDay() + 6) % 7));
  return `Semaine du ${monday.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' })}`;
}

function daysUntil(iso: string): number {
  return Math.ceil((new Date(iso).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
}

function isToday(iso: string): boolean {
  const d = new Date(iso);
  const now = new Date();
  return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth() && d.getDate() === now.getDate();
}

// --- Page --------------------------------------------------------------------

export default function EventsPage() {
  useEffect(() => { document.title = "Événements | Strick'in"; }, []);
  const [filter, setFilter] = useState<EventFilter>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const { data: productsData, isLoading } = useProducts({});

  const products = productsData?.data ?? [];

  // Build events from product data
  const events = useMemo(() => {
    const evts: ProductEvent[] = [];
    const now = new Date();

    for (const p of products as any[]) {
      // Closing events
      if (p.shelfClosingDate && new Date(p.shelfClosingDate) > now) {
        evts.push({
          date: p.shelfClosingDate,
          type: 'closing',
          productId: p.id,
          productName: p.name,
          productIsin: p.isin,
          detail: `Clôture de l'étagère`,
        });
      }

      // Observation dates -> both observation + potential autocall
      if (Array.isArray(p.observationDates)) {
        for (const d of p.observationDates) {
          if (new Date(d) > now) {
            evts.push({
              date: d,
              type: 'observation',
              productId: p.id,
              productName: p.name,
              productIsin: p.isin,
              detail: 'Date de constatation',
            });

            // If product has autocall barrier, add autocall event
            if (p.autocallBarrierPct != null) {
              evts.push({
                date: d,
                type: 'autocall',
                productId: p.id,
                productName: p.name,
                productIsin: p.isin,
                detail: `Autocall si cours >= ${p.autocallBarrierPct}%`,
              });
            }

            // If product has coupon, add coupon event
            if (p.couponPct != null && p.couponPct > 0) {
              evts.push({
                date: d,
                type: 'coupon',
                productId: p.id,
                productName: p.name,
                productIsin: p.isin,
                detail: `Coupon conditionnel ${p.couponPct}%`,
              });
            }
          }
        }
      }
    }

    evts.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    return evts;
  }, [products]);

  // Apply type filter + search query
  const filtered = useMemo(() => {
    let result = filter === 'all' ? events : events.filter((e) => e.type === filter);

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(
        (e) =>
          e.productName.toLowerCase().includes(q) ||
          e.productIsin?.toLowerCase().includes(q) ||
          EVENT_CONFIG[e.type]?.label.toLowerCase().includes(q) ||
          e.type.toLowerCase().includes(q),
      );
    }

    return result;
  }, [events, filter, searchQuery]);

  // Group by week
  const weeks = useMemo(() => {
    const grouped = new Map<string, ProductEvent[]>();
    for (const evt of filtered) {
      const key = getWeekLabel(evt.date);
      if (!grouped.has(key)) grouped.set(key, []);
      grouped.get(key)!.push(evt);
    }
    return Array.from(grouped.entries());
  }, [filtered]);

  return (
    <div className="w-full animate-fade-in">
      <PageHeader
        icon={Calendar}
        title="Événements"
        subtitle="Tous les événements à venir sur vos produits structurés."
        accentFrom="#3B1FA8"
        accentTo="#1A0A3E"
        className="mb-4"
      />

      {/* Search Bar */}
      <div className="mb-4">
        <div className="relative max-w-md">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-3/50 dark:text-white/30 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Rechercher par produit, ISIN ou type..."
            className={cn(
              'w-full h-9 pl-9 pr-8 rounded-xl font-body text-[12px]',
              'bg-white/80 dark:bg-white/5 backdrop-blur-md',
              'border border-border/60 dark:border-white/10',
              'text-ink dark:text-white placeholder:text-ink-3/40 dark:placeholder:text-white/25',
              'focus:outline-none focus:ring-2 focus:ring-[#3B1FA8]/20 focus:border-[#3B1FA8]/40',
              'shadow-sm transition-all duration-200',
            )}
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 rounded-md hover:bg-ink/[0.06] dark:hover:bg-white/10 transition-colors"
              aria-label="Effacer la recherche"
            >
              <X size={12} className="text-ink-3/60 dark:text-white/40" />
            </button>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-1.5 mb-5 flex-wrap">
        {FILTER_OPTIONS.map(({ value, label }) => {
          const config = value === 'all' ? null : EVENT_CONFIG[value];
          const count = value === 'all' ? events.length : events.filter((e) => e.type === value).length;
          const isActive = filter === value;

          return (
            <button
              key={value}
              onClick={() => setFilter(value)}
              className={cn(
                'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] font-semibold font-body',
                'transition-all duration-200 whitespace-nowrap',
                isActive
                  ? 'bg-gradient-to-r from-[#3B1FA8] to-[#1A0A3E] text-white shadow-md shadow-[#3B1FA8]/20'
                  : [
                      'bg-white/80 dark:bg-white/5 backdrop-blur-md border border-border/60',
                      'text-ink-3 hover:text-[#3B1FA8] dark:hover:text-[#C9BCFF]',
                      'hover:border-[#3B1FA8]/30 hover:shadow-sm',
                      'shadow-sm',
                    ],
              )}
            >
              {config && (
                <config.icon
                  size={11}
                  style={isActive ? undefined : { color: config.color }}
                />
              )}
              {label}
              {count > 0 && (
                <span
                  className={cn(
                    'inline-flex items-center justify-center h-[16px] min-w-[16px] px-1 rounded-full text-[9px] font-bold',
                    isActive
                      ? 'bg-white/20 text-white'
                      : 'bg-[#3B1FA8]/8 text-[#3B1FA8] dark:bg-white/10 dark:text-[#C9BCFF]',
                  )}
                >
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Timeline */}
      {isLoading ? (
        <div className="space-y-5 animate-pulse">
          {[1, 2, 3].map((i) => (
            <div key={i}>
              <div className="h-3 w-44 bg-surface-2 dark:bg-white/5 rounded-lg mb-3" />
              <div className="space-y-2 pl-6">
                <div className="h-[64px] bg-white/80 dark:bg-white/5 border border-border/40 rounded-xl" />
                <div className="h-[64px] bg-white/80 dark:bg-white/5 border border-border/40 rounded-xl" />
              </div>
            </div>
          ))}
        </div>
      ) : weeks.length === 0 ? (
        /* Empty state */
        <div className="flex flex-col items-center justify-center py-20 gap-4 bg-white/80 dark:bg-white/5 backdrop-blur-md rounded-xl border border-border/60 shadow-card">
          <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-[#3B1FA8]/10 to-[#E8334A]/10 flex items-center justify-center ring-1 ring-[#3B1FA8]/10">
            <CalendarX size={24} className="text-[#3B1FA8] opacity-40" />
          </div>
          <div className="text-center">
            <p className="font-display text-[15px] font-bold text-ink dark:text-white">
              Aucun événement trouvé
            </p>
            <p className="font-body text-[12px] text-ink-3 dark:text-white/40 mt-1 max-w-sm">
              {searchQuery
                ? `Aucun résultat pour "${searchQuery}". Essayez un autre terme ou ajustez vos filtres.`
                : filter !== 'all'
                  ? 'Aucun événement pour ce type. Essayez de modifier le filtre ou sélectionnez "Tous".'
                  : 'Les événements apparaîtront ici lorsque des produits auront des dates futures.'}
            </p>
            {(searchQuery || filter !== 'all') && (
              <button
                onClick={() => {
                  setSearchQuery('');
                  setFilter('all');
                }}
                className={cn(
                  'mt-3 inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg',
                  'text-[11px] font-semibold font-body',
                  'bg-[#3B1FA8]/[0.06] dark:bg-[#3B1FA8]/15',
                  'text-[#3B1FA8] dark:text-[#C9BCFF]',
                  'hover:bg-[#3B1FA8]/10 dark:hover:bg-[#3B1FA8]/25',
                  'ring-1 ring-[#3B1FA8]/10 dark:ring-[#3B1FA8]/25',
                  'transition-all duration-150',
                )}
              >
                Réinitialiser les filtres
              </button>
            )}
          </div>
        </div>
      ) : (
        <div className="space-y-6 stagger-children">
          {weeks.map(([weekLabel, weekEvents]) => (
            <div key={weekLabel}>
              {/* Week header */}
              <div className="flex items-center gap-2.5 mb-3">
                <span className="w-2 h-2 rounded-full bg-gradient-to-br from-[#3B1FA8] to-[#00B894] shadow-sm shadow-[#3B1FA8]/25 ring-2 ring-white dark:ring-[#1A0A3E]" />
                <h3 className="font-display text-[10px] font-bold text-ink dark:text-white uppercase tracking-widest">
                  {weekLabel}
                </h3>
                <div className="flex-1 h-px bg-gradient-to-r from-border/60 to-transparent" />
              </div>

              {/* Events in week */}
              <div className="relative ml-[4px] pl-6 space-y-2">
                {/* Timeline line */}
                <div
                  className="absolute left-0 top-0 bottom-0 w-[2px] rounded-full"
                  style={{
                    background: 'linear-gradient(180deg, #3B1FA8 0%, #00B894 50%, #D4A017 100%)',
                    opacity: 0.25,
                  }}
                />

                {weekEvents.map((evt, i) => {
                  const config = EVENT_CONFIG[evt.type];
                  const Icon = config.icon;
                  const days = daysUntil(evt.date);
                  const isUrgent = evt.type === 'closing' && days <= 30;
                  const isTodayEvent = isToday(evt.date);

                  return (
                    <div key={`${evt.productId}-${evt.type}-${evt.date}-${i}`} className="relative">
                      {/* Timeline dot */}
                      <div className="absolute -left-6 top-1/2 -translate-y-1/2 flex items-center justify-center">
                        {isTodayEvent ? (
                          <div
                            className="w-3.5 h-3.5 rounded-full ring-2 ring-white dark:ring-[#1A0A3E] shadow-md animate-[today-pulse_2s_ease-in-out_infinite]"
                            style={{
                              background: 'linear-gradient(135deg, #3B1FA8, #7B5FE0)',
                              boxShadow: '0 0 12px rgba(59,31,168,0.5)',
                            }}
                          />
                        ) : days <= 7 ? (
                          <div
                            className="w-3 h-3 rounded-full ring-2 ring-white dark:ring-[#1A0A3E] shadow-sm"
                            style={{
                              background: `linear-gradient(135deg, ${config.color}, #3B1FA8)`,
                              boxShadow: `0 0 8px ${config.color}40`,
                            }}
                          />
                        ) : (
                          <div
                            className="w-2 h-2 rounded-full ring-2 ring-white dark:ring-[#1A0A3E]"
                            style={{
                              background: `linear-gradient(135deg, ${config.color}, ${config.color}88)`,
                            }}
                          />
                        )}
                      </div>

                      {/* Event card */}
                      <Link
                        href={`/products/${evt.productId}`}
                        className={cn(
                          'group block rounded-xl border p-3.5 transition-all duration-200',
                          'bg-white/80 dark:bg-white/5 backdrop-blur-md',
                          'shadow-card hover:shadow-card-hover hover:-translate-y-0.5',
                          'border-border/60 hover:border-[#3B1FA8]/30',
                          isUrgent && 'ring-1 ring-[#E8334A]/20 bg-[#E8334A]/[0.02]',
                          isTodayEvent && 'ring-2 ring-[#3B1FA8]/25 bg-[#3B1FA8]/[0.03] dark:bg-[#3B1FA8]/[0.06] shadow-md shadow-[#3B1FA8]/10',
                        )}
                      >
                        {/* Left accent border */}
                        <div
                          className="absolute left-0 top-2.5 bottom-2.5 w-[3px] rounded-full"
                          style={{ backgroundColor: isTodayEvent ? '#3B1FA8' : config.color }}
                        />

                        <div className="flex items-center gap-3 pl-1">
                          {/* Icon */}
                          <div
                            className={cn(
                              'w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ring-1 ring-black/5 dark:ring-white/10',
                              isTodayEvent && 'animate-[today-pulse_2s_ease-in-out_infinite]',
                            )}
                            style={{
                              background: `linear-gradient(135deg, ${config.bg}, ${config.bg}cc)`,
                            }}
                          >
                            <Icon size={14} style={{ color: config.color }} />
                          </div>

                          {/* Content */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5 mb-0.5 flex-wrap">
                              <span
                                className="text-[9px] font-bold font-body uppercase tracking-wider rounded-md px-1.5 py-0.5"
                                style={{
                                  backgroundColor: `${config.color}12`,
                                  color: config.color,
                                  border: `1px solid ${config.color}18`,
                                }}
                              >
                                {config.label}
                              </span>
                              <span className="text-[11px] text-ink dark:text-white font-mono font-semibold tabular-nums">
                                {formatDateShort(evt.date)}
                              </span>
                              {/* Today pill badge */}
                              {isTodayEvent && (
                                <span className="inline-flex items-center gap-1 text-[9px] font-bold text-white bg-gradient-to-r from-[#3B1FA8] to-[#5535C4] px-2 py-0.5 rounded-full shadow-sm shadow-[#3B1FA8]/30 animate-[today-pulse_2s_ease-in-out_infinite]">
                                  Aujourd&apos;hui
                                </span>
                              )}
                              {isUrgent && !isTodayEvent && (
                                <span className="text-[9px] font-bold text-white bg-gradient-to-r from-[#E8334A] to-[#E8334A]/80 px-1.5 py-0.5 rounded-md shadow-sm animate-pulse">
                                  J-{days}
                                </span>
                              )}
                            </div>
                            <p className="text-[13px] font-semibold text-ink dark:text-white font-body truncate group-hover:text-[#3B1FA8] dark:group-hover:text-[#C9BCFF] transition-colors duration-200">
                              {evt.productName}
                            </p>
                            {evt.detail && (
                              <p className="text-[11px] text-ink-3 dark:text-white/40 font-body mt-0.5">{evt.detail}</p>
                            )}
                          </div>

                          {/* Arrow */}
                          <ArrowRight
                            size={13}
                            className="text-ink-3/30 group-hover:text-[#3B1FA8] group-hover:translate-x-0.5 transition-all duration-200 shrink-0"
                          />
                        </div>
                      </Link>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Keyframe for today pulse */}
      <style jsx>{`
        @keyframes today-pulse {
          0%, 100% { box-shadow: 0 0 0 0 rgba(59,31,168,0.25); }
          50% { box-shadow: 0 0 0 6px rgba(59,31,168,0); }
        }
      `}</style>
    </div>
  );
}
