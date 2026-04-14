'use client';

import { useEffect, useState } from 'react';

interface CountdownResult {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  isExpired: boolean;
}

function computeRemaining(targetMs: number): CountdownResult {
  const now = Date.now();
  const diff = targetMs - now;

  if (diff <= 0) {
    return { days: 0, hours: 0, minutes: 0, seconds: 0, isExpired: true };
  }

  return {
    days: Math.floor(diff / (1000 * 60 * 60 * 24)),
    hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
    minutes: Math.floor((diff / (1000 * 60)) % 60),
    seconds: Math.floor((diff / 1000) % 60),
    isExpired: false,
  };
}

/**
 * Counts down to `targetDate`, updating every second.
 *
 * @param targetDate - A Date object or ISO date string representing the deadline.
 */
export function useCountdown(targetDate: Date | string): CountdownResult {
  const targetMs =
    typeof targetDate === 'string'
      ? new Date(targetDate).getTime()
      : targetDate.getTime();

  const [remaining, setRemaining] = useState<CountdownResult>(() =>
    computeRemaining(targetMs),
  );

  useEffect(() => {
    // Immediately sync in case targetDate changed
    setRemaining(computeRemaining(targetMs));

    const interval = setInterval(() => {
      const next = computeRemaining(targetMs);
      setRemaining(next);

      if (next.isExpired) {
        clearInterval(interval);
      }
    }, 1_000);

    return () => clearInterval(interval);
  }, [targetMs]);

  return remaining;
}
