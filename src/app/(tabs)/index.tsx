import React, { useEffect, useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList, 
  RefreshControl,
  ActivityIndicator
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';

import { PostCard } from '../../components/PostCard';
import { usePostStore } from '../../store/postStore';
import { useLocationStore } from '../../store/locationStore';
import { useAuthStore } from '../../store/authStore';
import { colors } from '../../constants/colors';
import { Post } from '../../types';

export default function HomeScreen() {
  const { getNearbyPosts, getFriendPosts } = usePostStore();
  const { currentLocation, getCurrentLocation, isLoading: isLocationLoading } = useLocationStore();
  const { user } = useAuthStore();
  
  const [feedPosts, setFeedPosts] = useState<Post[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [feedType, setFeedType] = useState<'nearby' | 'friends'>('nearby');
  
  useEffect(() => {
    loadFeed();
  }, [currentLocation, user, feedType]);
  
  const loadFeed = async () => {
    if (feedType === 'nearby') {
      if (!currentLocation) {
        await getCurrentLocation();
        return;
      }
      
      try {
        setRefreshing(true);
        // Ensure we pass a Region object with latitudeDelta and longitudeDelta
        const region = {
          latitude: currentLocation.latitude,
          longitude: currentLocation.longitude,
          latitudeDelta: 0.05,
          longitudeDelta: 0.05,
        };
        const nearbyPosts = await getNearbyPosts(region);
        
        // Sắp xếp bài viết theo thời gian tạo (mới nhất lên đầu)
        if (Array.isArray(nearbyPosts) && nearbyPosts.length > 0) {
          const sortedPosts = nearbyPosts.sort((a, b) => 
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          );
          setFeedPosts(sortedPosts);
          console.log(`Loaded ${sortedPosts.length} nearby posts`);
        } else {
          console.log('No nearby posts found');
          setFeedPosts([]);
        }
      } catch (error) {
        console.error('Error loading nearby posts:', error);
        setFeedPosts([]);
      } finally {
        setRefreshing(false);
      }
    } else {
      if (!user) return;
      
      try {
        setRefreshing(true);
        // Gọi API để lấy bài viết của bạn bè
        const friendPosts = await getFriendPosts();
        
        if (Array.isArray(friendPosts) && friendPosts.length > 0) {
          const sortedPosts = friendPosts.sort((a, b) => 
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          );
          setFeedPosts(sortedPosts);
          console.log(`Loaded ${sortedPosts.length} friend posts`);
        } else {
          console.log('No friend posts found');
          setFeedPosts([]);
        }
      } catch (error) {
        console.error('Error loading friend posts:', error);
        setFeedPosts([]);
      } finally {
        setRefreshing(false);
      }
    }
  };
  
  const handleRefresh = async () => {
    setRefreshing(true);
    await loadFeed();
    setRefreshing(false);
  };
  
  const toggleFeedType = () => {
    setFeedType(feedType === 'nearby' ? 'friends' : 'nearby');
  };
  
  if (isLocationLoading && !currentLocation) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Getting your location...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['right', 'left']}>
      <StatusBar style="dark" />
      
      <View style={styles.header}>
        <Text style={styles.headerTitle}>PhotoMap</Text>
        <View style={styles.feedToggle}>
          <Text 
            style={[
              styles.feedToggleText, 
              feedType === 'nearby' && styles.feedToggleActive
            ]}
            onPress={() => setFeedType('nearby')}
          >
            Nearby
          </Text>
          <Text 
            style={[
              styles.feedToggleText, 
              feedType === 'friends' && styles.feedToggleActive
            ]}
            onPress={() => setFeedType('friends')}
          >
            Friends
          </Text>
        </View>
      </View>
      
      <FlatList
        data={feedPosts}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <PostCard post={item} />}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={[colors.primary]}
            tintColor={colors.primary}
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyTitle}>
              {feedType === 'nearby' 
                ? 'No posts nearby' 
                : 'No posts from friends'}
            </Text>
            <Text style={styles.emptySubtitle}>
              {feedType === 'nearby'
                ? 'Be the first to share a photo in this area!'
                : 'Add friends to see their posts here'}
            </Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.card,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: colors.primary,
    textAlign: 'center',
    marginBottom: 8,
  },
  feedToggle: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 20,
  },
  feedToggleText: {
    fontSize: 14,
    color: colors.textLight,
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  feedToggleActive: {
    color: colors.primary,
    fontWeight: '600',
    borderBottomWidth: 2,
    borderBottomColor: colors.primary,
  },
  listContent: {
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: colors.textLight,
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
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: colors.textLight,
    textAlign: 'center',
  },
});