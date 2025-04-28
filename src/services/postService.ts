import { Post, Region } from '../types';
import { api } from './api';

/**
 * Lấy danh sách bài đăng gần vị trí hiện tại
 * @param region Vùng hiện tại (vị trí và phạm vi)
 * @returns Promise<Post[]> Danh sách bài đăng
 */
export const getNearbyPosts = async (region: Region): Promise<Post[]> => {
  try {
    // Trong tương lai, bạn sẽ gọi API để lấy bài đăng gần đây
    // const response = await api.posts.getNearby(region.latitude, region.longitude, 10);
    // if (response.data) {
    //   return response.data.map(mapBackendPostToAppPost);
    // }
    
    // Tạm thời trả về mảng rỗng vì chưa có API endpoint
    console.log('API for getting nearby posts is not implemented yet');
    return [];
  } catch (error) {
    console.error('Error fetching nearby posts:', error);
    return [];
  }
};

/**
 * Lấy danh sách bài đăng của bạn bè
 * @param friendIds Danh sách ID của bạn bè
 * @returns Promise<Post[]> Danh sách bài đăng
 */
export const getFriendPosts = async (friendIds: string[]): Promise<Post[]> => {
  try {
    // Trong tương lai, bạn sẽ gọi API để lấy bài đăng của bạn bè
    // const response = await api.posts.getByUserIds(friendIds);
    // if (response.data) {
    //   return response.data.map(mapBackendPostToAppPost);
    // }
    
    // Tạm thời trả về mảng rỗng vì chưa có API endpoint
    console.log('API for getting friend posts is not implemented yet');
    return [];
  } catch (error) {
    console.error('Error fetching friend posts:', error);
    return [];
  }
};

/**
 * Tạo bài đăng mới
 * @param postData Dữ liệu bài đăng
 * @returns Promise<Post | null> Bài đăng đã tạo hoặc null nếu có lỗi
 */
export const createPost = async (postData: any): Promise<Post | null> => {
  try {
    // Trong tương lai, bạn sẽ gọi API để tạo bài đăng
    // const response = await api.posts.create(postData);
    // if (response.data) {
    //   return mapBackendPostToAppPost(response.data);
    // }
    
    // Tạm thời trả về null vì chưa có API endpoint
    console.log('API for creating post is not implemented yet');
    return null;
  } catch (error) {
    console.error('Error creating post:', error);
    return null;
  }
};

/**
 * Ánh xạ dữ liệu bài đăng từ backend sang định dạng của ứng dụng
 */
export const mapBackendPostToAppPost = (backendPost: any): Post => {
  return {
    id: backendPost.id,
    userId: backendPost.userId,
    imageUrl: backendPost.image,
    caption: backendPost.caption,
    location: {
      latitude: backendPost.location?.coordinates[1] || 0,
      longitude: backendPost.location?.coordinates[0] || 0,
      name: backendPost.locationName || '',
    },
    likes: backendPost.likes || [],
    comments: backendPost.comments || [],
    createdAt: new Date(backendPost.createdAt),
  };
};
