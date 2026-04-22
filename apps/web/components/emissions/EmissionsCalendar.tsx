'use client';

import { useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/cn';
import { Modal } from '@/components/ui/modal';
import {
  ISSUER_COLORS,
  EMISSION_TYPE_LABELS,
  EMISSION_STATUS_LABELS,
  type UpcomingEmission,
} from '@/stores/emissions-store';
import { NotifyMeButton } from './NotifyMeButton';

interface EmissionsCalendarProps {
  emissions: UpcomingEmission[];
  className?: string;
}

const WEEKDAYS = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];
const MONTH_LABELS = [
  'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
  'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre',
];

// Convert ISO "YYYY-MM-DD" to a Date at local midnight, avoiding TZ drift.
function toLocalDate(iso: string): Date {
  const [y, m, d] = iso.slice(0, 10).split('-').map(Number);
  return new Date(y, (m ?? 1) - 1, d ?? 1);
}

function formatDateShort(iso: string): string {
  return toLocalDate(iso).toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: 'short',
  });
}

function sameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

/** Returns all days in a month-view 6x7 grid (Monday-first) including overflow. */
function getMonthGrid(year: number, month: number): Date[] {
  const firstOfMonth = new Date(year, month, 1);
  const firstDow = (firstOfMonth.getDay() + 6) % 7; // Mon = 0
  const start = new Date(year, month, 1 - firstDow);

  const days: Date[] = [];
  for (let i = 0; i < 42; i++) {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    days.push(d);
  }
  return days;
}

function formatEur(amount: number): string {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
    maximumFractionDigits: 0,
  }).format(amount);
}

export function EmissionsCalendar({ emissions, className }: EmissionsCalendarProps) {
  const today = new Date();
  const [view, setView] = useState<{ year: number; month: number }>({
    year: today.getFullYear(),
    month: today.getMonth(),
  });
  const [selected, setSelected] = useState<UpcomingEmission | null>(null);

  const monthStart = useMemo(() => new Date(view.year, view.month, 1), [view]);
  const monthEnd = useMemo(() => new Date(view.year, view.month + 1, 0), [view]);

  // Bucket emissions per day-of-month that falls in the current view window.
  // An emission "occupies" each day between its subscriptionStart and subscriptionEnd.
  const days = useMemo(() => getMonthGrid(view.year, view.month), [view]);

  const emissionsByDay = useMemo(() => {
    const map = new Map<string, UpcomingEmission[]>();
    for (const d of days) {
      map.set(d.toDateString(), []);
    }
    for (const em of emissions) {
      const start = toLocalDate(em.subscriptionStart);
      const end = toLocalDate(em.subscriptionEnd);
      for (const d of days) {
        if (d >= start && d <= end) {
          const key = d.toDateString();
          const arr = map.get(key);
          if (arr) arr.push(em);
        }
      }
    }
    return map;
  }, [days, emissions]);

  function goPrev() {
    setView((v) =>
      v.month === 0
        ? { year: v.year - 1, month: 11 }
        : { year: v.year, month: v.month - 1 },
    );
  }
  function goNext() {
    setView((v) =>
      v.month === 11
        ? { year: v.year + 1, month: 0 }
        : { year: v.year, month: v.month + 1 },
    );
  }
  function goToday() {
    setView({ year: today.getFullYear(), month: today.getMonth() });
  }

  const monthLabel = MONTH_LABELS[view.month];

  return (
    <div className={cn('flex flex-col gap-3', className)}>
      {/* Toolbar */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={goPrev}
            className="flex items-center justify-center w-8 h-8 rounded-md border border-border dark:border-white/10 bg-white dark:bg-white/[0.04] text-ink-2 dark:text-white/70 hover:border-violet hover:text-violet transition-all"
            aria-label="Mois précédent"
          >
            <ChevronLeft size={14} />
          </button>
          <h3 className="font-display text-lg font-bold text-ink dark:text-white min-w-[170px] text-center">
            {monthLabel} {view.year}
          </h3>
          <button
            type="button"
            onClick={goNext}
            className="flex items-center justify-center w-8 h-8 rounded-md border border-border dark:border-white/10 bg-white dark:bg-white/[0.04] text-ink-2 dark:text-white/70 hover:border-violet hover:text-violet transition-all"
            aria-label="Mois suivant"
          >
            <ChevronRight size={14} />
          </button>
        </div>
        <button
          type="button"
          onClick={goToday}
          className="h-8 px-3 rounded-md text-xs font-body font-semibold bg-violet-pale dark:bg-violet/10 text-violet dark:text-[#C9BCFF] hover:bg-[#DDD5FF] transition-colors"
        >
          Aujourd&rsquo;hui
        </button>
      </div>

      {/* Headers */}
      <div className="grid grid-cols-7 gap-1 text-[10px] font-body uppercase tracking-widest text-ink-3 dark:text-white/50 font-bold">
        {WEEKDAYS.map((d) => (
          <div key={d} className="text-center py-1.5">
            {d}
          </div>
        ))}
      </div>

      {/* Grid */}
      <div className="grid grid-cols-7 gap-1">
        {days.map((d, idx) => {
          const key = d.toDateString();
          const dayEmissions = emissionsByDay.get(key) ?? [];
          const inMonth = d.getMonth() === view.month;
          const isToday = sameDay(d, today);
          return (
            <div
              key={idx}
              className={cn(
                'min-h-[96px] rounded-md border p-1.5 flex flex-col gap-1 transition-all',
                'bg-white dark:bg-white/[0.03]',
                inMonth
                  ? 'border-border dark:border-white/10'
                  : 'border-border/40 dark:border-white/[0.04] opacity-50',
                isToday && 'border-violet ring-1 ring-violet/20',
              )}
            >
              <div className="flex items-center justify-between">
                <span
                  className={cn(
                    'text-[11px] font-body tabular-nums',
                    isToday
                      ? 'font-bold text-violet dark:text-[#C9BCFF]'
                      : inMonth
                        ? 'text-ink dark:text-white/80 font-semibold'
                        : 'text-ink-3 dark:text-white/30',
                  )}
                >
                  {d.getDate()}
                </span>
                {dayEmissions.length > 0 && (
                  <span className="text-[9px] font-mono text-ink-3 dark:text-white/40">
                    {dayEmissions.length}
                  </span>
                )}
              </div>
              <div className="flex flex-col gap-0.5 overflow-hidden">
                {dayEmissions.slice(0, 3).map((em) => {
                  const colors = ISSUER_COLORS[em.issuer];
                  return (
                    <button
                      key={em.id}
                      type="button"
                      onClick={() => setSelected(em)}
                      title={`${em.issuer} — ${em.productName}`}
                      className="w-full text-[9px] font-body font-semibold truncate text-left rounded px-1.5 py-0.5 hover:scale-[1.02] transition-transform"
                      style={{
                        backgroundColor: colors.bg,
                        color: colors.text,
                        borderLeft: `2px solid ${colors.dot}`,
                      }}
                    >
                      {em.productName}
                    </button>
                  );
                })}
                {dayEmissions.length > 3 && (
                  <span className="text-[9px] font-body text-ink-3 dark:text-white/40 italic">
                    +{dayEmissions.length - 3} autres
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Detail Modal */}
      {selected && (
        <Modal
          isOpen={!!selected}
          onClose={() => setSelected(null)}
          title={selected.productName}
          maxWidth="max-w-md"
        >
          <div className="flex flex-col gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <span
                className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[10px] font-body font-semibold uppercase tracking-wider"
                style={{
                  backgroundColor: ISSUER_COLORS[selected.issuer].bg,
                  color: ISSUER_COLORS[selected.issuer].text,
                  border: `1px solid ${ISSUER_COLORS[selected.issuer].border}`,
                }}
              >
                {selected.issuer}
              </span>
              <span className="text-[10px] font-body text-ink-3 dark:text-white/40 uppercase tracking-wider">
                {EMISSION_TYPE_LABELS[selected.type]}
              </span>
              <span className="text-[10px] font-body text-ink-3 dark:text-white/40 uppercase tracking-wider">
                {EMISSION_STATUS_LABELS[selected.status]}
              </span>
            </div>

            {selected.description && (
              <p className="text-sm text-ink-2 dark:text-white/70 font-body leading-relaxed">
                {selected.description}
              </p>
            )}

            <div className="grid grid-cols-2 gap-2">
              <div className="rounded-md bg-surface-2 dark:bg-white/5 px-2.5 py-2">
                <div className="text-[9px] font-body uppercase tracking-widest text-ink-3 dark:text-white/40 mb-0.5">
                  Coupon
                </div>
                <div className="font-display text-base font-bold text-teal">
                  {selected.expectedCoupon}%
                </div>
              </div>
              <div className="rounded-md bg-surface-2 dark:bg-white/5 px-2.5 py-2">
                <div className="text-[9px] font-body uppercase tracking-widest text-ink-3 dark:text-white/40 mb-0.5">
                  Barrière
                </div>
                <div className="font-display text-base font-bold text-ink dark:text-white">
                  {selected.expectedBarrier}%
                </div>
              </div>
              <div className="rounded-md bg-surface-2 dark:bg-white/5 px-2.5 py-2">
                <div className="text-[9px] font-body uppercase tracking-widest text-ink-3 dark:text-white/40 mb-0.5">
                  Durée
                </div>
                <div className="font-display text-base font-bold text-ink dark:text-white">
                  {selected.expectedMaturityYears} ans
                </div>
              </div>
              <div className="rounded-md bg-surface-2 dark:bg-white/5 px-2.5 py-2">
                <div className="text-[9px] font-body uppercase tracking-widest text-ink-3 dark:text-white/40 mb-0.5">
                  Ticket min.
                </div>
                <div className="font-display text-base font-bold text-ink dark:text-white">
                  {formatEur(selected.minTicket)}
                </div>
              </div>
            </div>

            <div className="rounded-md border border-border dark:border-white/10 bg-surface-2 dark:bg-white/5 px-3 py-2.5">
              <div className="text-[10px] font-body uppercase tracking-widest text-ink-3 dark:text-white/40 mb-1">
                Fenêtre de souscription
              </div>
              <div className="text-sm font-body text-ink dark:text-white">
                {formatDateShort(selected.subscriptionStart)} &rarr; {formatDateShort(selected.subscriptionEnd)}
              </div>
              <div className="text-xs font-body text-ink-3 dark:text-white/50 mt-0.5">
                Sous-jacent : {selected.underlying}
              </div>
            </div>

            <div className="flex justify-end pt-1">
              <NotifyMeButton
                emissionId={selected.id}
                emissionName={selected.productName}
                size="md"
              />
            </div>
          </div>
        </Modal>
      )}

      {/* min/max window info */}
      <p className="text-[10px] font-body text-ink-3 dark:text-white/40 text-center mt-1">
        Du {monthStart.toLocaleDateString('fr-FR')} au {monthEnd.toLocaleDateString('fr-FR')}
      </p>
    </div>
  );
}
