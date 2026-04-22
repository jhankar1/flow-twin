import { create } from 'zustand';

export interface PushNotification {
  id: string;
  type: string;
  title: string;
  message: string;
  entityId?: string;
  timestamp: string;
  read: boolean;
}

interface NotificationState {
  notifications: PushNotification[];
  unreadCount: number;
  add: (n: Omit<PushNotification, 'id' | 'read'>) => void;
  markAllRead: () => void;
  clear: () => void;
}

export const useNotificationStore = create<NotificationState>((set, get) => ({
  notifications: [],
  unreadCount: 0,

  add: (n) => {
    const notification: PushNotification = {
      ...n,
      id: crypto.randomUUID(),
      read: false,
    };
    set((s) => ({
      notifications: [notification, ...s.notifications].slice(0, 50),
      unreadCount: s.unreadCount + 1,
    }));
  },

  markAllRead: () =>
    set((s) => ({
      notifications: s.notifications.map((n) => ({ ...n, read: true })),
      unreadCount: 0,
    })),

  clear: () => set({ notifications: [], unreadCount: 0 }),
}));
