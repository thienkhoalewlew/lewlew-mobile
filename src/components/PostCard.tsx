import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  Image, 
  TouchableOpacity,
  Alert,
  ActionSheetIOS,
  Platform
} from 'react-native';
import { useRouter } from 'expo-router';
import { Heart, Navigation, MoreHorizontal, MessageCircle } from 'lucide-react-native';
import { Post } from '../types';
import { colors } from '../constants/colors';
import { useAuthStore } from '../store/authStore';
import { usePostStore } from '../store/postStore';
import { ensureStringId } from '../services/postService';
import { useCommentStore } from '../store/commentStore';
import { useLocationStore } from '../store/locationStore';
import { useTranslation } from '../i18n';
import { ReportModal } from './ReportModal';

interface PostCardProps {
  post: Post;
  showActions?: boolean;
  onNavigateToPost?: (post: Post) => void;
  feedType?: 'nearby' | 'friends';
}

const DEFAULT_AVATAR = 'https://images.unsplash.com/photo-1511367461989-f85a21fda167?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60';

export const PostCard: React.FC<PostCardProps> = ({ 
  post,
  showActions = true,
  onNavigateToPost,
  feedType = 'nearby'
}) => {
  const router = useRouter();
  const { user } = useAuthStore();
  const { likePost, unlikePost, deletePost } = usePostStore();
  const { comments } = useCommentStore();
  const { currentLocation } = useLocationStore();
  const { t } = useTranslation();
  
  const [isLiked, setIsLiked] = useState<boolean>(false);
  const [likesCount, setLikesCount] = useState<number>(0);
  const [showReportModal, setShowReportModal] = useState<boolean>(false);
  
  // Get actual comment count from comment store
  const actualCommentCount = comments[post.id]?.length || post.comments.length;

  // Update like state and count when post or user changes
  useEffect(() => {
    if (user) {
      setIsLiked(post.likes.includes(user.id));
    }
    setLikesCount(post.likes.length);
  }, [post.likes, user]);
  
  const handleLikeToggle = async () => {
    if (!user) return;
    
    try {
      // Update UI immediately for better UX
      const newLikedState = !isLiked;
      setIsLiked(newLikedState);
      setLikesCount(prevCount => newLikedState ? prevCount + 1 : prevCount - 1);
      
      if (isLiked) {
        await unlikePost(post.id, user.id);
      } else {
        await likePost(post.id, user.id);
      }
    } catch (error) {
      // Revert state if error occurs
      setIsLiked(isLiked);
      setLikesCount(post.likes.length);
      console.error('Error toggling like:', error);
    }
  };
  
  const handleViewPost = () => {
    router.push(`/post/${post.id}`);
  };
  
  const handleViewProfile = () => {
    const userId = ensureStringId(post.userId);
    if (!userId) return;
    router.push(`/profile/${userId}`);
  };
  
  const handleViewLocation = () => {
    if (onNavigateToPost) {
      onNavigateToPost(post);
    } else {
      router.push({
        pathname: '/(tabs)/map',
        params: { 
          postId: post.id,
          latitude: post.location.latitude,
          longitude: post.location.longitude
        }
      });
    }
  };

  const handleDeletePost = async () => {
    if (!user) return;
    
    const isOwner = ensureStringId(post.userId) === user.id;
    if (!isOwner) {
      Alert.alert(t('common.error'), t('posts.deletePostError'));
      return;
    }

    Alert.alert(
      t('posts.deletePostTitle'),
      t('posts.deletePostMessage'),
      [
        {
          text: t('common.cancel'),
          style: 'cancel',
        },
        {
          text: t('common.delete'),
          style: 'destructive',
          onPress: async () => {
            try {
              await deletePost(post.id);
              Alert.alert(t('common.success'), t('posts.deletePostSuccess'));
            } catch (error) {
              Alert.alert(t('common.error'), t('posts.deletePostFailed'));
            }
          },
        },
      ]
    );
  };

  const handleMoreOptions = () => {
    if (!user) return;
    
    const isOwner = ensureStringId(post.userId) === user.id;
    
    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options: isOwner ? [t('common.cancel'), t('posts.deletePost')] : [t('common.cancel'), t('posts.reportPost')],
          destructiveButtonIndex: 1,
          cancelButtonIndex: 0,
        },
        (buttonIndex) => {
          if (buttonIndex === 1) {
            if (isOwner) {
              handleDeletePost();
            } else {
              setShowReportModal(true);
            }
          }
        }
      );
    } else {
      if (isOwner) {
        Alert.alert(
          t('posts.postOptionsTitle'), 
          t('posts.postOptionsMessage'),
          [
            { text: t('common.cancel'), style: 'cancel' },
            { text: t('posts.deletePost'), style: 'destructive', onPress: handleDeletePost }
          ]
        );
      } else {
        Alert.alert(
          t('posts.postOptionsTitle'), 
          t('posts.postOptionsMessage'),
          [
            { text: t('common.cancel'), style: 'cancel' },
            { text: t('posts.reportPost'), onPress: () => setShowReportModal(true) }
          ]
        );
      }
    }
  };

  // Get display name for the user
  const getDisplayName = () => {
    if (!post.user) return t('posts.unknownUser');
    return post.user.fullname || t('posts.unknownUser');
  };

  // Get avatar URL with fallback
  const getAvatarUrl = () => {
    if (!post.user?.avatar) return DEFAULT_AVATAR;
    return post.user.avatar;
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.userInfo} onPress={handleViewProfile}>
          <Image 
            source={{ uri: getAvatarUrl() }} 
            style={styles.avatar} 
          />
          <View>
            <Text style={styles.username}>{getDisplayName()}</Text>
            <Text style={styles.location}>
              {post.location.name || t('posts.unknownLocation')}
            </Text>
          </View>
        </TouchableOpacity>
        {showActions && (
          <TouchableOpacity onPress={handleMoreOptions}>
            <MoreHorizontal size={20} color={colors.text} />
          </TouchableOpacity>
        )}
      </View>
      
      <View style={styles.captionContainer}>
        <Text style={styles.caption}>{post.caption}</Text>
      </View>
      
      <TouchableOpacity onPress={handleViewPost}>
        <Image 
          source={{ uri: post.imageUrl }} 
          style={styles.image} 
          resizeMode="cover"
        />
      </TouchableOpacity>
      
      {showActions && (
        <View style={styles.actionsContainer}>
          <View style={styles.leftActions}>
            <TouchableOpacity style={styles.actionButton} onPress={handleLikeToggle}>
              <Heart 
                size={24} 
                color={isLiked ? colors.secondary : colors.text} 
                fill={isLiked ? colors.secondary : 'transparent'} 
              />
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionButton} onPress={handleViewPost}>
              <MessageCircle size={24} color={colors.text} />
            </TouchableOpacity>
          </View>
          
          {feedType === 'nearby' && (
            <TouchableOpacity 
              style={[styles.actionButton, styles.findLocationButton]} 
              onPress={handleViewLocation}
            >
              <Navigation size={24} color={colors.text} />
              <Text style={styles.findLocationText}>{t('posts.findLocation')}</Text>
            </TouchableOpacity>
          )}
        </View>
      )}
      
      <View style={styles.footer}>
        <Text style={styles.likesText}>
          {likesCount} {likesCount === 1 ? t('posts.like') : t('posts.like_plural')}
        </Text>
        <Text style={styles.commentsText}>
          {actualCommentCount} {actualCommentCount === 1 ? t('posts.comment_singular') : t('posts.comment_plural')}
        </Text>
      </View>

      {/* Report Modal */}
      <ReportModal
        visible={showReportModal}
        onClose={() => setShowReportModal(false)}
        postId={post.id}
        postAuthor={post.user?.fullname || post.user?.username || 'Unknown User'}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.card,
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  username: {
    fontWeight: 'bold',
    color: colors.text,
    marginRight: 6,
  },
  location: {
    fontSize: 12,
    color: colors.textLight,
    marginTop: 2,
  },
  image: {
    width: '100%',
    height: 300,
    backgroundColor: '#f0f0f0',
  },
  actionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingVertical: 10,
  },
  leftActions: {
    flexDirection: 'row',
    gap: 15,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 5,
  },
  findLocationButton: {
    backgroundColor: colors.primary,
    borderRadius: 20,
    paddingHorizontal: 15,
    paddingVertical: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  findLocationText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  footer: {
    padding: 12,
    paddingTop: 8,
  },
  likesText: {
    fontWeight: 'bold',
    marginBottom: 4,
    color: colors.text,
    fontSize: 13,
  },
  commentsText: {
    fontWeight: 'bold',
    marginBottom: 8,
    color: colors.text,
    fontSize: 13,
  },
  captionContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 8,
    paddingHorizontal: 12,
    paddingTop: 8,
  },
  caption: {
    color: colors.text,
    lineHeight: 20,
    flex: 1,
    flexWrap: 'wrap',
  },
  timestamp: {
    color: colors.textLight,
    fontSize: 12,
  },
});