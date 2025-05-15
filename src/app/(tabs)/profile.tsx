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
import { Settings, LogOut, Edit2, Grid, Map, Image as ImageIcon } from 'lucide-react-native';
import { RefreshControl } from 'react-native';

import { Button } from '../../components/Button';
import { useAuthStore } from '../../store/authStore';
import { usePostStore } from '../../store/postStore';
import { useUserStore } from '../../store/userStore';
import { colors } from '../../constants/colors';
import { Post } from '../../types';
import { pickImage } from '../../services/cloudinaryService';

export default function ProfileScreen() {
  const router = useRouter();
  const { logout, token } = useAuthStore();
  const { posts, getUserPosts, isLoading: postsLoading } = usePostStore();
  const { currentUser, isLoading: userLoading, error, updateUserAvatar, getCurrentUserProfile } = useUserStore();

  const [viewMode, setViewMode] = useState<'grid' | 'map'>('grid');
  const [userPosts, setUserPosts] = useState<Post[]>([]);
  const [refreshing, setRefreshing] = useState(false);

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

  const renderGridItem = ({ item }: { item: Post }) => (
    <TouchableOpacity 
      style={styles.gridItem}
      onPress={() => handleViewPost(item.id)}
    >
      <Image source={{ uri: item.imageUrl }} style={styles.gridImage} />
    </TouchableOpacity>
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
    <SafeAreaView style={styles.container} edges={['right', 'left']}>
      <StatusBar style="dark" />
      
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Profile</Text>
        <View style={styles.headerActions}>
          <TouchableOpacity style={styles.headerButton}>
            <Settings size={24} color={colors.text} />
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.headerButton}
            onPress={handleLogout}
          >
            <LogOut size={24} color={colors.text} />
          </TouchableOpacity>
        </View>
      </View>
      
      <ScrollView
        refreshControl={
          <RefreshControl 
            refreshing={refreshing} 
            onRefresh={handleRefresh} 
          />
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
          <View style={styles.mapContainer}>
            <Text style={styles.mapPlaceholder}>
              Map view of your photos
            </Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
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
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.card,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
  },
  headerActions: {
    flexDirection: 'row',
  },
  headerButton: {
    marginLeft: 16,
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
});