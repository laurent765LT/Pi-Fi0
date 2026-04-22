'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import {
  Users,
  Plus,
  Search,
  Eye,
  Filter,
  ArrowUp,
  ArrowDown,
  Mail,
  Building2,
  Wallet,
} from 'lucide-react';
import { cn } from '@/lib/cn';
import { PageHeader } from '@/components/ui/page-header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { EmptyState } from '@/components/ui/empty-state';
import { Pagination } from '@/components/ui/pagination';
import {
  useConsolidatedClientsStore,
  INSURER_COLORS,
  INSURER_LIST,
  type InsurerName,
} from '@/stores/clients-consolidated-store';
import { getClientListRow } from '@/lib/portfolio/aggregation-engine';

const PAGE_SIZE = 6;

type SortKey = 'name' | 'exposure' | 'contracts' | 'products' | 'createdAt';
type SortDir = 'asc' | 'desc';

function formatAmount(amount: number): string {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatDate(iso: string | null): string {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return '—';
  }
}

function getInitials(first: string, last: string): string {
  return ((first[0] ?? '') + (last[0] ?? '')).toUpperCase() || 'CL';
}

// ─── Sort header ────────────────────────────────────────────────────────────

function SortHeader({
  label,
  active,
  dir,
  onClick,
  align,
}: {
  label: string;
  active: boolean;
  dir: SortDir;
  onClick: () => void;
  align?: 'left' | 'right';
}) {
  return (
    <th
      className={cn(
        'px-4 py-2.5 font-body text-[10px] uppercase tracking-wider text-ink-3 font-bold',
        align === 'right' ? 'text-right' : 'text-left',
      )}
    >
      <button
        type="button"
        onClick={onClick}
        className={cn(
          'inline-flex items-center gap-1 uppercase',
          'hover:text-violet transition-colors',
          active && 'text-violet',
          align === 'right' && 'flex-row-reverse',
        )}
      >
        {label}
        {active &&
          (dir === 'asc' ? <ArrowUp size={10} /> : <ArrowDown size={10} />)}
      </button>
    </th>
  );
}

// ─── Page ───────────────────────────────────────────────────────────────────

export default function ClientsListPage() {
  const clients = useConsolidatedClientsStore((s) => s.clients);

  const [query, setQuery] = useState('');
  const [insurerFilter, setInsurerFilter] = useState<InsurerName | 'all'>('all');
  const [sortKey, setSortKey] = useState<SortKey>('exposure');
  const [sortDir, setSortDir] = useState<SortDir>('desc');
  const [page, setPage] = useState(1);

  const rows = useMemo(
    () => clients.map((c) => ({ client: c, row: getClientListRow(c) })),
    [clients],
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const base = rows.filter(({ client, row }) => {
      if (insurerFilter !== 'all') {
        const hasInsurer = client.contracts.some(
          (c) => c.insurer === insurerFilter,
        );
        if (!hasInsurer) return false;
      }
      if (!q) return true;
      return (
        row.firstName.toLowerCase().includes(q) ||
        row.lastName.toLowerCase().includes(q) ||
        row.email.toLowerCase().includes(q)
      );
    });

    const sorted = [...base].sort((a, b) => {
      let cmp = 0;
      switch (sortKey) {
        case 'name':
          cmp = `${a.row.lastName} ${a.row.firstName}`.localeCompare(
            `${b.row.lastName} ${b.row.firstName}`,
            'fr',
          );
          break;
        case 'exposure':
          cmp = a.row.exposure - b.row.exposure;
          break;
        case 'contracts':
          cmp = a.row.contractsCount - b.row.contractsCount;
          break;
        case 'products':
          cmp = a.row.productsCount - b.row.productsCount;
          break;
        case 'createdAt':
          cmp =
            new Date(a.row.createdAt).getTime() -
            new Date(b.row.createdAt).getTime();
          break;
      }
      return sortDir === 'asc' ? cmp : -cmp;
    });

    return sorted;
  }, [rows, query, insurerFilter, sortKey, sortDir]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const paged = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDir(
        key === 'exposure' ||
          key === 'contracts' ||
          key === 'products' ||
          key === 'createdAt'
          ? 'desc'
          : 'asc',
      );
    }
  };

  // ── Totals across all clients ──
  const totals = useMemo(() => {
    const exposure = rows.reduce((acc, r) => acc + r.row.exposure, 0);
    const products = rows.reduce((acc, r) => acc + r.row.productsCount, 0);
    return { exposure, products };
  }, [rows]);

  return (
    <div className="max-w-[1180px] mx-auto animate-fade-in">
      <PageHeader
        icon={Users}
        title="Mes clients"
        subtitle="Portefeuilles consolidés par client, multi-contrats et multi-assureurs."
      >
        <Button asChild>
          <Link href="/dossiers-clients/nouveau">
            <Plus size={14} />
            Nouveau client
          </Link>
        </Button>
      </PageHeader>

      {/* Top stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-5">
        <div className="rounded-xl border border-border bg-white dark:bg-white/[0.03] p-4">
          <p className="text-[10px] uppercase tracking-[0.18em] text-ink-3 font-bold">
            Clients
          </p>
          <p className="font-display text-[24px] font-extrabold text-ink dark:text-white mt-1 tabular-nums">
            {clients.length}
          </p>
        </div>
        <div className="rounded-xl border border-border bg-white dark:bg-white/[0.03] p-4">
          <p className="text-[10px] uppercase tracking-[0.18em] text-ink-3 font-bold">
            Exposition consolidée
          </p>
          <p className="font-display text-[24px] font-extrabold text-ink dark:text-white mt-1 tabular-nums">
            {formatAmount(totals.exposure)}
          </p>
        </div>
        <div className="rounded-xl border border-border bg-white dark:bg-white/[0.03] p-4">
          <p className="text-[10px] uppercase tracking-[0.18em] text-ink-3 font-bold">
            Lignes produits
          </p>
          <p className="font-display text-[24px] font-extrabold text-ink dark:text-white mt-1 tabular-nums">
            {totals.products}
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center gap-3 mb-5">
        <div className="relative flex-1">
          <Search
            size={14}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-3 pointer-events-none"
            aria-hidden
          />
          <Input
            placeholder="Rechercher un client, un email..."
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setPage(1);
            }}
            className="pl-9"
            aria-label="Rechercher un client"
          />
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={() => {
              setInsurerFilter('all');
              setPage(1);
            }}
            className={cn(
              'inline-flex items-center gap-1.5 h-8 px-3 rounded-full border',
              'font-body text-[12px] font-semibold transition-all duration-150',
              insurerFilter === 'all'
                ? 'bg-violet border-violet text-white shadow-sm'
                : 'bg-white dark:bg-white/5 border-border text-ink-2 hover:border-violet/40',
            )}
          >
            Tous les assureurs
          </button>
          {INSURER_LIST.map((ins) => {
            const active = insurerFilter === ins;
            return (
              <button
                key={ins}
                type="button"
                onClick={() => {
                  setInsurerFilter(ins);
                  setPage(1);
                }}
                className={cn(
                  'inline-flex items-center gap-1.5 h-8 px-3 rounded-full border',
                  'font-body text-[12px] font-semibold transition-all duration-150',
                  active
                    ? 'text-white shadow-sm'
                    : 'bg-white dark:bg-white/5 border-border text-ink-2 hover:border-violet/40',
                )}
                style={
                  active
                    ? {
                        background: INSURER_COLORS[ins],
                        borderColor: INSURER_COLORS[ins],
                      }
                    : undefined
                }
              >
                <span
                  aria-hidden
                  className="w-1.5 h-1.5 rounded-full"
                  style={{
                    background: active ? '#fff' : INSURER_COLORS[ins],
                  }}
                />
                {ins}
              </button>
            );
          })}
        </div>
      </div>

      {/* Empty states */}
      {clients.length === 0 ? (
        <EmptyState
          icon={Users}
          title="Aucun client"
          description="Ajoutez votre premier client pour consolider ses contrats et produits structurés."
          actionLabel="Nouveau client"
          actionHref="/dossiers-clients/nouveau"
        />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={Filter}
          title="Aucun client ne correspond"
          description="Modifiez votre recherche ou réinitialisez les filtres."
        />
      ) : (
        <>
          {/* Table */}
          <div className="rounded-xl border border-border bg-white dark:bg-white/[0.03] overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-violet-pale/40 dark:bg-white/[0.04] border-b border-border">
                    <SortHeader
                      label="Client"
                      active={sortKey === 'name'}
                      dir={sortDir}
                      onClick={() => toggleSort('name')}
                    />
                    <th className="text-left px-4 py-2.5 font-body text-[10px] uppercase tracking-wider text-ink-3 font-bold">
                      Email
                    </th>
                    <SortHeader
                      label="Contrats"
                      active={sortKey === 'contracts'}
                      dir={sortDir}
                      onClick={() => toggleSort('contracts')}
                      align="right"
                    />
                    <SortHeader
                      label="Exposition"
                      active={sortKey === 'exposure'}
                      dir={sortDir}
                      onClick={() => toggleSort('exposure')}
                      align="right"
                    />
                    <SortHeader
                      label="Produits"
                      active={sortKey === 'products'}
                      dir={sortDir}
                      onClick={() => toggleSort('products')}
                      align="right"
                    />
                    <th className="text-left px-4 py-2.5 font-body text-[10px] uppercase tracking-wider text-ink-3 font-bold">
                      Prochain événement
                    </th>
                    <th className="text-right px-4 py-2.5 font-body text-[10px] uppercase tracking-wider text-ink-3 font-bold">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {paged.map(({ client, row }, idx) => (
                    <tr
                      key={client.id}
                      className={cn(
                        'border-b border-border/60 last:border-b-0 transition-colors duration-150 hover:bg-violet-pale/30 dark:hover:bg-white/[0.03]',
                        idx % 2 === 0 ? '' : 'bg-surface/50 dark:bg-white/[0.01]',
                      )}
                    >
                      <td className="px-4 py-3">
                        <Link
                          href={`/clients/${client.id}`}
                          className="flex items-center gap-3 group min-w-0"
                        >
                          <div
                            className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 text-white"
                            style={{
                              background:
                                'linear-gradient(135deg, #3B1FA8 0%, #5535C4 100%)',
                            }}
                          >
                            <span className="font-display font-bold text-[12px] leading-none">
                              {getInitials(row.firstName, row.lastName)}
                            </span>
                          </div>
                          <div className="min-w-0">
                            <p className="font-body text-[13px] font-semibold text-ink dark:text-white group-hover:text-violet transition-colors truncate">
                              {row.firstName} {row.lastName}
                            </p>
                            <div className="flex items-center gap-1 mt-0.5 flex-wrap">
                              {client.contracts.slice(0, 4).map((c) => (
                                <span
                                  key={c.id}
                                  className="inline-block w-1.5 h-1.5 rounded-full"
                                  style={{
                                    background: INSURER_COLORS[c.insurer],
                                  }}
                                  aria-label={c.insurer}
                                  title={c.insurer}
                                />
                              ))}
                              <span className="text-[10px] text-ink-3 ml-1">
                                {client.contracts.length} assureur
                                {client.contracts.length > 1 ? 's' : ''}
                              </span>
                            </div>
                          </div>
                        </Link>
                      </td>
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center gap-1 text-[12px] text-ink-2 dark:text-white/70">
                          <Mail size={11} className="text-ink-3" aria-hidden />
                          {row.email}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Badge variant="violet" size="sm">
                          {row.contractsCount}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-right font-mono text-[13px] font-semibold text-ink dark:text-white tabular-nums">
                        {formatAmount(row.exposure)}
                      </td>
                      <td className="px-4 py-3 text-right font-mono text-[12px] text-ink-2 dark:text-white/80 tabular-nums">
                        {row.productsCount}
                      </td>
                      <td className="px-4 py-3 text-[12px] text-ink-2 dark:text-white/70 font-mono tabular-nums">
                        {formatDate(row.nextEventDate)}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Link
                          href={`/clients/${client.id}`}
                          className={cn(
                            'inline-flex items-center gap-1 h-8 px-3 rounded-md',
                            'bg-violet-pale hover:bg-[#DDD5FF] text-violet',
                            'text-[12px] font-semibold',
                            'transition-colors duration-150',
                            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet',
                          )}
                        >
                          <Eye size={12} />
                          Détail
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-end mt-5">
              <Pagination
                currentPage={safePage}
                totalPages={totalPages}
                onPageChange={setPage}
              />
            </div>
          )}
        </>
      )}
    </div>
  );
}
