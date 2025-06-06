import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  Image, 
  TouchableOpacity, 
  FlatList,
  ScrollView,
  Alert,
  ActivityIndicator
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Settings, LogOut, Edit2, Grid, Map, Image as ImageIcon, Folder } from 'lucide-react-native';
import { RefreshControl } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button } from '../../components/Button';
import { useAuthStore } from '../../store/authStore';
import { usePostStore } from '../../store/postStore';
import { useUserStore } from '../../store/userStore';
import { colors } from '../../constants/colors';
import { Post } from '../../types';
import { pickImage } from '../../services/cloudinaryService';
import { MapView } from '../../components/MapView';
import { PostGroupView } from '../../components/PostGroupView';
import ImageGallery from '../../components/ImageGallery';

export default function ProfileScreen() {
  const router = useRouter();
  const { logout, token } = useAuthStore();
  const { posts, getUserPosts, isLoading: postsLoading } = usePostStore();
  const { currentUser, isLoading: userLoading, error, updateUserAvatar, getCurrentUserProfile } = useUserStore();
  const insets = useSafeAreaInsets();

  const [viewMode, setViewMode] = useState<'grid' | 'map'>('grid');
  const [userPosts, setUserPosts] = useState<Post[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedPostGroup, setSelectedPostGroup] = useState<Post[]>([]);
  const [showImageGallery, setShowImageGallery] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      const profile = await getCurrentUserProfile();
      // Tải posts ngay sau khi có user profile
      if (profile) {
        await loadUserPosts();
      }
    };
    if (token) {
      fetchProfile();
    }
  }, [token]);

  useEffect(() => {
    if (currentUser) {
      // Debug: In ra toàn bộ posts để kiểm tra
      console.log('All posts in store:', posts.map(p => ({id: p.id, userId: p.userId})));
      console.log('Current user:', {id: currentUser.id, fullname: currentUser.fullname});
      
      const filteredPosts = posts.filter(post => post.userId === currentUser.id);
      console.log('Filtered posts count:', filteredPosts.length);
      setUserPosts(filteredPosts);
    }
  }, [currentUser, posts]);

  // Tải bài viết người dùng khi component mount và khi user thay đổi
  useEffect(() => {
    if (currentUser) {
      loadUserPosts();
    }
  }, [currentUser]);
  
  // Hàm tải bài viết người dùng
  const loadUserPosts = async () => {
    const result = await getUserPosts();
    console.log('User Posts API result:', result);
  };

  // Hàm refresh để kéo xuống làm mới
  const handleRefresh = async () => {
    setRefreshing(true);
    const result = await getUserPosts();
    console.log('Refreshed User Posts:', result);
    setRefreshing(false);
  };

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Logout', 
          style: 'destructive',
          onPress: () => {
            logout();
            router.replace('/login');
          }
        }
      ]
    );
  };

  const handleEditProfile = async () => {
    try {
      // Sử dụng hàm pickImage từ cloudinaryService để chọn ảnh
      const imageUri = await pickImage();
      
      if (!imageUri || !currentUser) return;
      
      // Sử dụng hàm updateUserAvatar từ userStore để tải lên Cloudinary  
      await updateUserAvatar(imageUri);
      
      if (error) {
        Alert.alert('Error', error);
      } else {
        Alert.alert('Success', 'Updated profile picture successfully!');
        // Tải lại profile từ backend
        await getCurrentUserProfile();
      }
    } catch (error) {
      Alert.alert('Error', 'An error occurred while updating the profile picture');
      console.error('Error updating avatar:', error);
    }
  };

  const handleViewPost = (postId: string) => {
    router.push(`/post/${postId}`);
  };

  const handleCloseGroup = () => {
    setSelectedPostGroup([]);
  };

  const handleSelectPostFromGroup = (post: Post) => {
    setSelectedPostGroup([]);
    handleViewPost(post.id);
  };

  const renderGridItem = ({ item }: { item: Post }) => (
    <TouchableOpacity 
      style={styles.gridItem}
      onPress={() => handleViewPost(item.id)}
    >
      <Image source={{ uri: item.imageUrl }} style={styles.gridImage} />
    </TouchableOpacity>
  );

  const renderMapView = () => (
    <View style={styles.mapViewContainer}>
      <MapView
        posts={userPosts}
        selectedPostId={undefined}
        onMarkerPress={(postOrGroup) => {
          if(Array.isArray(postOrGroup)) {
            setSelectedPostGroup(postOrGroup);
          }
          else {
            handleViewPost(postOrGroup.id);
          }
        }}
        showUserLocation={false}
        user={currentUser || undefined}
        filterByRadius={false}
      />
      
      {/* Map overlay info */}
      <View style={styles.mapOverlayInfo}>
        <Text style={styles.mapInfoText}>
          {userPosts.length} {userPosts.length === 1 ? 'post' : 'posts'} on map
        </Text>
        <Text style={styles.mapInfoSubtext}>
          Tap markers to view posts
        </Text>
      </View>
    </View>
  );

  if (userLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Text>Loading profile...</Text>
      </View>
    );
  }

  if (!currentUser) return null;

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar style="dark" />
      
      <View style={styles.header}>
        <Text style={styles.title}>Profile</Text>
        <TouchableOpacity onPress={handleLogout}>
          <LogOut size={20} color={colors.text} />
        </TouchableOpacity>
      </View>
      
      <ScrollView
        style={styles.scrollContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      >
        <View style={styles.profileHeader}>
          <View style={styles. profileImageContainer}>
            <Image 
              source={{ uri: currentUser.avatar }} 
              style={styles.profileImage} 
            />
            <TouchableOpacity 
              style={styles.editProfileButton}
              onPress={handleEditProfile}
            >
              <Edit2 size={16} color="white" />
            </TouchableOpacity>
          </View>
          
          <Text style={styles.username}>{currentUser.fullname || 'Unknown User'}</Text>
          {currentUser.bio ? (
            <Text style={styles.bio}>{currentUser.bio}</Text>
          ) : (
            <TouchableOpacity>
              <Text style={styles.addBioText}>Add a bio</Text>
            </TouchableOpacity>
          )}
          
          <View style={styles.statsContainer}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{currentUser.friendCount ?? 0}</Text>
              <Text style={styles.statLabel}>Friends</Text>
            </View>
          </View>
          
          {/* Image Gallery Button */}
          <TouchableOpacity 
            style={styles.imageGalleryButton}
            onPress={() => setShowImageGallery(true)}
          >
            <Folder size={20} color={colors.primary} />
            <Text style={styles.imageGalleryButtonText}>View All Images</Text>
          </TouchableOpacity>
        </View>
        
        <View style={styles.contentHeader}>
          <Text style={styles.contentTitle}>My Posts</Text>
          <View style={styles.viewToggle}>
            <TouchableOpacity 
              style={[
                styles.viewToggleButton,
                viewMode === 'grid' && styles.viewToggleButtonActive
              ]}
              onPress={() => setViewMode('grid')}
            >
              <Grid size={20} color={viewMode === 'grid' ? colors.primary : colors.textLight} />
            </TouchableOpacity>
            <TouchableOpacity 
              style={[
                styles.viewToggleButton,
                viewMode === 'map' && styles.viewToggleButtonActive
              ]}
              onPress={() => setViewMode('map')}
            >
              <Map size={20} color={viewMode === 'map' ? colors.primary : colors.textLight} />
            </TouchableOpacity>
          </View>
        </View>
        {postsLoading && !refreshing ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={styles.loadingText}>Loading posts...</Text>
          </View>
        ) : viewMode === 'grid' ? (
          userPosts.length > 0 ? (
            <FlatList
              data={userPosts}
              keyExtractor={(item) => item.id}
              renderItem={renderGridItem}
              numColumns={3}
              scrollEnabled={false}
              contentContainerStyle={styles.gridContainer}
            />
          ) : (
            <View style={styles.emptyContainer}>
              <ImageIcon size={40} color={colors.textLight} />
              <Text style={styles.emptyTitle}>No photos yet</Text>
              <Text style={styles.emptyText}>
                Share your first photo on the map
              </Text>
              <Button
                title="Create Post"
                onPress={() => router.push('/(tabs)/create')}
                style={styles.createButton}
                size="small"
              />
            </View>
          )
        ) : (
          /* Map View */
          userPosts.length > 0 ? (
            renderMapView()
          ) : (
            <View style={styles.emptyContainer}>
              <Map size={40} color={colors.textLight} />
              <Text style={styles.emptyTitle}>No posts to show on map</Text>
              <Text style={styles.emptyText}>
                Create posts with location to see them on the map
              </Text>
              <Button
                title="Create Post"
                onPress={() => router.push('/(tabs)/create')}
                style={styles.createButton}
                size="small"
              />
            </View>
          )
        )}
      </ScrollView>
      
      {/* PostGroupView for clusters */}
      {selectedPostGroup.length > 0 && (
        <PostGroupView
          posts={selectedPostGroup}
          onClose={handleCloseGroup}
          onSelectPost={handleSelectPostFromGroup}
        />
      )}
      
      {/* Image Gallery Modal */}
      <ImageGallery
        visible={showImageGallery}
        onClose={() => setShowImageGallery(false)}
        filterType="all"
        selectionMode={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  loadingContainer: {
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: colors.textLight,
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
  scrollContainer: {
    flex: 1,
  },
  profileHeader: {
    alignItems: 'center',
    padding: 20,
  },
  profileImageContainer: {
    position: 'relative',
    marginBottom: 16,
  },
  profileImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  editProfileButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: colors.primary,
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.card,
  },
  username: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 4,
  },
  bio: {
    fontSize: 14,
    color: colors.textLight,
    textAlign: 'center',
    marginBottom: 16,
    paddingHorizontal: 20,
  },
  addBioText: {
    fontSize: 14,
    color: colors.primary,
    marginBottom: 16,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 8,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
  },
  statLabel: {
    fontSize: 12,
    color: colors.textLight,
    marginTop: 4,
  },
  contentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  contentTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  viewToggle: {
    flexDirection: 'row',
    backgroundColor: colors.background,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  viewToggleButton: {
    padding: 8,
    width: 40,
    alignItems: 'center',
  },
  viewToggleButtonActive: {
    backgroundColor: colors.card,
  },
  gridContainer: {
    padding: 4,
  },
  gridItem: {
    flex: 1/3,
    aspectRatio: 1,
    margin: 1,
  },
  gridImage: {
    flex: 1,
    borderRadius: 4,
  },
  mapContainer: {
    height: 300,
    margin: 16,
    backgroundColor: '#e0e0e0',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  mapPlaceholder: {
    fontSize: 16,
    color: colors.textLight,
  },
  emptyContainer: {
    padding: 40,
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
    marginBottom: 16,
  },
  createButton: {
    width: 150,
  },
  // Image Gallery Button Styles
  imageGalleryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    backgroundColor: colors.card,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    marginTop: 16,
  },
  imageGalleryButtonText: {
    marginLeft: 8,
    fontSize: 16,
    fontWeight: '500',
    color: colors.primary,
  },
  // Map View Styles
  mapViewContainer: {
    height: 400,
    margin: 16,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: colors.card,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  mapOverlayInfo: {
    position: 'absolute',
    top: 12,
    left: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 3,
  },
  mapInfoText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  mapInfoSubtext: {
    fontSize: 12,
    color: colors.textLight,
    marginTop: 2,
  },
});