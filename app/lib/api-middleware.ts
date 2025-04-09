/**
 * API Middleware Functions
 * Security middleware for Next.js API routes
 */

import { NextRequest, NextResponse } from 'next/server';
import { nanoid } from 'nanoid';
import { createErrorResponse, HttpStatus, ErrorMessages } from '@/app/lib/api-utils';
import { timingSafeEqual } from 'crypto'; 

const CSRF_COOKIE_NAME = 'csrf-token';
const CSRF_HEADER_NAME = 'X-CSRF-Token';

// Define CSRF validation result type
interface CsrfValidationResult {
  success: boolean;
  error?: NextResponse;
}

/**
 * Middleware to set a CSRF token cookie on a response.
 * Should be called on GET requests or responses that precede form submissions.
 */
export function setCsrfTokenCookie(response: NextResponse): NextResponse {
  const token = nanoid(32); 
  response.cookies.set(CSRF_COOKIE_NAME, token, {
    httpOnly: false, 
    secure: process.env.NODE_ENV === 'production', 
    path: '/',          
    sameSite: 'lax',   
  });
  return response;
}

/**
 * Validate CSRF token using Double Submit Cookie method.
 * Checks header token against cookie token.
 */
export function validateCsrfToken(req: NextRequest): CsrfValidationResult {
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method.toUpperCase())) {
    return { success: true };
  }

  const headerToken = req.headers.get(CSRF_HEADER_NAME);
  const cookieToken = req.cookies.get(CSRF_COOKIE_NAME)?.value;

  // --- Enhanced Logging ---
  console.log('[CSRF Validation] Checking request:', req.method, req.nextUrl.pathname);
  console.log(`[CSRF Validation] Header Token (${CSRF_HEADER_NAME}):`, headerToken ? `'${headerToken}'` : 'MISSING');
  console.log(`[CSRF Validation] Cookie Token (${CSRF_COOKIE_NAME}):`, cookieToken ? `'${cookieToken}'` : 'MISSING');
  // -----------------------

  if (!headerToken || !cookieToken) {
    console.warn('CSRF Validation Failed: Missing header or cookie token.');
    return {
      success: false,
      error: createErrorResponse(ErrorMessages.INVALID_CSRF_TOKEN, HttpStatus.FORBIDDEN)
    };
  }

  try {
    // Basic length check before Buffer conversion
    if (headerToken.length !== cookieToken.length) {
        console.warn('CSRF Validation Failed: Token lengths do not match.');
        return {
            success: false,
            error: createErrorResponse(ErrorMessages.INVALID_CSRF_TOKEN, HttpStatus.FORBIDDEN)
        };
    }
    
    const headerBuffer = Buffer.from(headerToken);
    const cookieBuffer = Buffer.from(cookieToken);

    // Ensure buffers were created correctly and lengths still match (redundant but safe)
     if (headerBuffer.length !== cookieBuffer.length) {
        console.error('CSRF Validation Error: Buffer length mismatch after creation. This should not happen.');
        return {
            success: false,
            error: createErrorResponse('Error processing CSRF token', HttpStatus.INTERNAL_SERVER_ERROR)
        };
     }

    if (!timingSafeEqual(headerBuffer, cookieBuffer)) {
      console.warn('CSRF Validation Failed: Tokens do not match (timingSafeEqual).');
      return {
        success: false,
        error: createErrorResponse(ErrorMessages.INVALID_CSRF_TOKEN, HttpStatus.FORBIDDEN)
      };
    }

    console.log('[CSRF Validation] Tokens matched successfully.');
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
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-XSS-Protection', '1; mode=block');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  
  response.headers.set(
    'Content-Security-Policy',
    "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self'; connect-src 'self' ws: wss:;"
  );
  
  return response;
} 