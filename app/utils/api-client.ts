/**
 * API Client Utility
 * Provides a secure interface for making API requests to our backend
 */

import { getCsrfToken } from '@/app/utils/csrf';

interface ApiClientOptions {
  baseUrl?: string;
  headers?: Record<string, string>;
}

type FetchOptions = RequestInit & {
  params?: Record<string, string>;
  withCredentials?: boolean;
};

/**
 * API Client for making secure API requests
 */
export class ApiClient {
  private baseUrl: string;
  private defaultHeaders: Record<string, string>;

  constructor(options: ApiClientOptions = {}) {
    this.baseUrl = options.baseUrl || '/api';
    this.defaultHeaders = {
      'Content-Type': 'application/json',
      ...options.headers,
    };
  }

  /**
   * Make a secure GET request
   */
  async get<T = any>(endpoint: string, options: FetchOptions = {}): Promise<T> {
    return this.request<T>('GET', endpoint, options);
  }

  /**
   * Make a secure POST request with CSRF protection
   */
  async post<T = any>(endpoint: string, data?: any, options: FetchOptions = {}): Promise<T> {
    return this.request<T>('POST', endpoint, {
      ...options,
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  /**
   * Make a secure PUT request with CSRF protection
   */
  async put<T = any>(endpoint: string, data?: any, options: FetchOptions = {}): Promise<T> {
    return this.request<T>('PUT', endpoint, {
      ...options,
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  /**
   * Make a secure DELETE request with CSRF protection
   */
  async delete<T = any>(endpoint: string, options: FetchOptions = {}): Promise<T> {
    return this.request<T>('DELETE', endpoint, options);
  }

  /**
   * Make a generic secure request with CSRF protection
   */
  private async request<T = any>(
    method: string,
    endpoint: string,
    options: FetchOptions = {}
  ): Promise<T> {
    const { params, withCredentials = true, ...fetchOptions } = options;
    const url = this.buildUrl(endpoint, params);
    
    // Get headers with CSRF token for mutating requests
    const headers = await this.getHeaders(method);
    
    try {
      const response = await fetch(url, {
        method,
        ...fetchOptions,
        headers: {
          ...this.defaultHeaders,
          ...headers,
          ...options.headers,
        },
        credentials: withCredentials ? 'include' : 'same-origin',
      });

      // Parse response
      const data = await this.parseResponse(response);
      
      // Handle API error responses
      if (!response.ok) {
        throw new ApiError(
          data?.error?.message || 'An unexpected error occurred',
          response.status,
          data?.error?.details
        );
      }

      return data;
    } catch (error) {
      // Rethrow ApiErrors
      if (error instanceof ApiError) {
        throw error;
      }
      
      // Convert other errors to ApiErrors
      throw new ApiError(
        error instanceof Error ? error.message : String(error),
        0
      );
    }
  }

  /**
   * Build URL with query parameters
   */
  private buildUrl(endpoint: string, params?: Record<string, string>): string {
    const url = new URL(endpoint, window.location.origin);
    
    // Ensure endpoint starts with baseUrl if it doesn't already
    let fullPath;
    if (endpoint.startsWith('/api/')) {
      // If endpoint already starts with '/api/', use it as is
      fullPath = endpoint;
    } else if (endpoint.startsWith('/')) {
      fullPath = `${this.baseUrl}${endpoint}`;
    } else {
      fullPath = `${this.baseUrl}/${endpoint}`;
    }
    
    url.pathname = fullPath;
    
    // Add query parameters
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        url.searchParams.append(key, value);
      });
    }
    
    return url.toString();
  }

  /**
   * Get headers with CSRF token for mutating requests
   */
  private async getHeaders(method: string): Promise<Record<string, string>> {
    // Only add CSRF token for mutating requests
    if (['POST', 'PUT', 'DELETE', 'PATCH'].includes(method.toUpperCase())) {
      const csrfToken = await getCsrfToken();
      if (csrfToken) {
        return { 'X-CSRF-Token': csrfToken };
      }
    }
    
    return {};
  }

  /**
   * Parse the response based on content type
   */
  private async parseResponse(response: Response): Promise<any> {
    const contentType = response.headers.get('Content-Type');
    
    if (contentType?.includes('application/json')) {
      return response.json();
    }
    
    if (contentType?.includes('text/')) {
      return response.text();
    }
    
    return response.blob();
  }
}

/**
 * Custom error class for API errors
 */
export class ApiError extends Error {
  status: number;
  details?: any;

  constructor(message: string, status: number, details?: any) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.details = details;
  }
}

// Create and export a default client instance
export const apiClient = new ApiClient(); 