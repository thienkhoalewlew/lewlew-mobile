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
    register: async (fullName: string, email: string, password: string): Promise<ApiResponse<any>> => {
      try {
        const response = await fetch(`${API_URL}/auth/register`, {
          method: 'POST',
          headers: defaultHeaders,
          body: JSON.stringify({ fullName, email, password }),
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
    login: async (email: string, password: string): Promise<ApiResponse<any>> => {
      try {
        const response = await fetch(`${API_URL}/auth/login`, {
          method: 'POST',
          headers: defaultHeaders,
          body: JSON.stringify({ email, password }),
        });
        
        return handleResponse<any>(response);
      } catch (error) {
        console.error('Login error:', error);
        return { error: 'Network error. Please check your connection.' };
      }
    },    // Lấy thông tin profile người dùng hiện tại hoặc theo ID
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
    getMyPosts: async (): Promise<ApiResponse<any>> => {
      try {
        const headers = await getAuthHeaders();
        const response = await fetch(`${API_URL}/posts/my-posts`, {
          method: 'GET',
          headers,
        });
        return handleResponse<any>(response);
      } catch (error) {
        console.error('Get my posts error:', error);
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
  }
};
