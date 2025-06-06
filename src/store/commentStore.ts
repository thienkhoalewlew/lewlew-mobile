import { create } from 'zustand';
import { commentService } from '../services/commentService';
import { Comment, CreateCommentData, CommentState } from '../types';

export const useCommentStore = create<CommentState>((set, get) => ({
  // Initial state
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
        
        set({
          comments: {
            ...comments,
            [commentData.postId]: [result.data, ...postComments]
          },
          loading: false
        });
        
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
        const { comments } = get();
        set({
          comments: {
            ...comments,
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
        
        set({
          comments: {
            ...comments,
            [postId]: postComments.filter(comment => comment.id !== commentId)
          },
          loading: false
        });
        
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

  // Like comment
  likeComment: async (commentId: string, postId: string) => {
    try {
      const result = await commentService.likeComment(commentId);
      
      if (result.success && result.data) {
        const { comments } = get();
        const postComments = comments[postId] || [];
        
        set({
          comments: {
            ...comments,
            [postId]: postComments.map(comment =>
              comment.id === commentId
                ? { 
                    ...comment, 
                    likes: result.data.likes, 
                    likeCount: result.data.likeCount 
                  }
                : comment
            )
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
      
      if (result.success && result.data) {
        const { comments } = get();
        const postComments = comments[postId] || [];
        
        set({
          comments: {
            ...comments,
            [postId]: postComments.map(comment =>
              comment.id === commentId
                ? { 
                    ...comment, 
                    likes: result.data.likes, 
                    likeCount: result.data.likeCount 
                  }
                : comment
            )
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

  // Clear comments for a specific post
  clearComments: (postId: string) => {
    const { comments } = get();
    const newComments = { ...comments };
    delete newComments[postId];
    set({ comments: newComments });
  },

  // Clear error
  clearError: () => set({ error: null }),
}));
