import React, { useState } from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { Comment } from '../../types';
import { useCommentStore } from '../../store/commentStore';
import { useAuthStore } from '../../store/authStore';
import { Ionicons } from '@expo/vector-icons';
import { formatDistanceToNow } from 'date-fns';

interface CommentItemProps {
  comment: Comment;
  postId: string;
  onPress?: () => void;
}

export const CommentItem: React.FC<CommentItemProps> = ({ comment, postId, onPress }) => {
  const { deleteComment, likeComment, unlikeComment } = useCommentStore();
  const { user } = useAuthStore();
  const [isLiking, setIsLiking] = useState(false);  const isLiked = comment.likes?.includes(user?.id || '') || false;
  const isOwner = comment.user?.id === user?.id;

  const handleLikeToggle = async () => {
    if (!user || isLiking) return;
    
    setIsLiking(true);
    try {
      if (isLiked) {
        await unlikeComment(comment.id, postId);
      } else {
        await likeComment(comment.id, postId);
      }
    } catch (error) {
      console.error('Error toggling comment like:', error);
    } finally {
      setIsLiking(false);
    }
  };

  const handleDelete = () => {
    Alert.alert(
      'Delete Comment',
      'Are you sure you want to delete this comment?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteComment(comment.id, postId);
            } catch (error) {
              Alert.alert('Error', 'Failed to delete comment');
            }
          }
        }
      ]
    );
  };

  const formatTime = (dateString: string) => {
    try {
      return formatDistanceToNow(new Date(dateString), { addSuffix: true });
    } catch {
      return 'Just now';
    }
  };

  return (
    <TouchableOpacity style={styles.container} onPress={onPress}>
      <View style={styles.header}>
        <Image
          source={{ 
            uri: comment.user?.avatar || 'https://via.placeholder.com/40x40?text=Avatar' 
          }}
          style={styles.avatar}
        />
        <View style={styles.userInfo}>
          <Text style={styles.username}>
            {String(comment.user?.fullName || comment.user?.email || 'User')}
          </Text>
          <Text style={styles.timestamp}>
            {String(formatTime(comment.createdAt))}
          </Text>
        </View>
        {isOwner && (
          <TouchableOpacity onPress={handleDelete} style={styles.deleteButton}>
            <Ionicons name="trash-outline" size={16} color="#FF6B6B" />
          </TouchableOpacity>
        )}
      </View>
      {comment.text && (
        <Text style={styles.commentText}>
          {String(comment.text || '')}
        </Text>
      )}
      {comment.image && (
        <Image 
          source={{ uri: comment.image }} 
          style={styles.commentImage}
          resizeMode="cover"
        />
      )}
        <View style={styles.footer}>
        <TouchableOpacity 
          style={styles.likeButton} 
          onPress={handleLikeToggle}
          disabled={isLiking}
        >
          <Ionicons 
            name={isLiked ? "heart" : "heart-outline"} 
            size={16} 
            color={isLiked ? "#FF6B6B" : "#666"} 
          />
          {comment.likeCount > 0 && (
            <Text style={[styles.likeCount, isLiked && styles.likedText]}>
              {String(comment.likeCount || 0)}
            </Text>
          )}
        </TouchableOpacity>
        
        <Text style={styles.replyText}>Reply</Text>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    padding: 12,
    marginVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E5E5',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginRight: 8,
  },
  userInfo: {
    flex: 1,
  },
  username: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  timestamp: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  deleteButton: {
    padding: 4,
  },
  commentText: {
    fontSize: 14,
    color: '#333',
    lineHeight: 20,
    marginBottom: 8,
  },  commentImage: {
    width: '100%',
    height: 150,
    borderRadius: 8,
    marginBottom: 8,
    backgroundColor: '#f0f0f0',
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  likeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 4,
  },  likeCount: {
    fontSize: 12,
    color: '#666',
    marginLeft: 4,
  },
  likedText: {
    color: '#FF6B6B',
  },
  replyText: {
    fontSize: 12,
    color: '#007AFF',
    marginLeft: 16,
    fontWeight: '500',
  },
});
