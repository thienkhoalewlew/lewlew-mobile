import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Notification, NotificationState } from '../types';
import * as notificationService from '../services/notificationService';
import { socketService } from '../services/socketService';

let showNotificationCallback: ((notification: Notification) => void) | null = null;

export const setShowNotificationCallback = (callback: (notification: Notification) => void) => {
  showNotificationCallback = callback;
};

export const useNotificationStore = create<NotificationState>()(
  persist(
    (set, get) => ({
      notifications: [],
      unreadCount: 0,
      isLoading: false,
      error: null,
      socket: null,      fetchNotifications: async () => {
        set({ isLoading: true, error: null });
        try {
          console.log('NotificationStore: Fetching notifications...');
          const notifications = await notificationService.getNotifications();
          const unreadCount = notifications.filter(n => !n.read).length;
          
          console.log(`NotificationStore: Fetched ${notifications.length} notifications (${unreadCount} unread)`);
          
          set({ 
            notifications, 
            unreadCount, 
            isLoading: false 
          });
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Failed to fetch notifications';
          console.error('NotificationStore: Error fetching notifications:', errorMessage);
          set({ error: errorMessage, isLoading: false });
        }
      },
      
      markAsRead: async (notificationId: string) => {
        try {
          const success = await notificationService.markNotificationAsRead(notificationId);
          
          if (success) {
            // Update local state
            set(state => {
              const updatedNotifications = state.notifications.map(notification =>
                notification.id === notificationId 
                  ? { ...notification, read: true }
                  : notification
              );
              
              return {
                notifications: updatedNotifications,
                unreadCount: updatedNotifications.filter(n => !n.read).length
              };
            });
          }
        } catch (error) {
          console.error('Error marking notification as read:', error);
        }
      },
      
      markAllAsRead: async () => {
        // You would need to implement this endpoint on your backend
        // For now, we'll just update the local state
        set(state => ({
          notifications: state.notifications.map(n => ({ ...n, read: true })),
          unreadCount: 0
        }));
      },
      
      initializeSocket: (token: string) => {
        socketService.connect(token);
        
        socketService.onNotification((notification) => {
          get().addNotification(notification);
          
          if (showNotificationCallback) {
            showNotificationCallback(notification);
          }
        });
        
        set({ socket: socketService });
      },
      
      disconnectSocket: () => {
        socketService.disconnect();
        set({ socket: null });
      },
      
      addNotification: (notification: Notification) => {
        set(state => {
          // Check if notification already exists
          const exists = state.notifications.some(n => n.id === notification.id);
          
          if (exists) return state;
          
          const updatedNotifications = [notification, ...state.notifications];
          const unreadCount = updatedNotifications.filter(n => !n.read).length;
          
          return {
            notifications: updatedNotifications,
            unreadCount
          };
        });
      }
    }),
    {
      name: 'notification-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({ 
        notifications: state.notifications,
        unreadCount: state.unreadCount
      }),
    }
  )
);