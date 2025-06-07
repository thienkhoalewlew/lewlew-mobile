import React, { useState, useEffect } from 'react';
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
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import * as ImagePicker from 'expo-image-picker';
import { Camera, X, Image as ImageIcon } from 'lucide-react-native';
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
  const [caption, setCaption] = useState('');
  const [locationNameInput, setLocationNameInput] = useState('');
  
  // Use reverse geocoding hook
  const {
    isLoading: isLoadingLocation,
    locationName: autoDetectedLocationName,
    currentLocation,
    refreshLocation,
    error: locationError,
  } = useReverseGeocoding({
    autoUpdate: true,
    onLocationNameChange: (name) => {
      if (name && !locationNameInput) {
        setLocationNameInput(name);
      }
    },
  });
  
  const locationName = locationNameInput || autoDetectedLocationName || '';
  
  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });
    
    if (!result.canceled) {
      setImage(result.assets[0].uri);
    }
  };
  
  const takePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
      Alert.alert(t('posts.permissionNeeded'), t('posts.cameraPermissionRequired'));
      return;
    }
    
    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });
    
    if (!result.canceled) {
      setImage(result.assets[0].uri);
    }
  };
  
  const clearImage = () => {
    setImage(null);
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

    try {
      const result = await createPost({
        userId: user.id,
        imageUrl: image,
        caption,
        location: {
          latitude: currentLocation.latitude,
          longitude: currentLocation.longitude,
          name: locationName,
        },
      });
      if (!result) {
        Alert.alert(t('common.error'), t('posts.createPostError'));
        return;
      }

      // Save location to history after successful post creation
      await LocationHistoryService.addToHistory(
        locationName,
        currentLocation.latitude,
        currentLocation.longitude,
        locationName === autoDetectedLocationName
      );

      // Reset form
      setImage(null);
      setCaption('');
      setLocationNameInput('');
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
              <Image source={{ uri: image }} style={styles.image} />
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
                style={styles.imagePickerButton}
                onPress={pickImage}
              >
                <ImageIcon size={32} color={colors.primary} />
                <Text style={styles.imagePickerText}>{t('posts.chooseFromGallery')}</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.imagePickerButton}
                onPress={takePhoto}
              >
                <Camera size={32} color={colors.primary} />
                <Text style={styles.imagePickerText}>{t('posts.takeAPhoto')}</Text>
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
    height: 300,
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 24,
  },
  image: {
    width: '100%',
    height: '100%',
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
  },
  imagePickerText: {
    marginTop: 8,
    color: colors.primary,
    fontWeight: '500',
  },  formGroup: {
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