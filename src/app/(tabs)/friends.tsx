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
  ScrollView,
  RefreshControl
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Search, User as UserIcon } from 'lucide-react-native';

import { useAuthStore } from '../../store/authStore';
import { colors } from '../../constants/colors';
import { getFriendsList, searchUsers, getFriendRequests, respondToFriendRequest } from '../../services/userService';
import { User } from '../../types';
import UserProfileModal from '../../components/UserProfileModal';

export default function FriendsScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [friendsList, setFriendsList] = useState<User[]>([]);
  const [friendRequests, setFriendRequests] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [isLoadingRequests, setIsLoadingRequests] = useState(false);
  const [page, setPage] = useState(1);
  const [requestsPage, setRequestsPage] = useState(1);
  const [searchPage, setSearchPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [hasMoreRequests, setHasMoreRequests] = useState(true);
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
    loadFriendRequests(1, true);
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

  const loadFriendRequests = async (pageNum = 1, shouldRefresh = false) => {
    if (isLoadingRequests || (!hasMoreRequests && !shouldRefresh)) return;
    
    try {
      setIsLoadingRequests(true);
      const limit = 10;
      const requests = await getFriendRequests(pageNum, limit);
      
      if (shouldRefresh || pageNum === 1) {
        setFriendRequests(requests);
      } else {
        setFriendRequests(prevRequests => [...prevRequests, ...requests]);
      }

      setHasMoreRequests(requests.length === limit);
      setRequestsPage(pageNum);
    } catch (error) {
      console.error('Error loading friend requests:', error);
    } finally {
      setIsLoadingRequests(false);
    }
  };
  
  const handleLoadMoreRequests = () => {
    if (!isLoadingRequests && hasMoreRequests) {
      loadFriendRequests(requestsPage + 1);
    }
  };
  
  const handleRequestsRefresh = () => {
    loadFriendRequests(1, true);
  };
  
  const handleRespondToRequest = async (userId: string, action: 'accept' | 'reject', requestId?: string) => {
    try {
      if (!requestId) {
        console.error('Request ID is missing, cannot respond to friend request');
        return;
      }
      
      const response = await respondToFriendRequest(requestId, action);
      
      if (response.success) {
        // Cập nhật UI sau khi phản hồi lời mời kết bạn
        setFriendRequests(prevRequests => 
          prevRequests.filter(request => request.id !== userId)
        );
        
        // Nếu chấp nhận lời mời, thêm người dùng vào danh sách bạn bè
        if (action === 'accept') {
          loadFriends(1, true);
        }
      } else {
        console.error('Error responding to friend request:', response.message);
      }
    } catch (error) {
      console.error('Error responding to friend request:', error);
    }
  };

  // Render a search result item with proper friend status indicator
  const renderSearchResultItem = ({ item }: { item: User }) => {
    return (
      <TouchableOpacity 
        style={styles.userItem}
        onPress={() => handleViewProfile(item.id)}
      >
        <Image source={{ uri: item.avatar }} style={styles.userAvatar} />
        <View style={styles.userInfo}>
          <Text style={styles.username}>{item.fullname}</Text>
          <Text style={styles.userEmail}>{item.email}</Text>
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
        <Image source={{ uri: item.avatar }} style={styles.userAvatar} />
        <View style={styles.userInfo}>
          <Text style={styles.username}>{item.fullname}</Text>
          {item.bio ? (
            <Text style={styles.userBio} numberOfLines={1}>{item.bio}</Text>
          ) : (
            <Text style={styles.userEmail} numberOfLines={1}>{item.email}</Text>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  // Render a friend request item with accept/reject buttons
  const renderFriendRequestItem = ({ item }: { item: User }) => {
    return (
      <View style={styles.userItem}>
        <TouchableOpacity onPress={() => handleViewProfile(item.id)}>
          <Image source={{ uri: item.avatar }} style={styles.userAvatar} />
        </TouchableOpacity>
        <View style={styles.userInfo}>
          <TouchableOpacity onPress={() => handleViewProfile(item.id)}>
            <Text style={styles.username}>{item.fullname}</Text>
            <Text style={styles.userEmail} numberOfLines={1}>{item.email}</Text>
          </TouchableOpacity>
          
          <View style={styles.requestActions}>
            <TouchableOpacity 
              style={[styles.actionButton, styles.acceptButton]}
              onPress={() => handleRespondToRequest(item.id, 'accept', item.requestId)}
            >
              <Text style={styles.actionButtonText}>Accept</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.actionButton, styles.rejectButton]}
              onPress={() => handleRespondToRequest(item.id, 'reject', item.requestId)}
            >
              <Text style={[styles.actionButtonText, styles.rejectButtonText]}>Reject</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
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
        <ScrollView 
          style={styles.scrollContainer}
          contentContainerStyle={styles.scrollContent}
          refreshControl={
            <RefreshControl
              refreshing={isLoading}
              onRefresh={() => {
                handleRefresh();
                handleRequestsRefresh();
              }}
            />
          }
        >
          {/* Friends List Section */}
          <View style={styles.friendsSection}>
            <Text style={styles.sectionTitle}>Your Friends</Text>
            
            {friendsList.length > 0 ? (
              <>
                {friendsList.map((item) => (
                  <View key={item.id}>
                    {renderUserItem({ item })}
                  </View>
                ))}
                {isLoading && renderFooter(isLoading)}
                {hasMore && (
                  <TouchableOpacity 
                    style={styles.loadMoreButton} 
                    onPress={handleLoadMore}
                  >
                    <Text style={styles.loadMoreText}>Load more friends</Text>
                  </TouchableOpacity>
                )}
              </>
            ) : (
              !isLoading && (
                <View style={styles.emptyContainer}>
                  <UserIcon size={40} color={colors.textLight} />
                  <Text style={styles.emptyTitle}>No friends yet</Text>
                  <Text style={styles.emptyText}>
                    Search for users to add them as friends
                  </Text>
                </View>
              )
            )}
          </View>

          {/* Friend Requests Section */}
          <View style={styles.requestsSection}>
            <Text style={styles.sectionTitle}>Friend Requests</Text>
            
            {friendRequests.length > 0 ? (
              <>
                {friendRequests.map((item) => (
                  <View key={item.id}>
                    {renderFriendRequestItem({ item })}
                  </View>
                ))}
                {isLoadingRequests && renderFooter(isLoadingRequests)}
                {hasMoreRequests && (
                  <TouchableOpacity 
                    style={styles.loadMoreButton} 
                    onPress={handleLoadMoreRequests}
                  >
                    <Text style={styles.loadMoreText}>Load more requests</Text>
                  </TouchableOpacity>
                )}
              </>
            ) : (
              !isLoadingRequests && (
                <View style={styles.emptyContainer}>
                  <UserIcon size={40} color={colors.textLight} />
                  <Text style={styles.emptyTitle}>No friend requests yet</Text>
                  <Text style={styles.emptyText}>
                    Friend requests will appear here when someone wants to connect with you
                  </Text>
                </View>
              )
            )}
          </View>
        </ScrollView>
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
  // Styles for friend request actions
  requestActions: {
    flexDirection: 'row',
    marginTop: 8,
  },
  actionButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 6,
    marginRight: 8,
  },
  acceptButton: {
    backgroundColor: colors.primary,
  },
  rejectButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: colors.border,
  },
  actionButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  rejectButtonText: {
    color: colors.text,
  },
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  requestsSection: {
    marginBottom: 16,
  },
  friendsSection: {
    marginBottom: 16,
  },
  loadMoreButton: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    backgroundColor: colors.primary,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 12,
  },
  loadMoreText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});