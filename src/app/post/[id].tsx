import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  Image, 
  TouchableOpacity, 
  TextInput,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Alert
} from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Heart, MessageCircle, Navigation, MoreHorizontal, Send, ArrowLeft } from 'lucide-react-native';

import { usePostStore } from '../../store/postStore';
import { useAuthStore } from '../../store/authStore';
import { colors } from '../../constants/colors';
// findUserById is not available; replace usages with null or fallback logic
import { Comment, User } from '../../types';

export default function PostDetailScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { posts, likePost, unlikePost, addComment } = usePostStore();
  const { user } = useAuthStore();
  
  const [post, setPost] = useState(posts.find((p: any) => p.id === id));
  const [commentText, setCommentText] = useState('');
  const [isLiked, setIsLiked] = useState(false);
  
  useEffect(() => {
    if (!post) {
      Alert.alert('Error', 'Post not found');
      router.back();
      return;
    }
    
    if (user) {
      setIsLiked(post.likes.includes(user.id));
    }
  }, [post, user]);
  
  useEffect(() => {
    // Update post when it changes in the store
    const updatedPost = posts.find((p: any) => p.id === id);
    if (updatedPost) {
      setPost(updatedPost);
    }
  }, [posts, id]);
  
  const handleLikeToggle = () => {
    if (!user || !post) return;
    
    if (isLiked) {
      unlikePost(post.id, user.id);
    } else {
      likePost(post.id, user.id);
    }
    
    setIsLiked(!isLiked);
  };
  
  const handleAddComment = () => {
    if (!user || !post || !commentText.trim()) return;
    
    addComment(post.id, user.id, commentText.trim());
    setCommentText('');
  };
  
  const handleViewLocation = () => {
    if (!post) return;
    
    router.push({
      pathname: '/map',
      params: { 
        latitude: post.location.latitude, 
        longitude: post.location.longitude,
        postId: post.id
      }
    });
  };
  
  const handleViewProfile = (userId: string) => {
    router.push(`/profile/${userId}`);
  };
  
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };
  
  const renderCommentItem = ({ item }: { item: Comment }) => {
    // TODO: Replace with actual user lookup logic
    const commentUser = { profileImage: '', username: '' } as User;
    
    return (
      <View style={styles.commentItem}>
        <TouchableOpacity onPress={() => handleViewProfile(item.userId)}>
          <Image source={{ uri: commentUser.profileImage }} style={styles.commentAvatar} />
        </TouchableOpacity>
        <View style={styles.commentContent}>
          <View style={styles.commentHeader}>
            <TouchableOpacity onPress={() => handleViewProfile(item.userId)}>
              <Text style={styles.commentUsername}>{commentUser.username}</Text>
            </TouchableOpacity>
            <Text style={styles.commentTime}>{formatDate(item.createdAt.toString())}</Text>
          </View>
          <Text style={styles.commentText}>{item.text}</Text>
        </View>
      </View>
    );
  };
  
  if (!post) return null;

  // TODO: Replace with actual user lookup logic
  const postUser = { profileImage: '', username: '' } as User;
  if (!postUser) return null;

  return (
    <SafeAreaView style={styles.container} edges={['right', 'left']}>
      <StatusBar style="dark" />
      
      <Stack.Screen 
        options={{
          title: 'Post Details',
          headerLeft: () => (
            <TouchableOpacity onPress={() => router.back()}>
              <ArrowLeft size={24} color={colors.text} />
            </TouchableOpacity>
          ),
          headerRight: () => (
            <TouchableOpacity>
              <MoreHorizontal size={24} color={colors.text} />
            </TouchableOpacity>
          ),
        }} 
      />
      
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoidingView}
      >
        <FlatList
          data={post.comments}
          keyExtractor={(item) => item.id}
          renderItem={renderCommentItem}
          ListHeaderComponent={
            <>
              <View style={styles.postHeader}>
                <TouchableOpacity 
                  style={styles.userInfo}
                  onPress={() => handleViewProfile(post.userId)}
                >
                  <Image source={{ uri: postUser.profileImage }} style={styles.avatar} />
                  <View>
                    <Text style={styles.username}>{postUser.username}</Text>
                    <Text style={styles.location}>{post.location.name}</Text>
                  </View>
                </TouchableOpacity>
              </View>
              
              <Image 
                source={{ uri: post.imageUrl }} 
                style={styles.postImage} 
                resizeMode="cover"
              />
              
              <View style={styles.actions}>
                <View style={styles.leftActions}>
                  <TouchableOpacity style={styles.actionButton} onPress={handleLikeToggle}>
                    <Heart 
                      size={24} 
                      color={isLiked ? colors.secondary : colors.text} 
                      fill={isLiked ? colors.secondary : 'transparent'} 
                    />
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.actionButton}>
                    <MessageCircle size={24} color={colors.text} />
                  </TouchableOpacity>
                </View>
                <TouchableOpacity style={styles.actionButton} onPress={handleViewLocation}>
                  <Navigation size={24} color={colors.text} />
                </TouchableOpacity>
              </View>
              
              <View style={styles.postContent}>
                <Text style={styles.likesCount}>{post.likes.length} likes</Text>
                <View style={styles.captionContainer}>
                  <Text style={styles.captionUsername}>{postUser.username}</Text>
                  <Text style={styles.caption}>{post.caption}</Text>
                </View>
                <Text style={styles.timestamp}>{formatDate(post.createdAt.toString())}</Text>
                
                {post.comments.length > 0 && (
                  <Text style={styles.commentsTitle}>
                    Comments ({post.comments.length})
                  </Text>
                )}
              </View>
            </>
          }
          contentContainerStyle={styles.commentsList}
          ListEmptyComponent={
            <View style={styles.emptyComments}>
              <Text style={styles.emptyCommentsText}>No comments yet</Text>
              <Text style={styles.emptyCommentsSubtext}>Be the first to comment</Text>
            </View>
          }
        />
        
        <View style={styles.commentInputContainer}>
          {user && (
            <Image source={{ uri: user.profileImage }} style={styles.commentInputAvatar} />
          )}
          <TextInput
            style={styles.commentInput}
            placeholder="Add a comment..."
            value={commentText}
            onChangeText={setCommentText}
            multiline
          />
          <TouchableOpacity 
            style={[
              styles.sendButton,
              !commentText.trim() && styles.sendButtonDisabled
            ]}
            onPress={handleAddComment}
            disabled={!commentText.trim()}
          >
            <Send size={20} color={commentText.trim() ? colors.primary : colors.textLight} />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  postHeader: {
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
    fontWeight: '600',
    fontSize: 16,
    color: colors.text,
  },
  location: {
    fontSize: 14,
    color: colors.textLight,
    marginTop: 2,
  },
  postImage: {
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
  postContent: {
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
  timestamp: {
    fontSize: 12,
    color: colors.textLight,
    marginBottom: 16,
  },
  commentsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 12,
  },
  commentsList: {
    paddingBottom: 16,
  },
  commentItem: {
    flexDirection: 'row',
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  commentAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginRight: 12,
  },
  commentContent: {
    flex: 1,
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 10,
  },
  commentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  commentUsername: {
    fontWeight: '600',
    fontSize: 14,
    color: colors.text,
  },
  commentTime: {
    fontSize: 12,
    color: colors.textLight,
  },
  commentText: {
    fontSize: 14,
    color: colors.text,
  },
  emptyComments: {
    padding: 20,
    alignItems: 'center',
  },
  emptyCommentsText: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.text,
  },
  emptyCommentsSubtext: {
    fontSize: 14,
    color: colors.textLight,
    marginTop: 4,
  },
  commentInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.card,
  },
  commentInputAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginRight: 12,
  },
  commentInput: {
    flex: 1,
    backgroundColor: colors.background,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    maxHeight: 100,
  },
  sendButton: {
    marginLeft: 12,
    padding: 8,
  },
  sendButtonDisabled: {
    opacity: 0.5,
  },
});