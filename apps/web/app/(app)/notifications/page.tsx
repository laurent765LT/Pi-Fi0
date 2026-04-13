'use client';

import { useEffect } from 'react';
import {
  Bell,
  CheckCheck,
  Info,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Inbox,
  type LucideIcon,
} from 'lucide-react';
import { cn } from '@/lib/cn';
import { useNotificationsStore } from '@/stores/notifications-store';
import { Button } from '@/components/ui/button';

// ─── Types ────────────────────────────────────────────────────────────────────

type NotificationType = 'info' | 'success' | 'warning' | 'error';

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

// ─── Notification icon & colors ───────────────────────────────────────────────

const TYPE_CONFIG: Record<
  NotificationType,
  {
    icon: LucideIcon;
    accent: string;
    bgGradient: string;
    ringColor: string;
  }
> = {
  info: {
    icon: Info,
    accent: '#3B1FA8',
    bgGradient: 'from-[#3B1FA8]/10 to-[#3B1FA8]/5',
    ringColor: 'ring-[#3B1FA8]/15',
  },
  success: {
    icon: CheckCircle2,
    accent: '#00B894',
    bgGradient: 'from-[#00B894]/10 to-[#00B894]/5',
    ringColor: 'ring-[#00B894]/15',
  },
  warning: {
    icon: AlertTriangle,
    accent: '#D4A017',
    bgGradient: 'from-[#D4A017]/10 to-[#D4A017]/5',
    ringColor: 'ring-[#D4A017]/15',
  },
  error: {
    icon: XCircle,
    accent: '#E8334A',
    bgGradient: 'from-[#E8334A]/10 to-[#E8334A]/5',
    ringColor: 'ring-[#E8334A]/15',
  },
};

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

// ─── Notification Card ────────────────────────────────────────────────────────

interface NotificationCardProps {
  id: string;
  title: string;
  message: string;
  type: NotificationType;
  read: boolean;
  createdAt: string;
  onMarkRead: (id: string) => void;
}

function NotificationCard({
  id,
  title,
  message,
  type,
  read,
  createdAt,
  onMarkRead,
}: NotificationCardProps) {
  const config = TYPE_CONFIG[type] ?? TYPE_CONFIG.info;
  const Icon = config.icon;

  return (
    <div
      className={cn(
        'group relative flex gap-4 p-4 rounded-xl border transition-all duration-200',
        read
          ? 'bg-white/50 dark:bg-[#1A0A3E]/20 border-border/40 opacity-55 hover:opacity-75'
          : [
              'bg-white dark:bg-[#1A0A3E]/40 border-border/60',
              'shadow-sm hover:shadow-md',
              'hover:-translate-y-0.5',
            ],
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
          'w-9 h-9 rounded-lg flex items-center justify-center shrink-0',
          'bg-gradient-to-br ring-1',
          config.bgGradient,
          config.ringColor,
        )}
      >
        <Icon size={16} style={{ color: config.accent }} />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-3 mb-1">
          <div className="flex items-center gap-2">
            {!read && (
              <span
                className="w-2 h-2 rounded-full bg-gradient-to-br from-[#3B1FA8] to-[#3B1FA8]/70 shrink-0 shadow-sm shadow-[#3B1FA8]/30"
                aria-label="Non lu"
              />
            )}
            <h3 className="font-body text-sm font-semibold text-ink dark:text-white leading-snug">
              {title}
            </h3>
          </div>
          <span className="font-mono text-[11px] text-ink-3 whitespace-nowrap shrink-0 tabular-nums">
            {formatRelativeTime(createdAt)}
          </span>
        </div>
        <p className="font-body text-sm text-ink-3 leading-relaxed">{message}</p>
      </div>

      {/* Mark read button */}
      {!read && (
        <button
          onClick={() => onMarkRead(id)}
          title="Marquer comme lu"
          className={cn(
            'p-1.5 rounded-lg shrink-0 self-start',
            'text-ink-3 hover:text-[#3B1FA8] dark:hover:text-[#C9BCFF]',
            'hover:bg-[#3B1FA8]/10',
            'opacity-0 group-hover:opacity-100',
            'transition-all duration-200',
          )}
          aria-label="Marquer comme lu"
        >
          <CheckCheck size={14} />
        </button>
      )}
    </div>
  );
}

// ─── Section Label ────────────────────────────────────────────────────────────

function SectionLabel({ children, accent }: { children: React.ReactNode; accent: string }) {
  return (
    <div className="flex items-center gap-2.5 mb-3">
      <span
        className="w-2 h-2 rounded-full shadow-sm"
        style={{
          background: `linear-gradient(135deg, ${accent}, ${accent}88)`,
          boxShadow: `0 0 6px ${accent}30`,
        }}
      />
      <p className="font-display text-xs font-bold uppercase tracking-widest text-ink-3">
        {children}
      </p>
      <div className="flex-1 h-px bg-gradient-to-r from-border/60 to-transparent" />
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function NotificationsPage() {
  const {
    notifications,
    unreadCount,
    addNotification,
    markRead,
    markAllRead,
  } = useNotificationsStore();

  const initDemo = useNotificationsStore((s) => s.initDemoNotifications);

  // Seed demo notifications on first load if store is empty
  useEffect(() => {
    if (notifications.length === 0) {
      initDemo();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const hasUnread = unreadCount() > 0;

  return (
    <main className="max-w-container mx-auto px-6 py-8 animate-fade-in">
      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="flex items-start justify-between gap-4 mb-2">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#3B1FA8] to-[#1A0A3E] flex items-center justify-center shadow-sm shadow-[#3B1FA8]/20">
            <Bell size={20} className="text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="font-display text-2xl font-bold text-ink dark:text-white leading-tight">
                Notifications
              </h1>
              {hasUnread && (
                <span className="inline-flex items-center justify-center h-6 min-w-6 px-2 rounded-full bg-gradient-to-r from-[#3B1FA8] to-[#3B1FA8]/80 text-white text-[11px] font-bold leading-none shadow-sm shadow-[#3B1FA8]/25">
                  {unreadCount() > 99 ? '99+' : unreadCount()}
                </span>
              )}
            </div>
            <p className="font-body text-sm text-ink-3 mt-0.5">
              Restez informe des opportunites et mises a jour.
            </p>
          </div>
        </div>

        {hasUnread && (
          <Button
            variant="outline"
            size="sm"
            onClick={markAllRead}
            className="flex items-center gap-2 shrink-0 rounded-lg"
          >
            <CheckCheck size={14} />
            Tout marquer comme lu
          </Button>
        )}
      </div>
      <div
        className="h-[2px] rounded-full mb-8 mt-4"
        style={{
          background:
            'linear-gradient(90deg, #3B1FA8, #00B894 50%, transparent)',
        }}
      />

      {/* ── Notifications list ─────────────────────────────────────────────── */}
      {notifications.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-4 py-24 text-center bg-white/50 dark:bg-[#1A0A3E]/20 rounded-2xl border border-border/40 backdrop-blur-sm">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#3B1FA8]/10 to-[#00B894]/10 border border-border/40 flex items-center justify-center">
            <Inbox size={24} className="text-ink-3 opacity-40" />
          </div>
          <div>
            <p className="font-display text-sm font-bold text-ink dark:text-white">
              Aucune notification
            </p>
            <p className="font-body text-xs text-ink-3 mt-1 max-w-xs">
              Vous serez averti ici des nouvelles opportunites et mises a jour importantes.
            </p>
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {/* Unread section */}
          {hasUnread && (
            <div>
              <SectionLabel accent="#3B1FA8">Non lues</SectionLabel>
              <div className="flex flex-col gap-2">
                {notifications
                  .filter((n) => !n.read)
                  .map((n) => (
                    <NotificationCard
                      key={n.id}
                      {...n}
                      type={n.type as NotificationType}
                      onMarkRead={markRead}
                    />
                  ))}
              </div>
            </div>
          )}

          {/* Read section */}
          {notifications.some((n) => n.read) && (
            <div className={hasUnread ? 'mt-6' : ''}>
              {hasUnread && <SectionLabel accent="#7B6FA0">Lues</SectionLabel>}
              <div className="flex flex-col gap-2">
                {notifications
                  .filter((n) => n.read)
                  .map((n) => (
                    <NotificationCard
                      key={n.id}
                      {...n}
                      type={n.type as NotificationType}
                      onMarkRead={markRead}
                    />
                  ))}
              </div>
            </div>
          )}
        </div>
      )}
    </main>
  );
}
