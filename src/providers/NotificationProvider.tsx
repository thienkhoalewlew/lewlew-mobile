import React, { createContext, useState, useContext, useEffect } from 'react';
import { useRouter } from 'expo-router';
import { useAuthStore } from '../store/authStore';
import { useNotificationStore, setShowNotificationCallback } from '../store/notificationStore';
import { Notification } from '../types';
import { NotificationPopup } from '../components/NotificationPopup';
import { getUserById } from '../services/userService';

// Tạo context để truy cập provider từ bất kỳ đâu
interface NotificationContextType {
  showNotification: (notification: Notification) => void;
}

const NotificationContext = createContext<NotificationContextType>({
  showNotification: () => {},
});

export const useNotificationContext = () => useContext(NotificationContext);

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {  const [activeNotification, setActiveNotification] = useState<Notification | null>(null);
  const [senderName, setSenderName] = useState<string>('');
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
  const showNotification = async (notification: Notification) => {
    setActiveNotification(notification);
    
    // Fetch sender information
    try {
      const user = await getUserById(notification.senderId);
      if (user) {
        setSenderName(user.username || user.fullname || 'Someone');
      } else {
        setSenderName('Someone');
      }
    } catch (error) {
      console.error('Error fetching sender information:', error);
      setSenderName('Someone');
    }
  };
  // Xử lý khi người dùng nhấp vào thông báo
  const handleNotificationPress = (notification: Notification) => {
    // Đánh dấu là đã đọc
    markAsRead(notification.id);
    
    // Điều hướng đến tab notifications
    router.push('/(tabs)/notifications');
  };

  return (
    <NotificationContext.Provider value={{ showNotification }}>
      {children}
      <NotificationPopup
        notification={activeNotification}
        onPress={handleNotificationPress}
        onDismiss={() => setActiveNotification(null)}
        senderName={senderName}
      />
    </NotificationContext.Provider>
  );
};