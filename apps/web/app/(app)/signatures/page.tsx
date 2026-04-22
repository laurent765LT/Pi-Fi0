'use client';

// ─── /signatures — Dashboard des demandes de signature électronique ──────────

import { useEffect, useMemo, useState } from 'react';
import {
  PenTool,
  Filter,
  Search,
  Eye,
  Clock,
  CheckCircle2,
  Send,
  XCircle,
  Hourglass,
  type LucideIcon,
} from 'lucide-react';
import { cn } from '@/lib/cn';
import { PageHeader } from '@/components/ui/page-header';
import { Badge, type BadgeVariant } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { SignatureStatus as SignatureStatusPanel } from '@/components/signatures/SignatureStatus';
import {
  useSignaturesStore,
  countByStatus,
} from '@/stores/signatures-store';
import {
  DOCUMENT_TYPE_LABELS,
  SIGNATURE_STATUS_LABELS,
  type SignatureDocumentType,
  type SignatureStatus,
} from '@/lib/yousign/types';

const STATUS_VARIANT: Record<SignatureStatus, BadgeVariant> = {
  draft: 'muted',
  sent: 'cobalt',
  viewed: 'gold',
  signed: 'teal',
  refused: 'red',
  expired: 'muted',
};

const STATUS_OPTIONS: Array<{ value: 'all' | SignatureStatus; label: string }> = [
  { value: 'all', label: 'Tous statuts' },
  { value: 'sent', label: 'Envoyée' },
  { value: 'viewed', label: 'Consultée' },
  { value: 'signed', label: 'Signée' },
  { value: 'refused', label: 'Refusée' },
  { value: 'expired', label: 'Expirée' },
];

const TYPE_OPTIONS: Array<{ value: 'all' | SignatureDocumentType; label: string }> = [
  { value: 'all', label: 'Tous types' },
  { value: 'bulletin-souscription', label: DOCUMENT_TYPE_LABELS['bulletin-souscription'] },
  { value: 'fiche-produit', label: DOCUMENT_TYPE_LABELS['fiche-produit'] },
  { value: 'lettre-mission', label: DOCUMENT_TYPE_LABELS['lettre-mission'] },
  { value: 'der', label: DOCUMENT_TYPE_LABELS['der'] },
  { value: 'kid', label: DOCUMENT_TYPE_LABELS['kid'] },
  { value: 'rapport-adequation', label: DOCUMENT_TYPE_LABELS['rapport-adequation'] },
];

function formatDate(iso: string): string {
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

export default function SignaturesPage() {
  const requests = useSignaturesStore((s) => s.requests);
  const [hydrated, setHydrated] = useState(false);
  const [statusFilter, setStatusFilter] = useState<'all' | SignatureStatus>('all');
  const [typeFilter, setTypeFilter] = useState<'all' | SignatureDocumentType>('all');
  const [query, setQuery] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);

  useEffect(() => {
    setHydrated(true);
  }, []);

  // Highlight from URL (?highlight=sig-xxxx)
  useEffect(() => {
    if (!hydrated) return;
    const params = new URLSearchParams(window.location.search);
    const id = params.get('highlight');
    if (id) setSelectedId(id);
  }, [hydrated]);

  const counts = useMemo(() => countByStatus(requests), [requests]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return requests.filter((r) => {
      if (statusFilter !== 'all' && r.status !== statusFilter) return false;
      if (typeFilter !== 'all' && r.documentType !== typeFilter) return false;
      if (q) {
        const inDoc = r.documentName.toLowerCase().includes(q);
        const inSigner = r.signers.some((s) =>
          `${s.firstName} ${s.lastName} ${s.email}`.toLowerCase().includes(q),
        );
        if (!inDoc && !inSigner) return false;
      }
      return true;
    });
  }, [requests, statusFilter, typeFilter, query]);

  const selected = selectedId
    ? requests.find((r) => r.id === selectedId) ?? null
    : null;

  const pending = counts.sent + counts.viewed + counts.draft;

  return (
    <div className="max-w-[1280px] mx-auto">
      <PageHeader
        icon={PenTool}
        title="Signatures électroniques"
        subtitle="Pilotez vos demandes Yousign et suivez leur avancée en temps réel."
      />

      {/* KPIs */}
      <section className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <KpiCard
          icon={Send}
          label="Total"
          value={requests.length}
          tone="violet"
        />
        <KpiCard
          icon={Hourglass}
          label="En attente"
          value={pending}
          tone="gold"
        />
        <KpiCard
          icon={CheckCircle2}
          label="Signées"
          value={counts.signed}
          tone="teal"
        />
        <KpiCard
          icon={XCircle}
          label="Refusées"
          value={counts.refused}
          tone="red"
        />
      </section>

      {/* Filters */}
      <section className="rounded-xl border border-border bg-white dark:bg-white/[0.03] p-3 mb-4 flex flex-wrap items-end gap-3">
        <div className="flex-1 min-w-[220px]">
          <label className="font-body text-[11px] font-semibold text-ink-2 flex items-center gap-1 mb-1">
            <Search size={11} /> Rechercher
          </label>
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Document ou signataire..."
            className="h-9"
          />
        </div>
        <div>
          <label className="font-body text-[11px] font-semibold text-ink-2 flex items-center gap-1 mb-1">
            <Filter size={11} /> Statut
          </label>
          <select
            value={statusFilter}
            onChange={(e) =>
              setStatusFilter(e.target.value as typeof statusFilter)
            }
            className="h-9 rounded-md bg-surface-2 border border-border-2 px-3 text-sm font-body text-ink focus:outline-none focus:ring-2 focus:ring-violet"
          >
            {STATUS_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="font-body text-[11px] font-semibold text-ink-2 flex items-center gap-1 mb-1">
            <Filter size={11} /> Type
          </label>
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value as typeof typeFilter)}
            className="h-9 rounded-md bg-surface-2 border border-border-2 px-3 text-sm font-body text-ink focus:outline-none focus:ring-2 focus:ring-violet"
          >
            {TYPE_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>
      </section>

      {/* Layout : table + panel */}
      <div className="grid grid-cols-1 lg:grid-cols-[1.3fr_1fr] gap-4">
        {/* Table */}
        <section className="rounded-xl border border-border bg-white dark:bg-white/[0.03] overflow-hidden">
          {!hydrated ? (
            <div className="h-48 bg-surface-2/50 animate-pulse" />
          ) : filtered.length === 0 ? (
            <EmptyState
              icon={PenTool}
              title="Aucune demande"
              description="Aucune signature ne correspond aux filtres actifs."
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-surface-2 border-b border-border">
                  <tr>
                    <Th>Document</Th>
                    <Th>Type</Th>
                    <Th>Signataires</Th>
                    <Th>Statut</Th>
                    <Th>Créée</Th>
                    <Th className="w-12" />
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((r) => {
                    const signed = r.signers.filter(
                      (s) => s.status === 'signed',
                    ).length;
                    const isSelected = r.id === selectedId;
                    return (
                      <tr
                        key={r.id}
                        onClick={() => setSelectedId(r.id)}
                        className={cn(
                          'border-b border-border/60 cursor-pointer transition-colors',
                          isSelected
                            ? 'bg-violet-pale/60'
                            : 'hover:bg-surface/80',
                        )}
                      >
                        <Td>
                          <p className="font-body text-[13px] font-semibold text-ink dark:text-white truncate max-w-[240px]">
                            {r.documentName}
                          </p>
                          <p className="font-mono text-[10px] text-ink-3">
                            {r.id}
                          </p>
                        </Td>
                        <Td>
                          <Badge variant="muted" size="sm">
                            {DOCUMENT_TYPE_LABELS[r.documentType]}
                          </Badge>
                        </Td>
                        <Td>
                          <span className="font-mono text-[11.5px] text-ink">
                            {signed}/{r.signers.length}
                          </span>
                        </Td>
                        <Td>
                          <Badge variant={STATUS_VARIANT[r.status]} size="sm">
                            {SIGNATURE_STATUS_LABELS[r.status]}
                          </Badge>
                        </Td>
                        <Td>
                          <span className="font-body text-[11px] text-ink-3">
                            {formatDate(r.createdAt)}
                          </span>
                        </Td>
                        <Td>
                          <button
                            type="button"
                            className="p-1.5 rounded text-ink-3 hover:bg-surface-2 hover:text-ink"
                            aria-label="Voir"
                          >
                            <Eye size={13} />
                          </button>
                        </Td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* Detail panel */}
        <aside className="hidden lg:block">
          {selected ? (
            <SignatureStatusPanel requestId={selected.id} />
          ) : (
            <div className="rounded-xl border border-dashed border-border bg-surface/50 p-6 text-center">
              <Clock size={22} className="text-ink-3 mx-auto mb-2" />
              <p className="font-body text-[12px] text-ink-3">
                Sélectionnez une demande pour afficher sa timeline et ses
                signataires.
              </p>
            </div>
          )}
        </aside>
      </div>

      {/* Mobile panel */}
      {selected && (
        <div className="lg:hidden mt-4">
          <SignatureStatusPanel requestId={selected.id} />
          <div className="text-center mt-3">
            <Button
              variant="muted"
              size="sm"
              onClick={() => setSelectedId(null)}
            >
              Fermer la vue détaillée
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Bits ──────────────────────────────────────────────────────────────────

function Th({ children, className }: { children?: React.ReactNode; className?: string }) {
  return (
    <th
      className={cn(
        'text-left px-3 py-2 font-body text-[10px] uppercase tracking-widest font-bold text-ink-3',
        className,
      )}
    >
      {children}
    </th>
  );
}

function Td({ children }: { children: React.ReactNode }) {
  return <td className="px-3 py-2.5 align-middle">{children}</td>;
}

function KpiCard({
  icon: Icon,
  label,
  value,
  tone,
}: {
  icon: LucideIcon;
  label: string;
  value: number;
  tone: 'violet' | 'gold' | 'teal' | 'red';
}) {
  const toneMap: Record<typeof tone, string> = {
    violet: 'bg-violet text-white',
    gold: 'bg-[#D4A017] text-white',
    teal: 'bg-teal text-white',
    red: 'bg-red text-white',
  };
  return (
    <div className="rounded-xl border border-border bg-white dark:bg-white/[0.03] p-4 flex items-center gap-3">
      <div
        className={cn(
          'w-10 h-10 rounded-lg flex items-center justify-center shrink-0',
          toneMap[tone],
        )}
      >
        <Icon size={16} />
      </div>
      <div className="min-w-0">
        <p className="font-body text-[10px] uppercase tracking-widest font-bold text-ink-3">
          {label}
        </p>
        <p className="font-display font-bold text-[22px] text-ink dark:text-white leading-tight">
          {value}
        </p>
      </div>
    </div>
  );
}
