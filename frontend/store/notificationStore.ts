import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  timestamp: Date;
  read: boolean;
  actionUrl?: string;
  actionLabel?: string;
}

export interface NotificationState {
  // Estado
  notifications: Notification[];
  unreadCount: number;
  
  // Filtros
  showOnlyUnread: boolean;
  typeFilter: Notification['type'] | 'all';

  // Acciones - CRUD
  addNotification: (notification: Omit<Notification, 'id' | 'timestamp' | 'read'>) => void;
  removeNotification: (id: string) => void;
  clearAllNotifications: () => void;

  // Acciones - Estado de lectura
  markAsRead: (id: string) => void;
  markAsUnread: (id: string) => void;
  markAllAsRead: () => void;

  // Acciones - Filtros
  setShowOnlyUnread: (show: boolean) => void;
  setTypeFilter: (type: Notification['type'] | 'all') => void;

  // Acciones - Utilidades
  getFilteredNotifications: () => Notification[];
  getUnreadNotifications: () => Notification[];
  getNotificationById: (id: string) => Notification | undefined;

  // Acciones - Limpieza
  reset: () => void;
}

const initialState = {
  notifications: [],
  unreadCount: 0,
  showOnlyUnread: false,
  typeFilter: 'all' as const,
};

export const useNotificationStore = create<NotificationState>()(
  devtools(
    persist(
      (set, get) => ({
        ...initialState,

        // Agregar notificación
        addNotification: (notification) => {
          const newNotification: Notification = {
            ...notification,
            id: `notif-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            timestamp: new Date(),
            read: false,
          };

          set(state => ({
            notifications: [newNotification, ...state.notifications],
            unreadCount: state.unreadCount + 1,
          }));
        },

        // Eliminar notificación
        removeNotification: (id: string) => {
          const notification = get().notifications.find(n => n.id === id);
          set(state => ({
            notifications: state.notifications.filter(n => n.id !== id),
            unreadCount: notification && !notification.read 
              ? state.unreadCount - 1 
              : state.unreadCount,
          }));
        },

        // Limpiar todas las notificaciones
        clearAllNotifications: () => {
          set({ 
            notifications: [],
            unreadCount: 0,
          });
        },

        // Marcar como leída
        markAsRead: (id: string) => {
          set(state => ({
            notifications: state.notifications.map(n =>
              n.id === id ? { ...n, read: true } : n
            ),
            unreadCount: state.notifications.find(n => n.id === id && !n.read)
              ? state.unreadCount - 1
              : state.unreadCount,
          }));
        },

        // Marcar como no leída
        markAsUnread: (id: string) => {
          set(state => ({
            notifications: state.notifications.map(n =>
              n.id === id ? { ...n, read: false } : n
            ),
            unreadCount: state.notifications.find(n => n.id === id && n.read)
              ? state.unreadCount + 1
              : state.unreadCount,
          }));
        },

        // Marcar todas como leídas
        markAllAsRead: () => {
          set(state => ({
            notifications: state.notifications.map(n => ({ ...n, read: true })),
            unreadCount: 0,
          }));
        },

        // Filtros
        setShowOnlyUnread: (show: boolean) => set({ showOnlyUnread: show }),

        setTypeFilter: (type: Notification['type'] | 'all') => set({ typeFilter: type }),

        // Utilidades
        getFilteredNotifications: () => {
          const { notifications, showOnlyUnread, typeFilter } = get();
          
          let filtered = [...notifications];

          // Filtrar por leídas/no leídas
          if (showOnlyUnread) {
            filtered = filtered.filter(n => !n.read);
          }

          // Filtrar por tipo
          if (typeFilter !== 'all') {
            filtered = filtered.filter(n => n.type === typeFilter);
          }

          // Ordenar por fecha (más recientes primero)
          return filtered.sort((a, b) => 
            new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
          );
        },

        getUnreadNotifications: () => {
          return get().notifications.filter(n => !n.read);
        },

        getNotificationById: (id: string) => {
          return get().notifications.find(n => n.id === id);
        },

        // Reset
        reset: () => set(initialState),
      }),
      {
        name: 'notification-storage',
        partialize: (state) => ({
          // Persistir notificaciones y contador
          notifications: state.notifications,
          unreadCount: state.unreadCount,
        }),
      }
    ),
    { name: 'NotificationStore' }
  )
);
