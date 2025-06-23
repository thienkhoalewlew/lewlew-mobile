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
  ActivityIndicator,
  TextInput,
  Modal
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Settings, LogOut, Edit2, Grid, Image as ImageIcon, Folder, X } from 'lucide-react-native';
import { RefreshControl } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button } from '../../components/Button';
import { useAuthStore } from '../../store/authStore';
import { usePostStore } from '../../store/postStore';
import { useUserStore } from '../../store/userStore';
import { colors } from '../../constants/colors';
import { Post } from '../../types';
import { pickImage } from '../../services/cloudinaryService';
import { useTranslation } from '../../i18n';

export default function ProfileScreen() {
  const router = useRouter();
  const { logout, token } = useAuthStore();
  const { posts, getUserPosts, isLoading: postsLoading } = usePostStore();
  const { currentUser, isLoading: userLoading, error, updateUserAvatar, getCurrentUserProfile, updateBio } = useUserStore();
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();

  const [userPosts, setUserPosts] = useState<Post[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [showBioModal, setShowBioModal] = useState(false);
  const [newBio, setNewBio] = useState('');

  useEffect(() => {
    const fetchProfile = async () => {
      console.log('Fetching profile...');
      const profile = await getCurrentUserProfile();
      console.log('Fetched profile:', profile);
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
  
  const loadUserPosts = async () => {
    console.log('Loading user posts...');
    try {
      setRefreshing(true);
      const result = await getUserPosts();
      if (Array.isArray(result)) {
        setUserPosts(result);
      }
    } catch (error) {
      console.error('Error loading posts:', error);
    } finally {
      setRefreshing(false);
    }
  };

  const handleRefresh = async () => {
    console.log('Refreshing profile...');
    await loadUserPosts();
  };

  const handleLogout = () => {
    Alert.alert(
      t('profile.logoutTitle'),
      t('profile.logoutMessage'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        { 
          text: t('auth.logout'), 
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
        Alert.alert(t('common.error'), error);
      } else {
        Alert.alert(t('common.success'), t('profile.updateAvatarSuccess'));
        // Tải lại profile từ backend
        await getCurrentUserProfile();
      }
    } catch (error) {
      Alert.alert(t('common.error'), t('profile.updateAvatarError'));
      console.error('Error updating avatar:', error);
    }
  };

  const handleViewPost = (postId: string) => {
    router.push(`/post/${postId}`);
  };

  const handleUpdateBio = async () => {
    try {
      await updateBio(newBio.trim());
      setShowBioModal(false);
      Alert.alert(t('common.success'), t('profile.bioUpdateSuccess'));
    } catch (error) {
      Alert.alert(t('common.error'), error instanceof Error ? error.message : t('profile.bioUpdateError'));
    }
  };

  if (userLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Text>{t('profile.loadingProfile')}</Text>
      </View>
    );
  }

  if (!currentUser) return null;

  // Post đã hết hạn là post đã đăng lâu hơn 24h
  const expiredPosts = userPosts.filter(post => {
    const createdDate = new Date(post.createdAt);
    const now = new Date();
    const timeDifference = now.getTime() - createdDate.getTime();
    const hoursDifference = timeDifference / (1000 * 60 * 60);
    return hoursDifference >= 24;
  });
  const activePosts = userPosts.filter(post => {
    const createdDate = new Date(post.createdAt);
    const now = new Date();
    const timeDifference = now.getTime() - createdDate.getTime();
    const hoursDifference = timeDifference / (1000 * 60 * 60);
    return hoursDifference < 24;
  });

  const renderGridItem = ({ item }: { item: Post }) => {
    const createdDate = new Date(item.createdAt);
    const now = new Date();
    const timeDifference = now.getTime() - createdDate.getTime();
    const hoursDifference = timeDifference / (1000 * 60 * 60);
    const isExpired = hoursDifference >= 24;
    
    return (
      <TouchableOpacity 
        style={styles.gridItem}
        onPress={() => handleViewPost(item.id)}
      >
        <Image source={{ uri: item.image }} style={[styles.gridImage, isExpired && styles.expiredImage]} />
        {isExpired && (
          <View style={styles.expiredBadge}>
            <Text style={styles.expiredText}>{t('profile.expired')}</Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar style="dark" />
      
      <View style={styles.header}>
        <Text style={styles.title}>{t('navigation.profile')}</Text>
        <View style={styles.headerButtons}>
          <TouchableOpacity 
            style={styles.headerButton} 
            onPress={() => router.push('/settings')}
          >
            <Settings size={20} color={colors.text} />
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.headerButton}
            onPress={handleLogout}
          >
            <LogOut size={20} color={colors.text} />
          </TouchableOpacity>
        </View>
      </View>
      
      <ScrollView
        style={styles.scrollContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      >
        <View style={styles.profileHeader}>
          <View style={styles.profileImageContainer}>
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
          
          <Text style={styles.username}>{currentUser.fullname || t('profile.unknownUser')}</Text>
          <TouchableOpacity onPress={() => router.push('/profile/edit')}>
            <Text style={styles.userHandle}>@{currentUser.username}</Text>
          </TouchableOpacity>
          {currentUser.bio ? (
            <TouchableOpacity 
              onPress={() => {
                setNewBio(currentUser.bio || '');
                setShowBioModal(true);
              }}
            >
              <Text style={styles.bio}>{currentUser.bio}</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity onPress={() => {
              setNewBio('');
              setShowBioModal(true);
            }}>
              <Text style={styles.addBioText}>{t('profile.addBio')}</Text>
            </TouchableOpacity>
          )}
          
          {/* Bio Edit Modal */}
          <Modal
            visible={showBioModal}
            transparent
            animationType="fade"
            onRequestClose={() => setShowBioModal(false)}
          >
            <View style={styles.modalOverlay}>
              <View style={styles.modalContent}>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>{t('profile.editBio')}</Text>
                  <TouchableOpacity 
                    onPress={() => setShowBioModal(false)}
                    style={styles.closeButton}
                  >
                    <X size={20} color={colors.text} />
                  </TouchableOpacity>
                </View>
                
                <TextInput
                  value={newBio}
                  onChangeText={setNewBio}
                  placeholder={t('profile.bioPlaceholder')}
                  multiline
                  maxLength={200}
                  style={styles.bioInput}
                />
                
                <Text style={styles.charCount}>
                  {newBio.length}/200 {t('profile.charactersCount')}
                </Text>

                <View style={styles.modalButtons}>
                  <Button
                    title={t('common.cancel')}
                    onPress={() => setShowBioModal(false)}
                    style={styles.cancelButton}
                    textStyle={styles.cancelButtonText}
                  />
                  <Button
                    title={t('common.save')}
                    onPress={handleUpdateBio}
                    style={styles.saveButton}
                  />
                </View>
              </View>
            </View>
          </Modal>
          
          <View style={styles.statsContainer}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{currentUser.friendCount ?? 0}</Text>
              <Text style={styles.statLabel}>{t('profile.friends')}</Text>
            </View>
            <View style={[styles.statItem, { marginLeft: 20 }]}>
              <Text style={styles.statValue}>{activePosts.length}</Text>
              <Text style={styles.statLabel}>{t('profile.activePosts')}</Text>
            </View>
            <View style={[styles.statItem, { marginLeft: 20 }]}>
              <Text style={styles.statValue}>{expiredPosts.length}</Text>
              <Text style={styles.statLabel}>{t('profile.expired')}</Text>
            </View>
          </View>
        </View>
        
        <View style={styles.contentHeader}>
          <Text style={styles.contentTitle}>{t('profile.myPosts')}</Text>
        </View>
        {postsLoading && !refreshing ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={styles.loadingText}>{t('profile.loadingPosts')}</Text>
          </View>
        ) : userPosts.length > 0 ? (
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
            <Text style={styles.emptyTitle}>{t('profile.noPhotosYet')}</Text>
            <Text style={styles.emptyText}>
              {t('profile.shareFirstPhoto')}
            </Text>
            <Button
              title={t('profile.createPost')}
              onPress={() => router.push('/(tabs)/create')}
              style={styles.createButton}
              size="small"
            />
          </View>
        )}
      </ScrollView>
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
  userHandle: {
    fontSize: 14,
    color: colors.textLight,
    marginBottom: 12,
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
  gridContainer: {
    padding: 4,
  },
  gridItem: {
    flex: 1/3,
    aspectRatio: 1,
    margin: 1,
    position: 'relative',
  },
  gridImage: {
    flex: 1,
    borderRadius: 4,
  },
  expiredImage: {
    opacity: 0.7,
  },
  expiredBadge: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  expiredText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '500',
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
  headerButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  headerButton: {
    padding: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: colors.background,
    borderRadius: 12,
    padding: 20,
    width: '90%',
    maxWidth: 400,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
  },
  closeButton: {
    padding: 4,
  },
  bioInput: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    padding: 12,
    minHeight: 100,
    textAlignVertical: 'top',
    fontSize: 16,
  },
  charCount: {
    fontSize: 12,
    color: colors.textLight,
    alignSelf: 'flex-end',
    marginTop: 8,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 20,
    gap: 12,
  },
  cancelButton: {
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cancelButtonText: {
    color: colors.text,
  },
  saveButton: {
    minWidth: 100,
  },
});