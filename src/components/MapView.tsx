import React, { useEffect, useState, useMemo } from 'react';
import { View, StyleSheet, Text, Platform, TouchableOpacity, LogBox } from 'react-native';
import Mapbox, {
  MapView as MapboxMapView,
  Camera,
  PointAnnotation,
  ShapeSource,
  FillLayer,
  LineLayer
} from '@rnmapbox/maps';
import { useLocationStore } from '../store/locationStore';
import { Post, Region, User } from '../types';
import { colors } from '../constants/colors';
import '../config/mapbox'; // Khởi tạo Mapbox
 
// Suppress Mapbox warnings
LogBox.ignoreLogs([
  'new NativeEventEmitter',
  'EventEmitter.removeListener',
  'ViewTagResolver',
  'Text strings must be rendered within a <Text> component'
]);
/**
 * MapView Component với Clustering Posts và Navigation
 * 
 * Features:
 * - Nhóm các posts có cùng vị trí thành clusters
 * - Hiển thị tất cả marker dưới dạng cluster (bao gồm cả single post)
 * - Màu sắc marker thay đổi theo số lượng posts (càng nhiều càng đậm)
 * - Hỗ trợ hiển thị both single post và multiple posts
 * - Hiển thị route navigation và user location tracking
 */

// This is a placeholder component for the map view
// In a real app, you would use react-native-maps for native platforms
// and a web-compatible map library for web

interface MapViewProps {
  posts: Post[];
  selectedPostId?: string;
  onMarkerPress?: (post: Post | Post[]) => void;
  onMarkerLongPress?: (post: Post) => void;
  showUserLocation?: boolean;
  user?: User; // Thêm user để lấy settings
  filterByRadius?: boolean; // Thêm props để control filter
}

export const MapView: React.FC<MapViewProps> = ({
  posts,
  selectedPostId,
  onMarkerPress,
  showUserLocation = true,
  user,
  filterByRadius = true, // Mặc định là true để tương thích với map tab
}) => {
  // ZOOM CONFIGURATION - Dễ dàng tùy chỉnh
  const ZOOM_CONFIG = {
    // Zoom levels
    MIN_ZOOM: 8,           // Zoom out tối đa
    MAX_ZOOM: 20,          // Zoom in tối đa  
    DEFAULT_ZOOM: 15,      // Zoom mặc định
    
    // Zoom calculation parameters
    BASE_ZOOM_FACTOR: 15,  // Tăng để zoom gần hơn, giảm để zoom xa hơn
    RADIUS_MULTIPLIER: 2,  // Tăng để zoom xa hơn, giảm để zoom gần hơn
    
    // Zoom constraints
    ALLOW_FREE_ZOOM: false, // true = cho phép zoom tự do, false = giới hạn theo radius
    ZOOM_STEP: 0.5,        // Bước nhảy zoom level
    
    // Animation
    ZOOM_ANIMATION_DURATION: 600, // ms
  };
  const { currentLocation, getCurrentLocation } = useLocationStore();
  
  const [region, setRegion] = useState<Region | null>(null);
  const [isMapReady, setIsMapReady] = useState(false);
  const [currentZoom, setCurrentZoom] = useState<number>(14);
  
  // Lấy bán kính từ user settings (mặc định 5km)
  const notificationRadius = user?.settings?.notificationRadius || 5;
  
  // Hàm tính khoảng cách giữa 2 điểm (Haversine formula)
  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371; // Bán kính Trái đất tính bằng km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };
    // Filter posts theo bán kính notification
  const postsInRadius = useMemo(() => {
    if (!filterByRadius || !currentLocation) return posts;
    
    return posts.filter(post => {
      const distance = calculateDistance(
        currentLocation.latitude,
        currentLocation.longitude,
        post.location.latitude,
        post.location.longitude
      );
      return distance <= notificationRadius;
    });
  }, [posts, currentLocation, notificationRadius, filterByRadius]);
  // Nhóm các posts theo vị trí với spacing thích ứng theo zoom
  const groupPostsByLocation = (posts: Post[]) => {
    const grouped: { [key: string]: Post[] } = {};
    
    // Threshold thích ứng theo zoom - zoom gần thì spacing lớn hơn
    const baseThreshold = 0.0001;
    const zoomAdjustment = Math.max(0.5, Math.min(2, currentZoom / 15)); // 0.5x đến 2x
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

  // Tạo GeoJSON circle cho bán kính thông báo
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
    coords.push(coords[0]); // Đóng polygon

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
    if (postCount === 1) return '#FF385C'; // Màu đỏ nhạt cho 1 post
    if (postCount <= 3) return '#E02444'; // Màu đỏ vừa cho 2-3 posts
    if (postCount <= 5) return '#C41E3A'; // Màu đỏ đậm cho 4-5 posts
    if (postCount <= 10) return '#A01A32'; // Màu đỏ đậm hơn cho 6-10 posts
    return '#800020'; // Màu đỏ rất đậm cho >10 posts
  }, []);
  // Hàm tính kích thước marker dựa trên zoom level
  const getMarkerSize = useMemo(() => (postCount: number, zoomLevel: number) => {
    // Base size tùy theo số lượng posts
    let baseSize = 16; // Kích thước cơ bản cho 1 post
    if (postCount > 1) baseSize = 20;
    if (postCount > 3) baseSize = 24;
    if (postCount > 5) baseSize = 28;
    if (postCount > 10) baseSize = 32;
    
    // Zoom factor - tăng kích thước khi zoom gần
    const zoomFactor = Math.max(0.5, Math.min(2, (zoomLevel - 8) / 8)); // Từ 0.5x đến 2x
    
    return Math.round(baseSize * (0.8 + zoomFactor * 0.7)); // Min: baseSize*0.8, Max: baseSize*1.5
  }, []);

  // Hàm tính offset để tránh marker đè nhau
  const getMarkerOffset = useMemo(() => (index: number, postCount: number, markerSize: number) => {
    if (index === 0) return { x: 0, y: 0 }; // Marker đầu tiên ở vị trí gốc
    
    // Pattern offset dạng spiral
    const angle = (index * 60) * (Math.PI / 180); // 60 độ mỗi marker
    const distance = markerSize * 0.8; // Khoảng cách = 80% kích thước marker
    
    return {
      x: Math.cos(angle) * distance,
      y: Math.sin(angle) * distance
    };
  }, []);

  // Hàm tính z-index để marker nhỏ render trên marker lớn
  const getMarkerZIndex = useMemo(() => (postCount: number, isSelected: boolean) => {
    let baseZIndex = 1000 - postCount; // Marker ít post có z-index cao hơn
    if (isSelected) baseZIndex += 1000; // Selected marker luôn ở trên cùng
    return baseZIndex;
  }, []);
  
  // Hàm tính zoom level dựa trên bán kính (km) - Improved Version
  const calculateZoomLevel = (radiusKm: number): number => {
    // Sử dụng ZOOM_CONFIG để tính toán
    const minRadius = 0.1;
    const adjustedRadius = Math.max(radiusKm, minRadius);
    
    // Công thức sử dụng config
    const baseZoom = ZOOM_CONFIG.BASE_ZOOM_FACTOR - Math.log2(adjustedRadius * ZOOM_CONFIG.RADIUS_MULTIPLIER);
    
    // Giới hạn zoom level theo config
    const clampedZoom = Math.max(ZOOM_CONFIG.MIN_ZOOM, Math.min(ZOOM_CONFIG.MAX_ZOOM, baseZoom));
    
    // Round theo ZOOM_STEP
    return Math.round(clampedZoom / ZOOM_CONFIG.ZOOM_STEP) * ZOOM_CONFIG.ZOOM_STEP;
  };

  // Tính zoom level phù hợp với bán kính hiện tại
  const appropriateZoomLevel = useMemo(() => {
    return calculateZoomLevel(notificationRadius);
  }, [notificationRadius]);

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

  // Thêm delay để đảm bảo map được render hoàn toàn
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsMapReady(true);
    }, 1000); // Tăng delay lên 1 giây
    
    return () => clearTimeout(timer);
  }, []);

  const handleRegionChange = (event: any) => {
    try {
      let newZoom: number | undefined;
      
      // Try different event structures for zoom level
      if (event?.properties?.zoomLevel !== undefined) {
        newZoom = event.properties.zoomLevel;
      } else if (event?.zoomLevel !== undefined) {
        newZoom = event.zoomLevel;
      } else if (event?.zoom !== undefined) {
        newZoom = event.zoom;
      }
      
      if (newZoom === undefined) return;
      
      if (ZOOM_CONFIG.ALLOW_FREE_ZOOM) {
        // Cho phép zoom tự do trong giới hạn min/max
        const clampedZoom = Math.max(ZOOM_CONFIG.MIN_ZOOM, Math.min(ZOOM_CONFIG.MAX_ZOOM, newZoom));
        setCurrentZoom(clampedZoom);
      } else {
        // Giới hạn theo bán kính notification
        if (newZoom < appropriateZoomLevel) {
          setCurrentZoom(appropriateZoomLevel);
        } else if (newZoom > ZOOM_CONFIG.MAX_ZOOM) {
          setCurrentZoom(ZOOM_CONFIG.MAX_ZOOM);
        } else {
          setCurrentZoom(newZoom);
        }
      }
    } catch (error) {
      // Silent error handling
      if (__DEV__) {
        console.warn('Camera change error:', error);
      }
    }
  };  // Cập nhật zoom level khi notification radius thay đổi
  useEffect(() => {
    setCurrentZoom(appropriateZoomLevel);
  }, [appropriateZoomLevel]);
  
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
  };  // Handle marker long press - navigation functionality removed
  const handleMarkerLongPress = async (post: Post) => {
    try {
      // Navigation functionality has been removed
    } catch (error) {
      if (__DEV__) {
        console.warn('Marker long press error:', error);
      }
    }
  };

  // Refresh function to reload map and posts
  const refreshMap = () => {
    // Reload current location
    getCurrentLocation();
    
    // Reset map to ready state to trigger re-render
    setIsMapReady(false);
    setTimeout(() => {
      setIsMapReady(true);
    }, 500); // Tăng delay để đảm bảo cleanup hoàn toàn
    
    // Reset zoom to appropriate level
    setCurrentZoom(appropriateZoomLevel);
  };
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
            {`${postsInRadius.length} posts within ${notificationRadius}km radius`}
          </Text>
          <Text style={styles.mapPlaceholderNote}>
            Note: Full map functionality requires native device capabilities.
          </Text>
        </View>
      </View>
    );
  }

  // Mapbox cho native platforms
  return (
    <View style={styles.container}>
      <MapboxMapView 
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
        zoomEnabled={true}
        scrollEnabled={true}
        pitchEnabled={false}
        rotateEnabled={false}
        compassEnabled={false}
        scaleBarEnabled={false}
      >
        {/* Camera */}
        {currentLocation && isMapReady && (
          <Camera
            key={`camera-${currentLocation.latitude}-${currentLocation.longitude}-${currentZoom}`}
            centerCoordinate={[currentLocation.longitude, currentLocation.latitude]}
            zoomLevel={currentZoom}
            animationMode="flyTo"
            animationDuration={ZOOM_CONFIG.ZOOM_ANIMATION_DURATION}
            followUserLocation={false}
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
            if (postGroup.length > 1 && currentZoom > 12) {
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
                  ]}
                />
              </TouchableOpacity>
              </PointAnnotation>
            );
          });
            }
            else {
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
                  ]}>
                      </View>
                    </TouchableOpacity>
                  </PointAnnotation>
                </React.Fragment>
              );
            }
          }).flat()}
          {/* Vòng tròn bán kính */}
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
      </MapboxMapView>
      
      {/* Info Bar */}
      <View style={styles.infoBar}>
        <Text style={styles.infoBarText}>
          {postsInRadius.length} {postsInRadius.length === 1 ? 'photo' : 'photos'} within {notificationRadius}km
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
    width: 10,
    height: 10,
    backgroundColor: 'white',
    borderRadius: 5,
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
    bottom: 100,
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
  },  userLocationMarker: {
    width: 20,
    height: 20,
    borderRadius: 10,
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
});