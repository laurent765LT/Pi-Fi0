'use client';

// ─── components/signatures/SignatureStatus.tsx ───────────────────────────────
// Affichage compact du statut d'une demande de signature : badge, signataires,
// timeline, bouton de rafraîchissement.

import { useEffect, useState } from 'react';
import {
  RefreshCw,
  CheckCircle2,
  Eye,
  Send,
  XCircle,
  Clock,
  Mail,
  Bell,
  FileCheck2,
  type LucideIcon,
} from 'lucide-react';
import { cn } from '@/lib/cn';
import { Badge, type BadgeVariant } from '@/components/ui/badge';
import {
  SIGNATURE_STATUS_LABELS,
  SIGNER_ROLE_LABELS,
  type SignatureEvent,
  type SignatureRequest,
  type SignatureStatus,
  type Signer,
} from '@/lib/yousign/types';
import { useSignaturesStore } from '@/stores/signatures-store';

// ─── Status → badge variant mapping ─────────────────────────────────────────

const STATUS_VARIANT: Record<SignatureStatus, BadgeVariant> = {
  draft: 'muted',
  sent: 'cobalt',
  viewed: 'gold',
  signed: 'teal',
  refused: 'red',
  expired: 'muted',
};

const STATUS_ICON: Record<SignatureStatus, LucideIcon> = {
  draft: Clock,
  sent: Send,
  viewed: Eye,
  signed: CheckCircle2,
  refused: XCircle,
  expired: Clock,
};

function formatDateTime(iso: string): string {
  try {
    return new Date(iso).toLocaleString('fr-FR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return iso;
  }
}

// ─── Signer row ─────────────────────────────────────────────────────────────

function SignerRow({ signer }: { signer: Signer }) {
  const Icon = STATUS_ICON[signer.status];
  return (
    <div className="flex items-center gap-3 py-2.5 border-b border-border/40 last:border-b-0">
      <div
        className={cn(
          'w-8 h-8 rounded-full flex items-center justify-center shrink-0',
          signer.status === 'signed' && 'bg-teal/10 text-teal',
          signer.status === 'refused' && 'bg-red/10 text-red',
          signer.status === 'viewed' && 'bg-[#FDF3D6] text-[#9B7210]',
          signer.status === 'sent' && 'bg-cobalt-pale text-cobalt',
          signer.status === 'expired' && 'bg-surface-2 text-ink-3',
          signer.status === 'draft' && 'bg-surface-2 text-ink-3',
        )}
      >
        <Icon size={14} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-body text-[13px] font-semibold text-ink dark:text-white truncate">
          {signer.firstName} {signer.lastName}
          <span className="ml-1.5 text-[10px] font-mono text-ink-3 font-normal">
            #{signer.order}
          </span>
        </p>
        <p className="font-body text-[10.5px] text-ink-3 dark:text-white/60 truncate">
          <Mail size={9} className="inline mr-1 opacity-60" />
          {signer.email}
        </p>
      </div>
      <div className="flex flex-col items-end gap-1 shrink-0">
        <Badge variant={STATUS_VARIANT[signer.status]} size="sm">
          {SIGNATURE_STATUS_LABELS[signer.status]}
        </Badge>
        <span className="text-[9px] text-ink-3 font-body">
          {SIGNER_ROLE_LABELS[signer.role]}
        </span>
      </div>
    </div>
  );
}

// ─── Timeline event ─────────────────────────────────────────────────────────

function TimelineEvent({ event, isLast }: { event: SignatureEvent; isLast: boolean }) {
  const iconByType = {
    created: FileCheck2,
    sent: Send,
    viewed: Eye,
    signed: CheckCircle2,
    refused: XCircle,
    expired: Clock,
    reminder: Bell,
  } as const;
  const colorByType: Record<SignatureEvent['type'], string> = {
    created: 'bg-violet text-white',
    sent: 'bg-cobalt text-white',
    viewed: 'bg-[#D4A017] text-white',
    signed: 'bg-teal text-white',
    refused: 'bg-red text-white',
    expired: 'bg-ink-3 text-white',
    reminder: 'bg-violet-mid text-white',
  };
  const Icon = iconByType[event.type];
  return (
    <div className="flex gap-3 relative">
      <div className="flex flex-col items-center shrink-0">
        <div className={cn('w-6 h-6 rounded-full flex items-center justify-center', colorByType[event.type])}>
          <Icon size={11} />
        </div>
        {!isLast && <div className="w-px flex-1 bg-border/60 mt-0.5" />}
      </div>
      <div className="flex-1 min-w-0 pb-3">
        <p className="font-body text-[12px] text-ink dark:text-white leading-snug">
          {event.message}
        </p>
        <p className="font-body text-[10px] text-ink-3 mt-0.5 font-mono">
          {formatDateTime(event.timestamp)}
        </p>
      </div>
    </div>
  );
}

// ─── Main component ─────────────────────────────────────────────────────────

interface SignatureStatusProps {
  requestId: string;
  compact?: boolean;
  className?: string;
}

export function SignatureStatus({
  requestId,
  compact = false,
  className,
}: SignatureStatusProps) {
  const request = useSignaturesStore((s) =>
    s.requests.find((r) => r.id === requestId),
  );
  const addReminder = useSignaturesStore((s) => s.addReminder);
  const [refreshing, setRefreshing] = useState(false);
  const [tick, setTick] = useState(0);

  // Polling léger pour rafraîchir la timeline (les timers du store mettent
  // déjà à jour l'état Zustand, mais on force un re-render doux)
  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 1500);
    return () => clearInterval(id);
  }, []);

  if (!request) {
    return (
      <div className={cn('text-ink-3 text-sm font-body italic', className)}>
        Demande introuvable.
      </div>
    );
  }

  const Icon = STATUS_ICON[request.status];
  const variant = STATUS_VARIANT[request.status];
  const totalSigners = request.signers.length;
  const signed = request.signers.filter((s) => s.status === 'signed').length;

  const handleRefresh = () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 600);
    setTick((t) => t + 1);
  };

  const handleReminder = () => {
    addReminder(request.id);
  };

  if (compact) {
    return (
      <div
        className={cn(
          'inline-flex items-center gap-2 rounded-md border border-border bg-white dark:bg-white/[0.03] px-2.5 py-1.5',
          className,
        )}
        data-tick={tick}
      >
        <Icon size={12} className="text-ink-3" />
        <Badge variant={variant} size="sm">
          {SIGNATURE_STATUS_LABELS[request.status]}
        </Badge>
        <span className="font-mono text-[10px] text-ink-3">
          {signed}/{totalSigners} signé{signed > 1 ? 's' : ''}
        </span>
      </div>
    );
  }

  return (
    <div
      className={cn(
        'rounded-xl border border-border bg-white dark:bg-white/[0.03] overflow-hidden',
        className,
      )}
      data-tick={tick}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-3 px-4 py-3 border-b border-border/60">
        <div className="flex items-center gap-2.5">
          <div
            className={cn(
              'w-9 h-9 rounded-lg flex items-center justify-center',
              request.status === 'signed' && 'bg-teal/10 text-teal',
              request.status === 'refused' && 'bg-red/10 text-red',
              request.status === 'viewed' && 'bg-[#FDF3D6] text-[#9B7210]',
              request.status === 'sent' && 'bg-cobalt-pale text-cobalt',
              (request.status === 'expired' || request.status === 'draft') &&
                'bg-surface-2 text-ink-3',
            )}
          >
            <Icon size={16} />
          </div>
          <div>
            <p className="font-display font-bold text-[14px] text-ink dark:text-white leading-tight">
              {request.documentName}
            </p>
            <p className="font-body text-[11px] text-ink-3 font-mono">
              {request.id}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={variant} size="md">
            {SIGNATURE_STATUS_LABELS[request.status]}
          </Badge>
          <button
            type="button"
            onClick={handleRefresh}
            className="inline-flex items-center justify-center w-7 h-7 rounded-md text-ink-3 hover:bg-surface-2 hover:text-ink transition-colors"
            aria-label="Rafraîchir le statut"
            title="Rafraîchir"
          >
            <RefreshCw size={12} className={refreshing ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {/* Signers */}
      <div className="px-4">
        <p className="font-body text-[10px] uppercase tracking-widest text-ink-3 font-bold pt-3 pb-1">
          Signataires ({signed}/{totalSigners})
        </p>
        <div>
          {request.signers.map((s) => (
            <SignerRow key={s.id} signer={s} />
          ))}
        </div>
      </div>

      {/* Timeline */}
      <div className="px-4 pb-3">
        <div className="flex items-center justify-between pt-3 pb-2">
          <p className="font-body text-[10px] uppercase tracking-widest text-ink-3 font-bold">
            Historique
          </p>
          {(request.status === 'sent' || request.status === 'viewed') && (
            <button
              type="button"
              onClick={handleReminder}
              className="inline-flex items-center gap-1.5 text-[10px] font-body font-semibold text-violet hover:text-violet-dark px-2 py-0.5 rounded-md hover:bg-violet-pale transition-colors"
            >
              <Bell size={10} />
              Relancer
            </button>
          )}
        </div>
        <div className="pt-1">
          {request.events.map((e, i) => (
            <TimelineEvent
              key={e.id}
              event={e}
              isLast={i === request.events.length - 1}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
