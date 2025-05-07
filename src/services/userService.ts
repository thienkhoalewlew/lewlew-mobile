import { User } from '../types';
import { api } from './api';
import { uploadUserAvatar } from './cloudinaryService';

// Cache người dùng để tránh gọi API nhiều lần cho cùng một người dùng
const userCache: Record<string, User> = {};

/**
 * Ánh xạ dữ liệu người dùng từ backend sang định dạng của ứng dụng
 */
export const mapBackendUserToAppUser = (backendUser: any): User => {
  return {
    id: backendUser._id || backendUser.id,
    username: backendUser.fullName,
    email: backendUser.email,
    profileImage: backendUser.profileImage || backendUser.avatar || 'https://images.unsplash.com/photo-1511367461989-f85a21fda167?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60',
    bio: backendUser.bio || '',
    friendIds: backendUser.friendIds || (Array.isArray(backendUser.friends) ? backendUser.friends.map((friend: any) => friend.id) : []),
    friendStatus: backendUser.friendStatus || 'none',
    createdAt: backendUser.createdAt ? new Date(backendUser.createdAt) : new Date(),
    token: backendUser.token,
  };
};

/**
 * Lấy thông tin người dùng theo ID
 * @param userId ID của người dùng cần lấy thông tin
 * @returns Promise<User | null> Thông tin người dùng hoặc null nếu không tìm thấy
 */
export const getUserById = async (userId: string): Promise<User | null> => {
  // Kiểm tra cache trước
  if (userCache[userId]) {
    return userCache[userId];
  }
  
  try {
    const response = await api.auth.getProfile(userId);
    if (response && response.data) {
      const userData = mapBackendUserToAppUser(response.data);
      
      // Cache lại thông tin người dùng
      userCache[userId] = userData;
      
      return userData;
    }
    return null;
  } catch (error) {
    console.error('Error fetching user:', error);
    return null;
  }
};

// Thêm hàm lấy profile user hiện tại (dùng cho màn profile của chính mình)
export const getCurrentUserProfile = async (): Promise<User | null> => {
  try {
    const response = await api.auth.getProfile();
    if (response && response.data) {
      return mapBackendUserToAppUser(response.data);
    }
    return null;
  } catch (error) {
    console.error('Error fetching current user profile:', error);
    return null;
  }
};

// Hàm cập nhật avatar cho user hiện tại sử dụng Cloudinary
export const updateUserAvatar = async (localAvatarUri: string) => {
  try {
    // 1. Tải ảnh lên Cloudinary
    const userId = await getCurrentUserId();
    if (!userId) {
      return { error: 'The current user cannot be determined' };
    }
    
    // 2. Tải ảnh lên Cloudinary và nhận URL
    const cloudinaryUrl = await uploadUserAvatar(localAvatarUri, userId);
    
    // 3. Cập nhật URL avatar trên backend
    return await api.auth.updateAvatar(cloudinaryUrl || '');
  } catch (error) {
    console.error('Error updating avatar:', error);
    return { error: 'Unable to update avatar' };
  }
};

// Hàm lấy ID của người dùng hiện tại
const getCurrentUserId = async (): Promise<string | null> => {
  try {
    const profile = await getCurrentUserProfile();
    return profile?.id || null;
  } catch (error) {
    console.error('Error getting current user ID:', error);
    return null;
  }
};

// Hàm lấy danh sách bạn bè của người dùng hiện tại
export const getFriendsList = async (page: number = 1, limit: number = 10): Promise<User[]> => {
  try {
    const response = await api.friendrelations.getFriends(page, limit);
    if (response.data && response.data.items) {
      // Map các đối tượng user từ backend sang định dạng User của ứng dụng
      const friends = response.data.items.map(mapBackendUserToAppUser);
      
      // Cache lại các người dùng để sử dụng sau này
      friends.forEach((friend: User) => {
        userCache[friend.id] = friend;
      });
      
      return friends;
    }
    return [];
  } catch (error) {
    console.error('Error fetching friends list:', error);
    return [];
  }
};

// Hàm tìm kiếm người dùng theo tên hoặc email
export const searchUsers = async (query: string, page: number = 1, limit: number = 10): Promise<User[]> => {
  try {
    if (!query.trim()) {
      return [];
    }
    
    const response = await api.friendrelations.searchUsers(query, page, limit);
    
    const usersData = response.data?.users || [];
    if (Array.isArray(usersData)) {
      // Map các đối tượng user từ backend sang định dạng User của ứng dụng
      const users = usersData.map(mapBackendUserToAppUser);
      
      // Cache lại các người dùng để sử dụng sau này
      users.forEach((user: User) => {
        userCache[user.id] = user;
      });
      
      return users;
    }
    
    return [];
  } catch (error) {
    console.error('Error searching users:', error);
    return [];
  }
};

/**
 * Lấy thông tin chi tiết của người dùng theo ID
 * @param userId ID của người dùng cần lấy thông tin
 * @returns Promise<User | null> Thông tin chi tiết người dùng hoặc null nếu không tìm thấy
 */
export const getUserProfileById = async (userId: string): Promise<User | null> => {
  try {
    const response = await api.auth.getProfile(userId);
    if (response && response.data) {
      const userData = mapBackendUserToAppUser(response.data);
      return userData;
    }
    return null;
  } catch (error) {
    console.error('Error fetching user profile:', error);
    return null;
  }
};

/**
 * Gửi lời mời kết bạn đến người dùng khác
 * @param userId ID của người dùng mà bạn muốn gửi lời mời
 * @returns Promise<{ success: boolean, message: string }> Kết quả của việc gửi lời mời
 */
export const sendFriendRequest = async (userId: string): Promise<{ success: boolean, message: string }> => {
  try {
    const response = await api.friendrelations.sendFriendRequest(userId);
    
    if (response.error) {
      return {
        success: false,
        message: response.error
      };
    }
    
    // Cập nhật trạng thái kết bạn trong cache nếu user đã được cache
    if (userCache[userId]) {
      userCache[userId] = {
        ...userCache[userId],
        friendStatus: 'pending'
      };
    }
    
    return {
      success: true,
      message: 'Friend request sent successfully'
    };
  } catch (error) {
    console.error('Error sending friend request:', error);
    return {
      success: false,
      message: 'Error sending friend request. Please try again later.'
    };
  }
};

/**
 * Lấy danh sách lời mời kết bạn của người dùng hiện tại
 * @param page Số trang (bắt đầu từ 1)
 * @param limit Số lượng lời mời kết bạn trên mỗi trang
 * @returns Promise<User[]> Danh sách người dùng đã gửi lời mời kết bạn
 */
export const getFriendRequests = async (page: number = 1, limit: number = 10): Promise<User[]> => {
  try {
    const response = await api.friendrelations.getFriendRequests(page, limit);
    console.log("Friend requests response:", JSON.stringify(response.data));
    
    // Kiểm tra cấu trúc dữ liệu trả về
    if (response.data && response.data.requests) {
      // Map các đối tượng request sang định dạng User với thêm requestId
      const requestUsers = response.data.requests.map((request: any) => {
        // Trường hợp dữ liệu từ API có cấu trúc khác nhau - xử lý cả hai trường hợp
        const userData = request.from || request.user1;
        const user = mapBackendUserToAppUser(userData);
        
        // Thêm requestId vào đối tượng user
        return {
          ...user,
          requestId: request._id || request.id, // ID của lời mời kết bạn
        };
      });
      
      // Cache lại các người dùng
      requestUsers.forEach((user: User) => {
        userCache[user.id] = user;
      });
      
      console.log("Mapped friend requests:", requestUsers.length);
      return requestUsers;
    }
    
    console.log("No friend requests found in response");
    return [];
  } catch (error) {
    console.error('Error fetching friend requests:', error);
    return [];
  }
};

/**
 * Phản hồi lời mời kết bạn (chấp nhận hoặc từ chối)
 * @param requestId ID của lời mời kết bạn
 * @param action 'accept' để chấp nhận hoặc 'reject' để từ chối
 * @returns Promise<{ success: boolean, message: string }> Kết quả của việc phản hồi
 */
export const respondToFriendRequest = async (
  requestId: string, 
  action: 'accept' | 'reject'
): Promise<{ success: boolean, message: string }> => {
  try {
    const response = await api.friendrelations.respondToFriendRequest(requestId, action);
    
    if (response.error) {
      return {
        success: false,
        message: response.error
      };
    }
    
    return {
      success: true,
      message: action === 'accept' ? 'Friend request accepted' : 'Friend request rejected'
    };
  } catch (error) {
    console.error('Error responding to friend request:', error);
    return {
      success: false,
      message: 'Error responding to friend request. Please try again later.'
    };
  }
};