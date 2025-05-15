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
  updateUserAvatar: (localAvatarUri: string) => Promise<void>;
  getFriendsList: (page?: number, limit?: number) => Promise<void>;
  getFriendRequests: (page?: number, limit?: number) => Promise<void>;
  searchUsers: (query: string, page?: number, limit?: number) => Promise<void>;
  sendFriendRequest: (userId: string) => Promise<{ success: boolean, message: string }>;
  respondToFriendRequest: (requestId: string, action: 'accept' | 'reject') => Promise<{ success: boolean, message: string }>;
  unfriendUser: (friendId: string) => Promise<{ success: boolean, message: string }>;
  clearError: () => void;
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
        set({ isLoading: true, error: null });
        try {
          const user = await userService.getCurrentUserProfile();
          set({ currentUser: user, isLoading: false });
          return user;
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Không thể lấy thông tin người dùng';
          set({ 
            error: errorMessage, 
            isLoading: false 
          });
          return null;
        }
      },
      
      // Cập nhật avatar người dùng
      updateUserAvatar: async (localAvatarUri: string) => {
        set({ isLoading: true, error: null });
        try {
          const result = await userService.updateUserAvatar(localAvatarUri);
          if (result.error) {
            set({ error: result.error, isLoading: false });
            return;
          }
          
          // Làm mới thông tin người dùng
          const user = await userService.getCurrentUserProfile();
          set({ currentUser: user, isLoading: false });
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Không thể cập nhật ảnh đại diện';
          set({ 
            error: errorMessage, 
            isLoading: false 
          });
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
          set({ 
            error: errorMessage, 
            friendsLoading: false 
          });
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
          set({ 
            error: errorMessage, 
            friendRequestsLoading: false 
          });
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
          set({ 
            error: errorMessage, 
            searchLoading: false 
          });
        }
      },
      
      // Gửi lời mời kết bạn
      sendFriendRequest: async (userId: string) => {
        set({ isLoading: true, error: null });
        try {
          const result = await userService.sendFriendRequest(userId);
          set({ isLoading: false });
          
          if (!result.success) {
            set({ error: result.message });
          }
          
          return result;
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Không thể gửi lời mời kết bạn';
          set({ 
            error: errorMessage, 
            isLoading: false 
          });
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
            // Cập nhật lại danh sách lời mời kết bạn
            get().getFriendRequests();
            
            // Nếu chấp nhận, cập nhật lại danh sách bạn bè
            if (action === 'accept') {
              get().getFriendsList();
            }
          } else {
            set({ error: result.message });
          }
          
          return result;
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Không thể phản hồi lời mời kết bạn';
          set({ 
            error: errorMessage, 
            isLoading: false 
          });
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
            // Cập nhật lại danh sách bạn bè
            get().getFriendsList();
          } else {
            set({ error: result.message });
          }
          
          return result;
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Không thể hủy kết bạn';
          set({ 
            error: errorMessage, 
            isLoading: false 
          });
          return {
            success: false,
            message: errorMessage
          };
        }
      },
      
      // Xóa thông báo lỗi
      clearError: () => set({ error: null }),
    }),
    {
      name: 'user-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
