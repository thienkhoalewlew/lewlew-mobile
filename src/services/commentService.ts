import { api } from './api';
import { Comment, CreateCommentData } from '../types';

class CommentService {
  // Tạo comment mới
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

      return { success: true, data: response.data };
    } catch (error) {
      console.error('Comment service - Create comment error:', error);
      return { success: false, error: 'Failed to create comment' };
    }
  }

  // Lấy danh sách comments của một post
  async getComments(postId: string): Promise<{ success: boolean; data?: Comment[]; error?: string }> {
    try {
      const response = await api.comments.getComments(postId);

      if (response.error) {
        return { success: false, error: response.error };
      }

      return { success: true, data: response.data || [] };
    } catch (error) {
      console.error('Comment service - Get comments error:', error);
      return { success: false, error: 'Failed to get comments' };
    }
  }

  // Xóa comment
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
  async likeComment(commentId: string): Promise<{ success: boolean; data?: any; error?: string }> {
    try {
      const response = await api.comments.likeComment(commentId);

      if (response.error) {
        return { success: false, error: response.error };
      }

      return { success: true, data: response.data };
    } catch (error) {
      console.error('Comment service - Like comment error:', error);
      return { success: false, error: 'Failed to like comment' };
    }
  }

  // Unlike comment
  async unlikeComment(commentId: string): Promise<{ success: boolean; data?: any; error?: string }> {
    try {
      const response = await api.comments.unlikeComment(commentId);

      if (response.error) {
        return { success: false, error: response.error };
      }

      return { success: true, data: response.data };
    } catch (error) {
      console.error('Comment service - Unlike comment error:', error);
      return { success: false, error: 'Failed to unlike comment' };
    }
  }
}

export const commentService = new CommentService();