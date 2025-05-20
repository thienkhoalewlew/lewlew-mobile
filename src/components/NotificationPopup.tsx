import React, { useEffect, useRef } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  Animated, 
  TouchableOpacity
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Notification } from '../types';
import { colors } from '../constants/colors';

interface NotificationPopupProps {
  notification: Notification | null;
  onPress: (notification: Notification) => void;
  onDismiss: () => void;
}

export const NotificationPopup: React.FC<NotificationPopupProps> = ({
  notification,
  onPress,
  onDismiss
}) => {
  const insets = useSafeAreaInsets();
  const translateY = useRef(new Animated.Value(-100)).current;
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (notification) {
      // Hiển thị thông báo
      Animated.spring(translateY, {
        toValue: 0,
        useNativeDriver: true,
        friction: 8
      }).start();

      // Đặt thời gian tự động ẩn sau 5 giây
      timeoutRef.current = setTimeout(() => {
        hideNotification();
      }, 5000);
    }

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [notification]);

  // Ẩn thông báo
  const hideNotification = () => {
    Animated.timing(translateY, {
      toValue: -100,
      duration: 200,
      useNativeDriver: true
    }).start(() => {
      onDismiss();
    });

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
  };

  // Xử lý nhấp vào thông báo
  const handlePress = () => {
    if (notification) {
      hideNotification();
      onPress(notification);
    }
  };

  if (!notification) return null;

  return (
    <Animated.View 
      style={[
        styles.container, 
        { 
          transform: [{ translateY }],
          marginTop: insets.top
        }
      ]}
    >
      <TouchableOpacity 
        style={styles.content}
        activeOpacity={0.8}
        onPress={handlePress}
      >        <View style={styles.avatarContainer}>
          <View style={styles.defaultAvatar}>
            <Text style={styles.avatarText}>
              {notification.senderId && typeof notification.senderId === 'string' 
                ? (notification.senderId.length > 0 ? notification.senderId.charAt(0).toUpperCase() : '?') 
                : '?'}
            </Text>
          </View>
        </View>
        
        <View style={styles.textContainer}>
          <Text style={styles.title}>Thông báo mới</Text>
          <Text style={styles.message} numberOfLines={2}>
            {notification.message}
          </Text>
        </View>
      </TouchableOpacity>
      
      <TouchableOpacity 
        style={styles.closeButton} 
        onPress={hideNotification}
      >
        <Text style={styles.closeText}>×</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 10,
    right: 10,
    backgroundColor: '#fff',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 12,
    zIndex: 999,
  },
  content: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarContainer: {
    marginRight: 12,
  },
  defaultAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#ddd',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#888',
  },
  textContainer: {
    flex: 1,
  },
  title: {
    fontSize: 14,
    fontWeight: 'bold',
    color: colors.primary,
    marginBottom: 2,
  },
  message: {
    fontSize: 13,
    color: '#666',
  },
  closeButton: {
    padding: 4,
  },
  closeText: {
    fontSize: 22,
    color: '#999',
    fontWeight: 'bold',
    lineHeight: 22,
  },
});