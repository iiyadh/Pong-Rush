import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

axios.defaults.baseURL = API_URL;

axios.interceptors.request.use((config) => {
  const token = localStorage.getItem('auth-storage');
  if (token) {
    try {
      const parsed = JSON.parse(token);
      if (parsed.state?.token) {
        config.headers.Authorization = `Bearer ${parsed.state.token}`;
      }
    } catch (e) {
    }
  }
  return config;
});

export const useAuthStore = create(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      loading: false,
      error: null,

      setAuth: (token, user) => {
        axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        set({ token, user, error: null });
      },

      login: async (email, password) => {
        set({ loading: true, error: null });
        try {
          const response = await axios.post('/auth/login', { email, password });
          const { token, user } = response.data;
          get().setAuth(token, user);
          set({ loading: false });
          return user;
        } catch (error) {
          set({ 
            loading: false, 
            error: error.response?.data?.message || 'Login failed' 
          });
          throw error;
        }
      },

      register: async (username, email, password) => {
        set({ loading: true, error: null });
        try {
          const response = await axios.post('/auth/register', { username, email, password });
          const { token, user } = response.data;
          get().setAuth(token, user);
          set({ loading: false });
          return user;
        } catch (error) {
          set({ 
            loading: false, 
            error: error.response?.data?.message || 'Registration failed' 
          });
          throw error;
        }
      },

      logout: async () => {
        try {
          const token = get().token;
          if (token) {
            await axios.post('/auth/logout', {}, {
              headers: { Authorization: `Bearer ${token}` }
            });
          }
        } catch (error) {
          console.error('Logout error:', error);
        } finally {
          delete axios.defaults.headers.common['Authorization'];
          set({ user: null, token: null, error: null });
          localStorage.removeItem('auth-storage');
        }
      },

      fetchProfile: async () => {
        try {
          const response = await axios.get('/auth/me');
          if (response.data.user) {
            set((state) => ({
              user: state.user ? { ...state.user, ...response.data.user } : response.data.user
            }));
          }
        } catch (error) {
          console.error('Fetch profile error:', error);
        }
      },

      updateStats: (stats) => {
        set((state) => ({
          user: state.user ? { ...state.user, stats } : null
        }));
      },

      updateUsername: async (username) => {
        try {
          const response = await axios.put('/auth/username', { username });
          set((state) => ({
            user: state.user ? { ...state.user, username: response.data.user.username } : null
          }));
          return response.data;
        } catch (error) {
          throw new Error(error.response?.data?.message || 'Failed to update username');
        }
      },

      updatePassword: async (currentPassword, newPassword) => {
        try {
          const response = await axios.put('/auth/password', { currentPassword, newPassword });
          return response.data;
        } catch (error) {
          throw new Error(error.response?.data?.message || 'Failed to update password');
        }
      },

      updateAvatar: async (avatar) => {
        try {
          const response = await axios.put('/auth/avatar', { avatar });
          set((state) => ({
            user: state.user ? { ...state.user, avatar: response.data.user.avatar } : null
          }));
          return response.data;
        } catch (error) {
          throw new Error(error.response?.data?.message || 'Failed to update avatar');
        }
      }
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        token: state.token,
        user: state.user
      })
    }
  )
);
