import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  Image, 
  TouchableOpacity, 
  FlatList,
  ScrollView,
  Alert
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import * as ImagePicker from 'expo-image-picker';
import { Settings, LogOut, Edit2, Grid, Map, Image as ImageIcon } from 'lucide-react-native';

import { Button } from '../../components/Button';
import { useAuthStore } from '../../store/authStore';
import { usePostStore } from '../../store/postStore';
import { colors } from '../../constants/colors';
import { Post } from '../../types';
import { getCurrentUserProfile, updateUserAvatar } from '../../services/userService';

export default function ProfileScreen() {
  const router = useRouter();
  const { logout, updateProfile, token } = useAuthStore();
  const { posts } = usePostStore();

  const [user, setUser] = useState<any>(null);
  const [userPosts, setUserPosts] = useState<Post[]>([]);
  const [viewMode, setViewMode] = useState<'grid' | 'map'>('grid');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      setLoading(true);
      const profile = await getCurrentUserProfile();
      setUser(profile);
      setLoading(false);
    };
    if (token) {
      fetchProfile();
    }
  }, [token]);

  useEffect(() => {
    if (user) {
      const filteredPosts = posts.filter((post: Post) => post.userId === user.id);
      setUserPosts(filteredPosts);
    }
  }, [user, posts]);

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
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 1,
    });
  
    if (!result.canceled && user) {
      const avatarUrl = result.assets[0].uri;
  
      const res = await updateUserAvatar(avatarUrl);
  
      if (res.error) {
        Alert.alert('Error', res.error);
      } else {
        Alert.alert('Success', 'Update avatar successfully!');
        // Reload lại profile từ backend
        const profile = await getCurrentUserProfile();
        setUser(profile);
      }
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

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Text>Loading profile...</Text>
      </View>
    );
  }

  if (!user) return null;

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
      
      <ScrollView>
        <View style={styles.profileHeader}>
          <View style={styles.profileImageContainer}>
            <Image 
              source={{ uri: user.profileImage }} 
              style={styles.profileImage} 
            />
            <TouchableOpacity 
              style={styles.editProfileButton}
              onPress={handleEditProfile}
            >
              <Edit2 size={16} color="white" />
            </TouchableOpacity>
          </View>
          
          <Text style={styles.username}>{user.username}</Text>
          {user.bio ? (
            <Text style={styles.bio}>{user.bio}</Text>
          ) : (
            <TouchableOpacity>
              <Text style={styles.addBioText}>Add a bio</Text>
            </TouchableOpacity>
          )}
          
          <View style={styles.statsContainer}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{userPosts.length}</Text>
              <Text style={styles.statLabel}>Posts</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{user.friendIds?.length ?? 0}</Text>
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
    width: '60%',
    justifyContent: 'space-around',
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