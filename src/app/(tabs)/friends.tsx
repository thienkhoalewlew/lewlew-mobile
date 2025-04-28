import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList, 
  Image, 
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  ScrollView
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Search, User as UserIcon, UserPlus, UserCheck, Clock } from 'lucide-react-native';

import { useAuthStore } from '../../store/authStore';
import { colors } from '../../constants/colors';
import { getFriendsList, searchUsers } from '../../services/userService';
import { User } from '../../types';
import UserProfileModal from '../../components/UserProfileModal';

export default function FriendsScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [friendsList, setFriendsList] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [page, setPage] = useState(1);
  const [searchPage, setSearchPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [hasMoreSearchResults, setHasMoreSearchResults] = useState(true);
  
  // Biến trạng thái cho modal profile
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [isProfileModalVisible, setIsProfileModalVisible] = useState(false);
  
  const loadFriends = async (pageNum = 1, shouldRefresh = false) => {
    if (isLoading || (!hasMore && !shouldRefresh)) return;
    
    try {
      setIsLoading(true);
      const limit = 10;
      const friends = await getFriendsList(pageNum, limit);
      
      if (shouldRefresh || pageNum === 1) {
        setFriendsList(friends);
      } else {
        setFriendsList(prevFriends => [...prevFriends, ...friends]);
      }

      setHasMore(friends.length === limit);
      setPage(pageNum);
    } catch (error) {
      console.error('Error loading friends:', error);
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleSearch = async (query: string, pageNum = 1, shouldRefresh = false) => {
    if (!query.trim() || (isSearching && !shouldRefresh)) return;
    
    try {
      setIsSearching(true);
      const limit = 10;
      const results = await searchUsers(query, pageNum, limit);
      
      if (shouldRefresh || pageNum === 1) {
        setSearchResults(results);
      } else {
        setSearchResults(prevResults => [...prevResults, ...results]);
      }
      
      // Check if we've reached the end of the search results
      setHasMoreSearchResults(results.length === limit);
      setSearchPage(pageNum);
    } catch (error) {
      console.error('Error searching users:', error);
    } finally {
      setIsSearching(false);
    }
  };
  
  useEffect(() => {
    if (!user) return;

    loadFriends(1, true);
  }, [user]);
  
  // Handle search when query changes
  useEffect(() => {
    if (searchQuery.trim()) {
      handleSearch(searchQuery, 1, true);
    } else {
      setSearchResults([]);
    }
  }, [searchQuery]);
  
  const handleLoadMore = () => {
    if (!isLoading && hasMore) {
      loadFriends(page + 1);
    }
  };
  
  const handleLoadMoreSearchResults = () => {
    if (!isSearching && hasMoreSearchResults && searchQuery.trim()) {
      handleSearch(searchQuery, searchPage + 1);
    }
  };
  
  const handleRefresh = () => {
    loadFriends(1, true);
  };
  
  const handleSearchRefresh = () => {
    if (searchQuery.trim()) {
      handleSearch(searchQuery, 1, true);
    }
  };
  
  const handleViewProfile = (userId: string) => {
    setSelectedUserId(userId);
    setIsProfileModalVisible(true);
  };
  
  const closeProfileModal = () => {
    setIsProfileModalVisible(false);
    setSelectedUserId(null);
  };

  // Render a search result item with proper friend status indicator
  const renderSearchResultItem = ({ item }: { item: User }) => {
    return (
      <TouchableOpacity 
        style={styles.userItem}
        onPress={() => handleViewProfile(item.id)}
      >
        <Image source={{ uri: item.profileImage }} style={styles.userAvatar} />
        <View style={styles.userInfo}>
          <Text style={styles.username}>{item.username}</Text>
          <Text style={styles.userEmail}>{item.email}</Text>
          
          {/* Friend status indicator */}
          <View style={styles.friendStatusContainer}>
            {(!item.friendStatus || item.friendStatus === 'none') && (
              <>
                <UserPlus size={14} color={colors.primary} />
                <Text style={styles.friendStatusText}>Add Friend</Text>
              </>
            )}
            {item.friendStatus === 'pending' && (
              <>
                <Clock size={14} color="#F59E0B" />
                <Text style={[styles.friendStatusText, { color: "#F59E0B" }]}>Pending</Text>
              </>
            )}
            {item.friendStatus === 'accepted' && (
              <>
                <UserCheck size={14} color="#10B981" />
                <Text style={[styles.friendStatusText, { color: "#10B981" }]}>Friends</Text>
              </>
            )}
          </View>
        </View>
      </TouchableOpacity>
    );
  };
  
  const renderUserItem = ({ item }: { item: User }) => {
    return (
      <TouchableOpacity 
        style={styles.userItem}
        onPress={() => handleViewProfile(item.id)}
      >
        <Image source={{ uri: item.profileImage }} style={styles.userAvatar} />
        <View style={styles.userInfo}>
          <Text style={styles.username}>{item.username}</Text>
          {item.bio ? (
            <Text style={styles.userBio} numberOfLines={1}>{item.bio}</Text>
          ) : (
            <Text style={styles.userEmail} numberOfLines={1}>{item.email}</Text>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  const renderFooter = (loading: boolean) => {
    if (!loading) return null;
    
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="small" color={colors.primary} />
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['right', 'left']}>
      <StatusBar style="dark" />
      
      <View style={styles.header}>
        <Text style={styles.title}>Friends</Text>
        <View style={styles.searchContainer}>
          <Search size={20} color={colors.textLight} style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search users by name or email..."
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
      </View>
      
      {searchQuery.trim() ? (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            Search Results {searchResults.length > 0 ? `(${searchResults.length})` : ''}
          </Text>
          <FlatList
            data={searchResults}
            keyExtractor={(item) => item.id}
            renderItem={renderSearchResultItem}
            contentContainerStyle={styles.listContent}
            onEndReached={handleLoadMoreSearchResults}
            onEndReachedThreshold={0.5}
            refreshing={isSearching && searchPage === 1}
            onRefresh={handleSearchRefresh}
            ListFooterComponent={() => renderFooter(isSearching)}
            ListEmptyComponent={
              !isSearching ? (
                <View style={styles.emptyContainer}>
                  <Text style={styles.emptyText}>No users found</Text>
                </View>
              ) : null
            }
          />
        </View>
      ) : (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Your Friends</Text>
          <FlatList
            data={friendsList}
            keyExtractor={(item) => item.id}
            renderItem={renderUserItem}
            contentContainerStyle={styles.listContent}
            onEndReached={handleLoadMore}
            onEndReachedThreshold={0.5}
            refreshing={isLoading && page === 1}
            onRefresh={handleRefresh}
            ListFooterComponent={() => renderFooter(isLoading)}
            ListEmptyComponent={
              !isLoading ? (
                <View style={styles.emptyContainer}>
                  <UserIcon size={40} color={colors.textLight} />
                  <Text style={styles.emptyTitle}>No friends yet</Text>
                  <Text style={styles.emptyText}>
                    Search for users to add them as friends
                  </Text>
                </View>
              ) : null
            }
          />
        </View>
      )}
      
      {/* Modal xem thông tin người dùng */}
      {selectedUserId && (
        <UserProfileModal
          visible={isProfileModalVisible}
          userId={selectedUserId}
          onClose={closeProfileModal}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    padding: 16,
    backgroundColor: colors.card,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 16,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background,
    borderRadius: 8,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 10,
    fontSize: 16,
    color: colors.text,
  },
  section: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    padding: 16,
    paddingBottom: 8,
  },
  listContent: {
    paddingHorizontal: 16,
  },
  userItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
  },
  userAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  userInfo: {
    flex: 1,
    marginLeft: 12,
  },
  username: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  userEmail: {
    fontSize: 14,
    color: colors.textLight,
    marginTop: 2,
  },
  userBio: {
    fontSize: 14,
    color: colors.textLight,
    marginTop: 2,
  },
  friendStatusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
  },
  friendStatusText: {
    fontSize: 12,
    color: colors.primary,
    marginLeft: 4,
    fontWeight: '500',
  },
  emptyContainer: {
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginTop: 12,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: colors.textLight,
    textAlign: 'center',
  },
  loaderContainer: {
    padding: 16,
    alignItems: 'center',
  },
  debugContainer: {
    padding: 16,
    backgroundColor: colors.card,
    borderRadius: 8,
  },
  debugTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 8,
  },
  debugContent: {
    padding: 12,
  },
  debugText: {
    fontSize: 14,
    color: colors.text,
  },
});