import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
  FlatList,
  Modal,
  Animated,
} from 'react-native';
import { MapPin, RefreshCw, Edit3, Check, X, Clock, Search } from 'lucide-react-native';
import { colors } from '../constants/colors';
import { LocationHistoryService, LocationHistory } from '../services/locationHistoryService';
import { GeocodingResult } from '../services/geocodingService';
import { useTranslation } from '../i18n';

interface LocationInputProps {
  currentLocation: { latitude: number; longitude: number } | null;
  currentLocationName: string | null;
  locationName: string;
  onLocationNameChange: (name: string) => void;
  onRefreshLocation: () => Promise<void>;
  isLoading?: boolean;
  showDetailedInfo?: boolean;
  geocodingResult?: GeocodingResult | null;
}

export const LocationInput: React.FC<LocationInputProps> = ({
  currentLocation,
  currentLocationName,
  locationName,
  onLocationNameChange,
  onRefreshLocation,
  isLoading = false,
  showDetailedInfo = true,
  geocodingResult = null,
}) => {
  const { t } = useTranslation();
  const [isEditing, setIsEditing] = useState(false);
  const [tempLocationName, setTempLocationName] = useState(locationName);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [locationHistory, setLocationHistory] = useState<LocationHistory[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  // Animation values
  const rotationAnim = useRef(new Animated.Value(0)).current;
  const editFadeAnim = useRef(new Animated.Value(1)).current;

  // Load location history
  useEffect(() => {
    loadLocationHistory();
  }, []);

  // Update temp location name when locationName prop changes
  useEffect(() => {
    setTempLocationName(locationName);
  }, [locationName]);

  const loadLocationHistory = async () => {
    try {
      const history = await LocationHistoryService.getLocationHistory();
      setLocationHistory(history);
    } catch (error) {
      console.warn('Failed to load location history:', error);
    }
  };

  const searchLocationHistory = async (query: string) => {
    try {
      const results = await LocationHistoryService.searchHistory(query);
      setLocationHistory(results);
    } catch (error) {
      console.warn('Failed to search location history:', error);
    }
  };

  const handleSearchChange = (text: string) => {
    setSearchQuery(text);
    if (text.trim()) {
      searchLocationHistory(text);
    } else {
      loadLocationHistory();
    }
  };  const handleRefresh = async () => {
    setIsRefreshing(true);
    
    // Start rotation animation only
    const rotationAnimation = Animated.loop(
      Animated.timing(rotationAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      })
    );
    
    rotationAnimation.start();
    
    try {
      await onRefreshLocation();
    } catch (error) {
      Alert.alert('Error', 'Failed to refresh location');
    } finally {
      // Stop rotation animation
      rotationAnimation.stop();
      rotationAnim.setValue(0);
      setIsRefreshing(false);
    }
  };const handleEditSave = async () => {
    // Fade out and fade back in
    Animated.sequence([
      Animated.timing(editFadeAnim, {
        toValue: 0.3,
        duration: 150,
        useNativeDriver: true,
      }),
      Animated.timing(editFadeAnim, {
        toValue: 1,
        duration: 150,
        useNativeDriver: true,
      }),
    ]).start();
    
    onLocationNameChange(tempLocationName);
    setIsEditing(false);
    
    // Add to history if location is valid
    if (tempLocationName.trim() && currentLocation) {
      await LocationHistoryService.addToHistory(
        tempLocationName.trim(),
        currentLocation.latitude,
        currentLocation.longitude,
        false // User-entered location
      );
      loadLocationHistory(); // Refresh history
    }
  };

  const handleEditCancel = () => {
    // Quick fade animation
    Animated.timing(editFadeAnim, {
      toValue: 0.5,
      duration: 100,
      useNativeDriver: true,
    }).start(() => {
      setTempLocationName(locationName);
      setIsEditing(false);
      Animated.timing(editFadeAnim, {
        toValue: 1,
        duration: 150,
        useNativeDriver: true,
      }).start();
    });
  };

  const handleStartEdit = () => {
    Animated.timing(editFadeAnim, {
      toValue: 0.7,
      duration: 100,
      useNativeDriver: true,
    }).start(() => {
      setTempLocationName(locationName);
      setIsEditing(true);
      Animated.timing(editFadeAnim, {
        toValue: 1,
        duration: 150,
        useNativeDriver: true,
      }).start();
    });
  };

  const handleSelectFromHistory = async (historyItem: LocationHistory) => {
    onLocationNameChange(historyItem.name);
    setShowHistory(false);
    setSearchQuery('');
    
    // Update usage count
    await LocationHistoryService.addToHistory(
      historyItem.name,
      historyItem.latitude,
      historyItem.longitude,
      historyItem.isAutoDetected
    );
    loadLocationHistory();
  };

  const showLocationHistory = () => {
    setSearchQuery('');
    loadLocationHistory();
    setShowHistory(true);
  };

  const renderHistoryItem = ({ item }: { item: LocationHistory }) => (
    <TouchableOpacity
      style={styles.historyItem}
      onPress={() => handleSelectFromHistory(item)}
    >
      <View style={styles.historyItemContent}>
        <View style={styles.historyItemHeader}>
          <Text style={styles.historyItemName}>{item.name}</Text>
          <View style={styles.historyItemBadge}>
            <Text style={styles.historyItemCount}>{item.usageCount}</Text>
          </View>
        </View>
        <View style={styles.historyItemMeta}>
          <Clock size={12} color={colors.textLight} />
          <Text style={styles.historyItemDate}>
            {new Date(item.lastUsed).toLocaleDateString()}
          </Text>
          {item.isAutoDetected && (
            <Text style={styles.historyItemType}>Auto-detected</Text>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
  <View style={styles.container}>
      <View style={styles.labelRow}>
        <Text style={styles.label}>{t('posts.location')}</Text>
        <View style={styles.actionButtons}>
          {!isEditing && (
            <>
              <TouchableOpacity 
                style={styles.actionButton}
                onPress={showLocationHistory}
                disabled={isLoading}
              >
                <Clock size={14} color={colors.primary} />
                <Text style={styles.actionButtonText}>{t('posts.locationHistory')}</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.actionButton}
                onPress={handleStartEdit}
                disabled={isLoading}
              >
                <Edit3 size={14} color={colors.primary} />
                <Text style={styles.actionButtonText}>{t('posts.editLocation')}</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[
                  styles.actionButton,
                  isRefreshing && styles.actionButtonDisabled
                ]}
                onPress={handleRefresh}
                disabled={isRefreshing || !currentLocation}
              >
                <Animated.View
                  style={{
                    transform: [{
                      rotate: rotationAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: ['0deg', '360deg'],
                      }),
                    }],
                  }}
                >
                  <RefreshCw 
                    size={14} 
                    color={isRefreshing ? colors.textLight : colors.primary}
                  />
                </Animated.View>
                <Text style={[
                  styles.actionButtonText, 
                  { color: isRefreshing ? colors.textLight : colors.primary }                ]}>
                  {isRefreshing ? t('common.loading') : t('posts.refreshLocation')}
                </Text>
              </TouchableOpacity>
            </>
          )}
          
          {isEditing && (
            <>
              <TouchableOpacity 
                style={styles.actionButton}
                onPress={handleEditSave}
              >
                <Check size={14} color={colors.success} />
                <Text style={[styles.actionButtonText, { color: colors.success }]}>Save</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.actionButton}
                onPress={handleEditCancel}
              >
                <X size={14} color={colors.error} />
                <Text style={[styles.actionButtonText, { color: colors.error }]}>Cancel</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </View>
      <Animated.View 
        style={[
          styles.locationInputContainer,
          {
            opacity: editFadeAnim,
          }
        ]}
      >
        <MapPin size={20} color={colors.textLight} style={styles.locationIcon} />
        {isEditing ? (
          <TextInput
            style={styles.locationInput}
            placeholder="Enter location name"
            value={tempLocationName}
            onChangeText={setTempLocationName}
            autoFocus
            multiline={false}
          />
        ) : (
          <Text style={styles.locationText}>
            {geocodingResult && geocodingResult.formattedAddress ? 
              geocodingResult.formattedAddress : 
              (locationName || (currentLocationName ? 'Auto-detected location' : 'No location set'))
            }
          </Text>
        )}
      </Animated.View>
      {/* Location info */}
      <View style={styles.locationInfoContainer}>
        {currentLocation && (
          <Text style={styles.locationInfo}>
            📍 Coordinates: {currentLocation.latitude.toFixed(4)}, {currentLocation.longitude.toFixed(4)}
          </Text>
        )}
        {/* Enhanced address details */}
        {geocodingResult && showDetailedInfo && (
          <View style={styles.addressDetailsContainer}>
            {/* Street address */}
            {geocodingResult.streetNumber && geocodingResult.street ? (
              <Text style={styles.addressDetail}>
                🏠 {geocodingResult.streetNumber} {geocodingResult.street}
              </Text>
            ) : geocodingResult.street ? (
              <Text style={styles.addressDetail}>
                🏠 {geocodingResult.street}
              </Text>
            ) : geocodingResult.name ? (
              <Text style={styles.addressDetail}>
                🏠 {geocodingResult.name}
              </Text>
            ) : null}
            
            {/* District - show if available */}
            {geocodingResult.district && (
              <Text style={styles.addressDetail}>
                🏘️ {geocodingResult.district}
              </Text>
            )}
            
            {/* City - prefer city over region, but show region if no city */}
            {geocodingResult.city ? (
              <Text style={styles.addressDetail}>
                🏙️ {geocodingResult.city}
              </Text>
            ) : geocodingResult.region ? (
              <Text style={styles.addressDetail}>
                🏙️ {geocodingResult.region}
              </Text>
            ) : null}
            
            {/* Additional region info only if different from city */}
            {geocodingResult.region && geocodingResult.city && geocodingResult.region !== geocodingResult.city && (
              <Text style={styles.addressDetail}>
                �️ {geocodingResult.region}
              </Text>
            )}
          </View>
        )}
          {currentLocationName && !isEditing && !geocodingResult && (
          <Text style={styles.locationDetected}>
            🎯 Auto-detected: {currentLocationName}
          </Text>
        )}
        
        {!currentLocation && (
          <Text style={styles.locationError}>
            ⚠️ Getting your location...
          </Text>
        )}
      </View>

      {/* Location History Modal */}
      <Modal
        visible={showHistory}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowHistory(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Location History</Text>
            <TouchableOpacity
              style={styles.modalCloseButton}
              onPress={() => setShowHistory(false)}
            >
              <X size={24} color={colors.text} />
            </TouchableOpacity>
          </View>

          <View style={styles.searchContainer}>
            <Search size={20} color={colors.textLight} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search locations..."
              value={searchQuery}
              onChangeText={handleSearchChange}
            />
          </View>

          <FlatList
            data={locationHistory}
            keyExtractor={(item) => item.id}
            renderItem={renderHistoryItem}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Clock size={48} color={colors.textLight} />
                <Text style={styles.emptyText}>No location history found</Text>
                <Text style={styles.emptySubtext}>
                  Start creating posts to build your location history
                </Text>
              </View>
            }
            contentContainerStyle={styles.historyList}
          />
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 20,
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 8,
  },  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: colors.border,
  },
  actionButtonDisabled: {
    opacity: 0.6,
  },
  actionButtonText: {
    fontSize: 11,
    fontWeight: '500',
    marginLeft: 3,
    color: colors.primary,
  },
  locationInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    paddingHorizontal: 12,
    minHeight: 48,
  },
  locationIcon: {
    marginRight: 8,
  },
  locationInput: {
    flex: 1,
    padding: 12,
    fontSize: 16,
    color: colors.text,
  },  locationText: {
    flex: 1,
    padding: 12,
    fontSize: 16,
    color: colors.text,
  },
  locationInfoContainer: {
    marginTop: 6,
  },
  locationInfo: {
    fontSize: 11,
    color: colors.textLight,
    marginTop: 2,
  },
  locationDetected: {
    fontSize: 11,
    color: colors.primary,
    marginTop: 2,
    fontWeight: '500',
  },  locationError: {
    fontSize: 11,
    color: colors.error,
    marginTop: 2,
  },
  addressDetailsContainer: {
    marginTop: 4,
    paddingLeft: 8,
  },
  addressDetail: {
    fontSize: 11,
    color: colors.textLight,
    marginTop: 1,
    lineHeight: 16,
  },
  
  // Modal styles
  modalContainer: {
    flex: 1,
    backgroundColor: colors.background,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.card,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
  },
  modalCloseButton: {
    padding: 4,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    margin: 16,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: colors.card,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 16,
    color: colors.text,
  },
  historyList: {
    padding: 16,
  },
  historyItem: {
    backgroundColor: colors.card,
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  historyItemContent: {
    flex: 1,
  },
  historyItemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  historyItemName: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.text,
    flex: 1,
  },
  historyItemBadge: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  historyItemCount: {
    fontSize: 12,
    color: 'white',
    fontWeight: '600',
  },
  historyItemMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  historyItemDate: {
    fontSize: 12,
    color: colors.textLight,
  },
  historyItemType: {
    fontSize: 10,
    color: colors.primary,
    backgroundColor: colors.background,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginLeft: 8,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.textLight,
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: colors.textLight,
    textAlign: 'center',
    marginTop: 8,
    paddingHorizontal: 32,
  },
});
