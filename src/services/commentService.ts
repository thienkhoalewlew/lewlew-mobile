import { api } from './api';
import { Comment, CreateCommentData } from '../types';

// Hàm mapping comment từ backend
const mapBackendCommentToAppComment = (backendComment: any): Comment => {
  return {
    id: backendComment._id || backendComment.id,
    postId: backendComment.post || backendComment.postId,
    user: {
      id: backendComment.user?._id || backendComment.user?.id,
      fullname: backendComment.user?.fullName || backendComment.user?.fullname || 'Unknown User',
      username: backendComment.user?.username || '',
      phoneNumber: backendComment.user?.phoneNumber || '',
      avatar: backendComment.user?.avatar || 'https://images.unsplash.com/photo-1511367461989-f85a21fda167?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60',
      bio: backendComment.user?.bio || '',
      friendCount: 0, // Default value for comment context
      status: 'none' as 'none' | 'pending' | 'accepted' | 'rejected',
      createdAt: new Date(), // Default value for comment context
      settings: {
        notificationRadius: 5,
        language: 'vi' as 'en' | 'vi'
      }
    },
    text: backendComment.text || '',
    image: backendComment.image,
    likeCount: backendComment.likeCount || 0,
    isLiked: backendComment.isLiked || false,
    createdAt: backendComment.createdAt
  };
};

class CommentService {  // Create comment
  async createComment(commentData: CreateCommentData): Promise<{ success: boolean; data?: Comment; error?: string }> {
    try {
      const response = await api.comments.createComment(
        commentData.postId,
        commentData.text || '',
        commentData.image
      );

      if (response.error) {
        return { success: false, error: response.error };
      }

      // Map backend response to app format
      const mappedComment = response.data ? mapBackendCommentToAppComment(response.data) : undefined;
      return { success: true, data: mappedComment };
    } catch (error) {
      console.error('Comment service - Create comment error:', error);
      return { success: false, error: 'Failed to create comment' };
    }
  }

  // Get comments for a post
  async getComments(postId: string): Promise<{ success: boolean; data?: Comment[]; error?: string }> {
    try {
      const response = await api.comments.getComments(postId);

      if (response.error) {
        return { success: false, error: response.error };
      }

      // Map backend comments to app format
      const mappedComments = (response.data || []).map(mapBackendCommentToAppComment);
      return { success: true, data: mappedComments };
    } catch (error) {
      console.error('Comment service - Get comments error:', error);
      return { success: false, error: 'Failed to get comments' };
    }
  }

  // Delete comment
  async deleteComment(commentId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const response = await api.comments.deleteComment(commentId);

      if (response.error) {
        return { success: false, error: response.error };
      }

      return { success: true };
    } catch (error) {
      console.error('Comment service - Delete comment error:', error);
      return { success: false, error: 'Failed to delete comment' };
    }
  }

  // Like comment
  async likeComment(commentId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const response = await api.posts.likeComment(commentId);

      if (response.error) {
        return { success: false, error: response.error };
      }

      return { success: true };
    } catch (error) {
      console.error('Comment service - Like comment error:', error);
      return { success: false, error: 'Failed to like comment' };
    }
  }

  // Unlike comment
  async unlikeComment(commentId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const response = await api.posts.unlikeComment(commentId);

      if (response.error) {
        return { success: false, error: response.error };
      }

      return { success: true };
    } catch (error) {
      console.error('Comment service - Unlike comment error:', error);
      return { success: false, error: 'Failed to unlike comment' };
    }
  }

  // Check if user liked comment
  async checkUserLikedComment(commentId: string): Promise<{ success: boolean; liked?: boolean; error?: string }> {
    try {
      const response = await api.posts.checkUserLikedComment(commentId);

      if (response.error) {
        return { success: false, error: response.error };
      }

      return { success: true, liked: response.data?.liked || false };
    } catch (error) {
      console.error('Comment service - Check like status error:', error);
      return { success: false, error: 'Failed to check like status' };
    }
  }

  // Get comment likes
  async getCommentLikes(commentId: string, page: number = 1, limit: number = 20): Promise<{ success: boolean; data?: any; error?: string }> {
    try {
      const response = await api.posts.getCommentLikes(commentId, page, limit);

      if (response.error) {
        return { success: false, error: response.error };
      }

      return { success: true, data: response.data };
    } catch (error) {
      console.error('Comment service - Get comment likes error:', error);
      return { success: false, error: 'Failed to get comment likes' };
    }
  }
}

export const commentService = new CommentService();