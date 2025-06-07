import React, { useEffect, useState, useMemo } from 'react';
import { View, StyleSheet, Text, Platform, TouchableOpacity, LogBox, ScrollView } from 'react-native';
import * as Location from 'expo-location';
import Mapbox, {
  MapView as MapboxMapView,
  Camera,
  PointAnnotation,
  ShapeSource,
  FillLayer,
  LineLayer,
  UserLocation,
  UserLocationRenderMode,
  UserTrackingMode
} from '@rnmapbox/maps';
import { MapPin, Navigation2, Car, Bike, X, Play, Pause } from 'lucide-react-native';
import { useLocationStore } from '../store/locationStore';
import { useUserStore } from '../store/userStore';
import { useTranslation } from '../i18n';
import { Post, Region, User } from '../types';
import { colors } from '../constants/colors';
import { MAPBOX_ACCESS_TOKEN } from '../config/mapbox';
import { PostGroupView } from './PostGroupView';
 
// Suppress Mapbox warnings
LogBox.ignoreLogs([
  'new NativeEventEmitter',
  'EventEmitter.removeListener',
  'ViewTagResolver',
  'Text strings must be rendered within a <Text> component'
]);
/**
 * MapView Component with Clustering Posts and Navigation
 * 
 * Features:
 * - Group posts with same location into clusters
 * - Display all markers as clusters (including single posts)
 * - Marker colors change according to number of posts (more posts = darker color)
 * - Support display of both single post and multiple posts
 * - Display route navigation and user location tracking
 */

// This is a placeholder component for the map view
// In a real app, you would use react-native-maps for native platforms
// and a web-compatible map library for web

interface RouteInfo {
  distance: number;
  duration: number;
  steps: Array<{
    maneuver: string;
    instruction: string;
    distance: number;
    duration: number;
  }>;
}

interface MapViewProps {
  posts: Post[];
  selectedPostId?: string;
  onMarkerPress?: (post: Post | Post[]) => void;
  onMarkerLongPress?: (post: Post) => void;
  showUserLocation?: boolean;  user?: User; // Add user to get settings
  filterByRadius?: boolean; // Add props to control filter
  shouldDrawRoute?: boolean;  onRouteDrawn?: () => void;
}

interface LocationUpdate {
  coords: {
    latitude: number;
    longitude: number;
    heading: number | null;
  }
}

export const MapView: React.FC<MapViewProps> = ({
  posts,
  selectedPostId,
  onMarkerPress,
  showUserLocation = true,
  user,
  filterByRadius = true,
  shouldDrawRoute = false,
  onRouteDrawn
}) => {
  const { t } = useTranslation();
    // ZOOM CONFIGURATION - Easy to customize
  const ZOOM_CONFIG = {
    // Zoom levels
    MIN_ZOOM: 8,           // Maximum zoom out
    MAX_ZOOM: 20,          // Maximum zoom in  
    DEFAULT_ZOOM: 15,      // Default zoom
    
    // Zoom calculation parameters
    BASE_ZOOM_FACTOR: 15,  // Increase to zoom closer, decrease to zoom farther
    RADIUS_MULTIPLIER: 2,  // Increase to zoom farther, decrease to zoom closer
    
    // Zoom constraints
    ALLOW_FREE_ZOOM: false, // true = allow free zoom, false = limit by radius
    ZOOM_STEP: 0.5,        // Zoom level step
    
    // Animation
    ZOOM_ANIMATION_DURATION: 600, // ms
  };
  const { currentLocation, getCurrentLocation } = useLocationStore();
  const { currentUser } = useUserStore();
  
  const [region, setRegion] = useState<Region | null>(null);
  const [isMapReady, setIsMapReady] = useState(false);  const [currentZoom, setCurrentZoom] = useState<number>(14);
  
  // Get radius from user settings (default 5km)
  const notificationRadius = currentUser?.settings?.notificationRadius || 5;
  
  useEffect(() => {
    console.log('MapView using notification radius:', notificationRadius, 'km');
  }, [notificationRadius]);
    // Function to calculate distance between 2 points (Haversine formula)
  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
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
  // Filter posts by notification radius
  const postsInRadius = useMemo(() => {
    if (!filterByRadius || !currentLocation) return posts;
    
    return posts.filter(post => {
      const distance = calculateDistance(
        currentLocation.latitude,
        currentLocation.longitude,
        post.location.latitude,
        post.location.longitude
      );
      console.log(`Post ${post.id} distance: ${distance}km, radius: ${notificationRadius}km`);
      return distance <= notificationRadius;
    });
  }, [posts, currentLocation, notificationRadius, filterByRadius]);
  
  // Group posts by location with adaptive spacing based on zoom  
  const groupPostsByLocation = (posts: Post[]) => {
    const grouped: { [key: string]: Post[] } = {};
    
    // Adaptive threshold based on zoom - closer zoom means larger spacing
    const baseThreshold = 0.0001;
    const zoomAdjustment = Math.max(0.5, Math.min(2, currentZoom / 15)); // 0.5x to 2x
    const threshold = baseThreshold / zoomAdjustment;

    posts.forEach(post => {
      const key = `${Math.round(post.location.latitude / threshold)}_${Math.round(post.location.longitude / threshold)}`;
      if (!grouped[key]) {
        grouped[key] = [];
      }
      grouped[key].push(post);
    });

    return Object.values(grouped);
  };
  const groupedPosts = useMemo(() => groupPostsByLocation(postsInRadius), [postsInRadius, currentZoom]);
  // Create GeoJSON circle for notification radius
  const createCircle = (center: [number, number], radiusInKm: number, steps: number = 64) => {
    const coords = [];
    const distanceX = radiusInKm / (111.32 * Math.cos(center[1] * Math.PI / 180));
    const distanceY = radiusInKm / 110.54;
    for (let i = 0; i < steps; i++) {
      const theta = (i / steps) * (2 * Math.PI);
      const x = distanceX * Math.cos(theta);
      const y = distanceY * Math.sin(theta);
      coords.push([center[0] + x, center[1] + y]);
    }
    coords.push(coords[0]); // Close polygon

    return {
      type: 'Feature' as const,
      properties: {},
      geometry: {
        type: 'Polygon' as const,
        coordinates: [coords],
      },
    };
  };

  const radiusCircle = useMemo(() => {
    if (!currentLocation) return null;
    return createCircle([currentLocation.longitude, currentLocation.latitude], notificationRadius);
  }, [currentLocation, notificationRadius]);
  const getMarkerColor = useMemo(() => (postCount: number) => {
    if (postCount === 1) return '#4A89F3'; // Blue for 1 post
    if (postCount <= 3) return '#00C853'; // Green for 2-3 posts
    if (postCount <= 5) return '#FFD600'; // Yellow for 4-5 posts
    if (postCount <= 10) return '#FF6D00'; // Orange for 6-10 posts
    return '#D500F9'; // Purple for >10 posts
  }, []);
  // Function to calculate marker size based on zoom level
  const getMarkerSize = useMemo(() => (postCount: number, zoomLevel: number) => {
    // Base size according to number of posts - reduce basic size
    let baseSize = 12; // Reduced from 16 to 12 for 1 post
    if (postCount > 1) baseSize = 14; // Reduced from 20 to 14
    if (postCount > 3) baseSize = 16; // Reduced from 24 to 16
    if (postCount > 5) baseSize = 18; // Reduced from 28 to 18
    if (postCount > 10) baseSize = 20; // Reduced from 32 to 20
    
    // Zoom factor - reduce size increase speed when zooming
    const zoomFactor = Math.max(0.5, Math.min(1.5, (zoomLevel - 8) / 10)); // Reduced max factor from 2 to 1.5
    
    return Math.round(baseSize * (0.8 + zoomFactor * 0.5)); // Reduced multiplier factor from 0.7 to 0.5
  }, []);
  // Function to calculate offset to avoid overlapping markers
  const getMarkerOffset = useMemo(() => (index: number, postCount: number, markerSize: number) => {
    if (index === 0) return { x: 0, y: 0 }; // First marker at origin position
    
    // Spiral pattern offset
    const angle = (index * 60) * (Math.PI / 180); // 60 degrees per marker
    const distance = markerSize * 0.8; // Distance = 80% of marker size
    
    return {
      x: Math.cos(angle) * distance,
      y: Math.sin(angle) * distance
    };
  }, []);
  // Function to calculate z-index so small markers render on top of large markers
  const getMarkerZIndex = useMemo(() => (postCount: number, isSelected: boolean) => {
    let baseZIndex = 1000 - postCount; // Markers with fewer posts have higher z-index
    if (isSelected) baseZIndex += 1000; // Selected marker always on top
    return baseZIndex;
  }, []);
    // Function to calculate zoom level based on radius (km) - Improved Version
  const calculateZoomLevel = (radiusKm: number): number => {
    // Use ZOOM_CONFIG for calculation
    const minRadius = 0.1;
    const adjustedRadius = Math.max(radiusKm, minRadius);
    
    // Formula using config
    const baseZoom = ZOOM_CONFIG.BASE_ZOOM_FACTOR - Math.log2(adjustedRadius * ZOOM_CONFIG.RADIUS_MULTIPLIER);
    
    // Limit zoom level according to config
    const clampedZoom = Math.max(ZOOM_CONFIG.MIN_ZOOM, Math.min(ZOOM_CONFIG.MAX_ZOOM, baseZoom));
    
    // Round according to ZOOM_STEP
    return Math.round(clampedZoom / ZOOM_CONFIG.ZOOM_STEP) * ZOOM_CONFIG.ZOOM_STEP;
  };
  // Calculate appropriate zoom level for current radius
  const appropriateZoomLevel = useMemo(() => {
    return calculateZoomLevel(notificationRadius);
  }, [notificationRadius]);

  // Local state for component readiness
  const [isReady, setIsReady] = useState(false);
  const [localLocation, setLocalLocation] = useState(currentLocation);

  // Effect to handle initial setup after mount
  useEffect(() => {
    let mounted = true;

    const setup = async () => {
      try {
        // Wait a bit to ensure proper mounting
        await new Promise(resolve => setTimeout(resolve, 500));
        
        if (!mounted) return;

        // Set component as ready
        setIsReady(true);

        // Handle location if needed
        if (!localLocation) {
          if (Platform.OS !== 'web') {
            const { status } = await Location.requestForegroundPermissionsAsync();
            if (status !== 'granted' || !mounted) return;
          }

          const location = await Location.getCurrentPositionAsync({});
          if (!mounted) return;

          const newLocation = {
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
          };

          setLocalLocation(newLocation);
          
          // Only update store after we're sure component is ready
          useLocationStore.setState({ currentLocation: newLocation });
        }
      } catch (error) {
        console.error('Error in setup:', error);
      }
    };

    setup();

    return () => {
      mounted = false;
    };
  }, []);

  // Effect to handle region updates
  useEffect(() => {
    if (isReady && localLocation && !region) {
      setRegion({
        latitude: localLocation.latitude,
        longitude: localLocation.longitude,
        latitudeDelta: 0.0922,
        longitudeDelta: 0.0421,
      });
    }
  }, [isReady, localLocation, region]);
  // Add delay to ensure map is fully rendered
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsMapReady(true);
    }, 1000); // Increased delay to 1 second
    
    return () => clearTimeout(timer);
  }, []);

  const handleRegionChange = () => {
    setIsTrackingUser(false);
  };
  // State for route navigation
  const [routeCoordinates, setRouteCoordinates] = useState<[number, number][] | null>(null);
  const [selectedDestination, setSelectedDestination] = useState<Post | null>(null);
    // GeoJSON for route
  const routeGeoJSON = useMemo(() => {
    if (!routeCoordinates || !currentLocation) return null;
    
    return {
      type: 'Feature' as const,
      properties: {},
      geometry: {
        type: 'LineString' as const,
        coordinates: [
          [currentLocation.longitude, currentLocation.latitude],
          ...routeCoordinates
        ],
      },
    };
  }, [routeCoordinates, currentLocation]);

  // New state for navigation features
  const [routeInfo, setRouteInfo] = useState<RouteInfo | null>(null);
  const [selectedMode, setSelectedMode] = useState<'walking' | 'cycling' | 'driving'>('walking');
  const [isNavigating, setIsNavigating] = useState(false);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);

  // Function to format distance
  const formatDistance = (meters: number) => {
    if (meters < 1000) {
      return `${Math.round(meters)}m`;
    }
    return `${(meters / 1000).toFixed(1)}km`;
  };

  // Function to format duration
  const formatDuration = (seconds: number) => {
    const minutes = Math.round(seconds / 60);
    if (minutes < 60) {
      return `${minutes} min`;
    }
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return `${hours}h ${remainingMinutes}min`;
  };

  // Updated getRoute function with more details and auto zoom
  const getRoute = async (destination: Post) => {
    try {
      if (!currentLocation || !mapRef.current) return;
      
      const start = `${currentLocation.longitude},${currentLocation.latitude}`;
      const end = `${destination.location.longitude},${destination.location.latitude}`;
      
      const response = await fetch(
        `https://api.mapbox.com/directions/v5/mapbox/${selectedMode}/${start};${end}?` +
        `steps=true&geometries=geojson&overview=full&voice_instructions=true&` +
        `banner_instructions=true&access_token=${MAPBOX_ACCESS_TOKEN}`
      );
      
      const data = await response.json();
      
      if (data.routes && data.routes.length > 0) {
        const route = data.routes[0];
        const coordinates = route.geometry.coordinates;
        setRouteCoordinates(coordinates);
        setSelectedDestination(destination);
        
        // Set route info
        setRouteInfo({
          distance: route.distance,
          duration: route.duration,
          steps: route.legs[0].steps.map((step: any) => ({
            maneuver: step.maneuver.type,
            instruction: step.maneuver.instruction,
            distance: step.distance,
            duration: step.duration
          }))
        });
        
        // Reset navigation state
        setCurrentStepIndex(0);
        setIsNavigating(false);

        // Calculate bounds for the route
        let minLng = Math.min(...coordinates.map((coord: [number, number]) => coord[0]));
        let maxLng = Math.max(...coordinates.map((coord: [number, number]) => coord[0]));
        let minLat = Math.min(...coordinates.map((coord: [number, number]) => coord[1]));
        let maxLat = Math.max(...coordinates.map((coord: [number, number]) => coord[1]));

        // Add padding to bounds (10% of the route dimensions)
        const latPadding = (maxLat - minLat) * 0.1;
        const lngPadding = (maxLng - minLng) * 0.1;
        
        minLat -= latPadding;
        maxLat += latPadding;
        minLng -= lngPadding;
        maxLng += lngPadding;

        // Calculate appropriate zoom level based on route bounds
        const latDiff = maxLat - minLat;
        const lngDiff = maxLng - minLng;
        const maxDiff = Math.max(latDiff, lngDiff);
        
        // Adjust zoom based on route size (smaller route = higher zoom)
        let newZoom = Math.floor(14 - Math.log2(maxDiff * 111)); // 111km per degree
        newZoom = Math.min(Math.max(newZoom, 11), 16); // Limit zoom between 11 and 16

        // Update camera state to show the entire route
        const centerCoordinate: [number, number] = [
          (minLng + maxLng) / 2,
          (minLat + maxLat) / 2
        ];

        // Update region state to trigger camera movement
        setRegion({
          latitude: centerCoordinate[1],
          longitude: centerCoordinate[0],
          latitudeDelta: latDiff * 1.2, // Add 20% padding
          longitudeDelta: lngDiff * 1.2,
        });

        setCurrentZoom(newZoom);
        setIsTrackingUser(false);
      }
    } catch (error) {
      console.error('Error getting route:', error);
    }
  };

  // Function to handle transport mode change
  const handleModeChange = (mode: 'walking' | 'cycling' | 'driving') => {
    setSelectedMode(mode);
    if (selectedDestination) {
      getRoute(selectedDestination);
    }
  };

  // Function to toggle navigation
  const toggleNavigation = () => {
    setIsNavigating(!isNavigating);
  };

  // Effect to update current step during navigation
  useEffect(() => {
    if (!isNavigating || !routeInfo) return;

    const interval = setInterval(() => {
      // Update current step based on user's location
      // This is a simplified version - in a real app, you would:
      // 1. Calculate distance to next maneuver point
      // 2. Check if user has reached or passed that point
      // 3. Update step accordingly
      if (currentStepIndex < routeInfo.steps.length - 1) {
        setCurrentStepIndex(prev => prev + 1);
      }
    }, 10000); // Check every 10 seconds

    return () => clearInterval(interval);
  }, [isNavigating, routeInfo, currentStepIndex]);

  // Add error handling for marker press
  const handleMarkerPress = (postOrGroup: Post | Post[]) => {
    try {
      if (onMarkerPress) {
        onMarkerPress(postOrGroup);
      }
    } catch (error) {
      if (__DEV__) {
        console.warn('Marker press error:', error);
      }
    }
  };

  // Function to clear route and reset navigation state
  const clearRoute = () => {
    setRouteInfo(null);
    setRouteCoordinates(null);
    setSelectedDestination(null);
    setIsNavigating(false);
    setCurrentStepIndex(0);
  };

  // Handle marker long press - add navigation
  const handleMarkerLongPress = async (post: Post) => {
    try {
      // Toggle route - if same destination, clear route
      if (selectedDestination?.id === post.id) {
        setRouteCoordinates(null);
        setSelectedDestination(null);
      } else {
        await getRoute(post);
      }
    } catch (error) {
      if (__DEV__) {
        console.warn('Marker long press error:', error);
      }
    }
  };

  // Refresh function to reload map and posts
  const refreshMap = async () => {
    try {
      if (!isReady || !mapRef.current) {
        console.warn('Map not ready for refresh');
        return;
      }

      // Reset states first
      setIsMapReady(false);

      // Get new location
      const location = await Location.getCurrentPositionAsync({});
      
      // Update local state first
      const newLocation = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      };
      
      setLocalLocation(newLocation);
      
      // Then update store
      useLocationStore.setState({ currentLocation: newLocation });

      // Finally update other states
      setIsMapReady(true);
      setCurrentZoom(appropriateZoomLevel);
      setIsTrackingUser(true);
    } catch (error) {
      console.error('Error refreshing map:', error);
      // Restore states on error
      setIsMapReady(true);
    }
  };

  // Effect to handle route drawing when shouldDrawRoute changes
  useEffect(() => {
    if (shouldDrawRoute && selectedPostId) {
      const selectedPost = posts.find(post => post.id === selectedPostId);
      if (selectedPost) {
        getRoute(selectedPost).then(() => {
          if (onRouteDrawn) {
            onRouteDrawn();
          }
        });
      }
    }
  }, [shouldDrawRoute, selectedPostId, posts]);

  // Add state for user heading
  const [userHeading, setUserHeading] = useState<number>(0);
  const [isTrackingUser, setIsTrackingUser] = useState(true);

  // Reference to MapView
  const mapRef = React.useRef<MapboxMapView>(null);

  // PostGroupView for clusters
  const [selectedPostGroup, setSelectedPostGroup] = useState<Post[]>([]);
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);

  const handleCloseGroup = () => {
    setSelectedPostGroup([]);
    setSelectedPost(null);
  };

  const handleSelectPostFromGroup = (post: Post) => {
    setSelectedPostGroup([post]);
    setSelectedPost(post);
  };
  if (Platform.OS === 'web') {
    return (
      <View style={styles.container}>
        <View style={styles.mapPlaceholder}>
          <Text style={styles.mapPlaceholderText}>
            {t('map.mapView')}
          </Text>
          <Text style={styles.mapPlaceholderSubtext}>
            {currentLocation 
              ? `${t('map.currentLocation')}: ${currentLocation.latitude.toFixed(4)}, ${currentLocation.longitude.toFixed(4)}`
              : t('map.loadingLocation')}
          </Text>
          <Text style={styles.mapPlaceholderSubtext}>
            {`${postsInRadius.length} ${postsInRadius.length === 1 ? t('map.photo') : t('map.photos')} ${t('map.within')} ${notificationRadius} ${t('map.kilometers')} ${t('map.radius')}`}
          </Text>
          <Text style={styles.mapPlaceholderNote}>
            {t('map.webMapNote')}
          </Text>
        </View>
      </View>
    );
  }

  // Mapbox for native platforms
  return (
    <View style={styles.container}>
      <MapboxMapView 
        ref={mapRef}
        style={styles.map}
        styleURL={'mapbox://styles/mapbox/navigation-night-v1'}
        logoEnabled={false}
        attributionEnabled={false}
        onDidFinishLoadingMap={() => {
          if (__DEV__) {
            console.log('Map finished loading');
          }
          setIsMapReady(true);
        }}
        onCameraChanged={handleRegionChange}
        onTouchStart={() => setIsTrackingUser(false)}
        zoomEnabled={true}
        scrollEnabled={true}
        pitchEnabled={false}
        rotateEnabled={false}
        compassEnabled={false}
        scaleBarEnabled={false}
      >
        {/* Camera */}
        {currentLocation && (
          <Camera
            centerCoordinate={[currentLocation.longitude, currentLocation.latitude]}
            zoomLevel={currentZoom}
            animationMode="flyTo"
            animationDuration={500}
            followUserLocation={isTrackingUser}
            followUserMode={UserTrackingMode.Follow}
            followZoomLevel={currentZoom}
          />
        )}
        {/* Post markers - Anti-overlap with smart positioning */}
        {isMapReady && groupedPosts.length > 0 && groupedPosts
          .sort((a, b) => b.length - a.length)
          .map((postGroup, groupIndex) => {
            const firstPost = postGroup[0];
            const postCount = postGroup.length;
            const isSelected = postGroup.some(post => post.id === selectedPostId);
            const markerColor = getMarkerColor(postCount);
            const markerSize = getMarkerSize(postCount, currentZoom);
            const zIndex = getMarkerZIndex(postCount, isSelected);
            const baseKey = `${firstPost.id}-${postCount}-${Math.round(currentZoom)}`;

            // Display individual markers when zoom is close enough (>14) or when marker is selected
            if ((postGroup.length > 1 && currentZoom > 14) || isSelected) {
              return postGroup.map((post, subIndex) => {
                const offset = getMarkerOffset(subIndex, postCount, markerSize);
                const subMarkerId = `sub-${baseKey}-${subIndex}`;
                const subMarkerSize = getMarkerSize(1, currentZoom);
                const isSubSelected = post.id === selectedPostId;
                
                const offsetLat = firstPost.location.latitude + (offset.y * 0.00001); 
                const offsetLng = firstPost.location.longitude + (offset.x * 0.00001);
                
                return (
                  <PointAnnotation
                    key={subMarkerId}
                    id={subMarkerId}
                    coordinate={[offsetLng, offsetLat]}
                    anchor={{ x: 0.5, y: 0.5 }}
                    onSelected={() => {
                      console.log('Sub-marker selected:', post.id);
                      handleMarkerPress(post);
                    }}
                  >
                    <TouchableOpacity
                      onPress={() => {
                        handleMarkerPress(post);
                      }}
                      onLongPress={() => {
                        handleMarkerLongPress(post);
                      }}
                      delayLongPress={800}
                      activeOpacity={0.8}
                    >
                      <View style={[
                        styles.markerContainer,
                        { zIndex: zIndex + subIndex },
                        styles.clusterMarker,
                        { 
                          backgroundColor: getMarkerColor(1),
                          width: subMarkerSize,
                          height: subMarkerSize,
                          borderRadius: subMarkerSize / 2,
                        },
                        isSubSelected && {
                          width: subMarkerSize + 4,
                          height: subMarkerSize + 4,
                          borderRadius: (subMarkerSize + 4) / 2,
                          borderWidth: 3,
                          transform: [{ scale: 1.1 }],
                          shadowOpacity: 0.5,
                          shadowRadius: 6,
                          elevation: 12,
                        }
                      ]} />
                    </TouchableOpacity>
                  </PointAnnotation>
                );
              });
            } else {
              // Display group marker
              const markerId = `marker-${baseKey}`;
              return (
                <React.Fragment key={markerId}>
                  <PointAnnotation
                    id={markerId}
                    coordinate={[firstPost.location.longitude, firstPost.location.latitude]}
                    anchor={{ x: 0.5, y: 0.5 }}
                    onSelected={() => {
                      console.log('Group marker selected:', postCount === 1 ? firstPost.id : `Group of ${postCount} posts`);
                      handleMarkerPress(postCount === 1 ? firstPost : postGroup);
                    }}
                  >
                    <TouchableOpacity
                      onPress={() => {
                        handleMarkerPress(postCount === 1 ? firstPost : postGroup);
                      }}
                      onLongPress={() => {
                        if (postCount === 1) {
                          handleMarkerLongPress(firstPost);
                        }
                      }}
                      delayLongPress={800}
                      activeOpacity={0.8}
                    >
                      <View style={[
                        styles.markerContainer,
                        { zIndex },
                        styles.clusterMarker,
                        {
                          backgroundColor: markerColor,
                          width: markerSize,
                          height: markerSize,
                          borderRadius: markerSize / 2,
                        },
                        isSelected && {
                          width: markerSize + 6,
                          height: markerSize + 6,
                          borderRadius: (markerSize + 6) / 2,
                          borderWidth: 4,
                          transform: [{ scale: 1.1 }],
                          shadowOpacity: 0.5,
                          shadowRadius: 6,
                          elevation: 12,
                        }
                      ]} />
                    </TouchableOpacity>
                  </PointAnnotation>
                </React.Fragment>
              );
            }
          }).flat()}
          {/* Radius circle */}
        {isMapReady && showUserLocation && currentLocation && radiusCircle && (
          <ShapeSource id="radius-circle-source" shape={radiusCircle}>
            <FillLayer
              id="radius-circle-fill-layer"
              style={{
                fillColor: 'rgba(74, 137, 243, 0.1)',
                fillOutlineColor: '#4A89F3',
              }}
            />
          </ShapeSource>
        )}
        {/* Route Layer */}
        {routeGeoJSON && (
          <ShapeSource id="route-source" shape={routeGeoJSON}>
            <LineLayer
              id="route-layer"
              style={{
                lineColor: '#FFD700', // Dark yellow color
                lineWidth: 5, // Increase line thickness
                lineCap: 'round',
                lineJoin: 'round',
                lineOpacity: 0.9, // Add light transparency
              }}
            />
          </ShapeSource>
        )}

        {/* User Location */}
        {showUserLocation && (
          <UserLocation
            visible={true}
            animated={true}
            renderMode={UserLocationRenderMode.Normal}
            minDisplacement={1}
            onUpdate={location => {
              if (location.coords) {
                useLocationStore.setState({
                  currentLocation: {
                    latitude: location.coords.latitude,
                    longitude: location.coords.longitude,
                  }
                });
              }
            }}
            androidRenderMode="gps"
            showsUserHeadingIndicator={true}
          />
        )}
      </MapboxMapView>
        {/* Info Bar with Route Info */}
      <View style={styles.infoBar}>
        <Text style={styles.infoBarText}>
          {postsInRadius.length} {postsInRadius.length === 1 ? t('map.photo') : t('map.photos')} {t('map.within')} {notificationRadius} {t('map.kilometers')}
        </Text>
        <Text style={styles.infoBarSubtext}>
          Zoom: {currentZoom.toFixed(1)} (min: {appropriateZoomLevel.toFixed(1)})
        </Text>
      </View>
      {/* Refresh Control */}
      <View style={styles.refreshControl}>
        <TouchableOpacity 
          style={styles.refreshButton}  
          onPress={refreshMap}
          activeOpacity={0.7}
        >
          <Text style={styles.refreshButtonText}>⟲</Text>
        </TouchableOpacity>
      </View>

      {/* Transport Mode Selector */}
      {selectedDestination && (
        <View style={styles.transportModeContainer}>
          <TouchableOpacity
            style={[styles.modeButton, selectedMode === 'walking' && styles.selectedMode]}
            onPress={() => handleModeChange('walking')}
          >
            <MapPin size={24} color={selectedMode === 'walking' ? 'white' : colors.text} />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.modeButton, selectedMode === 'cycling' && styles.selectedMode]}
            onPress={() => handleModeChange('cycling')}
          >
            <Bike size={24} color={selectedMode === 'cycling' ? 'white' : colors.text} />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.modeButton, selectedMode === 'driving' && styles.selectedMode]}
            onPress={() => handleModeChange('driving')}
          >
            <Car size={24} color={selectedMode === 'driving' ? 'white' : colors.text} />
          </TouchableOpacity>
        </View>
      )}

      {/* Route Information Panel */}
      {routeInfo && (
        <View style={styles.routeInfoContainer}>
          <View style={styles.routeInfoHeader}>
            <View>
              <Text style={styles.routeInfoTitle}>{t('map.routeToDestination')}</Text>
              <Text style={styles.routeInfoSubtitle}>
                {formatDistance(routeInfo.distance)} • {formatDuration(routeInfo.duration)}
              </Text>
            </View>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={clearRoute}
            >
              <X size={24} color={colors.text} />
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Center on User Button */}
      {showUserLocation && (
        <TouchableOpacity
          style={[
            styles.centerButton,
            isTrackingUser && styles.centerButtonActive
          ]}
          onPress={() => {
            if (currentLocation) {
              setIsTrackingUser(true);
            }
          }}
        >
          <Navigation2
            size={24}
            color={isTrackingUser ? 'white' : colors.text}
            style={{ transform: [{ rotate: '0deg' }] }}
          />
        </TouchableOpacity>
      )}

      {/* PostGroupView for clusters */}
      {selectedPostGroup.length > 0 && (
        <PostGroupView
          posts={selectedPostGroup}
          onClose={handleCloseGroup}
          onSelectPost={handleSelectPostFromGroup}
          onFindLocation={async (post) => {
            // Close PostGroupView first
            setSelectedPostGroup([]);
            // Then create route
            await getRoute(post);
          }}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    flex: 1,
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
  userLocationInner: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: 'white',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  selectedPostMarker: {
    backgroundColor: colors.primary,
    borderColor: 'white',
    width: 42,
    height: 42,
    borderRadius: 21,
    transform: [{ translateY: -8 }, { scale: 1.1 }],
    borderWidth: 3,
  },
  postMarkerText: {
    fontSize: 18,
  },
  callout: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 12,
    minWidth: 180,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  calloutTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 6,
  },
  calloutDescription: {
    fontSize: 13,
    color: colors.textLight,
    lineHeight: 18,
  },
  infoBar: {
    position: 'absolute',
    top: 16,
    left: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 3,
    flexDirection: 'column',
    alignItems: 'flex-start',
  },
  infoBarText: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '600',
  },
  infoBarSubtext: {
    color: colors.textLight,
    fontSize: 12,
    marginTop: 2,
  },
  markerContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    pointerEvents: 'auto',
  },
  clusterMarker: {
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'white',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 4,
    elevation: 8,
    pointerEvents: 'auto',
  },
  clusterText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    textAlign: 'center',
  },
  userCenterMarker: {
    width: 16,
    height: 16,
    backgroundColor: '#4A89F3',
    borderRadius: 8,
    borderWidth: 3,
    borderColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  userCenterInner: {
    width: 6,
    height: 6,
    backgroundColor: 'white',
    borderRadius: 3,
  },
  refreshControl: {
    position: 'absolute',
    bottom: 160,
    right: 16,
    zIndex: 10,
  },
  refreshButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.1)',
  },
  refreshButtonText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text,
    lineHeight: 20,
  },
  centerButton: {
    position: 'absolute',
    bottom: 100,
    right: 16,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  centerButtonActive: {
    backgroundColor: colors.primary,
  },
  transportModeContainer: {
    position: 'absolute',
    top: 20,
    right: 20,
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 8,
    flexDirection: 'row',
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  modeButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: 'white',
  },
  selectedMode: {
    backgroundColor: colors.primary,
  },
  routeInfoContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'white',
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  routeInfoHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  routeInfoTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.text,
  },
  routeInfoSubtitle: {
    fontSize: 14,
    color: colors.textLight,
    marginTop: 4,
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.lightGray,
    justifyContent: 'center',
    alignItems: 'center',
  },
});