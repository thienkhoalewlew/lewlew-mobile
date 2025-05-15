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
    return [];
  } catch (error) {
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
    };

    // 4. Gửi yêu cầu đến API backend
    const response = await api.posts.createPost(apiPostData);

    // 5. Xử lý phản hồi từ API
    if (response.data) {
      return {
        data: {
          id: response.data.id || response.data._id,
          userId: postData.userId,
          imageUrl: imageUrl,
          caption: postData.caption,
          location: postData.location,
          likes: response.data.likes || [],
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
  
  if (backendPost.user) {
    if (typeof backendPost.user === 'object' && backendPost.user !== null) {
      userId = backendPost.user._id;
    } else {
      userId = backendPost.user;
    }
  }
  
  console.log('Mapping post:', backendPost._id, 'userId:', userId);
  
  return {
    id: backendPost._id || backendPost.id,
    userId: userId,
    imageUrl: backendPost.imageUrl || backendPost.image,
    caption: backendPost.caption || '',
    location: {
      latitude: backendPost.location?.coordinates ? backendPost.location.coordinates[1] : 0,
      longitude: backendPost.location?.coordinates ? backendPost.location.coordinates[0] : 0,
      name: backendPost.location?.placeName || '',
    },
    likes: backendPost.likes || [],
    comments: backendPost.comments || [],
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

export const getUserPosts = async (): Promise<Post[]> => {
  try {
    const response = await api.posts.getMyPosts();
    
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