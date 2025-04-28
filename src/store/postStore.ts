import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Post, PostState, Region } from '../types';
import { getNearbyPosts, getFriendPosts, createPost as apiCreatePost } from '../services/postService';

export const usePostStore = create<PostState>()(
  persist(
    (set, get) => ({
      posts: [],
      isLoading: false,
      error: null,

      createPost: async (postData) => {
        set({ isLoading: true, error: null });
        
        try {
          // Gọi API để tạo bài đăng
          const newPost = await apiCreatePost(postData);
          
          if (newPost) {
            set(state => ({
              posts: [newPost, ...state.posts],
              isLoading: false
            }));
            return newPost;
          } else {
            // Tạm thời tạo bài đăng local khi chưa có API
            const localPost: Post = {
              id: `local_${Date.now()}`,
              ...postData,
              likes: [],
              comments: [],
              createdAt: new Date(),
            };
            
            set(state => ({
              posts: [localPost, ...state.posts],
              isLoading: false
            }));
            
            return localPost;
          }
        } catch (error) {
          set({ 
            error: error instanceof Error ? error.message : 'Failed to create post', 
            isLoading: false 
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

      getFriendPosts: async (friendIds: string[]) => {
        set({ isLoading: true, error: null });
        
        try {
          const friendPosts = await getFriendPosts(friendIds);
          set({ posts: friendPosts, isLoading: false });
          return friendPosts;
        } catch (error) {
          set({ error: 'Failed to get friend posts', isLoading: false });
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