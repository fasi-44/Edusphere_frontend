/**
 * Auth Store (Zustand)
 * Manages authentication state and user data
 */

import { create } from 'zustand';
import { authService } from '../services/auth/authService';
import { AuthUser, LoginRequest, AcademicYear } from '../types/auth';
import { ApiError } from '../types/common';

/**
 * Auth Store State & Actions
 */
interface AuthStore {
    // State
    user: AuthUser | null;
    isAuthenticated: boolean;
    loading: boolean;
    error: ApiError | null;
    academicYearVersion: number; // Increment this to trigger refetch in components

    // Actions
    login: (credentials: LoginRequest) => Promise<void>;
    logout: () => Promise<void>;
    refreshToken: () => Promise<void>;
    restoreAuth: () => Promise<void>;
    clearError: () => void;
    setUser: (user: AuthUser | null) => void;
    setSelectedAcademicYear: (year: AcademicYear) => void;
    updateAcademicYears: (years: AcademicYear[]) => void;
}

export const useAuthStore = create<AuthStore>((set, get) => ({
    // Initial State
    user: authService.getStoredUser() || null,
    isAuthenticated: authService.isAuthenticated(),
    loading: false,
    error: null,
    academicYearVersion: 0,

    // Login
    login: async (credentials: LoginRequest) => {
        set({ loading: true, error: null });
        try {
            const response = await authService.login(credentials);
            const userData = response.user;

            // Store user in localStorage and state
            authService.storeUser(userData);

            set({
                user: userData,
                isAuthenticated: true,
                loading: false,
                error: null,
            });
        } catch (error: any) {
            const apiError: ApiError = {
                status: error.status || 500,
                message: error.message || 'Login failed',
                code: error.code,
                details: error.details,
            };
            set({
                user: null,
                isAuthenticated: false,
                loading: false,
                error: apiError,
            });
            throw apiError;
        }
    },

    // Logout
    logout: async () => {
        set({ loading: true, error: null });
        try {
            await authService.logout();
            authService.clearStoredUser();
            set({
                user: null,
                isAuthenticated: false,
                loading: false,
                error: null,
            });
        } catch (error: any) {
            // Clear state even if logout API call fails
            authService.clearStoredUser();
            set({
                user: null,
                isAuthenticated: false,
                loading: false,
                error: null,
            });
        }
    },

    // Refresh Token
    refreshToken: async () => {
        try {
            await authService.refreshToken();
            // Token is updated in authService
        } catch (error: any) {
            const apiError: ApiError = {
                status: error.status || 500,
                message: 'Token refresh failed',
                code: error.code,
            };
            set({
                user: null,
                isAuthenticated: false,
                error: apiError,
            });
            authService.clearStoredUser();
        }
    },

    // Restore Auth from localStorage
    restoreAuth: async () => {
        const storedUser = authService.getStoredUser();
        const token = authService.getAuthToken();

        if (storedUser && token) {
            set({
                user: storedUser,
                isAuthenticated: true,
                loading: false,
                error: null,
            });
        } else {
            set({
                user: null,
                isAuthenticated: false,
                loading: false,
                error: null,
            });
        }
    },

    // Clear Error
    clearError: () => {
        set({ error: null });
    },

    // Set User
    setUser: (user: AuthUser | null) => {
        if (user) {
            authService.storeUser(user);
        } else {
            authService.clearStoredUser();
        }
        set({
            user,
            isAuthenticated: !!user,
        });
    },

    // Set Selected Academic Year (triggers refetch by incrementing version)
    setSelectedAcademicYear: (year: AcademicYear) => {
        const currentUser = get().user;
        if (currentUser) {
            const updatedUser = {
                ...currentUser,
                current_academic_year: year,
            };
            authService.storeUser(updatedUser);
            set((state) => ({
                user: updatedUser,
                academicYearVersion: state.academicYearVersion + 1,
            }));
        }
    },

    // Update Academic Years list (after CRUD operations)
    updateAcademicYears: (years: AcademicYear[]) => {
        const currentUser = get().user;
        if (currentUser) {
            const currentYear = years.find(y => y.is_current) || currentUser.current_academic_year;
            const updatedUser = {
                ...currentUser,
                academic_years: years,
                current_academic_year: currentYear,
            };
            authService.storeUser(updatedUser);
            set({
                user: updatedUser,
            });
        }
    },
}));
