import { NextRequest } from 'next/server';

import { prisma } from '@/app/lib/db';
import { createSuccessResponse } from '@/app/lib/api-utils';

const SESSION_COOKIE_NAME = 'sid';

/**
 * POST /api/auth/logout
 * Clears the server-side session and the session cookie.
 */
export async function POST(request: NextRequest) { // Changed to POST for semantic logout action
  console.log('Logout API called');
  
  // Get the session ID directly from the request
  const sessionId = request.cookies.get(SESSION_COOKIE_NAME)?.value;

  if (sessionId) {
    try {
      // Delete the session from the Database
      await prisma.session.deleteMany({
        where: { sessionId: sessionId },
      });
      console.log(`Deleted session from DB for sessionId: ${sessionId}`);
    } catch (dbError) {
      console.error(`Error deleting session ${sessionId} from DB:`, dbError);
      // Log the error but proceed to clear the cookie anyway
    }
  }

  // Prepare response to clear the cookie
  const response = createSuccessResponse({ message: 'Logout successful' });

  // Clear the session cookie by setting maxAge to -1
  response.cookies.set(SESSION_COOKIE_NAME, '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    maxAge: -1, // Instruct browser to delete the cookie
    path: '/',
    sameSite: 'lax',
  });

  console.log('Cleared session cookie.');

  // Clear potential legacy NextAuth cookies as well
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || '';
  const isSecure = appUrl.startsWith('https://');
  const cookiePrefix = isSecure ? '__Secure-' : '';
  const sessionCookieNameLegacy = `${cookiePrefix}next-auth.session-token`;
  const csrfCookieNameLegacy = `${cookiePrefix}next-auth.csrf-token`;
  const callbackUrlCookieNameLegacy = `${cookiePrefix}next-auth.callback-url`;
  response.cookies.set(sessionCookieNameLegacy, '', { maxAge: -1, path: '/' });
  response.cookies.set(csrfCookieNameLegacy, '', { maxAge: -1, path: '/' });
  response.cookies.set(callbackUrlCookieNameLegacy, '', { maxAge: -1, path: '/' });

  return response;
} 