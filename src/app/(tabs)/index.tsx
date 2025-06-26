import React, { useEffect, useState, useRef } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList, 
  RefreshControl,
  ActivityIndicator,
  Animated
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';

import { PostCard } from '../../components/PostCard';
import { usePostStore } from '../../store/postStore';
import { useLocationStore } from '../../store/locationStore';
import { useUserStore } from '../../store/userStore';
import { colors } from '../../constants/colors';
import { Post } from '../../types';
import { useTranslation } from '../../i18n';

export default function HomeScreen() {
  const { getNearbyPosts, getFriendPosts } = usePostStore();
  const { currentLocation, getCurrentLocation, isLoading: isLocationLoading } = useLocationStore();
  const { currentUser, getCurrentUserProfile } = useUserStore();
  const { t } = useTranslation();
  
  const [feedPosts, setFeedPosts] = useState<Post[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [feedType, setFeedType] = useState<'nearby' | 'friends'>('nearby');
  
  // Load user profile when component mounts to get latest settings
  useEffect(() => {
    getCurrentUserProfile();
  }, []);
  
  // Get notification radius from user settings
  const notificationRadius = currentUser?.settings?.notificationRadius;
  
  // Convert km to lat/long degrees (approximate)
  const kmToLatLongDelta = (km: number) => {
    // 1 degree latitude ≈ 111.32 km
    // Use smaller factor to ensure we don't load too wide area
    const latDelta = (km * 2) / 111.32;
    
    // 1 degree longitude depends on latitude
    // Use more accurate formula: 111.32 * cos(latitude)
    const longDelta = (km * 2) / (111.32 * Math.cos((currentLocation?.latitude || 0) * Math.PI / 180));
    
    return {
      latDelta: Math.min(latDelta, 0.5), // Limit maximum delta
      longDelta: Math.min(longDelta, 0.5)
    };
  };
  
  // Animation states
  const headerTranslateY = useRef(new Animated.Value(0)).current;
  const scrollY = useRef(new Animated.Value(0)).current;
  const lastScrollY = useRef(0);
  
  useEffect(() => {
    loadFeed();
  }, [currentLocation, currentUser, feedType]);
  
  const loadFeed = async () => {
    if (feedType === 'nearby') {
      if (!currentLocation) {
        await getCurrentLocation();
        return;
      }
      
      try {
        setRefreshing(true);
        
        // Ensure we have the latest user settings
        const radius = notificationRadius || 5;
        
        // Use radius from settings to calculate region
        const { latDelta, longDelta } = kmToLatLongDelta(radius);
        
        // Ensure region is not too large
        const region = {
          latitude: currentLocation.latitude,
          longitude: currentLocation.longitude,
          latitudeDelta: latDelta,
          longitudeDelta: longDelta,
        };
        
        const nearbyPosts = await getNearbyPosts(region);
        
        // Sort posts by creation time (newest first)
        if (Array.isArray(nearbyPosts) && nearbyPosts.length > 0) {
          const sortedPosts = nearbyPosts.sort((a, b) => 
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          );
          setFeedPosts(sortedPosts);
        } else {
          setFeedPosts([]);
        }
      } catch (error) {
        console.error('Error loading nearby posts:', error);
        setFeedPosts([]);
      } finally {
        setRefreshing(false);
      }
    } else {
      if (!currentUser) return;
      
      try {
        setRefreshing(true);
        // Call API to get friend posts
        const friendPosts = await getFriendPosts();
        
        if (Array.isArray(friendPosts) && friendPosts.length > 0) {
          const sortedPosts = friendPosts.sort((a, b) => 
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          );
          setFeedPosts(sortedPosts);
        } else {
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

  const handleScroll = Animated.event(
    [{ nativeEvent: { contentOffset: { y: scrollY } } }],
    {
      useNativeDriver: false,
      listener: (event: any) => {
        const currentScrollY = event.nativeEvent.contentOffset.y;
        const diff = currentScrollY - lastScrollY.current;
        
        // Only hide/show when scrolled enough distance (avoid flickering effect)
        if (Math.abs(diff) > 10) {
          if (diff > 0 && currentScrollY > 80) {
            // Scroll down - hide header
            Animated.timing(headerTranslateY, {
              toValue: -100,
              duration: 250,
              useNativeDriver: true,
            }).start();
          } else if (diff < 0 || currentScrollY <= 0) {
            // Scroll up or back to top - show header
            Animated.timing(headerTranslateY, {
              toValue: 0,
              duration: 250,
              useNativeDriver: true,
            }).start();
          }
          lastScrollY.current = currentScrollY;
        }
      },
    }
  );
  
  const toggleFeedType = () => {
    setFeedType(feedType === 'nearby' ? 'friends' : 'nearby');
  };
  
  if (isLocationLoading && !currentLocation) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>{t('home.gettingLocation')}</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['right', 'left']}>
      <StatusBar style="dark" />
      
      {/* Animated Header */}
      <Animated.View 
        style={[
          styles.header, 
          {
            transform: [{ translateY: headerTranslateY }],
          }
        ]}
      >
        <Text style={styles.headerTitle}>{t('home.photoMap')}</Text>
        <View style={styles.feedToggle}>
          <Text 
            style={[
              styles.feedToggleText, 
              feedType === 'nearby' && styles.feedToggleActive
            ]}
            onPress={() => setFeedType('nearby')}
          >
            {t('home.nearby')}
          </Text>
          <Text 
            style={[
              styles.feedToggleText, 
              feedType === 'friends' && styles.feedToggleActive
            ]}
            onPress={() => setFeedType('friends')}
          >
            {t('home.friends')}
          </Text>
        </View>
      </Animated.View>
      
      <FlatList
        data={feedPosts}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <PostCard post={item} feedType={feedType} />}
        contentContainerStyle={styles.listContent}
        onScroll={handleScroll}
        scrollEventThrottle={16}
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
                ? t('home.noPostsNearby')
                : t('home.noPostsFromFriends')}
            </Text>
            <Text style={styles.emptySubtitle}>
              {feedType === 'nearby'
                ? t('home.beFirstToShare')
                : t('home.addFriendsToSee')}
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
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 16,
    paddingVertical: 16,
    paddingTop: 20,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.card,
    zIndex: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
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
    paddingTop: 100,
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