'use client';

import { useEffect, useRef, useState, useMemo } from 'react';
import Link from 'next/link';
import {
  Bell,
  CheckCheck,
  Info,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Inbox,
  ChevronRight,
  Trash2,
  Settings,
  ExternalLink,
  type LucideIcon,
} from 'lucide-react';
import { cn } from '@/lib/cn';
import { useNotificationsStore } from '@/stores/notifications-store';
import { Button } from '@/components/ui/button';
import { PageHeader } from '@/components/ui/page-header';

// ─── Types ────────────────────────────────────────────────────────────────────

type NotificationType = 'info' | 'success' | 'warning' | 'error';

type FilterType = 'all' | NotificationType;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatRelativeTime(isoDate: string): string {
  const now = Date.now();
  const then = new Date(isoDate).getTime();
  const diff = now - then;

  const minutes = Math.floor(diff / 60_000);
  const hours = Math.floor(diff / 3_600_000);
  const days = Math.floor(diff / 86_400_000);

  if (minutes < 1) return "A l'instant";
  if (minutes < 60) return `Il y a ${minutes} min`;
  if (hours < 24) return `Il y a ${hours}h`;
  if (days < 7) return `Il y a ${days}j`;
  return new Date(isoDate).toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: 'short',
  });
}

type DateGroup = 'today' | 'yesterday' | 'thisWeek' | 'older';

const DATE_GROUP_LABELS: Record<DateGroup, string> = {
  today: "Aujourd'hui",
  yesterday: 'Hier',
  thisWeek: 'Cette semaine',
  older: 'Plus ancien',
};

function getDateGroup(isoDate: string): DateGroup {
  const now = new Date();
  const date = new Date(isoDate);

  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfYesterday = new Date(startOfToday.getTime() - 86_400_000);
  // Start of week (Monday)
  const dayOfWeek = now.getDay();
  const diffToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
  const startOfWeek = new Date(startOfToday.getTime() - diffToMonday * 86_400_000);

  if (date >= startOfToday) return 'today';
  if (date >= startOfYesterday) return 'yesterday';
  if (date >= startOfWeek) return 'thisWeek';
  return 'older';
}

function groupByDate<T extends { createdAt: string }>(items: T[]): { group: DateGroup; label: string; items: T[] }[] {
  const groups: Record<DateGroup, T[]> = { today: [], yesterday: [], thisWeek: [], older: [] };
  items.forEach((item) => {
    groups[getDateGroup(item.createdAt)].push(item);
  });
  const order: DateGroup[] = ['today', 'yesterday', 'thisWeek', 'older'];
  return order
    .filter((g) => groups[g].length > 0)
    .map((g) => ({ group: g, label: DATE_GROUP_LABELS[g], items: groups[g] }));
}

// ─── Navigation mapping ──────────────────────────────────────────────────────

function getNotificationLink(type: string, productId?: string): string | null {
  if (productId) return `/products/${productId}`;
  switch (type) {
    case 'info':
      return '/products';
    case 'success':
      return '/portfolio';
    case 'warning':
      return '/products';
    default:
      return null;
  }
}

// ─── Notification icon & colors ───────────────────────────────────────────────

const TYPE_CONFIG: Record<
  NotificationType,
  {
    icon: LucideIcon;
    accent: string;
    bgGradient: string;
    ringColor: string;
    label: string;
  }
> = {
  info: {
    icon: Info,
    accent: '#3B1FA8',
    bgGradient: 'from-[#3B1FA8]/10 to-[#3B1FA8]/5',
    ringColor: 'ring-[#3B1FA8]/15',
    label: 'Info',
  },
  success: {
    icon: CheckCircle2,
    accent: '#00B894',
    bgGradient: 'from-[#00B894]/10 to-[#00B894]/5',
    ringColor: 'ring-[#00B894]/15',
    label: 'Succes',
  },
  warning: {
    icon: AlertTriangle,
    accent: '#D4A017',
    bgGradient: 'from-[#D4A017]/10 to-[#D4A017]/5',
    ringColor: 'ring-[#D4A017]/15',
    label: 'Avertissement',
  },
  error: {
    icon: XCircle,
    accent: '#E8334A',
    bgGradient: 'from-[#E8334A]/10 to-[#E8334A]/5',
    ringColor: 'ring-[#E8334A]/15',
    label: 'Erreur',
  },
};

// Map store types to our local NotificationType
function normalizeType(type: string): NotificationType {
  if (type === 'info' || type === 'success' || type === 'warning' || type === 'error') return type;
  // Map other store types
  if (type === 'closing' || type === 'observation') return 'warning';
  if (type === 'status' || type === 'system' || type === 'coupon') return 'info';
  return 'info';
}

// ─── Demo notifications ───────────────────────────────────────────────────────

const DEMO_NOTIFICATIONS = [
  {
    title: 'Nouveau produit disponible',
    message:
      'Un nouvel Autocall Phoenix sur CAC 40 est maintenant ouvert a la souscription. Rendement indicatif : 9,5% /an.',
    type: 'info' as NotificationType,
  },
  {
    title: "Marque d'interet confirmee",
    message:
      'Votre marque d\'interet de 500 000 EUR sur "Phoenix Europe Dividendes 2026" a ete confirmee.',
    type: 'success' as NotificationType,
  },
  {
    title: 'Cloture imminente',
    message:
      'L\'enveloppe "Barrier Note Energie Q2 2025" ferme dans 48h. Il reste 12% de capacite disponible.',
    type: 'warning' as NotificationType,
  },
  {
    title: 'Mise a jour reglementaire',
    message:
      'Votre dossier ORIAS est en cours de verification. Vous serez notifie des validation par nos equipes.',
    type: 'info' as NotificationType,
  },
];

// ─── Auto-mark-read hook ─────────────────────────────────────────────────────

function useAutoMarkRead(
  id: string,
  read: boolean,
  markRead: (id: string) => void,
) {
  const ref = useRef<HTMLDivElement>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (read) return;
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          timerRef.current = setTimeout(() => {
            markRead(id);
          }, 3000);
        } else {
          if (timerRef.current) {
            clearTimeout(timerRef.current);
            timerRef.current = null;
          }
        }
      },
      { threshold: 0.5 },
    );

    observer.observe(el);

    return () => {
      observer.disconnect();
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [id, read, markRead]);

  return ref;
}

// ─── Notification Card ────────────────────────────────────────────────────────

interface NotificationCardProps {
  id: string;
  title: string;
  message: string;
  type: NotificationType;
  read: boolean;
  createdAt: string;
  productId?: string;
  onMarkRead: (id: string) => void;
  onDismiss: (id: string) => void;
}

function NotificationCard({
  id,
  title,
  message,
  type,
  read,
  createdAt,
  productId,
  onMarkRead,
  onDismiss,
}: NotificationCardProps) {
  const config = TYPE_CONFIG[type] ?? TYPE_CONFIG.info;
  const Icon = config.icon;
  const link = getNotificationLink(type, productId);

  const autoReadRef = useAutoMarkRead(id, read, onMarkRead);

  const cardContent = (
    <div
      ref={autoReadRef}
      className={cn(
        'group relative flex gap-3 p-3.5 rounded-xl border transition-all duration-300',
        'focus-within:ring-2 focus-within:ring-[#3B1FA8]/20 focus-within:border-[#3B1FA8]/30',
        read
          ? 'bg-white/50 dark:bg-white/[0.03] border-border/40 opacity-55 hover:opacity-75 hover:shadow-sm'
          : [
              'bg-white/80 dark:bg-white/5 backdrop-blur-md border-border/60',
              'shadow-card hover:shadow-card-hover',
              'hover:-translate-y-0.5',
            ],
        link && 'cursor-pointer',
      )}
      role="article"
      aria-label={title}
    >
      {/* Unread accent line */}
      {!read && (
        <div
          className="absolute inset-y-0 left-0 w-[3px] rounded-l-xl"
          style={{
            background: `linear-gradient(180deg, ${config.accent}, ${config.accent}66)`,
          }}
        />
      )}

      {/* Icon */}
      <div
        className={cn(
          'w-8 h-8 rounded-lg flex items-center justify-center shrink-0',
          'bg-gradient-to-br ring-1',
          config.bgGradient,
          config.ringColor,
        )}
      >
        <Icon size={14} style={{ color: config.accent }} />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2.5 mb-0.5">
          <div className="flex items-center gap-1.5">
            {!read && (
              <span
                className="w-1.5 h-1.5 rounded-full bg-gradient-to-br from-[#3B1FA8] to-[#3B1FA8]/70 shrink-0 shadow-sm shadow-[#3B1FA8]/30"
                aria-label="Non lu"
              />
            )}
            <h3 className="font-body text-[13px] font-semibold text-ink dark:text-white leading-snug">
              {title}
            </h3>
          </div>
          <span className="font-mono text-[10px] text-ink-3 dark:text-white/40 whitespace-nowrap shrink-0 tabular-nums">
            {formatRelativeTime(createdAt)}
          </span>
        </div>
        <p className="font-body text-[12px] text-ink-3 dark:text-white/50 leading-relaxed">{message}</p>
        {productId && (
          <Link
            href={`/products/${productId}`}
            onClick={(e) => e.stopPropagation()}
            className={cn(
              'inline-flex items-center gap-1 mt-1.5 px-2 py-0.5 rounded-md text-[10px] font-semibold font-body',
              'bg-[#3B1FA8]/8 text-[#3B1FA8] dark:bg-[#C9BCFF]/10 dark:text-[#C9BCFF]',
              'hover:bg-[#3B1FA8]/15 dark:hover:bg-[#C9BCFF]/20',
              'transition-colors duration-150',
            )}
          >
            <ExternalLink size={9} />
            Voir le produit
          </Link>
        )}
      </div>

      {/* Action buttons */}
      <div className="flex flex-col items-center gap-1 shrink-0 self-start">
        {/* Mark read button */}
        {!read && (
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onMarkRead(id);
            }}
            title="Marquer comme lu"
            className={cn(
              'p-1 rounded-lg',
              'text-ink-3 hover:text-[#3B1FA8] dark:hover:text-[#C9BCFF]',
              'hover:bg-[#3B1FA8]/10',
              'opacity-0 group-hover:opacity-100',
              'transition-all duration-200',
            )}
            aria-label="Marquer comme lu"
          >
            <CheckCheck size={13} />
          </button>
        )}

        {/* Dismiss button */}
        <button
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onDismiss(id);
          }}
          title="Supprimer"
          className={cn(
            'p-1 rounded-lg',
            'text-ink-3 hover:text-[#E8334A]',
            'hover:bg-[#E8334A]/10',
            'opacity-0 group-hover:opacity-100',
            'transition-all duration-200',
          )}
          aria-label="Supprimer la notification"
        >
          <Trash2 size={13} />
        </button>

        {/* Clickable indicator arrow */}
        {link && (
          <ChevronRight
            size={13}
            className={cn(
              'text-ink-3/30 group-hover:text-[#3B1FA8]/60 dark:group-hover:text-[#C9BCFF]/60',
              'transition-all duration-200 mt-auto',
            )}
          />
        )}
      </div>
    </div>
  );

  if (link) {
    return (
      <Link href={link} className="block no-underline">
        {cardContent}
      </Link>
    );
  }

  return cardContent;
}

// ─── Section Label ────────────────────────────────────────────────────────────

function SectionLabel({ children, accent }: { children: React.ReactNode; accent: string }) {
  return (
    <div className="flex items-center gap-2 mb-2.5">
      <span
        className="w-1.5 h-1.5 rounded-full shadow-sm"
        style={{
          background: `linear-gradient(135deg, ${accent}, ${accent}88)`,
          boxShadow: `0 0 6px ${accent}30`,
        }}
      />
      <p className="font-display text-[10px] font-bold uppercase tracking-widest text-ink-3 dark:text-white/40">
        {children}
      </p>
      <div className="flex-1 h-px bg-gradient-to-r from-border/60 to-transparent" />
    </div>
  );
}

// ─── Filter Pill ─────────────────────────────────────────────────────────────

function FilterPill({
  active,
  onClick,
  icon: Icon,
  label,
  count,
  accent,
}: {
  active: boolean;
  onClick: () => void;
  icon?: LucideIcon;
  label: string;
  count: number;
  accent: string;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-semibold font-body',
        'border transition-all duration-200',
        active
          ? 'text-white border-transparent shadow-sm'
          : 'border-border/60 dark:border-white/15 text-ink-3 dark:text-white/50 hover:text-ink dark:hover:text-white/80',
      )}
      style={
        active
          ? { background: `linear-gradient(135deg, ${accent}, ${accent}CC)` }
          : undefined
      }
    >
      {Icon && <Icon size={12} className={active ? 'text-white' : ''} style={!active ? { color: accent } : undefined} />}
      {label}
      <span
        className={cn(
          'inline-flex items-center justify-center h-4 min-w-4 px-1 rounded-full text-[9px] font-bold leading-none',
          active
            ? 'bg-white/25 text-white'
            : 'bg-ink-3/8 text-ink-3 dark:bg-white/10 dark:text-white/50',
        )}
      >
        {count}
      </span>
    </button>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function NotificationsPage() {
  useEffect(() => { document.title = "Notifications | Strick'in"; }, []);
  const {
    notifications,
    unreadCount,
    markRead,
    markAllRead,
    dismiss,
    addNotification,
  } = useNotificationsStore();

  const initDemo = useNotificationsStore((s) => s.initDemoNotifications);

  // Type filter
  const [typeFilter, setTypeFilter] = useState<FilterType>('all');

  // Seed demo notifications on first load if store is empty
  useEffect(() => {
    if (notifications.length === 0) {
      initDemo();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Simulated real-time notification after 30s on the page
  useEffect(() => {
    const timer = setTimeout(() => {
      addNotification({
        type: 'closing',
        title: 'Rappel: Cloture imminente',
        message: 'M Ambition 10 ferme dans 3 jours. N\'oubliez pas de finaliser vos engagements.',
        productId: 'prod-010',
        productName: 'M Ambition 10',
      });
    }, 30000);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const hasUnread = unreadCount() > 0;

  // Compute type counts for filter pills
  const typeCounts = useMemo(() => {
    const counts: Record<string, number> = { all: 0, info: 0, success: 0, warning: 0, error: 0 };
    notifications.forEach((n) => {
      const nt = normalizeType(n.type);
      counts[nt] = (counts[nt] || 0) + 1;
      counts.all += 1;
    });
    return counts;
  }, [notifications]);

  // Filter notifications by type
  const filteredNotifications = useMemo(() => {
    if (typeFilter === 'all') return notifications;
    return notifications.filter((n) => normalizeType(n.type) === typeFilter);
  }, [notifications, typeFilter]);

  const totalUnread = unreadCount();

  // Group filtered notifications by date
  const dateGroups = useMemo(() => groupByDate(filteredNotifications), [filteredNotifications]);

  const filteredUnread = filteredNotifications.filter((n) => !n.read);
  const filteredRead = filteredNotifications.filter((n) => n.read);
  const hasFilteredUnread = filteredUnread.length > 0;

  return (
    <main className="w-full animate-fade-in">
      <PageHeader
        icon={Bell}
        title="Notifications"
        subtitle="Restez informe des opportunites et mises a jour."
        accentFrom="#3B1FA8"
        accentTo="#1A0A3E"
        className="mb-1.5"
      >
        {hasUnread && (
          <Button
            variant="outline"
            size="sm"
            onClick={markAllRead}
            className="flex items-center gap-1.5 shrink-0 rounded-lg h-8 text-[11px]"
          >
            <CheckCheck size={13} />
            Tout marquer comme lu
          </Button>
        )}
      </PageHeader>

      {/* Preferences link */}
      <div className="mb-3">
        <Link
          href="/settings"
          className={cn(
            'inline-flex items-center gap-1.5 text-[11px] font-body font-medium',
            'text-ink-3/60 dark:text-white/30 hover:text-[#3B1FA8] dark:hover:text-[#C9BCFF]',
            'transition-colors duration-200',
          )}
        >
          <Settings size={11} />
          Gerer les preferences
        </Link>
      </div>

      <div
        className="h-[2px] rounded-full mb-5"
        style={{
          background:
            'linear-gradient(90deg, #3B1FA8, #00B894 50%, transparent)',
        }}
      />

      {/* ── Filter Pills ──────────────────────────────────────────────────── */}
      <div className="flex items-center gap-1.5 flex-wrap mb-5">
        <FilterPill
          active={typeFilter === 'all'}
          onClick={() => setTypeFilter('all')}
          label={totalUnread > 0 ? `Toutes (${totalUnread} non lues)` : 'Toutes'}
          count={typeCounts.all}
          accent="#3B1FA8"
        />
        <FilterPill
          active={typeFilter === 'info'}
          onClick={() => setTypeFilter('info')}
          icon={Info}
          label="Info"
          count={typeCounts.info}
          accent="#3B1FA8"
        />
        <FilterPill
          active={typeFilter === 'success'}
          onClick={() => setTypeFilter('success')}
          icon={CheckCircle2}
          label="Succes"
          count={typeCounts.success}
          accent="#00B894"
        />
        <FilterPill
          active={typeFilter === 'warning'}
          onClick={() => setTypeFilter('warning')}
          icon={AlertTriangle}
          label="Avertissement"
          count={typeCounts.warning}
          accent="#D4A017"
        />
        <FilterPill
          active={typeFilter === 'error'}
          onClick={() => setTypeFilter('error')}
          icon={XCircle}
          label="Erreur"
          count={typeCounts.error}
          accent="#E8334A"
        />
      </div>

      {/* ── Notifications list (grouped by date) ─────────────────────────── */}
      {filteredNotifications.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 py-20 text-center bg-white/80 dark:bg-white/5 backdrop-blur-md rounded-xl border border-border/60 shadow-card">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#3B1FA8]/10 to-[#00B894]/10 border border-border/40 flex items-center justify-center">
            <Inbox size={20} className="text-ink-3 opacity-40" />
          </div>
          <div>
            <p className="font-display text-[13px] font-bold text-ink dark:text-white">
              {typeFilter === 'all' ? 'Aucune notification' : 'Aucune notification de ce type'}
            </p>
            <p className="font-body text-[11px] text-ink-3 dark:text-white/40 mt-0.5 max-w-xs">
              {typeFilter === 'all'
                ? 'Vous serez averti ici des nouvelles opportunites et mises a jour importantes.'
                : 'Essayez un autre filtre pour voir vos notifications.'}
            </p>
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-5 stagger-children">
          {dateGroups.map(({ group, label, items }) => (
            <div key={group}>
              <SectionLabel accent={group === 'today' ? '#3B1FA8' : group === 'yesterday' ? '#5535C4' : '#7B6FA0'}>
                {label}
              </SectionLabel>
              <div className="flex flex-col gap-1.5 stagger-children">
                {items.map((n) => (
                  <NotificationCard
                    key={n.id}
                    {...n}
                    type={normalizeType(n.type)}
                    onMarkRead={markRead}
                    onDismiss={dismiss}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}
