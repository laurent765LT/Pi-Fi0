'use client';

import { useCallback, useId } from 'react';
import { cn } from '@/lib/cn';

interface TickMark {
  value: number;
  label: string;
}

interface ScenarioSliderProps {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  /** Spot value representing "today" — rendered as a vertical guide. */
  currentMarker?: number;
  /** Barrier value (signed % move) — shown as orange dashed. */
  barrier?: number | null;
  /** Autocall trigger (signed % move) — shown as green line. */
  autocall?: number | null;
  ticks?: TickMark[];
  className?: string;
}

const DEFAULT_TICKS: TickMark[] = [
  { value: -50, label: '-50%' },
  { value: -30, label: '-30%' },
  { value: -10, label: '-10%' },
  { value: 0, label: '0%' },
  { value: 20, label: '+20%' },
  { value: 50, label: '+50%' },
];

function describeMove(value: number): string {
  if (value <= -30) return `sc\u00e9nario de stress, baisse de ${Math.abs(value)}%`;
  if (value < -5) return `baisse mod\u00e9r\u00e9e de ${Math.abs(value)}%`;
  if (value <= 5) return 'march\u00e9 stable';
  if (value < 20) return `hausse mod\u00e9r\u00e9e de ${value}%`;
  return `forte hausse de ${value}%`;
}

export function ScenarioSlider({
  value,
  onChange,
  min = -50,
  max = 50,
  step = 1,
  currentMarker = 0,
  barrier = null,
  autocall = null,
  ticks = DEFAULT_TICKS,
  className,
}: ScenarioSliderProps) {
  const reactId = useId();
  const sliderId = `scenario-slider-${reactId}`;

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      onChange(Number(e.target.value));
    },
    [onChange],
  );

  const range = max - min;
  const pct = (v: number) => ((v - min) / range) * 100;

  const signedBarrier = barrier != null ? barrier - 100 : null; // barrier is expressed as % of spot so -50 means move to 50% of initial

  return (
    <div className={cn('flex flex-col gap-2.5 w-full', className)}>
      {/* Track with markers */}
      <div className="relative pt-2 pb-4">
        {/* Gradient background track */}
        <div className="relative h-2 rounded-full overflow-hidden bg-gradient-to-r from-red/40 via-gold/30 to-teal/40 dark:from-red/30 dark:via-gold/25 dark:to-teal/35">
          {/* Barrier zone (below barrier) */}
          {signedBarrier != null && (
            <div
              className="absolute inset-y-0 left-0 bg-red/20 dark:bg-red/30"
              style={{ width: `${Math.max(0, pct(signedBarrier))}%` }}
              aria-hidden
            />
          )}
        </div>

        {/* Current position marker */}
        <div
          aria-hidden
          className="absolute top-0 bottom-4 w-[1px] bg-ink-3/50 dark:bg-white/30"
          style={{ left: `${pct(currentMarker)}%` }}
        />

        {/* Barrier line */}
        {signedBarrier != null && signedBarrier > min && signedBarrier < max && (
          <div
            aria-hidden
            className="absolute top-0 bottom-4 w-[2px] bg-orange-500/80"
            style={{
              left: `${pct(signedBarrier)}%`,
              backgroundImage: 'repeating-linear-gradient(to bottom, currentColor 0, currentColor 3px, transparent 3px, transparent 6px)',
              color: '#F97316',
              backgroundColor: 'transparent',
            }}
          >
            <span className="absolute -top-1 left-1 text-[9px] font-bold font-body text-orange-600 whitespace-nowrap bg-white/90 dark:bg-ink/80 px-1 rounded">
              Barri\u00e8re
            </span>
          </div>
        )}

        {/* Autocall line */}
        {autocall != null && autocall > min && autocall < max && (
          <div
            aria-hidden
            className="absolute top-0 bottom-4 w-[2px] bg-teal"
            style={{ left: `${pct(autocall)}%` }}
          >
            <span className="absolute -top-1 left-1 text-[9px] font-bold font-body text-teal whitespace-nowrap bg-white/90 dark:bg-ink/80 px-1 rounded">
              Autocall
            </span>
          </div>
        )}

        {/* The real input — made invisible but still controls the slider; visual is drawn via the track & thumb below */}
        <input
          id={sliderId}
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={handleChange}
          aria-label="Sc\u00e9nario de variation du sous-jacent"
          aria-valuetext={describeMove(value)}
          className={cn(
            'absolute inset-x-0 top-0 w-full h-10 cursor-pointer',
            'appearance-none bg-transparent',
            '[&::-webkit-slider-runnable-track]:h-2 [&::-webkit-slider-runnable-track]:bg-transparent',
            '[&::-moz-range-track]:h-2 [&::-moz-range-track]:bg-transparent',
            '[&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-6 [&::-webkit-slider-thumb]:h-6',
            '[&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-violet',
            '[&::-webkit-slider-thumb]:border-[3px] [&::-webkit-slider-thumb]:border-white',
            '[&::-webkit-slider-thumb]:shadow-lg [&::-webkit-slider-thumb]:cursor-grab',
            '[&::-webkit-slider-thumb]:-mt-2 [&::-webkit-slider-thumb]:transition-transform',
            'hover:[&::-webkit-slider-thumb]:scale-110 active:[&::-webkit-slider-thumb]:cursor-grabbing active:[&::-webkit-slider-thumb]:scale-110',
            '[&::-moz-range-thumb]:w-6 [&::-moz-range-thumb]:h-6 [&::-moz-range-thumb]:rounded-full',
            '[&::-moz-range-thumb]:bg-violet [&::-moz-range-thumb]:border-[3px] [&::-moz-range-thumb]:border-white',
            '[&::-moz-range-thumb]:shadow-lg [&::-moz-range-thumb]:cursor-grab',
            'focus-visible:outline-none focus-visible:[&::-webkit-slider-thumb]:ring-4 focus-visible:[&::-webkit-slider-thumb]:ring-violet/30',
          )}
        />
      </div>

      {/* Tick marks */}
      <div className="relative h-6" aria-hidden>
        {ticks.map((t) => (
          <div
            key={t.value}
            className="absolute -translate-x-1/2 flex flex-col items-center gap-0.5"
            style={{ left: `${pct(t.value)}%` }}
          >
            <span className="w-px h-1.5 bg-ink-3/40 dark:bg-white/25" />
            <span
              className={cn(
                'text-[10px] font-mono tabular-nums whitespace-nowrap',
                Math.abs(t.value - value) < 2
                  ? 'font-bold text-violet dark:text-violet-light'
                  : 'text-ink-3 dark:text-white/45',
              )}
            >
              {t.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
