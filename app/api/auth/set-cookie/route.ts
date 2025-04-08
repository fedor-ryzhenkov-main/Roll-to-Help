import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import prisma from '@/app/lib/db';
import { createErrorResponse, createSuccessResponse, HttpStatus } from '@/app/lib/api-utils';

const SESSION_COOKIE_NAME = 'sid'; // Name for our session cookie
const SESSION_EXPIRY_SECONDS = 60 * 60 * 24 * 7; // 7 days (keep consistent)

/**
 * POST /api/auth/set-cookie
 * 
 * Receives a validated sessionId (validated implicitly via WebSocket channel)
 * and sets it as an HttpOnly cookie.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const sessionId = body.sessionId;

    if (!sessionId || typeof sessionId !== 'string' || sessionId.length < 10) { // Basic validation
      console.warn('Invalid sessionId received in set-cookie request:', sessionId);
      return createErrorResponse('Invalid session identifier', HttpStatus.BAD_REQUEST);
    }

    // Verify session exists in database using Prisma
    const session = await prisma.session.findUnique({
      where: { sessionId: sessionId }
    });

    if (!session) {
      console.warn(`Session ID ${sessionId} not found in database.`);
      return createErrorResponse('Invalid session', HttpStatus.UNAUTHORIZED);
    }

    // Verify session is not expired
    if (session.expiresAt < new Date()) {
      console.warn(`Session ID ${sessionId} is expired.`);
      // Clean up expired session
      await prisma.session.delete({
        where: { sessionId: sessionId }
      });
      return createErrorResponse('Session expired', HttpStatus.UNAUTHORIZED);
    }

    console.log(`Setting session cookie for sessionId: ${sessionId}`);

    // Prepare the response
    const response = createSuccessResponse({ message: 'Session cookie set' });

    // Set the HttpOnly cookie - properly awaited now
    const cookieStore = cookies();
    // Use NextResponse's cookies API to set cookies to avoid the need for await
    response.cookies.set(SESSION_COOKIE_NAME, sessionId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production', // Use Secure in production
      maxAge: SESSION_EXPIRY_SECONDS,
      path: '/',
      sameSite: 'lax', // Lax is generally recommended for sessions
    });

    return response;

  } catch (error) {
    console.error('Error setting session cookie:', error);
    return createErrorResponse('Failed to set session cookie', HttpStatus.INTERNAL_SERVER_ERROR);
  }
} 