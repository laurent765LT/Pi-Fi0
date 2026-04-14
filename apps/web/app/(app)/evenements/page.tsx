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
    <div className="w-full animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 mb-1.5">
        <div className="flex items-center gap-2.5">
          <Link
            href="/dashboard"
            className={cn(
              'flex items-center justify-center w-9 h-9 rounded-xl',
              'bg-white/80 dark:bg-white/5 backdrop-blur-md border border-border/60',
              'text-ink-3 hover:text-[#3B1FA8] hover:border-[#3B1FA8]/30',
              'shadow-sm hover:shadow-md',
              'transition-all duration-200',
            )}
          >
            <ArrowLeft size={15} />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-display text-[22px] font-bold text-ink dark:text-white leading-tight">
                Evenements
              </h1>
              <span
                className={cn(
                  'inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full',
                  'font-mono text-[12px] font-semibold',
                  'bg-gradient-to-r from-[#3B1FA8] to-[#1A0A3E] text-white',
                  'shadow-sm shadow-[#3B1FA8]/20',
                )}
              >
                {filtered.length}
                <span className="text-white/70 text-[10px] font-body">evt{filtered.length > 1 ? 's' : ''}</span>
              </span>
              <span className="text-[12px] text-ink-3 dark:text-white/40 font-body hidden sm:inline">
                &mdash; Tous les evenements a venir sur vos produits structures.
              </span>
            </div>
          </div>
        </div>
      </div>

      <div
        className="h-[2px] rounded-full mb-4 mt-3"
        style={{
          background: 'linear-gradient(90deg, #3B1FA8, #00B894 40%, #D4A017 70%, transparent)',
        }}
      />

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
        <div className="flex flex-col items-center justify-center py-20 gap-3 bg-white/80 dark:bg-white/5 backdrop-blur-md rounded-xl border border-border/60 shadow-card">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#3B1FA8]/10 to-[#00B894]/10 flex items-center justify-center">
            <Calendar size={20} className="text-[#3B1FA8] opacity-50" />
          </div>
          <div className="text-center">
            <p className="font-display text-[13px] font-bold text-ink dark:text-white">
              Aucun evenement a venir
            </p>
            <p className="font-body text-[11px] text-ink-3 dark:text-white/40 mt-0.5">
              Les evenements apparaitront ici lorsque des produits auront des dates futures.
            </p>
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

                  return (
                    <div key={`${evt.productId}-${evt.type}-${evt.date}-${i}`} className="relative">
                      {/* Timeline dot */}
                      <div className="absolute -left-6 top-1/2 -translate-y-1/2 flex items-center justify-center">
                        {days <= 7 ? (
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
                        )}
                      >
                        {/* Left accent border */}
                        <div
                          className="absolute left-0 top-2.5 bottom-2.5 w-[3px] rounded-full"
                          style={{ backgroundColor: config.color }}
                        />

                        <div className="flex items-center gap-3 pl-1">
                          {/* Icon */}
                          <div
                            className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ring-1 ring-black/5 dark:ring-white/10"
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
                              {isUrgent && (
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
    </div>
  );
}
