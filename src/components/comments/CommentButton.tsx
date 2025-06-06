import React from 'react';
import { TouchableOpacity, Text, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useCommentStore } from '../../store/commentStore';

interface CommentButtonProps {
  postId: string;
  commentCount?: number;
  size?: 'small' | 'medium' | 'large';
  showCount?: boolean;
  color?: string;
}

export const CommentButton: React.FC<CommentButtonProps> = ({ 
  postId, 
  commentCount = 0,
  size = 'medium',
  showCount = true,
  color = '#666'
}) => {
  const { comments } = useCommentStore();

  // Get actual comment count from store
  const actualCommentCount = comments[postId]?.length || commentCount;

  const iconSize = size === 'small' ? 16 : size === 'large' ? 24 : 24; // Changed medium from 20 to 24
  const textSize = size === 'small' ? 12 : size === 'large' ? 16 : 14;
  const handlePress = () => {
    // Navigation functionality removed
    // Comment button now just displays count without navigation
  };
  return (
    <TouchableOpacity 
      style={[styles.button, styles[size]]} 
      onPress={handlePress}
      activeOpacity={0.7}
    >
      <View style={styles.content}>
        <Ionicons 
          name="chatbubble-outline" 
          size={iconSize} 
          color={color} 
        />
        {showCount && actualCommentCount > 0 && (
          <Text style={[styles.count, { fontSize: textSize }]}>
            {actualCommentCount}
          </Text>
        )}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    padding: 4, // Reduced padding to bring icon closer
    borderRadius: 8,
  },
  small: {
    padding: 4,
  },
  medium: {
    padding: 4, // Reduced padding for medium size
  },
  large: {
    padding: 12,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  count: {
    marginLeft: 6,
    color: '#666',
    fontWeight: '500',
  },
});
