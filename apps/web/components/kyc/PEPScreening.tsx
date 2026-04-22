'use client';

// ─── components/kyc/PEPScreening.tsx ─────────────────────────────────────────
// Screening asynchrone des personnes politiquement exposées / sanctions.

import { useState } from 'react';
import {
  ShieldCheck,
  Loader2,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Search,
  type LucideIcon,
} from 'lucide-react';
import { cn } from '@/lib/cn';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge, type BadgeVariant } from '@/components/ui/badge';
import type { PEPScreeningResult, PEPMatch } from '@/lib/screening/pep-sanctions';
import { PEP_STATUS_LABELS, type PEPStatus } from '@/stores/kyc-store';

// ─── Helpers ────────────────────────────────────────────────────────────────

const STATUS_VARIANT: Record<PEPStatus, BadgeVariant> = {
  clear: 'teal',
  pep: 'gold',
  sanctioned: 'red',
};

const STATUS_ICON: Record<PEPStatus, LucideIcon> = {
  clear: CheckCircle2,
  pep: AlertTriangle,
  sanctioned: XCircle,
};

// ─── Props ──────────────────────────────────────────────────────────────────

interface PEPScreeningProps {
  initial?: { firstName?: string; lastName?: string; birthDate?: string };
  onComplete: (result: PEPScreeningResult) => void;
}

// ─── Component ──────────────────────────────────────────────────────────────

export function PEPScreening({ initial, onComplete }: PEPScreeningProps) {
  const [firstName, setFirstName] = useState(initial?.firstName ?? '');
  const [lastName, setLastName] = useState(initial?.lastName ?? '');
  const [birthDate, setBirthDate] = useState(initial?.birthDate ?? '');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<PEPScreeningResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const canRun = firstName.trim() && lastName.trim() && birthDate;

  const runScreening = async () => {
    if (!canRun) return;
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await fetch('/api/screening/pep-sanctions', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          birthDate,
        }),
      });
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(body.error ?? 'Screening indisponible');
      }
      const data = (await res.json()) as PEPScreeningResult;
      setResult(data);
      onComplete(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erreur pendant le screening.');
    } finally {
      setLoading(false);
    }
  };

  const StatusIcon = result ? STATUS_ICON[result.status] : ShieldCheck;

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Input
          label="Prénom"
          value={firstName}
          onChange={(e) => setFirstName(e.target.value)}
          placeholder="Claire"
        />
        <Input
          label="Nom"
          value={lastName}
          onChange={(e) => setLastName(e.target.value)}
          placeholder="Dubois"
        />
      </div>
      <Input
        label="Date de naissance"
        value={birthDate}
        onChange={(e) => setBirthDate(e.target.value)}
        type="date"
      />

      <Button
        variant="primary"
        loading={loading}
        disabled={!canRun || loading}
        onClick={runScreening}
      >
        {!loading && <Search size={14} />}
        {loading ? 'Screening en cours…' : 'Lancer le screening'}
      </Button>

      {loading && (
        <div className="rounded-md border border-violet/25 bg-violet-pale/40 px-3 py-3 flex items-center gap-3">
          <Loader2 size={16} className="text-violet animate-spin" />
          <div className="flex-1">
            <p className="font-body text-[12.5px] font-semibold text-violet">
              Interrogation des bases OFAC, UE, ONU et PPE…
            </p>
            <p className="font-body text-[10.5px] text-ink-3">
              Temps moyen : 2 secondes
            </p>
          </div>
        </div>
      )}

      {error && (
        <p
          role="alert"
          className="rounded-md border border-red/25 bg-red/8 px-3 py-2 font-body text-xs text-red font-medium"
        >
          {error}
        </p>
      )}

      {result && (
        <div
          className={cn(
            'rounded-xl border p-4 flex flex-col gap-3',
            result.status === 'clear' && 'border-teal/40 bg-teal/5',
            result.status === 'pep' && 'border-[#F0D98A] bg-[#FDF3D6]/60',
            result.status === 'sanctioned' && 'border-red/30 bg-red/5',
          )}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <StatusIcon
                size={18}
                className={cn(
                  result.status === 'clear' && 'text-teal',
                  result.status === 'pep' && 'text-[#9B7210]',
                  result.status === 'sanctioned' && 'text-red',
                )}
              />
              <span className="font-display font-bold text-[14px] text-ink">
                {PEP_STATUS_LABELS[result.status]}
              </span>
            </div>
            <Badge variant={STATUS_VARIANT[result.status]} size="md">
              {result.status === 'clear'
                ? 'Aucun match'
                : `${result.matches.length} match${result.matches.length > 1 ? 'es' : ''}`}
            </Badge>
          </div>

          {result.matches.length > 0 && (
            <ul className="flex flex-col gap-2">
              {result.matches.map((m: PEPMatch, i: number) => (
                <li
                  key={`${m.type}-${i}`}
                  className="rounded-md border border-border bg-white px-3 py-2"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-body text-[12px] font-semibold text-ink">
                      {m.type}
                    </span>
                    <span className="font-mono text-[10px] text-ink-3">
                      Confiance {(m.confidence * 100).toFixed(0)}%
                    </span>
                  </div>
                  <p className="font-body text-[11px] text-ink-3 mt-0.5">
                    Source : {m.source}
                  </p>
                  {m.notes && (
                    <p className="font-body text-[11px] text-ink-2 mt-1">
                      {m.notes}
                    </p>
                  )}
                </li>
              ))}
            </ul>
          )}

          <p className="font-body text-[10.5px] text-ink-3 font-mono">
            Screening effectué le{' '}
            {new Date(result.screenedAt).toLocaleString('fr-FR')}
          </p>
        </div>
      )}
    </div>
  );
}
