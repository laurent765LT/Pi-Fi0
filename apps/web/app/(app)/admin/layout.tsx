'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { cn } from '@/lib/cn';
import { useAuthStore, selectIsAuthenticated } from '@/stores/auth-store';

// ─── Constants ────────────────────────────────────────────────────────────────

const ADMIN_ROLES = ['SUPER_ADMIN', 'ORG_ADMIN'];

// ─── Admin Nav Link ───────────────────────────────────────────────────────────

function AdminNavLink({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isActive =
    href === '/admin' ? pathname === '/admin' : pathname.startsWith(href);

  return (
    <Link
      href={href}
      className={cn(
        'inline-flex items-center h-8 px-3 rounded-sm font-body text-xs font-semibold uppercase tracking-widest transition-colors duration-100',
        isActive
          ? 'bg-violet text-white'
          : 'bg-surface-2 text-ink-3 border border-border hover:bg-violet-pale hover:text-violet',
      )}
    >
      {children}
    </Link>
  );
}

// ─── Layout ───────────────────────────────────────────────────────────────────

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const isAuthenticated = useAuthStore(selectIsAuthenticated);

  const role = (user as { role?: string } | null)?.role ?? '';
  const hasAccess = isAuthenticated && ADMIN_ROLES.includes(role);

  useEffect(() => {
    if (!isAuthenticated) {
      router.replace('/login');
      return;
    }
    if (!ADMIN_ROLES.includes(role)) {
      router.replace('/dashboard');
    }
  }, [isAuthenticated, role, router]);

  if (!hasAccess) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex flex-col items-center gap-3 text-center">
          <div className="w-10 h-10 rounded-full bg-surface-2 border border-border flex items-center justify-center">
            <svg
              width="18"
              height="18"
              viewBox="0 0 18 18"
              fill="none"
              aria-hidden="true"
              className="text-ink-3"
            >
              <path
                d="M9 1.5a4 4 0 0 0-4 4V7H4a1.5 1.5 0 0 0-1.5 1.5v7A1.5 1.5 0 0 0 4 17h10a1.5 1.5 0 0 0 1.5-1.5v-7A1.5 1.5 0 0 0 14 7h-1V5.5a4 4 0 0 0-4-4ZM7 5.5a2 2 0 0 1 4 0V7H7V5.5Z"
                fill="currentColor"
              />
            </svg>
          </div>
          <p className="font-body text-sm text-ink-3">
            Vérification des droits d&apos;accès…
          </p>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Admin sub-navigation */}
      <div className="mb-6 flex items-center gap-2 flex-wrap">
        <AdminNavLink href="/admin">Vue d&apos;ensemble</AdminNavLink>
        <AdminNavLink href="/admin/products">Produits</AdminNavLink>
        <AdminNavLink href="/admin/shelves">Enveloppes</AdminNavLink>
        <AdminNavLink href="/admin/users">Utilisateurs</AdminNavLink>
        <AdminNavLink href="/admin/stats">Statistiques</AdminNavLink>
        <AdminNavLink href="/admin/jurisdictions">Juridictions</AdminNavLink>
      </div>
      {children}
    </div>
  );
}
