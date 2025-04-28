import React, { useEffect, useState } from 'react';
import { View, StyleSheet, Text, Platform } from 'react-native';
import { useLocationStore } from '../store/locationStore';
import { Post, Region } from '../types';
import { colors } from '../constants/colors';

// This is a placeholder component for the map view
// In a real app, you would use react-native-maps for native platforms
// and a web-compatible map library for web

interface MapViewProps {
  posts: Post[];
  selectedPostId?: string;
  onMarkerPress?: (post: Post) => void;
  showUserLocation?: boolean;
}

export const MapView: React.FC<MapViewProps> = ({
  posts,
  selectedPostId,
  onMarkerPress,
  showUserLocation = true,
}) => {
  const { currentLocation, getCurrentLocation } = useLocationStore();
  const [region, setRegion] = useState<Region | null>(null);

  useEffect(() => {
    if (!currentLocation) {
      getCurrentLocation();
    } else if (!region) {
      setRegion({
        latitude: currentLocation.latitude,
        longitude: currentLocation.longitude,
        latitudeDelta: 0.0922,
        longitudeDelta: 0.0421,
      });
    }
  }, [currentLocation]);

  if (Platform.OS === 'web') {
    return (
      <View style={styles.container}>
        <View style={styles.mapPlaceholder}>
          <Text style={styles.mapPlaceholderText}>
            Map View
          </Text>
          <Text style={styles.mapPlaceholderSubtext}>
            {currentLocation 
              ? `Current Location: ${currentLocation.latitude.toFixed(4)}, ${currentLocation.longitude.toFixed(4)}`
              : 'Loading location...'}
          </Text>
          <Text style={styles.mapPlaceholderSubtext}>
            {posts.length} posts in this area
          </Text>
          <Text style={styles.mapPlaceholderNote}>
            Note: Full map functionality requires native device capabilities.
          </Text>
        </View>
      </View>
    );
  }

  // For native platforms, you would return a real map component here
  // This is just a placeholder for the demo
  return (
    <View style={styles.container}>
      <View style={styles.mapPlaceholder}>
        <Text style={styles.mapPlaceholderText}>
          Map View
        </Text>
        <Text style={styles.mapPlaceholderSubtext}>
          {currentLocation 
            ? `Current Location: ${currentLocation.latitude.toFixed(4)}, ${currentLocation.longitude.toFixed(4)}`
            : 'Loading location...'}
        </Text>
        <Text style={styles.mapPlaceholderSubtext}>
          {posts.length} posts in this area
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    overflow: 'hidden',
  },
  mapPlaceholder: {
    flex: 1,
    backgroundColor: '#e0e0e0',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  mapPlaceholderText: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  mapPlaceholderSubtext: {
    fontSize: 14,
    color: colors.textLight,
    marginBottom: 5,
  },
  mapPlaceholderNote: {
    fontSize: 12,
    color: colors.textLight,
    fontStyle: 'italic',
    marginTop: 10,
    textAlign: 'center',
  },
});