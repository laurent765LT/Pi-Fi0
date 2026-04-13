'use client';

import { useMemo } from 'react';
import { Sparkles, AlertTriangle, CheckCircle2, Info, Lightbulb } from 'lucide-react';
import { cn } from '@/lib/cn';
import { getAiAdvice, type PricingConfig, type AiAdvice } from '@/lib/pricing-simulator';

const ICON_MAP = {
  info: { icon: Info, color: 'text-cobalt-light', bg: 'bg-cobalt-pale' },
  warning: { icon: AlertTriangle, color: 'text-gold', bg: 'bg-[#FFF8E7]' },
  success: { icon: CheckCircle2, color: 'text-teal', bg: 'bg-[#E6FAF5]' },
  tip: { icon: Lightbulb, color: 'text-violet', bg: 'bg-violet-pale' },
};

function AdviceCard({ advice }: { advice: AiAdvice }) {
  const style = ICON_MAP[advice.type];
  const Icon = style.icon;

  return (
    <div className={cn('flex items-start gap-2.5 rounded-lg p-3 border border-border/50', style.bg)}>
      <Icon size={14} className={cn('shrink-0 mt-0.5', style.color)} />
      <p className="text-[12px] font-body text-ink-2 leading-relaxed">{advice.message}</p>
    </div>
  );
}

interface PricingAiGuideProps {
  config: PricingConfig;
  step: number;
  className?: string;
}

export function PricingAiGuide({ config, step, className }: PricingAiGuideProps) {
  const advices = useMemo(() => getAiAdvice(config, step), [config, step]);

  if (advices.length === 0) return null;

  return (
    <div className={cn('flex flex-col gap-3', className)}>
      {/* Header */}
      <div className="flex items-center gap-2">
        <div className="w-6 h-6 rounded-md bg-gradient-to-br from-violet to-cobalt-light flex items-center justify-center">
          <Sparkles size={12} className="text-white" />
        </div>
        <h3 className="text-[13px] font-bold text-ink font-body">Assistant IA</h3>
        <span className="text-[9px] bg-violet-pale text-violet px-1.5 py-0.5 rounded-full font-bold font-body">
          {advices.length} conseil{advices.length > 1 ? 's' : ''}
        </span>
      </div>

      {/* Advices */}
      <div className="flex flex-col gap-2">
        {advices.map((advice, i) => (
          <AdviceCard key={i} advice={advice} />
        ))}
      </div>
    </div>
  );
}
