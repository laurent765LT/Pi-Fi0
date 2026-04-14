'use client';

import * as React from 'react';
import { cn } from '@/lib/cn';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface CountdownProps {
  targetDate: Date | string;
  label?: string;
  className?: string;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function computeRemaining(target: Date): { days: number; hours: number; minutes: number; expired: boolean } {
  const now = Date.now();
  const diff = target.getTime() - now;

  if (diff <= 0) {
    return { days: 0, hours: 0, minutes: 0, expired: true };
  }

  const totalMinutes = Math.floor(diff / 60_000);
  const days = Math.floor(totalMinutes / (60 * 24));
  const hours = Math.floor((totalMinutes % (60 * 24)) / 60);
  const minutes = totalMinutes % 60;

  return { days, hours, minutes, expired: false };
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

function Countdown({ targetDate, label, className }: CountdownProps) {
  const target = React.useMemo(
    () => (targetDate instanceof Date ? targetDate : new Date(targetDate)),
    [targetDate],
  );

  const [remaining, setRemaining] = React.useState(() => computeRemaining(target));

  React.useEffect(() => {
    // Update immediately on mount
    setRemaining(computeRemaining(target));

    const interval = setInterval(() => {
      const next = computeRemaining(target);
      setRemaining(next);

      // Stop ticking once expired
      if (next.expired) {
        clearInterval(interval);
      }
    }, 60_000);

    return () => clearInterval(interval);
  }, [target]);

  const isUrgent = remaining.days < 3 && !remaining.expired;

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 font-mono text-xs',
        isUrgent && 'text-red animate-pulse-subtle',
        !isUrgent && !remaining.expired && 'text-ink-2',
        remaining.expired && 'text-ink-4',
        className,
      )}
      aria-label={
        remaining.expired
          ? 'Expired'
          : `${remaining.days} jours ${remaining.hours} heures ${remaining.minutes} minutes restantes`
      }
    >
      {label && (
        <span className="font-body font-medium text-ink-3">{label}</span>
      )}
      {remaining.expired ? (
        <span className="font-semibold">Expire</span>
      ) : (
        <span className="font-semibold tabular-nums">
          {remaining.days}j {remaining.hours}h {String(remaining.minutes).padStart(2, '0')}m
        </span>
      )}
    </span>
  );
}

export { Countdown };
export type { CountdownProps };
