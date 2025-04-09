'use client';

import { useState, useCallback } from 'react';
import { ApiResponse } from '@/app/types';

interface ApiOptions<T> extends RequestInit {
  onSuccess?: (data: T) => void;
  onError?: (error: Error | string) => void;
}

interface UseApiReturn<T> {
  data: T | null;
  error: string | null;
  errors: unknown[] | Record<string, unknown> | null;
  isLoading: boolean;
  isSuccess: boolean;
  request: (url: string, options?: ApiOptions<T>) => Promise<T | null>;
  reset: () => void;
}

/**
 * Custom hook for making API requests with standardized error handling for a specific type T
 */
export function useApi<T = unknown>(defaultUrl?: string, defaultOptions?: ApiOptions<T>): UseApiReturn<T> {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [errors, setErrors] = useState<unknown[] | Record<string, unknown> | null>(null);
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
    async (url: string = defaultUrl || ' ', options: ApiOptions<T> = {}): Promise<T | null> => {
      if (!url) {
        console.error('useApi request called without URL.');
        setError('URL is required for API request.');
        return null;
      }

      const { onSuccess, onError, ...fetchOptions } = { ...defaultOptions, ...options };
      setIsLoading(true);
      setError(null);
      setErrors(null);
      setIsSuccess(false);

      try {
        const response = await fetch(url, {
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
            ...fetchOptions.headers,
          },
          ...fetchOptions,
        });

        let responseData: ApiResponse<T> | null = null;
        try {
           responseData = await response.json();
        } catch (e) {
           if (!response.ok) {
               throw new Error(`HTTP error ${response.status}: ${response.statusText}`);
           } else {
               throw new Error(`Failed to parse successful response as JSON: ${e instanceof Error ? e.message : String(e)}`);
           }
        }

        if (!response.ok || !responseData?.success) {
          const errorMessage = responseData?.message || `HTTP error ${response.status}`;
          const responseErrors = responseData?.errors || null;
          setError(errorMessage);
          setErrors(responseErrors);
          setIsSuccess(false);
          onError?.(errorMessage);
          console.error(`API Error (${url}): ${errorMessage}`, responseErrors);
          return null;
        }

        const result = responseData.data as T;
        setData(result);
        setIsSuccess(true);
        onSuccess?.(result);
        return result;
        
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'An unexpected error occurred';
        console.error(`Fetch Error (${url}): ${errorMessage}`, err);
        setError(errorMessage);
        setErrors(null);
        setIsSuccess(false);
        onError?.(errorMessage);
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    [defaultUrl, defaultOptions, setData, setError, setErrors, setIsSuccess, setIsLoading]
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
 * @template T - The expected response data type
 * @param url - Optional URL to make the request to
 * @param options - Optional API options excluding method
 * @returns API hook with GET method configured
 */
export function useGet<T = unknown>(url?: string, options?: Omit<ApiOptions<T>, 'method'>) {
  return useApi<T>(url, { ...options, method: 'GET' });
}

/**
 * Helper function for making POST requests
 * @template T - The expected response data type
 * @param url - Optional URL to make the request to
 * @param options - Optional API options excluding method
 * @returns API hook with POST method configured
 */
export function usePost<T = unknown>(url?: string, options?: Omit<ApiOptions<T>, 'method'>) {
  return useApi<T>(url, { ...options, method: 'POST' });
}

/**
 * Helper function for making PUT requests
 * @template T - The expected response data type
 * @param url - Optional URL to make the request to
 * @param options - Optional API options excluding method
 * @returns API hook with PUT method configured
 */
export function usePut<T = unknown>(url?: string, options?: Omit<ApiOptions<T>, 'method'>) {
  return useApi<T>(url, { ...options, method: 'PUT' });
}

/**
 * Helper function for making DELETE requests
 * @template T - The expected response data type
 * @param url - Optional URL to make the request to
 * @param options - Optional API options excluding method
 * @returns API hook with DELETE method configured
 */
export function useDelete<T = unknown>(url?: string, options?: Omit<ApiOptions<T>, 'method'>) {
  return useApi<T>(url, { ...options, method: 'DELETE' });
}

export default useApi;