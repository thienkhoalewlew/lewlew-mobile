import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { Comment } from '../../types';
import { useCommentStore } from '../../store/commentStore';
import { useAuthStore } from '../../store/authStore';
import { Ionicons } from '@expo/vector-icons';
import { formatDistanceToNow } from 'date-fns';
import { vi } from 'date-fns/locale';
import { useTranslation } from '../../i18n';

interface CommentItemProps {
  comment: Comment;
  postId: string;
  onPress?: () => void;
}

export const CommentItem: React.FC<CommentItemProps> = ({ 
  comment, 
  postId, 
  onPress
}) => {  const { deleteComment } = useCommentStore();
  const { user } = useAuthStore();
  const { t, language } = useTranslation();
  
  const isOwner = comment.user?.id === user?.id;
  const handleDelete = () => {
    Alert.alert(
      t('posts.deleteComment'),
      t('posts.deleteCommentConfirm'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        { 
          text: t('common.delete'), 
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteComment(comment.id, postId);
            } catch (error) {
              Alert.alert(t('common.error'), t('posts.commentDeleteError'));
            }
          }
        }
      ]
    );
  };  const formatTime = (dateString: string) => {
    try {
      return formatDistanceToNow(new Date(dateString), { 
        addSuffix: true,
        locale: language === 'vi' ? vi : undefined
      });
    } catch {
      return t('posts.justNow');
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.commentContent}>
        <View style={styles.header}>
          <Image
            source={{ 
              uri: comment.user?.avatar || 'https://images.unsplash.com/photo-1511367461989-f85a21fda167?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60' 
            }}
            style={styles.avatar}
          />
          <View style={styles.userInfo}>
            <Text style={styles.username}>
              {comment.user?.fullname || comment.user?.phoneNumber || t('posts.defaultUser')}
            </Text>
            <Text style={styles.timestamp}>
              {formatTime(comment.createdAt)}
            </Text>
          </View>
          {isOwner && (
            <TouchableOpacity 
              onPress={handleDelete} 
              style={styles.deleteButton}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              activeOpacity={0.6}
            >
              <Ionicons name="trash-outline" size={18} color="#333333" />
            </TouchableOpacity>
          )}
        </View>
        {comment.text && comment.text.trim() && (
          <Text style={styles.commentText}>
            {comment.text}
          </Text>
        )}

        {comment.image && (
          <Image 
            source={{ uri: comment.image }} 
            style={styles.commentImage}
            resizeMode="cover"
          />
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 4,
  },
  commentContent: {
    backgroundColor: '#FFFFFF',
    padding: 12,
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
    backgroundColor: '#F0F0F0',
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
    padding: 8,
    borderRadius: 6,
    backgroundColor: 'rgba(51, 51, 51, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(51, 51, 51, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    minWidth: 32,
    minHeight: 32,
  },
  commentText: {
    fontSize: 14,
    color: '#333',
    lineHeight: 20,
    marginBottom: 8,
  },
  commentImage: {
    width: '100%',
    height: 150,
    borderRadius: 8,
    marginBottom: 8,
    backgroundColor: '#f0f0f0',
  }
});
