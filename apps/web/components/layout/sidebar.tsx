'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  Package,
  Briefcase,
  Bell,
  LogOut,
  Zap,
  Shield,
  ChevronRight,
  Calculator,
  BookOpen,
  TrendingUp,
  FileSearch,
} from 'lucide-react';
import { cn } from '@/lib/cn';
import { useAuthStore } from '@/stores/auth-store';
import { useNotificationsStore } from '@/stores/notifications-store';

// ---------------------------------------------------------------------------
// Nav items
// ---------------------------------------------------------------------------

const mainNav = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/products', label: 'Produits', icon: Package },
  { href: '/portfolio', label: 'Portfolio', icon: Briefcase },
];

const toolsNav = [
  { href: '/pricing', label: 'Pricing', icon: Calculator },
  { href: '/rfq', label: 'RFQ Screener', icon: FileSearch },
  { href: '/research', label: 'Research', icon: BookOpen },
  { href: '/notifications', label: 'Notifications', icon: Bell },
];

const ROLE_LABELS: Record<string, string> = {
  SUPER_ADMIN: 'Super Admin',
  ORG_ADMIN: 'Administrateur',
  MANAGER: 'Manager',
  VIEWER: 'CGP',
};

// ---------------------------------------------------------------------------
// User initials helper
// ---------------------------------------------------------------------------

function getInitials(firstName?: string | null, lastName?: string | null, email?: string | null): string {
  if (firstName && lastName) {
    return (firstName[0] + lastName[0]).toUpperCase();
  }
  if (firstName) {
    return firstName.slice(0, 2).toUpperCase();
  }
  if (email) {
    return email.slice(0, 2).toUpperCase();
  }
  return 'ST';
}

// ---------------------------------------------------------------------------
// Nav Link Component
// ---------------------------------------------------------------------------

function NavLink({
  href,
  label,
  icon: Icon,
  isActive,
  badge,
}: {
  href: string;
  label: string;
  icon: any;
  isActive: boolean;
  badge?: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className={cn(
        'group flex items-center gap-3 px-3 h-[38px] rounded-lg font-body text-[13px] font-medium transition-all duration-150',
        isActive
          ? 'bg-violet text-white shadow-sm'
          : 'text-ink-2 hover:bg-surface-2 hover:text-ink',
      )}
    >
      <Icon
        size={16}
        strokeWidth={isActive ? 2.2 : 1.8}
        className={cn(
          'shrink-0 transition-colors',
          isActive ? 'text-white' : 'text-ink-3 group-hover:text-ink-2',
        )}
      />
      <span className="flex-1">{label}</span>

      {/* Active indicator */}
      {isActive && (
        <ChevronRight size={13} className="text-white/60" />
      )}

      {/* Badge */}
      {badge}
    </Link>
  );
}

// ---------------------------------------------------------------------------
// Sidebar
// ---------------------------------------------------------------------------

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const logoutAction = useAuthStore((s) => s.logout);
  const unreadCount = useNotificationsStore((s) => s.unreadCount);

  const logout = () => {
    logoutAction();
    router.replace('/login');
  };

  const u = user as any;
  const firstName = u?.firstName ?? '';
  const lastName = u?.lastName ?? '';
  const displayName = firstName && lastName ? `${firstName} ${lastName}` : u?.email ?? 'Utilisateur';
  const roleKey = u?.role ?? '';
  const roleLabel = ROLE_LABELS[roleKey] ?? roleKey;
  const initials = getInitials(firstName, lastName, u?.email);
  const isAdmin = roleKey === 'SUPER_ADMIN' || roleKey === 'ORG_ADMIN';

  const isActivePath = (href: string) => pathname === href || pathname.startsWith(href + '/');

  return (
    <aside
      className="fixed left-0 top-0 h-screen bg-white border-r border-border/80 flex flex-col z-20"
      style={{ width: 248 }}
    >
      {/* ── Logo ──────────────────────────────────────────────── */}
      <div className="flex items-center gap-2.5 px-5 h-[60px] border-b border-border/60 shrink-0">
        <span
          className="w-7 h-7 rounded-md bg-gradient-to-br from-violet to-violet-mid flex items-center justify-center shrink-0 shadow-sm"
          aria-hidden="true"
        >
          <Zap size={13} className="text-white" strokeWidth={2.5} />
        </span>
        <span className="font-display font-extrabold text-[17px] leading-none tracking-tight select-none">
          <span className="text-ink">Strick</span>
          <span className="text-violet-mid">&lsquo;in</span>
        </span>
      </div>

      {/* ── Navigation ────────────────────────────────────────── */}
      <nav className="flex-1 py-5 px-3 flex flex-col gap-0.5 overflow-y-auto">
        {/* Main section */}
        <span className="text-[9px] uppercase tracking-[0.25em] text-ink-3 font-bold px-3 mb-2">
          Menu
        </span>

        {mainNav.map(({ href, label, icon }) => (
          <NavLink
            key={href}
            href={href}
            label={label}
            icon={icon}
            isActive={isActivePath(href)}
          />
        ))}

        {/* Tools section */}
        <div className="h-px bg-border/60 my-3 mx-2" />
        <span className="text-[9px] uppercase tracking-[0.25em] text-ink-3 font-bold px-3 mb-2">
          Outils
        </span>

        {toolsNav.map(({ href, label, icon }) => (
          <NavLink
            key={href}
            href={href}
            label={label}
            icon={icon}
            isActive={isActivePath(href)}
            badge={
              label === 'Notifications' && unreadCount > 0 ? (
                <span
                  className={cn(
                    'inline-flex items-center justify-center h-[18px] min-w-[18px] px-1 rounded-full text-[10px] font-bold leading-none',
                    isActivePath(href)
                      ? 'bg-white/20 text-white'
                      : 'bg-red text-white',
                  )}
                >
                  {unreadCount > 99 ? '99+' : unreadCount}
                </span>
              ) : undefined
            }
          />
        ))}

        {/* Admin section */}
        {isAdmin && (
          <>
            <div className="h-px bg-border/60 my-3 mx-2" />
            <span className="text-[9px] uppercase tracking-[0.25em] text-ink-3 font-bold px-3 mb-2">
              Administration
            </span>
            <NavLink
              href="/admin"
              label="Admin"
              icon={Shield}
              isActive={isActivePath('/admin')}
            />
          </>
        )}
      </nav>

      {/* ── User footer ───────────────────────────────────────── */}
      <div className="px-3 py-3 border-t border-border/60 shrink-0">
        <div className="flex items-center gap-2.5 px-2 py-2 rounded-lg hover:bg-surface-2 transition-colors duration-150 group">
          {/* Avatar */}
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet to-violet-mid flex items-center justify-center shrink-0 shadow-sm">
            <span className="font-display font-bold text-[10px] text-white leading-none">
              {initials}
            </span>
          </div>

          {/* User info */}
          <div className="flex-1 min-w-0">
            <p className="font-body text-[12px] font-semibold text-ink truncate leading-tight">
              {displayName}
            </p>
            <p className="font-body text-[10px] text-ink-3 truncate leading-tight mt-0.5">
              {roleLabel}
            </p>
          </div>

          {/* Logout */}
          <button
            onClick={logout}
            title="Se déconnecter"
            className="p-1.5 rounded-md text-ink-3 hover:text-red hover:bg-red-light transition-colors duration-150 opacity-0 group-hover:opacity-100"
            aria-label="Se déconnecter"
          >
            <LogOut size={13} strokeWidth={2} />
          </button>
        </div>
      </div>
    </aside>
  );
}
