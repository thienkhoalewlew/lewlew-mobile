import React, { useState } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  StyleSheet, 
  Image,
  Alert,
  ActivityIndicator 
} from 'react-native';
import { useCommentStore } from '../../store/commentStore';
import { useAuthStore } from '../../store/authStore';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useTranslation } from '../../i18n';

interface CreateCommentProps {
  postId: string;
  onCommentCreated?: () => void;
}

export const CreateComment: React.FC<CreateCommentProps> = ({ postId, onCommentCreated }) => {
  const [text, setText] = useState('');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const { createComment, loading } = useCommentStore();
  const { user } = useAuthStore();
  const { t } = useTranslation();
  const handleImagePicker = async () => {
    try {
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (permissionResult.granted === false) {
        Alert.alert(t('posts.permissionRequired'), t('posts.permissionCameraRoll'));
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setSelectedImage(result.assets[0].uri);
      }
    } catch (error) {
      Alert.alert(t('common.error'), t('posts.imagePickError'));
    }
  };  const handleSubmit = async () => {
    if (!text.trim() && !selectedImage) {
      Alert.alert(t('common.error'), t('posts.commentCreateError'));
      return;
    }

    setIsSubmitting(true);
    
    try {
      const success = await createComment({
        postId,
        text: text.trim() || undefined,
        image: selectedImage || undefined,
      });

      if (success) {
        setText('');
        setSelectedImage(null);
        onCommentCreated?.();
        Alert.alert(t('common.success'), t('posts.commentCreateSuccess'));
      } else {
        Alert.alert(t('common.error'), t('posts.commentCreateFailed'));
      }
    } catch (error) {
      console.error('Create comment error:', error);
      Alert.alert(t('common.error'), t('posts.commentCreateUnexpected'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const removeImage = () => {
    setSelectedImage(null);
  };

  const canSubmit = (text.trim() || selectedImage) && !isSubmitting && !loading;

  return (
    <View style={styles.container}>
      {/* User Avatar */}
      <Image
        source={{ 
          uri: user?.avatar || 'https://via.placeholder.com/40x40?text=Avatar' 
        }}
        style={styles.avatar}
      />

      <View style={styles.inputContainer}>
        {/* Selected Image Preview */}
        {selectedImage && (
          <View style={styles.imagePreview}>
            <Image source={{ uri: selectedImage }} style={styles.previewImage} />
            <TouchableOpacity onPress={removeImage} style={styles.removeImageButton}>
              <Ionicons name="close-circle" size={24} color="#FF6B6B" />
            </TouchableOpacity>
          </View>
        )}

        {/* Text Input */}
        <View style={styles.inputRow}>
          <TextInput
            style={styles.textInput}
            placeholder={t('posts.writeComment')}
            value={text}
            onChangeText={setText}
            multiline
            maxLength={500}
          />
          
          {/* Action Buttons */}
          <View style={styles.actionButtons}>
            <TouchableOpacity onPress={handleImagePicker} style={styles.imageButton}>
              <Ionicons name="image-outline" size={20} color="#666" />
            </TouchableOpacity>
            
            <TouchableOpacity 
              onPress={handleSubmit} 
              style={[styles.submitButton, !canSubmit && styles.disabledButton]}
              disabled={!canSubmit}
            >
              {isSubmitting || loading ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Ionicons name="send" size={16} color="#FFFFFF" />
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    padding: 12,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E5E5E5',
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    marginRight: 12,
  },
  inputContainer: {
    flex: 1,
  },
  imagePreview: {
    position: 'relative',
    marginBottom: 8,
  },
  previewImage: {
    width: 100,
    height: 100,
    borderRadius: 8,
  },
  removeImageButton: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  textInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#E5E5E5',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    maxHeight: 100,
    fontSize: 14,
    backgroundColor: '#F8F9FA',
  },
  actionButtons: {
    flexDirection: 'row',
    marginLeft: 8,
  },
  imageButton: {
    padding: 8,
    marginRight: 4,
  },
  submitButton: {
    backgroundColor: '#007AFF',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    justifyContent: 'center',
    alignItems: 'center',
    minWidth: 40,
  },
  disabledButton: {
    backgroundColor: '#CCC',
  },
});
