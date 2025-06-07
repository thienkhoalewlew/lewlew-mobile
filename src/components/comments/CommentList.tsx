import React, { useEffect } from 'react';
import { 
  View, 
  FlatList, 
  Text, 
  StyleSheet, 
  ActivityIndicator,
  RefreshControl 
} from 'react-native';
import { useCommentStore } from '../../store/commentStore';
import { CommentItem } from './CommentItem';
import { Comment } from '../../types';
import { useTranslation } from '../../i18n';

interface CommentListProps {
  postId: string;
  showCreateComment?: boolean;
  maxItems?: number;
}

export const CommentList: React.FC<CommentListProps> = ({ 
  postId, 
  showCreateComment = true,
  maxItems
}) => {
  const { 
    comments, 
    loading, 
    error, 
    getComments, 
    clearError 
  } = useCommentStore();
  const { t } = useTranslation();const postComments = comments[postId] || [];
  
  // Show comments in reverse chronological order (newest first)
  const sortedComments = [...postComments].sort((a, b) => 
    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
  
  // Limit comments if maxItems is specified
  const displayComments = maxItems ? sortedComments.slice(0, maxItems) : sortedComments;
  // Debug logs
  console.log('CommentList debug:', {
    postId,
    totalComments: postComments.length,
    maxItems,
    displayingComments: displayComments.length,
    commentsWithImages: displayComments.filter(c => c.image).length,
    commentIds: displayComments.map(c => c.id),
    uniqueIds: [...new Set(displayComments.map(c => c.id))].length
  });

  useEffect(() => {
    getComments(postId);
  }, [postId]);

  const handleRefresh = () => {
    getComments(postId);
  };

  const renderComment = ({ item }: { item: Comment }) => (
    <CommentItem comment={item} postId={postId} />
  );
  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Text style={styles.emptyText}>{t('posts.noComments')}</Text>
      <Text style={styles.emptySubtext}>{t('posts.firstComment')}</Text>
    </View>
  );

  const renderError = () => (
    <View style={styles.errorState}>
      <Text style={styles.errorText}>{t('posts.failedLoadComments')}</Text>
      <Text style={styles.errorSubtext}>{error}</Text>
    </View>
  );
  if (loading && postComments.length === 0) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>{t('posts.loadingComments')}</Text>
      </View>
    );
  }
  return (
    <View style={[styles.container, maxItems ? styles.previewContainer : null]}>
      <FlatList
        data={displayComments}
        renderItem={renderComment}
        keyExtractor={(item, index) => {
          // Ensure we always have a unique key
          if (item.id && typeof item.id === 'string' && item.id.trim() !== '') {
            return `comment-${item.id}`;
          }
          // Fallback to index + timestamp for items without valid IDs
          return `comment-fallback-${index}-${item.createdAt || Date.now()}`;
        }}
        ListEmptyComponent={error ? renderError : renderEmptyState}
        refreshControl={
          !maxItems ? (
            <RefreshControl
              refreshing={loading}
              onRefresh={handleRefresh}
              colors={['#007AFF']}
            />
          ) : undefined
        }
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.listContent,
          displayComments.length === 0 && styles.emptyContent
        ]}
        scrollEnabled={!maxItems} // Disable scroll for preview mode
        nestedScrollEnabled={false} // Prevent nested scroll issues
        removeClippedSubviews={false} // Don't clip subviews to show images properly
        initialNumToRender={maxItems || 5}
        maxToRenderPerBatch={maxItems || 5}
        windowSize={3}
        getItemLayout={undefined} // Let FlatList calculate dynamic heights for images
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  previewContainer: {
    flex: 0,
    // Remove maxHeight restriction to allow images to display properly
  },  listContent: {
    paddingHorizontal: 16,
    paddingTop: 8,
    flexGrow: 1,
  },
  emptyContent: {
    flex: 1,
    justifyContent: 'center',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    textAlign: 'center',
  },
  emptySubtext: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginTop: 8,
  },
  errorState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  errorText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FF6B6B',
    textAlign: 'center',
  },
  errorSubtext: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginTop: 8,
  },
});
