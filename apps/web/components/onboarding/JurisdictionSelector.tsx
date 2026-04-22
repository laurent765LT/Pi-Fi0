'use client';

import { useState } from 'react';
import { ChevronRight, Check, Shield, Coins, Globe } from 'lucide-react';
import { cn } from '@/lib/cn';
import {
  useJurisdictionStore,
  type Jurisdiction,
} from '@/stores/jurisdiction-store';
import { JURISDICTION_CONFIGS } from '@/lib/regulatory/jurisdiction-rules';

// ─── Props ──────────────────────────────────────────────────────────────────

export interface JurisdictionSelectorProps {
  /** Called after the user confirms a choice. */
  onContinue: (jurisdiction: Jurisdiction) => void;
  /** Optional initial value (defaults to the store). */
  initial?: Jurisdiction;
  /** Optional title override. */
  title?: string;
}

// ─── Card ───────────────────────────────────────────────────────────────────

function JurisdictionCard({
  jurisdiction,
  selected,
  onSelect,
}: {
  jurisdiction: Jurisdiction;
  selected: boolean;
  onSelect: (j: Jurisdiction) => void;
}) {
  const cfg = JURISDICTION_CONFIGS[jurisdiction];
  return (
    <button
      type="button"
      onClick={() => onSelect(jurisdiction)}
      aria-pressed={selected}
      className={cn(
        'group relative text-left rounded-xl border-2 p-4 transition-all duration-200',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3B1FA8]/40 focus-visible:ring-offset-2',
        selected
          ? 'border-[#3B1FA8] bg-gradient-to-br from-[#3B1FA8]/[0.08] to-[#5535C4]/[0.04] shadow-md shadow-violet/10'
          : 'border-border/50 bg-white dark:bg-white/5 hover:border-[#3B1FA8]/40 hover:shadow-sm',
      )}
    >
      {/* Selection check */}
      {selected && (
        <span className="absolute top-2 right-2 w-5 h-5 rounded-full bg-[#3B1FA8] flex items-center justify-center shadow-sm">
          <Check size={11} strokeWidth={3} className="text-white" />
        </span>
      )}

      <div className="flex items-start gap-3">
        <span className="text-3xl leading-none" aria-hidden="true">
          {cfg.flag}
        </span>
        <div className="min-w-0 flex-1">
          <p className="font-display font-bold text-base text-ink leading-tight">
            {cfg.name}
          </p>
          <p className="font-body text-[11px] text-ink-3 mt-0.5">
            {cfg.regulator} &middot; {cfg.currency}
          </p>
        </div>
      </div>

      <div className="mt-3 space-y-1.5">
        <div className="flex items-center gap-1.5 text-[10px] font-body text-ink-3">
          <Shield size={10} className="text-ink-3/60 shrink-0" />
          <span className="truncate">{cfg.regulatorFullName}</span>
        </div>
        <div className="flex items-center gap-1.5 text-[10px] font-body text-ink-3">
          <Globe size={10} className="text-ink-3/60 shrink-0" />
          <span>{cfg.registryName}</span>
        </div>
        <div className="flex items-center gap-1.5 text-[10px] font-body text-ink-3">
          <Coins size={10} className="text-ink-3/60 shrink-0" />
          <span>TVA {cfg.vatRate}%</span>
        </div>
      </div>

      <div className="mt-3 flex flex-wrap gap-1">
        {cfg.requiredDocs.slice(0, 4).map((doc) => (
          <span
            key={doc}
            className={cn(
              'text-[9px] uppercase tracking-wider font-bold font-body px-1.5 py-0.5 rounded-full',
              selected
                ? 'bg-[#3B1FA8]/10 text-[#3B1FA8]'
                : 'bg-surface-2/60 text-ink-3',
            )}
          >
            {doc}
          </span>
        ))}
      </div>
    </button>
  );
}

// ─── Selector ───────────────────────────────────────────────────────────────

export function JurisdictionSelector({
  onContinue,
  initial,
  title = 'Choisissez votre juridiction',
}: JurisdictionSelectorProps) {
  const storedCurrent = useJurisdictionStore((s) => s.current);
  const setJurisdiction = useJurisdictionStore((s) => s.setJurisdiction);

  const [selected, setSelected] = useState<Jurisdiction>(
    initial ?? storedCurrent,
  );

  const cfg = JURISDICTION_CONFIGS[selected];

  const handleContinue = () => {
    setJurisdiction(selected);
    onContinue(selected);
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="text-center">
        <h2 className="font-display font-bold text-xl text-ink mb-1">{title}</h2>
        <p className="font-body text-sm text-ink-3">
          Chaque juridiction impose ses propres documents r&eacute;glementaires, son
          r&eacute;gulateur et sa devise.
        </p>
      </div>

      {/* Cards grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {(['FR', 'LU', 'BE', 'CH'] as Jurisdiction[]).map((j) => (
          <JurisdictionCard
            key={j}
            jurisdiction={j}
            selected={selected === j}
            onSelect={setSelected}
          />
        ))}
      </div>

      {/* Description of changes */}
      <div className="rounded-lg bg-violet-pale border border-[#C9BCFF] px-4 py-3">
        <p className="font-body text-[11px] font-semibold text-violet mb-1.5 uppercase tracking-wider">
          Ce qui change avec {cfg.name}
        </p>
        <ul className="font-body text-[12px] text-ink-2 leading-relaxed space-y-1">
          <li>
            &bull; R&eacute;gulateur : <strong>{cfg.regulator}</strong> (
            {cfg.regulatorFullName})
          </li>
          <li>
            &bull; Registre : <strong>{cfg.registryName}</strong>
          </li>
          <li>
            &bull; Devise : <strong>{cfg.currency}</strong> &middot; TVA {cfg.vatRate}%
          </li>
          <li>
            &bull; Documents requis :{' '}
            <strong>{cfg.requiredDocs.join(', ')}</strong>
          </li>
        </ul>
      </div>

      <button
        type="button"
        onClick={handleContinue}
        className={cn(
          'h-11 w-full rounded-xl px-4',
          'bg-gradient-to-r from-[#3B1FA8] to-[#5535C4] text-white',
          'font-display font-semibold text-sm shadow-md shadow-violet/25',
          'hover:scale-[1.01] active:scale-[0.99] transition-transform duration-150',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3B1FA8]/40 focus-visible:ring-offset-2',
          'flex items-center justify-center gap-2',
        )}
      >
        Commencer l&apos;onboarding {cfg.name}
        <ChevronRight size={16} />
      </button>
    </div>
  );
}
