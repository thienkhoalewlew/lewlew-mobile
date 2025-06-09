import * as Location from 'expo-location';
import { Platform } from 'react-native';

export interface GeocodingResult {
  name?: string;
  street?: string;
  streetNumber?: string;
  district?: string;
  city?: string;
  region?: string;
  country?: string;
  formattedAddress: string;
  postcode?: string;
}

/**
 * Reverse geocoding service that works across platforms
 */
export class GeocodingService {
  
  /**
   * Get formatted address from coordinates
   */
  static async reverseGeocode(latitude: number, longitude: number): Promise<GeocodingResult | null> {
    try {
      if (Platform.OS === 'web') {
        return await this.reverseGeocodeWeb(latitude, longitude);
      } else {
        return await this.reverseGeocodeNative(latitude, longitude);
      }
    } catch (error) {
      console.warn('Reverse geocoding failed:', error);
      return null;
    }
  }
  /**
   * Native platform reverse geocoding using Expo Location
   */
  private static async reverseGeocodeNative(latitude: number, longitude: number): Promise<GeocodingResult | null> {
    try {
      const reverseGeocodedLocation = await Location.reverseGeocodeAsync({
        latitude,
        longitude,
      });

      if (reverseGeocodedLocation && reverseGeocodedLocation.length > 0) {
        const location = reverseGeocodedLocation[0];
        
        return {
          name: location.name || undefined,
          street: location.street || undefined,
          streetNumber: location.streetNumber || undefined,
          district: location.district || undefined,
          city: location.city || undefined,
          region: location.region || undefined,
          country: location.country || undefined,
          postcode: location.postalCode || undefined,
          formattedAddress: this.formatAddress(location),
        };
      }
      
      return null;
    } catch (error) {
      throw error;
    }
  }
  /**
   * Web platform reverse geocoding using OpenStreetMap Nominatim
   * (Free alternative to Google Maps API)
   */
  private static async reverseGeocodeWeb(latitude: number, longitude: number): Promise<GeocodingResult | null> {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&addressdetails=1&zoom=18`
      );
      
      if (!response.ok) {
        throw new Error('Geocoding request failed');
      }
      
      const data = await response.json();
      
      if (data && data.address) {
        const addr = data.address;
        
        return {
          name: addr.amenity || addr.shop || addr.building || addr.tourism || addr.leisure || undefined,
          street: addr.road || addr.street || undefined,
          streetNumber: addr.house_number || undefined,
          district: addr.suburb || addr.district || addr.neighbourhood || addr.quarter || undefined,
          city: addr.city || addr.town || addr.village || addr.municipality || undefined,
          region: addr.state || addr.province || addr.county || undefined,
          country: addr.country || undefined,
          postcode: addr.postcode || undefined,
          formattedAddress: data.display_name || 'Unknown location',
        };
      }
      
      return null;
    } catch (error) {
      throw error;
    }
  }
  /**
   * Format address from location data
   */
  private static formatAddress(location: any): string {
    const addressParts = [];
    
    // Priority order for address components - include street number for more specificity
    if (location.streetNumber || location.house_number) {
      addressParts.push(location.streetNumber || location.house_number);
    }
    if (location.street || location.road) {
      addressParts.push(location.street || location.road);
    }
    if (location.name && !location.street && !location.road) {
      addressParts.push(location.name);
    }
    if (location.district || location.suburb || location.neighbourhood) {
      addressParts.push(location.district || location.suburb || location.neighbourhood);
    }
    if (location.city || location.town || location.village) {
      addressParts.push(location.city || location.town || location.village);
    }
    if (location.region || location.state || location.province) {
      addressParts.push(location.region || location.state || location.province);
    }
    
    // Return the most relevant parts (limit to 4 to include street details)
    const relevantParts = addressParts.slice(0, 4);
    return relevantParts.length > 0 ? relevantParts.join(', ') : 'Unknown location';
  }
  /**
   * Get short formatted address (for UI display)
   */
  static getShortAddress(result: GeocodingResult): string {
    const parts = [];
    
    // Build a more specific address starting with street info
    if (result.streetNumber && result.street) {
      parts.push(`${result.streetNumber} ${result.street}`);
    } else if (result.street) {
      parts.push(result.street);
    } else if (result.name) {
      parts.push(result.name);
    }
    
    // Add location context
    if (result.district) {
      parts.push(result.district);
    } else if (result.city) {
      parts.push(result.city);
    }
    
    // Add broader location if needed
    if (parts.length === 1 && result.city && !result.district) {
      parts.push(result.city);
    } else if (parts.length === 1 && result.region) {
      parts.push(result.region);
    }
    
    return parts.length > 0 ? parts.join(', ') : result.formattedAddress;
  }

  /**
   * Get detailed address (for full display)
   */
  static getDetailedAddress(result: GeocodingResult): string {
    return result.formattedAddress;
  }

  /**
   * Get precise address (includes street number and name)
   */
  static getPreciseAddress(result: GeocodingResult): string {
    const parts = [];
    
    // Build most detailed address
    if (result.streetNumber && result.street) {
      parts.push(`${result.streetNumber} ${result.street}`);
    } else if (result.street) {
      parts.push(result.street);
    }
    
    if (result.district) {
      parts.push(result.district);
    }
    
    if (result.city) {
      parts.push(result.city);
    }
    
    // If no street info, use name as fallback
    if (parts.length === 0 && result.name) {
      parts.push(result.name);
      if (result.city) parts.push(result.city);
    }
    
    return parts.length > 0 ? parts.join(', ') : result.formattedAddress;
  }

  /**
   * Get address with different levels of detail
   */
  static getAddressByLevel(result: GeocodingResult, level: 'minimal' | 'short' | 'detailed' | 'full'): string {
    switch (level) {
      case 'minimal':
        // Just street or name
        if (result.streetNumber && result.street) {
          return `${result.streetNumber} ${result.street}`;
        }
        return result.street || result.name || result.city || 'Unknown';
        
      case 'short':
        return this.getShortAddress(result);
        
      case 'detailed':
        return this.getPreciseAddress(result);
        
      case 'full':
        return result.formattedAddress;
        
      default:
        return this.getShortAddress(result);
    }
  }

  /**
   * Try multiple geocoding services for better accuracy
   */
  static async reverseGeocodeWithFallback(latitude: number, longitude: number): Promise<GeocodingResult | null> {
    try {
      // First try the primary method
      let result = await this.reverseGeocode(latitude, longitude);
      
      // If result lacks street info and we're on native platform, try web as fallback
      if (result && !result.street && !result.streetNumber && Platform.OS !== 'web') {
        try {
          const webResult = await this.reverseGeocodeWeb(latitude, longitude);
          if (webResult && (webResult.street || webResult.streetNumber)) {
            // Merge results - use web for street info, native for other details
            result = {
              ...result,
              street: webResult.street || result.street,
              streetNumber: webResult.streetNumber || result.streetNumber,
              // Keep the more detailed address if web has better street info
              formattedAddress: webResult.street ? webResult.formattedAddress : result.formattedAddress,
            };
          }
        } catch (error) {
          console.warn('Fallback geocoding failed:', error);
        }
      }
      
      return result;
    } catch (error) {
      console.warn('Primary geocoding failed:', error);
      // Try web as last resort if we're on native
      if (Platform.OS !== 'web') {
        try {
          return await this.reverseGeocodeWeb(latitude, longitude);
        } catch (fallbackError) {
          console.warn('Fallback geocoding also failed:', fallbackError);
        }
      }
      return null;
    }
  }
}
