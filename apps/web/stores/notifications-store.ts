'use client';

import { create } from 'zustand';

type NotificationType = 'info' | 'success' | 'warning' | 'error';

interface Notification {
  id: string;
  title: string;
  message: string;
  type: NotificationType;
  read: boolean;
  createdAt: string;
}

interface NotificationsState {
  notifications: Notification[];
  unreadCount: number;

  addNotification: (n: Omit<Notification, 'id' | 'read' | 'createdAt'>) => void;
  markRead: (id: string) => void;
  markAllRead: () => void;
}

export const useNotificationsStore = create<NotificationsState>()((set, get) => ({
  notifications: [],
  get unreadCount() {
    return get().notifications.filter((n) => !n.read).length;
  },

  addNotification: (n) => {
    const notification: Notification = {
      ...n,
      id: crypto.randomUUID(),
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
}));
