'use client';

import { useState, useEffect, useCallback } from 'react';
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
  ChevronLeft,
  Calculator,
  BookOpen,
  TrendingUp,
  FileSearch,
  Calendar,
  Wallet,
  Settings,
  User,
  ChevronUp,
  X,
  Radio,
  Brain,
} from 'lucide-react';
import { cn } from '@/lib/cn';
import { useAuthStore } from '@/stores/auth-store';
import { useNotificationsStore } from '@/stores/notifications-store';
import { Dropdown, DropdownItem, DropdownSeparator } from '@/components/ui/dropdown';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { LocaleSwitcher } from '@/components/ui/locale-switcher';
import { Tooltip } from '@/components/ui/tooltip';

// ---------------------------------------------------------------------------
// Nav items
// ---------------------------------------------------------------------------

const mainNav = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, shortcut: '\u2318D' },
  { href: '/products', label: 'Produits', icon: Package, shortcut: '\u2318P' },
  { href: '/evenements', label: '\u00c9v\u00e9nements', icon: Calendar, shortcut: '\u2318E' },
  { href: '/portfolio', label: 'Portfolio', icon: Briefcase, shortcut: '\u2318O' },
  { href: '/portfolio/agent', label: 'Agent IA', icon: Brain },
  { href: '/commissions', label: 'Commissions', icon: Wallet, shortcut: '\u2318K' },
];

const toolsNav = [
  { href: '/pricing', label: 'Pricing', icon: Calculator, shortcut: '\u2318R' },
  { href: '/pricing/live', label: 'Consultation live', icon: Radio },
  { href: '/rfq', label: 'RFQ Screener', icon: FileSearch },
  { href: '/research', label: 'Research', icon: BookOpen },
  { href: '/notifications', label: 'Notifications', icon: Bell, shortcut: '\u2318N' },
];

const ROLE_LABELS: Record<string, string> = {
  SUPER_ADMIN: 'Super Admin',
  ORG_ADMIN: 'Administrateur',
  MANAGER: 'Manager',
  VIEWER: 'CGP',
};

// ---------------------------------------------------------------------------
// localStorage helper for collapsed state
// ---------------------------------------------------------------------------

const COLLAPSED_KEY = 'strickin-sidebar-collapsed';

function getStoredCollapsed(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    return localStorage.getItem(COLLAPSED_KEY) === 'true';
  } catch {
    return false;
  }
}

function setStoredCollapsed(v: boolean) {
  try {
    localStorage.setItem(COLLAPSED_KEY, String(v));
  } catch {
    // noop
  }
}

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
  collapsed,
  shortcut,
}: {
  href: string;
  label: string;
  icon: any;
  isActive: boolean;
  badge?: React.ReactNode;
  collapsed?: boolean;
  shortcut?: string;
}) {
  const inner = (
    <Link
      href={href}
      aria-current={isActive ? 'page' : undefined}
      className={cn(
        'group/navlink relative flex items-center gap-3 h-[38px] rounded-lg font-body text-[13px] font-medium',
        'transition-all duration-200 ease-out',
        collapsed ? 'px-0 justify-center' : 'px-3',
        isActive
          ? 'bg-gradient-to-r from-[#3B1FA8]/[0.10] to-[#5535C4]/[0.05] text-[#3B1FA8] dark:text-[#C9BCFF]'
          : 'text-ink-2 hover:text-ink hover:bg-ink/[0.04]',
      )}
    >
      {/* Active gradient left border */}
      {isActive && (
        <span
          className="absolute left-0 top-[6px] bottom-[6px] w-[3px] rounded-full animate-[slide-in_200ms_ease-out]"
          style={{
            background: 'linear-gradient(180deg, #3B1FA8 0%, #5535C4 50%, #7B5FE0 100%)',
          }}
        />
      )}

      <Icon
        size={16}
        strokeWidth={isActive ? 2.2 : 1.8}
        className={cn(
          'shrink-0 transition-colors duration-150',
          isActive ? 'text-[#3B1FA8] dark:text-[#C9BCFF]' : 'text-ink-3 group-hover/navlink:text-[#5535C4]',
        )}
      />

      {!collapsed && (
        <>
          <span className="flex-1 truncate">{label}</span>

          {/* Keyboard shortcut hint (desktop hover only) */}
          {shortcut && (
            <span className="hidden md:inline-flex opacity-0 group-hover/navlink:opacity-100 transition-opacity duration-150 text-[9px] font-mono text-ink-3/50 dark:text-white/25 px-1 py-0.5 rounded bg-ink/[0.03] dark:bg-white/[0.04] leading-none">
              {shortcut}
            </span>
          )}

          {/* Active indicator */}
          {isActive && !badge && (
            <ChevronRight size={13} className="text-[#3B1FA8]/40 dark:text-[#C9BCFF]/40" />
          )}

          {/* Badge */}
          {badge}
        </>
      )}
    </Link>
  );

  // When collapsed, wrap with a tooltip showing the label
  if (collapsed) {
    return (
      <Tooltip content={label} side="right">
        {inner}
      </Tooltip>
    );
  }

  return inner;
}

// ---------------------------------------------------------------------------
// Section Label
// ---------------------------------------------------------------------------

function SectionLabel({ children, collapsed }: { children: React.ReactNode; collapsed?: boolean }) {
  if (collapsed) {
    return <div className="h-px bg-border/30 mx-2 my-1" />;
  }
  return (
    <span className="text-[8px] uppercase tracking-[0.3em] text-ink-3/50 font-bold px-3 mb-2 select-none">
      {children}
    </span>
  );
}

// ---------------------------------------------------------------------------
// Notification Pulse Badge
// ---------------------------------------------------------------------------

function NotificationBadge({ count, isActive }: { count: number; isActive: boolean }) {
  if (count <= 0) return null;
  return (
    <span className="relative flex items-center justify-center">
      {/* Pulse ring */}
      <span
        className="absolute inline-flex h-full w-full rounded-full opacity-50 animate-[pulse-ring_2s_ease-in-out_infinite]"
        style={{ background: isActive ? 'rgba(255,255,255,0.3)' : 'rgba(232,51,74,0.4)' }}
      />
      <span
        className={cn(
          'relative inline-flex items-center justify-center h-[18px] min-w-[18px] px-1 rounded-full text-[10px] font-bold leading-none',
          isActive
            ? 'bg-white/20 text-[#3B1FA8]'
            : 'bg-[#E8334A] text-white',
        )}
      >
        {count > 99 ? '99+' : count}
      </span>
    </span>
  );
}

// ---------------------------------------------------------------------------
// Sidebar
// ---------------------------------------------------------------------------

interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export function Sidebar({ isOpen, onClose }: SidebarProps = {}) {
  const pathname = usePathname();
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const logoutAction = useAuthStore((s) => s.logout);
  const unreadCount = useNotificationsStore((s) => s.notifications.filter((n) => !n.read).length);

  const [collapsed, setCollapsed] = useState(false);

  // Hydrate collapsed state from localStorage on mount
  useEffect(() => {
    setCollapsed(getStoredCollapsed());
  }, []);

  const toggleCollapsed = useCallback(() => {
    setCollapsed((prev) => {
      const next = !prev;
      setStoredCollapsed(next);
      return next;
    });
  }, []);

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

  const env = process.env.NODE_ENV === 'production' ? 'PROD' : 'DEV';

  // Desktop width depends on collapsed state; mobile always full width
  const sidebarWidth = collapsed ? 64 : 248;

  return (
    <>
      {/* Mobile backdrop overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-40 md:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      <aside
        className={cn(
          'fixed left-0 top-0 h-screen flex flex-col overflow-hidden bg-white/90 dark:bg-ink/90 backdrop-blur-xl border-r border-border/60',
          // Mobile: z-50 so it sits above backdrop (z-40), slide in/out
          'z-50 md:z-20',
          'sidebar-mobile-enter',
          isOpen && 'sidebar-mobile-open',
          // Desktop: always visible, no transform
          'md:translate-x-0',
        )}
        style={{
          width: sidebarWidth,
          transition: 'width 300ms ease',
        }}
        data-sidebar
      >
        {/* Left accent line */}
        <div
          className="absolute left-0 top-0 bottom-0 w-px"
          style={{
            background: 'linear-gradient(180deg, var(--violet) 0%, var(--violet-m) 40%, transparent 100%)',
            opacity: 0.4,
          }}
        />

      {/* -- Logo -------------------------------------------------- */}
      <div className={cn(
        'flex items-center h-[60px] border-b border-border/40 shrink-0',
        collapsed ? 'justify-center px-2' : 'gap-2.5 px-5',
      )}>
        <span
          className="group/logo w-8 h-8 rounded-lg bg-gradient-to-br from-[#3B1FA8] to-[#5535C4] flex items-center justify-center shrink-0 shadow-md cursor-default transition-shadow duration-300 hover:shadow-lg hover:shadow-[#3B1FA8]/20"
          aria-hidden="true"
        >
          <Zap
            size={14}
            className="text-white transition-transform duration-300 group-hover/logo:scale-110 group-hover/logo:animate-[icon-pulse_0.6s_ease-in-out]"
            strokeWidth={2.5}
          />
        </span>
        {!collapsed && (
          <>
            <span className="font-display font-extrabold text-[17px] leading-none tracking-tight select-none">
              <span className="text-ink">Strick</span>
              <span className="text-[#5535C4]">&lsquo;in</span>
            </span>
            {/* Beta badge */}
            <span
              className="ml-auto text-[8px] uppercase tracking-[0.12em] font-bold px-1.5 py-0.5 rounded-full select-none max-md:hidden"
              style={{
                background: 'linear-gradient(135deg, var(--violet-p) 0%, rgba(85,53,196,0.15) 100%)',
                color: 'var(--violet)',
              }}
            >
              BETA
            </span>
          </>
        )}

        {/* Mobile close button */}
        {onClose && (
          <button
            onClick={onClose}
            className="ml-auto md:hidden p-1 rounded-lg hover:bg-[#3B1FA8]/10 transition-colors"
            aria-label="Fermer le menu"
          >
            <X size={18} className="text-ink-2" />
          </button>
        )}
      </div>

      {/* -- Navigation ------------------------------------------- */}
      <nav
        aria-label="Navigation principale"
        className={cn(
          'flex-1 py-5 flex flex-col gap-0.5 overflow-y-auto',
          collapsed ? 'px-1.5' : 'px-3',
        )}
      >
        {/* Main section */}
        <SectionLabel collapsed={collapsed}>Navigation</SectionLabel>

        {mainNav.map(({ href, label, icon, shortcut }) => (
          <NavLink
            key={href}
            href={href}
            label={label}
            icon={icon}
            isActive={isActivePath(href)}
            collapsed={collapsed}
            shortcut={shortcut}
          />
        ))}

        {/* Tools section */}
        <div className={cn('h-px bg-border/40 my-3', collapsed ? 'mx-1' : 'mx-2')} />
        <SectionLabel collapsed={collapsed}>Outils</SectionLabel>

        {toolsNav.map(({ href, label, icon, shortcut }) => (
          <NavLink
            key={href}
            href={href}
            label={label}
            icon={icon}
            isActive={isActivePath(href)}
            collapsed={collapsed}
            shortcut={shortcut}
            badge={
              label === 'Notifications' ? (
                <NotificationBadge count={unreadCount} isActive={isActivePath(href)} />
              ) : undefined
            }
          />
        ))}

        {/* Admin section */}
        {isAdmin && (
          <>
            <div className={cn('h-px bg-border/40 my-3', collapsed ? 'mx-1' : 'mx-2')} />
            <SectionLabel collapsed={collapsed}>Administration</SectionLabel>
            <NavLink
              href="/admin"
              label="Admin"
              icon={Shield}
              isActive={isActivePath('/admin')}
              collapsed={collapsed}
            />
          </>
        )}
      </nav>

      {/* -- User footer ------------------------------------------ */}
      <div className={cn('pb-2 pt-3 border-t border-border/40 shrink-0', collapsed ? 'px-1.5' : 'px-3')}>
        {collapsed ? (
          <Tooltip content={displayName} side="right">
            <div className="flex items-center justify-center py-2">
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 cursor-pointer"
                style={{
                  background: 'linear-gradient(135deg, var(--violet) 0%, var(--violet-mid) 100%)',
                }}
              >
                <span className="font-display font-bold text-[10px] text-white leading-none">
                  {initials}
                </span>
              </div>
            </div>
          </Tooltip>
        ) : (
          <Dropdown
            trigger={
              <div className="flex items-center gap-2.5 px-2 py-2 rounded-lg hover:bg-[#3B1FA8]/[0.06] transition-all duration-200 group cursor-pointer w-full">
                {/* Avatar */}
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center shrink-0"
                  style={{
                    background: 'linear-gradient(135deg, var(--violet) 0%, var(--violet-mid) 100%)',
                  }}
                >
                  <span className="font-display font-bold text-[10px] text-white leading-none">
                    {initials}
                  </span>
                </div>

                {/* User info */}
                <div className="flex-1 min-w-0">
                  <p className="font-body text-[12px] font-semibold text-ink truncate leading-tight">
                    {displayName}
                  </p>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span
                      className="inline-flex text-[8px] uppercase tracking-wider font-bold px-1.5 py-[1px] rounded-full"
                      style={{
                        background: isAdmin
                          ? 'linear-gradient(135deg, var(--violet-p) 0%, rgba(85,53,196,0.18) 100%)'
                          : 'var(--bg-2)',
                        color: isAdmin ? 'var(--violet)' : 'var(--ink-3)',
                      }}
                    >
                      {roleLabel}
                    </span>
                  </div>
                </div>

                {/* Chevron */}
                <ChevronUp
                  size={14}
                  className="text-ink-3 opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                />
              </div>
            }
            align="left"
            className="w-full"
          >
            <div className="px-3 py-2 border-b border-border/60">
              <p className="font-body text-[11px] text-ink-3 truncate">{u?.email ?? ''}</p>
            </div>
            <DropdownItem
              icon={<User size={14} strokeWidth={1.8} />}
              label="Mon profil"
              onClick={() => router.push('/profile')}
            />
            <DropdownItem
              icon={<Settings size={14} strokeWidth={1.8} />}
              label="Param\u00e8tres"
              onClick={() => router.push('/settings')}
            />
            <DropdownSeparator />
            <DropdownItem
              icon={<LogOut size={14} strokeWidth={1.8} />}
              label="Se d\u00e9connecter"
              danger
              onClick={logout}
            />
          </Dropdown>
        )}
      </div>

      {/* -- Version / Environment / Collapse Toggle -------------- */}
      <div className={cn(
        'py-2 border-t border-border/30 shrink-0 flex items-center',
        collapsed ? 'px-2 justify-center' : 'px-5 justify-between',
      )}>
        {!collapsed && (
          <>
            <span className="font-mono text-[9px] text-ink-3/60 select-none">v2.1.0</span>
            <div className="flex items-center gap-2">
              <LocaleSwitcher />
              <ThemeToggle />
              <span
                className={cn(
                  'text-[8px] uppercase tracking-wider font-bold px-1.5 py-[1px] rounded-full select-none',
                  env === 'PROD'
                    ? 'bg-[#00B894]/10 text-[#00B894]'
                    : 'bg-[#D4A017]/10 text-[#D4A017]',
                )}
              >
                {env}
              </span>
            </div>
          </>
        )}
      </div>

      {/* -- Collapse toggle button (desktop only) ---------------- */}
      <div className="hidden md:flex px-2 pb-3 justify-center">
        <button
          onClick={toggleCollapsed}
          className={cn(
            'flex items-center justify-center w-full h-7 rounded-lg',
            'border border-border/50 dark:border-white/10',
            'bg-white/60 dark:bg-white/[0.04] backdrop-blur-sm',
            'text-ink-3 dark:text-white/45 hover:text-[#3B1FA8] dark:hover:text-[#C9BCFF]',
            'hover:border-[#3B1FA8]/30 hover:bg-[#3B1FA8]/[0.04]',
            'transition-all duration-200',
          )}
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? (
            <ChevronRight size={14} />
          ) : (
            <ChevronLeft size={14} />
          )}
        </button>
      </div>

      {/* -- Keyframe animations (injected once via style tag) ---- */}
      <style jsx>{`
        @keyframes pulse-ring {
          0%, 100% { transform: scale(1); opacity: 0.5; }
          50% { transform: scale(1.4); opacity: 0; }
        }
        @keyframes icon-pulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.2); }
        }
        @keyframes slide-in {
          from { opacity: 0; transform: translateX(-4px); }
          to { opacity: 1; transform: translateX(0); }
        }
      `}</style>
    </aside>
    </>
  );
}
