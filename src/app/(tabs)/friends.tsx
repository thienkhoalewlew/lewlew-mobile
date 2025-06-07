import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList, 
  Image, 
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Search, User as UserIcon } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useAuthStore } from '../../store/authStore';
import { colors } from '../../constants/colors';
import { getFriendsList } from '../../services/userService';
import { User } from '../../types';
import { useTranslation } from '../../i18n';

export default function FriendsScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  
  const [friendsList, setFriendsList] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  
  const loadFriends = async (pageNum = 1, shouldRefresh = false) => {
    if (isLoading || (!hasMore && !shouldRefresh)) return;
    
    try {
      setIsLoading(true);
      const limit = 10;
      const friends = await getFriendsList(pageNum, limit);
      
      if (shouldRefresh || pageNum === 1) {
        setFriendsList(friends);
      } else {
        setFriendsList(prevFriends => [...prevFriends, ...friends]);
      }

      setHasMore(friends.length === limit);
      setPage(pageNum);
    } catch (error) {
      console.error('Error loading friends:', error);
    } finally {
      setIsLoading(false);
    }
  };
  
  useEffect(() => {
    if (!user) return;
    loadFriends(1, true);
  }, [user]);
  
  const handleLoadMore = () => {
    if (!isLoading && hasMore) {
      loadFriends(page + 1);
    }
  };
  
  const handleRefresh = () => {
    loadFriends(1, true);
  };
  
  const handleViewProfile = (userId: string) => {
    router.push(`/profile/${userId}`);
  };

  const renderUserItem = ({ item }: { item: User }) => (
    <TouchableOpacity 
      style={styles.userItem}
      onPress={() => handleViewProfile(item.id)}
    >
      <Image source={{ uri: item.avatar }} style={styles.userAvatar} />
      <View style={styles.userInfo}>
        <Text style={styles.username}>{item.fullname}</Text>
        {item.bio ? (
          <Text style={styles.userBio} numberOfLines={1}>{item.bio}</Text>
        ) : (
          <Text style={styles.userPhone} numberOfLines={1}>{item.phoneNumber}</Text>
        )}
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar style="dark" />
      
      <View style={styles.header}>
        <Text style={styles.title}>{t('friends.friends')}</Text>
        <TouchableOpacity 
          style={styles.searchButton}
          onPress={() => router.push('/friends/search')}
        >
          <Search size={20} color={colors.text} />
        </TouchableOpacity>
      </View>

      <FlatList
        data={friendsList}
        renderItem={renderUserItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.5}
        refreshControl={
          <RefreshControl refreshing={isLoading} onRefresh={handleRefresh} />
        }
        ListEmptyComponent={
          !isLoading ? (
            <View style={styles.emptyContainer}>
              <UserIcon size={40} color={colors.textLight} />
              <Text style={styles.emptyTitle}>{t('friends.noFriends')}</Text>
              <Text style={styles.emptyText}>
                {t('friends.searchAndConnect')}
              </Text>
            </View>
          ) : null
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
  },
  searchButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: colors.card,
  },
  listContent: {
    padding: 16,
  },
  userItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
  },
  userAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  userInfo: {
    flex: 1,
    marginLeft: 12,
  },
  username: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  userPhone: {
    fontSize: 14,
    color: colors.textLight,
    marginTop: 2,
  },
  userBio: {
    fontSize: 14,
    color: colors.textLight,
    marginTop: 2,
  },
  emptyContainer: {
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginTop: 12,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: colors.textLight,
    textAlign: 'center',
  },
});