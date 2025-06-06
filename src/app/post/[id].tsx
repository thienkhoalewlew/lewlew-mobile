import React, { useState, useEffect, useRef } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  Image, 
  TouchableOpacity, 
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActionSheetIOS,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
  BackHandler
} from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Heart, Navigation, MoreHorizontal, ArrowLeft, MessageCircle, Share } from 'lucide-react-native';

import { usePostStore } from '../../store/postStore';
import { useCommentStore } from '../../store/commentStore';
import { useAuthStore } from '../../store/authStore';
import { colors } from '../../constants/colors';
import { User, Post as PostType } from '../../types';
import { ensureStringId } from '@/src/services/postService';
import { formatTimeAgo } from '../../utils/timeUtils';
import { getUserById } from '../../services/userService';
import { CommentList, CreateComment } from '../../components/comments';

export default function PostDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuthStore();
  const { posts, likePost, unlikePost, deletePost } = usePostStore();
  const { comments, getComments, loading: commentsLoading } = useCommentStore();
  
  // State
  const [post, setPost] = useState<PostType | null>(null);
  const [postUser, setPostUser] = useState<User | null>(null);
  const [isLiked, setIsLiked] = useState<boolean>(false);
  const [likesCount, setLikesCount] = useState<number>(0);
  const [refreshing, setRefreshing] = useState(false);
  const [imageLoading, setImageLoading] = useState(true);
  const [commentsPage, setCommentsPage] = useState(1);
  const [loadingMoreComments, setLoadingMoreComments] = useState(false);
  const [hasMoreComments, setHasMoreComments] = useState(true);
  const commentsRef = useRef<ScrollView>(null);

  // Get post from store
  useEffect(() => {
    console.log('Post ID from params:', id);
    console.log('Available posts:', posts.map(p => ({ id: p.id, caption: p.caption })));
    
    const foundPost = posts.find((p: any) => p.id === id);
    console.log('Found post:', foundPost);
    
    if (foundPost) {
      setPost(foundPost);
    } else {
      console.log('Post not found, ID mismatch?');
      Alert.alert('Error', 'Post not found');
      router.back();
    }
  }, [posts, id]);

  // Load post user info
  useEffect(() => {
    const fetchPostUser = async () => {
      if (post) {
        try {
          const userId = ensureStringId(post.userId);
          if (userId) {
            const userData = await getUserById(userId);
            if (userData) {
              setPostUser(userData);
            }
          }
        } catch (error) {
          console.error('Error fetching post user:', error);
        }
      }
    };
    
    fetchPostUser();
  }, [post]);

  // Update like status and load comments
  useEffect(() => {
    if (post && user) {
      const liked = post.likes.includes(user.id);
      setIsLiked(liked);
      setLikesCount(post.likes.length);
    }
    
    // Load comments for this post
    if (id) {
      getComments(id as string);
    }
  }, [post, user, id, getComments]);

  // Update hasMoreComments when comments change
  useEffect(() => {
    if (id && comments[id as string]) {
      const totalComments = comments[id as string].length;
      const commentsShown = commentsPage * 5;
      setHasMoreComments(commentsShown < totalComments);
    }
  }, [comments, id, commentsPage]);

  // Handle hardware back button on Android
  useEffect(() => {
    const backAction = () => {
      handleGoBack();
      return true; // Prevent default behavior
    };

    const backHandler = BackHandler.addEventListener(
      'hardwareBackPress',
      backAction
    );

    return () => backHandler.remove();
  }, []);

  // Refresh handler
  const onRefresh = async () => {
    setRefreshing(true);
    if (id) {
      resetComments();
      await getComments(id as string);
    }
    setRefreshing(false);
  };

  // Like toggle handler
  const handleLikeToggle = async () => {
    if (!post || !user) return;
    
    try {
      const newLikedState = !isLiked;
      setIsLiked(newLikedState);
      setLikesCount(prevCount => newLikedState ? prevCount + 1 : prevCount - 1);
      
      if (isLiked) {
        await unlikePost(post.id, user.id);
      } else {
        await likePost(post.id, user.id);
      }
    } catch (error) {
      // Revert state on error
      setIsLiked(!isLiked);
      setLikesCount(post.likes.length);
      console.error('Error toggling like:', error);
      Alert.alert('Error', 'Failed to update like status');
    }
  };

  // View profile handler
  const handleViewProfile = (userId: string) => {
    if (userId === user?.id) {
      router.push('/profile');
    } else {
      router.push({
        pathname: '/profile/[id]',
        params: { id: userId }
      });
    }
  };

  // View location handler
  const handleViewLocation = () => {
    if (!post) return;
    
    router.push({
      pathname: '/map',
      params: { 
        latitude: post.location.latitude, 
        longitude: post.location.longitude,
        locationName: post.location.name || 'Unknown Location'
      }
    });
  };

  // Delete post handler
  const handleDeletePost = async () => {
    if (!post) return;
    
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
              const result = await deletePost(post.id);
              if (result.success) {
                Alert.alert('Success', 'Post deleted successfully');
                router.back();
              } else {
                Alert.alert('Error', result.error || 'Failed to delete post');
              }
            } catch (error) {
              Alert.alert('Error', 'Failed to delete post. Please try again.');
            }
          },
        },
      ]
    );
  };

  // More options handler
  const handleMoreOptions = () => {
    if (!post || !user) return;
    
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

  // Share handler
  const handleShare = async () => {
    try {
      // Share functionality
      Alert.alert('Share', 'Share functionality coming soon');
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };

  // Back navigation handler
  const handleGoBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      // Fallback navigation if no history
      router.replace('/(tabs)');
    }
  };

  // Load more comments when reaching bottom
  const loadMoreComments = async () => {
    if (!id || loadingMoreComments || !hasMoreComments) return;

    setLoadingMoreComments(true);
    try {
      // Just increase the page to show more comments
      setCommentsPage(prev => {
        const newPage = prev + 1;
        const totalComments = comments[id as string]?.length || 0;
        const commentsToShow = newPage * 5;
        
        // Check if we have more comments to show
        if (commentsToShow >= totalComments) {
          setHasMoreComments(false);
        }
        
        return newPage;
      });
    } catch (error) {
      console.error('Error loading more comments:', error);
    } finally {
      setLoadingMoreComments(false);
    }
  };

  // Handle scroll to bottom
  const handleScrollEnd = (event: any) => {
    const { layoutMeasurement, contentOffset, contentSize } = event.nativeEvent;
    const paddingToBottom = 20;
    
    if (layoutMeasurement.height + contentOffset.y >= contentSize.height - paddingToBottom) {
      loadMoreComments();
    }
  };

  // Reset comments when refreshing
  const resetComments = () => {
    setCommentsPage(1);
    setHasMoreComments(true);
  };

  // Scroll to comments section
  const scrollToComments = () => {
    // Using setTimeout to ensure the scroll happens after any state updates
    setTimeout(() => {
      if (commentsRef.current) {
        // Use a measured offset to scroll to the comments section
        commentsRef.current.scrollTo({ 
          y: post?.imageUrl ? 800 : 300, // Different offset based on whether there's an image
          animated: true 
        });
      }
    }, 100);
  };

  // Get comment count
  const commentCount = comments[id as string]?.length || post?.comments?.length || 0;
  const commentsToShow = commentsPage * 5;

  // Debug logs
  console.log('Comments debug:', {
    postId: id,
    commentCount,
    commentsPage,
    commentsToShow,
    hasMoreComments,
    actualComments: comments[id as string]?.length || 0
  });

  if (!post) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Loading post...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <StatusBar style="dark" />
      
      <Stack.Screen 
        options={{
          headerShown: false,
        }} 
      />
      
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoidingView}
      >
        <ScrollView
          ref={commentsRef}
          style={styles.scrollView}
          contentContainerStyle={styles.scrollViewContent}
          showsVerticalScrollIndicator={false}
          onMomentumScrollEnd={handleScrollEnd}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[colors.primary]}
              tintColor={colors.primary}
            />
          }
        >
          {/* Post Header with Back Button */}
          <View style={styles.postHeader}>
            <TouchableOpacity 
              onPress={handleGoBack}
              style={styles.backButton}
              activeOpacity={0.7}
            >
              <ArrowLeft size={24} color={colors.text} />
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.userInfo}
              onPress={() => handleViewProfile(ensureStringId(post.userId))}
            >
              <Image 
                source={
                  postUser?.avatar 
                    ? { uri: postUser.avatar } 
                    : { uri: 'https://images.unsplash.com/photo-1511367461989-f85a21fda167?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60' }
                } 
                style={styles.avatar} 
              />
              <View>
                <Text style={styles.username}>
                  {postUser?.fullname || postUser?.username || 'User'}
                </Text>
                <Text style={styles.location}>{post.location.name}</Text>
              </View>
            </TouchableOpacity>
            
            <TouchableOpacity 
              onPress={handleMoreOptions} 
              style={styles.moreButton}
            >
              <MoreHorizontal size={24} color={colors.text} />
            </TouchableOpacity>
          </View>

          {/* Caption moved under header */}
          <View style={styles.captionContainer}>
            <Text style={styles.caption}>{post.caption}</Text>
          </View>

          {/* Post Image */}
          <View style={styles.imageContainer}>
            {imageLoading && (
              <View style={styles.imageLoadingContainer}>
                <ActivityIndicator size="large" color={colors.primary} />
              </View>
            )}
            <Image 
              source={{ uri: post.imageUrl }} 
              style={styles.postImage}
              onLoad={() => setImageLoading(false)}
              onError={() => setImageLoading(false)}
            />
          </View>

          {/* Post Actions */}
          <View style={styles.actionsContainer}>
            <View style={styles.leftActions}>
              <TouchableOpacity style={styles.actionButton} onPress={handleLikeToggle}>
                <Heart 
                  size={24} 
                  color={isLiked ? colors.secondary : colors.text} 
                  fill={isLiked ? colors.secondary : 'transparent'} 
                />
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.actionButton} 
                onPress={scrollToComments}
              >
                <MessageCircle size={24} color={colors.text} />
              </TouchableOpacity>
            </View>
            <TouchableOpacity style={styles.actionButton} onPress={handleViewLocation}>
              <Navigation size={24} color={colors.text} />
            </TouchableOpacity>
          </View>
          
          {/* Post Content */}
          <View style={styles.postContent}>
            <Text style={styles.likesCount}>{likesCount} likes</Text>
            
            {/* Comments Preview Text */}
            {commentCount > 0 && (
              <TouchableOpacity 
                style={styles.viewCommentsButton}
                onPress={scrollToComments}
              >
                <Text style={styles.viewCommentsText}>
                  {commentCount} {commentCount === 1 ? 'comment' : 'comments'}
                </Text>
              </TouchableOpacity>
            )}
            
            <Text style={styles.timestamp}>{formatTimeAgo(post.createdAt)}</Text>
          </View>

          {/* Direct Comments Display */}
          {commentCount > 0 && (
            <View style={styles.commentsSection} testID="comments-section">
              <Text style={styles.commentsSectionTitle}>Comments ({commentCount})</Text>
              
              {/* Display comments without height restriction */}
              <CommentList 
                postId={post.id}
                maxItems={commentsToShow}
                showCreateComment={false}
              />
              
              {/* Load More Comments Button */}
              {hasMoreComments && (
                <TouchableOpacity 
                  style={styles.loadMoreButton}
                  onPress={loadMoreComments}
                  disabled={loadingMoreComments}
                >
                  {loadingMoreComments ? (
                    <ActivityIndicator size="small" color={colors.primary} />
                  ) : (
                    <Text style={styles.loadMoreText}>Load more comments</Text>
                  )}
                </TouchableOpacity>
              )}
            </View>
          )}
        </ScrollView>
        
        {/* Create Comment Fixed at Bottom */}
        <CreateComment 
          postId={post.id} 
          onCommentCreated={() => {
            // Refresh comments after creating and reset pagination
            if (id) {
              resetComments();
              getComments(id as string);
            }
          }}
        />
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
  scrollView: {
    flex: 1,
  },
  scrollViewContent: {
    paddingTop: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: colors.textLight,
  },
  customHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: colors.background,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    flex: 1,
    textAlign: 'center',
    marginHorizontal: 16,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  postHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 8, // Reduced padding to move back button closer to edge
    paddingVertical: 12,
    paddingTop: 16,
    marginTop: 16, // Add margin top to push content down
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginLeft: 8, // Reduced space between back button and user info
    marginRight: 12, // Space between user info and more button
  },
  backButton: {
    padding: 4, // Reduced padding to move button closer to edge
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 4, // Small margin to keep some space from screen edge
  },
  moreButton: {
    padding: 4, // Match back button padding
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 4, // Small margin to keep some space from screen edge
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    marginRight: 12,
  },
  username: {
    fontWeight: '600',
    fontSize: 16,
    color: colors.text,
  },
  location: {
    fontSize: 12,
    color: colors.textLight,
    marginTop: 2,
  },
  imageContainer: {
    position: 'relative',
    aspectRatio: 1,
    backgroundColor: colors.card,
    marginTop: 8, // Add margin top to create space between header and image
  },
  imageLoadingContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  postImage: {
    width: '100%',
    height: '100%',
  },
  actionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  leftActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionButton: {
    padding: 8,
    marginRight: 16,
  },
  postContent: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  likesCount: {
    fontWeight: '600',
    fontSize: 14,
    color: colors.text,
    marginBottom: 8,
  },
  captionContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  captionUsername: {
    fontWeight: '600',
    fontSize: 14,
    color: colors.text,
  },
  caption: {
    fontSize: 14,
    color: colors.text,
    lineHeight: 20,
  },
  viewCommentsButton: {
    marginBottom: 8,
  },
  viewCommentsText: {
    fontSize: 14,
    color: colors.textLight,
  },
  timestamp: {
    fontSize: 12,
    color: colors.textLight,
  },
  commentsPreview: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    marginTop: 8,
  },
  commentsSection: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    marginTop: 12,
    backgroundColor: colors.background,
  },
  commentsPreviewTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 12,
    marginTop: 16,
  },
  commentsSectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 16,
    marginTop: 16,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  commentsContainer: {
    // Remove maxHeight to allow full comment display including images
    backgroundColor: colors.background,
  },
  loadMoreButton: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: 'center',
    marginTop: 8,
    backgroundColor: colors.card,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  loadMoreText: {
    fontSize: 14,
    color: colors.primary,
    fontWeight: '500',
  },
  viewMoreComments: {
    paddingVertical: 8,
    alignItems: 'center',
  },
  viewMoreCommentsText: {
    fontSize: 14,
    color: colors.primary,
    fontWeight: '500',
  },
});