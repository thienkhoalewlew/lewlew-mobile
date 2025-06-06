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
          console.log('NotificationStore: Marking notification as read:', notificationId);
          const success = await notificationService.markNotificationAsRead(notificationId);
          
          if (success) {
            console.log('NotificationStore: Successfully marked notification as read');
            // Update local state
            set(state => {
              const updatedNotifications = state.notifications.map(notification =>
                notification.id === notificationId 
                  ? { ...notification, read: true }
                  : notification
              );
              const newUnreadCount = updatedNotifications.filter(n => !n.read).length;
              
              console.log('NotificationStore: Updated unread count:', newUnreadCount);
              
              return {
                notifications: updatedNotifications,
                unreadCount: newUnreadCount
              };
            });
          } else {
            console.error('NotificationStore: Failed to mark notification as read');
          }
        } catch (error) {
          console.error('NotificationStore: Error marking notification as read:', error);
        }
      },      markAllAsRead: async () => {
        try {
          console.log('NotificationStore: Marking all notifications as read...');
          const success = await notificationService.markAllNotificationsAsRead();
          console.log('NotificationStore: markAllNotificationsAsRead returned:', success);
          
          if (success) {
            // Update local state
            set(state => ({
              notifications: state.notifications.map(n => ({ ...n, read: true })),
              unreadCount: 0
            }));
            console.log('NotificationStore: All notifications marked as read successfully, local state updated');
          } else {
            console.error('NotificationStore: Failed to mark all notifications as read - API call failed');
          }
        } catch (error) {
          console.error('NotificationStore: Error marking all notifications as read:', error);
        }
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