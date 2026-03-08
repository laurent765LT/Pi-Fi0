'use client';

import { useEffect } from 'react';
import { Bell, CheckCheck, Info, CheckCircle2, AlertTriangle, XCircle, type LucideIcon } from 'lucide-react';
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

  if (minutes < 1) return "À l'instant";
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
    iconColor: string;
    bgColor: string;
    borderColor: string;
  }
> = {
  info: {
    icon: Info,
    iconColor: 'text-violet',
    bgColor: 'bg-violet-pale',
    borderColor: 'border-[#C9BCFF]',
  },
  success: {
    icon: CheckCircle2,
    iconColor: 'text-teal',
    bgColor: 'bg-[#D6F7EF]',
    borderColor: 'border-[#A3EDD9]',
  },
  warning: {
    icon: AlertTriangle,
    iconColor: 'text-gold',
    bgColor: 'bg-[#FDF3D6]',
    borderColor: 'border-[#F0D98A]',
  },
  error: {
    icon: XCircle,
    iconColor: 'text-red',
    bgColor: 'bg-[#FDE8EB]',
    borderColor: 'border-[#F8B4BC]',
  },
};

// ─── Demo notifications ───────────────────────────────────────────────────────

const DEMO_NOTIFICATIONS = [
  {
    title: 'Nouveau produit disponible',
    message:
      'Un nouvel Autocall Phoenix sur CAC 40 est maintenant ouvert à la souscription. Rendement indicatif : 9,5% /an.',
    type: 'info' as NotificationType,
  },
  {
    title: "Marque d'intérêt confirmée",
    message:
      'Votre marque d\'intérêt de 500 000 € sur "Phoenix Europe Dividendes 2026" a été confirmée.',
    type: 'success' as NotificationType,
  },
  {
    title: 'Clôture imminente',
    message:
      'L\'enveloppe "Barrier Note Énergie Q2 2025" ferme dans 48h. Il reste 12% de capacité disponible.',
    type: 'warning' as NotificationType,
  },
  {
    title: 'Mise à jour réglementaire',
    message:
      'Votre dossier ORIAS est en cours de vérification. Vous serez notifié dès validation par nos équipes.',
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
      className={[
        'group flex gap-4 p-4 rounded-lg border transition-all duration-200',
        read
          ? 'bg-white border-border opacity-60 hover:opacity-80'
          : 'bg-white border-border shadow-xs hover:shadow-md',
      ].join(' ')}
      role="article"
      aria-label={title}
    >
      {/* Icon */}
      <div
        className={[
          'w-9 h-9 rounded-md flex items-center justify-center shrink-0 border',
          config.bgColor,
          config.borderColor,
        ].join(' ')}
      >
        <Icon size={16} className={config.iconColor} />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-3 mb-1">
          <div className="flex items-center gap-2">
            {!read && (
              <span
                className="w-2 h-2 rounded-full bg-violet shrink-0"
                aria-label="Non lu"
              />
            )}
            <h3 className="font-body text-sm font-semibold text-ink leading-snug">
              {title}
            </h3>
          </div>
          <span className="font-body text-[11px] text-ink-3 whitespace-nowrap shrink-0">
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
          className="p-1.5 rounded-sm text-ink-3 hover:text-violet hover:bg-violet-pale opacity-0 group-hover:opacity-100 transition-all duration-150 shrink-0 self-start"
          aria-label="Marquer comme lu"
        >
          <CheckCheck size={14} />
        </button>
      )}
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

  // Seed demo notifications on first load if store is empty
  useEffect(() => {
    if (notifications.length === 0) {
      // Stagger the timestamps slightly so they look realistic
      DEMO_NOTIFICATIONS.forEach((n, i) => {
        // We temporarily override createdAt by calling addNotification and relying on the store's timestamp.
        // To backdate them, we add them and it's fine — they'll all show "À l'instant" for the demo.
        setTimeout(() => addNotification(n), i * 100);
      });
    }
    // Only run once on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const hasUnread = unreadCount > 0;

  return (
    <main className="max-w-container mx-auto px-6 py-8">
      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="flex items-start justify-between gap-4 mb-3">
        <div className="flex items-center gap-3">
          <h1 className="font-display text-3xl font-bold text-ink">
            Notifications
          </h1>
          {hasUnread && (
            <span className="inline-flex items-center justify-center h-6 min-w-6 px-1.5 rounded-full bg-violet text-white text-[11px] font-bold leading-none">
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          )}
        </div>

        {hasUnread && (
          <Button
            variant="outline"
            size="sm"
            onClick={markAllRead}
            className="flex items-center gap-2 shrink-0"
          >
            <CheckCheck size={14} />
            Tout marquer comme lu
          </Button>
        )}
      </div>
      <div className="gradient-bar h-1 rounded-full mb-8" />

      {/* ── Notifications list ─────────────────────────────────────────────── */}
      {notifications.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-4 py-24 text-center">
          <div className="w-14 h-14 rounded-full bg-surface-2 border border-border flex items-center justify-center">
            <Bell size={24} className="text-ink-3 opacity-40" />
          </div>
          <div>
            <p className="font-body text-sm font-semibold text-ink-2">
              Aucune notification
            </p>
            <p className="font-body text-xs text-ink-3 mt-1">
              Vous serez averti ici des nouvelles opportunités et mises à jour importantes.
            </p>
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {/* Unread section */}
          {hasUnread && (
            <div>
              <p className="label-section mb-3">Non lues</p>
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
            <div className={hasUnread ? 'mt-4' : ''}>
              {hasUnread && <p className="label-section mb-3">Lues</p>}
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
