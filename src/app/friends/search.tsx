import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TextInput,
  FlatList,
  TouchableOpacity,
  Image,
  ActivityIndicator
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Search, X, ChevronLeft, User as UserIcon } from 'lucide-react-native';
import { colors } from '../../constants/colors';
import { searchUsers, getFriendRequests, respondToFriendRequest, getSentFriendRequests } from '../../services/userService';
import { User } from '../../types';
import { useTranslation } from '../../i18n';

export default function SearchFriendsScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [friendRequests, setFriendRequests] = useState<User[]>([]);
  const [sentRequests, setSentRequests] = useState<User[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isLoadingRequests, setIsLoadingRequests] = useState(false);
  const [isLoadingSentRequests, setIsLoadingSentRequests] = useState(false);
  const [activeTab, setActiveTab] = useState<'received' | 'sent'>('received');

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(searchQuery);
    }, 500);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Handle search
  useEffect(() => {
    if (debouncedQuery.trim()) {
      handleSearch(debouncedQuery);
    } else {
      setSearchResults([]);
    }
  }, [debouncedQuery]);

  // Load friend requests
  useEffect(() => {
    loadFriendRequests();
    loadSentRequests();
  }, []);

  const handleSearch = async (query: string) => {
    if (!query.trim()) return;
    
    try {
      setIsSearching(true);
      const results = await searchUsers(query, 1, 10);
      setSearchResults(results);
    } catch (error) {
      console.error('Error searching users:', error);
    } finally {
      setIsSearching(false);
    }
  };

  const loadFriendRequests = async () => {
    try {
      setIsLoadingRequests(true);
      const requests = await getFriendRequests(1, 10);
      setFriendRequests(requests);
    } catch (error) {
      console.error('Error loading friend requests:', error);
    } finally {
      setIsLoadingRequests(false);
    }
  };

  const loadSentRequests = async () => {
    try {
      setIsLoadingSentRequests(true);
      const requests = await getSentFriendRequests(1, 10);
      setSentRequests(requests);
    } catch (error) {
      console.error('Error loading sent requests:', error);
    } finally {
      setIsLoadingSentRequests(false);
    }
  };

  const handleRespondToRequest = async (userId: string, action: 'accept' | 'reject', requestId?: string) => {
    try {
      if (!requestId) return;
      
      const response = await respondToFriendRequest(requestId, action);
      
      if (response.success) {
        setFriendRequests(prev => prev.filter(request => request.id !== userId));
        if (action === 'accept') {
          // Refresh friends list on main screen
          // You might want to implement a refresh mechanism
        }
      }
    } catch (error) {
      console.error('Error responding to friend request:', error);
    }
  };

  const renderSearchResult = ({ item }: { item: User }) => (
    <TouchableOpacity 
      style={styles.userItem}
      onPress={() => router.push(`/profile/${item.id}`)}
    >
      <Image source={{ uri: item.avatar }} style={styles.userAvatar} />
      <View style={styles.userInfo}>
        <Text style={styles.username}>{item.fullname}</Text>
        <Text style={styles.userEmail}>@{item.username}</Text>
      </View>
    </TouchableOpacity>
  );
  const renderFriendRequest = ({ item }: { item: User }) => (
    <View style={styles.userItem}>
      <TouchableOpacity onPress={() => router.push(`/profile/${item.id}`)}>
        <Image source={{ uri: item.avatar }} style={styles.userAvatar} />
      </TouchableOpacity>
      <View style={styles.userInfo}>
        <TouchableOpacity onPress={() => router.push(`/profile/${item.id}`)}>
          <Text style={styles.username}>{item.fullname}</Text>
          <Text style={styles.userEmail}>@{item.username}</Text>
        </TouchableOpacity>
        
        <View style={styles.requestActions}>
          <TouchableOpacity 
            style={[styles.actionButton, styles.acceptButton]}
            onPress={() => handleRespondToRequest(item.id, 'accept', item.requestId)}
          >
            <Text style={styles.actionButtonText}>{t('friends.accept')}</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.actionButton, styles.rejectButton]}
            onPress={() => handleRespondToRequest(item.id, 'reject', item.requestId)}
          >
            <Text style={[styles.actionButtonText, styles.rejectButtonText]}>{t('friends.reject')}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
  const renderSentRequest = ({ item }: { item: User }) => (
    <View style={styles.userItem}>
      <TouchableOpacity onPress={() => router.push(`/profile/${item.id}`)}>
        <Image source={{ uri: item.avatar }} style={styles.userAvatar} />
      </TouchableOpacity>
      <View style={styles.userInfo}>
        <TouchableOpacity onPress={() => router.push(`/profile/${item.id}`)}>
          <Text style={styles.username}>{item.fullname}</Text>
          <Text style={styles.userEmail}>@{item.username}</Text>
        </TouchableOpacity>
        <Text style={styles.pendingText}>{t('friends.requestSent')}</Text>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <ChevronLeft size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.title}>{t('friends.findFriends')}</Text>
        <View style={{ width: 24 }} />
      </View>

      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <Search size={20} color={colors.textLight} style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder={t('friends.searchPlaceholder')}
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoFocus={true}
          />
          {searchQuery.length > 0 && isSearching && (
            <ActivityIndicator size="small" color={colors.primary} style={styles.searchLoader} />
          )}
        </View>
      </View>

      {/* Friend Requests Section */}
      {!searchQuery.trim() && (
        <View style={styles.section}>
          <View style={styles.tabContainer}>
            <TouchableOpacity 
              style={[styles.tab, activeTab === 'received' && styles.activeTab]}
              onPress={() => setActiveTab('received')}
            >
              <Text style={[styles.tabText, activeTab === 'received' && styles.activeTabText]}>
                {t('friends.receivedRequests')}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.tab, activeTab === 'sent' && styles.activeTab]}
              onPress={() => setActiveTab('sent')}
            >
              <Text style={[styles.tabText, activeTab === 'sent' && styles.activeTabText]}>
                {t('friends.sentRequests')}
              </Text>
            </TouchableOpacity>
          </View>

          {activeTab === 'received' ? (
            isLoadingRequests ? (
              <ActivityIndicator size="large" color={colors.primary} />
            ) : friendRequests.length > 0 ? (
              <FlatList
                data={friendRequests}
                renderItem={renderFriendRequest}
                keyExtractor={item => item.id}
                contentContainerStyle={styles.listContent}
              />
            ) : (
            <View style={styles.emptyContainer}>
                <UserIcon size={40} color={colors.textLight} />
                <Text style={styles.emptyTitle}>{t('friends.noReceivedRequests')}</Text>
                <Text style={styles.emptyText}>
                  {t('friends.requestsWillAppear')}
                </Text>
              </View>
            )
          ) : (
            isLoadingSentRequests ? (
              <ActivityIndicator size="large" color={colors.primary} />
            ) : sentRequests.length > 0 ? (
              <FlatList
                data={sentRequests}
                renderItem={renderSentRequest}
                keyExtractor={item => item.id}
                contentContainerStyle={styles.listContent}
              />
            ) : (
            <View style={styles.emptyContainer}>
                <UserIcon size={40} color={colors.textLight} />
                <Text style={styles.emptyTitle}>{t('friends.noSentRequests')}</Text>
                <Text style={styles.emptyText}>
                  {t('friends.searchAndConnect')}
                </Text>
              </View>
            )
          )}
        </View>
      )}

      {/* Search Results */}
      {searchQuery.trim() && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            {t('friends.searchResultsCount')} {!isSearching && searchResults.length > 0 ? `(${searchResults.length})` : ''}
          </Text>
          <FlatList
            data={searchResults}
            renderItem={renderSearchResult}
            keyExtractor={item => item.id}
            contentContainerStyle={styles.listContent}
            ListEmptyComponent={
              !isSearching ? (
                <View style={styles.emptyContainer}>
                  <Text style={styles.emptyText}>{t('friends.noUsersFoundSearch')}</Text>
                </View>
              ) : null
            }
          />
        </View>
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
  },
  searchContainer: {
    padding: 16,
    paddingTop: 8,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: 8,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: colors.border,
    height: 44,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: colors.text,
  },
  searchLoader: {
    marginLeft: 8,
  },
  section: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: 16,
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
  tabContainer: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 8,
    backgroundColor: colors.card,
    padding: 4,
  },
  tab: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 6,
  },
  activeTab: {
    backgroundColor: colors.primary,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.text,
  },
  activeTabText: {
    color: '#FFFFFF',
  },
  pendingText: {
    fontSize: 12,
    color: colors.textLight,
    fontStyle: 'italic',
    marginTop: 4,
  },
}); 