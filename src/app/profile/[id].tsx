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
import { ChevronLeft, UserPlus, UserMinus } from 'lucide-react-native';

import { useAuthStore } from '../../store/authStore';
import { usePostStore } from '../../store/postStore';
import { colors } from '../../constants/colors';
import { getUserProfileById, sendFriendRequest, unfriendUser } from '../../services/userService';
import { getUserPosts } from '../../services/postService';
import { Post, User } from '../../types';
import { useTranslation } from '../../i18n';

export default function UserProfileScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { user } = useAuthStore();
  const { posts } = usePostStore();
  const { t } = useTranslation();
  
  const [profileUser, setProfileUser] = useState<User | null>(null);
  const [userPosts, setUserPosts] = useState<Post[]>([]);
  const [friendStatus, setFriendStatus] = useState<'none' | 'pending' | 'accepted' | 'rejected'>('none');
  const [isLoading, setIsLoading] = useState(false);
  
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
      
      // Load active posts for this user
      if (userProfile) {
        await loadUserPosts(userProfile.id);
      }
    };
    
    fetchProfileUser();
  }, [id]);
  
  const loadUserPosts = async (userId: string) => {
    try {
      setIsLoading(true);
      
      // For other users' profiles, only show active posts (not expired)
      // We get posts from the global posts store which only contains active posts from others
      const activeUserPosts = posts.filter(post => post.userId === userId);
      setUserPosts(activeUserPosts);
      
      setIsLoading(false);
    } catch (error) {
      console.error('Error loading posts:', error);
      setIsLoading(false);
    }
  };
  
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
  
  const renderGridItem = ({ item }: { item: Post }) => (
    <TouchableOpacity 
      style={styles.gridItem}
      onPress={() => handleViewPost(item.id)}
    >
      <Image source={{ uri: item.imageUrl }} style={styles.gridImage} />
    </TouchableOpacity>
  );
  
  if (!profileUser) return null;

  return (
    <SafeAreaView style={styles.container} edges={['right', 'left']}>
      <StatusBar style="dark" />
      
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <ChevronLeft size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.title}>{profileUser.fullname ?? ''}</Text>
        <View style={{ width: 24 }} />
      </View>
      
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
              <Text style={styles.statLabel}>{t('profile.posts')}</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{profileUser.friendCount || 0}</Text>
              <Text style={styles.statLabel}>{t('profile.friends')}</Text>
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
                  <Text style={styles.friendButtonText}>{t('profile.removeFriend')}</Text>
                </>
              ) : friendStatus === 'pending' ? (
                <Text style={styles.friendButtonText}>{t('profile.requestPending')}</Text>
              ) : (
                <>
                  <UserPlus size={16} color="white" />
                  <Text style={styles.friendButtonText}>{t('profile.addFriend')}</Text>
                </>
              )}
            </TouchableOpacity>
          )}
        </View>
        
        <View style={styles.contentHeader}>
          <Text style={styles.contentTitle}>{t('profile.photos')}</Text>
        </View>
        
        {userPosts.length > 0 ? (
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
              {t('profile.noPhotosSharedYet')}
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
  },
  profileHeader: {
    alignItems: 'center',
    padding: 20,
    marginTop: 16,
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
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    fontSize: 14,
    color: colors.textLight,
    textAlign: 'center',
  }
});