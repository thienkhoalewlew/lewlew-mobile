import React from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { X, Navigation } from 'lucide-react-native';
import { PostCard } from './PostCard';
import { Post } from '../types';
import { colors } from '../constants/colors';
import { useRouter } from 'expo-router';
import { useTranslation } from '../i18n';

interface PostGroupViewProps {
  posts: Post[];
  onClose: () => void;
  onSelectPost: (post: Post) => void;
  onFindLocation?: (post: Post) => void;
}

export const PostGroupView: React.FC<PostGroupViewProps> = ({
  posts,
  onClose,
  onSelectPost,
  onFindLocation,
}) => {  const router = useRouter();
  const { t } = useTranslation();
  const locationName = posts[0]?.location?.name || t('map.unknownLocation');
  
  const handleViewLocation = () => {
    if (posts.length === 0) return;
    
    if (onFindLocation) {
      onFindLocation(posts[0]);
      onClose();
    } else {
      const firstPost = posts[0];
      router.push({
        pathname: '/(tabs)/map',
        params: { 
          postId: firstPost.id,
          latitude: firstPost.location.latitude,
          longitude: firstPost.location.longitude
        }
      });
    }
  };

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
            {posts.length} {posts.length === 1 ? t('map.photo') : t('map.photos')}
          </Text>
        </View>
        <View style={styles.headerRight}>
          <TouchableOpacity 
            style={styles.findLocationButton} 
            onPress={handleViewLocation}
            activeOpacity={0.7}
          >
            <Navigation size={20} color="white" />
            <Text style={styles.findLocationText}>{t('map.findLocation')}</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.closeButton} 
            onPress={onClose} 
            activeOpacity={0.7}
          >
            <X size={24} color={colors.text} />
          </TouchableOpacity>
        </View>
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
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
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
  listContainer: {
    paddingBottom: 16,
  },
  postItemContainer: {
    marginBottom: 12,
  },
  postItem: {
    width: 280, // Fixed width for horizontal scroll
    marginBottom: 8,
  },
  separator: {
    width: 12,
  },
});
