'use client';

import { Brain, TrendingUp, Shield, Clock } from 'lucide-react';
import { Select } from '@/components/ui/select';
import {
  MARKET_KNOWLEDGE_LABELS,
  PRODUCT_EXPERIENCE_LABELS,
  LOSS_TOLERANCE_LABELS,
  INVESTMENT_HORIZON_LABELS,
  type MarketKnowledge,
  type ProductExperience,
  type LossTolerance,
  type InvestmentHorizon,
} from '@/stores/clients-store';

// ─── Types ──────────────────────────────────────────────────────────────────

export interface Step2Values {
  marketKnowledge: MarketKnowledge;
  productExperience: ProductExperience;
  lossTolerance: LossTolerance;
  investmentHorizon: InvestmentHorizon;
}

export type Step2Errors = Partial<Record<keyof Step2Values, string>>;

interface Step2Props {
  values: Step2Values;
  errors: Step2Errors;
  onChange: <K extends keyof Step2Values>(key: K, value: Step2Values[K]) => void;
}

// ─── Validation ─────────────────────────────────────────────────────────────

export function validateStep2(v: Step2Values): Step2Errors {
  const errors: Step2Errors = {};
  if (!v.marketKnowledge) errors.marketKnowledge = 'Champ requis.';
  if (!v.productExperience) errors.productExperience = 'Champ requis.';
  if (v.lossTolerance == null) errors.lossTolerance = 'Champ requis.';
  if (!v.investmentHorizon) errors.investmentHorizon = 'Champ requis.';
  return errors;
}

// ─── Options ────────────────────────────────────────────────────────────────

const MARKET_OPTIONS = (Object.keys(MARKET_KNOWLEDGE_LABELS) as MarketKnowledge[]).map(
  (v) => ({ value: v, label: MARKET_KNOWLEDGE_LABELS[v] }),
);

const EXPERIENCE_OPTIONS = (Object.keys(PRODUCT_EXPERIENCE_LABELS) as ProductExperience[]).map(
  (v) => ({ value: v, label: PRODUCT_EXPERIENCE_LABELS[v] }),
);

const LOSS_OPTIONS: Array<{ value: string; label: string }> = (
  [0, 10, 30, 100] as LossTolerance[]
).map((v) => ({ value: String(v), label: LOSS_TOLERANCE_LABELS[v] }));

const HORIZON_OPTIONS = (Object.keys(INVESTMENT_HORIZON_LABELS) as InvestmentHorizon[]).map(
  (v) => ({ value: v, label: INVESTMENT_HORIZON_LABELS[v] }),
);

// ─── Component ──────────────────────────────────────────────────────────────

export function Step2InvestorProfile({ values, errors, onChange }: Step2Props) {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <div className="flex items-center gap-2 mb-1">
          <Brain size={16} className="text-[#3B1FA8]" />
          <h2 className="font-display text-lg font-bold text-ink dark:text-white">
            Profil d\u2019investisseur (MIF II)
          </h2>
        </div>
        <p className="font-body text-sm text-ink-3">
          \u00c9valuation MIF II obligatoire : connaissance, exp\u00e9rience,
          tol\u00e9rance au risque et horizon de placement.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="flex flex-col gap-1.5 w-full">
          <label className="font-body text-[13px] font-semibold text-ink-2 inline-flex items-center gap-1.5">
            <Brain size={12} className="text-ink-3" />
            Connaissance des march\u00e9s
          </label>
          <Select
            value={values.marketKnowledge}
            onChange={(v) => onChange('marketKnowledge', v as MarketKnowledge)}
            options={MARKET_OPTIONS}
            placeholder="S\u00e9lectionner..."
            error={errors.marketKnowledge}
          />
        </div>
        <div className="flex flex-col gap-1.5 w-full">
          <label className="font-body text-[13px] font-semibold text-ink-2 inline-flex items-center gap-1.5">
            <TrendingUp size={12} className="text-ink-3" />
            Exp\u00e9rience produits structur\u00e9s
          </label>
          <Select
            value={values.productExperience}
            onChange={(v) => onChange('productExperience', v as ProductExperience)}
            options={EXPERIENCE_OPTIONS}
            placeholder="S\u00e9lectionner..."
            error={errors.productExperience}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="flex flex-col gap-1.5 w-full">
          <label className="font-body text-[13px] font-semibold text-ink-2 inline-flex items-center gap-1.5">
            <Shield size={12} className="text-ink-3" />
            Tol\u00e9rance aux pertes
          </label>
          <Select
            value={String(values.lossTolerance)}
            onChange={(v) => {
              const n = Number(v) as LossTolerance;
              onChange('lossTolerance', n);
            }}
            options={LOSS_OPTIONS}
            placeholder="S\u00e9lectionner..."
            error={errors.lossTolerance}
          />
        </div>
        <div className="flex flex-col gap-1.5 w-full">
          <label className="font-body text-[13px] font-semibold text-ink-2 inline-flex items-center gap-1.5">
            <Clock size={12} className="text-ink-3" />
            Horizon d\u2019investissement
          </label>
          <Select
            value={values.investmentHorizon}
            onChange={(v) => onChange('investmentHorizon', v as InvestmentHorizon)}
            options={HORIZON_OPTIONS}
            placeholder="S\u00e9lectionner..."
            error={errors.investmentHorizon}
          />
        </div>
      </div>

      <div className="rounded-lg bg-[#EDE8FF] dark:bg-[#3B1FA8]/10 border border-[#C9BCFF] dark:border-[#5535C4]/30 px-4 py-3">
        <p className="font-body text-xs text-[#3B1FA8] dark:text-[#C9BCFF] leading-relaxed">
          <strong>Rappel MIF II.</strong> Ces informations permettent au Conseiller
          d\u2019\u00e9valuer le caract\u00e8re ad\u00e9quat de toute recommandation. Elles sont
          archiv\u00e9es avec le dossier client.
        </p>
      </div>
    </div>
  );
}
