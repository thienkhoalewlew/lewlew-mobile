import { create } from 'zustand';
import * as Location from 'expo-location';
import { LocationState } from '../types';
import { Platform } from 'react-native';
import { GeocodingService } from '../services/geocodingService';

export const useLocationStore = create<LocationState>((set, get) => ({
  currentLocation: null,
  currentLocationName: null,
  isLoading: false,
  error: null,  getCurrentLocation: async () => {
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
        
        const location = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        };
        
        set({
          currentLocation: location,
          isLoading: false,
        });

        // Automatically get location name
        const locationName = await get().reverseGeocode(location.latitude, location.longitude);
        set({ currentLocationName: locationName });
      } else {
        // Use Expo Location for native platforms
        const { status } = await Location.requestForegroundPermissionsAsync();
        
        if (status !== 'granted') {
          throw new Error('Permission to access location was denied');
        }
        
        const location = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });
        
        const currentLocation = {
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
        };
        
        set({
          currentLocation,
          isLoading: false,
        });

        // Automatically get location name
        const locationName = await get().reverseGeocode(currentLocation.latitude, currentLocation.longitude);
        set({ currentLocationName: locationName });
      }    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to get location', 
        isLoading: false 
      });
    }
  },
  reverseGeocode: async (latitude: number, longitude: number): Promise<string | null> => {
    try {
      const result = await GeocodingService.reverseGeocode(latitude, longitude);
      return result ? GeocodingService.getShortAddress(result) : null;
    } catch (error) {
      console.warn('Reverse geocoding failed:', error);
      return null;
    }
  }
}));