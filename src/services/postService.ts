import { light } from '@cloudinary/url-gen/qualifiers/fontWeight';
import { Post, Region } from '../types';
import { api } from './api';
import { uploadPostImage } from './cloudinaryService';

/**
 * Lấy danh sách bài đăng gần vị trí hiện tại
 * @param region Vùng hiện tại (vị trí và phạm vi)
 * @returns Promise<Post[]> Danh sách bài đăng
 */
export const getNearbyPosts = async (region: Region): Promise<Post[]> => {
  try {
    // Gọi API để lấy bài đăng gần đây
    const response = await api.posts.getNearbyPosts(
      region.latitude, 
      region.longitude, 
      10 // Bán kính mặc định (có thể điều chỉnh dựa trên kích thước khu vực xem)
    );
    
    if (response.data && Array.isArray(response.data)) {
      return response.data.map(mapBackendPostToAppPost);
    }
    
    console.log('No nearby posts found or invalid response format');
    return [];  } catch (error) {
    console.error('Error fetching nearby posts:', error);
    return [];
  }
};

/**
 * Lấy danh sách bài đăng của bạn bè
 * @returns Promise<Post[]> Danh sách bài đăng
 */
export const getFriendPosts = async (): Promise<Post[]> => {
  try {
    // Gọi API để lấy bài đăng của bạn bè
    const response = await api.posts.getFriendsPosts();
    
    if (response.data && Array.isArray(response.data)) {
      return response.data.map(mapBackendPostToAppPost);
    }
    
    console.log('No friend posts found or invalid response format');
    return [];
  } catch (error) {
    console.error('Error fetching friend posts:', error);
    return [];
  }
};

/**
 * Tạo bài đăng mới
 * @param postData Dữ liệu bài đăng
 * @returns Promise với đối tượng chứa data (nếu thành công) hoặc error (nếu thất bại)
 */
export const createPost = async (postData: any) => {
  try {
    // 1. Kiểm tra dữ liệu đầu vào
    if (!postData.imageUrl || !postData.caption || !postData.location) {
      return { error: 'Missing required post data' };
    }

    // 2. Tải ảnh lên Cloudinary nếu cần
    let imageUrl = postData.imageUrl;
    if (postData.imageUrl.startsWith('file://')) {
      imageUrl = await uploadPostImage(postData.imageUrl);
      if (!imageUrl) {
        return { error: 'Failed to upload image to Cloudinary' };
      }
    }

    // 3. Chuẩn bị dữ liệu gửi đến API
    const apiPostData = {
      image: imageUrl,
      caption: postData.caption,
      location: {
        type: 'Point',
        coordinates: [
          postData.location.longitude,
          postData.location.latitude,
        ],
        placeName: postData.location.name,
      },
    };    // 4. Gửi yêu cầu đến API backend
    const response = await api.posts.createPost(apiPostData);

    // 5. Xử lý phản hồi từ API
    if (response.data) {
      const postId = response.data.id || response.data._id;
      
      // Backend đã tự động lưu thông tin ảnh vào uploads collection
      console.log('Post created successfully, image info saved by backend');

      return {
        data: {
          id: postId,
          userId: postData.userId,
          image: imageUrl,
          caption: postData.caption,
          location: postData.location,
          likeCount: response.data.likeCount || 0,
          isLiked: false, // Assume new post is not liked by default
          commentCount: response.data.commentCount || 0,
          comments: response.data.comments || [],
          createdAt: new Date(response.data.createdAt),
        },
      };
    }

    return { error: response.error || 'Failed to create post' };
  } catch (error) {
    console.error('Error creating post:', error);
    return { error: 'Unable to create post' };
  }
};

/**
 * Ánh xạ dữ liệu bài đăng từ backend sang định dạng của ứng dụng
 */
export const mapBackendPostToAppPost = (backendPost: any): Post => {
  let userId = backendPost.userId;
  let user = undefined;
  
  if (backendPost.user) {
    if (typeof backendPost.user === 'object' && backendPost.user !== null) {
      userId = backendPost.user._id;
      user = {
        _id: backendPost.user._id,
        fullname: backendPost.user.fullName || backendPost.user.fullname || backendPost.user.username || 'Unknown User',
        username: backendPost.user.username,
        avatar: backendPost.user.avatar,
        bio: backendPost.user.bio || ''
      };
    } else {
      userId = backendPost.user;
    }
  }
  
  return {
    id: backendPost._id || backendPost.id,
    userId: userId,
    user: user,
    image: backendPost.imageUrl || backendPost.image,
    caption: backendPost.caption || '',
    location: {
      latitude: backendPost.location?.coordinates ? backendPost.location.coordinates[1] : 0,
      longitude: backendPost.location?.coordinates ? backendPost.location.coordinates[0] : 0,
      name: backendPost.location?.placeName || '',
    },
    likeCount: backendPost.likeCount || 0,
    isLiked: backendPost.isLiked || false, // Get from backend if available
    comments: backendPost.comments || [],
    commentCount: backendPost.commentCount || 0, // Add commentCount from backend
    createdAt: new Date(backendPost.createdAt),
  };
};

export const ensureStringId = (id: any): string => {
  if (!id) return '';
  if (typeof id === 'string') return id;
  if (typeof id === 'object' && id !== null) {
    return id.id || id._id || id.Id || '';
  }
  return String(id);
};

export const getUserPosts = async (includeExpired: boolean = true): Promise<Post[]> => {
  try {
    const response = await api.posts.getMyPosts(includeExpired);
    
    if (response.data && Array.isArray(response.data.posts)) {
      return response.data.posts.map(mapBackendPostToAppPost);
    }
    
    if (response.data && Array.isArray(response.data)) {
      return response.data.map(mapBackendPostToAppPost);
    }
    
    console.log('No user posts found or invalid response format');
    return [];
  } catch (error) {
    console.error('Error fetching user posts:', error);
    return [];
  }
}

/**
 * Like một bài viết
 * @param postId ID của bài viết cần like
 * @returns Promise với thông tin like đã tạo
 */
export const likePost = async (postId: string): Promise<{ success: boolean; error?: string; data?: any }> => {
  try {
    const response = await api.posts.likePost(postId);
    
    if (response.error) {
      return {
        success: false,
        error: response.error
      };
    }
    
    return {
      success: true,
      data: response.data
    };
  } catch (error) {
    console.error('Error liking post:', error);
    return {
      success: false,
      error: 'Unable to like post. Please try again later.'
    };
  }
};

/**
 * Unlike một bài viết
 * @param postId ID của bài viết cần unlike
 * @returns Promise với kết quả unlike
 */
export const unlikePost = async (postId: string): Promise<{ success: boolean; error?: string; data?: any }> => {
  try {
    const response = await api.posts.unlikePost(postId);
    
    if (response.error) {
      return {
        success: false,
        error: response.error
      };
    }
    
    return {
      success: true,
      data: response.data
    };
  } catch (error) {
    console.error('Error unliking post:', error);
    return {
      success: false,
      error: 'Unable to unlike post. Please try again later.'
    };
  }
};

/**
 * Kiểm tra user đã like post chưa
 * @param postId ID của bài viết
 * @returns Promise với trạng thái like
 */
export const checkUserLikedPost = async (postId: string): Promise<{ success: boolean; liked?: boolean; error?: string }> => {
  try {
    const response = await api.posts.checkUserLikedPost(postId);
    
    if (response.error) {
      return {
        success: false,
        error: response.error
      };
    }
    
    return {
      success: true,
      liked: response.data?.liked || false
    };
  } catch (error) {
    console.error('Error checking like status:', error);
    return {
      success: false,
      error: 'Unable to check like status.'
    };
  }
};

/**
 * Lấy danh sách users đã like post
 * @param postId ID của bài viết
 * @param page Trang (mặc định 1)
 * @param limit Số lượng mỗi trang (mặc định 20)
 * @returns Promise với danh sách likes
 */
export const getPostLikes = async (postId: string, page: number = 1, limit: number = 20): Promise<{ success: boolean; data?: any; error?: string }> => {
  try {
    const response = await api.posts.getPostLikes(postId, page, limit);
    
    if (response.error) {
      return {
        success: false,
        error: response.error
      };
    }
    
    return {
      success: true,
      data: response.data
    };
  } catch (error) {
    console.error('Error getting post likes:', error);
    return {
      success: false,
      error: 'Unable to get post likes.'
    };
  }
};

/**
 * Xóa một bài viết
 * @param postId ID của bài viết cần xóa
 * @returns Promise với kết quả xóa bài viết
 */
export const deletePostById = async (postId: string): Promise<{ success: boolean; error?: string; message?: string }> => {
  try {
    const response = await api.posts.deletePost(postId);
    
    if (response.error) {
      return {
        success: false,
        error: response.error
      };
    }
    
    return {
      success: true,
      message: 'Post deleted successfully'
    };
  } catch (error) {
    console.error('Error deleting post:', error);
    return {
      success: false,
      error: 'Unable to delete post. Please try again later.'
    };
  }
};

/**
 * Lấy bài viết theo ID
 * @param postId ID của bài viết cần lấy
 * @returns Promise với bài viết hoặc null nếu không tìm thấy
 */
export const getPostById = async (postId: string): Promise<Post | null> => {
  try {
    console.log('🔍 getPostById - Starting API call for post ID:', postId);
    const response = await api.posts.getPostById(postId);
    
    console.log('🔍 getPostById - API response received:', 
      response.error ? `Error: ${response.error}` : 'Success');
    console.log('🔍 getPostById - Response data exists:', !!response.data);
    
    // Kiểm tra lỗi bài viết hết hạn
    if (response.error && response.error.includes('expired')) {
      console.log('🔍 getPostById - Post has expired (older than 24 hours)');
      throw new Error('Post has expired (older than 24 hours)');
    }
    
    if (response.data) {
      console.log('🔍 getPostById - Post data received:', {
        id: response.data.id,
        userId: response.data.userId || response.data.user,
        caption: response.data.caption
      });
      return mapBackendPostToAppPost(response.data);
    }
    
    console.log('🔍 getPostById - Post not found or invalid response format');
    return null;
  } catch (error) {
    console.error('🔍 getPostById - Error fetching post by ID:', error);
    throw error; // Ném lỗi để xử lý ở lớp cao hơn
  }
};

/**
 * Lấy danh sách bài viết của một người dùng cụ thể theo user ID
 * @param userId ID của người dùng
 * @param includeExpired Có bao gồm bài viết hết hạn không
 * @returns Promise<Post[]> Danh sách bài viết
 */
export const getUserPostsById = async (userId: string, includeExpired: boolean = false): Promise<Post[]> => {
  try {
    console.log('📝 getUserPostsById - Fetching posts for user:', userId, 'includeExpired:', includeExpired);
    
    const response = await api.posts.getUserPostsById(userId, includeExpired);
    
    if (response.data && Array.isArray(response.data)) {
      console.log('📝 getUserPostsById - Found posts count:', response.data.length);
      return response.data.map(mapBackendPostToAppPost);
    }
    
    console.log('📝 getUserPostsById - No posts found or invalid response format');
    return [];
  } catch (error) {
    console.error('📝 getUserPostsById - Error fetching user posts:', error);
    return [];
  }
};