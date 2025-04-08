'use client';

import { useState, useCallback } from 'react';
import { ApiResponse } from '@/app/types';

interface ApiOptions<T> extends RequestInit {
  onSuccess?: (data: T) => void;
  onError?: (error: Error | string) => void;
}

type ApiMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';

interface UseApiReturn<T> {
  data: T | null;
  error: string | null;
  errors: any[] | null;
  isLoading: boolean;
  isSuccess: boolean;
  request: <R = T>(url: string, options?: ApiOptions<R>) => Promise<R | null>;
  reset: () => void;
}

/**
 * Custom hook for making API requests with standardized error handling
 */
export function useApi<T = any>(defaultUrl?: string, defaultOptions?: ApiOptions<T>): UseApiReturn<T> {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [errors, setErrors] = useState<any[] | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isSuccess, setIsSuccess] = useState<boolean>(false);

  /**
   * Reset the state of the hook
   */
  const reset = useCallback(() => {
    setData(null);
    setError(null);
    setErrors(null);
    setIsLoading(false);
    setIsSuccess(false);
  }, []);

  /**
   * Make a request to the API
   */
  const request = useCallback(
    async <R = T>(url: string = defaultUrl || '', options: ApiOptions<R> = {}): Promise<R | null> => {
      if (!url) {
        throw new Error('URL is required');
      }

      const { onSuccess, onError, ...fetchOptions } = { ...defaultOptions, ...options };
      setIsLoading(true);
      setError(null);
      setErrors(null);

      try {
        const response = await fetch(url, {
          headers: {
            'Content-Type': 'application/json',
            ...fetchOptions.headers,
          },
          ...fetchOptions,
        });

        const responseData = (await response.json()) as ApiResponse<R>;

        if (!response.ok || !responseData.success) {
          const errorMessage = responseData.message || 'An error occurred';
          setError(errorMessage);
          setErrors(responseData.errors || null);
          setIsSuccess(false);
          onError?.(errorMessage);
          return null;
        }

        // Handle success
        const result = responseData.data as R;
        setData(result as unknown as T);
        setIsSuccess(true);
        onSuccess?.(result);
        return result;
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'An error occurred';
        setError(errorMessage);
        setIsSuccess(false);
        onError?.(errorMessage);
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    [defaultUrl, defaultOptions]
  );

  return {
    data,
    error,
    errors,
    isLoading,
    isSuccess,
    request,
    reset,
  };
}

/**
 * Helper function for making GET requests
 */
export function useGet<T = any>(url?: string, options?: Omit<ApiOptions<T>, 'method'>) {
  return useApi<T>(url, { ...options, method: 'GET' });
}

/**
 * Helper function for making POST requests
 */
export function usePost<T = any>(url?: string, options?: Omit<ApiOptions<T>, 'method'>) {
  return useApi<T>(url, { ...options, method: 'POST' });
}

/**
 * Helper function for making PUT requests
 */
export function usePut<T = any>(url?: string, options?: Omit<ApiOptions<T>, 'method'>) {
  return useApi<T>(url, { ...options, method: 'PUT' });
}

/**
 * Helper function for making DELETE requests
 */
export function useDelete<T = any>(url?: string, options?: Omit<ApiOptions<T>, 'method'>) {
  return useApi<T>(url, { ...options, method: 'DELETE' });
}

export default useApi; 