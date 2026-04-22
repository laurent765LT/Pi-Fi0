'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Briefcase,
  Calendar,
  Bell,
  MoreHorizontal,
  type LucideIcon,
} from 'lucide-react';
import { cn } from '@/lib/cn';
import { useNotificationsStore } from '@/stores/notifications-store';

// ─── Nav definition ──────────────────────────────────────────────────────────

interface Tab {
  href: string;
  label: string;
  icon: LucideIcon;
  /** Additional paths that should mark this tab active */
  matchPrefixes?: string[];
  /** Show unread count (e.g. notifications) */
  notificationBadge?: boolean;
}

const TABS: readonly Tab[] = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  {
    href: '/portfolio',
    label: 'Portfolio',
    icon: Briefcase,
    matchPrefixes: ['/portfolio'],
  },
  {
    href: '/evenements',
    label: 'Events',
    icon: Calendar,
    matchPrefixes: ['/evenements'],
  },
  {
    href: '/notifications',
    label: 'Notifs',
    icon: Bell,
    notificationBadge: true,
  },
  {
    href: '/settings',
    label: 'Plus',
    icon: MoreHorizontal,
    matchPrefixes: ['/settings', '/profile'],
  },
] as const;

// ─── Component ───────────────────────────────────────────────────────────────

interface BottomTabNavProps {
  className?: string;
}

export function BottomTabNav({ className }: BottomTabNavProps) {
  const pathname = usePathname() ?? '';
  const unreadCount = useNotificationsStore(
    (s) => s.notifications.filter((n) => !n.read).length,
  );

  const isActive = (tab: Tab): boolean => {
    if (pathname === tab.href) return true;
    if (tab.matchPrefixes?.some((p) => pathname.startsWith(p))) return true;
    return false;
  };

  return (
    <nav
      role="navigation"
      aria-label="Navigation mobile principale"
      className={cn(
        // Hidden on md and up, visible on mobile only
        'md:hidden fixed bottom-0 left-0 right-0 z-40',
        'bg-white/95 dark:bg-ink/95 backdrop-blur-lg',
        'border-t border-border/40',
        'pb-[env(safe-area-inset-bottom)]',
        className,
      )}
    >
      <ul className="flex items-stretch justify-around h-14">
        {TABS.map((tab) => {
          const active = isActive(tab);
          const Icon = tab.icon;
          const showBadge = tab.notificationBadge && unreadCount > 0;

          return (
            <li key={tab.href} className="flex-1">
              <Link
                href={tab.href}
                aria-current={active ? 'page' : undefined}
                className={cn(
                  'relative flex flex-col items-center justify-center h-full gap-0.5',
                  'transition-colors duration-200',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3B1FA8]/40 focus-visible:ring-inset',
                  active ? 'text-[#3B1FA8] dark:text-violet-light' : 'text-ink-3 dark:text-ink-3',
                )}
              >
                {/* Active indicator: violet bar at top */}
                {active && (
                  <span
                    aria-hidden="true"
                    className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-[3px] rounded-b-full bg-gradient-to-r from-[#3B1FA8] to-[#7B5FE0]"
                  />
                )}
                <div className="relative">
                  <Icon
                    size={20}
                    strokeWidth={active ? 2.4 : 2}
                    className={cn(active && 'drop-shadow-sm')}
                  />
                  {showBadge && (
                    <span
                      aria-label={`${unreadCount} notifications non lues`}
                      className="absolute -top-1.5 -right-2 min-w-[16px] h-4 px-1 rounded-full bg-[#E8334A] text-white text-[9px] font-bold flex items-center justify-center shadow-sm"
                    >
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}
                </div>
                <span
                  className={cn(
                    'text-[10px] font-body leading-none',
                    active ? 'font-bold' : 'font-semibold',
                  )}
                >
                  {tab.label}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
