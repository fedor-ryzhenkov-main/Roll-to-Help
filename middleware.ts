import { NextResponse, NextRequest } from 'next/server';
import { setCsrfTokenCookie } from './app/lib/api-middleware';

/**
 * Global middleware for adding security headers and CSRF protection
 */
export async function middleware(request: NextRequest) {
  console.log(`[Middleware] Request path: ${request.nextUrl.pathname}`);
  
  // Let the request proceed to the handler first
  const response = NextResponse.next();

  // --- Apply Headers to the final response --- 
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-XSS-Protection', '1; mode=block');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  
  // Content Security Policy
  const isDev = process.env.NODE_ENV === 'development';
  console.log(`[Middleware] NODE_ENV: ${process.env.NODE_ENV}, isDev: ${isDev}`);
  
  const scriptSrc = isDev 
    ? "'self' 'unsafe-inline' 'unsafe-eval'" 
    : "'self' 'unsafe-inline'"; // Be careful with unsafe-inline in prod
    
  const cspHeader = `default-src 'self'; script-src ${scriptSrc}; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self'; connect-src 'self' wss:;`; // Added wss: for potential WebSocket/SSE
  response.headers.set('Content-Security-Policy', cspHeader);

  // Add CSRF token to page requests (not for API or static assets)
  const isPageRequest = !request.nextUrl.pathname.startsWith('/api/') && 
                        !request.nextUrl.pathname.startsWith('/_next/') &&
                        !request.nextUrl.pathname.match(/\.(ico|png|jpg|jpeg|svg|css|js)$/);

  if (isPageRequest) {
    setCsrfTokenCookie(response); 
    console.log(`[Middleware] CSRF cookie should be set for ${request.nextUrl.pathname}`);
  } else {
    console.log(`[Middleware] CSRF cookie skipped for ${request.nextUrl.pathname}`);
  }

  return response;
}

/*
 * Configure which routes this middleware applies to
 */
export const config = {
  matcher: [
    // Apply to all routes except static files and API routes that handle their own security
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};