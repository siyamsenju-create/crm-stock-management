import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import api from './api/client';

export const useStore = create(
    persist(
        (set, get) => ({
            token: null,
            isAuthenticated: false,
            user: null,
            
            setToken: (token) => {
                localStorage.setItem('token', token);
                set({ token, isAuthenticated: !!token });
            },

            setUser: (user) => set({ user }),

            login: async (email, password) => {
                const response = await api.post('/auth/login', { email, password });
                if (response.success && response.data) {
                    const { accessToken, ...userData } = response.data;
                    get().setToken(accessToken);
                    set({ user: userData });
                    return true;
                }
                // Surface the actual backend error message to the UI
                throw new Error(response.message || response.error || 'Invalid email or password.');
            },

            loginWithGoogle: async (idToken) => {
                const response = await api.post('/auth/google', { idToken });
                if (response.success && response.data) {
                    const { accessToken, ...userData } = response.data;
                    get().setToken(accessToken);
                    set({ user: userData });
                    return true;
                }
                // Surface the actual backend error message to the UI
                throw new Error(response.message || response.error || 'Google authentication failed. You may not have access.');
            },



            logout: async () => {
                try {
                    await api.post('/auth/logout');
                } catch (err) {
                    console.error('Logout error', err);
                }
                localStorage.removeItem('token');
                set({ token: null, isAuthenticated: false, user: null });
            },

            validateSession: async () => {
                try {
                    const response = await api.get('/auth/me');
                    if (response.success && response.data) {
                        set({ user: response.data, isAuthenticated: true });
                        return true;
                    }
                } catch (error) {
                    console.error('Session validation failed', error);
                    localStorage.removeItem('token');
                    set({ token: null, isAuthenticated: false, user: null });
                }
                return false;
            }
        }),
        { 
            name: 'crm-auth-storage',
            partialize: (state) => ({ token: state.token, user: state.user, isAuthenticated: state.isAuthenticated })
        }
    )
);
