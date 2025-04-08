# API Structure Guidelines

This directory contains all API endpoints for the Roll to Help application. The API follows a RESTful architecture and adheres to the following guidelines:

## Directory Structure

- Each resource should have its own directory (e.g., `/api/bids/`, `/api/games/`)
- Use route.ts files within these directories for HTTP method handlers
- Use subdirectories for nested resources (e.g., `/api/games/[id]/bids/`)

## Response Format

All API responses should follow the standard format:

```typescript
{
  success: boolean;       // Whether the request was successful
  message?: string;       // Optional message, usually for errors
  data?: T;               // The actual response data
  errors?: string[];      // Optional array of error messages
}
```

## Error Handling

- Use the `createErrorResponse` utility for all error responses
- Use appropriate HTTP status codes from the `HttpStatus` enum
- Log errors with the `logApiError` utility

## Authentication

- Use the `requireAuth` middleware for protected endpoints
- Use the `requireAdmin` middleware for admin-only endpoints

## Rate Limiting

- Apply rate limiting with the `applyRateLimit` utility where appropriate
- Adjust rate limits based on the endpoint sensitivity

## API Versioning

- APIs are not versioned in the URL path
- Breaking changes should be avoided where possible
- When necessary, consider adding new endpoints rather than changing existing ones

## Example Route

```typescript
// app/api/resource/route.ts
import { NextRequest } from 'next/server';
import { createSuccessResponse, createErrorResponse, HttpStatus, logApiError } from '@/app/lib/api-utils';
import { requireAuth } from '@/app/lib/api-middleware';

export async function GET(request: NextRequest) {
  try {
    const authResult = await requireAuth(request);
    if (!authResult.success) {
      return authResult.error;
    }
    
    // Handle the request...
    const data = { /* ... */ };
    
    return createSuccessResponse(data);
  } catch (error) {
    logApiError('/api/resource', error);
    return createErrorResponse('Failed to fetch resource', HttpStatus.INTERNAL_SERVER_ERROR);
  }
}
```

By following these guidelines, we ensure a consistent and maintainable API structure across the application. 