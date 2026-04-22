'use client';

import { useMemo } from 'react';
import { Calendar, Eye, Coins, CheckCircle2, AlertCircle } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/cn';
import type { ClientEvent } from '@/lib/portfolio/aggregation-engine';
import { INSURER_COLORS, type InsurerName } from '@/stores/clients-consolidated-store';

interface ConsolidatedTimelineProps {
  events: ClientEvent[];
  className?: string;
  /** Limit number of events shown; 0 = all */
  limit?: number;
}

const EVENT_ICON: Record<ClientEvent['type'], LucideIcon> = {
  observation: Eye,
  maturity: CheckCircle2,
  closing: AlertCircle,
  coupon: Coins,
};

const EVENT_COLOR: Record<ClientEvent['type'], string> = {
  observation: '#3B1FA8',
  maturity: '#00B894',
  closing: '#D4A017',
  coupon: '#5B3FD4',
};

function formatDateLong(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    });
  } catch {
    return '--';
  }
}

function daysUntil(ms: number): number {
  return Math.max(0, Math.round((ms - Date.now()) / (1000 * 60 * 60 * 24)));
}

export function ConsolidatedTimeline({
  events,
  className,
  limit = 0,
}: ConsolidatedTimelineProps) {
  const rows = useMemo(() => (limit > 0 ? events.slice(0, limit) : events), [
    events,
    limit,
  ]);

  if (rows.length === 0) {
    return (
      <div
        className={cn(
          'rounded-xl border border-border bg-white dark:bg-white/[0.03] p-8 text-center',
          className,
        )}
      >
        <Calendar size={22} className="mx-auto text-ink-3 mb-2" />
        <p className="text-[13px] text-ink-3">
          Aucun événement à venir pour ce client.
        </p>
      </div>
    );
  }

  return (
    <div className={cn('relative', className)}>
      <ol className="relative border-l border-border ml-4 space-y-4" role="list">
        {rows.map((e) => {
          const Icon = EVENT_ICON[e.type];
          const insurerColor = INSURER_COLORS[e.insurer as InsurerName];
          const eventColor = EVENT_COLOR[e.type];
          const days = daysUntil(e.dateMs);

          return (
            <li key={`${e.contractId}-${e.productId}-${e.date}-${e.type}`} className="ml-6">
              <span
                className="absolute -left-[14px] mt-1 flex h-7 w-7 items-center justify-center rounded-full border-2 border-white dark:border-ink"
                style={{ background: eventColor }}
                aria-hidden
              >
                <Icon size={12} className="text-white" />
              </span>
              <div className="rounded-xl border border-border bg-white dark:bg-white/[0.03] p-3.5 flex flex-col gap-1">
                <div className="flex items-start gap-3 flex-wrap">
                  <div className="flex-1 min-w-0">
                    <p className="font-display font-bold text-[13.5px] text-ink dark:text-white truncate">
                      {e.productName}
                    </p>
                    <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                      <span
                        className="inline-flex items-center gap-1 px-1.5 py-[1px] rounded-sm text-[9px] font-bold uppercase tracking-wider"
                        style={{
                          background: `${eventColor}18`,
                          color: eventColor,
                        }}
                      >
                        {e.label}
                      </span>
                      <span
                        className="inline-flex items-center gap-1 px-1.5 py-[1px] rounded-sm text-[9px] font-bold uppercase tracking-wider"
                        style={{
                          background: `${insurerColor}18`,
                          color: insurerColor,
                        }}
                      >
                        <span
                          aria-hidden
                          className="w-1 h-1 rounded-full"
                          style={{ background: insurerColor }}
                        />
                        {e.insurer}
                      </span>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-[12px] font-semibold text-ink-2 dark:text-white/80 font-mono tabular-nums">
                      {formatDateLong(e.date)}
                    </p>
                    <p className="text-[10px] text-ink-3 font-mono tabular-nums">
                      J+{days}
                    </p>
                  </div>
                </div>
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
