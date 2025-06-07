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
import { formatDistanceToNow } from 'date-fns';
import { vi } from 'date-fns/locale';
import { isPostExpired } from '../../utils/timeUtils';
import { getUserById } from '../../services/userService';
import { CommentList, CreateComment } from '../../components/comments';
import { useTranslation } from '../../i18n';

export default function PostDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuthStore();
  const { posts, likePost, unlikePost, deletePost } = usePostStore();
  const { comments, getComments, loading: commentsLoading } = useCommentStore();
  const { t, language } = useTranslation();
  
  // State
  const [post, setPost] = useState<PostType | null>(null);
  const [postUser, setPostUser] = useState<User | null>(null);
  const [isLiked, setIsLiked] = useState<boolean>(false);
  const [likesCount, setLikesCount] = useState<number>(0);
  const [refreshing, setRefreshing] = useState(false);
  const [imageLoading, setImageLoading] = useState(true);
  const [commentsPage, setCommentsPage] = useState(1);
  const [loadingMoreComments, setLoadingMoreComments] = useState(false);
  
  // Format time with proper locale
  const formatTime = (dateString: string | Date) => {
    try {
      return formatDistanceToNow(new Date(dateString), { 
        addSuffix: true,
        locale: language === 'vi' ? vi : undefined
      });
    } catch {
      return t('common.justNow');
    }
  };
  
  const [hasMoreComments, setHasMoreComments] = useState(true);
  const commentsRef = useRef<ScrollView>(null);

  // Get post from store
  useEffect(() => {
    console.log('Post ID from params:', id);
    
    const fetchPost = async () => {
      // First try to find post in the local store
      const foundPost = posts.find((p: any) => p.id === id);
      console.log('🧩 PostDetail - Found post in store:', foundPost ? 'Yes' : 'No');
      
      if (foundPost) {
        // Kiểm tra nếu bài viết quá 24h
        const isExpired = isPostExpired(foundPost.createdAt);
        if (isExpired) {
          console.log('🧩 PostDetail - Post has expired (older than 24 hours)');
          Alert.alert(
            t('posts.postExpiredTitle'),
            t('posts.postExpiredMessage'),
            [{ text: t('common.ok'), onPress: () => router.back() }]
          );
          return;
        }
        
        setPost(foundPost);
      } else {
        // If not found in store, fetch from API
        console.log('🧩 PostDetail - Post not found in store, fetching from API...');
        try {
          const fetchedPost = await usePostStore.getState().getPostById(id as string);
          console.log('🧩 PostDetail - API fetch result:', fetchedPost ? 'Success' : 'Failed');
          
          if (fetchedPost) {
            console.log('🧩 PostDetail - Successfully fetched post from API');
            setPost(fetchedPost);
          } else {
            const error = usePostStore.getState().error;
            console.log('🧩 PostDetail - Post not found in API, error:', error);
            
            // Kiểm tra loại lỗi
            if (error && error.includes('expired')) {
              Alert.alert(
                t('posts.postExpiredTitle'),
                t('posts.postExpiredMessage'),
                [{ text: t('common.ok'), onPress: () => router.back() }]
              );
            } else {
              Alert.alert(
                t('common.error'),
                `${t('posts.postNotFound')}. ID: ${id}`,
                [{ text: t('common.ok'), onPress: () => router.back() }]
              );
            }
          }
        } catch (error) {
          console.error('🧩 PostDetail - Error fetching post:', error);
          
          let errorMessage = t('posts.failedToLoadPost');
          if (error instanceof Error) {
            if (error.message.includes('expired')) {
              errorMessage = t('posts.postExpiredMessage');
            } else {
              errorMessage = error.message;
            }
          }
          
          Alert.alert(
            t('posts.postExpiredTitle'),
            errorMessage,
            [
              { 
                text: t('common.ok'), 
                onPress: () => router.back(),
                style: 'cancel'
              }
            ]
          );
        }
      }
    };
    
    if (id) {
      fetchPost();
    }
  }, [id, router]);

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
      Alert.alert(t('common.error'), t('posts.likeError'));
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
      pathname: '/(tabs)/map',
      params: { 
        postId: post.id,
        latitude: post.location.latitude,
        longitude: post.location.longitude
      }
    });
  };

  // Delete post handler
  const handleDeletePost = async () => {
    if (!post) return;
    
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
              const result = await deletePost(post.id);
              if (result.success) {
                Alert.alert(t('common.success'), t('posts.deletePostSuccess'));
                router.back();
              } else {
                Alert.alert(t('common.error'), result.error || t('posts.deletePostFailed'));
              }
            } catch (error) {
              Alert.alert(t('common.error'), t('posts.deletePostFailed'));
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
          options: isOwner ? [t('common.cancel'), t('posts.deletePost')] : [t('common.cancel'), t('posts.reportPost')],
          destructiveButtonIndex: 1,
          cancelButtonIndex: 0,
        },
        (buttonIndex) => {
          if (buttonIndex === 1) {
            if (isOwner) {
              handleDeletePost();
            } else {
              Alert.alert(t('posts.reportTitle'), t('posts.reportMessage'));
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
            { text: t('posts.reportPost'), onPress: () => Alert.alert(t('posts.reportTitle'), t('posts.reportMessage')) }
          ]
        );
      }
    }
  };

  // Share handler
  const handleShare = async () => {
    try {
      // Share functionality
      Alert.alert(t('posts.shareTitle'), t('posts.shareMessage'));
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
          <Text style={styles.loadingText}>{t('posts.loadingPost')}</Text>
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
                  {postUser?.fullname || postUser?.username || t('posts.defaultUser')}
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
            <TouchableOpacity 
              style={[styles.actionButton, styles.findLocationButton]} 
              onPress={handleViewLocation}
            >
              <Navigation size={24} color="white" />
              <Text style={styles.findLocationText}>{t('posts.findLocation')}</Text>
            </TouchableOpacity>
          </View>
          
          {/* Post Content */}
          <View style={styles.postContent}>
            <Text style={styles.likesCount}>{likesCount} {t('posts.likes')}</Text>
            
            {/* Comments Preview Text */}
            {commentCount > 0 && (
              <TouchableOpacity 
                style={styles.viewCommentsButton}
                onPress={scrollToComments}
              >
                <Text style={styles.viewCommentsText}>
                  {commentCount} {commentCount === 1 ? t('posts.comment_singular') : t('posts.comment_plural')}
                </Text>
              </TouchableOpacity>
            )}
            
            <Text style={styles.timestamp}>{formatTime(post.createdAt)}</Text>
          </View>

          {/* Direct Comments Display */}
          {commentCount > 0 && (
            <View style={styles.commentsSection} testID="comments-section">
              <Text style={styles.commentsSectionTitle}>{t('posts.commentsTitle')} ({commentCount})</Text>
              
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
                    <Text style={styles.loadMoreText}>{t('posts.loadMoreComments')}</Text>
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
    paddingHorizontal: 8,
    paddingVertical: 12,
    paddingTop: 16,
    marginTop: 16,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginLeft: 8,
    marginRight: 12,
  },
  backButton: {
    padding: 4,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 4,
  },
  moreButton: {
    padding: 4,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 4,
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
    marginTop: 8,
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