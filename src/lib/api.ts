import axios, { AxiosInstance, AxiosError } from 'axios'
import { STORAGE_KEYS } from './constants'

export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

export interface PaginatedResponse<T = any> {
  data: T[]
  total: number
  page: number
  limit: number
  totalPages: number
}

class ApiClient {
  private instance: AxiosInstance
  private refreshPromise: Promise<string> | null = null

  constructor() {
    this.instance = axios.create({
      baseURL: import.meta.env.VITE_API_URL || 'https://balanced-endurance-production-6438.up.railway.app',
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
      },
    })

    // Request interceptor
    this.instance.interceptors.request.use(
      (config) => {
        const token = this.getToken()
        if (token) {
          config.headers.Authorization = `Bearer ${token}`
        }
        return config
      },
      (error) => Promise.reject(error)
    )

    // Response interceptor — unwrap backend {success, data} envelope
    this.instance.interceptors.response.use(
      (response) => {
        // If the backend wraps responses in {success, data}, unwrap them
        if (response.data && typeof response.data === 'object' && 'success' in response.data && 'data' in response.data) {
          response.data = response.data.data
        }
        return response
      },
      async (error: AxiosError) => {
        const originalRequest = error.config as any

        // Handle 401 Unauthorized
        if (error.response?.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true

          try {
            const newToken = await this.refreshToken()
            originalRequest.headers.Authorization = `Bearer ${newToken}`
            return this.instance(originalRequest)
          } catch (refreshError) {
            this.logout()
            window.location.href = '/login'
            return Promise.reject(refreshError)
          }
        }

        return Promise.reject(error)
      }
    )
  }

  private getToken(): string | null {
    return localStorage.getItem(STORAGE_KEYS.TOKEN)
  }

  private getRefreshToken(): string | null {
    return localStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN)
  }

  private setToken(token: string, refreshToken: string): void {
    localStorage.setItem(STORAGE_KEYS.TOKEN, token)
    localStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, refreshToken)
  }

  private async refreshToken(): Promise<string> {
    // Avoid multiple simultaneous refresh requests
    if (this.refreshPromise) {
      return this.refreshPromise
    }

    this.refreshPromise = (async () => {
      try {
        const refreshToken = this.getRefreshToken()
        if (!refreshToken) {
          throw new Error('No refresh token available')
        }

        const response = await this.instance.post<any>('/api/auth/refresh', {
          refreshToken,
        })

        const { token, refreshToken: newRefreshToken } = response.data
        this.setToken(token, newRefreshToken)
        return token
      } finally {
        this.refreshPromise = null
      }
    })()

    return this.refreshPromise
  }

  public logout(): void {
    localStorage.removeItem(STORAGE_KEYS.TOKEN)
    localStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN)
    localStorage.removeItem(STORAGE_KEYS.USER)
  }

  public get<T = any>(url: string, config?: any) {
    return this.instance.get<T>(url, config)
  }

  public post<T = any>(url: string, data?: any, config?: any) {
    return this.instance.post<T>(url, data, config)
  }

  public put<T = any>(url: string, data?: any, config?: any) {
    return this.instance.put<T>(url, data, config)
  }

  public patch<T = any>(url: string, data?: any, config?: any) {
    return this.instance.patch<T>(url, data, config)
  }

  public delete<T = any>(url: string, config?: any) {
    return this.instance.delete<T>(url, config)
  }
}

export const apiClient = new ApiClient()

/**
 * Generic API request handler with error handling
 */
export async function apiRequest<T = any>(
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE',
  url: string,
  data?: any
): Promise<ApiResponse<T>> {
  try {
    let response

    switch (method) {
      case 'GET':
        response = await apiClient.get<T>(url)
        break
      case 'POST':
        response = await apiClient.post<T>(url, data)
        break
      case 'PUT':
        response = await apiClient.put<T>(url, data)
        break
      case 'PATCH':
        response = await apiClient.patch<T>(url, data)
        break
      case 'DELETE':
        response = await apiClient.delete<T>(url)
        break
    }

    return {
      success: true,
      data: response.data,
    }
  } catch (error) {
    const axiosError = error as AxiosError
    return {
      success: false,
      error: axiosError.message,
      data: axiosError.response?.data as T,
    }
  }
}
