import { NextRequest } from 'next/server';
import prisma from '@/app/lib/db';
import { createErrorResponse, createSuccessResponse, HttpStatus } from '@/app/lib/api-utils';

const SESSION_COOKIE_NAME = 'sid'; 
const SESSION_EXPIRY_SECONDS = 60 * 60 * 24 * 7; 

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

    if (!sessionId || typeof sessionId !== 'string' || sessionId.length < 10) { 
      console.warn('Invalid sessionId received in set-cookie request:', sessionId);
      return createErrorResponse('Invalid session identifier', HttpStatus.BAD_REQUEST);
    }

    const session = await prisma.session.findUnique({
      where: { sessionId: sessionId }
    });

    if (!session) {
      console.warn(`Session ID ${sessionId} not found in database.`);
      return createErrorResponse('Invalid session', HttpStatus.UNAUTHORIZED);
    }

    if (session.expiresAt < new Date()) {
      console.warn(`Session ID ${sessionId} is expired.`);
      await prisma.session.delete({
        where: { sessionId: sessionId }
      });
      return createErrorResponse('Session expired', HttpStatus.UNAUTHORIZED);
    }

    console.log(`Setting session cookie for sessionId: ${sessionId}`);


    const response = createSuccessResponse({ message: 'Session cookie set' });

    response.cookies.set(SESSION_COOKIE_NAME, sessionId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: SESSION_EXPIRY_SECONDS,
      path: '/',
      sameSite: 'lax', 
    });

    return response;

  } catch (error) {
    console.error('Error setting session cookie:', error);
    return createErrorResponse('Failed to set session cookie', HttpStatus.INTERNAL_SERVER_ERROR);
  }
} 