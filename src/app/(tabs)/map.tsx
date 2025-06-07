import React, { useEffect, useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { RefreshCw } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { MapView } from '../../components/MapView';
import { PostCard } from '../../components/PostCard';
import { PostGroupView } from '../../components/PostGroupView';
import { usePostStore } from '../../store/postStore';
import { useLocationStore } from '../../store/locationStore';
import { useAuthStore } from '../../store/authStore';
import { useTranslation } from '../../i18n';
import { colors } from '../../constants/colors';
import { Post } from '../../types';

export default function MapScreen() {
  const params = useLocalSearchParams();
  const router = useRouter();
  const { latitude: paramLat, longitude: paramLong, postId } = params;
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();const { posts, getNearbyPosts } = usePostStore();
  const { currentLocation, getCurrentLocation, isLoading: isLocationLoading } = useLocationStore();
  const { user } = useAuthStore();
  const [nearbyPosts, setNearbyPosts] = useState<Post[]>([]);
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [selectedPostGroup, setSelectedPostGroup] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [shouldDrawRoute, setShouldDrawRoute] = useState(false);
  
  useEffect(() => {
    loadNearbyPosts();
  }, [currentLocation]);
  
  useEffect(() => {
    if (postId && typeof postId === 'string') {
      const post = posts.find((p: any) => p.id === postId);
      if (post) {
        setSelectedPost(post);
        setShouldDrawRoute(true);
      }
    }
  }, [postId, posts]);
  
  const loadNearbyPosts = async () => {
    setIsLoading(true);
    
    if (!currentLocation) {
      await getCurrentLocation();
      setIsLoading(false);
      return;
    }
    
    try {
      const region = {
        latitude: currentLocation.latitude,
        longitude: currentLocation.longitude,
        latitudeDelta: 0.05,
        longitudeDelta: 0.05,
      };
      const postsNearby = await getNearbyPosts(region);
      setNearbyPosts(Array.isArray(postsNearby) ? postsNearby : []);
    } catch (error) {
      console.error('Error loading nearby posts:', error);
      setNearbyPosts([]);
    } finally {
      setIsLoading(false);
    }
  };
  const handleMarkerPress = (postOrGroup: Post | Post[]) => {
    if (Array.isArray(postOrGroup)) {
      setSelectedPostGroup(postOrGroup);
      setSelectedPost(null);
      setShouldDrawRoute(false);
    } else {
      router.push(`/post/${postOrGroup.id}`);
    }
  };
  // Long press marker - navigation functionality removed
  const handleMarkerLongPress = (post: Post) => {
    // Navigation functionality has been removed
    // This function is kept for compatibility but does nothing
  };
  const handleCloseGroup = () => {
    setSelectedPostGroup([]);
  };
  
  const handleSelectPostFromGroup = (post: Post) => {
    router.push(`/post/${post.id}`);
    setSelectedPostGroup([]);
  };

  const handleRefresh = () => {
    loadNearbyPosts();
  };
    if (isLocationLoading && !currentLocation) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>{t('map.gettingLocation')}</Text>
      </View>
    );
  }
  return (
    <View style={[
      styles.container,
      { paddingTop: insets.top }
    ]}>
      <View style={styles.header}>
        <Text style={styles.title}>{t('map.map')}</Text>
      </View>
      
      {/* Refresh button */}
      {!isLoading && (
        <TouchableOpacity 
          style={styles.refreshButton} 
          onPress={loadNearbyPosts}
        >
          <RefreshCw size={20} color={colors.text} />
        </TouchableOpacity>
      )}
      
      {/* Map view */}
      <View style={styles.mapContainer}>
        {nearbyPosts.length > 0 ? (
          <MapView
            posts={nearbyPosts}
            selectedPostId={selectedPost?.id}
            onMarkerPress={handleMarkerPress}
            showUserLocation={true}
            user={user || undefined}
            filterByRadius={true}
            shouldDrawRoute={shouldDrawRoute}
            onRouteDrawn={() => setShouldDrawRoute(false)}
          />
        ) : (
          <View style={styles.emptyContainer}>
            {isLoading ? (
              <ActivityIndicator size="large" color={colors.primary} />
            ) : (
              <>
                <Text style={styles.emptyText}>{t('map.noPhotosFound')}</Text>
                <Text style={styles.emptySubText}>
                  {t('map.sharePhotosPrompt')}
                </Text>
              </>
            )}
          </View>
        )}
      </View>
      {/* Selected post group view */}
      {selectedPostGroup.length > 0 && (
        <PostGroupView
          posts={selectedPostGroup}
          onSelectPost={handleSelectPostFromGroup}
          onClose={handleCloseGroup}
        />
      )}
      
      <StatusBar style="dark" />
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
    borderBottomColor: '#f0f0f0',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  mapContainer: {
    flex: 1,
    position: 'relative',
  },
  refreshButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    backgroundColor: 'white',
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    zIndex: 10,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: colors.text,
  },
  emptySubText: {
    fontSize: 14,
    color: colors.textLight,
    textAlign: 'center',
    marginTop: 4,
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  postPreview: {
    backgroundColor: colors.card,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
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
  closeButton: {
  alignSelf: 'flex-end',
  paddingVertical: 4,
  paddingHorizontal: 12,
  backgroundColor: '#eee',
  borderRadius: 16,
  marginBottom: 8,
},
closeButtonText: {
  color: colors.text,
  fontWeight: 'bold',
  fontSize: 14,
},
});