import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  Image, 
  TouchableOpacity, 
  FlatList,
  ScrollView
} from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { ArrowLeft, Grid, Map, UserPlus, UserMinus } from 'lucide-react-native';

import { useAuthStore } from '../../store/authStore';
import { usePostStore } from '../../store/postStore';
import { colors } from '../../constants/colors';
import { getUserProfileById, sendFriendRequest, unfriendUser } from '../../services/userService';
import { Post, User } from '../../types';
import { MapView } from '../../components/MapView';
import { PostGroupView } from '../../components/PostGroupView';

export default function UserProfileScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { user } = useAuthStore();
  const { posts } = usePostStore();
  
  const [profileUser, setProfileUser] = useState<User | null>(null);
  const [userPosts, setUserPosts] = useState<Post[]>([]);
  const [viewMode, setViewMode] = useState<'grid' | 'map'>('grid');
  const [friendStatus, setFriendStatus] = useState<'none' | 'pending' | 'accepted' | 'rejected'>('none');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedPostGroup, setSelectedPostGroup] = useState<Post[]>([]);
  
  useEffect(() => {
    const fetchProfileUser = async () => {
      // id from useLocalSearchParams can be string or string[]
      let userId: string = Array.isArray(id) ? id[0] : id as string;
      const userProfile = await getUserProfileById(userId);
      setProfileUser(userProfile);
      
      // Set friend status from user profile response
      if (userProfile?.status) {
        setFriendStatus(userProfile.status);
      }
    };
    
    fetchProfileUser();
  }, [id]);

  useEffect(() => {
    if (profileUser) {
      const filteredPosts = posts.filter(post => post.userId === profileUser.id);
      setUserPosts(filteredPosts);
    }
  }, [profileUser, posts]);
  
  const handleToggleFriend = async () => {
    if (!user || !profileUser) return;
    
    setIsLoading(true);
    
    if (friendStatus === 'accepted') {
      // Unfriend user
      const response = await unfriendUser(profileUser.id);
      if (response.success) {
        setFriendStatus('none');
      }
    } else {
      // Send friend request
      const response = await sendFriendRequest(profileUser.id);
      if (response.success) {
        setFriendStatus('pending');
      }
    }
    
    setIsLoading(false);
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
        user={profileUser || undefined}
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
  
  if (!profileUser) return null;

  return (
    <SafeAreaView style={styles.container} edges={['right', 'left']}>
      <StatusBar style="dark" />
      
      <Stack.Screen 
        options={{
          title: profileUser.fullname ?? '',
          headerLeft: () => (
            <TouchableOpacity onPress={() => router.back()}>
              <ArrowLeft size={24} color={colors.text} />
            </TouchableOpacity>
          ),
        }} 
      />
      
      <ScrollView>
        <View style={styles.profileHeader}>
          <Image 
            source={{ uri: profileUser.avatar }} 
            style={styles.profileImage} 
          />
          
          <Text style={styles.username}>{profileUser.fullname}</Text>
          {profileUser.bio && (
            <Text style={styles.bio}>{profileUser.bio}</Text>
          )}
          
          <View style={styles.statsContainer}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{userPosts.length}</Text>
              <Text style={styles.statLabel}>Posts</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{profileUser.friendCount || 0}</Text>
              <Text style={styles.statLabel}>Friends</Text>
            </View>
          </View>
          
          {user && profileUser && user.id !== profileUser.id && (
            <TouchableOpacity 
              style={[
                styles.friendButton,
                friendStatus === 'accepted' ? styles.unfriendButton : styles.addFriendButton
              ]}
              onPress={handleToggleFriend}
              disabled={isLoading || friendStatus === 'pending'}
            >
              {friendStatus === 'accepted' ? (
                <>
                  <UserMinus size={16} color="white" />
                  <Text style={styles.friendButtonText}>Remove Friend</Text>
                </>
              ) : friendStatus === 'pending' ? (
                <Text style={styles.friendButtonText}>Request Pending</Text>
              ) : (
                <>
                  <UserPlus size={16} color="white" />
                  <Text style={styles.friendButtonText}>Add Friend</Text>
                </>
              )}
            </TouchableOpacity>
          )}
        </View>
        
        <View style={styles.contentHeader}>
          <Text style={styles.contentTitle}>Photos</Text>
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
        
        {viewMode === 'grid' ? (
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
              <Text style={styles.emptyText}>
                No photos shared yet
              </Text>
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
                No photos with location shared yet
              </Text>
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
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  profileHeader: {
    alignItems: 'center',
    padding: 20,
  },
  profileImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginBottom: 16,
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
  statsContainer: {
    flexDirection: 'row',
    width: '60%',
    justifyContent: 'space-around',
    marginTop: 8,
    marginBottom: 16,
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
  friendButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    marginTop: 8,
  },
  addFriendButton: {
    backgroundColor: colors.primary,
  },
  unfriendButton: {
    backgroundColor: colors.secondary,
  },
  friendButtonText: {
    color: 'white',
    fontWeight: '600',
    marginLeft: 8,
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
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginTop: 8,
    marginBottom: 4,
  },
  emptyText: {
    fontSize: 14,
    color: colors.textLight,
    textAlign: 'center',
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