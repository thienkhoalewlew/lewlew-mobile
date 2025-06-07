import AsyncStorage from '@react-native-async-storage/async-storage';
import { ca } from 'date-fns/locale';

export const API_URL = 'https://lewlew.io.vn/api';

// Headers mặc định cho các request
const defaultHeaders = {
  'Content-Type': 'application/json',
};

// Hàm helper để lấy token từ AsyncStorage
const getAuthToken = async (): Promise<string | null> => {
  try {
    const authData = await AsyncStorage.getItem('auth-storage');
    if (authData) {
      const parsedData = JSON.parse(authData);
      if (parsedData.state?.token) {
        return parsedData.state.token;
      }
    }
    return null;
  } catch (error) {
    console.error('Error getting auth token:', error);
    return null;
  }
};

// Hàm helper để thêm Authorization header nếu có token
const getAuthHeaders = async () => {
  const token = await getAuthToken();
  if (token) {
    return {
      ...defaultHeaders,
      'Authorization': `Bearer ${token}`,
    };
  }
  return defaultHeaders;
};

// Interface cho response từ API
interface ApiResponse<T> {
  data?: T;
  error?: string;
}

// Hàm helper để xử lý response từ API
const handleResponse = async <T>(response: Response): Promise<ApiResponse<T>> => {
  const contentType = response.headers.get('content-type');
  const isJson = contentType && contentType.includes('application/json');
  const data = isJson ? await response.json() : await response.text();

  if (!response.ok) {
    // Xử lý lỗi từ API
    const errorMessage = isJson && data.message ? data.message : 'An error occurred';
    return { error: errorMessage };
  }

  return { data: data as T };
};

// API endpoints
export const api = {
  // Auth APIs
  auth: {
    // Đăng ký người dùng mới
    register: async (fullName: string, phoneNumber: string, password: string, username: string): Promise<ApiResponse<any>> => {
      try {
        const response = await fetch(`${API_URL}/auth/register`, {
          method: 'POST',
          headers: defaultHeaders,
          body: JSON.stringify({ fullName, phoneNumber, password, username }),
        });
        
        
        // Parse response
        const result = await handleResponse<any>(response);
        return result;
      } catch (error) {
        console.error('Register error:', error);
        return { error: 'Network error. Please check your connection.' };
      }
    },
    // Đăng nhập
    login: async (login: string, password: string): Promise<ApiResponse<any>> => {
      try {
        const response = await fetch(`${API_URL}/auth/login`, {
          method: 'POST',
          headers: defaultHeaders,
          body: JSON.stringify({ login, password }),
        });
        
        return handleResponse<any>(response);
      } catch (error) {
        console.error('Login error:', error);
        return { error: 'Network error. Please check your connection.' };
      }
    },
    // Lấy thông tin profile người dùng hiện tại hoặc theo ID
    getProfile: async (userId?: string): Promise<ApiResponse<any>> => {
      try {
        const headers = await getAuthHeaders();
        const url = userId 
          ? `${API_URL}/users/profile?userId=${userId}`
          : `${API_URL}/users/profile`;
          
        const response = await fetch(url, {
          method: 'GET',
          headers,
        });
        return handleResponse<any>(response);
      } catch (error) {
        console.error('Get profile error:', error);
        return { error: 'Network error. Please check your connection.' };
      }
    },

    // Cập nhật avatar người dùng hiện tại
    updateAvatar: async (avatarUrl: string): Promise<ApiResponse<any>> => {
      try {
        const headers = await getAuthHeaders();
        const response = await fetch(`${API_URL}/users/update_avatar`, {
          method: 'PATCH',
          headers,
          body: JSON.stringify({ avatar: avatarUrl }),
        });
        return handleResponse<any>(response);
      } catch (error) {
        console.error('Update avatar error:', error);
        return { error: 'Network error. Please check your connection.' };
      }
    },    // Cập nhật settings người dùng
    updateSettings: async (settings: {
      notificationRadius: number;
      pushNotifications: boolean;
      emailNotifications: boolean;
      language?: 'en' | 'vi';
    }): Promise<ApiResponse<any>> => {
      try {
        const headers = await getAuthHeaders();
        const response = await fetch(`${API_URL}/users/update_settings`, {
          method: 'PATCH',
          headers,
          body: JSON.stringify(settings),
        });
        
        // Log response for debugging
        console.log('Update settings response:', response.status);
        const result = await handleResponse<any>(response);
        console.log('Update settings result:', result);
        
        return result;
      } catch (error) {
        console.error('Update settings error:', error);
        return { error: 'Network error. Please check your connection.' };
      }
    },

    // Cập nhật email
    updateEmail: async (data: { email: string }): Promise<ApiResponse<any>> => {
      try {
        const headers = await getAuthHeaders();
        const response = await fetch(`${API_URL}/users/email`, {
          method: 'PATCH',
          headers,
          body: JSON.stringify(data),
        });
        return handleResponse<any>(response);
      } catch (error) {
        console.error('Update email error:', error);
        return { error: 'Network error. Please check your connection.' };
      }
    },

    // Cập nhật mật khẩu
    updatePassword: async (data: { currentPassword: string; newPassword: string }): Promise<ApiResponse<any>> => {
      try {
        const headers = await getAuthHeaders();
        const response = await fetch(`${API_URL}/users/password`, {
          method: 'PATCH',
          headers,
          body: JSON.stringify(data),
        });
        return handleResponse<any>(response);
      } catch (error) {
        console.error('Update password error:', error);
        return { error: 'Network error. Please check your connection.' };
      }
    },

    // Cập nhật username
    updateUsername: async (data: { username: string }): Promise<ApiResponse<any>> => {
      try {
        const headers = await getAuthHeaders();
        const response = await fetch(`${API_URL}/users/update_username`, {
          method: 'PATCH',
          headers,
          body: JSON.stringify(data),
        });
        return handleResponse<any>(response);
      } catch (error) {
        console.error('Update username error:', error);
        return { error: 'Network error. Please check your connection.' };
      }
    },

    // Cập nhật fullname
    updateFullname: async (data: { fullname: string }): Promise<ApiResponse<any>> => {
      try {
        const headers = await getAuthHeaders();
        const response = await fetch(`${API_URL}/users/update_fullname`, {
          method: 'PATCH',
          headers,
          body: JSON.stringify(data),
        });
        return handleResponse<any>(response);
      } catch (error) {
        console.error('Update fullname error:', error);
        return { error: 'Network error. Please check your connection.' };
      }
    },

    // Lấy thông tin user hiện tại
    getCurrentUser: async (): Promise<ApiResponse<any>> => {
      try {
        const headers = await getAuthHeaders();
        const response = await fetch(`${API_URL}/users/profile`, {
          method: 'GET',
          headers,
        });

        const responseData = await response.json();
        
        if (!response.ok) {
          throw new Error(responseData.message || 'Failed to get user profile');
        }
        
        return { data: responseData };
      } catch (error) {
        console.error('Get current user error:', error);
        if (error instanceof Error) {
          return { error: error.message };
        }
        return { error: 'Network error. Please check your connection.' };
      }
    },

    // Cập nhật bio
    updateBio: async (data: { bio: string }): Promise<ApiResponse<any>> => {
      try {
        const headers = await getAuthHeaders();
        const response = await fetch(`${API_URL}/users/update_bio`, {
          method: 'PATCH',
          headers: {
            ...headers,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(data),
        });

        const responseData = await response.json();
        
        if (!response.ok) {
          throw new Error(responseData.message || 'Failed to update bio');
        }
        
        return { data: responseData };
      } catch (error) {
        console.error('Update bio error:', error);
        if (error instanceof Error) {
          return { error: error.message };
        }
        return { error: 'Network error. Please check your connection.' };
      }
    },
    // Gửi mã xác thực SMS
    sendVerificationCode: async (phoneNumber: string): Promise<ApiResponse<any>> => {
      try {
        const response = await fetch(`${API_URL}/auth/send-verification`, {
          method: 'POST',
          headers: defaultHeaders,
          body: JSON.stringify({ phoneNumber }),
        });
        
        return handleResponse<any>(response);
      } catch (error) {
        console.error('Send verification code error:', error);
        return { error: 'Network error. Please check your connection.' };
      }
    },

    // Xác thực mã SMS
    verifyCode: async (phoneNumber: string, code: string): Promise<ApiResponse<any>> => {
      try {
        const response = await fetch(`${API_URL}/auth/verify-code`, {
          method: 'POST',
          headers: defaultHeaders,
          body: JSON.stringify({ phoneNumber, code }),
        });
        
        return handleResponse<any>(response);
      } catch (error) {
        console.error('Verify code error:', error);
        return { error: 'Network error. Please check your connection.' };
      }
    },
  },
  
  // Friend relationships APIs
  friendrelations: {
    // Get the current user's friends list
    getFriends: async (page: number = 1, limit: number = 10): Promise<ApiResponse<any>> => {
      try {
        const headers = await getAuthHeaders();
        const response = await fetch(`${API_URL}/friendrelations/friends?page=${page}&limit=${limit}`, {
          method: 'GET',
          headers,
        });
        return handleResponse<any>(response);
      } catch (error) {
        console.error('Get friends error:', error);
        return { error: 'Network error. Please check your connection.' };
      }
    },
    
    // Search for users by name or email
    searchUsers: async (query: string, page: number = 1, limit: number = 10): Promise<ApiResponse<any>> => {
      try {
        const headers = await getAuthHeaders();
        const url = `${API_URL}/friendrelations/search?query=${encodeURIComponent(query)}&page=${page}&limit=${limit}`;
        
        const response = await fetch(url, {
          method: 'GET',
          headers,
        });
        
        const result = await handleResponse<any>(response);
        return result;
      } catch (error) {
        return { error: 'Network error. Please check your connection.' };
      }
    },
    
    // Send friend request
    sendFriendRequest: async (receiverId: string): Promise<ApiResponse<any>> => {
      try {
        const headers = await getAuthHeaders();
        const response = await fetch(`${API_URL}/friendrelations/request`, {
          method: 'POST',
          headers,
          body: JSON.stringify({ receiverId }),
        });
        
        return handleResponse<any>(response);
      } catch (error) {
        console.error('Send friend request error:', error);
        return { error: 'Network error. Please check your connection.' };
      }
    },
    
    // Respond to friend request (accept or reject)
    respondToFriendRequest: async (requestId: string, response: 'accept' | 'reject'): Promise<ApiResponse<any>> => {
      try {
        const headers = await getAuthHeaders();
        const responseBody = { response };        
        const apiResponse = await fetch(`${API_URL}/friendrelations/request/${requestId}`, {
          method: 'PUT',
          headers,
          body: JSON.stringify(responseBody),
        });
        
        return handleResponse<any>(apiResponse);
      } catch (error) {
        console.error('Respond to friend request error:', error);
        return { error: 'Network error. Please check your connection.' };
      }
    },
    
    // Lấy danh sách lời mời kết bạn
    getFriendRequests: async (page: number = 1, limit: number = 10): Promise<ApiResponse<any>> => {
      try {
        const headers = await getAuthHeaders();
        const response = await fetch(`${API_URL}/friendrelations/requests?page=${page}&limit=${limit}`, {
          method: 'GET',
          headers,
        });
        return handleResponse<any>(response);
      } catch (error) {
        console.error('Get friend requests error:', error);
        return { error: 'Network error. Please check your connection.' };
      }
    },

    // Get sent friend requests
    getSentRequests: async (page: number = 1, limit: number = 10): Promise<ApiResponse<any>> => {
      try {
        const headers = await getAuthHeaders();
        const response = await fetch(`${API_URL}/friendrelations/sent-requests?page=${page}&limit=${limit}`, {
          method: 'GET',
          headers,
        });
        return handleResponse<any>(response);
      } catch (error) {
        console.error('Get sent requests error:', error);
        return { error: 'Network error. Please check your connection.' };
      }
    },
    unfriend: async (friendId: string): Promise<ApiResponse<any>> => {
      try {
        const headers = await getAuthHeaders();
        const response = await fetch(`${API_URL}/friendrelations/friend/${friendId}`, {
          method: 'DELETE',
          headers,
        });
        return handleResponse<any>(response);
      } catch (error) {
        console.error('Unfriend error:', error);
        return { error: 'Network error. Please check your connection.' };
      }
    },

    // Cancel friend request
    cancelFriendRequest: async (requestId: string): Promise<ApiResponse<any>> => {
      try {
        const headers = await getAuthHeaders();
        const response = await fetch(`${API_URL}/friendrelations/request/${requestId}`, {
          method: 'DELETE',
          headers,
        });
        return handleResponse<any>(response);
      } catch (error) {
        console.error('Cancel friend request error:', error);
        return { error: 'Network error. Please check your connection.' };
      }
    },
  },
  // Post APIs
  posts: {
    // Tạo bài viết mới
    createPost: async (postData: any): Promise<ApiResponse<any>> => {
      try {
        const headers = await getAuthHeaders();
        const response = await fetch(`${API_URL}/posts`, {
          method: 'POST',
          headers,
          body: JSON.stringify(postData),
        });
        return handleResponse<any>(response);
      } catch (error) {
        console.error('Create post error:', error);
        return { error: 'Network error. Please check your connection.' };
      }
    },    
    
    // Lấy bài viết theo ID
    getPostById: async (postId: string): Promise<ApiResponse<any>> => {
      try {
        console.log('📡 API getPostById - Starting request for ID:', postId);
        
        // Đảm bảo postId là một chuỗi hợp lệ
        if (!postId || postId === '[object Object]' || postId.includes('[object Object]')) {
          console.error('📡 API getPostById - Invalid postId:', postId);
          return { error: 'Invalid post ID format' };
        }
        
        const headers = await getAuthHeaders();
        console.log('📡 API getPostById - Headers prepared:', !!headers);
        
        const url = `${API_URL}/posts/${postId}`;
        console.log('📡 API getPostById - Request URL:', url);
        
        const response = await fetch(url, {
          method: 'GET',
          headers,
        });
        
        console.log('📡 API getPostById - Response status:', response.status);
        console.log('📡 API getPostById - Response OK:', response.ok);
        
        const result = await handleResponse<any>(response);
        console.log('📡 API getPostById - Parsed result:', 
          result.error ? `Error: ${result.error}` : 'Success');
        
        return result;
      } catch (error) {
        console.error('📡 API getPostById - Network error:', error);
        return { error: 'Network error. Please check your connection.' };
      }
    },
    
    // Lấy danh sách bài viết gần đây
    getNearbyPosts: async (lat: number, lng: number, radius: number = 10): Promise<ApiResponse<any>> => {
      try {
        const headers = await getAuthHeaders();
        const response = await fetch(`${API_URL}/posts/nearby?lat=${lat}&lng=${lng}&radius=${radius}`, {
          method: 'GET',
          headers,
        });
        return handleResponse<any>(response);
      } catch (error) {
        console.error('Get nearby posts error:', error);
        return { error: 'Network error. Please check your connection.' };
      }
    },
    
    // Lấy danh sách bài viết của người dùng hiện tại
    getMyPosts: async (includeExpired: boolean = true): Promise<ApiResponse<any>> => {
      try {
        const headers = await getAuthHeaders();
        const response = await fetch(`${API_URL}/posts/my-posts?includeExpired=${includeExpired}`, {
          method: 'GET',
          headers,
        });
        return handleResponse<any>(response);
      } catch (error) {
        console.error('Get my posts error:', error);
        return { error: 'Network error. Please check your connection.' };
      }
    },

    // Lấy tất cả bài viết (bao gồm cả đã hết hạn) của người dùng hiện tại
    getAllMyPosts: async (): Promise<ApiResponse<any>> => {
      try {
        console.log('Fetching all posts including expired ones...');
        const headers = await getAuthHeaders();
        const response = await fetch(`${API_URL}/posts/my-posts?includeExpired=true`, {
          method: 'GET',
          headers,
        });
        const result = await handleResponse<any>(response);
        console.log('Fetched posts count:', result.data?.length || 0);
        return result;
      } catch (error) {
        console.error('Get all my posts error:', error);
        return { error: 'Network error. Please check your connection.' };
      }
    },
    
    // Lấy danh sách bài viết từ bạn bè của người dùng hiện tại
    getFriendsPosts: async (): Promise<ApiResponse<any>> => {
      try {
        const headers = await getAuthHeaders();
        const response = await fetch(`${API_URL}/posts/friends-posts`, {
          method: 'GET',
          headers,
        });
        return handleResponse<any>(response);
      } catch (error) {
        console.error('Get friends posts error:', error);
        return { error: 'Network error. Please check your connection.' };
      }
    },
    
    // Like một bài viết
    likePost: async (postId: string): Promise<ApiResponse<any>> => {
      try {
        const headers = await getAuthHeaders();
        const response = await fetch(`${API_URL}/posts/${postId}/like`, {
          method: 'POST',
          headers,
        });
        return handleResponse<any>(response);
      } catch (error) {
        console.error('Like post error:', error);
        return { error: 'Network error. Please check your connection.' };
      }
    },
    
    // Unlike một bài viết
    unlikePost: async (postId: string): Promise<ApiResponse<any>> => {
      try {
        const headers = await getAuthHeaders();
        const response = await fetch(`${API_URL}/posts/${postId}/like`, {
          method: 'DELETE',
          headers,
        });
        return handleResponse<any>(response);
      } catch (error) {
        console.error('Unlike post error:', error);
        return { error: 'Network error. Please check your connection.' };
      }
    },
    
    // Xóa một bài viết
    deletePost: async (postId: string): Promise<ApiResponse<any>> => {
      try {
        const headers = await getAuthHeaders();
        const response = await fetch(`${API_URL}/posts/${postId}`, {
          method: 'DELETE',
          headers,
        });
        return handleResponse<any>(response);
      } catch (error) {
        console.error('Delete post error:', error);
        return { error: 'Network error. Please check your connection.' };
      }
    },
  },
  
  //Nofitication
  notifications:{
    //get all notifications
    getNotifications: async (): Promise<ApiResponse<any>> => {
      try {
        const headers = await getAuthHeaders();
        console.log('Getting notifications with headers:', headers);
        const response = await fetch(`${API_URL}/notifications`, {
          method: 'GET',
          headers,
        });
        console.log('Notifications API response status:', response.status);
        const result = await handleResponse<any>(response);
        console.log('Notifications API parsed result:', result.error || 'Success');
        return result;
      } catch (error) {
        console.error('Get notifications error:', error);
        return { error: 'Network error. Please check your connection.' };
      }
    },    //Mark notification as read
    markAsRead: async (notificationId: string): Promise<ApiResponse<any>> => {
      try  {
        const headers = await getAuthHeaders();
        const response = await fetch(`${API_URL}/notifications/${notificationId}`, {
          method: 'PATCH',
          headers,
          body: JSON.stringify({ read: true }),
        });
        return handleResponse<any>(response);
      } catch (error) {
        console.error('Mark notification as read error:', error);
        return { error: 'Network error. Please check your connection.' };
      }
    },    // Mark all notifications as read
    markAllAsRead: async (): Promise<ApiResponse<any>> => {
      try {
        console.log('API: Starting markAllAsRead request...');
        const headers = await getAuthHeaders();
        console.log('API: Got auth headers:', headers);
        
        const response = await fetch(`${API_URL}/notifications/mark-all-read`, {
          method: 'PATCH',
          headers,
        });
        
        console.log('API: Mark all as read response status:', response.status);
        console.log('API: Mark all as read response ok:', response.ok);
        
        const result = await handleResponse<any>(response);
        console.log('API: Mark all as read result:', result);
        
        return result;
      } catch (error) {
        console.error('Mark all notifications as read error:', error);
        return { error: 'Network error. Please check your connection.' };
      }
    }
  },

  // Upload APIs
  uploads: {
    // Lưu thông tin ảnh đã upload lên Cloudinary
    saveImageInfo: async (imageData: {
      url: string;
      filename: string;
      originalname: string;
      mimetype: string;
      size: number;
      metadata?: any;
    }): Promise<ApiResponse<any>> => {
      try {
        const headers = await getAuthHeaders();
        const response = await fetch(`${API_URL}/uploads`, {
          method: 'POST',
          headers,
          body: JSON.stringify(imageData),
        });
        return handleResponse<any>(response);
      } catch (error) {
        console.error('Save image info error:', error);
        return { error: 'Network error. Please check your connection.' };
      }
    },

    // Lấy danh sách ảnh đã upload của user hiện tại
    getUploadedImages: async (): Promise<ApiResponse<any>> => {
      try {
        const headers = await getAuthHeaders();
        const response = await fetch(`${API_URL}/uploads`, {
          method: 'GET',
          headers,
        });
        return handleResponse<any>(response);
      } catch (error) {
        console.error('Get uploaded images error:', error);
        return { error: 'Network error. Please check your connection.' };
      }
    },

    // Xóa ảnh đã upload
    deleteImage: async (imageId: string): Promise<ApiResponse<any>> => {
      try {
        const headers = await getAuthHeaders();
        const response = await fetch(`${API_URL}/uploads/${imageId}`, {
          method: 'DELETE',
          headers,
        });
        return handleResponse<any>(response);
      } catch (error) {
        console.error('Delete image error:', error);
        return { error: 'Network error. Please check your connection.' };
      }
    }
  },

  // Comment APIs
  comments: {
    //Create a new comment on a post
    createComment: async (postId: string, text: string, image?: string): Promise<ApiResponse<any>> => {
      try{
        const headers = await getAuthHeaders();
        const commentData: any = { postId };

        if(text) commentData.text = text;
        if(image) commentData.image = image;

        const response = await fetch(`${API_URL}/comments`, {
          method: 'POST',
          headers,
          body: JSON.stringify(commentData),
        });
        return handleResponse<any>(response);
      } catch (error) {
        console.error('Create comment error:', error);
        return { error: 'Network error. Please check your connection.' };
      }
    },

    // Get comments for a post
    getComments: async (postId: string): Promise<ApiResponse<any>> => {
      try{
        const headers = await getAuthHeaders();
        const response = await fetch(`${API_URL}/comments?postId=${postId}`, {
          method: 'GET',
          headers,
        });
        return handleResponse<any>(response);
      }
      catch (error) {
        console.error('Get comments error:', error);
        return { error: 'Network error. Please check your connection.' };
      }
    },

    // Delete a comment
    deleteComment: async (commentId: string): Promise<ApiResponse<any>> => {
      try {
        const headers = await getAuthHeaders();
        const response = await fetch(`${API_URL}/comments/${commentId}`, {
          method: 'DELETE',
          headers,
        });
        return handleResponse<any>(response);
      } catch (error) {
        console.error('Delete comment error:', error);
        return { error: 'Network error. Please check your connection.' };
      }
    },
  }
};
