'use client';

import { CheckCircle2, AlertTriangle, XCircle } from 'lucide-react';
import { cn } from '@/lib/cn';
import { DIMENSION_LABELS, type DimensionKey } from '@/lib/suitability/target-market-schema';
import type { SuitabilityResult } from '@/lib/suitability/matching-engine';

// ─── Types ──────────────────────────────────────────────────────────────────

interface TargetMarketBadgeProps {
  result: SuitabilityResult;
  /** Affiche le label long "Adéquation 87%" si true (defaut), sinon seul le pourcentage. */
  verbose?: boolean;
  className?: string;
}

// ─── Styles par niveau ──────────────────────────────────────────────────────

const LEVEL_STYLES: Record<SuitabilityResult['level'], {
  icon: typeof CheckCircle2;
  label: string;
  container: string;
  text: string;
  dot: string;
}> = {
  match: {
    icon: CheckCircle2,
    label: 'Adéquation',
    container:
      'border-teal/30 bg-teal/10 text-teal hover:bg-teal/15 dark:bg-teal/[0.08] dark:border-teal/40',
    text: 'text-teal',
    dot: 'bg-teal',
  },
  partial: {
    icon: AlertTriangle,
    label: 'Adéquation partielle',
    container:
      'border-gold/40 bg-gold/10 text-[#A07800] hover:bg-gold/15 dark:text-gold dark:bg-gold/[0.08] dark:border-gold/40',
    text: 'text-[#A07800] dark:text-gold',
    dot: 'bg-gold',
  },
  'no-match': {
    icon: XCircle,
    label: 'Non adéquat',
    container:
      'border-red/30 bg-red/10 text-red hover:bg-red/15 dark:bg-red/[0.08] dark:border-red/40',
    text: 'text-red',
    dot: 'bg-red',
  },
};

// ─── Component ──────────────────────────────────────────────────────────────

/**
 * Badge compact affichant le resultat de l'evaluation d'adequation
 * (match / partial / no-match) avec un tooltip detaillant les dimensions
 * non matchees au survol ou au focus clavier.
 */
export function TargetMarketBadge({
  result,
  verbose = true,
  className,
}: TargetMarketBadgeProps) {
  const style = LEVEL_STYLES[result.level];
  const Icon = style.icon;

  const nonMatched = (Object.entries(result.dimensions) as [
    DimensionKey,
    (typeof result.dimensions)[DimensionKey],
  ][])
    .filter(([, d]) => !d.match)
    .map(([key]) => DIMENSION_LABELS[key]);

  const ariaLabel = `${style.label} : score ${result.score} sur 100${
    nonMatched.length > 0
      ? `. Dimensions non alignées : ${nonMatched.join(', ')}`
      : ''
  }`;

  return (
    <span className={cn('relative inline-flex group', className)}>
      <span
        role="status"
        aria-label={ariaLabel}
        tabIndex={0}
        className={cn(
          'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1',
          'text-[11px] font-semibold font-body tabular-nums',
          'transition-colors duration-150',
          'focus:outline-none focus-visible:ring-2 focus-visible:ring-violet/40 focus-visible:ring-offset-1',
          style.container,
        )}
      >
        <Icon size={12} aria-hidden="true" />
        <span className="whitespace-nowrap">
          {verbose ? (
            <>
              <span className="hidden sm:inline">{style.label} </span>
              <span className="font-mono font-bold">{result.score}%</span>
            </>
          ) : (
            <span className="font-mono font-bold">{result.score}%</span>
          )}
        </span>
      </span>

      {/* Tooltip : liste des dimensions non matchees */}
      <span
        role="tooltip"
        className={cn(
          'pointer-events-none absolute left-1/2 -translate-x-1/2 z-50',
          'bottom-full mb-2 w-60',
          'opacity-0 group-hover:opacity-100 group-focus-within:opacity-100',
          'transition-opacity duration-150',
        )}
      >
        <span className="block rounded-lg bg-[#1A0A3E] px-3 py-2.5 text-left shadow-lg shadow-ink/20">
          <span className="block text-[10px] uppercase tracking-widest font-semibold text-white/70 font-body">
            Score d&apos;adéquation
          </span>
          <span className="block mt-0.5 text-xs font-body text-white">
            <span className="font-mono font-bold tabular-nums">{result.score}%</span>
            {' — '}
            <span className="text-white/80">{style.label}</span>
          </span>
          {nonMatched.length > 0 ? (
            <span className="mt-2 block border-t border-white/10 pt-2">
              <span className="block text-[10px] uppercase tracking-widest font-semibold text-white/70 font-body">
                Dimensions à vérifier
              </span>
              <span className="mt-1 block flex flex-wrap gap-1">
                {nonMatched.map((label) => (
                  <span
                    key={label}
                    className="inline-flex items-center gap-1 rounded-full bg-white/10 px-2 py-0.5 text-[10px] font-body text-white"
                  >
                    <span className={cn('h-1 w-1 rounded-full', style.dot)} />
                    {label}
                  </span>
                ))}
              </span>
            </span>
          ) : (
            <span className="mt-2 block border-t border-white/10 pt-2 text-[10px] font-body text-white/70">
              Toutes les dimensions sont alignées avec le Target Market.
            </span>
          )}
          {/* fleche */}
          <span className="absolute left-1/2 top-full h-0 w-0 -translate-x-1/2 border-x-[5px] border-t-[5px] border-x-transparent border-t-[#1A0A3E]" />
        </span>
      </span>
    </span>
  );
}

export default TargetMarketBadge;
