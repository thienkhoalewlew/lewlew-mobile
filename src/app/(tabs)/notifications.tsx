import React, { useEffect, useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList, 
  TouchableOpacity, 
  ActivityIndicator,
  RefreshControl,
  Image,
  Alert
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
import { isPostExpired } from '../../utils/timeUtils';
import { useTranslation } from '../../i18n';
import { parseNotificationMessage } from '../../utils/notificationParser';

export default function NotificationsScreen() {
  const { showNotification } = useNotificationContext();
  const router = useRouter();
  const insets = useSafeAreaInsets();  const { t, language } = useTranslation();
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

  // Effect để load user avatars khi notifications thay đổi
  useEffect(() => {
    if (notifications && notifications.length > 0) {
      loadUserAvatars(notifications);
    }  }, [notifications]);
  
  const loadNotifications = async () => {
    console.log('Loading notifications...');
    await fetchNotifications();
    // Sau khi fetch xong, lấy notifications mới nhất từ store để load avatars
    // Không dùng state notifications vì có thể chưa được update
  };
  
  // Tải avatars của người gửi thông báo
  const loadUserAvatars = async (notificationsList?: Notification[]) => {
    try {
      // Sử dụng notifications từ parameter hoặc từ store
      const notificationsToUse = notificationsList || notifications;
      
      if (!notificationsToUse || notificationsToUse.length === 0) return;
      
      // Lấy danh sách ID người gửi duy nhất
      const userIds = [...new Set(notificationsToUse.map(n => n.senderId))];
      
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
    }  };
  
  const onRefresh = async () => {
    setRefreshing(true);
    await fetchNotifications();
    // Không cần gọi loadUserAvatars ở đây vì useEffect sẽ tự động gọi khi notifications thay đổi
    setRefreshing(false);
  };
    const handleNotificationPress = async (notification: Notification) => {
    console.log('Notification pressed:', notification.id, 'Read status:', notification.read);
    
    // Đánh dấu là đã đọc nếu chưa đọc
    if (!notification.read) {
      console.log('Marking notification as read...');
      await markAsRead(notification.id);
    }
    
    try {
      // Kiểm tra và đảm bảo postId là một chuỗi hợp lệ (không phải đối tượng)
      let validPostId = notification.postId;
      if (notification.postId) {
        // Kiểm tra xem postId có phải là một đối tượng không
        if (typeof notification.postId === 'object') {
          console.error('Invalid postId format (object):', notification.postId);
          // Cố gắng lấy ID từ đối tượng nếu có thể
          const postIdObj = notification.postId as any;
          validPostId = postIdObj.id || postIdObj._id || '';
          console.log('Converted postId to string:', validPostId);
        } else if (typeof notification.postId === 'string' && notification.postId.includes('[object Object]')) {
          console.error('PostId contains [object Object]:', notification.postId);
          Alert.alert(t('notifications.notification'), t('notifications.invalidPostId'));
          return;
        } else {
          // Đảm bảo validPostId là chuỗi
          validPostId = String(notification.postId);
        }
      }
      
      // Đảm bảo commentId cũng là một chuỗi hợp lệ
      let validCommentId = notification.commentId;
      if (typeof notification.commentId === 'object') {
        const commentIdObj = notification.commentId as any;
        validCommentId = commentIdObj.id || commentIdObj._id || '';
      } else if (notification.commentId) {
        validCommentId = String(notification.commentId);
      }
      
      // Kiểm tra thời gian tạo thông báo (kiểm tra bài viết quá 24h)
      if (notification.createdAt && isPostExpired(notification.createdAt) && 
          (notification.type === NotificationType.POST_LIKE || 
           notification.type === NotificationType.POST_COMMENT || 
           notification.type === NotificationType.POST_VIRAL || 
           notification.type === NotificationType.FRIEND_POST)) {
            Alert.alert(t('notifications.notification'), t('notifications.postExpired'));
        return;
      }
      
      // Điều hướng dựa trên loại thông báo
      switch (notification.type) {
        case NotificationType.FRIEND_REQUEST:
          // Mở profile người gửi lời mời kết bạn thay vì chuyển đến trang friends
          router.push({
            pathname: '/profile/[id]',
            params: { id: notification.senderId }
          });
          break;
        case NotificationType.FRIEND_ACCEPTED:
          router.push({
            pathname: '/profile/[id]',
            params: { id: notification.senderId }
          });
          break;
          case NotificationType.POST_LIKE:
          if (validPostId) {
            console.log('Navigating to post with ID:', validPostId);
            router.push({
              pathname: '/post/[id]',
              params: { id: validPostId }
            });
          } else {
            Alert.alert(t('notifications.notification'), t('notifications.cannotOpenPost'));
          }
          break;
          case NotificationType.POST_COMMENT:
          if (validPostId) {
            console.log('Navigating to post with ID:', validPostId, 'and comment:', validCommentId);
            // Chuyển đến bài đăng và truyền commentId để có thể scroll đến comment đó
            router.push({
              pathname: '/post/[id]',
              params: { 
                id: validPostId,
                highlightCommentId: validCommentId 
              }
            });
          } else {
            Alert.alert(t('notifications.notification'), t('notifications.cannotOpenPost'));
          }
          break;
        case NotificationType.COMMENT_LIKE:
          if (validPostId) {
            console.log('Navigating to post with ID:', validPostId, 'for comment like');
            // Mở bài viết khi ai đó like comment
            router.push({
              pathname: '/post/[id]',
              params: { 
                id: validPostId,
                highlightCommentId: validCommentId 
              }
            });
          } else {
            Alert.alert(t('notifications.notification'), t('notifications.cannotOpenPost'));
          }
          break;
          case NotificationType.POST_VIRAL:
        case NotificationType.FRIEND_POST:
          if (validPostId) {
            console.log('Navigating to post with ID:', validPostId);
            router.push({
              pathname: '/post/[id]',
              params: { id: validPostId }
            });
          } else {
            Alert.alert(t('notifications.notification'), t('notifications.cannotOpenPost'));
          }
          break;
        case NotificationType.SYSTEM_NOTIFICATION:
          // For system notifications, try to navigate to the post if available
          if (validPostId) {
            console.log('Navigating to post from system notification with ID:', validPostId);
            router.push({
              pathname: '/post/[id]',
              params: { id: validPostId }
            });
          } else {
            // If no post ID, just show an info message
            Alert.alert(t('notifications.system'), t('notifications.newNotification'));
          }
          break;
      }
    } catch (error) {
      console.error('Error navigating from notification:', error);
      Alert.alert(t('notifications.notification'), t('notifications.errorOpeningNotification'));
    }
  };
    // Định dạng thời gian
  const formatTime = (date: Date) => {
    const now = new Date();
    const diffInHours = Math.abs(now.getTime() - date.getTime()) / 36e5;
    
    if (diffInHours < 24) {
      // Hiển thị giờ nếu trong vòng 24h
      return format(date, 'HH:mm', { locale: language === 'vi' ? vi : undefined });
    } else if (diffInHours < 48) {
      // Show "yesterday" if within 48h
      return t('notifications.yesterday');
    } else {
      // Hiển thị ngày tháng nếu hơn 48h
      return format(date, 'dd/MM/yyyy', { locale: language === 'vi' ? vi : undefined });
    }
  };
    const renderItem = ({ item }: { item: Notification }) => {
    // Check if this is a system notification
    const isSystemNotification = !item.senderId || item.senderId === '' || item.senderId === 'system';
    
    return (
      <TouchableOpacity
        style={[styles.notificationItem, !item.read && styles.unreadItem]}
        onPress={() => handleNotificationPress(item)}
      >
        <View style={styles.avatarContainer}>
          {isSystemNotification ? (
            // System notification icon
            <View style={[styles.avatar, styles.systemAvatar]}>
              <Text style={styles.systemAvatarText}>⚙️</Text>
            </View>
          ) : userData[item.senderId]?.avatar ? (
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
              {isSystemNotification 
                ? t('notifications.system')
                : (userData[item.senderId]?.username || 
                   userData[item.senderId]?.fullname || 
                   t('notifications.someone'))
              }
            </Text>
            <Text>{' '}{parseNotificationMessage(item.message, t)}</Text>
          </Text>
          <Text style={styles.time}>{formatTime(new Date(item.createdAt))}</Text>
        </View>
      </TouchableOpacity>
    );
  };
    const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyText}>{t('notifications.noNotifications')}</Text>
    </View>
  );
  
  return (
  <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Text style={styles.title}>{t('notifications.notifications')}</Text>
        {notifications.length > 0 && (
          <TouchableOpacity onPress={async () => {
            console.log('Mark all as read button pressed');
            await markAllAsRead();
          }}>
            <Text style={styles.markAllText}>{t('notifications.markAllAsRead')}</Text>
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
  systemAvatar: {
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  systemAvatarText: {
    fontSize: 20,
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