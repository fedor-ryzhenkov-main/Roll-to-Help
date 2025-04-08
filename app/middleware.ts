import { NextResponse, NextRequest } from 'next/server';
import { setCsrfTokenCookie } from './lib/api-middleware';

/**
 * Global middleware for adding security headers and CSRF protection
 */
export async function middleware(request: NextRequest) {
  console.log(`[Middleware] Request path: ${request.nextUrl.pathname}`); // Log path
  // Clone the request headers to modify them
  const requestHeaders = new Headers(request.headers);
  
  // Get response from next handler
  const response = NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });

  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-XSS-Protection', '1; mode=block');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  
  // Content Security Policy
  // Conditionally allow 'unsafe-eval' in development mode only
  const isDev = process.env.NODE_ENV === 'development';
  console.log(`[Middleware] NODE_ENV: ${process.env.NODE_ENV}, isDev: ${isDev}`); // Log NODE_ENV
  
  const scriptSrc = isDev 
    ? "'self' 'unsafe-inline' 'unsafe-eval'" 
    : "'self' 'unsafe-inline'";
    
  const cspHeader = `default-src 'self'; script-src ${scriptSrc}; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self';`;
  response.headers.set('Content-Security-Policy', cspHeader);

  // Add CSRF token to page requests (not for API or static assets)
  const isPageRequest = !request.nextUrl.pathname.startsWith('/api/') && 
                        !request.nextUrl.pathname.startsWith('/_next/') &&
                        !request.nextUrl.pathname.match(/\.(ico|png|jpg|jpeg|svg|css|js)$/);

  // Let setCsrfTokenCookie handle token generation and setting
  if (isPageRequest) {
    setCsrfTokenCookie(response);
  }

  return response;
}

/**
 * Configure which routes this middleware applies to
 */
export const config = {
  matcher: [
    // Apply to all routes except static files and API routes that handle their own security
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
}; 