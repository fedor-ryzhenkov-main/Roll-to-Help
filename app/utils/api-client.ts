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
  async get<T = unknown>(endpoint: string, options: FetchOptions = {}): Promise<T> {
    return this.request<T>('GET', endpoint, options);
  }

  /**
   * Make a secure POST request with CSRF protection
   */
  async post<T = unknown>(endpoint: string, data?: unknown, options: FetchOptions = {}): Promise<T> {
    return this.request<T>('POST', endpoint, {
      ...options,
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  /**
   * Make a secure PUT request with CSRF protection
   */
  async put<T = unknown>(endpoint: string, data?: unknown, options: FetchOptions = {}): Promise<T> {
    return this.request<T>('PUT', endpoint, {
      ...options,
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  /**
   * Make a secure DELETE request with CSRF protection
   */
  async delete<T = unknown>(endpoint: string, options: FetchOptions = {}): Promise<T> {
    return this.request<T>('DELETE', endpoint, options);
  }

  /**
   * Make a generic secure request with CSRF protection
   */
  private async request<T = unknown>(
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
      
      if (!response.ok) {
        let errorMessage = 'An unexpected error occurred';
        let errorDetails: unknown = null;

        // Check if data is a non-null object before accessing properties
        if (typeof data === 'object' && data !== null) {
          // Use type assertion ONLY after checking, or access via index
          const errorObj = (data as Record<string, unknown>)['error'];
          if (typeof errorObj === 'object' && errorObj !== null) {
             errorMessage = (errorObj as Record<string, unknown>)['message'] as string || errorMessage;
             errorDetails = (errorObj as Record<string, unknown>)['details'];
          }
        }

        throw new ApiError(
          errorMessage,
          response.status,
          errorDetails
        );
      }

      // Return data as T (caller handles assertion)
      return data as T;
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
  private async parseResponse(response: Response): Promise<unknown> {
    const contentType = response.headers.get('Content-Type');
    
    if (contentType?.includes('application/json')) {
      // Handle potential empty JSON response
      const text = await response.text();
      return text ? JSON.parse(text) : null;
    }
    
    if (contentType?.includes('text/')) {
      return response.text();
    }
    
    // Return Blob for other types, or null if no content
    return response.status !== 204 ? response.blob() : null;
  }
}

/**
 * Custom error class for API errors
 */
export class ApiError extends Error {
  status: number;
  details?: unknown;

  constructor(message: string, status: number, details?: unknown) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.details = details;
  }
}

// Create and export a default client instance
export const apiClient = new ApiClient(); 