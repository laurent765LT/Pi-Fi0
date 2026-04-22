'use client';

import { useMemo, useState } from 'react';
import { AlertOctagon, AlertTriangle, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/cn';
import { mockESGForProduct } from '@/lib/esg/scoring-engine';
import { detectGreenwashing } from '@/lib/esg/greenwashing-detector';

interface GreenwashingAlertProps {
  productId: string;
  className?: string;
  defaultOpen?: boolean;
}

export function GreenwashingAlert({ productId, className, defaultOpen = true }: GreenwashingAlertProps) {
  const alert = useMemo(() => {
    const esg = mockESGForProduct(productId);
    return detectGreenwashing(esg);
  }, [productId]);
  const [expanded, setExpanded] = useState(defaultOpen);

  if (!alert) return null;

  const isCritical = alert.severity === 'critical';
  const Icon = isCritical ? AlertOctagon : AlertTriangle;

  const palette = isCritical
    ? {
        border: 'border-red/50 dark:border-red/45',
        bg: 'bg-red/5 dark:bg-red/10',
        accent: 'bg-red',
        iconBg: 'bg-red/15 dark:bg-red/25',
        iconColor: 'text-red',
        titleColor: 'text-[#C41F36] dark:text-[#FF8090]',
        tag: 'bg-red text-white',
      }
    : {
        border: 'border-gold/45 dark:border-gold/40',
        bg: 'bg-gold/5 dark:bg-gold/10',
        accent: 'bg-gold',
        iconBg: 'bg-gold/15 dark:bg-gold/25',
        iconColor: 'text-gold',
        titleColor: 'text-[#A07800] dark:text-gold',
        tag: 'bg-gold text-white',
      };

  return (
    <section
      role="alert"
      aria-live="polite"
      className={cn(
        'relative flex gap-3 rounded-xl border-2 overflow-hidden shadow-sm',
        palette.border,
        palette.bg,
        className,
      )}
    >
      {/* Left accent */}
      <span aria-hidden className={cn('w-1.5 shrink-0', palette.accent)} />

      <div className="flex-1 flex gap-3 py-3 pr-3 pl-1 min-w-0">
        <span
          aria-hidden
          className={cn('w-9 h-9 rounded-lg flex items-center justify-center shrink-0', palette.iconBg)}
        >
          <Icon size={18} className={palette.iconColor} strokeWidth={2.2} />
        </span>

        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <h4 className={cn('font-body text-[13px] font-bold leading-tight', palette.titleColor)}>
              {alert.message}
            </h4>
            <span
              className={cn(
                'inline-flex items-center gap-1 rounded-full px-2 py-[1px] text-[9px] font-bold uppercase tracking-[0.15em] shrink-0',
                palette.tag,
              )}
            >
              {isCritical ? 'Alerte critique' : 'Vigilance'}
            </span>
            <span className="text-[9px] font-body text-ink-3 dark:text-white/40 uppercase tracking-widest">
              Bouclier anti-greenwashing
            </span>
          </div>

          <div
            className={cn(
              'grid transition-[grid-template-rows] duration-300 ease-out',
              expanded ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]',
            )}
          >
            <div className="overflow-hidden">
              <p className="text-[12px] text-ink-2 dark:text-white/70 font-body leading-relaxed">
                {alert.details}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setExpanded((v) => !v)}
            aria-expanded={expanded}
            className={cn(
              'mt-1 inline-flex items-center gap-1 text-[11px] font-semibold font-body',
              'transition-colors',
              palette.titleColor,
              'hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-violet/30 rounded',
            )}
          >
            {expanded ? 'Masquer les d\u00e9tails' : 'Afficher les d\u00e9tails'}
            <ChevronDown
              size={12}
              className={cn('transition-transform duration-200', expanded && 'rotate-180')}
            />
          </button>
        </div>
      </div>
    </section>
  );
}
