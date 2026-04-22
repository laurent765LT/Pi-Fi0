'use client';

import {
  FileCheck2,
  User,
  Brain,
  Target,
  Package,
  FileText,
  Download,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/cn';
import {
  FAMILY_SITUATION_LABELS,
  MARKET_KNOWLEDGE_LABELS,
  PRODUCT_EXPERIENCE_LABELS,
  LOSS_TOLERANCE_LABELS,
  INVESTMENT_HORIZON_LABELS,
  OBJECTIVE_LABELS,
} from '@/stores/clients-store';
import { DEMO_PRODUCTS } from '@/lib/demo-data';
import type { Step1Values } from './Step1ClientInfo';
import type { Step2Values } from './Step2InvestorProfile';
import type { Step3Values } from './Step3Objectives';
import type { Step4Values } from './Step4Products';

// ─── Types ──────────────────────────────────────────────────────────────────

interface Step5Props {
  step1: Step1Values;
  step2: Step2Values;
  step3: Step3Values;
  step4: Step4Values;
  onGenerate: () => void;
  generating: boolean;
}

// ─── Helpers ────────────────────────────────────────────────────────────────

function formatAmount(amount: number): string {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatBirthDate(iso: string): string {
  if (!iso) return '\u2014';
  try {
    return new Date(iso).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    });
  } catch {
    return '\u2014';
  }
}

// ─── Subcomponents ──────────────────────────────────────────────────────────

function SectionCard({
  icon: Icon,
  title,
  children,
  accent = '#3B1FA8',
}: {
  icon: typeof User;
  title: string;
  children: React.ReactNode;
  accent?: string;
}) {
  return (
    <div className="rounded-xl border border-border bg-white dark:bg-white/5 p-4">
      <div className="flex items-center gap-2 mb-3 pb-3 border-b border-border/60">
        <div
          className="flex items-center justify-center w-8 h-8 rounded-lg"
          style={{
            background: `linear-gradient(135deg, ${accent}18 0%, ${accent}08 100%)`,
            boxShadow: `inset 0 0 0 1px ${accent}20`,
          }}
        >
          <Icon size={14} style={{ color: accent }} strokeWidth={2} />
        </div>
        <h3 className="font-display text-sm font-bold text-ink dark:text-white">
          {title}
        </h3>
      </div>
      <dl className="grid grid-cols-2 gap-x-4 gap-y-2.5">{children}</dl>
    </div>
  );
}

function Field({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <dt className="font-body text-[10px] uppercase tracking-wider text-ink-3 font-bold mb-0.5">
        {label}
      </dt>
      <dd className="font-body text-[13px] font-semibold text-ink dark:text-white">
        {value}
      </dd>
    </div>
  );
}

// ─── Component ──────────────────────────────────────────────────────────────

export function Step5Recap({ step1, step2, step3, step4, onGenerate, generating }: Step5Props) {
  const fullName =
    `${step1.firstName} ${step1.lastName}`.trim() || 'Client Strick\u2019in';

  const selectedProducts = DEMO_PRODUCTS.filter((p) =>
    step4.proposedProducts.includes(p.id),
  );

  return (
    <div className="flex flex-col gap-5">
      <div>
        <div className="flex items-center gap-2 mb-1">
          <FileCheck2 size={16} className="text-[#3B1FA8]" />
          <h2 className="font-display text-lg font-bold text-ink dark:text-white">
            R\u00e9capitulatif du dossier
          </h2>
        </div>
        <p className="font-body text-sm text-ink-3">
          V\u00e9rifiez les informations avant de g\u00e9n\u00e9rer les documents
          r\u00e9glementaires.
        </p>
      </div>

      <SectionCard icon={User} title="Informations client" accent="#3B1FA8">
        <Field label="Nom complet" value={fullName} />
        <Field label="Date de naissance" value={formatBirthDate(step1.birthDate)} />
        <Field
          label="Situation familiale"
          value={FAMILY_SITUATION_LABELS[step1.familySituation]}
        />
        <Field label="Profession" value={step1.profession || '\u2014'} />
        <Field
          label="Revenus annuels"
          value={formatAmount(step1.revenuesAnnuel)}
        />
      </SectionCard>

      <SectionCard icon={Brain} title="Profil d\u2019investisseur" accent="#5B3FD4">
        <Field
          label="Connaissance march\u00e9s"
          value={MARKET_KNOWLEDGE_LABELS[step2.marketKnowledge]}
        />
        <Field
          label="Exp\u00e9rience produits"
          value={PRODUCT_EXPERIENCE_LABELS[step2.productExperience]}
        />
        <Field
          label="Tol\u00e9rance pertes"
          value={LOSS_TOLERANCE_LABELS[step2.lossTolerance]}
        />
        <Field
          label="Horizon"
          value={INVESTMENT_HORIZON_LABELS[step2.investmentHorizon]}
        />
      </SectionCard>

      <SectionCard icon={Target} title="Objectifs patrimoniaux" accent="#D4A017">
        <div className="col-span-2 flex flex-wrap gap-2">
          {step3.objectives.length > 0 ? (
            step3.objectives.map((obj) => (
              <Badge key={obj} variant="violet" size="md">
                {OBJECTIVE_LABELS[obj]}
              </Badge>
            ))
          ) : (
            <span className="font-body text-sm text-ink-3 italic">
              Aucun objectif s\u00e9lectionn\u00e9.
            </span>
          )}
        </div>
      </SectionCard>

      <SectionCard
        icon={Package}
        title={`Produits propos\u00e9s (${selectedProducts.length})`}
        accent="#00B894"
      >
        <div className="col-span-2 flex flex-col gap-2">
          {selectedProducts.length > 0 ? (
            selectedProducts.map((p) => (
              <div
                key={p.id}
                className="flex items-center justify-between gap-3 py-2 px-3 rounded-md bg-[#F8F6FF] dark:bg-white/5 border border-border/50"
              >
                <div className="min-w-0 flex-1">
                  <p className="font-body text-sm font-semibold text-ink dark:text-white truncate">
                    {p.name}
                  </p>
                  <p className="font-mono text-[10.5px] text-ink-3">{p.isin}</p>
                </div>
                <Badge variant="muted" size="sm">
                  SRI {p.sri ?? '\u2014'}
                </Badge>
              </div>
            ))
          ) : (
            <span className="font-body text-sm text-ink-3 italic">
              Aucun produit s\u00e9lectionn\u00e9.
            </span>
          )}
        </div>
      </SectionCard>

      <div
        className={cn(
          'rounded-xl border p-5',
          'bg-gradient-to-br from-[#3B1FA8]/5 via-[#5535C4]/5 to-[#00B894]/5',
          'border-[#C9BCFF] dark:border-[#5535C4]/30',
        )}
      >
        <div className="flex items-start gap-3 mb-4">
          <div
            className="flex items-center justify-center w-10 h-10 rounded-xl shrink-0"
            style={{
              background: 'linear-gradient(135deg, #3B1FA8 0%, #5535C4 100%)',
              boxShadow: '0 4px 14px rgba(59,31,168,0.35)',
            }}
          >
            <FileText size={18} className="text-white" strokeWidth={2} />
          </div>
          <div className="min-w-0">
            <h3 className="font-display text-base font-bold text-ink dark:text-white">
              G\u00e9n\u00e9ration des documents r\u00e9glementaires
            </h3>
            <p className="font-body text-xs text-ink-3 dark:text-white/70 mt-0.5">
              3 documents seront ouverts dans de nouveaux onglets pour impression PDF :
              Lettre de mission, DER et Rapport d\u2019ad\u00e9quation MIF II.
            </p>
          </div>
        </div>

        <ul className="grid grid-cols-1 sm:grid-cols-3 gap-2 mb-4">
          {[
            'Lettre de mission',
            'Document d\u2019Entr\u00e9e en Relation',
            'Rapport d\u2019ad\u00e9quation MIF II',
          ].map((name) => (
            <li
              key={name}
              className="flex items-center gap-2 px-3 py-2 rounded-md bg-white/60 dark:bg-white/5 border border-border/50"
            >
              <FileText size={12} className="text-[#3B1FA8] shrink-0" />
              <span className="font-body text-xs font-medium text-ink dark:text-white truncate">
                {name}
              </span>
            </li>
          ))}
        </ul>

        <Button
          onClick={onGenerate}
          loading={generating}
          size="lg"
          className="w-full sm:w-auto"
        >
          <Download size={15} />
          G\u00e9n\u00e9rer les documents
        </Button>
      </div>
    </div>
  );
}
