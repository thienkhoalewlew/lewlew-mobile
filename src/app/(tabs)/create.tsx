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
import { Camera, MapPin, X, Image as ImageIcon } from 'lucide-react-native';

import { Button } from '../../components/Button';
import { usePostStore } from '../../store/postStore';
import { useLocationStore } from '../../store/locationStore';
import { useAuthStore } from '../../store/authStore';
import { colors } from '../../constants/colors';

export default function CreatePostScreen() {
  const router = useRouter();
  const { createPost, isLoading } = usePostStore();
  const { currentLocation, getCurrentLocation } = useLocationStore();
  const { user } = useAuthStore();
  
  const [image, setImage] = useState<string | null>(null);
  const [caption, setCaption] = useState('');
  const [locationName, setLocationName] = useState('');
  
  useEffect(() => {
    if (!currentLocation) {
      getCurrentLocation();
    }
  }, []);
  
  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
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
      Alert.alert('Permission needed', 'Camera permission is required to take photos');
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
    if (!user) {
      Alert.alert('Error', 'You must be logged in to create a post');
      return;
    }
    
    if (!image) {
      Alert.alert('Missing image', 'Please select or take a photo');
      return;
    }
    
    if (!caption.trim()) {
      Alert.alert('Missing caption', 'Please add a caption to your post');
      return;
    }
    
    if (!locationName.trim()) {
      Alert.alert('Missing location', 'Please add a location name');
      return;
    }
    
    if (!currentLocation) {
      Alert.alert('Location unavailable', 'Unable to get your current location');
      return;
    }
    
    try {
      await createPost({
        userId: user.id,
        imageUrl: image,
        caption,
        location: {
          latitude: currentLocation.latitude,
          longitude: currentLocation.longitude,
          name: locationName,
        },
      });
      
      // Reset form
      setImage(null);
      setCaption('');
      setLocationName('');
      
      // Navigate to home
      router.push('/(tabs)');
    } catch (error) {
      Alert.alert('Error', 'Failed to create post');
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['right', 'left']}>
      <StatusBar style="dark" />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoidingView}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <Text style={styles.title}>Create New Post</Text>
          
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
                <Text style={styles.imagePickerText}>Choose from gallery</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.imagePickerButton}
                onPress={takePhoto}
              >
                <Camera size={32} color={colors.primary} />
                <Text style={styles.imagePickerText}>Take a photo</Text>
              </TouchableOpacity>
            </View>
          )}
          
          <View style={styles.formGroup}>
            <Text style={styles.label}>Caption</Text>
            <TextInput
              style={styles.input}
              placeholder="Write a caption..."
              value={caption}
              onChangeText={setCaption}
              multiline
              maxLength={500}
            />
          </View>
          
          <View style={styles.formGroup}>
            <Text style={styles.label}>Location</Text>
            <View style={styles.locationInputContainer}>
              <MapPin size={20} color={colors.textLight} style={styles.locationIcon} />
              <TextInput
                style={styles.locationInput}
                placeholder="Add location name"
                value={locationName}
                onChangeText={setLocationName}
              />
            </View>
            <Text style={styles.locationInfo}>
              {currentLocation 
                ? `Using your current location (${currentLocation.latitude.toFixed(4)}, ${currentLocation.longitude.toFixed(4)})` 
                : 'Getting your location...'}
            </Text>
          </View>
          
          <Button
            title="Share Post"
            onPress={handleCreatePost}
            isLoading={isLoading}
            disabled={!image || !caption.trim() || !locationName.trim() || !currentLocation}
            style={styles.shareButton}
          />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  title: {
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
  locationInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    paddingHorizontal: 12,
  },
  locationIcon: {
    marginRight: 8,
  },
  locationInput: {
    flex: 1,
    padding: 12,
    fontSize: 16,
    color: colors.text,
  },
  locationInfo: {
    fontSize: 12,
    color: colors.textLight,
    marginTop: 4,
  },
  shareButton: {
    marginTop: 16,
  },
});