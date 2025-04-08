/**
 * API Middleware Functions
 * Security middleware for Next.js API routes
 */

import { NextRequest, NextResponse } from 'next/server';
import { nanoid } from 'nanoid';
import { API } from '@/app/config/constants';
import { createErrorResponse, HttpStatus, ErrorMessages } from '@/app/lib/api-utils';
import { Ratelimit } from '@upstash/ratelimit';
import { timingSafeEqual } from 'crypto'; // Import timingSafeEqual

const CSRF_COOKIE_NAME = 'csrf-token';
const CSRF_HEADER_NAME = 'X-CSRF-Token';

// Define rate limit configuration type
interface RateLimitConfig {
  limit: number;
  windowMs: number;
}

// Define CSRF validation result type
interface CsrfValidationResult {
  success: boolean;
  error?: NextResponse;
}

/**
 * Middleware to enforce rate limiting using Postgres
 */
export function applyRateLimit(req: NextRequest, config: RateLimitConfig): { success: boolean; error?: NextResponse } {
  const ipAddress = req.headers.get('x-forwarded-for') || '127.0.0.1'; // Get user's IP address
  
  // TODO: Replace with Postgres-based rate limit implementation
  // This is a placeholder - actual implementation would need to:
  // 1. Check/record request count in Postgres for the IP
  // 2. Compare against limit and window
  // 3. Return appropriate response
  
  console.warn('Rate limiting implementation needs to be updated to use Postgres');
  
  return { success: true }; // Placeholder return
}

/**
 * Middleware to set a CSRF token cookie on a response.
 * Should be called on GET requests or responses that precede form submissions.
 */
export function setCsrfTokenCookie(response: NextResponse): NextResponse {
  const token = nanoid(32); // Generate a new token for each response
  response.cookies.set(CSRF_COOKIE_NAME, token, {
    httpOnly: false, // MUST be false so JS can read it
    secure: process.env.NODE_ENV === 'production', // Use secure cookies in production
    path: '/',          // Available across the site
    sameSite: 'lax',    // Good balance of security and usability
    // maxAge: AUTH.SESSION_MAX_AGE, // Optionally set maxAge if needed, otherwise session cookie
  });
  return response;
}

/**
 * Validate CSRF token using Double Submit Cookie method.
 * Checks header token against cookie token.
 */
export function validateCsrfToken(req: NextRequest): CsrfValidationResult {
  // Skip validation for safe methods (GET, HEAD, OPTIONS)
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method.toUpperCase())) {
    return { success: true }; 
  }

  const headerToken = req.headers.get(CSRF_HEADER_NAME);
  const cookieToken = req.cookies.get(CSRF_COOKIE_NAME)?.value;

  if (!headerToken || !cookieToken) {
    console.warn('CSRF Validation Failed: Missing header or cookie token.');
    return {
      success: false,
      error: createErrorResponse(ErrorMessages.INVALID_CSRF_TOKEN, HttpStatus.FORBIDDEN)
    };
  }

  // Use timing-safe comparison
  try {
    const headerBuffer = Buffer.from(headerToken);
    const cookieBuffer = Buffer.from(cookieToken);

    if (headerBuffer.length !== cookieBuffer.length || !timingSafeEqual(headerBuffer, cookieBuffer)) {
      console.warn('CSRF Validation Failed: Tokens do not match.');
      return {
        success: false,
        error: createErrorResponse(ErrorMessages.INVALID_CSRF_TOKEN, HttpStatus.FORBIDDEN)
      };
    }
    
    // Tokens match
    return { success: true };

  } catch (error) {
    console.error('Error during CSRF token comparison:', error);
    return {
      success: false,
      error: createErrorResponse('Error processing CSRF token', HttpStatus.INTERNAL_SERVER_ERROR)
    };
  }
}

/**
 * Secure headers middleware
 */
export function applySecurityHeaders(response: NextResponse): NextResponse {
  // Set security headers
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-XSS-Protection', '1; mode=block');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  
  // Content Security Policy (Adjust as needed for your specific resources)
  response.headers.set(
    'Content-Security-Policy',
    "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self'; connect-src 'self' ws: wss:;"
    // Added ws: wss: for WebSocket connections
    // Added https: for images from any source
    // Added 'unsafe-eval' - review if needed, often required by some libraries but less secure.
  );
  
  return response;
} 