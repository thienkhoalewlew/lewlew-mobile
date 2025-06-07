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
      isInitialized: false,

      initialize: async () => {
        set({ isLoading: true });
        try {
          const token = await AsyncStorage.getItem('auth-storage');
          if (token) {
            const parsedData = JSON.parse(token);
            if (parsedData.state?.token) {
              // Token exists, try to fetch user profile
              const profileRes = await api.auth.getProfile();
              if (profileRes.data) {
                set({ 
                  token: parsedData.state.token,
                  user: mapBackendUserToAppUser(profileRes.data),
                  isAuthenticated: true,
                });
              }
            }
          }
        } catch (error) {
          console.error('Auth initialization error:', error);
        } finally {
          set({ isLoading: false, isInitialized: true });
        }
      },

      register: async (fullName: string, phoneNumber: string, password: string, username: string) => {
        set({ isLoading: true, error: null });
        
        try {
          // Call the register API with fullName, phoneNumber, password, and username
          const response = await api.auth.register(fullName, phoneNumber, password, username);
          
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

      login: async (login: string, password: string) => {
        set({ isLoading: true, error: null });
        try {
          const response = await api.auth.login(login, password);
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

      sendVerificationCode: async (phoneNumber: string) => {
        set({ isLoading: true, error: null });
        try {
          const response = await api.auth.sendVerificationCode(phoneNumber);
          if (response.error) {
            throw new Error(response.error);
          }
          set({ isLoading: false });
        } catch (error) {
          set({ 
            error: error instanceof Error ? error.message : 'Failed to send verification code', 
            isLoading: false 
          });
          throw error;
        }
      },

      verifyCode: async (phoneNumber: string, code: string) => {
        set({ isLoading: true, error: null });
        try {
          const response = await api.auth.verifyCode(phoneNumber, code);
          if (response.error) {
            throw new Error(response.error);
          }
          set({ isLoading: false });
        } catch (error) {
          set({ 
            error: error instanceof Error ? error.message : 'Failed to verify code', 
            isLoading: false 
          });
          throw error;
        }
      },

      logout: () => {
        set({ 
          user: null, 
          isAuthenticated: false,
          token: null 
        });
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
      partialize: (state) => ({ token: state.token }),
    }
  )
);