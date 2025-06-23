/**
 * Utility functions for calculating distances and checking locations
 */

/**
 * Calculate distance between two points using Haversine formula
 * @param lat1 Latitude of first point
 * @param lon1 Longitude of first point  
 * @param lat2 Latitude of second point
 * @param lon2 Longitude of second point
 * @returns Distance in kilometers
 */
export const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
};

/**
 * Check if a post location is within user's notification radius
 * @param userLocation Current user location
 * @param postLocation Post location
 * @param notificationRadius User's notification radius in km
 * @returns true if post is within radius, false otherwise
 */
export const isPostWithinNotificationRadius = (
  userLocation: { latitude: number; longitude: number } | null,
  postLocation: { latitude: number; longitude: number },
  notificationRadius: number
): boolean => {
  if (!userLocation) {
    return false; // If no user location, don't show find location button
  }
  const distance = calculateDistance(
    userLocation.latitude,
    userLocation.longitude,
    postLocation.latitude,
    postLocation.longitude
  );
  
  return distance <= notificationRadius;
};

/**
 * Format distance for display
 * @param distanceKm Distance in kilometers
 * @returns Formatted distance string
 */
export const formatDistance = (distanceKm: number): string => {
  if (distanceKm < 1) {
    return `${Math.round(distanceKm * 1000)}m`;
  }
  return `${distanceKm.toFixed(1)}km`;
};
