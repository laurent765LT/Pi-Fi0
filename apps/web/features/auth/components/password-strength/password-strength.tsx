'use client';

// ─── <PasswordStrength /> — visual strength meter ────────────────────────────
// Small presentational component that renders the strength bar + label
// returned by `checkPassword()`. Drop anywhere next to a password input.

import * as React from 'react';
import { cn } from '@/lib/cn';
import { checkPassword, type PasswordStrength as Strength } from '../../lib/password-rules';

interface PasswordStrengthProps {
  /** The password to evaluate. Empty string renders nothing. */
  password: string;
  /** Optional class passed through to the wrapping element. */
  className?: string;
  /** Show the list of violations beneath the bar. */
  showViolations?: boolean;
}

const LEVEL_META: Record<
  Strength,
  { label: string; color: string; widthPct: number }
> = {
  0: { label: '', color: 'transparent', widthPct: 0 },
  1: { label: 'Très faible', color: '#E74C3C', widthPct: 25 },
  2: { label: 'Faible', color: '#F39C12', widthPct: 50 },
  3: { label: 'Moyen', color: '#F1C40F', widthPct: 75 },
  4: { label: 'Fort', color: '#00B894', widthPct: 100 },
};

export function PasswordStrength({
  password,
  className,
  showViolations = false,
}: PasswordStrengthProps): React.ReactElement | null {
  if (!password) return null;

  const { strength, violations } = checkPassword(password);
  const meta = LEVEL_META[strength];

  return (
    <div className={cn('flex flex-col gap-1', className)}>
      <div className="flex items-center gap-2">
        <div className="flex-1 h-1.5 rounded-full bg-ink/[0.06] overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-500 ease-out"
            style={{
              width: `${meta.widthPct}%`,
              background: meta.color,
            }}
            aria-hidden="true"
          />
        </div>
        <span
          className="text-[10px] font-bold font-body uppercase tracking-wider"
          style={{ color: meta.color }}
        >
          {meta.label}
        </span>
      </div>

      {showViolations && violations.length > 0 && (
        <ul className="text-[10px] font-body text-ink-3 list-disc pl-4 space-y-0.5">
          {violations.map((v) => (
            <li key={v}>{v}</li>
          ))}
        </ul>
      )}
    </div>
  );
}
