import { create } from 'zustand';
import { commentService } from '../services/commentService';
import { Comment, CreateCommentData, CommentState } from '../types';

export const useCommentStore = create<CommentState>((set, get) => ({
  comments: {},
  loading: false,
  error: null,

  // Create comment
  createComment: async (commentData: CreateCommentData) => {
    set({ loading: true, error: null });
    
    try {
      const result = await commentService.createComment(commentData);
      
      if (result.success && result.data) {
        const { comments } = get();
        const postComments = comments[commentData.postId] || [];
        
        // Add new comment to the beginning of the array
        set({
          comments: {
            ...comments,
            [commentData.postId]: [result.data, ...postComments]
          }
        });
        
        set({ loading: false });
        return true;
      } else {
        set({ loading: false, error: result.error || 'Failed to create comment' });
        return false;
      }
    } catch (error) {
      set({ loading: false, error: 'An unexpected error occurred' });
      return false;
    }
  },

  // Get comments for a post
  getComments: async (postId: string) => {
    set({ loading: true, error: null });
    
    try {
      const result = await commentService.getComments(postId);
      
      if (result.success) {
        set({
          comments: {
            ...get().comments,
            [postId]: result.data || []
          },
          loading: false
        });
      } else {
        set({ loading: false, error: result.error || 'Failed to get comments' });
      }
    } catch (error) {
      set({ loading: false, error: 'An unexpected error occurred' });
    }
  },

  // Delete comment
  deleteComment: async (commentId: string, postId: string) => {
    set({ loading: true, error: null });
    
    try {
      const result = await commentService.deleteComment(commentId);
      
      if (result.success) {
        const { comments } = get();
        const postComments = comments[postId] || [];
        
        // Remove comment from state
        set({
          comments: {
            ...comments,
            [postId]: postComments.filter(c => c.id !== commentId)
          }
        });
        
        set({ loading: false });
        return true;
      } else {
        set({ loading: false, error: result.error || 'Failed to delete comment' });
        return false;
      }
    } catch (error) {
      set({ loading: false, error: 'An unexpected error occurred' });
      return false;
    }
  },

  // Clear comments for a specific post
  clearComments: (postId: string) => {
    const { comments } = get();
    const newComments = { ...comments };
    delete newComments[postId];
    set({ comments: newComments });
  },

  // Clear error
  clearError: () => set({ error: null }),

  // Like comment
  likeComment: async (commentId: string, postId: string) => {
    try {
      const result = await commentService.likeComment(commentId);
      
      if (result.success) {
        const { comments } = get();
        const postComments = comments[postId] || [];
        
        // Update comment like status and count
        const updatedComments = postComments.map(comment => 
          comment.id === commentId 
            ? { 
                ...comment, 
                isLiked: true, 
                likeCount: (comment.likeCount || 0) + 1 
              }
            : comment
        );
        
        set({
          comments: {
            ...comments,
            [postId]: updatedComments
          }
        });
        
        return true;
      } else {
        set({ error: result.error || 'Failed to like comment' });
        return false;
      }
    } catch (error) {
      set({ error: 'An unexpected error occurred' });
      return false;
    }
  },

  // Unlike comment
  unlikeComment: async (commentId: string, postId: string) => {
    try {
      const result = await commentService.unlikeComment(commentId);
      
      if (result.success) {
        const { comments } = get();
        const postComments = comments[postId] || [];
        
        // Update comment like status and count
        const updatedComments = postComments.map(comment => 
          comment.id === commentId 
            ? { 
                ...comment, 
                isLiked: false, 
                likeCount: Math.max((comment.likeCount || 0) - 1, 0) 
              }
            : comment
        );
        
        set({
          comments: {
            ...comments,
            [postId]: updatedComments
          }
        });
        
        return true;
      } else {
        set({ error: result.error || 'Failed to unlike comment' });
        return false;
      }
    } catch (error) {
      set({ error: 'An unexpected error occurred' });
      return false;
    }
  },
}));

