/**
 * CSRF Protection Utility
 * Handles CSRF token extraction and validation on the client side
 */

const CSRF_COOKIE_NAME = 'csrf-token';

/**
 * Get the CSRF token from cookies
 */
export function getCsrfToken(): string | null {
  
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return null; 
  }
  
  const token = getCookie(CSRF_COOKIE_NAME);
  
  if (!token) {
    console.warn(`CSRF token cookie (${CSRF_COOKIE_NAME}) not found.`);
    return null;
  }
  
  return token;
}

/**
 * Helper function to get a cookie value by name
 */
function getCookie(name: string): string | null {
  if (typeof document === 'undefined') return null; // Check for document existence
  
  const cookieValue = document.cookie
    .split('; ')
    .find(row => row.startsWith(`${name}=`))
    ?.split('=')[1];
    
  return cookieValue ? decodeURIComponent(cookieValue) : null;
}

/**
 * Check if a CSRF token is present
 */
export function hasCsrfToken(): boolean {
  return getCookie(CSRF_COOKIE_NAME) !== null;
}