'use client';

import { Target, Check, type LucideIcon, PiggyBank, Landmark, Calculator, TrendingUp } from 'lucide-react';
import { cn } from '@/lib/cn';
import { OBJECTIVE_LABELS, type ClientObjective } from '@/stores/clients-store';

// ─── Types ──────────────────────────────────────────────────────────────────

export interface Step3Values {
  objectives: ClientObjective[];
}

export type Step3Errors = Partial<Record<keyof Step3Values, string>>;

interface Step3Props {
  values: Step3Values;
  errors: Step3Errors;
  onChange: <K extends keyof Step3Values>(key: K, value: Step3Values[K]) => void;
}

// ─── Validation ─────────────────────────────────────────────────────────────

export function validateStep3(v: Step3Values): Step3Errors {
  const errors: Step3Errors = {};
  if (!v.objectives || v.objectives.length === 0) {
    errors.objectives = 'S\u00e9lectionnez au moins un objectif patrimonial.';
  }
  return errors;
}

// ─── Chip config ────────────────────────────────────────────────────────────

const OBJECTIVE_META: Record<
  ClientObjective,
  { icon: LucideIcon; description: string; color: string }
> = {
  retraite: {
    icon: PiggyBank,
    description: 'Constituer un capital retraite sur le long terme.',
    color: '#3B1FA8',
  },
  transmission: {
    icon: Landmark,
    description: 'Pr\u00e9parer la transmission du patrimoine aux h\u00e9ritiers.',
    color: '#5B3FD4',
  },
  fiscalite: {
    icon: Calculator,
    description: 'R\u00e9duire la pression fiscale via des enveloppes adapt\u00e9es.',
    color: '#D4A017',
  },
  revenus: {
    icon: TrendingUp,
    description: 'Percevoir un compl\u00e9ment r\u00e9gulier de revenus.',
    color: '#00B894',
  },
};

const OBJECTIVES_LIST: ClientObjective[] = [
  'retraite',
  'transmission',
  'fiscalite',
  'revenus',
];

// ─── Component ──────────────────────────────────────────────────────────────

export function Step3Objectives({ values, errors, onChange }: Step3Props) {
  const toggle = (o: ClientObjective) => {
    const current = values.objectives ?? [];
    const next = current.includes(o)
      ? current.filter((x) => x !== o)
      : [...current, o];
    onChange('objectives', next);
  };

  const count = values.objectives?.length ?? 0;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <div className="flex items-center gap-2 mb-1">
          <Target size={16} className="text-[#3B1FA8]" />
          <h2 className="font-display text-lg font-bold text-ink dark:text-white">
            Objectifs patrimoniaux
          </h2>
        </div>
        <p className="font-body text-sm text-ink-3">
          S\u00e9lectionnez le ou les objectifs prioritaires du client
          (plusieurs choix possibles).
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {OBJECTIVES_LIST.map((obj) => {
          const meta = OBJECTIVE_META[obj];
          const Icon = meta.icon;
          const selected = values.objectives?.includes(obj) ?? false;
          return (
            <button
              key={obj}
              type="button"
              role="checkbox"
              aria-checked={selected}
              onClick={() => toggle(obj)}
              className={cn(
                'group relative flex items-start gap-3 p-4 rounded-xl text-left',
                'border transition-all duration-200',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet focus-visible:ring-offset-2',
                selected
                  ? 'border-[#3B1FA8] bg-[#EDE8FF]/60 dark:bg-[#3B1FA8]/15 shadow-sm'
                  : 'border-border bg-white dark:bg-white/5 hover:border-[#3B1FA8]/40 hover:bg-[#F8F6FF] dark:hover:bg-white/10',
              )}
            >
              <div
                className="flex items-center justify-center w-10 h-10 rounded-xl shrink-0"
                style={{
                  background: selected
                    ? `linear-gradient(135deg, ${meta.color} 0%, ${meta.color}CC 100%)`
                    : `linear-gradient(135deg, ${meta.color}18 0%, ${meta.color}08 100%)`,
                  boxShadow: selected
                    ? `0 4px 14px ${meta.color}55`
                    : `inset 0 0 0 1px ${meta.color}20`,
                }}
              >
                <Icon
                  size={18}
                  strokeWidth={2}
                  className={selected ? 'text-white' : ''}
                  style={{ color: selected ? '#fff' : meta.color }}
                />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="font-display font-bold text-[14px] text-ink dark:text-white leading-tight">
                    {OBJECTIVE_LABELS[obj]}
                  </span>
                  {selected && (
                    <span
                      className="inline-flex items-center justify-center w-[18px] h-[18px] rounded-full"
                      style={{ background: meta.color }}
                      aria-hidden="true"
                    >
                      <Check size={11} strokeWidth={3} className="text-white" />
                    </span>
                  )}
                </div>
                <p className="font-body text-[12px] text-ink-3 leading-relaxed">
                  {meta.description}
                </p>
              </div>
            </button>
          );
        })}
      </div>

      {errors.objectives && (
        <p className="font-body text-xs text-red font-medium">{errors.objectives}</p>
      )}

      <p className="font-body text-xs text-ink-3">
        {count} objectif{count > 1 ? 's' : ''} s\u00e9lectionn\u00e9{count > 1 ? 's' : ''}.
      </p>
    </div>
  );
}
