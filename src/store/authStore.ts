import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AuthState, User } from '../types';
import { api } from '../services/api';
import { mapBackendUserToAppUser } from '../services/userService';

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      token: null,
      user: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,

      register: async (username: string, email: string, password: string) => {
        set({ isLoading: true, error: null });
        
        try {
          // Call the register API - backend uses fullName instead of username
          const response = await api.auth.register(username, email, password);
          
          if (response.error) {
            throw new Error(response.error);
          }
          
          if (response.data) {
            set({ 
              token: response.data.token,
              user: null,
              isAuthenticated: true,
              isLoading: false
            });
            const profileRes = await api.auth.getProfile();
            if(profileRes.data) {
              set({ user: mapBackendUserToAppUser(profileRes.data) });
            }
          } else {
            throw new Error('Registration failed');
          }
        } catch (error) {
          set({ 
            error: error instanceof Error ? error.message : 'Registration failed', 
            isLoading: false 
          });
        }
      },

      login: async (email: string, password: string) => {
        set({ isLoading: true, error: null });
        try {
          const response = await api.auth.login(email, password);
          if (response.error) {
            throw new Error(response.error);
          }
          if (response.data && response.data.user) {
            set({ 
              token: response.data.token,
              user: null,
              isAuthenticated: true,
              isLoading: false
            });
            const profileRes = await api.auth.getProfile();
            if(profileRes.data) {
              set({ user: mapBackendUserToAppUser(profileRes.data) });
            }
          } else {
            throw new Error('Login failed');
          }
        } catch (error) {
          set({ 
            error: error instanceof Error ? error.message : 'Login failed', 
            isLoading: false 
          });
        }
      },

      logout: () => {
        set({ user: null, isAuthenticated: false });
      },

      updateProfile: (userData: Partial<User>) => {
        const currentUser = get().user;
        if (!currentUser) return;
        
        set({
          user: {
            ...currentUser,
            ...userData,
          }
        });
      },

      fetchUserProfile: async () => {
        const { token } = get();
        if (!token) return;
        set({ isLoading: true, error: null });
        try {
          const profileRes = await api.auth.getProfile();
          if (profileRes.data) {
            set({ user: mapBackendUserToAppUser(profileRes.data), isAuthenticated: true, isLoading: false });
          } else {
            set({ error: profileRes.error || 'Failed to fetch profile', isLoading: false });
          }
        } catch (error) {
          set({ error: error instanceof Error ? error.message : 'Failed to fetch profile', isLoading: false });
        }
      },

      clearError: () => {
        set({ error: null });
      }
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({ token: state.token}),
    }
  )
);