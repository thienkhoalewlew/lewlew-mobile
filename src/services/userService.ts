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
    username: backendUser.username || '', 
    fullname: backendUser.fullName || backendUser.fullname || 'Unknown User',
    phoneNumber: backendUser.phoneNumber || '',
    avatar: backendUser.avatar || 'https://images.unsplash.com/photo-1511367461989-f85a21fda167?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60',
    bio: backendUser.bio || '',
    friendCount: backendUser.friendCount || (Array.isArray(backendUser.friends) ? backendUser.friends.length : 0),
    status: backendUser.friendStatus || backendUser.status || 'none',
    createdAt: backendUser.createdAt ? new Date(backendUser.createdAt) : new Date(),
    token: backendUser.token,
    requestId: backendUser.requestId,
    isRequestSender: backendUser.isRequestSender,
    settings: backendUser.settings || {
      notificationRadius: 5
    }
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

// Lấy profile user hiện tại
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
    
    if (!cloudinaryUrl) {
      return { error: 'Failed to upload avatar to Cloudinary' };
    }
    
    // 3. Cập nhật URL avatar trên backend sử dụng API mới
    // Backend sẽ tự động lưu thông tin ảnh vào uploads collection
    const updateResult = await api.auth.updateProfile({
      updateType: 'avatar',
      avatar: cloudinaryUrl
    });
    
    if (updateResult.error) {
      return updateResult;
    }
    
    return updateResult;
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
      console.log('Friends list data:', response.data.friends);

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

// Hàm tìm kiếm người dùng theo số điện thoại hoặc username
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

//Lấy thông tin chi tiết của người dùng theo ID
export const getUserProfileById = async (userId: string): Promise<User | null> => {
  try {
    const response = await api.auth.getProfile(userId); // Gọi API có userId
    if (response && response.data) {
      return mapBackendUserToAppUser(response.data);
    }
    return null;
  } catch (error) {
    console.error('Error fetching user profile by ID:', error);
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
      status: 'pending', // Thay 'friendStatus' bằng 'status'
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
    
    // Kiểm tra cấu trúc dữ liệu trả về
    if (response.data && response.data.requests) {
      // Map các đối tượng request sang định dạng User với thêm requestId
      console.log('Friend requests data:', response.data.requests);
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
      
      return requestUsers;
    }
    
    return [];
  } catch (error) {
    return [];
  }
};

/**
 * Lấy danh sách lời mời kết bạn đã gửi của người dùng hiện tại
 * @param page Số trang (bắt đầu từ 1)
 * @param limit Số lượng lời mời kết bạn trên mỗi trang
 * @returns Promise<User[]> Danh sách người dùng đã nhận lời mời kết bạn từ người dùng hiện tại
 */
export const getSentFriendRequests = async (page: number = 1, limit: number = 10): Promise<User[]> => {
  try {
    const response = await api.friendrelations.getSentRequests(page, limit);
    
    if (response.data && response.data.requests) {
      const requestUsers = response.data.requests.map((request: any) => {
        const userData = request.to || request.user2;
        const user = mapBackendUserToAppUser(userData);
        
        return {
          ...user,
          requestId: request._id || request.id,
        };
      });
      
      requestUsers.forEach((user: User) => {
        userCache[user.id] = user;
      });
      
      return requestUsers;
    }
    
    return [];
  } catch (error) {
    console.error('Error getting sent friend requests:', error);
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

export const unfriendUser = async (friendId: string): Promise<{ success: boolean; message: string }> => {
  try {
    const response = await api.friendrelations.unfriend(friendId); // Gọi API backend
    if (response.error) {
      return { success: false, message: response.error };
    }
    return { success: true, message: 'Unfriended successfully' };
  } catch (error) {
    console.error('Error unfriending user:', error);
    return { success: false, message: 'Unable to unfriend user. Please try again later.' };
  }
};

/**
 * Hủy lời mời kết bạn đã gửi
 * @param requestId ID của lời mời kết bạn
 * @returns Promise<{ success: boolean, message: string }> Kết quả của việc hủy lời mời
 */
export const cancelFriendRequest = async (requestId: string): Promise<{ success: boolean; message: string }> => {
  try {
    const response = await api.friendrelations.cancelFriendRequest(requestId);
    if (response.error) {
      return { success: false, message: response.error };
    }
    return { success: true, message: 'Friend request cancelled successfully' };
  } catch (error) {
    console.error('Error cancelling friend request:', error);
    return { success: false, message: 'Unable to cancel friend request. Please try again later.' };
  }
};

/**
 * Lấy danh sách ảnh đã upload của user hiện tại
 * @returns Promise<any[]> Danh sách ảnh đã upload
 */
export const getUserUploadedImages = async (): Promise<any[]> => {
  try {
    const response = await api.uploads.getUploadedImages();
    
    if (response.data && Array.isArray(response.data)) {
      return response.data;
    }
    
    console.log('No uploaded images found or invalid response format');
    return [];
  } catch (error) {
    console.error('Error fetching uploaded images:', error);
    return [];
  }
};

/**
 * Xóa ảnh đã upload
 * @param imageId ID của ảnh cần xóa
 * @returns Promise<{ success: boolean, message: string }> Kết quả xóa ảnh
 */
export const deleteUploadedImage = async (imageId: string): Promise<{ success: boolean, message: string }> => {
  try {
    const response = await api.uploads.deleteImage(imageId);
    
    if (response.error) {
      return {
        success: false,
        message: response.error
      };
    }
    
    return {
      success: true,
      message: 'Image deleted successfully'
    };
  } catch (error) {
    console.error('Error deleting image:', error);
    return {
      success: false,
      message: 'Unable to delete image. Please try again later.'
    };
  }
};

/**
 * Lấy thông tin ảnh theo loại (avatar, post, comment)
 * @param type Loại ảnh cần lọc
 * @returns Promise<any[]> Danh sách ảnh theo loại
 */
export const getUserImagesByType = async (type: 'user_avatar' | 'post_image' | 'comment_image'): Promise<any[]> => {
  try {
    const allImages = await getUserUploadedImages();
    
    return allImages.filter(image => 
      image.metadata && image.metadata.type === type
    );
  } catch (error) {
    console.error('Error fetching images by type:', error);
    return [];
  }
};

export const updateUserSettings = async (settings: {
  notificationRadius: number;
  language?: 'en' | 'vi';
}) => {
  try {
    console.log('Updating settings with:', settings);
    
    // Sử dụng API mới updateProfile thay vì updateSettings
    const response = await api.auth.updateProfile({
      updateType: 'settings',
      notificationRadius: settings.notificationRadius,
      language: settings.language
    });
    
    if (response.error) {
      throw new Error(response.error);
    }
    
    if (!response.data) {
      throw new Error('No data received from server');
    }
    
    console.log('Settings update response:', response.data);
    return mapBackendUserToAppUser(response.data);
  } catch (error) {
    console.error('Error updating settings:', error);
    throw error;
  }
};

export const updateUsername = async (username: string) => {
  try {
    const response = await api.auth.updateProfile({
      updateType: 'username',
      username
    });
    if (response.data) {
      return mapBackendUserToAppUser(response.data);
    }
    throw new Error('Failed to update username');
  } catch (error) {
    console.error('Error updating username:', error);
    throw error;
  }
};

export const updateFullname = async (fullname: string) => {
  try {
    const response = await api.auth.updateProfile({
      updateType: 'fullname',
      fullname
    });
    if (response.data) {
      return mapBackendUserToAppUser(response.data);
    }
    throw new Error('Failed to update full name');
  } catch (error) {
    console.error('Error updating full name:', error);
    throw error;
  }
};

export const updateBio = async (bio: string) => {
  try {
    const response = await api.auth.updateProfile({
      updateType: 'bio',
      bio
    });
    if (response.error) {
      throw new Error(response.error);
    }
    
    // Sau khi cập nhật bio thành công, lấy thông tin user mới nhất
    const userResponse = await api.auth.getCurrentUser();
    if (userResponse.error) {
      throw new Error(userResponse.error);
    }
    
    return userResponse.data ? mapBackendUserToAppUser(userResponse.data) : null;
  } catch (error) {
    console.error('Error updating bio:', error);
    throw error;
  }
};