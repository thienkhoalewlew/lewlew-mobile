import React, { useEffect, useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList, 
  TouchableOpacity, 
  ActivityIndicator,
  RefreshControl,
  Image
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { useNotificationStore } from '../../store/notificationStore';
import { Notification, NotificationType } from '../../types';
import { colors } from '../../constants/colors';
import { getUserById } from '@/src/services/userService';
import { useNotificationContext } from '../../providers/NotificationProvider';

export default function NotificationsScreen() {
  const { showNotification } = useNotificationContext();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { 
    notifications, 
    isLoading, 
    fetchNotifications, 
    markAsRead, 
    markAllAsRead 
  } = useNotificationStore();
  
  const [refreshing, setRefreshing] = useState(false);
  const [userData, setUserData] = useState<Record<string, { avatar?: string, username?: string, fullname?: string }>>({});
  useEffect(() => {
    loadNotifications();
    
    // Debug: Check if we have a valid auth token
    const checkAuthToken = async () => {
      try {
        const authData = await AsyncStorage.getItem('auth-storage');
        if (authData) {
          const parsedData = JSON.parse(authData);
          console.log('Auth token exists:', !!parsedData.state?.token);
          if (parsedData.state?.token) {
            console.log('Token starts with:', parsedData.state.token.substring(0, 15));
          }
        } else {
          console.log('No auth data found in storage');
        }
      } catch (error) {
        console.error('Error checking auth token:', error);
      }
    };
    
    checkAuthToken();
  }, []);
    const loadNotifications = async () => {
    console.log('Loading notifications...');
    await fetchNotifications();
    console.log('Notifications loaded. Count:', notifications.length);
    console.log('First notification sample:', notifications.length > 0 ? JSON.stringify(notifications[0]) : 'No notifications');
    await loadUserAvatars();
  };
  
  // Tải avatars của người gửi thông báo
  const loadUserAvatars = async () => {
    try {
      if (!notifications || notifications.length === 0) return;
      
      // Lấy danh sách ID người gửi duy nhất
      const userIds = [...new Set(notifications.map(n => n.senderId))];
      
      // Sử dụng hàm getUserById từ userService để lấy thông tin người dùng
      const avatarsMap: Record<string, { avatar?: string, username?: string, fullname?: string }> = {};
      
      await Promise.all(
        userIds.map(async (userId) => {
          const user = await getUserById(userId);
          if (user) {
            avatarsMap[userId] = {
              avatar: user.avatar,
              username: user.username,
              fullname: user.fullname,
            };
          }
        })
      );
      
      console.log('Loaded avatars for users:', Object.keys(avatarsMap).length);
      setUserData(avatarsMap);
    } catch (error) {
      console.error('Error loading user avatars:', error);
    }
  };
  
  const onRefresh = async () => {
    setRefreshing(true);
    await loadNotifications();
    setRefreshing(false);
  };
  
  const handleNotificationPress = async (notification: Notification) => {
    // Đánh dấu là đã đọc nếu chưa đọc
    if (!notification.read) {
      await markAsRead(notification.id);
    }
    
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
  
  // Định dạng thời gian
  const formatTime = (date: Date) => {
    const now = new Date();
    const diffInHours = Math.abs(now.getTime() - date.getTime()) / 36e5;
    
    if (diffInHours < 24) {
      // Hiển thị giờ nếu trong vòng 24h
      return format(date, 'HH:mm', { locale: vi });
    } else if (diffInHours < 48) {
      // Hiển thị "hôm qua" nếu trong vòng 48h
      return 'Yesterday';
    } else {
      // Hiển thị ngày tháng nếu hơn 48h
      return format(date, 'dd/MM/yyyy', { locale: vi });
    }
  };
  
  const renderItem = ({ item }: { item: Notification }) => (
    <TouchableOpacity
      style={[styles.notificationItem, !item.read && styles.unreadItem]}
      onPress={() => handleNotificationPress(item)}
    >
      <View style={styles.avatarContainer}>
        {userData[item.senderId]?.avatar ? (
          <Image 
            source={{ uri: userData[item.senderId]?.avatar }} 
            style={styles.avatar} 
          />
        ) : (
          <View style={[styles.avatar, styles.defaultAvatar]}>
            <Text style={styles.avatarText}>
              {item.senderId && typeof item.senderId === 'string' && item.senderId.length > 0 
                ? item.senderId.charAt(0).toUpperCase() 
                : '?'}
            </Text>
          </View>
        )}
        
        {!item.read && <View style={styles.unreadDot} />}
      </View>
      
      <View style={styles.contentContainer}>
        <Text style={styles.message}>
          <Text style={styles.username}>
            {item.senderId && userData[item.senderId]?.username || 
            item.senderId && userData[item.senderId]?.fullname || 
            'Someone'}
          </Text>
          <Text>{' '}{item.message}</Text>
        </Text>
        <Text style={styles.time}>{formatTime(new Date(item.createdAt))}</Text>
      </View>
    </TouchableOpacity>
  );
  
  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyText}>No notification yet</Text>
    </View>
  );
  
  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Text style={styles.title}>Notification</Text>
        {notifications.length > 0 && (
          <TouchableOpacity onPress={markAllAsRead}>
            <Text style={styles.markAllText}>Mark all as read</Text>
          </TouchableOpacity>
        )}
      </View>
      
      {isLoading && !refreshing ? (
        <ActivityIndicator style={styles.loader} size="large" color={colors.primary} />
      ) : (
        
      <FlatList
          data={notifications}
          keyExtractor={item => item.id}
          renderItem={renderItem}
          ListEmptyComponent={renderEmptyState}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[colors.primary]}
            />
          }
          style={styles.list}
          contentContainerStyle={notifications.length === 0 ? { flex: 1 } : {}}
        />
      )}      
    </View>
    
  );
}

const styles = StyleSheet.create({
  username: {
    fontWeight: 'bold',
    color: '#333',
  },
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  markAllText: {
    color: colors.primary,
    fontWeight: '500',
  },
  loader: {
    flex: 1,
  },
  list: {
    flex: 1,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    color: '#888',
    fontSize: 16,
  },
  notificationItem: {
    flexDirection: 'row',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  unreadItem: {
    backgroundColor: '#f9f9ff',
  },
  avatarContainer: {
    position: 'relative',
    marginRight: 12,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
  },
  defaultAvatar: {
    backgroundColor: '#ddd',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#888',
  },
  unreadDot: {
    position: 'absolute',
    right: 0,
    top: 0,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.primary,
    borderWidth: 1,
    borderColor: '#fff',
  },
  contentContainer: {
    flex: 1,
    justifyContent: 'space-between',
  },
  message: {
    fontSize: 14,
    color: '#333',
    marginBottom: 4,
  },
  time: {
    fontSize: 12,
    color: '#999',
  },
  highlight: {
    color: colors.primary,
    fontWeight: 'bold',
  },
});