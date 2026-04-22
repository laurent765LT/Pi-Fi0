'use client';

// ─── /admin/kyc — Validation manuelle des dossiers KYC/KYB ───────────────────

import { useEffect, useMemo, useState } from 'react';
import {
  ShieldCheck,
  CheckCircle2,
  XCircle,
  Filter,
  Eye,
  User as UserIcon,
  Building2,
} from 'lucide-react';
import { cn } from '@/lib/cn';
import { PageHeader } from '@/components/ui/page-header';
import { Badge, type BadgeVariant } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import {
  useKYCStore,
  KYC_STATUS_LABELS,
  PEP_STATUS_LABELS,
  ID_DOCUMENT_TYPE_LABELS,
  type KYCStatus,
  type KYCRecord,
} from '@/stores/kyc-store';
import {
  useKYBStore,
  KYB_STATUS_LABELS,
  SCREENING_RESULT_LABELS,
  type KYBStatus,
  type KYBRecord,
} from '@/stores/kyb-store';

type TabKey = 'kyc' | 'kyb';

const KYC_STATUS_VARIANT: Record<KYCStatus, BadgeVariant> = {
  pending: 'gold',
  validated: 'teal',
  rejected: 'red',
};

const KYB_STATUS_VARIANT: Record<KYBStatus, BadgeVariant> = {
  pending: 'gold',
  validated: 'teal',
  rejected: 'red',
};

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

export default function AdminKYCPage() {
  const [hydrated, setHydrated] = useState(false);
  const [tab, setTab] = useState<TabKey>('kyc');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'validated' | 'rejected'>('all');

  const kycRecords = useKYCStore((s) => s.records);
  const kycUpdate = useKYCStore((s) => s.updateStatus);
  const kybRecords = useKYBStore((s) => s.records);
  const kybUpdate = useKYBStore((s) => s.updateStatus);

  useEffect(() => {
    setHydrated(true);
  }, []);

  const filteredKYC = useMemo(
    () =>
      kycRecords.filter((r) =>
        statusFilter === 'all' ? true : r.status === statusFilter,
      ),
    [kycRecords, statusFilter],
  );

  const filteredKYB = useMemo(
    () =>
      kybRecords.filter((r) =>
        statusFilter === 'all' ? true : r.status === statusFilter,
      ),
    [kybRecords, statusFilter],
  );

  const pendingKYC = kycRecords.filter((r) => r.status === 'pending').length;
  const pendingKYB = kybRecords.filter((r) => r.status === 'pending').length;

  return (
    <div className="max-w-[1280px] mx-auto">
      <PageHeader
        icon={ShieldCheck}
        title="Validation KYC / KYB"
        subtitle="Revue manuelle des dossiers de conformité avant activation."
      />

      {/* Tabs */}
      <div className="flex items-center gap-2 mb-4 border-b border-border">
        {(
          [
            { key: 'kyc' as const, label: 'KYC — personnes physiques', count: pendingKYC },
            { key: 'kyb' as const, label: 'KYB — personnes morales', count: pendingKYB },
          ]
        ).map(({ key, label, count }) => (
          <button
            key={key}
            type="button"
            onClick={() => setTab(key)}
            className={cn(
              'px-4 py-2.5 font-body text-[13px] font-semibold transition-colors border-b-2 -mb-px flex items-center gap-2',
              tab === key
                ? 'text-violet border-violet'
                : 'text-ink-3 border-transparent hover:text-ink',
            )}
          >
            {label}
            {count > 0 && (
              <Badge variant="gold" size="sm">
                {count} en attente
              </Badge>
            )}
          </button>
        ))}
      </div>

      {/* Filter */}
      <div className="mb-4 flex items-center gap-3">
        <Filter size={12} className="text-ink-3" />
        <label className="font-body text-[11px] font-semibold text-ink-2">
          Statut
        </label>
        <select
          value={statusFilter}
          onChange={(e) =>
            setStatusFilter(e.target.value as typeof statusFilter)
          }
          className="h-8 rounded-md bg-white border border-border px-2 text-xs font-body text-ink focus:outline-none focus:ring-2 focus:ring-violet"
        >
          <option value="all">Tous</option>
          <option value="pending">En attente</option>
          <option value="validated">Validé</option>
          <option value="rejected">Rejeté</option>
        </select>
      </div>

      {!hydrated ? (
        <div className="h-64 bg-surface-2/50 rounded-xl animate-pulse" />
      ) : tab === 'kyc' ? (
        <KYCTable
          records={filteredKYC}
          onValidate={(id) => kycUpdate(id, 'validated')}
          onReject={(id) => kycUpdate(id, 'rejected')}
        />
      ) : (
        <KYBTable
          records={filteredKYB}
          onValidate={(id) => kybUpdate(id, 'validated')}
          onReject={(id) => kybUpdate(id, 'rejected')}
        />
      )}
    </div>
  );
}

// ─── KYC Table ──────────────────────────────────────────────────────────────

function KYCTable({
  records,
  onValidate,
  onReject,
}: {
  records: KYCRecord[];
  onValidate: (id: string) => void;
  onReject: (id: string) => void;
}) {
  const [selected, setSelected] = useState<string | null>(null);

  if (records.length === 0) {
    return (
      <EmptyState
        icon={UserIcon}
        title="Aucun KYC"
        description="Aucun dossier KYC ne correspond aux filtres actifs."
      />
    );
  }

  const current = records.find((r) => r.id === selected);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1.3fr_1fr] gap-4">
      <div className="rounded-xl border border-border bg-white overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-surface-2 border-b border-border">
            <tr>
              <Th>Identité</Th>
              <Th>Document</Th>
              <Th>PEP</Th>
              <Th>Score AML</Th>
              <Th>Statut</Th>
              <Th>Créé</Th>
              <Th className="w-16" />
            </tr>
          </thead>
          <tbody>
            {records.map((r) => {
              const active = r.id === selected;
              return (
                <tr
                  key={r.id}
                  onClick={() => setSelected(r.id)}
                  className={cn(
                    'border-b border-border/60 cursor-pointer transition-colors',
                    active ? 'bg-violet-pale/60' : 'hover:bg-surface/80',
                  )}
                >
                  <Td>
                    <p className="font-body text-[13px] font-semibold text-ink">
                      {r.firstName} {r.lastName}
                    </p>
                    <p className="font-mono text-[10px] text-ink-3">
                      {new Date(r.birthDate).toLocaleDateString('fr-FR')}
                    </p>
                  </Td>
                  <Td>
                    <Badge variant="muted" size="sm">
                      {ID_DOCUMENT_TYPE_LABELS[r.idDocumentType]}
                    </Badge>
                  </Td>
                  <Td>
                    <Badge
                      variant={
                        r.pepStatus === 'clear'
                          ? 'teal'
                          : r.pepStatus === 'pep'
                            ? 'gold'
                            : 'red'
                      }
                      size="sm"
                    >
                      {PEP_STATUS_LABELS[r.pepStatus]}
                    </Badge>
                  </Td>
                  <Td>
                    <span className="font-mono text-[12px] text-ink">
                      {r.amlScore}/100
                    </span>
                  </Td>
                  <Td>
                    <Badge variant={KYC_STATUS_VARIANT[r.status]} size="sm">
                      {KYC_STATUS_LABELS[r.status]}
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
                      className="p-1.5 rounded text-ink-3 hover:bg-surface-2"
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

      {/* Detail */}
      <aside className="hidden lg:block">
        {current ? (
          <div className="rounded-xl border border-border bg-white overflow-hidden">
            <div className="bg-gradient-to-r from-violet-pale to-transparent px-4 py-3 border-b border-border">
              <p className="font-display font-bold text-[14px] text-ink">
                {current.firstName} {current.lastName}
              </p>
              <p className="font-mono text-[11px] text-ink-3">{current.id}</p>
            </div>
            <dl className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-3 text-[12px]">
              <Row
                label="Date de naissance"
                value={new Date(current.birthDate).toLocaleDateString('fr-FR')}
              />
              <Row
                label="Document"
                value={`${ID_DOCUMENT_TYPE_LABELS[current.idDocumentType]} — ${current.idDocumentNumber}`}
              />
              <Row
                label="Justificatif domicile"
                value={current.addressProofType}
              />
              <Row label="Screening PEP" value={PEP_STATUS_LABELS[current.pepStatus]} />
              <Row
                label="Score AML"
                value={
                  <span className="font-mono">{current.amlScore}/100</span>
                }
              />
              <Row
                label="Créé le"
                value={formatDate(current.createdAt)}
              />
            </dl>
            {current.amlQuestionnaire && (
              <div className="p-4 border-t border-border/60">
                <p className="text-[10px] uppercase tracking-widest text-ink-3 font-bold mb-1.5">
                  Questionnaire LCB-FT
                </p>
                <dl className="flex flex-col gap-1.5 text-[12px]">
                  {Object.entries(current.amlQuestionnaire).map(([k, v]) => (
                    <div
                      key={k}
                      className="flex items-center justify-between gap-3"
                    >
                      <dt className="text-ink-3 capitalize">{k}</dt>
                      <dd className="font-semibold text-ink text-right">
                        {v}
                      </dd>
                    </div>
                  ))}
                </dl>
              </div>
            )}
            {current.status === 'pending' && (
              <div className="flex items-center gap-2 p-4 border-t border-border/60">
                <Button
                  variant="teal"
                  className="flex-1"
                  onClick={() => onValidate(current.id)}
                >
                  <CheckCircle2 size={14} /> Valider
                </Button>
                <Button
                  variant="danger"
                  className="flex-1"
                  onClick={() => onReject(current.id)}
                >
                  <XCircle size={14} /> Rejeter
                </Button>
              </div>
            )}
          </div>
        ) : (
          <div className="rounded-xl border border-dashed border-border bg-surface/50 p-6 text-center">
            <UserIcon size={22} className="text-ink-3 mx-auto mb-2" />
            <p className="font-body text-[12px] text-ink-3">
              Sélectionnez un dossier pour consulter ses détails et valider.
            </p>
          </div>
        )}
      </aside>
    </div>
  );
}

// ─── KYB Table ──────────────────────────────────────────────────────────────

function KYBTable({
  records,
  onValidate,
  onReject,
}: {
  records: KYBRecord[];
  onValidate: (id: string) => void;
  onReject: (id: string) => void;
}) {
  const [selected, setSelected] = useState<string | null>(null);

  if (records.length === 0) {
    return (
      <EmptyState
        icon={Building2}
        title="Aucun KYB"
        description="Aucun dossier KYB ne correspond aux filtres actifs."
      />
    );
  }

  const current = records.find((r) => r.id === selected);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1.3fr_1fr] gap-4">
      <div className="rounded-xl border border-border bg-white overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-surface-2 border-b border-border">
            <tr>
              <Th>Dénomination</Th>
              <Th>Forme</Th>
              <Th>Screening</Th>
              <Th>Statut</Th>
              <Th>Créé</Th>
              <Th className="w-16" />
            </tr>
          </thead>
          <tbody>
            {records.map((r) => {
              const active = r.id === selected;
              return (
                <tr
                  key={r.id}
                  onClick={() => setSelected(r.id)}
                  className={cn(
                    'border-b border-border/60 cursor-pointer transition-colors',
                    active ? 'bg-violet-pale/60' : 'hover:bg-surface/80',
                  )}
                >
                  <Td>
                    <p className="font-body text-[13px] font-semibold text-ink">
                      {r.denomination}
                    </p>
                    <p className="font-mono text-[10px] text-ink-3">
                      SIREN {r.siren}
                    </p>
                  </Td>
                  <Td>
                    <Badge variant="muted" size="sm">
                      {r.formeJuridique}
                    </Badge>
                  </Td>
                  <Td>
                    <Badge
                      variant={
                        r.screeningResult === 'clear'
                          ? 'teal'
                          : r.screeningResult === 'warning'
                            ? 'gold'
                            : 'red'
                      }
                      size="sm"
                    >
                      {SCREENING_RESULT_LABELS[r.screeningResult]}
                    </Badge>
                  </Td>
                  <Td>
                    <Badge variant={KYB_STATUS_VARIANT[r.status]} size="sm">
                      {KYB_STATUS_LABELS[r.status]}
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
                      className="p-1.5 rounded text-ink-3 hover:bg-surface-2"
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

      <aside className="hidden lg:block">
        {current ? (
          <div className="rounded-xl border border-border bg-white overflow-hidden">
            <div className="bg-gradient-to-r from-violet-pale to-transparent px-4 py-3 border-b border-border">
              <p className="font-display font-bold text-[14px] text-ink">
                {current.denomination}
              </p>
              <p className="font-mono text-[11px] text-ink-3">
                SIREN {current.siren}
              </p>
            </div>
            <dl className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-3 text-[12px]">
              <Row label="Forme juridique" value={current.formeJuridique} />
              <Row
                label="Capital"
                value={new Intl.NumberFormat('fr-FR', {
                  style: 'currency',
                  currency: 'EUR',
                  maximumFractionDigits: 0,
                }).format(current.capital)}
              />
              <Row
                label="Adresse"
                value={current.adresse}
                className="sm:col-span-2"
              />
              <Row
                label="Dirigeant(s)"
                value={current.dirigeants
                  .map((d) => `${d.prenom} ${d.nom}`)
                  .join(', ')}
                className="sm:col-span-2"
              />
              <Row
                label="Screening"
                value={SCREENING_RESULT_LABELS[current.screeningResult]}
              />
              <Row label="Créé le" value={formatDate(current.createdAt)} />
            </dl>

            <div className="p-4 border-t border-border/60">
              <p className="text-[10px] uppercase tracking-widest text-ink-3 font-bold mb-1.5">
                Bénéficiaires effectifs
              </p>
              <ul className="flex flex-col gap-1 text-[12px]">
                {current.beneficiairesEffectifs.map((b, i) => (
                  <li
                    key={i}
                    className="flex items-center justify-between border-b border-border/40 last:border-b-0 py-1"
                  >
                    <span className="font-body text-ink">
                      {b.prenom} {b.nom}
                    </span>
                    <span className="font-mono font-bold text-violet">
                      {b.pctDetention} %
                    </span>
                  </li>
                ))}
              </ul>
            </div>

            {current.status === 'pending' && (
              <div className="flex items-center gap-2 p-4 border-t border-border/60">
                <Button
                  variant="teal"
                  className="flex-1"
                  onClick={() => onValidate(current.id)}
                >
                  <CheckCircle2 size={14} /> Valider
                </Button>
                <Button
                  variant="danger"
                  className="flex-1"
                  onClick={() => onReject(current.id)}
                >
                  <XCircle size={14} /> Rejeter
                </Button>
              </div>
            )}
          </div>
        ) : (
          <div className="rounded-xl border border-dashed border-border bg-surface/50 p-6 text-center">
            <Building2 size={22} className="text-ink-3 mx-auto mb-2" />
            <p className="font-body text-[12px] text-ink-3">
              Sélectionnez une entreprise pour consulter ses détails.
            </p>
          </div>
        )}
      </aside>
    </div>
  );
}

// ─── Helpers ────────────────────────────────────────────────────────────────

function Th({
  children,
  className,
}: {
  children?: React.ReactNode;
  className?: string;
}) {
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
