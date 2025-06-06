import AsyncStorage from '@react-native-async-storage/async-storage';

export interface LocationHistory {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  usageCount: number;
  lastUsed: Date;
  isAutoDetected: boolean;
}

const LOCATION_HISTORY_KEY = '@location_history';
const MAX_HISTORY_ITEMS = 20;

export class LocationHistoryService {
  
  /**
   * Get location history sorted by usage count and last used
   */
  static async getLocationHistory(): Promise<LocationHistory[]> {
    try {
      const historyJson = await AsyncStorage.getItem(LOCATION_HISTORY_KEY);
      if (!historyJson) return [];
      
      const history: LocationHistory[] = JSON.parse(historyJson);
      
      // Sort by usage count (descending) and then by last used (descending)
      return history.sort((a, b) => {
        if (a.usageCount !== b.usageCount) {
          return b.usageCount - a.usageCount;
        }
        return new Date(b.lastUsed).getTime() - new Date(a.lastUsed).getTime();
      });
    } catch (error) {
      console.warn('Failed to get location history:', error);
      return [];
    }
  }

  /**
   * Add or update a location in history
   */
  static async addToHistory(
    name: string, 
    latitude: number, 
    longitude: number, 
    isAutoDetected: boolean = false
  ): Promise<void> {
    try {
      const history = await this.getLocationHistory();
      
      // Check if location already exists (within 100m radius)
      const existingLocationIndex = history.findIndex(location => 
        this.calculateDistance(latitude, longitude, location.latitude, location.longitude) < 0.1
      );
      
      if (existingLocationIndex !== -1) {
        // Update existing location
        history[existingLocationIndex] = {
          ...history[existingLocationIndex],
          name, // Update name in case it changed
          usageCount: history[existingLocationIndex].usageCount + 1,
          lastUsed: new Date(),
          isAutoDetected: isAutoDetected || history[existingLocationIndex].isAutoDetected,
        };
      } else {
        // Add new location
        const newLocation: LocationHistory = {
          id: `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          name,
          latitude,
          longitude,
          usageCount: 1,
          lastUsed: new Date(),
          isAutoDetected,
        };
        
        history.unshift(newLocation);
      }
      
      // Limit history size
      const limitedHistory = history.slice(0, MAX_HISTORY_ITEMS);
      
      await AsyncStorage.setItem(LOCATION_HISTORY_KEY, JSON.stringify(limitedHistory));
    } catch (error) {
      console.warn('Failed to add location to history:', error);
    }
  }

  /**
   * Remove a location from history
   */
  static async removeFromHistory(locationId: string): Promise<void> {
    try {
      const history = await this.getLocationHistory();
      const filteredHistory = history.filter(location => location.id !== locationId);
      await AsyncStorage.setItem(LOCATION_HISTORY_KEY, JSON.stringify(filteredHistory));
    } catch (error) {
      console.warn('Failed to remove location from history:', error);
    }
  }

  /**
   * Clear all location history
   */
  static async clearHistory(): Promise<void> {
    try {
      await AsyncStorage.removeItem(LOCATION_HISTORY_KEY);
    } catch (error) {
      console.warn('Failed to clear location history:', error);
    }
  }

  /**
   * Search location history by name
   */
  static async searchHistory(query: string): Promise<LocationHistory[]> {
    try {
      const history = await this.getLocationHistory();
      
      if (!query.trim()) return history;
      
      const lowerQuery = query.toLowerCase();
      return history.filter(location => 
        location.name.toLowerCase().includes(lowerQuery)
      );
    } catch (error) {
      console.warn('Failed to search location history:', error);
      return [];
    }
  }

  /**
   * Get frequently used locations (top 5)
   */
  static async getFrequentLocations(): Promise<LocationHistory[]> {
    try {
      const history = await this.getLocationHistory();
      return history.slice(0, 5);
    } catch (error) {
      console.warn('Failed to get frequent locations:', error);
      return [];
    }
  }

  /**
   * Calculate distance between two points in kilometers
   */
  private static calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371; // Earth's radius in kilometers
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  }
}
