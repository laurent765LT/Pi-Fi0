'use client';

import { User, CalendarDays, Briefcase, Euro } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import {
  FAMILY_SITUATION_LABELS,
  type FamilySituation,
} from '@/stores/clients-store';

// ─── Types ──────────────────────────────────────────────────────────────────

export interface Step1Values {
  firstName: string;
  lastName: string;
  birthDate: string;
  familySituation: FamilySituation;
  profession: string;
  revenuesAnnuel: number;
}

export type Step1Errors = Partial<Record<keyof Step1Values, string>>;

interface Step1Props {
  values: Step1Values;
  errors: Step1Errors;
  onChange: <K extends keyof Step1Values>(key: K, value: Step1Values[K]) => void;
}

// ─── Validation ─────────────────────────────────────────────────────────────

export function validateStep1(v: Step1Values): Step1Errors {
  const errors: Step1Errors = {};
  if (!v.firstName.trim()) errors.firstName = 'Pr\u00e9nom requis.';
  if (!v.lastName.trim()) errors.lastName = 'Nom requis.';
  if (!v.birthDate) {
    errors.birthDate = 'Date de naissance requise.';
  } else {
    const d = new Date(v.birthDate);
    if (Number.isNaN(d.getTime())) {
      errors.birthDate = 'Date invalide.';
    } else if (d > new Date()) {
      errors.birthDate = 'La date doit \u00eatre dans le pass\u00e9.';
    }
  }
  if (!v.profession.trim()) errors.profession = 'Profession requise.';
  if (!Number.isFinite(v.revenuesAnnuel) || v.revenuesAnnuel < 0) {
    errors.revenuesAnnuel = 'Revenus annuels invalides.';
  }
  return errors;
}

// ─── Options ────────────────────────────────────────────────────────────────

const FAMILY_OPTIONS = (Object.keys(FAMILY_SITUATION_LABELS) as FamilySituation[]).map(
  (v) => ({ value: v, label: FAMILY_SITUATION_LABELS[v] }),
);

// ─── Component ──────────────────────────────────────────────────────────────

export function Step1ClientInfo({ values, errors, onChange }: Step1Props) {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <div className="flex items-center gap-2 mb-1">
          <User size={16} className="text-[#3B1FA8]" />
          <h2 className="font-display text-lg font-bold text-ink dark:text-white">
            Informations client
          </h2>
        </div>
        <p className="font-body text-sm text-ink-3">
          \u00c9tat civil, situation familiale et capacit\u00e9 financi\u00e8re du client.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Input
          label="Pr\u00e9nom"
          placeholder="ex. Claire"
          value={values.firstName}
          onChange={(e) => onChange('firstName', e.target.value)}
          error={errors.firstName}
          autoComplete="given-name"
        />
        <Input
          label="Nom"
          placeholder="ex. Dubois"
          value={values.lastName}
          onChange={(e) => onChange('lastName', e.target.value)}
          error={errors.lastName}
          autoComplete="family-name"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Input
          label="Date de naissance"
          type="date"
          value={values.birthDate}
          onChange={(e) => onChange('birthDate', e.target.value)}
          error={errors.birthDate}
        />
        <Select
          label="Situation familiale"
          value={values.familySituation}
          onChange={(v) => onChange('familySituation', v as FamilySituation)}
          options={FAMILY_OPTIONS}
          placeholder="S\u00e9lectionner..."
          error={errors.familySituation}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="flex flex-col gap-1.5 w-full">
          <label className="font-body text-[13px] font-semibold text-ink-2 inline-flex items-center gap-1.5">
            <Briefcase size={12} className="text-ink-3" />
            Profession
          </label>
          <Input
            placeholder="ex. Chef d'entreprise"
            value={values.profession}
            onChange={(e) => onChange('profession', e.target.value)}
            error={errors.profession}
            autoComplete="organization-title"
          />
        </div>
        <div className="flex flex-col gap-1.5 w-full">
          <label className="font-body text-[13px] font-semibold text-ink-2 inline-flex items-center gap-1.5">
            <Euro size={12} className="text-ink-3" />
            Revenus annuels (\u20ac)
          </label>
          <Input
            type="number"
            inputMode="numeric"
            min={0}
            step={1000}
            placeholder="ex. 85000"
            value={Number.isFinite(values.revenuesAnnuel) ? String(values.revenuesAnnuel) : ''}
            onChange={(e) => {
              const n = e.target.value === '' ? 0 : Number(e.target.value);
              onChange('revenuesAnnuel', Number.isFinite(n) ? n : 0);
            }}
            error={errors.revenuesAnnuel}
          />
        </div>
      </div>

      <p className="text-xs text-ink-3 font-body flex items-center gap-1.5">
        <CalendarDays size={12} />
        Toutes les informations sont trait\u00e9es conform\u00e9ment au RGPD.
      </p>
    </div>
  );
}
