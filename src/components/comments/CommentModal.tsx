import React, { useEffect } from 'react';
import { 
  View, 
  Modal, 
  StyleSheet, 
  TouchableOpacity, 
  Text,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform 
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { CommentList } from './CommentList';
import { CreateComment } from './CreateComment';
import { useCommentStore } from '../../store/commentStore';

interface CommentModalProps {
  visible: boolean;
  postId: string;
  onClose: () => void;
}

export const CommentModal: React.FC<CommentModalProps> = ({ 
  visible, 
  postId, 
  onClose 
}) => {
  const { comments, getComments } = useCommentStore();
  const commentCount = comments[postId]?.length || 0;
  
  useEffect(() => {
    if (visible && postId) {
      getComments(postId);
    }
  }, [visible, postId, getComments]);

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="formSheet"
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.container}>
        <KeyboardAvoidingView 
          style={styles.keyboardAvoid}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>
              Comments {commentCount > 0 && `(${commentCount})`}
            </Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color="#333" />
            </TouchableOpacity>
          </View>          {/* Comment List */}
          <View style={styles.content}>
            <CommentList postId={postId} showCreateComment={false} />
          </View>

          {/* Create Comment */}
          <CreateComment 
            postId={postId} 
            onCommentCreated={() => {
              getComments(postId);
            }}
          />
        </KeyboardAvoidingView>
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  keyboardAvoid: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  closeButton: {
    padding: 4,
  },
  content: {
    flex: 1,
  },
});
