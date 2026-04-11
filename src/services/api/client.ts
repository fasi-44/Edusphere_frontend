/**
 * API Client
 * Centralized HTTP client with interceptors for authentication, error handling, and request/response transformation
 */

import axios, {
    AxiosInstance,
    AxiosError,
    AxiosRequestConfig,
    InternalAxiosRequestConfig,
    AxiosResponse,
} from 'axios';
import { API_CONFIG, API_ENDPOINTS } from './config';

/**
 * Typed API client wrapper.
 * Because the response interceptor returns `response.data` directly, the
 * effective return type of every HTTP method is the unwrapped backend payload
 * (not an AxiosResponse). We expose a thin interface that reflects this so
 * service code can read fields like `response.code`, `response.data`, etc.
 * without TypeScript thinking they are AxiosResponse instances.
 */
export interface ApiClient {
    get: <T = any>(url: string, config?: AxiosRequestConfig) => Promise<T>;
    post: <T = any>(url: string, data?: unknown, config?: AxiosRequestConfig) => Promise<T>;
    put: <T = any>(url: string, data?: unknown, config?: AxiosRequestConfig) => Promise<T>;
    patch: <T = any>(url: string, data?: unknown, config?: AxiosRequestConfig) => Promise<T>;
    delete: <T = any>(url: string, config?: AxiosRequestConfig) => Promise<T>;
    request: <T = any>(config: AxiosRequestConfig) => Promise<T>;
}

/**
 * API Error Response Type
 */
export interface ApiErrorResponse {
    message: string;
    code?: string;
    details?: Record<string, unknown>;
}

/**
 * API Success Response Type
 */
export interface ApiSuccessResponse<T = unknown> {
    data?: T;
    message?: string;
    success?: boolean;
}

/**
 * Create and configure API client
 * Note: The response interceptor returns response.data directly, so API calls
 * return the data, not AxiosResponse. Services should access properties directly
 * on the response (e.g., response.users not response.data.users).
 */
let apiClient: AxiosInstance;
let isRefreshing = false;
let failedQueue: Array<{
    resolve: (value: unknown) => void;
    reject: (reason?: unknown) => void;
}> = [];

const processQueue = (error: unknown, token: string | null = null) => {
    failedQueue.forEach(({ resolve, reject }) => {
        if (error) {
            reject(error);
        } else {
            resolve(token);
        }
    });
    failedQueue = [];
};

export const createApiClient = (): AxiosInstance => {
    const axiosInstance = axios.create({
        baseURL: API_CONFIG.BASE_URL,
        timeout: API_CONFIG.TIMEOUT,
        headers: API_CONFIG.HEADERS,
    });

    /**
     * Request Interceptor
     * Add authorization token to every request
     */
    axiosInstance.interceptors.request.use(
        (config: InternalAxiosRequestConfig) => {
            const token = localStorage.getItem('authToken');
            if (token && config.headers) {
                config.headers.Authorization = `Bearer ${token}`;
            }
            return config;
        },
        (error: AxiosError) => {
            return Promise.reject(error);
        }
    );

    /**
     * Response Interceptor
     * Handle errors globally and extract data from response.
     * On 401, attempt token refresh before logging out.
     */
    axiosInstance.interceptors.response.use(
        (response: AxiosResponse) => {
            return response.data;
        },
        async (error: AxiosError<ApiErrorResponse>) => {
            const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

            // Handle 401 - attempt token refresh before logging out
            if (error.response?.status === 401 && originalRequest && !originalRequest._retry) {
                // Don't retry refresh or login endpoints
                const isAuthEndpoint = originalRequest.url?.includes('/auth/refresh') ||
                    originalRequest.url?.includes('/auth/login');
                if (isAuthEndpoint) {
                    forceLogout();
                    return Promise.reject(error);
                }

                if (isRefreshing) {
                    // Queue this request until refresh completes
                    return new Promise((resolve, reject) => {
                        failedQueue.push({ resolve, reject });
                    }).then((token) => {
                        if (originalRequest.headers) {
                            originalRequest.headers.Authorization = `Bearer ${token}`;
                        }
                        return axiosInstance(originalRequest);
                    });
                }

                originalRequest._retry = true;
                isRefreshing = true;

                try {
                    const refreshToken = localStorage.getItem('refreshToken');
                    if (!refreshToken) {
                        throw new Error('No refresh token');
                    }

                    // Call refresh endpoint with refresh token in Authorization header
                    const response = await axios.post(
                        `${API_CONFIG.BASE_URL}${API_ENDPOINTS.AUTH.REFRESH_TOKEN}`,
                        {},
                        {
                            headers: {
                                Authorization: `Bearer ${refreshToken}`,
                                'Content-Type': 'application/json',
                            },
                        }
                    );

                    const { access_token, refresh_token: newRefreshToken } = response.data;

                    if (access_token) {
                        setAuthToken(access_token);
                    }
                    if (newRefreshToken) {
                        localStorage.setItem('refreshToken', newRefreshToken);
                    }

                    processQueue(null, access_token);

                    // Retry the original request with new token
                    if (originalRequest.headers) {
                        originalRequest.headers.Authorization = `Bearer ${access_token}`;
                    }
                    return axiosInstance(originalRequest);
                } catch (refreshError) {
                    processQueue(refreshError, null);
                    forceLogout();
                    return Promise.reject(refreshError);
                } finally {
                    isRefreshing = false;
                }
            }

            // Handle other error responses
            const errorData = error.response?.data || {
                message: error.message || 'An unexpected error occurred',
            };

            return Promise.reject({
                status: error.response?.status,
                ...errorData,
            });
        }
    );

    apiClient = axiosInstance;
    return axiosInstance;
};

/**
 * Force logout — clear all auth data and redirect to login
 */
const forceLogout = (): void => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('loggedUser');
    window.location.href = '/';
};

/**
 * Get existing API client or create new one.
 * Returned as ApiClient so that service code sees method results as the
 * unwrapped backend payload (response.data) rather than an AxiosResponse.
 */
export const getApiClient = (): ApiClient => {
    if (!apiClient) {
        createApiClient();
    }
    return apiClient as unknown as ApiClient;
};

/**
 * Set Authorization Token
 */
export const setAuthToken = (token: string): void => {
    localStorage.setItem('authToken', token);
    getApiClient(); // ensure instance is initialized
    if (apiClient && apiClient.defaults.headers.common) {
        apiClient.defaults.headers.common.Authorization = `Bearer ${token}`;
    }
};

/**
 * Clear Authorization Token
 */
export const clearAuthToken = (): void => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('loggedUser');
    getApiClient(); // ensure instance is initialized
    if (apiClient && apiClient.defaults.headers.common) {
        delete apiClient.defaults.headers.common.Authorization;
    }
};

/**
 * Get Authorization Token
 */
export const getAuthToken = (): string | null => {
    return localStorage.getItem('authToken');
};

/**
 * Get School ID from logged user
 * Used for multi-tenant API calls
 */
export const getSchoolId = (): string => {
    try {
        const userString = localStorage.getItem('loggedUser');
        if (userString) {
            const user = JSON.parse(userString);
            return user.skid || '';
        }
    } catch {
        // Failed to parse user from localStorage
    }
    return '';
};
