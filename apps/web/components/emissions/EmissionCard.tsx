'use client';

import {
  CalendarDays,
  Clock,
  TrendingUp,
  Shield,
  Wallet,
  Activity,
} from 'lucide-react';
import { cn } from '@/lib/cn';
import {
  EMISSION_STATUS_LABELS,
  EMISSION_TYPE_LABELS,
  ISSUER_COLORS,
  type UpcomingEmission,
} from '@/stores/emissions-store';
import { NotifyMeButton } from './NotifyMeButton';

interface EmissionCardProps {
  emission: UpcomingEmission;
  onClick?: () => void;
  className?: string;
}

function formatEur(amount: number): string {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatDateShort(iso: string): string {
  return new Date(iso).toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: 'short',
  });
}

function daysUntil(iso: string): number {
  const diff = new Date(iso).getTime() - Date.now();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

function countdownLabel(emission: UpcomingEmission): string {
  const days = daysUntil(emission.subscriptionStart);
  if (emission.status === 'open') {
    const until = daysUntil(emission.subscriptionEnd);
    if (until <= 0) return 'Ferme aujourd\u2019hui';
    if (until === 1) return 'J-1 avant fermeture';
    return `J-${until} avant fermeture`;
  }
  if (emission.status === 'closed') return 'Fermé';
  if (days <= 0) return 'Ouvre aujourd\u2019hui';
  if (days === 1) return 'J-1 avant ouverture';
  return `J-${days} avant ouverture`;
}

function statusPill(emission: UpcomingEmission) {
  const base =
    'inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold font-body uppercase tracking-wider';
  switch (emission.status) {
    case 'announced':
      return (
        <span
          className={cn(
            base,
            'bg-surface-2 dark:bg-white/10 text-ink-3 dark:text-white/60 border border-border dark:border-white/10',
          )}
        >
          {EMISSION_STATUS_LABELS.announced}
        </span>
      );
    case 'premarketing':
      return (
        <span
          className={cn(
            base,
            'bg-cobalt-pale dark:bg-cobalt/20 text-cobalt dark:text-[#A5B8FF] border border-cobalt/20',
          )}
        >
          {EMISSION_STATUS_LABELS.premarketing}
        </span>
      );
    case 'open':
      return (
        <span
          className={cn(
            base,
            'bg-teal/10 text-[#007A63] dark:text-[#5FE0C8] border border-teal/30',
            'relative',
          )}
        >
          <span className="relative flex h-1.5 w-1.5">
            <span className="absolute inline-flex h-full w-full rounded-full bg-teal opacity-60 animate-ping" />
            <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-teal" />
          </span>
          {EMISSION_STATUS_LABELS.open}
        </span>
      );
    case 'closed':
      return (
        <span
          className={cn(
            base,
            'bg-red/10 text-red border border-red/20',
          )}
        >
          {EMISSION_STATUS_LABELS.closed}
        </span>
      );
  }
}

export function EmissionCard({ emission, onClick, className }: EmissionCardProps) {
  const issuerColors = ISSUER_COLORS[emission.issuer];
  const countdown = countdownLabel(emission);

  return (
    <article
      onClick={onClick}
      className={cn(
        'group relative flex flex-col gap-3 p-4 rounded-xl',
        'bg-white dark:bg-white/[0.04] border border-border dark:border-white/10',
        'shadow-card hover:shadow-card-hover transition-all duration-200',
        onClick && 'cursor-pointer hover:-translate-y-0.5',
        className,
      )}
    >
      {/* Issuer strip */}
      <div
        className="absolute top-0 left-0 right-0 h-[3px] rounded-t-xl"
        style={{ background: issuerColors.dot }}
      />

      {/* Header: issuer + status */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <span
            className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[10px] font-body font-semibold uppercase tracking-wider shrink-0"
            style={{
              backgroundColor: issuerColors.bg,
              color: issuerColors.text,
              border: `1px solid ${issuerColors.border}`,
            }}
          >
            <span
              className="w-1.5 h-1.5 rounded-full"
              style={{ background: issuerColors.dot }}
            />
            {emission.issuer}
          </span>
          <span className="text-[10px] font-body text-ink-3 dark:text-white/40 uppercase tracking-wider">
            {EMISSION_TYPE_LABELS[emission.type]}
          </span>
        </div>
        {statusPill(emission)}
      </div>

      {/* Product name */}
      <div className="flex flex-col gap-0.5">
        <h3 className="font-display text-[16px] font-bold text-ink dark:text-white leading-tight line-clamp-2">
          {emission.productName}
        </h3>
        <p className="text-xs font-body text-ink-3 dark:text-white/50">
          Sous-jacent: <span className="text-ink-2 dark:text-white/70 font-medium">{emission.underlying}</span>
        </p>
      </div>

      {/* Subscription window */}
      <div className="flex items-center gap-2 p-2.5 rounded-md bg-surface-2 dark:bg-white/[0.03] border border-border/60 dark:border-white/[0.06]">
        <CalendarDays size={14} className="text-violet dark:text-[#C9BCFF] shrink-0" />
        <div className="flex-1 min-w-0">
          <div className="flex items-baseline gap-1 text-xs font-body text-ink dark:text-white/90">
            <span className="font-semibold">{formatDateShort(emission.subscriptionStart)}</span>
            <span className="text-ink-3 dark:text-white/40">→</span>
            <span className="font-semibold">{formatDateShort(emission.subscriptionEnd)}</span>
          </div>
        </div>
        <span
          className={cn(
            'inline-flex items-center gap-1 text-[10px] font-body font-bold uppercase tracking-wider shrink-0',
            emission.status === 'open' ? 'text-teal' : 'text-violet dark:text-[#C9BCFF]',
          )}
        >
          <Clock size={10} strokeWidth={2.2} />
          {countdown}
        </span>
      </div>

      {/* Key params grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        <div className="rounded-md bg-surface-2 dark:bg-white/[0.03] px-2.5 py-2 border border-border/60 dark:border-white/[0.06]">
          <div className="flex items-center gap-1 text-[9px] font-body uppercase tracking-widest text-ink-3 dark:text-white/40 mb-0.5">
            <TrendingUp size={9} />
            Coupon
          </div>
          <div className="font-display text-sm font-bold text-teal tabular-nums">
            {emission.expectedCoupon}%
          </div>
        </div>
        <div className="rounded-md bg-surface-2 dark:bg-white/[0.03] px-2.5 py-2 border border-border/60 dark:border-white/[0.06]">
          <div className="flex items-center gap-1 text-[9px] font-body uppercase tracking-widest text-ink-3 dark:text-white/40 mb-0.5">
            <Shield size={9} />
            Barrière
          </div>
          <div className="font-display text-sm font-bold text-ink dark:text-white tabular-nums">
            {emission.expectedBarrier}%
          </div>
        </div>
        <div className="rounded-md bg-surface-2 dark:bg-white/[0.03] px-2.5 py-2 border border-border/60 dark:border-white/[0.06]">
          <div className="flex items-center gap-1 text-[9px] font-body uppercase tracking-widest text-ink-3 dark:text-white/40 mb-0.5">
            <Activity size={9} />
            Durée
          </div>
          <div className="font-display text-sm font-bold text-ink dark:text-white tabular-nums">
            {emission.expectedMaturityYears}&nbsp;ans
          </div>
        </div>
        <div className="rounded-md bg-surface-2 dark:bg-white/[0.03] px-2.5 py-2 border border-border/60 dark:border-white/[0.06]">
          <div className="flex items-center gap-1 text-[9px] font-body uppercase tracking-widest text-ink-3 dark:text-white/40 mb-0.5">
            <Wallet size={9} />
            Ticket min.
          </div>
          <div className="font-display text-sm font-bold text-ink dark:text-white tabular-nums">
            {formatEur(emission.minTicket)}
          </div>
        </div>
      </div>

      {/* Actions — click bubbling blocked via stopPropagation on the button wrapper */}
      <div
        className="flex items-center justify-end pt-1"
        onClick={(e) => e.stopPropagation()}
      >
        <NotifyMeButton
          emissionId={emission.id}
          emissionName={emission.productName}
          size="sm"
        />
      </div>
    </article>
  );
}
