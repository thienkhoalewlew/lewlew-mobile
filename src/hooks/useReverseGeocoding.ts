import { useState, useEffect, useCallback } from 'react';
import { useLocationStore } from '../store/locationStore';
import { GeocodingService, GeocodingResult } from '../services/geocodingService';
import { LocationHistoryService } from '../services/locationHistoryService';

interface UseReverseGeocodingOptions {
  autoUpdate?: boolean;
  onLocationNameChange?: (name: string | null) => void;
  addressLevel?: 'minimal' | 'short' | 'detailed' | 'full';
}

export const useReverseGeocoding = (options: UseReverseGeocodingOptions = {}) => {
  const { autoUpdate = true, onLocationNameChange, addressLevel = 'detailed' } = options;
  const { currentLocation, getCurrentLocation } = useLocationStore();
  
  const [isLoading, setIsLoading] = useState(false);
  const [locationName, setLocationName] = useState<string | null>(null);
  const [geocodingResult, setGeocodingResult] = useState<GeocodingResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  // Reverse geocode function
  const reverseGeocode = useCallback(async (latitude?: number, longitude?: number) => {
    const lat = latitude ?? currentLocation?.latitude;
    const lng = longitude ?? currentLocation?.longitude;
    
    if (!lat || !lng) {
      setError('No coordinates available');
      return null;
    }

    setIsLoading(true);
    setError(null);
    
    try {
      // Use the improved geocoding with fallback
      const result = await GeocodingService.reverseGeocodeWithFallback(lat, lng);
      if (result) {
        // Debug log
        console.log('=== Geocoding Result Debug ===');
        console.log('Street Number:', result.streetNumber);
        console.log('Street:', result.street);
        console.log('District:', result.district);
        console.log('City:', result.city);
        console.log('Region:', result.region);
        console.log('Formatted Address:', result.formattedAddress);
        console.log('============================');
          // Use the specified address level
        const formattedAddress = GeocodingService.getAddressByLevel(result, addressLevel);
        // For location input, prefer the formatted address for better display
        const displayAddress = result.formattedAddress || formattedAddress;
        setLocationName(displayAddress);
        setGeocodingResult(result);
        onLocationNameChange?.(displayAddress);
        
        // Add to location history
        await LocationHistoryService.addToHistory(
          formattedAddress,
          lat,
          lng,
          true // Auto-detected location
        );
        
        return formattedAddress;
      } else {
        setError('Could not determine location name');
        return null;
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to get location name';
      setError(errorMessage);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [currentLocation, onLocationNameChange]);

  // Refresh current location and reverse geocode
  const refreshLocation = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      await getCurrentLocation();
      // The reverse geocoding will be triggered by the useEffect below
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to get current location';
      setError(errorMessage);
      setIsLoading(false);
    }
  }, [getCurrentLocation]);

  // Auto reverse geocode when location changes
  useEffect(() => {
    if (autoUpdate && currentLocation && !isLoading) {
      reverseGeocode();
    }
  }, [currentLocation, autoUpdate, reverseGeocode, isLoading]);
  // Get detailed address
  const getDetailedAddress = useCallback(() => {
    return geocodingResult ? GeocodingService.getDetailedAddress(geocodingResult) : null;
  }, [geocodingResult]);

  // Get short address
  const getShortAddress = useCallback(() => {
    return geocodingResult ? GeocodingService.getShortAddress(geocodingResult) : null;
  }, [geocodingResult]);

  // Get precise address (with street number and name)
  const getPreciseAddress = useCallback(() => {
    return geocodingResult ? GeocodingService.getPreciseAddress(geocodingResult) : null;
  }, [geocodingResult]);

  // Get address by specific level
  const getAddressByLevel = useCallback((level: 'minimal' | 'short' | 'detailed' | 'full') => {
    return geocodingResult ? GeocodingService.getAddressByLevel(geocodingResult, level) : null;
  }, [geocodingResult]);

  return {
    // State
    isLoading,
    locationName,
    geocodingResult,
    error,
    currentLocation,
    
    // Actions
    reverseGeocode,
    refreshLocation,
    getDetailedAddress,
    getShortAddress,
    getPreciseAddress,
    getAddressByLevel,
    
    // Helper functions
    clearError: () => setError(null),
    setLocationName,
  };
};
