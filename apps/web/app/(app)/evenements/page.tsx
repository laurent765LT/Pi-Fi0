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
  closing: { icon: Calendar, label: 'Clôture', color: '#C41F36', bg: '#FFF0F2' },
  observation: { icon: Eye, label: 'Observation', color: '#0A2799', bg: '#E4EAFF' },
  coupon: { icon: DollarSign, label: 'Coupon', color: '#008B6E', bg: '#E6FAF5' },
  autocall: { icon: RefreshCw, label: 'Autocall potentiel', color: '#A07800', bg: '#FFF8E7' },
};

const FILTER_OPTIONS: { value: EventFilter; label: string }[] = [
  { value: 'all', label: 'Tous' },
  { value: 'closing', label: 'Clôtures' },
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
          detail: `Clôture de l'étagère`,
        });
      }

      // Observation dates → both observation + potential autocall
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
                detail: `Autocall si cours ≥ ${p.autocallBarrierPct}%`,
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
    <div className="animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <Link href="/dashboard" className="flex items-center justify-center w-8 h-8 rounded-full bg-gradient-to-br from-[#3B1FA8]/10 to-[#00B894]/10 hover:from-[#3B1FA8]/20 hover:to-[#00B894]/20 text-[#3B1FA8] transition-all duration-300">
              <ArrowLeft size={16} />
            </Link>
            <h1 className="font-display text-[28px] font-bold leading-tight bg-gradient-to-r from-[#3B1FA8] via-[#1A0A3E] to-[#3B1FA8] bg-clip-text text-transparent">
              Événements
            </h1>
          </div>
          <p className="text-sm text-ink-3 font-body ml-7">
            Tous les événements à venir sur vos produits structurés.
          </p>
        </div>
        <span className="text-sm font-mono text-white bg-gradient-to-r from-[#3B1FA8] to-[#00B894] border-0 rounded-full px-4 py-1.5 shadow-md">
          {filtered.length} événement{filtered.length > 1 ? 's' : ''}
        </span>
      </div>

      <div className="h-[2px] rounded-full mb-5" style={{ background: "linear-gradient(90deg, #3B1FA8, #00B894, #D4A017, #E8334A, #3B1FA8)" }} />

      {/* Filters */}
      <div className="flex items-center gap-2 mb-6 flex-wrap">
        {FILTER_OPTIONS.map(({ value, label }) => {
          const config = value === 'all' ? null : EVENT_CONFIG[value];
          const count = value === 'all' ? events.length : events.filter((e) => e.type === value).length;
          return (
            <button
              key={value}
              onClick={() => setFilter(value)}
              className={cn(
                'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[12px] font-semibold font-body',
                'transition-all duration-200 whitespace-nowrap',
                filter === value
                  ? 'bg-gradient-to-r from-[#3B1FA8] to-[#1A0A3E] text-white shadow-lg shadow-[#3B1FA8]/25 scale-105'
                  : 'bg-white/80 backdrop-blur-sm border border-border/80 text-ink-3 hover:border-[#3B1FA8]/40 hover:text-[#3B1FA8] hover:shadow-sm hover:scale-[1.02]',
              )}
            >
              {config && <config.icon size={12} />}
              {label}
              {count > 0 && (
                <span className={cn(
                  'inline-flex items-center justify-center h-4 min-w-4 px-1 rounded-full text-[9px] font-bold',
                  filter === value ? 'bg-white/30 text-white ring-1 ring-white/20' : 'bg-[#3B1FA8]/10 text-[#3B1FA8]',
                )}>
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Timeline */}
      {isLoading ? (
        <div className="space-y-6 animate-pulse opacity-60">
          {[1, 2, 3].map((i) => (
            <div key={i}>
              <div className="h-4 w-48 bg-surface-2 rounded mb-3" />
              <div className="space-y-2">
                <div className="h-16 bg-surface-2 rounded-lg" />
                <div className="h-16 bg-surface-2 rounded-lg" />
              </div>
            </div>
          ))}
        </div>
      ) : weeks.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 gap-3 bg-white/70 backdrop-blur-sm rounded-2xl border border-white/60 shadow-lg">
          <div className="w-14 h-14 rounded-full bg-gradient-to-br from-[#3B1FA8]/10 to-[#00B894]/10 flex items-center justify-center"><Calendar size={28} className="text-[#3B1FA8] opacity-60" /></div>
          <p className="font-body text-sm text-ink-3">Aucun événement à venir.</p>
        </div>
      ) : (
        <div className="space-y-8">
          {weeks.map(([weekLabel, weekEvents]) => (
            <div key={weekLabel}>
              <h3 className="font-display text-sm font-bold text-[#1A0A3E] mb-3 flex items-center gap-2 uppercase tracking-wide">
                <span className="w-2.5 h-2.5 rounded-full bg-gradient-to-br from-[#3B1FA8] to-[#00B894] shadow-sm shadow-[#3B1FA8]/30" />
                {weekLabel}
              </h3>

              <div className="relative pl-6 space-y-3" style={{ borderLeft: "2px solid transparent", borderImage: "linear-gradient(to bottom, #3B1FA8, #00B894, #D4A017) 1" }}>
                {weekEvents.map((evt, i) => {
                  const config = EVENT_CONFIG[evt.type];
                  const Icon = config.icon;
                  const days = daysUntil(evt.date);
                  const isUrgent = evt.type === 'closing' && days <= 30;

                  return (
                    <Link
                      key={`${evt.productId}-${evt.type}-${evt.date}-${i}`}
                      href={`/products/${evt.productId}`}
                      className={cn(
                        'block bg-white/70 backdrop-blur-sm rounded-xl border border-white/60 p-4 transition-all duration-300',
                        'hover:shadow-xl hover:shadow-[#3B1FA8]/10 hover:-translate-y-1 hover:border-[#3B1FA8]/30 group',
                        'border-l-[3px]',
                        evt.type === 'closing' ? 'border-l-[#E8334A]' : evt.type === 'observation' ? 'border-l-[#3B1FA8]' : evt.type === 'coupon' ? 'border-l-[#00B894]' : 'border-l-[#D4A017]',
                        isUrgent && 'border-l-[#E8334A] bg-[#E8334A]/5 ring-1 ring-[#E8334A]/20',
                      )}
                    >
                      <div className="flex items-center gap-3">
                        {/* Icon */}
                        <div
                          className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 shadow-sm ring-1 ring-black/5"
                          style={{ background: `linear-gradient(135deg, ${config.bg}, ${config.bg}ee)` }}
                        >
                          <Icon size={16} style={{ color: config.color }} />
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-0.5">
                            <span
                              className="text-[10px] font-bold font-body uppercase tracking-wider rounded-full px-2.5 py-0.5 shadow-sm"
                              style={{ background: `linear-gradient(135deg, ${config.bg}, ${config.color}15)`, color: config.color, border: `1px solid ${config.color}20` }}
                            >
                              {config.label}
                            </span>
                            <span className="text-[12px] text-[#1A0A3E] font-display font-bold tabular-nums">
                              {formatDateShort(evt.date)}
                            </span>
                            {isUrgent && (
                              <span className="text-[10px] font-bold text-white bg-gradient-to-r from-[#E8334A] to-[#E8334A]/80 px-2 py-0.5 rounded-full shadow-sm animate-pulse">
                                J-{days}
                              </span>
                            )}
                          </div>
                          <p className="text-sm font-semibold text-ink font-body truncate group-hover:text-violet transition-colors">
                            {evt.productName}
                          </p>
                          {evt.detail && (
                            <p className="text-xs text-ink-3 font-body mt-0.5">{evt.detail}</p>
                          )}
                        </div>

                        {/* Arrow */}
                        <ArrowRight size={14} className="text-ink-3/40 group-hover:text-violet transition-colors shrink-0" />
                      </div>

                      {/* Timeline dot */}
                      {i === 0 && days <= 7 ? (
                        <div className="absolute -left-[9px] w-4 h-4 rounded-full border-2 border-white shadow-lg animate-pulse" style={{ background: `linear-gradient(135deg, ${config.color}, #3B1FA8)`, marginTop: '-28px' }}>
                          <div className="absolute inset-0 rounded-full animate-ping opacity-30" style={{ backgroundColor: config.color }} />
                        </div>
                      ) : (
                        <div className="absolute -left-[7px] w-3 h-3 rounded-full border-2 border-white shadow-md" style={{ background: `linear-gradient(135deg, ${config.color}, ${config.color}99)`, marginTop: '-28px' }} />
                      )}
                    </Link>
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
