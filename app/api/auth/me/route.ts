import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/app/lib/db';
import { createErrorResponse, createSuccessResponse, HttpStatus } from '@/app/lib/api-utils';
import { setCsrfTokenCookie } from '@/app/lib/api-middleware';

const SESSION_COOKIE_NAME = 'sid';

/**
 * Helper to get session ID from request cookies
 */
function getSessionIdFromRequest(request: NextRequest): string | undefined {
   // Use the passed request object to access cookies
   return request.cookies.get(SESSION_COOKIE_NAME)?.value;
}

/**
 * GET /api/auth/me
 * 
 * Retrieves the current user's information based on the session cookie.
 * Used by the frontend to initialize or verify the auth state.
 */
export async function GET(request: NextRequest) {
  let response: NextResponse;
  try {
    // Use the helper function to get the session ID
    const sessionId = getSessionIdFromRequest(request);

    if (!sessionId) {
      console.log('/api/auth/me: No session cookie found.');
      response = createSuccessResponse({ user: null }); 
      return setCsrfTokenCookie(response);
    }

    // Verify session ID in Database
    const session = await prisma.session.findUnique({
      where: { sessionId: sessionId },
    });

    // Check if session exists and is not expired
    if (!session || session.expiresAt < new Date()) {
      console.log(`/api/auth/me: Session not found or expired in DB for sessionId: ${sessionId}`);
      response = createSuccessResponse({ user: null });
      response.cookies.set(SESSION_COOKIE_NAME, '', { maxAge: -1, path: '/' });
      return setCsrfTokenCookie(response);
    }

    // Session is valid, fetch user details from DB
    const user = await prisma.user.findUnique({
      where: { id: session.userId },
      select: { 
        id: true,
        isAdmin: true,
        telegramId: true,
        telegramUsername: true,
        telegramFirstName: true,
        // Add any other fields needed by the frontend context/UI
      },
    });

    if (!user) {
      console.error(`/api/auth/me: User not found in DB for userId: ${session.userId} (from valid session ${sessionId})`);
      // Session exists but user doesn't? Clean up.
      try {
        await prisma.session.delete({ where: { sessionId: sessionId } });
      } catch (delError) {
        console.error(`Failed to delete orphaned session ${sessionId}:`, delError);
      }
      response = createErrorResponse('User associated with session not found', HttpStatus.INTERNAL_SERVER_ERROR);
      response.cookies.set(SESSION_COOKIE_NAME, '', { maxAge: -1, path: '/' });
      return setCsrfTokenCookie(response);
    }
    
    console.log(`/api/auth/me: Returning user data for userId: ${user.id}`);
    response = createSuccessResponse({ user });
    return setCsrfTokenCookie(response);

  } catch (error) {
    console.error('Error in /api/auth/me:', error);
    response = createErrorResponse('Failed to retrieve user status', HttpStatus.INTERNAL_SERVER_ERROR);
    return setCsrfTokenCookie(response);
  }
} 