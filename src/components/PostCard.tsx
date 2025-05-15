import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  Image, 
  TouchableOpacity,
  Dimensions
} from 'react-native';
import { useRouter } from 'expo-router';
import { Heart, MessageCircle, Navigation, MoreHorizontal } from 'lucide-react-native';
import { Post, User } from '../types';
import { colors } from '../constants/colors';
import { getUserById } from '../services/userService';
import { useAuthStore } from '../store/authStore';
import { usePostStore } from '../store/postStore';
import { ensureStringId } from '../services/postService';

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
  const { likePost, unlikePost } = usePostStore();
  
  // Sử dụng state để lưu thông tin người dùng
  const [postUser, setPostUser] = React.useState<User | null>(null);
  
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
  const isLiked = user ? post.likes.includes(user.id) : false;
  
  const handleLikeToggle = () => {
    if (!user) return;
    
    if (isLiked) {
      unlikePost(post.id, user.id);
    } else {
      likePost(post.id, user.id);
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
    router.push({
      pathname: '/map',
      params: { 
        latitude: post.location.latitude, 
        longitude: post.location.longitude,
        postId: post.id
      }
    });
  };
  
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
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
        <TouchableOpacity>
          <MoreHorizontal size={20} color={colors.text} />
        </TouchableOpacity>
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
            <TouchableOpacity style={styles.actionButton} onPress={handleViewPost}>
              <MessageCircle size={24} color={colors.text} />
            </TouchableOpacity>
          </View>
          <TouchableOpacity style={styles.actionButton} onPress={handleViewLocation}>
            <Navigation size={24} color={colors.text} />
          </TouchableOpacity>
        </View>
      )}
      
      <View style={styles.content}>
        <Text style={styles.likesCount}>{post.likes.length} likes</Text>
        <View style={styles.captionContainer}>
          <Text style={styles.captionUsername}>
            {postUser ? postUser.fullname || postUser.username || 'User' : 'User'}
          </Text>
          <Text style={styles.caption}>{post.caption}</Text>
        </View>
        
        {post.comments.length > 0 && (
          <TouchableOpacity onPress={handleViewPost}>
            <Text style={styles.viewComments}>
              View all {post.comments.length} comments
            </Text>
          </TouchableOpacity>
        )}
        
        <Text style={styles.timestamp}>{formatDate(post.createdAt.toString())}</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.card,
    borderRadius: 12,
    marginBottom: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
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
    width: 36,
    height: 36,
    borderRadius: 18,
    marginRight: 10,
  },
  username: {
    fontWeight: '600',
    fontSize: 14,
    color: colors.text,
  },
  location: {
    fontSize: 12,
    color: colors.textLight,
    marginTop: 2,
  },
  image: {
    width: '100%',
    height: 300,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 12,
  },
  leftActions: {
    flexDirection: 'row',
  },
  actionButton: {
    marginRight: 16,
  },
  content: {
    paddingHorizontal: 12,
    paddingBottom: 12,
  },
  likesCount: {
    fontWeight: '600',
    fontSize: 14,
    marginBottom: 6,
    color: colors.text,
  },
  captionContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 6,
  },
  captionUsername: {
    fontWeight: '600',
    fontSize: 14,
    marginRight: 6,
    color: colors.text,
  },
  caption: {
    fontSize: 14,
    color: colors.text,
    flex: 1,
    flexWrap: 'wrap',
  },
  viewComments: {
    fontSize: 14,
    color: colors.textLight,
    marginBottom: 6,
  },
  timestamp: {
    fontSize: 12,
    color: colors.textLight,
  },
});