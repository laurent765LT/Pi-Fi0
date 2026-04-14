'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { Calendar, Eye, DollarSign, RefreshCw, ArrowRight, ArrowLeft } from 'lucide-react';
import { cn } from '@/lib/cn';
import { useProducts } from '@/hooks/use-products';

// ─── Types ────────────────────────────────────────────────────────────────────

interface ProductEvent {
  date: string;
  type: 'closing' | 'observation' | 'coupon' | 'autocall';
  productId: string;
  productName: string;
  productIsin: string;
  detail?: string;
}

type EventFilter = 'all' | 'closing' | 'observation' | 'coupon' | 'autocall';

// ─── Constants ────────────────────────────────────────────────────────────────

const EVENT_CONFIG: Record<string, { icon: typeof Calendar; label: string; color: string; bg: string }> = {
  closing: { icon: Calendar, label: 'Cloture', color: '#E8334A', bg: '#FFF0F2' },
  observation: { icon: Eye, label: 'Observation', color: '#3B1FA8', bg: '#F0ECFF' },
  coupon: { icon: DollarSign, label: 'Coupon', color: '#00B894', bg: '#E6FAF5' },
  autocall: { icon: RefreshCw, label: 'Autocall potentiel', color: '#D4A017', bg: '#FFF8E7' },
};

const FILTER_OPTIONS: { value: EventFilter; label: string }[] = [
  { value: 'all', label: 'Tous' },
  { value: 'closing', label: 'Clotures' },
  { value: 'observation', label: 'Observations' },
  { value: 'coupon', label: 'Coupons' },
  { value: 'autocall', label: 'Autocalls' },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' });
}

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

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function EventsPage() {
  const [filter, setFilter] = useState<EventFilter>('all');
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
          detail: `Cloture de l'etagere`,
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

  const filtered = filter === 'all' ? events : events.filter((e) => e.type === filter);

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
    <div className="max-w-container mx-auto px-6 py-8 animate-fade-in">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 mb-2">
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard"
            className={cn(
              'flex items-center justify-center w-10 h-10 rounded-xl',
              'bg-white dark:bg-[#1A0A3E]/40 border border-border/60',
              'text-ink-3 hover:text-[#3B1FA8] hover:border-[#3B1FA8]/30',
              'shadow-sm hover:shadow-md',
              'transition-all duration-200',
            )}
          >
            <ArrowLeft size={16} />
          </Link>
          <div>
            <h1 className="font-display text-2xl font-bold text-ink dark:text-white leading-tight">
              Événements
            </h1>
            <p className="text-sm text-ink-3 font-body mt-0.5">
              Tous les evenements a venir sur vos produits structures.
            </p>
          </div>
        </div>

        <span
          className={cn(
            'inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full',
            'font-mono text-sm font-semibold',
            'bg-gradient-to-r from-[#3B1FA8] to-[#1A0A3E] text-white',
            'shadow-sm shadow-[#3B1FA8]/20',
          )}
        >
          {filtered.length}
          <span className="text-white/70 text-xs font-body">
            evenement{filtered.length > 1 ? 's' : ''}
          </span>
        </span>
      </div>

      <div
        className="h-[2px] rounded-full mb-6 mt-4"
        style={{
          background: 'linear-gradient(90deg, #3B1FA8, #00B894 40%, #D4A017 70%, transparent)',
        }}
      />

      {/* Filters */}
      <div className="flex items-center gap-2 mb-8 flex-wrap">
        {FILTER_OPTIONS.map(({ value, label }) => {
          const config = value === 'all' ? null : EVENT_CONFIG[value];
          const count = value === 'all' ? events.length : events.filter((e) => e.type === value).length;
          const isActive = filter === value;

          return (
            <button
              key={value}
              onClick={() => setFilter(value)}
              className={cn(
                'inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-[12px] font-semibold font-body',
                'transition-all duration-200 whitespace-nowrap',
                isActive
                  ? 'bg-gradient-to-r from-[#3B1FA8] to-[#1A0A3E] text-white shadow-md shadow-[#3B1FA8]/20'
                  : [
                      'bg-white dark:bg-[#1A0A3E]/30 border border-border/60',
                      'text-ink-3 hover:text-[#3B1FA8] dark:hover:text-[#C9BCFF]',
                      'hover:border-[#3B1FA8]/30 hover:shadow-sm',
                      'shadow-sm',
                    ],
              )}
            >
              {config && (
                <config.icon
                  size={12}
                  style={isActive ? undefined : { color: config.color }}
                />
              )}
              {label}
              {count > 0 && (
                <span
                  className={cn(
                    'inline-flex items-center justify-center h-[18px] min-w-[18px] px-1 rounded-full text-[9px] font-bold',
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
        <div className="space-y-8 animate-pulse">
          {[1, 2, 3].map((i) => (
            <div key={i}>
              <div className="h-4 w-48 bg-surface-2 dark:bg-white/5 rounded-lg mb-4" />
              <div className="space-y-3 pl-6">
                <div className="h-[72px] bg-white dark:bg-[#1A0A3E]/20 border border-border/40 rounded-xl" />
                <div className="h-[72px] bg-white dark:bg-[#1A0A3E]/20 border border-border/40 rounded-xl" />
              </div>
            </div>
          ))}
        </div>
      ) : weeks.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 gap-4 bg-white/50 dark:bg-[#1A0A3E]/20 backdrop-blur-sm rounded-2xl border border-border/40">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#3B1FA8]/10 to-[#00B894]/10 flex items-center justify-center">
            <Calendar size={24} className="text-[#3B1FA8] opacity-50" />
          </div>
          <div className="text-center">
            <p className="font-display text-sm font-bold text-ink dark:text-white">
              Aucun evenement a venir
            </p>
            <p className="font-body text-xs text-ink-3 mt-1">
              Les evenements apparaitront ici lorsque des produits auront des dates futures.
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-10">
          {weeks.map(([weekLabel, weekEvents]) => (
            <div key={weekLabel}>
              {/* Week header */}
              <div className="flex items-center gap-3 mb-4">
                <span className="w-2.5 h-2.5 rounded-full bg-gradient-to-br from-[#3B1FA8] to-[#00B894] shadow-sm shadow-[#3B1FA8]/25 ring-2 ring-white dark:ring-[#1A0A3E]" />
                <h3 className="font-display text-xs font-bold text-ink dark:text-white uppercase tracking-widest">
                  {weekLabel}
                </h3>
                <div className="flex-1 h-px bg-gradient-to-r from-border/60 to-transparent" />
              </div>

              {/* Events in week */}
              <div className="relative ml-[5px] pl-7 space-y-3">
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

                  return (
                    <div key={`${evt.productId}-${evt.type}-${evt.date}-${i}`} className="relative">
                      {/* Timeline dot */}
                      <div className="absolute -left-7 top-1/2 -translate-y-1/2 flex items-center justify-center">
                        {days <= 7 ? (
                          <div
                            className="w-3.5 h-3.5 rounded-full ring-2 ring-white dark:ring-[#1A0A3E] shadow-sm"
                            style={{
                              background: `linear-gradient(135deg, ${config.color}, #3B1FA8)`,
                              boxShadow: `0 0 8px ${config.color}40`,
                            }}
                          />
                        ) : (
                          <div
                            className="w-2.5 h-2.5 rounded-full ring-2 ring-white dark:ring-[#1A0A3E]"
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
                          'group block rounded-xl border p-4 transition-all duration-200',
                          'bg-white dark:bg-[#1A0A3E]/30',
                          'shadow-sm hover:shadow-md hover:-translate-y-0.5',
                          'border-border/60 hover:border-[#3B1FA8]/30',
                          isUrgent && 'ring-1 ring-[#E8334A]/20 bg-[#E8334A]/[0.02]',
                        )}
                      >
                        {/* Left accent border */}
                        <div
                          className="absolute left-0 top-3 bottom-3 w-[3px] rounded-full"
                          style={{ backgroundColor: config.color }}
                        />

                        <div className="flex items-center gap-3.5 pl-1">
                          {/* Icon */}
                          <div
                            className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ring-1 ring-black/5 dark:ring-white/10"
                            style={{
                              background: `linear-gradient(135deg, ${config.bg}, ${config.bg}cc)`,
                            }}
                          >
                            <Icon size={16} style={{ color: config.color }} />
                          </div>

                          {/* Content */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                              <span
                                className="text-[10px] font-bold font-body uppercase tracking-wider rounded-md px-2 py-0.5"
                                style={{
                                  backgroundColor: `${config.color}12`,
                                  color: config.color,
                                  border: `1px solid ${config.color}18`,
                                }}
                              >
                                {config.label}
                              </span>
                              <span className="text-[12px] text-ink dark:text-white font-mono font-semibold tabular-nums">
                                {formatDateShort(evt.date)}
                              </span>
                              {isUrgent && (
                                <span className="text-[10px] font-bold text-white bg-gradient-to-r from-[#E8334A] to-[#E8334A]/80 px-2 py-0.5 rounded-md shadow-sm animate-pulse">
                                  J-{days}
                                </span>
                              )}
                            </div>
                            <p className="text-sm font-semibold text-ink dark:text-white font-body truncate group-hover:text-[#3B1FA8] dark:group-hover:text-[#C9BCFF] transition-colors duration-200">
                              {evt.productName}
                            </p>
                            {evt.detail && (
                              <p className="text-xs text-ink-3 font-body mt-0.5">{evt.detail}</p>
                            )}
                          </div>

                          {/* Arrow */}
                          <ArrowRight
                            size={14}
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
    </div>
  );
}
