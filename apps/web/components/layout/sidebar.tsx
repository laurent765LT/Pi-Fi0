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
  Calendar,
  Wallet,
  Settings,
  User,
  ChevronUp,
  X,
  Radio,
} from 'lucide-react';
import { cn } from '@/lib/cn';
import { useAuthStore } from '@/stores/auth-store';
import { useNotificationsStore } from '@/stores/notifications-store';
import { Dropdown, DropdownItem, DropdownSeparator } from '@/components/ui/dropdown';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { LocaleSwitcher } from '@/components/ui/locale-switcher';

// ---------------------------------------------------------------------------
// Nav items
// ---------------------------------------------------------------------------

const mainNav = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/products', label: 'Produits', icon: Package },
  { href: '/evenements', label: 'Événements', icon: Calendar },
  { href: '/portfolio', label: 'Portfolio', icon: Briefcase },
  { href: '/commissions', label: 'Commissions', icon: Wallet },
];

const toolsNav = [
  { href: '/pricing', label: 'Pricing', icon: Calculator },
  { href: '/pricing/live', label: 'Consultation live', icon: Radio },
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
        'group relative flex items-center gap-3 px-3 h-[38px] rounded-lg font-body text-[13px] font-medium',
        'transition-colors duration-150 ease-out',
        isActive
          ? 'bg-violet/[0.08] text-violet'
          : 'text-ink-2 hover:text-ink hover:bg-ink/[0.04]',
      )}
    >
      {/* Active dot indicator */}
      {isActive && (
        <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-[3px] rounded-full bg-violet" />
      )}

      <Icon
        size={16}
        strokeWidth={isActive ? 2.2 : 1.8}
        className={cn(
          'shrink-0 transition-colors duration-150',
          isActive ? 'text-violet' : 'text-ink-3 group-hover:text-violet-m',
        )}
      />
      <span className="flex-1">{label}</span>

      {/* Active indicator */}
      {isActive && (
        <ChevronRight size={13} className="text-violet/40" />
      )}

      {/* Badge */}
      {badge}
    </Link>
  );
}

// ---------------------------------------------------------------------------
// Section Label
// ---------------------------------------------------------------------------

function SectionLabel({ children }: { children: React.ReactNode }) {
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
            ? 'bg-white/20 text-violet'
            : 'bg-red text-white',
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
          'fixed left-0 top-0 h-screen flex flex-col overflow-hidden transition-transform duration-300 ease-in-out',
          // Mobile: z-50 so it sits above backdrop (z-40), slide in/out via CSS media query classes
          'z-50 md:z-20',
          'sidebar-mobile-enter',
          isOpen && 'sidebar-mobile-open',
          // Desktop: always visible, no transform
          'md:translate-x-0',
        )}
        style={{
          width: 248,
          background: 'var(--bg-1)',
          borderRight: '1px solid var(--border)',
        }}
      >
        {/* Left accent line */}
        <div
          className="absolute left-0 top-0 bottom-0 w-px"
          style={{
            background: 'linear-gradient(180deg, var(--violet) 0%, var(--violet-m) 40%, transparent 100%)',
            opacity: 0.4,
          }}
        />

      {/* ── Logo ──────────────────────────────────────────────── */}
      <div className="flex items-center gap-2.5 px-5 h-[60px] border-b border-border/40 shrink-0">
        <span
          className="group/logo w-8 h-8 rounded-lg bg-gradient-to-br from-violet to-violet-mid flex items-center justify-center shrink-0 shadow-md cursor-default transition-shadow duration-300 hover:shadow-lg hover:shadow-violet/20"
          aria-hidden="true"
        >
          <Zap
            size={14}
            className="text-white transition-transform duration-300 group-hover/logo:scale-110 group-hover/logo:animate-[icon-pulse_0.6s_ease-in-out]"
            strokeWidth={2.5}
          />
        </span>
        <span className="font-display font-extrabold text-[17px] leading-none tracking-tight select-none">
          <span className="text-ink">Strick</span>
          <span className="text-violet-mid">&lsquo;in</span>
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

        {/* Mobile close button */}
        {onClose && (
          <button
            onClick={onClose}
            className="ml-auto md:hidden p-1 rounded-lg hover:bg-violet-p/50 transition-colors"
            aria-label="Fermer le menu"
          >
            <X size={18} className="text-ink-2" />
          </button>
        )}
      </div>

      {/* ── Navigation ────────────────────────────────────────── */}
      <nav className="flex-1 py-5 px-3 flex flex-col gap-0.5 overflow-y-auto">
        {/* Main section */}
        <SectionLabel>Navigation</SectionLabel>

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
        <div className="h-px bg-border/40 my-3 mx-2" />
        <SectionLabel>Outils</SectionLabel>

        {toolsNav.map(({ href, label, icon }) => (
          <NavLink
            key={href}
            href={href}
            label={label}
            icon={icon}
            isActive={isActivePath(href)}
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
            <div className="h-px bg-border/40 my-3 mx-2" />
            <SectionLabel>Administration</SectionLabel>
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
      <div className="px-3 pb-2 pt-3 border-t border-border/40 shrink-0">
        <Dropdown
          trigger={
            <div className="flex items-center gap-2.5 px-2 py-2 rounded-lg hover:bg-violet-p/30 transition-all duration-200 group cursor-pointer w-full">
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
            label="Paramètres"
            onClick={() => router.push('/settings')}
          />
          <DropdownSeparator />
          <DropdownItem
            icon={<LogOut size={14} strokeWidth={1.8} />}
            label="Se déconnecter"
            danger
            onClick={logout}
          />
        </Dropdown>
      </div>

      {/* ── Version / Environment ─────────────────────────────── */}
      <div className="px-5 py-2 border-t border-border/30 shrink-0 flex items-center justify-between">
        <span className="font-mono text-[9px] text-ink-3/60 select-none">v2.1.0</span>
        <div className="flex items-center gap-2">
          <LocaleSwitcher />
          <ThemeToggle />
          <span
            className={cn(
              'text-[8px] uppercase tracking-wider font-bold px-1.5 py-[1px] rounded-full select-none',
              env === 'PROD'
                ? 'bg-teal/10 text-teal'
                : 'bg-gold/10 text-gold',
            )}
          >
            {env}
          </span>
        </div>
      </div>

      {/* ── Keyframe animations (injected once via style tag) ─── */}
      <style jsx>{`
        @keyframes pulse-ring {
          0%, 100% { transform: scale(1); opacity: 0.5; }
          50% { transform: scale(1.4); opacity: 0; }
        }
        @keyframes icon-pulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.2); }
        }
      `}</style>
    </aside>
    </>
  );
}
