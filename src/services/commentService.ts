import { api } from './api';
import { Comment, CreateCommentData } from '../types';

class CommentService {
  // Create comment
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

  // Get comments for a post
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
}

export const commentService = new CommentService();