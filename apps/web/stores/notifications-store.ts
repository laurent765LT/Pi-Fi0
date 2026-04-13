'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type NotificationType = 'closing' | 'observation' | 'coupon' | 'status' | 'system' | 'info' | 'success' | 'warning' | 'error';

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: NotificationType;
  read: boolean;
  createdAt: string;
  productId?: string;
  productName?: string;
}

interface NotificationsState {
  notifications: Notification[];
  initialized: boolean;

  addNotification: (n: Omit<Notification, 'id' | 'read' | 'createdAt'>) => void;
  markRead: (id: string) => void;
  markAllRead: () => void;
  dismiss: (id: string) => void;
  unreadCount: () => number;
  initDemoNotifications: () => void;
}

export const useNotificationsStore = create<NotificationsState>()(
  persist(
    (set, get) => ({
      notifications: [],
      initialized: false,

      addNotification: (n) => {
        const notification: Notification = {
          ...n,
          id: `notif-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          read: false,
          createdAt: new Date().toISOString(),
        };
        set((state) => ({
          notifications: [notification, ...state.notifications],
        }));
      },

      markRead: (id) => {
        set((state) => ({
          notifications: state.notifications.map((n) =>
            n.id === id ? { ...n, read: true } : n,
          ),
        }));
      },

      markAllRead: () => {
        set((state) => ({
          notifications: state.notifications.map((n) => ({ ...n, read: true })),
        }));
      },

      dismiss: (id) => {
        set((state) => ({
          notifications: state.notifications.filter((n) => n.id !== id),
        }));
      },

      unreadCount: () => get().notifications.filter((n) => !n.read).length,

      initDemoNotifications: () => {
        if (get().initialized) return;
        const now = Date.now();
        const day = 86_400_000;

        const demoNotifs: Notification[] = [
          {
            id: 'n-close-001', type: 'closing', title: 'Clôture J-5',
            message: 'M Rendement 13 ferme dans 5 jours. Remplissage : 62%.',
            productId: 'prod-001', productName: 'M Rendement 13',
            read: false, createdAt: new Date(now - 0.5 * day).toISOString(),
          },
          {
            id: 'n-close-011', type: 'closing', title: 'Clôture J-10',
            message: 'G Equilibre ferme le 20/04/2026. Pensez à finaliser.',
            productId: 'prod-011', productName: 'G Equilibre',
            read: false, createdAt: new Date(now - 1 * day).toISOString(),
          },
          {
            id: 'n-obs-004', type: 'observation', title: 'Date d\'observation',
            message: 'M Equilibre CT — prochaine observation le 28/09/2026.',
            productId: 'prod-004', productName: 'M Equilibre CT',
            read: false, createdAt: new Date(now - 1.5 * day).toISOString(),
          },
          {
            id: 'n-fill-008', type: 'status', title: 'Étagère quasi pleine',
            message: 'Sélection Souveraineté Europe atteint 92% de remplissage.',
            productId: 'prod-008', productName: 'Sélection Souveraineté Europe',
            read: false, createdAt: new Date(now - 2 * day).toISOString(),
          },
          {
            id: 'n-commit-ok', type: 'success', title: 'Engagement confirmé',
            message: 'Votre engagement de 250 000€ sur M Rendement 13 a été confirmé.',
            productId: 'prod-001', productName: 'M Rendement 13',
            read: true, createdAt: new Date(now - 3 * day).toISOString(),
          },
          {
            id: 'n-commission', type: 'info', title: 'Commission versée',
            message: 'Commission de 6 250€ (M Rendement 13) créditée sur votre compte.',
            read: true, createdAt: new Date(now - 5 * day).toISOString(),
          },
          {
            id: 'n-sys-cli', type: 'system', title: 'CLI Agent-First disponible',
            message: 'La nouvelle interface CLI pour agents IA est prête. Tapez `strickin --help`.',
            read: false, createdAt: new Date(now - 0.2 * day).toISOString(),
          },
          {
            id: 'n-sys-welcome', type: 'system', title: 'Bienvenue sur Strick\'in',
            message: 'Votre plateforme de distribution de produits structurés est prête.',
            read: true, createdAt: new Date(now - 10 * day).toISOString(),
          },
        ];

        set({ notifications: demoNotifs, initialized: true });
      },
    }),
    {
      name: 'strickin-notifications',
      partialize: (s) => ({ notifications: s.notifications, initialized: s.initialized }),
    },
  ),
);
