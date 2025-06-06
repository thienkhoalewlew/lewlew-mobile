import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  Modal,
  Alert,
  Dimensions,
  ScrollView
} from 'react-native';
import { X, Trash2, Download, Share, Grid, Calendar, Folder } from 'lucide-react-native';
import { colors } from '../constants/colors';
import { getUserUploadedImages, deleteUploadedImage, getUserImagesByType } from '../services/userService';

const { width: screenWidth } = Dimensions.get('window');
const ITEM_SIZE = (screenWidth - 48) / 3; // 3 columns with 16px margins

interface UploadedImage {
  _id: string;
  filename: string;
  originalname: string;
  mimetype: string;
  path: string;
  size: number;
  status: string;
  metadata?: {
    type: 'user_avatar' | 'post_image' | 'comment_image';
    postId?: string;
    commentId?: string;
    cloudinaryData?: any;
  };
  createdAt: string;
  updatedAt: string;
}

interface ImageGalleryProps {
  visible: boolean;
  onClose: () => void;
  onImageSelect?: (image: UploadedImage) => void;
  filterType?: 'all' | 'user_avatar' | 'post_image' | 'comment_image';
  selectionMode?: boolean;
}

const ImageGallery: React.FC<ImageGalleryProps> = ({
  visible,
  onClose,
  onImageSelect,
  filterType = 'all',
  selectionMode = false
}) => {
  const [images, setImages] = useState<UploadedImage[]>([]);
  const [filteredImages, setFilteredImages] = useState<UploadedImage[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedImage, setSelectedImage] = useState<UploadedImage | null>(null);
  const [currentFilter, setCurrentFilter] = useState<string>(filterType);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (visible) {
      loadImages();
    }
  }, [visible]);

  useEffect(() => {
    applyFilter();
  }, [images, currentFilter]);

  const loadImages = async () => {
    setLoading(true);
    try {
      const userImages = await getUserUploadedImages();
      setImages(userImages.sort((a, b) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      ));
    } catch (error) {
      console.error('Error loading images:', error);
      Alert.alert('Error', 'Failed to load images');
    } finally {
      setLoading(false);
    }
  };

  const applyFilter = () => {
    if (currentFilter === 'all') {
      setFilteredImages(images);
    } else {
      const filtered = images.filter(image => 
        image.metadata?.type === currentFilter
      );
      setFilteredImages(filtered);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadImages();
    setRefreshing(false);
  };

  const handleImagePress = (image: UploadedImage) => {
    if (selectionMode && onImageSelect) {
      onImageSelect(image);
      onClose();
    } else {
      setSelectedImage(image);
    }
  };

  const handleDeleteImage = async (imageId: string) => {
    Alert.alert(
      'Delete Image',
      'Are you sure you want to delete this image? This action cannot be undone.',
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
              const result = await deleteUploadedImage(imageId);
              if (result.success) {
                setImages(prev => prev.filter(img => img._id !== imageId));
                setSelectedImage(null);
                Alert.alert('Success', 'Image deleted successfully');
              } else {
                Alert.alert('Error', result.message);
              }
            } catch (error) {
              Alert.alert('Error', 'Failed to delete image');
            }
          },
        },
      ]
    );
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getImageTypeLabel = (type?: string): string => {
    switch (type) {
      case 'user_avatar':
        return 'Avatar';
      case 'post_image':
        return 'Post';
      case 'comment_image':
        return 'Comment';
      default:
        return 'Unknown';
    }
  };

  const renderImageItem = ({ item }: { item: UploadedImage }) => (
    <TouchableOpacity
      style={styles.imageItem}
      onPress={() => handleImagePress(item)}
      activeOpacity={0.7}
    >
      <Image source={{ uri: item.path }} style={styles.imageThumb} />
      <View style={styles.imageOverlay}>
        <Text style={styles.imageType}>
          {getImageTypeLabel(item.metadata?.type)}
        </Text>
      </View>
    </TouchableOpacity>
  );

  const renderFilterButton = (filter: string, label: string, icon: React.ReactNode) => (
    <TouchableOpacity
      style={[
        styles.filterButton,
        currentFilter === filter && styles.filterButtonActive
      ]}
      onPress={() => setCurrentFilter(filter)}
    >
      {icon}
      <Text style={[
        styles.filterButtonText,
        currentFilter === filter && styles.filterButtonTextActive
      ]}>
        {label}
      </Text>
    </TouchableOpacity>
  );

  const renderImageDetail = () => {
    if (!selectedImage) return null;

    return (
      <Modal
        visible={!!selectedImage}
        animationType="fade"
        transparent
        onRequestClose={() => setSelectedImage(null)}
      >
        <View style={styles.imageDetailOverlay}>
          <View style={styles.imageDetailContainer}>
            <View style={styles.imageDetailHeader}>
              <Text style={styles.imageDetailTitle}>Image Details</Text>
              <TouchableOpacity
                style={styles.closeDetailButton}
                onPress={() => setSelectedImage(null)}
              >
                <X size={24} color={colors.text} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.imageDetailContent}>
              <Image
                source={{ uri: selectedImage.path }}
                style={styles.imageDetailPreview}
                resizeMode="contain"
              />

              <View style={styles.imageInfo}>
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>File Name:</Text>
                  <Text style={styles.infoValue}>{selectedImage.originalname}</Text>
                </View>
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Type:</Text>
                  <Text style={styles.infoValue}>
                    {getImageTypeLabel(selectedImage.metadata?.type)}
                  </Text>
                </View>
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Size:</Text>
                  <Text style={styles.infoValue}>{formatFileSize(selectedImage.size)}</Text>
                </View>
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Format:</Text>
                  <Text style={styles.infoValue}>{selectedImage.mimetype}</Text>
                </View>
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Upload Date:</Text>
                  <Text style={styles.infoValue}>{formatDate(selectedImage.createdAt)}</Text>
                </View>
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Status:</Text>
                  <Text style={[
                    styles.infoValue,
                    { color: selectedImage.status === 'active' ? colors.success : colors.error }
                  ]}>
                    {selectedImage.status}
                  </Text>
                </View>
              </View>

              <View style={styles.imageActions}>
                <TouchableOpacity
                  style={[styles.actionButton, styles.deleteButton]}
                  onPress={() => handleDeleteImage(selectedImage._id)}
                >
                  <Trash2 size={20} color="white" />
                  <Text style={styles.deleteButtonText}>Delete</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    );
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>
            {selectionMode ? 'Select Image' : 'My Images'}
          </Text>
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <X size={24} color={colors.text} />
          </TouchableOpacity>
        </View>

        {!selectionMode && (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.filterContainer}
            contentContainerStyle={styles.filterContent}
          >
            {renderFilterButton('all', 'All', <Grid size={16} color={currentFilter === 'all' ? 'white' : colors.textLight} />)}
            {renderFilterButton('user_avatar', 'Avatars', <Folder size={16} color={currentFilter === 'user_avatar' ? 'white' : colors.textLight} />)}
            {renderFilterButton('post_image', 'Posts', <Calendar size={16} color={currentFilter === 'post_image' ? 'white' : colors.textLight} />)}
            {renderFilterButton('comment_image', 'Comments', <Share size={16} color={currentFilter === 'comment_image' ? 'white' : colors.textLight} />)}
          </ScrollView>
        )}

        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={styles.loadingText}>Loading images...</Text>
          </View>
        ) : filteredImages.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Grid size={48} color={colors.textLight} />
            <Text style={styles.emptyTitle}>No Images Found</Text>
            <Text style={styles.emptyText}>
              {currentFilter === 'all' 
                ? 'Upload some images to see them here'
                : `No ${getImageTypeLabel(currentFilter).toLowerCase()} images found`
              }
            </Text>
          </View>
        ) : (
          <FlatList
            data={filteredImages}
            renderItem={renderImageItem}
            keyExtractor={(item) => item._id}
            numColumns={3}
            contentContainerStyle={styles.imageGrid}
            refreshing={refreshing}
            onRefresh={handleRefresh}
            showsVerticalScrollIndicator={false}
          />
        )}

        {renderImageDetail()}
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
  },
  closeButton: {
    padding: 8,
  },
  filterContainer: {
    maxHeight: 60,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  filterContent: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginRight: 8,
    backgroundColor: colors.card,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
  },
  filterButtonActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  filterButtonText: {
    marginLeft: 6,
    fontSize: 14,
    color: colors.textLight,
  },
  filterButtonTextActive: {
    color: 'white',
  },
  imageGrid: {
    padding: 16,
  },
  imageItem: {
    width: ITEM_SIZE,
    height: ITEM_SIZE,
    marginRight: 8,
    marginBottom: 8,
    borderRadius: 8,
    overflow: 'hidden',
    position: 'relative',
  },
  imageThumb: {
    width: '100%',
    height: '100%',
  },
  imageOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: 6,
    paddingVertical: 4,
  },
  imageType: {
    color: 'white',
    fontSize: 10,
    fontWeight: '500',
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
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: colors.textLight,
    textAlign: 'center',
    lineHeight: 20,
  },
  // Image Detail Modal Styles
  imageDetailOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageDetailContainer: {
    width: '90%',
    maxHeight: '90%',
    backgroundColor: colors.background,
    borderRadius: 12,
    overflow: 'hidden',
  },
  imageDetailHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  imageDetailTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
  },
  closeDetailButton: {
    padding: 8,
  },
  imageDetailContent: {
    flex: 1,
  },
  imageDetailPreview: {
    width: '100%',
    height: 200,
    backgroundColor: colors.card,
  },
  imageInfo: {
    padding: 16,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  infoLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.text,
    flex: 1,
  },
  infoValue: {
    fontSize: 14,
    color: colors.textLight,
    flex: 2,
    textAlign: 'right',
  },
  imageActions: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    marginBottom: 8,
  },
  deleteButton: {
    backgroundColor: colors.error,
  },
  deleteButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '500',
    marginLeft: 8,
  },
});

export default ImageGallery;
