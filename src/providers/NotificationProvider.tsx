import React, { createContext, useState, useContext, useEffect } from 'react';
import { useRouter } from 'expo-router';
import { useAuthStore } from '../store/authStore';
import { useNotificationStore, setShowNotificationCallback } from '../store/notificationStore';
import { Notification, NotificationType } from '../types';
import { NotificationPopup } from '../components/NotificationPopup';

// Tạo context để truy cập provider từ bất kỳ đâu
interface NotificationContextType {
  showNotification: (notification: Notification) => void;
}

const NotificationContext = createContext<NotificationContextType>({
  showNotification: () => {},
});

export const useNotificationContext = () => useContext(NotificationContext);

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [activeNotification, setActiveNotification] = useState<Notification | null>(null);
  const router = useRouter();
  const { token, isAuthenticated } = useAuthStore();
  const { initializeSocket, disconnectSocket, markAsRead } = useNotificationStore();

  // Khởi tạo socket khi người dùng đăng nhập
  useEffect(() => {
    if (isAuthenticated && token) {
      initializeSocket(token);
      
      // Đăng ký callback để hiển thị thông báo
      setShowNotificationCallback((notification) => {
        showNotification(notification);
      });
    } else {
      disconnectSocket();
    }
    
    return () => {
      disconnectSocket();
    };
  }, [isAuthenticated, token]);

  // Hiển thị thông báo
  const showNotification = (notification: Notification) => {
    setActiveNotification(notification);
  };

  // Xử lý khi người dùng nhấp vào thông báo
  const handleNotificationPress = (notification: Notification) => {
    // Đánh dấu là đã đọc
    markAsRead(notification.id);
    
    // Điều hướng dựa trên loại thông báo
    switch (notification.type) {
      case NotificationType.FRIEND_REQUEST:
        router.push('/friends');
        break;
      case NotificationType.FRIEND_ACCEPTED:
        router.push(`/profile/${notification.senderId}`);
        break;
      case NotificationType.POST_LIKE:
      case NotificationType.POST_COMMENT:
        if (notification.postId) {
          router.push(`/post/${notification.postId}`);
        }
        break;
      case NotificationType.POST_VIRAL:
      case NotificationType.FRIEND_POST:
        if (notification.postId) {
          router.push(`/post/${notification.postId}`);
        }
        break;
    }
  };

  return (
    <NotificationContext.Provider value={{ showNotification }}>
      {children}
      
      <NotificationPopup
        notification={activeNotification}
        onPress={handleNotificationPress}
        onDismiss={() => setActiveNotification(null)}
      />
    </NotificationContext.Provider>
  );
};