import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../services/api';

export const useAuthStore = create((set) => ({
  user: null,
  token: null,
  isLoading: false,
  error: null,
  isInitialized: false,

  // Initialize auth state from AsyncStorage
  initAuth: async () => {
    try {
      const token = await AsyncStorage.getItem('userToken');
      const userStr = await AsyncStorage.getItem('userData');
      if (token && userStr) {
        set({ token, user: JSON.parse(userStr), isInitialized: true });
      } else {
        set({ isInitialized: true });
      }
    } catch (e) {
      set({ isInitialized: true });
    }
  },

  login: async (email, password) => {
    set({ isLoading: true, error: null });
    try {
      // Adjust endpoint based on backend routes
      const response = await api.post('/auth/login', { email, password });
      const { accessToken, user } = response.data.data; // Adapting to standard JSend response format
      
      await AsyncStorage.setItem('userToken', accessToken);
      await AsyncStorage.setItem('userData', JSON.stringify(user));
      
      set({ user, token: accessToken, isLoading: false });
    } catch (error) {
      const errorMsg = error.response?.data?.message || 'Login failed. Please check your credentials.';
      set({ error: errorMsg, isLoading: false });
      throw error;
    }
  },

  register: async (name, email, password) => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.post('/auth/register', { name, email, password });
      const { accessToken, user } = response.data.data;
      
      await AsyncStorage.setItem('userToken', accessToken);
      await AsyncStorage.setItem('userData', JSON.stringify(user));
      
      set({ user, token: accessToken, isLoading: false });
    } catch (error) {
      const errorMsg = error.response?.data?.message || 'Registration failed.';
      set({ error: errorMsg, isLoading: false });
      throw error;
    }
  },

  logout: async () => {
    try {
      await AsyncStorage.removeItem('userToken');
      await AsyncStorage.removeItem('userData');
      set({ user: null, token: null });
    } catch (e) {
      console.error(e);
    }
  },
  
  clearError: () => set({ error: null })
}));
