/**
 * API Utilities
 * Common utilities for API endpoints
 */

import { NextResponse } from 'next/server';


// HTTP status codes
export const HttpStatus = {
  OK: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  UNPROCESSABLE_ENTITY: 422,
  TOO_MANY_REQUESTS: 429,
  INTERNAL_SERVER_ERROR: 500,
} as const;

// Common error messages
export const ErrorMessages = {
  INTERNAL_ERROR: 'An internal server error occurred',
  UNAUTHORIZED: 'Authentication required',
  FORBIDDEN: 'Access denied',
  NOT_FOUND: 'Resource not found',
  VALIDATION_ERROR: 'Validation error',
  CONFLICT: 'Resource conflict',
  INVALID_CSRF_TOKEN: 'Invalid or missing CSRF token',
  TOO_MANY_REQUESTS: 'Too many requests, please try again later',
};

// Type for API responses
export type ApiResponse<T = unknown> = {
  success: boolean;
  data?: T;
  error?: {
    message: string;
    details?: unknown;
  };
  timestamp: string;
};

/**
 * Create a success response
 * @param data Response data
 * @param status HTTP status code (defaults to 200 OK)
 */
export function createSuccessResponse<T>(data: T, status = HttpStatus.OK): NextResponse {
  const response: ApiResponse<T> = {
    success: true,
    data,
    timestamp: new Date().toISOString()
  };

  return NextResponse.json(response, { status });
}

/**
 * Create an error response
 * @param message Error message
 * @param status HTTP status code (defaults to 400 Bad Request)
 * @param details Optional error details
 */
export function createErrorResponse(
  message: string, 
  status: number = HttpStatus.BAD_REQUEST, 
  details?: unknown
): NextResponse {
  // Define the base error object type explicitly
  const errorPayload: { message: string; details?: unknown } = {
    message,
  };
  
  // Conditionally add details if provided
  if (details !== undefined && details !== null) {
    errorPayload.details = details;
  }

  const response: ApiResponse = {
    success: false,
    error: errorPayload, // Use the constructed payload
    timestamp: new Date().toISOString()
  };

  return NextResponse.json(response, { status });
}

/**
 * Log API errors with context
 */
export function logApiError(
  path: string, 
  error: unknown, 
  context?: Record<string, unknown>
) {
  console.error(`API Error in ${path}:`, {
    message: error instanceof Error ? error.message : String(error),
    stack: error instanceof Error ? error.stack : undefined,
    ...context
  });
}

/**
 * Sanitize user input to prevent XSS
 */
export function sanitizeInput(input: string): string {
  return input
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * Truncate a string to a maximum length and add ellipsis
 */
export function truncate(str: string, maxLength: number): string {
  if (str.length <= maxLength) return str;
  return str.slice(0, maxLength) + '...';
} 