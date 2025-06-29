import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  Image,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert
} from 'react-native';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { Camera, X } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button } from '../../components/Button';
import { LocationInput } from '../../components/LocationInput';
import { usePostStore } from '../../store/postStore';
import { useAuthStore } from '../../store/authStore';
import { useReverseGeocoding } from '../../hooks/useReverseGeocoding';
import { LocationHistoryService } from '../../services/locationHistoryService';
import { colors } from '../../constants/colors';
import { useTranslation } from '../../i18n';

export default function CreatePostScreen() {
  const router = useRouter();
  const { createPost, isLoading } = usePostStore();
  const { user } = useAuthStore();
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const [image, setImage] = useState<string | null>(null);
  const [imageAspectRatio, setImageAspectRatio] = useState<number>(1);
  const [caption, setCaption] = useState('');
  const [locationNameInput, setLocationNameInput] = useState('');
  const {
    isLoading: isLoadingLocation,
    locationName: autoDetectedLocationName,
    currentLocation,
    refreshLocation,
    error: locationError,
    geocodingResult,
  } = useReverseGeocoding({
    autoUpdate: true,
    addressLevel: 'detailed', // Use enhanced detailed level for complete address info
    onLocationNameChange: (name) => {
      if (name && !locationNameInput) {
        setLocationNameInput(name);
      }
    },
  });
  const locationName = locationNameInput || autoDetectedLocationName || '';
  
  // Remove pickImage function and only keep takePhoto
  
  const takePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
      Alert.alert(t('posts.permissionNeeded'), t('posts.cameraPermissionRequired'));
      return;
    }
    
    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: false,
      quality: 1,
    });
    
    if (!result.canceled) {
      const imageUri = result.assets[0].uri;
      setImage(imageUri);
      
      Image.getSize(imageUri, (width, height) => {
        setImageAspectRatio(width / height);
      }, (error) => {
        console.log('Error getting image size:', error);
        setImageAspectRatio(1);
      });
    }
  };
  
  const clearImage = () => {
    setImage(null);
    setImageAspectRatio(1); // Reset aspect ratio
  };
  const handleCreatePost = async () => {
    // Prevent multiple submissions
    if (isLoading) {
      return;
    }
    if (!user) {
      Alert.alert(t('common.error'), t('posts.mustBeLoggedIn'));
      return;
    }
    
    if (!image) {
      Alert.alert(t('posts.missingImage'), t('posts.pleaseSelectPhoto'));
      return;
    }
    
    if (!caption.trim()) {
      Alert.alert(t('posts.missingCaption'), t('posts.pleaseAddCaption'));
      return;
    }
    
    if (!locationName.trim()) {
      Alert.alert(t('posts.missingLocation'), t('posts.pleaseAddLocation'));
      return;
    }
      if (!currentLocation) {
      Alert.alert(t('posts.locationUnavailable'), t('posts.unableToGetLocation'));
      return;
    }

    // Show 24h expiry notice BEFORE posting
    Alert.alert(
      t('posts.postExpiryNotice'), 
      t('posts.postExpiryMessage'),
      [
        {
          text: t('common.cancel'),
          style: 'cancel',
        },
        {
          text: t('common.ok'),
          onPress: () => performCreatePost(),
        }
      ]
    );
  };

  const performCreatePost = async () => {
    // Double check required data again
    if (!user || !image || !caption.trim() || !locationName.trim() || !currentLocation) {
      Alert.alert(t('common.error'), t('posts.createPostError'));
      return;
    }

    try {
      // Create post using service directly since store interface doesn't match
      const postData = {
        userId: user.id,
        imageUrl: image,
        caption,
        location: {
          latitude: currentLocation.latitude,
          longitude: currentLocation.longitude,
          name: locationName,
        },
      };
      
      const result = await createPost(postData as any); // Use any to bypass interface mismatch
      if (!result) {
        Alert.alert(t('common.error'), t('posts.createPostError'));
        return;
      }      // Save location to history after successful post creation
      await LocationHistoryService.addToHistory(
        locationName,
        currentLocation.latitude,
        currentLocation.longitude,
        locationName === autoDetectedLocationName
      );      // Reset form
      setImage(null);
      setCaption('');
      setLocationNameInput('');
      
      // Show success message  
      Alert.alert(t('common.success'), t('posts.createPostSuccess'));

      // Navigate to home
      router.push('/(tabs)');
    } catch (error) {
      Alert.alert(t('common.error'), error instanceof Error ? error.message : t('posts.createPostError'));
    }
  };

  return (
  <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Text style={styles.title}>{t('posts.create')}</Text>
      </View>
      
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoidingView}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <Text style={styles.subtitle}>{t('posts.createNewPost')}</Text>
          
          {image ? (
            <View style={styles.imageContainer}>
              <Image 
                source={{ uri: image }} 
                style={[
                  styles.image, 
                  { aspectRatio: imageAspectRatio }
                ]} 
              />
              <TouchableOpacity 
                style={styles.clearImageButton}
                onPress={clearImage}
              >
                <X size={20} color="white" />
              </TouchableOpacity>
            </View>
            ) : (
            <View style={styles.imagePickerContainer}>
              <TouchableOpacity 
                style={styles.cameraOnlyButton}
                onPress={takePhoto}
              >
                <Camera size={48} color={colors.primary} />
                <Text style={styles.imagePickerText}>{t('posts.takeAPhoto')}</Text>
                <Text style={styles.imagePickerSubtext}>{t('posts.cameraOnly')}</Text>
              </TouchableOpacity>
            </View>
          )}
            <View style={styles.formGroup}>
            <Text style={styles.label}>{t('posts.caption')}</Text>
            <TextInput
              style={styles.input}
              placeholder={t('posts.writeCaptionPlaceholder')}
              value={caption}
              onChangeText={setCaption}
              multiline
              maxLength={500}
            />
          </View>
          <LocationInput
            currentLocation={currentLocation}
            currentLocationName={autoDetectedLocationName}
            locationName={locationName}
            onLocationNameChange={setLocationNameInput}
            onRefreshLocation={refreshLocation}
            isLoading={isLoadingLocation}
            geocodingResult={geocodingResult}
          />
            <Button
            title={t('posts.sharePost')}
            onPress={handleCreatePost}
            isLoading={isLoading}
            disabled={!image || !caption.trim() || !locationName.trim() || !currentLocation}
            style={styles.shareButton}
          />
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  subtitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 24,
    textAlign: 'center',
  },
  imageContainer: {
    position: 'relative',
    width: '100%',
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 24,
  },
  image: {
    width: '100%',
    height: undefined,
    aspectRatio: 1,
    resizeMode: 'contain',
  },
  clearImageButton: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  imagePickerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  imagePickerButton: {
    flex: 1,
    height: 120,
    backgroundColor: colors.card,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 8,
    borderWidth: 1,
    borderColor: colors.border,
    borderStyle: 'dashed',
  },  imagePickerText: {
    marginTop: 8,
    color: colors.primary,
    fontWeight: '500',
  },
  imagePickerSubtext: {
    marginTop: 4,
    color: colors.textLight,
    fontSize: 12,
    textAlign: 'center',
  },
  cameraOnlyButton: {
    width: '100%',
    height: 150,
    backgroundColor: colors.card,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.primary,
    borderStyle: 'dashed',
  },
  formGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 8,
  },
  input: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: colors.text,
    minHeight: 100,
    textAlignVertical: 'top',
  },
  shareButton: {
    marginTop: 16,
  },
});