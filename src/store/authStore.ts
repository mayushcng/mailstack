// =============================================================================
// Auth Store - User authentication state
// =============================================================================

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User } from '../api/types';
import { apiClient } from '../api/client';

interface AuthState {
    user: User | null;
    token: string | null;
    isLoading: boolean;
    error: string | null;
    isAuthenticated: boolean;

    // Actions
    login: (email: string, password: string) => Promise<void>;
    register: (data: {
        name: string;
        email: string;
        password: string;
        profilePicture?: string;
        dateOfBirth?: string;
        occupation?: string;
        phone?: string;
        city?: string;
        country?: string;
    }) => Promise<void>;
    logout: () => Promise<void>;
    clearError: () => void;
    setUser: (user: User | null, token: string | null) => void;
}

export const useAuthStore = create<AuthState>()(
    persist(
        (set) => ({
            user: null,
            token: null,
            isLoading: false,
            error: null,
            isAuthenticated: false,

            login: async (email, password) => {
                set({ isLoading: true, error: null });
                try {
                    const response = await apiClient.post<{ user: User; token: string }>(
                        '/auth/login',
                        { email, password },
                        { skipAuth: true }
                    );
                    apiClient.setToken(response.token);
                    set({
                        user: response.user,
                        token: response.token,
                        isLoading: false,
                        isAuthenticated: true,
                    });
                } catch (error) {
                    set({
                        error: error instanceof Error ? error.message : 'Login failed',
                        isLoading: false,
                        isAuthenticated: false,
                    });
                    throw error;
                }
            },

            register: async (data) => {
                set({ isLoading: true, error: null });
                try {
                    // Registration now returns just success message (no token)
                    // User needs admin approval before they can login
                    await apiClient.post<{ success: boolean; message: string }>(
                        '/auth/register',
                        data,
                        { skipAuth: true }
                    );
                    // DON'T set user/token - account is pending approval
                    set({
                        isLoading: false,
                        // Keep user/token as null - they need to login after approval
                    });
                } catch (error) {
                    set({
                        error: error instanceof Error ? error.message : 'Registration failed',
                        isLoading: false,
                        isAuthenticated: false,
                    });
                    throw error;
                }
            },

            logout: async () => {
                try {
                    await apiClient.post('/auth/logout');
                } catch {
                    // Ignore logout errors
                }
                apiClient.setToken(null);
                set({ user: null, token: null, isAuthenticated: false });
            },

            clearError: () => set({ error: null }),

            setUser: (user, token) => {
                apiClient.setToken(token);
                set({ user, token, isAuthenticated: !!user && !!token });
            },
        }),
        {
            name: 'mailstack-auth',
            partialize: (state) => ({ user: state.user, token: state.token }),
            onRehydrateStorage: () => (state) => {
                if (state?.token && state?.user) {
                    apiClient.setToken(state.token);
                    // Set isAuthenticated when rehydrating
                    state.isAuthenticated = true;
                }
            },
        }
    )
);
