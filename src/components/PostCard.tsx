import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  Image, 
  TouchableOpacity,
  Dimensions,
  Alert,
  ActionSheetIOS,
  Platform
} from 'react-native';
import { useRouter } from 'expo-router';
import { Heart, Navigation, MoreHorizontal } from 'lucide-react-native';
import { Post, User } from '../types';
import { colors } from '../constants/colors';
import { getUserById } from '../services/userService';
import { useAuthStore } from '../store/authStore';
import { usePostStore } from '../store/postStore';
import { ensureStringId } from '../services/postService';
import { formatTimeAgo } from '../utils/timeUtils';
import { CommentButton } from './comments';
import { useCommentStore } from '../store/commentStore';
import { useLocationStore } from '../store/locationStore';

interface PostCardProps {
  post: Post;
  showActions?: boolean;
}

export const PostCard: React.FC<PostCardProps> = ({ 
  post,
  showActions = true
}) => {
  const router = useRouter();
  const { user } = useAuthStore();
  const { likePost, unlikePost, deletePost } = usePostStore();
  const { comments } = useCommentStore();
  const { currentLocation } = useLocationStore();
  
  // Sử dụng state để lưu thông tin người dùng
  const [postUser, setPostUser] = React.useState<User | null>(null);
  const [isLiked, setIsLiked] = useState<boolean>(false);
  const [likesCount, setLikesCount] = useState<number>(0);
  
  // Get actual comment count from comment store
  const actualCommentCount = comments[post.id]?.length || post.comments.length;
  
  // Lấy thông tin người dùng khi component được render
  React.useEffect(() => {
    const fetchUser = async () => {
      const userId = ensureStringId(post.userId);
      if (userId) {
        const user = await getUserById(userId);
        if (user) {
          setPostUser(user);
        }
      }
    };
    
    fetchUser();
  }, [post.userId]);

  // Cập nhật trạng thái like và số like khi post hoặc user thay đổi
  useEffect(() => {
    if (user) {
      setIsLiked(post.likes.includes(user.id));
    }
    setLikesCount(post.likes.length);
  }, [post.likes, user]);
  
  const handleLikeToggle = async () => {
    if (!user) return;
    
    try {
      // Cập nhật UI ngay lập tức để có UX tốt hơn
      const newLikedState = !isLiked;
      setIsLiked(newLikedState);
      
      // Cập nhật số like ngay lập tức
      setLikesCount(prevCount => newLikedState ? prevCount + 1 : prevCount - 1);
      
      if (isLiked) {
        await unlikePost(post.id, user.id);
      } else {
        await likePost(post.id, user.id);
      }
    } catch (error) {
      // Revert lại state nếu có lỗi
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
  

  const handleDeletePost = async () => {
    if (!user) return;
    
    const isOwner = ensureStringId(post.userId) === user.id;
    if (!isOwner) {
      Alert.alert('Error', 'You can only delete your own posts');
      return;
    }

    Alert.alert(
      'Delete Post',
      'Are you sure you want to delete this post? This action cannot be undone.',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deletePost(post.id);
              Alert.alert('Success', 'Post deleted successfully');
            } catch (error) {
              Alert.alert('Error', 'Failed to delete post. Please try again.');
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
          options: isOwner ? ['Cancel', 'Delete Post'] : ['Cancel', 'Report Post'],
          destructiveButtonIndex: 1,
          cancelButtonIndex: 0,
        },
        (buttonIndex) => {
          if (buttonIndex === 1) {
            if (isOwner) {
              handleDeletePost();
            } else {
              Alert.alert('Report', 'Report functionality coming soon');
            }
          }
        }
      );
    } else {
      if (isOwner) {
        Alert.alert(
          'Post Options', 
          'Choose an action',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Delete Post', style: 'destructive', onPress: handleDeletePost }
          ]
        );
      } else {
        Alert.alert(
          'Post Options', 
          'Choose an action',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Report Post', onPress: () => Alert.alert('Report', 'Report functionality coming soon') }
          ]
        );
      }
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.userInfo} onPress={handleViewProfile}>
          <Image 
            source={
              postUser && postUser.avatar 
                ? { uri: postUser.avatar } 
                : { uri: 'https://images.unsplash.com/photo-1511367461989-f85a21fda167?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60' }
            } 
            style={styles.avatar} 
          />
          <View>
            <Text style={styles.username}>
              {postUser ? postUser.username || postUser.fullname : 'User'}
            </Text>
            <Text style={styles.location}>
              {post.location.name || 'Unknown location'}
            </Text>
          </View>
        </TouchableOpacity>
        {showActions && (
          <TouchableOpacity onPress={handleMoreOptions}>
            <MoreHorizontal size={20} color={colors.text} />
          </TouchableOpacity>
        )}
      </View>
      
      {/* Caption moved under username */}
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
        <View style={styles.actions}>
          <View style={styles.leftActions}>
            <TouchableOpacity style={styles.actionButton} onPress={handleLikeToggle}>
              <Heart 
                size={24} 
                color={isLiked ? colors.secondary : colors.text} 
                fill={isLiked ? colors.secondary : 'transparent'} 
              />
            </TouchableOpacity>
            <CommentButton 
              postId={post.id} 
              commentCount={actualCommentCount}
              size="medium"
              showCount={false}
              color={colors.text}
            />
          </View>
          <TouchableOpacity 
            style={styles.actionButton} 
          >
            <Navigation size={24} color={colors.text} />
          </TouchableOpacity>
        </View>
      )}
      
      <View style={styles.content}>
        {showActions && (
          <>
            <Text style={styles.likesCount}>{likesCount} likes</Text>
            <Text style={styles.commentsCount}>{actualCommentCount} comments</Text>
          </>
        )}
        
        <Text style={styles.timestamp}>
          {formatTimeAgo(new Date(post.createdAt))}
        </Text>
      </View>
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
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  leftActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionButton: {
    marginRight: 12, // Reduced from 16 to 12
    padding: 4,
  },
  content: {
    padding: 12,
    paddingTop: 8,
  },
  likesCount: {
    fontWeight: 'bold',
    marginBottom: 4,
    marginTop: 2,
    color: colors.text,
    fontSize: 13,
  },
  commentsCount: {
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