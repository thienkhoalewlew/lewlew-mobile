import AsyncStorage from '@react-native-async-storage/async-storage';

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

    /**
     * Cập nhật profile người dùng (mới) - sử dụng 1 endpoint cho tất cả các loại cập nhật
     * 
     * Endpoint này thay thế tất cả các endpoint update riêng lẻ:
     * - update_avatar -> updateType: 'avatar'
     * - update_password -> updateType: 'password' 
     * - update_fullname -> updateType: 'fullname'
     * - update_username -> updateType: 'username'
     * - update_bio -> updateType: 'bio'
     * - update_settings -> updateType: 'settings'
     * 
     * @param data Object chứa updateType và các field tương ứng
     * @returns Promise<ApiResponse<any>> Kết quả cập nhật
     */
    updateProfile: async (data: {
      updateType: 'avatar' | 'password' | 'fullname' | 'username' | 'bio' | 'settings';
      avatar?: string;
      currentPassword?: string;
      newPassword?: string;
      fullname?: string;
      username?: string;
      bio?: string;
      notificationRadius?: number;
      language?: 'en' | 'vi';
    }): Promise<ApiResponse<any>> => {
      try {
        const headers = await getAuthHeaders();
        const response = await fetch(`${API_URL}/users/update_profile`, {
          method: 'PATCH',
          headers: {
            ...headers,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(data),
        });        return handleResponse<any>(response);
      } catch (error) {
        console.error('Update profile error:', error);
        if (error instanceof Error) {
          return { error: error.message };
        }
        return { error: 'Network error. Please check your connection.' };
      }
    },

    // ===================================================================
    // CÁC ENDPOINT CŨ (DEPRECATED) - Nên sử dụng updateProfile thay thế
    // ===================================================================

    /**
     * @deprecated Sử dụng updateProfile({ updateType: 'avatar', avatar: avatarUrl }) thay thế
     */
    // Cập nhật avatar người dùng hiện tại
    updateAvatar: async (avatarUrl: string): Promise<ApiResponse<any>> => {
      try {
        const headers = await getAuthHeaders();
        const response = await fetch(`${API_URL}/users/update_profile`, {
          method: 'PATCH',
          headers,
          body: JSON.stringify({ 
            updateType: 'avatar',
            avatar: avatarUrl 
          }),
        });
        return handleResponse<any>(response);
      } catch (error) {
        console.error('Update avatar error:', error);
        return { error: 'Network error. Please check your connection.' };
      }
    },

    /**
     * @deprecated Sử dụng updateProfile({ updateType: 'settings', notificationRadius, language }) thay thế
     */
    // Cập nhật settings người dùng
    updateSettings: async (settings: {
      notificationRadius: number;
      pushNotifications: boolean;
      emailNotifications: boolean;
      language?: 'en' | 'vi';
    }): Promise<ApiResponse<any>> => {
      try {
        const headers = await getAuthHeaders();
        const response = await fetch(`${API_URL}/users/update_profile`, {
          method: 'PATCH',
          headers,
          body: JSON.stringify({
            updateType: 'settings',
            notificationRadius: settings.notificationRadius,
            language: settings.language
          }),
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

    /**
     * @deprecated Endpoint này chưa được cập nhật để sử dụng updateProfile
     */
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

    /**
     * @deprecated Sử dụng updateProfile({ updateType: 'password', currentPassword, newPassword }) thay thế
     */
    // Cập nhật mật khẩu
    updatePassword: async (data: { currentPassword: string; newPassword: string }): Promise<ApiResponse<any>> => {
      try {
        const headers = await getAuthHeaders();
        const response = await fetch(`${API_URL}/users/update_profile`, {
          method: 'PATCH',
          headers,
          body: JSON.stringify({
            updateType: 'password',
            currentPassword: data.currentPassword,
            newPassword: data.newPassword
          }),
        });
        return handleResponse<any>(response);
      } catch (error) {
        console.error('Update password error:', error);
        return { error: 'Network error. Please check your connection.' };
      }
    },

    /**
     * @deprecated Sử dụng updateProfile({ updateType: 'username', username }) thay thế
     */
    // Cập nhật username
    updateUsername: async (data: { username: string }): Promise<ApiResponse<any>> => {
      try {
        const headers = await getAuthHeaders();
        const response = await fetch(`${API_URL}/users/update_profile`, {
          method: 'PATCH',
          headers,
          body: JSON.stringify({
            updateType: 'username',
            username: data.username
          }),
        });
        return handleResponse<any>(response);
      } catch (error) {
        console.error('Update username error:', error);
        return { error: 'Network error. Please check your connection.' };
      }
    },

    /**
     * @deprecated Sử dụng updateProfile({ updateType: 'fullname', fullname }) thay thế
     */
    // Cập nhật fullname
    updateFullname: async (data: { fullname: string }): Promise<ApiResponse<any>> => {
      try {
        const headers = await getAuthHeaders();
        const response = await fetch(`${API_URL}/users/update_profile`, {
          method: 'PATCH',
          headers,
          body: JSON.stringify({
            updateType: 'fullname',
            fullname: data.fullname
          }),
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

    /**
     * @deprecated Sử dụng updateProfile({ updateType: 'bio', bio }) thay thế
     */
    // Cập nhật bio
    updateBio: async (data: { bio: string }): Promise<ApiResponse<any>> => {
      try {
        const headers = await getAuthHeaders();
        const response = await fetch(`${API_URL}/users/update_profile`, {
          method: 'PATCH',
          headers: {
            ...headers,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            updateType: 'bio',
            bio: data.bio
          }),
        });

        return handleResponse<any>(response);
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

    // Forgot Password APIs
    sendForgotPasswordCode: async (phoneNumber: string): Promise<ApiResponse<any>> => {
      try {
        const response = await fetch(`${API_URL}/auth/forgot-password/send-code`, {
          method: 'POST',
          headers: defaultHeaders,
          body: JSON.stringify({ phoneNumber }),
        });
        
        return handleResponse<any>(response);
      } catch (error) {
        console.error('Send forgot password code error:', error);
        return { error: 'Network error. Please check your connection.' };
      }
    },

    verifyForgotPasswordCode: async (phoneNumber: string, code: string): Promise<ApiResponse<any>> => {
      try {
        const response = await fetch(`${API_URL}/auth/forgot-password/verify-code`, {
          method: 'POST',
          headers: defaultHeaders,
          body: JSON.stringify({ phoneNumber, code }),
        });
        
        return handleResponse<any>(response);
      } catch (error) {
        console.error('Verify forgot password code error:', error);
        return { error: 'Network error. Please check your connection.' };
      }
    },

    resetPassword: async (phoneNumber: string, code: string, newPassword: string): Promise<ApiResponse<any>> => {
      try {
        const response = await fetch(`${API_URL}/auth/forgot-password/reset`, {
          method: 'POST',
          headers: defaultHeaders,
          body: JSON.stringify({ phoneNumber, code, newPassword }),
        });
        
        return handleResponse<any>(response);
      } catch (error) {
        console.error('Reset password error:', error);
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
    
    // Lấy danh sách bài viết của một người dùng cụ thể theo user ID
    getUserPostsById: async (userId: string, includeExpired: boolean = false): Promise<ApiResponse<any>> => {
      try {
        const headers = await getAuthHeaders();
        const response = await fetch(`${API_URL}/posts/user/${userId}?includeExpired=${includeExpired}`, {
          method: 'GET',
          headers,
        });
        return handleResponse<any>(response);
      } catch (error) {
        console.error('Get user posts by ID error:', error);
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
        console.error('Get friends posts error:', error);        return { error: 'Network error. Please check your connection.' };
      }
    },
    
    // Like một bài viết

    likePost: async (postId: string): Promise<ApiResponse<any>> => {
      try {
        const headers = await getAuthHeaders();
        const response = await fetch(`${API_URL}/likes`, {
          method: 'POST',
          headers,
          body: JSON.stringify({ postId }),
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
        const response = await fetch(`${API_URL}/likes/${postId}`, {
          method: 'DELETE',
          headers,
        });
        return handleResponse<any>(response);
      } catch (error) {
        console.error('Unlike post error:', error);
        return { error: 'Network error. Please check your connection.' };
      }
    },

    // Kiểm tra user đã like post chưa
    checkUserLikedPost: async (postId: string): Promise<ApiResponse<{ liked: boolean }>> => {
      try {
        const headers = await getAuthHeaders();
        const response = await fetch(`${API_URL}/likes/check/${postId}`, {
          method: 'GET',
          headers,
        });
        return handleResponse<{ liked: boolean }>(response);
      } catch (error) {
        console.error('Check like status error:', error);
        return { error: 'Network error. Please check your connection.' };
      }
    },

    // Lấy danh sách users đã like post
    getPostLikes: async (postId: string, page: number = 1, limit: number = 20): Promise<ApiResponse<any>> => {
      try {
        const headers = await getAuthHeaders();
        const response = await fetch(`${API_URL}/likes/post/${postId}?page=${page}&limit=${limit}`, {
          method: 'GET',
          headers,
        });
        return handleResponse<any>(response);
      } catch (error) {
        console.error('Get post likes error:', error);
        return { error: 'Network error. Please check your connection.' };      }
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

    // Like một comment
    likeComment: async (commentId: string): Promise<ApiResponse<any>> => {
      try {
        const headers = await getAuthHeaders();
        const response = await fetch(`${API_URL}/likes/comment/${commentId}`, {
          method: 'POST',
          headers,
        });
        return handleResponse<any>(response);
      } catch (error) {
        console.error('Like comment error:', error);
        return { error: 'Network error. Please check your connection.' };
      }
    },

    // Unlike một comment
    unlikeComment: async (commentId: string): Promise<ApiResponse<any>> => {
      try {
        const headers = await getAuthHeaders();
        const response = await fetch(`${API_URL}/likes/comment/${commentId}`, {
          method: 'DELETE',
          headers,
        });
        return handleResponse<any>(response);
      } catch (error) {
        console.error('Unlike comment error:', error);
        return { error: 'Network error. Please check your connection.' };
      }
    },

    // Kiểm tra user đã like comment chưa
    checkUserLikedComment: async (commentId: string): Promise<ApiResponse<{ liked: boolean }>> => {
      try {
        const headers = await getAuthHeaders();
        const response = await fetch(`${API_URL}/likes/check/comment/${commentId}`, {
          method: 'GET',
          headers,
        });
        return handleResponse<{ liked: boolean }>(response);
      } catch (error) {
        console.error('Check comment like status error:', error);
        return { error: 'Network error. Please check your connection.' };
      }
    },

    // Lấy danh sách users đã like comment
    getCommentLikes: async (commentId: string, page: number = 1, limit: number = 20): Promise<ApiResponse<any>> => {
      try {
        const headers = await getAuthHeaders();
        const response = await fetch(`${API_URL}/likes/comment/${commentId}?page=${page}&limit=${limit}`, {
          method: 'GET',
          headers,
        });
        return handleResponse<any>(response);
      } catch (error) {
        console.error('Get comment likes error:', error);
        return { error: 'Network error. Please check your connection.' };
      }
    },

  },

  // Report APIs
  reports: {
    // Create a new report
    createReport: async (reportData: {
      postId: string;
      reason: string;
      description?: string;
    }): Promise<ApiResponse<any>> => {
      try {
        const headers = await getAuthHeaders();
        const response = await fetch(`${API_URL}/reports`, {
          method: 'POST',
          headers,
          body: JSON.stringify(reportData),
        });
        return handleResponse<any>(response);
      } catch (error) {
        console.error('Create report error:', error);
        return { error: 'Network error. Please check your connection.' };
      }
    },

    // Get all reports (Admin only)
    getReports: async (
      page: number = 1,
      limit: number = 10,
      status?: string,
      reason?: string
    ): Promise<ApiResponse<any>> => {
      try {
        const headers = await getAuthHeaders();
        let url = `${API_URL}/reports?page=${page}&limit=${limit}`;
        
        if (status) url += `&status=${status}`;
        if (reason) url += `&reason=${reason}`;

        const response = await fetch(url, {
          method: 'GET',
          headers,
        });
        return handleResponse<any>(response);
      } catch (error) {
        console.error('Get reports error:', error);
        return { error: 'Network error. Please check your connection.' };
      }
    },

    // Get report statistics (Admin only)
    getReportStats: async (): Promise<ApiResponse<any>> => {
      try {
        const headers = await getAuthHeaders();
        const response = await fetch(`${API_URL}/reports/stats`, {
          method: 'GET',
          headers,
        });
        return handleResponse<any>(response);
      } catch (error) {
        console.error('Get report stats error:', error);
        return { error: 'Network error. Please check your connection.' };
      }
    },

    // Update report status (Admin only)
    updateReportStatus: async (
      reportId: string,
      status: string,
      adminNotes?: string
    ): Promise<ApiResponse<any>> => {
      try {
        const headers = await getAuthHeaders();
        const response = await fetch(`${API_URL}/reports/${reportId}/status`, {
          method: 'PUT',
          headers,
          body: JSON.stringify({ status, adminNotes }),
        });
        return handleResponse<any>(response);
      } catch (error) {
        console.error('Update report status error:', error);
        return { error: 'Network error. Please check your connection.' };
      }
    },

    // Get report details by ID (Admin only)
    getReportById: async (reportId: string): Promise<ApiResponse<any>> => {
      try {
        const headers = await getAuthHeaders();
        const response = await fetch(`${API_URL}/reports/${reportId}`, {
          method: 'GET',
          headers,
        });
        return handleResponse<any>(response);
      } catch (error) {
        console.error('Get report by ID error:', error);
        return { error: 'Network error. Please check your connection.' };
      }
    },
    /**
     * Cập nhật profile người dùng (mới) - sử dụng 1 endpoint cho tất cả các loại cập nhật
     * 
     * Endpoint này thay thế tất cả các endpoint update riêng lẻ:
     * - update_avatar -> updateType: 'avatar'
     * - update_password -> updateType: 'password' 
     * - update_fullname -> updateType: 'fullname'
     * - update_username -> updateType: 'username'
     * - update_bio -> updateType: 'bio'
     * - update_settings -> updateType: 'settings'
     * 
     * @param data Object chứa updateType và các field tương ứng
     * @returns Promise<ApiResponse<any>> Kết quả cập nhật
     */
    updateProfile: async (data: {
      updateType: 'avatar' | 'password' | 'fullname' | 'username' | 'bio' | 'settings';
      avatar?: string;
      currentPassword?: string;
      newPassword?: string;
      fullname?: string;
      username?: string;
      bio?: string;
      notificationRadius?: number;
      language?: 'en' | 'vi';
    }): Promise<ApiResponse<any>> => {
      try {
        const headers = await getAuthHeaders();
        const response = await fetch(`${API_URL}/users/update_profile`, {
          method: 'PATCH',
          headers: {
            ...headers,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(data),
        });

        return handleResponse<any>(response);
      } catch (error) {
        console.error('Update profile error:', error);
        if (error instanceof Error) {
          return { error: error.message };
        }
        return { error: 'Network error. Please check your connection.' };
      }    },
  },

  // Comments APIs
  comments: {
    // Create comment
    createComment: async (postId: string, text: string, image?: string): Promise<ApiResponse<any>> => {
      try {
        const headers = await getAuthHeaders();
        const response = await fetch(`${API_URL}/comments`, {
          method: 'POST',
          headers,
          body: JSON.stringify({ postId, text, image }),
        });
        return handleResponse<any>(response);
      } catch (error) {
        console.error('Create comment error:', error);
        return { error: 'Network error. Please check your connection.' };
      }
    },

    // Get comments for a post
    getComments: async (postId: string): Promise<ApiResponse<any>> => {
      try {
        const headers = await getAuthHeaders();
        const response = await fetch(`${API_URL}/comments?postId=${postId}`, {
          method: 'GET',
          headers,
        });
        return handleResponse<any>(response);
      } catch (error) {
        console.error('Get comments error:', error);
        return { error: 'Network error. Please check your connection.' };
      }
    },

    // Delete comment
    deleteComment: async (commentId: string): Promise<ApiResponse<any>> => {
      try {
        const headers = await getAuthHeaders();
        const response = await fetch(`${API_URL}/comments/${commentId}`, {
          method: 'DELETE',
          headers,
        });
        return handleResponse<any>(response);
      } catch (error) {
        console.error('Delete comment error:', error);        return { error: 'Network error. Please check your connection.' };
      }
    },
  },

  // Notifications APIs
  notifications: {
    // Get notifications
    getNotifications: async (): Promise<ApiResponse<any>> => {
      try {
        const headers = await getAuthHeaders();
        const response = await fetch(`${API_URL}/notifications`, {
          method: 'GET',
          headers,
        });
        return handleResponse<any>(response);
      } catch (error) {
        console.error('Get notifications error:', error);
        return { error: 'Network error. Please check your connection.' };
      }    },

    // Mark notification as read
    markAsRead: async (notificationId: string): Promise<ApiResponse<any>> => {
      try {
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
    },

    // Mark all notifications as read
    markAllAsRead: async (): Promise<ApiResponse<any>> => {
      try {
        const headers = await getAuthHeaders();
        const response = await fetch(`${API_URL}/notifications/mark-all-read`, {
          method: 'PATCH',
          headers,
        });
        return handleResponse<any>(response);
      } catch (error) {
        console.error('Mark all notifications as read error:', error);
        return { error: 'Network error. Please check your connection.' };
      }
    },
  },

  // Uploads APIs
  uploads: {
    // Get uploaded images
    getUploadedImages: async (): Promise<ApiResponse<any>> => {
      try {
        const headers = await getAuthHeaders();
        const response = await fetch(`${API_URL}/uploads/images`, {
          method: 'GET',
          headers,
        });
        return handleResponse<any>(response);
      } catch (error) {
        console.error('Get uploaded images error:', error);
        return { error: 'Network error. Please check your connection.' };
      }
    },

    // Delete image
    deleteImage: async (imageId: string): Promise<ApiResponse<any>> => {
      try {
        const headers = await getAuthHeaders();
        const response = await fetch(`${API_URL}/uploads/images/${imageId}`, {
          method: 'DELETE',
          headers,
        });
        return handleResponse<any>(response);
      } catch (error) {
        console.error('Delete image error:', error);
        return { error: 'Network error. Please check your connection.' };
      }
    },
  },
};
