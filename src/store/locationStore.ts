import { create } from 'zustand';
import * as Location from 'expo-location';
import { LocationState } from '../types';
import { Platform } from 'react-native';

export const useLocationStore = create<LocationState>((set) => ({
  currentLocation: null,
  isLoading: false,
  error: null,

  getCurrentLocation: async () => {
    set({ isLoading: true, error: null });
    
    try {
      if (Platform.OS === 'web') {
        // Use browser geolocation API for web
        const position = await new Promise<GeolocationPosition>((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, {
            enableHighAccuracy: true,
            timeout: 15000,
            maximumAge: 10000,
          });
        });
        
        set({
          currentLocation: {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          },
          isLoading: false,
        });
      } else {
        // Use Expo Location for native platforms
        const { status } = await Location.requestForegroundPermissionsAsync();
        
        if (status !== 'granted') {
          throw new Error('Permission to access location was denied');
        }
        
        const location = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });
        
        set({
          currentLocation: {
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
          },
          isLoading: false,
        });
      }
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to get location', 
        isLoading: false 
      });
    }
  }
}));