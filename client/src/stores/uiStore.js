import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useUIStore = create(
  persist(
    (set) => ({
      theme: 'dark',
      sidebarOpen: false,
      notifications: [],
      isLoading: false,

      setTheme: (theme) => set({ theme }),
      toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
      
      addNotification: (notification) => {
        set((state) => ({
          notifications: [...state.notifications, {
            id: Date.now(),
            ...notification,
            timestamp: new Date()
          }]
        }));
      },
      
      removeNotification: (id) => {
        set((state) => ({
          notifications: state.notifications.filter(n => n.id !== id)
        }));
      },
      
      setLoading: (isLoading) => set({ isLoading }),
      
      clearNotifications: () => set({ notifications: [] })
    }),
    {
      name: 'ui-storage',
      partialize: (state) => ({
        theme: state.theme
      })
    }
  )
);
