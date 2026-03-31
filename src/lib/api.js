import axios from 'axios';
import { STORAGE_KEYS } from './constants';
class ApiClient {
    constructor() {
        Object.defineProperty(this, "instance", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "refreshPromise", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: null
        });
        this.instance = axios.create({
            baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3001',
            timeout: 10000,
            headers: {
                'Content-Type': 'application/json',
            },
        });
        // Request interceptor
        this.instance.interceptors.request.use((config) => {
            const token = this.getToken();
            if (token) {
                config.headers.Authorization = `Bearer ${token}`;
            }
            return config;
        }, (error) => Promise.reject(error));
        // Response interceptor
        this.instance.interceptors.response.use((response) => response, async (error) => {
            const originalRequest = error.config;
            // Handle 401 Unauthorized
            if (error.response?.status === 401 && !originalRequest._retry) {
                originalRequest._retry = true;
                try {
                    const newToken = await this.refreshToken();
                    originalRequest.headers.Authorization = `Bearer ${newToken}`;
                    return this.instance(originalRequest);
                }
                catch (refreshError) {
                    this.logout();
                    window.location.href = '/login';
                    return Promise.reject(refreshError);
                }
            }
            return Promise.reject(error);
        });
    }
    getToken() {
        return localStorage.getItem(STORAGE_KEYS.TOKEN);
    }
    getRefreshToken() {
        return localStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN);
    }
    setToken(token, refreshToken) {
        localStorage.setItem(STORAGE_KEYS.TOKEN, token);
        localStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, refreshToken);
    }
    async refreshToken() {
        // Avoid multiple simultaneous refresh requests
        if (this.refreshPromise) {
            return this.refreshPromise;
        }
        this.refreshPromise = (async () => {
            try {
                const refreshToken = this.getRefreshToken();
                if (!refreshToken) {
                    throw new Error('No refresh token available');
                }
                const response = await this.instance.post('/api/auth/refresh', {
                    refreshToken,
                });
                const { token, refreshToken: newRefreshToken } = response.data;
                this.setToken(token, newRefreshToken);
                return token;
            }
            finally {
                this.refreshPromise = null;
            }
        })();
        return this.refreshPromise;
    }
    logout() {
        localStorage.removeItem(STORAGE_KEYS.TOKEN);
        localStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN);
        localStorage.removeItem(STORAGE_KEYS.USER);
    }
    get(url, config) {
        return this.instance.get(url, config);
    }
    post(url, data, config) {
        return this.instance.post(url, data, config);
    }
    put(url, data, config) {
        return this.instance.put(url, data, config);
    }
    patch(url, data, config) {
        return this.instance.patch(url, data, config);
    }
    delete(url, config) {
        return this.instance.delete(url, config);
    }
}
export const apiClient = new ApiClient();
/**
 * Generic API request handler with error handling
 */
export async function apiRequest(method, url, data) {
    try {
        let response;
        switch (method) {
            case 'GET':
                response = await apiClient.get(url);
                break;
            case 'POST':
                response = await apiClient.post(url, data);
                break;
            case 'PUT':
                response = await apiClient.put(url, data);
                break;
            case 'PATCH':
                response = await apiClient.patch(url, data);
                break;
            case 'DELETE':
                response = await apiClient.delete(url);
                break;
        }
        return {
            success: true,
            data: response.data,
        };
    }
    catch (error) {
        const axiosError = error;
        return {
            success: false,
            error: axiosError.message,
            data: axiosError.response?.data,
        };
    }
}
//# sourceMappingURL=api.js.map