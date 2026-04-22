'use client';

// ─── components/kyb/SireneAutocomplete.tsx ───────────────────────────────────
// Input SIREN avec auto-fetch vers /api/kyb/sirene dès que 9 chiffres.

import { useEffect, useState } from 'react';
import {
  Building2,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Search,
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import type { KYBDirigeant } from '@/stores/kyb-store';

// ─── Types ──────────────────────────────────────────────────────────────────

export interface SireneData {
  siren: string;
  denomination: string;
  formeJuridique: string;
  capital: number;
  adresse: string;
  dirigeants: KYBDirigeant[];
  kbisDate: string;
}

interface SireneAutocompleteProps {
  onLoaded: (data: SireneData | null) => void;
}

// ─── Format helpers ─────────────────────────────────────────────────────────

function formatSiren(s: string): string {
  const d = s.replace(/\D/g, '').slice(0, 9);
  if (d.length <= 3) return d;
  if (d.length <= 6) return `${d.slice(0, 3)} ${d.slice(3)}`;
  return `${d.slice(0, 3)} ${d.slice(3, 6)} ${d.slice(6)}`;
}

function formatCurrency(n: number): string {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
    maximumFractionDigits: 0,
  }).format(n);
}

// ─── Component ──────────────────────────────────────────────────────────────

export function SireneAutocomplete({ onLoaded }: SireneAutocompleteProps) {
  const [display, setDisplay] = useState('');
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<SireneData | null>(null);
  const [error, setError] = useState<string | null>(null);

  const raw = display.replace(/\D/g, '');

  // Auto-fetch when 9 digits are reached
  useEffect(() => {
    if (raw.length !== 9) {
      if (data) {
        setData(null);
        onLoaded(null);
      }
      return;
    }
    let cancelled = false;
    const run = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/kyb/sirene?siren=${raw}`);
        if (!res.ok) {
          const body = (await res.json().catch(() => ({}))) as {
            error?: string;
          };
          throw new Error(body.error ?? 'Impossible de récupérer ce SIREN.');
        }
        const json = (await res.json()) as SireneData;
        if (cancelled) return;
        setData(json);
        onLoaded(json);
      } catch (e) {
        if (cancelled) return;
        setError(e instanceof Error ? e.message : 'Erreur réseau.');
        setData(null);
        onLoaded(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    run();
    return () => {
      cancelled = true;
    };
  }, [raw, onLoaded, data]);

  return (
    <div className="flex flex-col gap-3">
      <Input
        label="Numéro SIREN"
        value={display}
        onChange={(e) => setDisplay(formatSiren(e.target.value))}
        placeholder="123 456 789"
        maxLength={11}
        inputMode="numeric"
        hint={
          raw.length === 9
            ? undefined
            : `${raw.length}/9 chiffres saisis — la recherche démarre dès 9`
        }
        error={error ?? undefined}
      />

      {loading && (
        <div className="flex items-center gap-2 rounded-md bg-violet-pale/40 px-3 py-2">
          <Loader2 size={14} className="animate-spin text-violet" />
          <span className="font-body text-xs text-violet font-medium">
            Interrogation de la base SIRENE (INSEE)…
          </span>
        </div>
      )}

      {!loading && !data && !error && raw.length > 0 && raw.length < 9 && (
        <div className="flex items-center gap-2 rounded-md bg-surface px-3 py-2">
          <Search size={14} className="text-ink-3" />
          <span className="font-body text-xs text-ink-3">
            Complétez le SIREN pour lancer la recherche automatique.
          </span>
        </div>
      )}

      {data && !loading && (
        <div className="rounded-xl border border-teal/40 bg-teal/5 p-4 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-lg bg-teal/15 flex items-center justify-center">
                <Building2 size={16} className="text-teal" />
              </div>
              <div>
                <p className="font-display font-bold text-[14px] text-ink leading-tight">
                  {data.denomination}
                </p>
                <p className="font-mono text-[11px] text-ink-3">
                  SIREN {data.siren}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1.5 text-teal">
              <CheckCircle2 size={14} />
              <span className="font-body text-[11px] font-semibold">
                Vérifié
              </span>
            </div>
          </div>

          <dl className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[12px] font-body">
            <Row label="Forme juridique" value={data.formeJuridique} />
            <Row label="Capital social" value={formatCurrency(data.capital)} />
            <Row
              label="Adresse du siège"
              value={data.adresse}
              className="sm:col-span-2"
            />
            <Row
              label="Dirigeant(s)"
              value={data.dirigeants
                .map((d) => `${d.prenom} ${d.nom} — ${d.fonction}`)
                .join(', ')}
              className="sm:col-span-2"
            />
            <Row
              label="Kbis émis le"
              value={new Date(data.kbisDate).toLocaleDateString('fr-FR')}
            />
          </dl>
        </div>
      )}

      {error && !loading && raw.length === 9 && (
        <div className="flex items-center gap-2 rounded-md border border-red/25 bg-red/8 px-3 py-2">
          <AlertCircle size={14} className="text-red" />
          <span className="font-body text-xs text-red font-medium">{error}</span>
        </div>
      )}
    </div>
  );
}

function Row({
  label,
  value,
  className,
}: {
  label: string;
  value: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={className}>
      <dt className="text-[10px] uppercase tracking-widest text-ink-3 font-bold">
        {label}
      </dt>
      <dd className="font-body text-[12.5px] font-semibold text-ink mt-0.5">
        {value}
      </dd>
    </div>
  );
}
