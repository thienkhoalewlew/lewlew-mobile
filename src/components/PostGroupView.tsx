import React from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { X } from 'lucide-react-native';
import { PostCard } from './PostCard';
import { Post } from '../types';
import { colors } from '../constants/colors';

interface PostGroupViewProps {
  posts: Post[];
  onClose: () => void;
  onSelectPost: (post: Post) => void;
}

export const PostGroupView: React.FC<PostGroupViewProps> = ({
  posts,
  onClose,
  onSelectPost,
}) => {
  const locationName = posts[0]?.location?.name || 'Unknown location';
  const renderPost = ({ item: post }: { item: Post }) => (
    <View style={styles.postItemContainer}>
      <TouchableOpacity
        style={styles.postItem}
        onPress={() => onSelectPost(post)}
        activeOpacity={0.8}
      >
        <PostCard 
          post={post} 
          showActions={false} 
        />
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.headerTitle}>{locationName}</Text>
          <Text style={styles.headerSubtitle}>
            {posts.length} {posts.length === 1 ? 'photo' : 'photos'}
          </Text>
        </View>
        <TouchableOpacity style={styles.closeButton} onPress={onClose} activeOpacity={0.7}>
          <X size={24} color={colors.text} />
        </TouchableOpacity>
      </View>
      
      <FlatList
        data={posts}
        renderItem={renderPost}
        keyExtractor={(item) => item.id}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.listContainer}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.card,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    maxHeight: '60%',
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  headerLeft: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: colors.textLight,
  },
  closeButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: colors.lightGray,
  },  listContainer: {
    paddingBottom: 16,
  },
  postItemContainer: {
    marginBottom: 12,
  },
  postItem: {
    width: 280, // Fixed width for horizontal scroll
    marginBottom: 8,
  },  separator: {
    width: 12,
  },
});
