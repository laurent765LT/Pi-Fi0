'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import {
  FileText,
  Plus,
  Search,
  Trash2,
  Eye,
  Filter,
  ArrowUpDown,
} from 'lucide-react';
import { cn } from '@/lib/cn';
import { PageHeader } from '@/components/ui/page-header';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { EmptyState } from '@/components/ui/empty-state';
import { Pagination } from '@/components/ui/pagination';
import { ToastContainer, useToast } from '@/components/ui/toast';
import {
  useClientsStore,
  STATUS_LABELS,
  type ClientDossier,
  type DossierStatus,
} from '@/stores/clients-store';

// ─── Helpers ────────────────────────────────────────────────────────────────

const PAGE_SIZE = 10;

const STATUS_VARIANT: Record<DossierStatus, 'gold' | 'teal' | 'muted'> = {
  brouillon: 'gold',
  signe: 'teal',
  archive: 'muted',
};

const STATUS_OPTIONS: Array<{ value: 'all' | DossierStatus; label: string }> = [
  { value: 'all', label: 'Tous les statuts' },
  { value: 'brouillon', label: STATUS_LABELS.brouillon },
  { value: 'signe', label: STATUS_LABELS.signe },
  { value: 'archive', label: STATUS_LABELS.archive },
];

type SortKey = 'name' | 'createdAt' | 'status';

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return '\u2014';
  }
}

function getInitials(first: string, last: string): string {
  return ((first[0] ?? '') + (last[0] ?? '')).toUpperCase() || 'CL';
}

// ─── Page ───────────────────────────────────────────────────────────────────

export default function DossiersClientsPage() {
  const dossiers = useClientsStore((s) => s.dossiers);
  const remove = useClientsStore((s) => s.remove);
  const { toasts, success, dismiss } = useToast();

  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | DossierStatus>('all');
  const [sortKey, setSortKey] = useState<SortKey>('createdAt');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  const [page, setPage] = useState(1);

  // ── Counters by status (used in filter chips) ──
  const counts = useMemo(() => {
    const c: Record<'all' | DossierStatus, number> = {
      all: dossiers.length,
      brouillon: 0,
      signe: 0,
      archive: 0,
    };
    for (const d of dossiers) c[d.status]++;
    return c;
  }, [dossiers]);

  // ── Filtered / sorted rows ──
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const base = dossiers.filter((d) => {
      if (statusFilter !== 'all' && d.status !== statusFilter) return false;
      if (!q) return true;
      return (
        d.firstName.toLowerCase().includes(q) ||
        d.lastName.toLowerCase().includes(q) ||
        d.profession.toLowerCase().includes(q)
      );
    });

    const sorted = [...base].sort((a, b) => {
      let cmp = 0;
      if (sortKey === 'name') {
        cmp = `${a.lastName} ${a.firstName}`.localeCompare(
          `${b.lastName} ${b.firstName}`,
          'fr',
        );
      } else if (sortKey === 'createdAt') {
        cmp = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      } else {
        cmp = a.status.localeCompare(b.status);
      }
      return sortDir === 'asc' ? cmp : -cmp;
    });
    return sorted;
  }, [dossiers, query, statusFilter, sortKey, sortDir]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const paged = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDir(key === 'createdAt' ? 'desc' : 'asc');
    }
  };

  const handleDelete = (d: ClientDossier) => {
    if (
      !window.confirm(
        `Supprimer d\u00e9finitivement le dossier de ${d.firstName} ${d.lastName} ?`,
      )
    ) {
      return;
    }
    remove(d.id);
    success('Dossier supprim\u00e9.');
  };

  return (
    <div className="max-w-[1100px] mx-auto">
      <PageHeader
        icon={FileText}
        title="Dossiers clients"
        subtitle="Constituer, signer et archiver les dossiers r\u00e9glementaires (CIF / IOBSP / MIF II)."
      >
        <Button asChild>
          <Link href="/dossiers-clients/nouveau">
            <Plus size={14} />
            Nouveau dossier
          </Link>
        </Button>
      </PageHeader>

      {/* Filters bar */}
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center gap-3 mb-5">
        <div className="relative flex-1">
          <Search
            size={14}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-3 pointer-events-none"
          />
          <Input
            placeholder="Rechercher un client, une profession..."
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setPage(1);
            }}
            className="pl-9"
          />
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {STATUS_OPTIONS.map((opt) => {
            const active = statusFilter === opt.value;
            const count = counts[opt.value];
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => {
                  setStatusFilter(opt.value);
                  setPage(1);
                }}
                className={cn(
                  'inline-flex items-center gap-1.5 h-8 px-3 rounded-full border',
                  'font-body text-[12px] font-semibold',
                  'transition-all duration-150',
                  active
                    ? 'bg-[#3B1FA8] border-[#3B1FA8] text-white shadow-sm'
                    : 'bg-white dark:bg-white/5 border-border text-ink-2 hover:border-[#3B1FA8]/40',
                )}
              >
                {opt.label}
                <span
                  className={cn(
                    'inline-flex items-center justify-center min-w-[18px] h-[16px] px-1 rounded-full text-[9.5px] font-bold',
                    active
                      ? 'bg-white/25 text-white'
                      : 'bg-surface-2 text-ink-3',
                  )}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {dossiers.length === 0 ? (
        <EmptyState
          icon={FileText}
          title="Aucun dossier client"
          description="Commencez par cr\u00e9er votre premier dossier. Strick\u2019in g\u00e9n\u00e9rera automatiquement la lettre de mission, le DER et le rapport d\u2019ad\u00e9quation."
          actionLabel="Nouveau dossier"
          actionHref="/dossiers-clients/nouveau"
        />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={Filter}
          title="Aucun dossier ne correspond"
          description="Modifiez votre recherche ou r\u00e9initialisez les filtres."
        />
      ) : (
        <>
          {/* Table */}
          <div className="rounded-xl border border-border bg-white dark:bg-white/[0.03] overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-[#F8F6FF] dark:bg-white/[0.04] border-b border-border">
                    <SortHeader
                      label="Client"
                      active={sortKey === 'name'}
                      dir={sortDir}
                      onClick={() => toggleSort('name')}
                    />
                    <th className="text-left px-4 py-2.5 font-body text-[10px] uppercase tracking-wider text-ink-3 font-bold">
                      Profession
                    </th>
                    <SortHeader
                      label="Cr\u00e9\u00e9 le"
                      active={sortKey === 'createdAt'}
                      dir={sortDir}
                      onClick={() => toggleSort('createdAt')}
                    />
                    <SortHeader
                      label="Statut"
                      active={sortKey === 'status'}
                      dir={sortDir}
                      onClick={() => toggleSort('status')}
                    />
                    <th className="text-right px-4 py-2.5 font-body text-[10px] uppercase tracking-wider text-ink-3 font-bold">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {paged.map((d, idx) => (
                    <tr
                      key={d.id}
                      className={cn(
                        'border-b border-border/60 last:border-b-0 transition-colors duration-150 hover:bg-[#F8F6FF]/50 dark:hover:bg-white/[0.03]',
                        idx % 2 === 0 ? '' : 'bg-[#FBFAFF]/50 dark:bg-white/[0.01]',
                      )}
                    >
                      {/* Client */}
                      <td className="px-4 py-3">
                        <Link
                          href={`/dossiers-clients/${d.id}`}
                          className="flex items-center gap-3 group min-w-0"
                        >
                          <div
                            className="w-9 h-9 rounded-full flex items-center justify-center shrink-0 text-white"
                            style={{
                              background: 'linear-gradient(135deg, #3B1FA8 0%, #5535C4 100%)',
                            }}
                          >
                            <span className="font-display font-bold text-[11px] leading-none">
                              {getInitials(d.firstName, d.lastName)}
                            </span>
                          </div>
                          <div className="min-w-0">
                            <p className="font-body text-[13px] font-semibold text-ink dark:text-white group-hover:text-[#3B1FA8] dark:group-hover:text-[#C9BCFF] transition-colors truncate">
                              {d.firstName} {d.lastName}
                            </p>
                            <p className="font-body text-[11px] text-ink-3 truncate">
                              {d.objectives.length > 0
                                ? `${d.objectives.length} objectif${d.objectives.length > 1 ? 's' : ''} \u00b7 ${d.proposedProducts.length} produit${d.proposedProducts.length > 1 ? 's' : ''}`
                                : 'Aucun objectif'}
                            </p>
                          </div>
                        </Link>
                      </td>

                      {/* Profession */}
                      <td className="px-4 py-3">
                        <span className="font-body text-[12px] text-ink-2 dark:text-white/80">
                          {d.profession || '\u2014'}
                        </span>
                      </td>

                      {/* Created */}
                      <td className="px-4 py-3">
                        <span className="font-body text-[12px] text-ink-2 dark:text-white/80 tabular-nums">
                          {formatDate(d.createdAt)}
                        </span>
                      </td>

                      {/* Status */}
                      <td className="px-4 py-3">
                        <Badge variant={STATUS_VARIANT[d.status]} size="md">
                          {STATUS_LABELS[d.status]}
                        </Badge>
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-3 text-right">
                        <div className="inline-flex items-center gap-1">
                          <Link
                            href={`/dossiers-clients/${d.id}`}
                            aria-label="Voir le dossier"
                            className="inline-flex items-center justify-center w-8 h-8 rounded-md text-ink-3 hover:bg-[#3B1FA8]/10 hover:text-[#3B1FA8] transition-colors"
                          >
                            <Eye size={14} />
                          </Link>
                          <button
                            type="button"
                            aria-label="Supprimer"
                            onClick={() => handleDelete(d)}
                            className="inline-flex items-center justify-center w-8 h-8 rounded-md text-ink-3 hover:bg-red/10 hover:text-red transition-colors"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-4">
              <p className="font-body text-xs text-ink-3">
                {filtered.length} dossier{filtered.length > 1 ? 's' : ''} \u2014 page {safePage} / {totalPages}
              </p>
              <Pagination
                currentPage={safePage}
                totalPages={totalPages}
                onPageChange={setPage}
              />
            </div>
          )}
        </>
      )}

      <ToastContainer toasts={toasts} onDismiss={dismiss} />
    </div>
  );
}

// ─── Sortable header cell ───────────────────────────────────────────────────

function SortHeader({
  label,
  active,
  dir,
  onClick,
}: {
  label: string;
  active: boolean;
  dir: 'asc' | 'desc';
  onClick: () => void;
}) {
  return (
    <th className="text-left px-4 py-2.5">
      <button
        type="button"
        onClick={onClick}
        className={cn(
          'inline-flex items-center gap-1.5 font-body text-[10px] uppercase tracking-wider font-bold',
          'transition-colors duration-150',
          active ? 'text-[#3B1FA8] dark:text-[#C9BCFF]' : 'text-ink-3 hover:text-ink-2',
        )}
        aria-sort={active ? (dir === 'asc' ? 'ascending' : 'descending') : undefined}
      >
        {label}
        <ArrowUpDown
          size={10}
          className={cn(
            'transition-transform duration-150',
            active && dir === 'asc' && 'rotate-180',
          )}
        />
      </button>
    </th>
  );
}
