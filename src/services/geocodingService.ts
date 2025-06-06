import * as Location from 'expo-location';
import { Platform } from 'react-native';

export interface GeocodingResult {
  name?: string;
  street?: string;
  district?: string;
  city?: string;
  region?: string;
  country?: string;
  formattedAddress: string;
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
          district: location.district || undefined,
          city: location.city || undefined,
          region: location.region || undefined,
          country: location.country || undefined,
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
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&addressdetails=1`
      );
      
      if (!response.ok) {
        throw new Error('Geocoding request failed');
      }
      
      const data = await response.json();
      
      if (data && data.address) {
        const addr = data.address;
        
        return {
          name: addr.amenity || addr.shop || addr.building || undefined,
          street: addr.road || addr.street || undefined,
          district: addr.suburb || addr.district || addr.neighbourhood || undefined,
          city: addr.city || addr.town || addr.village || undefined,
          region: addr.state || addr.province || undefined,
          country: addr.country || undefined,
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
    
    // Priority order for address components
    if (location.name) addressParts.push(location.name);
    if (location.street) addressParts.push(location.street);
    if (location.district) addressParts.push(location.district);
    if (location.city) addressParts.push(location.city);
    if (location.region) addressParts.push(location.region);
    if (location.country) addressParts.push(location.country);
    
    // Return the most relevant parts (limit to 3 to avoid too long addresses)
    const relevantParts = addressParts.slice(0, 3);
    return relevantParts.length > 0 ? relevantParts.join(', ') : 'Unknown location';
  }

  /**
   * Get short formatted address (for UI display)
   */
  static getShortAddress(result: GeocodingResult): string {
    const parts = [];
    
    if (result.name) parts.push(result.name);
    if (result.city) parts.push(result.city);
    if (result.region) parts.push(result.region);
    
    return parts.slice(0, 2).join(', ') || result.formattedAddress;
  }

  /**
   * Get detailed address (for full display)
   */
  static getDetailedAddress(result: GeocodingResult): string {
    return result.formattedAddress;
  }
}
