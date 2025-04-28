import React, { useEffect, useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity,
  ActivityIndicator,
  Dimensions
} from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Navigation, Layers, RefreshCw } from 'lucide-react-native';

import { MapView } from '../../components/MapView';
import { PostCard } from '../../components/PostCard';
import { usePostStore } from '../../store/postStore';
import { useLocationStore } from '../../store/locationStore';
import { colors } from '../../constants/colors';
import { Post } from '../../types';

export default function MapScreen() {
  const params = useLocalSearchParams();
  const { latitude: paramLat, longitude: paramLong, postId } = params;
  
  const { posts, getNearbyPosts } = usePostStore();
  const { currentLocation, getCurrentLocation, isLoading: isLocationLoading } = useLocationStore();
  
  const [nearbyPosts, setNearbyPosts] = useState<Post[]>([]);
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    loadNearbyPosts();
  }, [currentLocation]);
  
  useEffect(() => {
    if (postId && typeof postId === 'string') {
      const post = posts.find((p: any) => p.id === postId);
      if (post) {
        setSelectedPost(post ?? null);
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
    
    (async () => {
      // Ensure we pass a Region object with latitudeDelta and longitudeDelta
      const region = {
        latitude: currentLocation.latitude,
        longitude: currentLocation.longitude,
        latitudeDelta: 0.05,
        longitudeDelta: 0.05,
      };
      const postsNearby = await getNearbyPosts(region);
      setNearbyPosts(Array.isArray(postsNearby) ? postsNearby : []);
    })();
    setIsLoading(false);
  };
  
  const handleMarkerPress = (post: Post) => {
    setSelectedPost(post ?? null);
  };
  
  const handleRefresh = () => {
    loadNearbyPosts();
  };
  
  const handleGetDirections = () => {
    if (!selectedPost) return;
    
    // In a real app, you would open the native maps app with directions
    alert(`Getting directions to ${selectedPost.location.name}`);
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
      
      <View style={styles.mapContainer}>
        <MapView 
          posts={nearbyPosts}
          selectedPostId={selectedPost?.id}
          onMarkerPress={handleMarkerPress}
          showUserLocation
        />
        
        <View style={styles.mapControls}>
          <TouchableOpacity 
            style={styles.mapControlButton}
            onPress={handleRefresh}
          >
            <RefreshCw size={20} color={colors.text} />
          </TouchableOpacity>
        </View>
        
        {isLoading && (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator color={colors.primary} />
          </View>
        )}
      </View>
      
      {selectedPost ? (
        <View style={styles.postPreview}>
          <PostCard post={selectedPost} showActions={false} />
          <TouchableOpacity 
            style={styles.directionsButton}
            onPress={handleGetDirections}
          >
            <Navigation size={20} color="white" />
            <Text style={styles.directionsButtonText}>Get Directions</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.infoContainer}>
          <Layers size={24} color={colors.textLight} />
          <Text style={styles.infoText}>
            {nearbyPosts.length > 0 
              ? `${nearbyPosts.length} photos nearby` 
              : 'No photos in this area'}
          </Text>
          <Text style={styles.infoSubtext}>
            {nearbyPosts.length > 0 
              ? 'Tap on a marker to view details' 
              : 'Be the first to share a photo here!'}
          </Text>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  mapContainer: {
    flex: 1,
    position: 'relative',
  },
  mapControls: {
    position: 'absolute',
    top: 16,
    right: 16,
    zIndex: 10,
  },
  mapControlButton: {
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
    marginBottom: 8,
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
  directionsButton: {
    backgroundColor: colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginTop: 12,
  },
  directionsButtonText: {
    color: 'white',
    fontWeight: '600',
    marginLeft: 8,
  },
  infoContainer: {
    padding: 20,
    alignItems: 'center',
    backgroundColor: colors.card,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
  },
  infoText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginTop: 8,
  },
  infoSubtext: {
    fontSize: 14,
    color: colors.textLight,
    marginTop: 4,
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
});