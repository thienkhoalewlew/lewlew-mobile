import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Post, PostState, Region } from '../types';
import { getNearbyPosts, getFriendPosts, createPost as apiCreatePost, getUserPosts } from '../services/postService';

export const usePostStore = create<PostState>()(
  persist(
    (set, get) => ({
      posts: [],
      isLoading: false,
      error: null,

      createPost: async (postData) => {
        set({ isLoading: true, error: null });
        
        try {
          // Call service function to create post
          const result = await apiCreatePost(postData);
          
          // Check if there was an error
          if ('error' in result && result.error) {
            set({
              error: result.error,
              isLoading: false,
            });
            return null;
          }
          
          // If successful, extract the post from the data property
          if ('data' in result && result.data) {
            const newPost: Post = {
              id: result.data.id,
              userId: result.data.userId,
              imageUrl: result.data.imageUrl,
              caption: result.data.caption,
              location: result.data.location,
              likes: result.data.likes || [],
              comments: result.data.comments || [],
              createdAt: result.data.createdAt,
            };
            
            // Add new post to the beginning of the posts array
            set(state => ({
              posts: [newPost, ...state.posts],
              isLoading: false,
            }));
            
            return newPost;
          }
          
          // If we get here, something unexpected happened
          set({
            error: 'Unexpected response format from server',
            isLoading: false,
          });
          return null;
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'Failed to create post',
            isLoading: false,
          });
          return null;
        }
      },

      likePost: (postId, userId) => {
        set(state => ({
          posts: state.posts.map(post => 
            post.id === postId && !post.likes.includes(userId)
              ? { ...post, likes: [...post.likes, userId] }
              : post
          )
        }));
      },

      unlikePost: (postId, userId) => {
        set(state => ({
          posts: state.posts.map(post => 
            post.id === postId
              ? { ...post, likes: post.likes.filter(id => id !== userId) }
              : post
          )
        }));
      },

      addComment: (postId, userId, text) => {
        const newComment = {
          id: `comment-${Date.now()}`,
          userId,
          postId,
          text,
          createdAt: new Date(),
        };

        set(state => ({
          posts: state.posts.map(post => 
            post.id === postId ? { ...post, comments: [...post.comments, newComment] } : post
          )
        }));
      },

      deletePost: (postId) => {
        set(state => ({
          posts: state.posts.filter(post => post.id !== postId)
        }));
      },

      getNearbyPosts: async (region: Region) => {
        set({ isLoading: true, error: null });
        
        try {
          const nearbyPosts = await getNearbyPosts(region);
          set({ posts: nearbyPosts, isLoading: false });
          return nearbyPosts;
        } catch (error) {
          set({ error: 'Failed to get nearby posts', isLoading: false });
          return [];
        }
      },

      getFriendPosts: async () => {
        set({ isLoading: true, error: null });
        
        try {
          const friendPosts = await getFriendPosts();
          set({ posts: friendPosts, isLoading: false });
          return friendPosts;
        } catch (error) {
          set({ error: 'Failed to get friend posts', isLoading: false });
          return [];
        }
      },

      getUserPosts: async () => {
        const state = get();
        set({ isLoading: true });
        
        try {
          const userPosts = await getUserPosts();
          
          // Merge posts với state hiện tại, tránh trùng lặp
          const existingPostIds = new Set(state.posts.map(p => p.id));
          const newPosts = userPosts.filter(p => !existingPostIds.has(p.id));
          
          set({ 
            posts: [...state.posts, ...newPosts],
            isLoading: false 
          });
          
          return userPosts;
        } catch (error) {
          console.error('Error fetching user posts:', error);
          set({ isLoading: false });
          return [];
        }
      }
    }),
    {
      name: 'posts-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);