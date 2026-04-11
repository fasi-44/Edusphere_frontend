/**
 * Authentication Service
 * Handles all authentication-related API calls
 */

import { getApiClient, setAuthToken, clearAuthToken } from '../api/client';
import { API_ENDPOINTS, API_CONFIG } from '../api/config';
import {
    LoginRequest,
    LoginResponse,
    LogoutResponse,
    RefreshTokenResponse,
    ForgotPasswordRequest,
    ForgotPasswordResponse,
    ResetPasswordRequest,
    ResetPasswordResponse,
    SignupRequest,
    SignupResponse,
} from '../../types/auth';

const client = getApiClient();

export const authService = {
    /**
     * Login user
     * @param credentials - Login credentials (identifier: email/username, password)
     */
    async login(credentials: LoginRequest): Promise<LoginResponse> {
        try {
            // Note: Response interceptor returns response.data directly, so we need type assertion
            const response = (await client.post<LoginResponse>(
                API_ENDPOINTS.AUTH.LOGIN,
                {
                    identifier: credentials.identifier,
                    password: credentials.password,
                }
            )) as unknown as LoginResponse;

            // Store tokens from response
            if (response.access_token) {
                setAuthToken(response.access_token);
            }
            if (response.refresh_token) {
                localStorage.setItem('refreshToken', response.refresh_token);
            }

            return response;
        } catch (error) {
            throw error;
        }
    },

    /**
     * Logout user
     */
    async logout(): Promise<LogoutResponse> {
        try {
            // Note: Response interceptor returns response.data directly, so we need type assertion
            const response = (await client.post<LogoutResponse>(
                API_ENDPOINTS.AUTH.LOGOUT
            )) as unknown as LogoutResponse;

            // Clear tokens
            clearAuthToken();

            return response;
        } catch (error) {
            // Clear tokens even if API call fails
            clearAuthToken();
            throw error;
        }
    },

    /**
     * Refresh access token.
     * Sends the refresh token via Authorization header (required by Flask-JWT-Extended).
     * The backend rotates both access and refresh tokens for security.
     */
    async refreshToken(): Promise<RefreshTokenResponse> {
        try {
            const refreshToken = localStorage.getItem('refreshToken');
            if (!refreshToken) {
                throw new Error('No refresh token available');
            }

            // Use raw axios to send refresh token in Authorization header
            // (not the intercepted client, to avoid infinite 401 loops)
            const { default: axios } = await import('axios');
            const response = await axios.post<RefreshTokenResponse>(
                `${API_CONFIG.BASE_URL}${API_ENDPOINTS.AUTH.REFRESH_TOKEN}`,
                {},
                {
                    headers: {
                        Authorization: `Bearer ${refreshToken}`,
                        'Content-Type': 'application/json',
                    },
                }
            );

            const data = response.data;

            // Update tokens from response
            if (data.access_token) {
                setAuthToken(data.access_token);
            }
            if (data.refresh_token) {
                localStorage.setItem('refreshToken', data.refresh_token);
            }

            return data;
        } catch (error) {
            clearAuthToken();
            throw error;
        }
    },

    /**
     * Forgot password
     */
    async forgotPassword(
        request: ForgotPasswordRequest
    ): Promise<ForgotPasswordResponse> {
        try {
            // Note: Response interceptor returns response.data directly, so we need type assertion
            const response = (await client.post<ForgotPasswordResponse>(
                API_ENDPOINTS.AUTH.FORGOT_PASSWORD,
                request
            )) as unknown as ForgotPasswordResponse;
            return response;
        } catch (error) {
            throw error;
        }
    },

    /**
     * Reset password
     */
    async resetPassword(
        request: ResetPasswordRequest
    ): Promise<ResetPasswordResponse> {
        try {
            // Note: Response interceptor returns response.data directly, so we need type assertion
            const response = (await client.post<ResetPasswordResponse>(
                API_ENDPOINTS.AUTH.RESET_PASSWORD,
                request
            )) as unknown as ResetPasswordResponse;
            return response;
        } catch (error) {
            throw error;
        }
    },

    /**
     * Sign up new user
     */
    async signup(request: SignupRequest): Promise<SignupResponse> {
        try {
            // Note: Response interceptor returns response.data directly, so we need type assertion
            const response = (await client.post<SignupResponse>(
                '/auth/signup',
                request
            )) as unknown as SignupResponse;
            return response;
        } catch (error) {
            throw error;
        }
    },

    /**
     * Get stored user from localStorage
     */
    getStoredUser() {
        const userStr = localStorage.getItem('loggedUser');
        if (!userStr) return null;
        try {
            return JSON.parse(userStr);
        } catch {
            return null;
        }
    },

    /**
     * Store user in localStorage
     */
    storeUser(user: any) {
        localStorage.setItem('loggedUser', JSON.stringify(user));
    },

    /**
     * Clear stored user
     */
    clearStoredUser() {
        localStorage.removeItem('loggedUser');
    },

    /**
     * Check if user is authenticated
     */
    isAuthenticated(): boolean {
        const token = localStorage.getItem('authToken');
        return !!token;
    },

    /**
     * Get auth token
     */
    getAuthToken(): string | null {
        return localStorage.getItem('authToken');
    },
};
