import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { User } from '../types';
import * as userService from '../services/userService';

interface UserState {
  // Trạng thái người dùng hiện tại
  currentUser: User | null;
  isLoading: boolean;
  error: string | null;
  
  // Danh sách bạn bè
  friends: User[];
  friendsLoading: boolean;
  
  // Lời mời kết bạn
  friendRequests: User[];
  friendRequestsLoading: boolean;
  
  // Kết quả tìm kiếm
  searchResults: User[];
  searchLoading: boolean;
  
  // Hành động
  getCurrentUserProfile: () => Promise<User | null>;
  updateUserAvatar: (imageUri: string) => Promise<void>;
  getFriendsList: (page?: number, limit?: number) => Promise<void>;
  getFriendRequests: (page?: number, limit?: number) => Promise<void>;
  searchUsers: (query: string, page?: number, limit?: number) => Promise<void>;
  sendFriendRequest: (userId: string) => Promise<{ success: boolean, message: string }>;
  respondToFriendRequest: (requestId: string, action: 'accept' | 'reject') => Promise<{ success: boolean, message: string }>;
  unfriendUser: (friendId: string) => Promise<{ success: boolean, message: string }>;  clearError: () => void;
  updateUserSettings: (settings: {
    notificationRadius: number;
    language?: 'en' | 'vi';
  }) => Promise<void>;
  updateUsername: (username: string) => Promise<void>;
  updateFullname: (fullname: string) => Promise<void>;
  updateBio: (bio: string) => Promise<void>;
}

export const useUserStore = create<UserState>()(
  persist(
    (set, get) => ({
      currentUser: null,
      isLoading: false,
      error: null,
      friends: [],
      friendsLoading: false,
      friendRequests: [],
      friendRequestsLoading: false,
      searchResults: [],
      searchLoading: false,
      
      // Lấy thông tin người dùng hiện tại
      getCurrentUserProfile: async () => {
        try {
          set({ isLoading: true, error: null });
          console.log('Getting current user profile...');
          
          // First get saved settings from AsyncStorage
          const savedSettings = await AsyncStorage.getItem('user-settings');
          console.log('Saved settings from AsyncStorage:', savedSettings);
          
          // Get user from backend
          const user = await userService.getCurrentUserProfile();
          console.log('User from backend:', user);
            if (user) {
              let finalSettings = user.settings || {
              notificationRadius: 5,
              language: 'vi' as 'en' | 'vi'
            };

            // If we have saved settings, merge them with priority
            if (savedSettings) {
              const parsedSettings = JSON.parse(savedSettings);
              finalSettings = {
                ...finalSettings,  // Backend settings as base
                ...parsedSettings  // Local settings take priority
              };
              console.log('Merged settings:', finalSettings);
            }

            // Create final user object with merged settings
            const finalUser = {
              ...user,
              settings: finalSettings
            };

            console.log('Setting final user with settings:', finalUser);
            set({ currentUser: finalUser });
            return finalUser;
          }
          return null;
        } catch (error) {
          console.error('Error in getCurrentUserProfile:', error);
          set({ error: 'Failed to get user profile' });
          return null;
        } finally {
          set({ isLoading: false });
        }
      },
      
      // Cập nhật avatar người dùng
      updateUserAvatar: async (imageUri: string) => {
        try {
          set({ isLoading: true, error: null });
          const result = await userService.updateUserAvatar(imageUri);
          if ('error' in result) {
            throw new Error(result.error);
          }
          const updatedUser = userService.mapBackendUserToAppUser(result.data);
          set({ currentUser: updatedUser });
        } catch (error) {
          set({ error: error instanceof Error ? error.message : 'Failed to update avatar' });
          throw error;
        } finally {
          set({ isLoading: false });
        }
      },
      
      // Lấy danh sách bạn bè
      getFriendsList: async (page = 1, limit = 10) => {
        set({ friendsLoading: true, error: null });
        try {
          const friends = await userService.getFriendsList(page, limit);
          set({ friends, friendsLoading: false });
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Không thể lấy danh sách bạn bè';
          set({ error: errorMessage, friendsLoading: false });
        }
      },
      
      // Lấy danh sách lời mời kết bạn
      getFriendRequests: async (page = 1, limit = 10) => {
        set({ friendRequestsLoading: true, error: null });
        try {
          const requests = await userService.getFriendRequests(page, limit);
          set({ friendRequests: requests, friendRequestsLoading: false });
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Không thể lấy danh sách lời mời kết bạn';
          set({ error: errorMessage, friendRequestsLoading: false });
        }
      },
      
      // Tìm kiếm người dùng
      searchUsers: async (query: string, page = 1, limit = 10) => {
        if (!query.trim()) {
          set({ searchResults: [], searchLoading: false });
          return;
        }
        
        set({ searchLoading: true, error: null });
        try {
          const users = await userService.searchUsers(query, page, limit);
          set({ searchResults: users, searchLoading: false });
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Không thể tìm kiếm người dùng';
          set({ error: errorMessage, searchLoading: false });
        }
      },
      
      // Gửi lời mời kết bạn
      sendFriendRequest: async (userId: string) => {
        set({ isLoading: true, error: null });
        try {
          const result = await userService.sendFriendRequest(userId);
          set({ isLoading: false });
          return result;
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Không thể gửi lời mời kết bạn';
          set({ error: errorMessage, isLoading: false });
          return {
            success: false,
            message: errorMessage
          };
        }
      },
      
      // Phản hồi lời mời kết bạn
      respondToFriendRequest: async (requestId: string, action: 'accept' | 'reject') => {
        set({ isLoading: true, error: null });
        try {
          const result = await userService.respondToFriendRequest(requestId, action);
          set({ isLoading: false });
          
          if (result.success) {
            get().getFriendRequests();
            if (action === 'accept') {
              get().getFriendsList();
            }
          }
          
          return result;
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Không thể phản hồi lời mời kết bạn';
          set({ error: errorMessage, isLoading: false });
          return {
            success: false,
            message: errorMessage
          };
        }
      },
      
      // Hủy kết bạn
      unfriendUser: async (friendId: string) => {
        set({ isLoading: true, error: null });
        try {
          const result = await userService.unfriendUser(friendId);
          set({ isLoading: false });
          
          if (result.success) {
            get().getFriendsList();
          }
          
          return result;
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Không thể hủy kết bạn';
          set({ error: errorMessage, isLoading: false });
          return {
            success: false,
            message: errorMessage
          };
        }
      },
      
      // Xóa thông báo lỗi
      clearError: () => set({ error: null }),
      
      // Cập nhật cài đặt người dùng
      updateUserSettings: async (settings) => {
        try {
          set({ isLoading: true, error: null });
          console.log('Updating settings in store:', settings);
          
          // First save to AsyncStorage to ensure we have a local copy
          await AsyncStorage.setItem('user-settings', JSON.stringify(settings));
          
          // Then update in backend
          const updatedUser = await userService.updateUserSettings(settings);
          
          if (updatedUser) {
            // Merge the settings properly
            const mergedSettings = {
              ...(get().currentUser?.settings || {}),
              ...settings
            };
            
            console.log('Merged settings:', mergedSettings);
            
            // Update the store with new user data and merged settings
            set({ 
              currentUser: {
                ...get().currentUser,
                ...updatedUser,
                settings: mergedSettings
              } as User 
            });
            
            // Verify the update
            const currentState = get().currentUser;
            console.log('Store state after update:', {
              settings: currentState?.settings,
              stored: await AsyncStorage.getItem('user-settings')
            });
          }
        } catch (error) {
          console.error('Error in updateUserSettings:', error);
          set({ error: error instanceof Error ? error.message : 'Failed to update settings' });
          throw error;
        } finally {
          set({ isLoading: false });
        }
      },
      // Cập nhật tên người dùng
      updateUsername: async (username) => {
        try {
          set({ isLoading: true, error: null });
          const updatedUser = await userService.updateUsername(username);
          if (updatedUser) {
            set({ currentUser: updatedUser });
          }
        } catch (error) {
          set({ error: error instanceof Error ? error.message : 'Failed to update username' });
          throw error;
        } finally {
          set({ isLoading: false });
        }
      },

      // Cập nhật họ tên đầy đủ
      updateFullname: async (fullname) => {
        try {
          set({ isLoading: true, error: null });
          const updatedUser = await userService.updateFullname(fullname);
          if (updatedUser) {
            set({ currentUser: updatedUser });
          }
        } catch (error) {
          set({ error: error instanceof Error ? error.message : 'Failed to update full name' });
          throw error;
        } finally {
          set({ isLoading: false });
        }
      },

      // Cập nhật bio
      updateBio: async (bio) => {
        try {
          set({ isLoading: true, error: null });
          const updatedUser = await userService.updateBio(bio);
          if (updatedUser) {
            set({ currentUser: updatedUser });
          }
        } catch (error) {
          set({ error: error instanceof Error ? error.message : 'Failed to update bio' });
          throw error;
        } finally {
          set({ isLoading: false });
        }
      },
    }),
    {
      name: 'user-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
