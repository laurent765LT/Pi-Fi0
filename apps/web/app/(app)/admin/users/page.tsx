'use client';

import { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import {
  Search,
  X,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  ChevronLeft,
  ChevronRight,
  Users,
  Filter,
  Eye,
  Pencil,
  ShieldCheck,
  ShieldOff,
  UserPlus,
} from 'lucide-react';
import { cn } from '@/lib/cn';
import { Badge, type BadgeVariant } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

// ── Types ────────────────────────────────────────────────────────────────────

type UserRole = 'SUPER_ADMIN' | 'ORG_ADMIN' | 'MANAGER' | 'VIEWER';
type UserStatus = 'ACTIVE' | 'SUSPENDED' | 'PENDING';

interface DemoUser {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: UserRole;
  status: UserStatus;
  company: string;
  lastLogin: string;
  createdAt: string;
}

// ── Type maps ────────────────────────────────────────────────────────────────

const ROLE_LABELS: Record<UserRole, string> = {
  SUPER_ADMIN: 'Super Admin',
  ORG_ADMIN: 'Admin',
  MANAGER: 'Manager',
  VIEWER: 'CGP',
};

const ROLE_VARIANT: Record<UserRole, BadgeVariant> = {
  SUPER_ADMIN: 'violet',
  ORG_ADMIN: 'cobalt',
  MANAGER: 'teal',
  VIEWER: 'muted',
};

const STATUS_LABELS: Record<UserStatus, string> = {
  ACTIVE: 'Actif',
  SUSPENDED: 'Suspendu',
  PENDING: 'En attente',
};

const STATUS_VARIANT: Record<UserStatus, BadgeVariant> = {
  ACTIVE: 'teal',
  SUSPENDED: 'red',
  PENDING: 'gold',
};

// ── Role filter categories ───────────────────────────────────────────────────

type RoleFilter = '' | 'ADMIN' | 'MANAGER' | 'CGP';

const ROLE_FILTER_LABEL: Record<string, string> = {
  ALL: 'Tous',
  ADMIN: 'Admin',
  MANAGER: 'Manager',
  CGP: 'CGP',
};

function matchesRoleFilter(role: UserRole, filter: RoleFilter): boolean {
  if (!filter) return true;
  if (filter === 'ADMIN') return role === 'SUPER_ADMIN' || role === 'ORG_ADMIN';
  if (filter === 'MANAGER') return role === 'MANAGER';
  if (filter === 'CGP') return role === 'VIEWER';
  return true;
}

// ── Demo data ────────────────────────────────────────────────────────────────

const DEMO_USERS: DemoUser[] = [
  {
    id: 'usr_001',
    firstName: 'Alexandre',
    lastName: 'Dupont',
    email: 'a.dupont@strickin.fr',
    role: 'SUPER_ADMIN',
    status: 'ACTIVE',
    company: "Strick'in",
    lastLogin: '2026-04-15T14:32:00',
    createdAt: '2024-01-10T09:00:00',
  },
  {
    id: 'usr_002',
    firstName: 'Claire',
    lastName: 'Martin',
    email: 'c.martin@patrimoine-conseil.fr',
    role: 'ORG_ADMIN',
    status: 'ACTIVE',
    company: 'Patrimoine Conseil',
    lastLogin: '2026-04-14T10:15:00',
    createdAt: '2024-03-22T11:30:00',
  },
  {
    id: 'usr_003',
    firstName: 'Thomas',
    lastName: 'Bernard',
    email: 't.bernard@cgp-partners.fr',
    role: 'MANAGER',
    status: 'ACTIVE',
    company: 'CGP Partners',
    lastLogin: '2026-04-13T16:45:00',
    createdAt: '2024-06-15T08:00:00',
  },
  {
    id: 'usr_004',
    firstName: 'Sophie',
    lastName: 'Leroy',
    email: 's.leroy@wealth-advisory.fr',
    role: 'VIEWER',
    status: 'ACTIVE',
    company: 'Wealth Advisory',
    lastLogin: '2026-04-12T09:20:00',
    createdAt: '2024-09-01T14:00:00',
  },
  {
    id: 'usr_005',
    firstName: 'Marc',
    lastName: 'Rousseau',
    email: 'm.rousseau@assurances-elite.fr',
    role: 'ORG_ADMIN',
    status: 'SUSPENDED',
    company: 'Assurances Elite',
    lastLogin: '2026-03-20T11:00:00',
    createdAt: '2024-02-18T10:30:00',
  },
  {
    id: 'usr_006',
    firstName: 'Isabelle',
    lastName: 'Moreau',
    email: 'i.moreau@finance-plus.fr',
    role: 'VIEWER',
    status: 'PENDING',
    company: 'Finance Plus',
    lastLogin: '',
    createdAt: '2026-04-10T16:00:00',
  },
  {
    id: 'usr_007',
    firstName: 'Nicolas',
    lastName: 'Girard',
    email: 'n.girard@invest-conseil.fr',
    role: 'MANAGER',
    status: 'ACTIVE',
    company: 'Invest Conseil',
    lastLogin: '2026-04-15T08:55:00',
    createdAt: '2025-01-05T09:00:00',
  },
  {
    id: 'usr_008',
    firstName: 'Camille',
    lastName: 'Petit',
    email: 'c.petit@patrimoine-conseil.fr',
    role: 'VIEWER',
    status: 'ACTIVE',
    company: 'Patrimoine Conseil',
    lastLogin: '2026-04-11T17:30:00',
    createdAt: '2025-05-12T13:00:00',
  },
  {
    id: 'usr_009',
    firstName: 'Julien',
    lastName: 'Fournier',
    email: 'j.fournier@strickin.fr',
    role: 'SUPER_ADMIN',
    status: 'ACTIVE',
    company: "Strick'in",
    lastLogin: '2026-04-16T07:10:00',
    createdAt: '2024-01-10T09:00:00',
  },
  {
    id: 'usr_010',
    firstName: 'Emma',
    lastName: 'Duval',
    email: 'e.duval@gestion-privee.fr',
    role: 'VIEWER',
    status: 'PENDING',
    company: 'Gestion Privee SA',
    lastLogin: '',
    createdAt: '2026-04-14T10:00:00',
  },
];

// ── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(iso: string): string {
  if (!iso) return '--';
  const d = new Date(iso);
  return d.toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

function formatDateTime(iso: string): string {
  if (!iso) return 'Jamais';
  const d = new Date(iso);
  return d.toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

// ── Sort types ───────────────────────────────────────────────────────────────

type SortCol = 'lastName' | 'email' | 'role' | 'status' | 'company' | 'lastLogin';
type SortDir = 'asc' | 'desc';

// ── Skeleton ─────────────────────────────────────────────────────────────────

function TableSkeleton() {
  return (
    <div className="animate-pulse">
      {Array.from({ length: 5 }).map((_, i) => (
        <div
          key={i}
          className="flex items-center gap-4 px-5 py-3.5 border-b border-border last:border-0"
        >
          <div className="h-8 w-8 bg-surface-2 rounded-full" />
          <div className="h-3 flex-1 bg-surface-2 rounded" />
          <div className="h-3 w-32 bg-surface-2 rounded" />
          <div className="h-5 w-16 bg-surface-2 rounded" />
          <div className="h-5 w-16 bg-surface-2 rounded" />
          <div className="h-3 w-24 bg-surface-2 rounded" />
          <div className="h-3 w-20 bg-surface-2 rounded" />
          <div className="h-7 w-20 bg-surface-2 rounded" />
        </div>
      ))}
    </div>
  );
}

// ── Sort Header ──────────────────────────────────────────────────────────────

function SortHeader({
  label,
  col,
  sortCol,
  sortDir,
  onSort,
  align = 'left',
}: {
  label: string;
  col: SortCol;
  sortCol: SortCol;
  sortDir: SortDir;
  onSort: (col: SortCol) => void;
  align?: 'left' | 'center' | 'right';
}) {
  const active = sortCol === col;
  return (
    <th
      className={cn(
        'px-5 py-3 text-xs uppercase tracking-widest font-semibold cursor-pointer select-none group',
        'transition-colors duration-150 hover:text-violet',
        active ? 'text-violet' : 'text-ink-3',
        align === 'center' && 'text-center',
        align === 'right' && 'text-right',
      )}
      onClick={() => onSort(col)}
    >
      <span className="inline-flex items-center gap-1">
        {label}
        {active ? (
          sortDir === 'asc' ? (
            <ArrowUp size={11} className="text-violet" />
          ) : (
            <ArrowDown size={11} className="text-violet" />
          )
        ) : (
          <ArrowUpDown size={11} className="opacity-0 group-hover:opacity-60 transition-opacity" />
        )}
      </span>
    </th>
  );
}

// ── Role Filter Pill ─────────────────────────────────────────────────────────

function RoleFilterPill({
  label,
  active,
  onClick,
  count,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
  count: number;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-semibold font-body transition-all duration-200',
        active
          ? 'bg-gradient-to-r from-[#3B1FA8] to-[#5535C4] text-white shadow-sm shadow-violet/20'
          : 'bg-white/80 dark:bg-white/5 border border-border/60 text-ink-3 hover:text-ink hover:border-violet/30',
      )}
    >
      {label}
      <span
        className={cn(
          'inline-flex items-center justify-center h-4 min-w-4 px-1 rounded-full text-[9px] font-bold',
          active ? 'bg-white/25 text-white' : 'bg-surface-2 text-ink-3',
        )}
      >
        {count}
      </span>
    </button>
  );
}

// ── User Avatar ──────────────────────────────────────────────────────────────

function UserAvatar({ firstName, lastName }: { firstName: string; lastName: string }) {
  const initials = `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  return (
    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#3B1FA8]/20 to-[#1E3A5F]/20 border border-border/60 flex items-center justify-center shrink-0">
      <span className="font-display text-[10px] font-bold text-violet">{initials}</span>
    </div>
  );
}

// ── Page ─────────────────────────────────────────────────────────────────────

export default function AdminUsersPage() {
  // Simulate a small load delay
  const [isLoading, setIsLoading] = useState(true);
  const users = DEMO_USERS;

  useEffect(() => {
    const t = setTimeout(() => setIsLoading(false), 600);
    return () => clearTimeout(t);
  }, []);

  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<RoleFilter>('');
  const [sortCol, setSortCol] = useState<SortCol>('lastName');
  const [sortDir, setSortDir] = useState<SortDir>('asc');
  const [page, setPage] = useState(1);
  const perPage = 8;

  const handleSort = (col: SortCol) => {
    if (sortCol === col) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortCol(col);
      setSortDir('asc');
    }
    setPage(1);
  };

  // Toggle suspend/activate (demo only)
  const [statusOverrides, setStatusOverrides] = useState<Record<string, UserStatus>>({});
  const getStatus = (u: DemoUser): UserStatus => statusOverrides[u.id] ?? u.status;

  const toggleStatus = (userId: string) => {
    setStatusOverrides((prev) => {
      const current = prev[userId] ?? users.find((u) => u.id === userId)?.status ?? 'ACTIVE';
      return {
        ...prev,
        [userId]: current === 'ACTIVE' ? 'SUSPENDED' : current === 'SUSPENDED' ? 'ACTIVE' : current,
      };
    });
  };

  // Filter + sort
  const processed = useMemo(() => {
    let list = [...users];

    // Text search
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(
        (u) =>
          u.firstName.toLowerCase().includes(q) ||
          u.lastName.toLowerCase().includes(q) ||
          u.email.toLowerCase().includes(q) ||
          `${u.firstName} ${u.lastName}`.toLowerCase().includes(q),
      );
    }

    // Role filter
    if (roleFilter) {
      list = list.filter((u) => matchesRoleFilter(u.role, roleFilter));
    }

    // Sort
    list.sort((a, b) => {
      let va: string = '';
      let vb: string = '';

      switch (sortCol) {
        case 'lastName':
          va = `${a.lastName} ${a.firstName}`.toLowerCase();
          vb = `${b.lastName} ${b.firstName}`.toLowerCase();
          break;
        case 'email':
          va = a.email.toLowerCase();
          vb = b.email.toLowerCase();
          break;
        case 'role':
          va = a.role;
          vb = b.role;
          break;
        case 'status':
          va = getStatus(a);
          vb = getStatus(b);
          break;
        case 'company':
          va = a.company.toLowerCase();
          vb = b.company.toLowerCase();
          break;
        case 'lastLogin':
          va = a.lastLogin || '0';
          vb = b.lastLogin || '0';
          break;
      }

      if (va < vb) return sortDir === 'asc' ? -1 : 1;
      if (va > vb) return sortDir === 'asc' ? 1 : -1;
      return 0;
    });

    return list;
  }, [users, search, roleFilter, sortCol, sortDir, statusOverrides]);

  // Pagination
  const totalPages = Math.max(1, Math.ceil(processed.length / perPage));
  const paginated = processed.slice((page - 1) * perPage, page * perPage);

  // Role filter counts
  const roleCounts = useMemo(() => {
    const counts: Record<RoleFilter, number> = { '': users.length, ADMIN: 0, MANAGER: 0, CGP: 0 };
    users.forEach((u) => {
      if (u.role === 'SUPER_ADMIN' || u.role === 'ORG_ADMIN') counts.ADMIN++;
      if (u.role === 'MANAGER') counts.MANAGER++;
      if (u.role === 'VIEWER') counts.CGP++;
    });
    return counts;
  }, [users]);

  return (
    <main className="w-full animate-fade-in">
      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between gap-4 mb-2">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#3B1FA8] to-[#1A0A3E] flex items-center justify-center shadow-sm shadow-[#3B1FA8]/20">
            <Users size={18} className="text-white" />
          </div>
          <div>
            <h1 className="font-display text-2xl font-bold leading-tight bg-gradient-to-r from-[#3B1FA8] via-[#1A0A3E] to-[#3B1FA8] bg-clip-text text-transparent dark:from-white dark:via-[#C9BCFF] dark:to-white">
              Gestion des utilisateurs
            </h1>
            <p className="font-body text-sm text-ink-3 mt-0.5">
              {users.length} utilisateur{users.length !== 1 ? 's' : ''} enregistre{users.length !== 1 ? 's' : ''}
            </p>
          </div>
        </div>
        <Button variant="primary" size="md" asChild>
          <Link href="/admin/users/new" className="flex items-center gap-2">
            <UserPlus size={16} strokeWidth={2.5} />
            Nouvel utilisateur
          </Link>
        </Button>
      </div>
      <div
        className="h-[2px] rounded-full mb-6"
        style={{
          background: 'linear-gradient(90deg, #3B1FA8, #00B894 40%, #D4A017 70%, transparent)',
        }}
      />

      {/* ── Filters bar ────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 mb-5">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-3" />
          <input
            type="text"
            placeholder="Rechercher par nom, email..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="w-full rounded-lg bg-white/80 dark:bg-white/5 border border-border/60 font-body text-sm text-ink pl-9 pr-8 h-9 placeholder:text-ink-3 focus:outline-none focus:ring-2 focus:ring-violet/30 focus:border-violet/40 transition-all duration-200"
          />
          {search && (
            <button
              onClick={() => { setSearch(''); setPage(1); }}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 rounded hover:bg-ink/5 text-ink-3 hover:text-ink transition-colors"
            >
              <X size={13} />
            </button>
          )}
        </div>

        {/* Role filters */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <Filter size={13} className="text-ink-3 mr-1" />
          <RoleFilterPill
            label={ROLE_FILTER_LABEL.ALL}
            active={!roleFilter}
            onClick={() => { setRoleFilter(''); setPage(1); }}
            count={roleCounts['']}
          />
          {(['ADMIN', 'MANAGER', 'CGP'] as RoleFilter[]).map((rf) => (
            <RoleFilterPill
              key={rf}
              label={ROLE_FILTER_LABEL[rf]}
              active={roleFilter === rf}
              onClick={() => { setRoleFilter(roleFilter === rf ? '' : rf); setPage(1); }}
              count={roleCounts[rf]}
            />
          ))}
        </div>
      </div>

      {/* ── Active filters display ─────────────────────────────────────────── */}
      {(search || roleFilter) && (
        <div className="flex items-center gap-2 mb-4 flex-wrap">
          {search && (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-violet-pale/50 text-violet text-[11px] font-semibold font-body">
              Recherche: &laquo;{search}&raquo;
              <button onClick={() => { setSearch(''); setPage(1); }} className="hover:bg-violet/10 rounded p-0.5"><X size={10} /></button>
            </span>
          )}
          {roleFilter && (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-violet-pale/50 text-violet text-[11px] font-semibold font-body">
              Role: {ROLE_FILTER_LABEL[roleFilter]}
              <button onClick={() => { setRoleFilter(''); setPage(1); }} className="hover:bg-violet/10 rounded p-0.5"><X size={10} /></button>
            </span>
          )}
          <button
            onClick={() => { setSearch(''); setRoleFilter(''); setPage(1); }}
            className="text-[11px] text-ink-3 hover:text-violet font-body underline transition-colors"
          >
            Reinitialiser
          </button>
        </div>
      )}

      {/* ── Table ──────────────────────────────────────────────────────────── */}
      {isLoading ? (
        <div className="bg-white/90 dark:bg-white/5 backdrop-blur-md border border-border/60 rounded-xl overflow-hidden shadow-card">
          <TableSkeleton />
        </div>
      ) : processed.length === 0 ? (
        <Card static className="py-16 flex flex-col items-center justify-center gap-3 rounded-xl border-border/60">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#3B1FA8]/10 to-[#00B894]/10 border border-border/40 flex items-center justify-center">
            <Users size={20} className="text-ink-3 opacity-40" />
          </div>
          <p className="font-display text-sm font-bold text-ink dark:text-white">
            {search || roleFilter ? 'Aucun resultat' : 'Aucun utilisateur'}
          </p>
          <p className="font-body text-xs text-ink-3 max-w-xs text-center">
            {search || roleFilter
              ? 'Essayez de modifier vos criteres de recherche.'
              : 'Commencez par inviter votre premier utilisateur.'}
          </p>
          {(search || roleFilter) && (
            <button
              onClick={() => { setSearch(''); setRoleFilter(''); setPage(1); }}
              className="font-body text-xs text-violet hover:underline mt-1"
            >
              Reinitialiser les filtres
            </button>
          )}
        </Card>
      ) : (
        <div className="bg-white/90 dark:bg-white/5 backdrop-blur-md border border-border/60 rounded-xl overflow-hidden shadow-card">
          {/* Desktop table */}
          <div className="overflow-x-auto hidden md:block">
            <table className="w-full text-sm font-body min-w-[900px]">
              <thead>
                <tr className="border-b border-border bg-surface-2/50">
                  <SortHeader label="Nom" col="lastName" sortCol={sortCol} sortDir={sortDir} onSort={handleSort} />
                  <SortHeader label="Email" col="email" sortCol={sortCol} sortDir={sortDir} onSort={handleSort} />
                  <SortHeader label="Role" col="role" sortCol={sortCol} sortDir={sortDir} onSort={handleSort} align="center" />
                  <SortHeader label="Statut" col="status" sortCol={sortCol} sortDir={sortDir} onSort={handleSort} align="center" />
                  <SortHeader label="Societe" col="company" sortCol={sortCol} sortDir={sortDir} onSort={handleSort} />
                  <SortHeader label="Derniere connexion" col="lastLogin" sortCol={sortCol} sortDir={sortDir} onSort={handleSort} />
                  <th className="px-5 py-3 text-center text-xs uppercase tracking-widest text-ink-3 font-semibold">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {paginated.map((user) => {
                  const status = getStatus(user);
                  return (
                    <tr
                      key={user.id}
                      className="border-b border-border/60 last:border-0 hover:bg-violet/[0.04] dark:hover:bg-white/5 transition-colors duration-150 group"
                    >
                      {/* Name + avatar */}
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <UserAvatar firstName={user.firstName} lastName={user.lastName} />
                          <div className="flex flex-col gap-0.5 min-w-0">
                            <span className="font-medium text-ink leading-snug truncate max-w-[200px]">
                              {user.lastName} {user.firstName}
                            </span>
                            <span className="text-[10px] text-ink-3 font-body">
                              Depuis {formatDate(user.createdAt)}
                            </span>
                          </div>
                        </div>
                      </td>
                      {/* Email */}
                      <td className="px-5 py-3.5">
                        <span className="text-ink-3 text-xs font-body truncate max-w-[220px] block">
                          {user.email}
                        </span>
                      </td>
                      {/* Role */}
                      <td className="px-5 py-3.5 text-center">
                        <Badge variant={ROLE_VARIANT[user.role]}>
                          {ROLE_LABELS[user.role]}
                        </Badge>
                      </td>
                      {/* Status */}
                      <td className="px-5 py-3.5 text-center">
                        <Badge variant={STATUS_VARIANT[status]}>
                          {STATUS_LABELS[status]}
                        </Badge>
                      </td>
                      {/* Company */}
                      <td className="px-5 py-3.5">
                        <span className="font-body text-xs text-ink">{user.company}</span>
                      </td>
                      {/* Last login */}
                      <td className="px-5 py-3.5">
                        <span className="font-body text-xs text-ink-3">
                          {formatDateTime(user.lastLogin)}
                        </span>
                      </td>
                      {/* Actions */}
                      <td className="px-5 py-3.5">
                        <div className="flex items-center justify-center gap-1.5">
                          <Button variant="outline" size="sm" asChild>
                            <Link href={`/profile/${user.id}`} className="flex items-center gap-1" title="Voir le profil">
                              <Eye size={12} />
                            </Link>
                          </Button>
                          <Button variant="outline" size="sm" asChild>
                            <Link href={`/admin/users/${user.id}/edit`} className="flex items-center gap-1" title="Modifier le role">
                              <Pencil size={12} />
                            </Link>
                          </Button>
                          {status !== 'PENDING' && (
                            <Button
                              variant={status === 'ACTIVE' ? 'danger' : 'teal'}
                              size="sm"
                              onClick={() => toggleStatus(user.id)}
                              title={status === 'ACTIVE' ? 'Suspendre' : 'Reactiver'}
                            >
                              {status === 'ACTIVE' ? (
                                <ShieldOff size={12} />
                              ) : (
                                <ShieldCheck size={12} />
                              )}
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <div className="md:hidden divide-y divide-border/60">
            {paginated.map((user) => {
              const status = getStatus(user);
              return (
                <div key={user.id} className="p-4 hover:bg-violet/[0.02] transition-colors">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <UserAvatar firstName={user.firstName} lastName={user.lastName} />
                      <div className="min-w-0">
                        <span className="font-body text-sm font-semibold text-ink block truncate">
                          {user.lastName} {user.firstName}
                        </span>
                        <span className="text-xs text-ink-3 block truncate">{user.email}</span>
                      </div>
                    </div>
                    <Badge variant={STATUS_VARIANT[status]} className="shrink-0">
                      {STATUS_LABELS[status]}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-3 flex-wrap mb-3">
                    <Badge variant={ROLE_VARIANT[user.role]}>
                      {ROLE_LABELS[user.role]}
                    </Badge>
                    <span className="font-body text-[10px] text-ink-3">{user.company}</span>
                    <span className="font-body text-[10px] text-ink-3">
                      {formatDateTime(user.lastLogin)}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" asChild className="flex-1">
                      <Link href={`/profile/${user.id}`} className="flex items-center justify-center gap-1 text-[11px]">
                        <Eye size={11} /> Voir
                      </Link>
                    </Button>
                    <Button variant="outline" size="sm" asChild className="flex-1">
                      <Link href={`/admin/users/${user.id}/edit`} className="flex items-center justify-center gap-1 text-[11px]">
                        <Pencil size={11} /> Modifier
                      </Link>
                    </Button>
                    {status !== 'PENDING' && (
                      <Button
                        variant={status === 'ACTIVE' ? 'danger' : 'teal'}
                        size="sm"
                        onClick={() => toggleStatus(user.id)}
                        className="flex-1 flex items-center justify-center gap-1 text-[11px]"
                      >
                        {status === 'ACTIVE' ? (
                          <><ShieldOff size={11} /> Suspendre</>
                        ) : (
                          <><ShieldCheck size={11} /> Activer</>
                        )}
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Pagination footer */}
          <div className="px-5 py-3 border-t border-border/60 bg-surface-2/30 flex items-center justify-between gap-4">
            <span className="font-body text-xs text-ink-3">
              <span className="font-mono">{(page - 1) * perPage + 1}</span>
              {'\u2013'}
              <span className="font-mono">{Math.min(page * perPage, processed.length)}</span> sur{' '}
              <span className="font-mono font-semibold">{processed.length}</span> utilisateur{processed.length !== 1 ? 's' : ''}
              {search ? ` pour \u00AB\u00A0${search}\u00A0\u00BB` : ''}
            </span>
            {totalPages > 1 && (
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className={cn(
                    'w-7 h-7 rounded-lg flex items-center justify-center transition-all duration-200',
                    page === 1 ? 'opacity-30 cursor-not-allowed' : 'hover:bg-violet/10 text-ink-3 hover:text-violet',
                  )}
                >
                  <ChevronLeft size={14} />
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1)
                  .filter((p) => p === 1 || p === totalPages || Math.abs(p - page) <= 1)
                  .map((p, idx, arr) => (
                    <span key={p} className="contents">
                      {idx > 0 && arr[idx - 1]! + 1 < p && (
                        <span className="text-ink-3 text-xs px-0.5">&hellip;</span>
                      )}
                      <button
                        onClick={() => setPage(p)}
                        className={cn(
                          'w-7 h-7 rounded-lg flex items-center justify-center font-mono text-xs font-semibold transition-all duration-200',
                          p === page
                            ? 'bg-gradient-to-r from-[#3B1FA8] to-[#5535C4] text-white shadow-sm'
                            : 'text-ink-3 hover:bg-violet/10 hover:text-violet',
                        )}
                      >
                        {p}
                      </button>
                    </span>
                  ))}
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className={cn(
                    'w-7 h-7 rounded-lg flex items-center justify-center transition-all duration-200',
                    page === totalPages ? 'opacity-30 cursor-not-allowed' : 'hover:bg-violet/10 text-ink-3 hover:text-violet',
                  )}
                >
                  <ChevronRight size={14} />
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </main>
  );
}
