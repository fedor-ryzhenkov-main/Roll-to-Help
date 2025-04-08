import { NextRequest, NextResponse } from 'next/server'
import { createBid } from '@/app/services/bidService'
import { createSuccessResponse, createErrorResponse, HttpStatus } from '@/app/lib/api-utils'
import { validateCsrfToken, applyRateLimit } from '@/app/lib/api-middleware'
import prisma from '@/app/lib/db'


const SESSION_COOKIE_NAME = 'sid';

/**
 * Helper function to get authenticated user ID from DB session
 */
async function getUserIdFromSession(request: NextRequest): Promise<{ userId: string | null; shouldClearCookie: boolean }> {
  const sessionId = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  if (!sessionId) return { userId: null, shouldClearCookie: false };

  const session = await prisma.session.findUnique({
    where: { sessionId: sessionId },
  });

  // Check if session exists and is not expired
  if (!session || session.expiresAt < new Date()) {
    console.log(`getUserIdFromSession: Session invalid/expired for sessionId: ${sessionId}`);
    // Indicate that the cookie should be cleared by the caller
    return { userId: null, shouldClearCookie: true }; 
  }
  return { userId: session.userId, shouldClearCookie: false };
}

/**
 * POST /api/bids
 * Creates a new bid for a game (Requires Authentication)
 * Required body: { gameId: string, amount: number }
 * Returns: { success: boolean, bid?: Bid, error?: string }
 */
export async function POST(req: NextRequest) {
  try {
    // --- Authentication Check ---
    const { userId, shouldClearCookie } = await getUserIdFromSession(req);
    
    if (!userId) {
      const response = createErrorResponse('Authentication required', HttpStatus.UNAUTHORIZED);
      if (shouldClearCookie) {
        // Clear the invalid cookie using the Response object
        response.cookies.set(SESSION_COOKIE_NAME, '', { maxAge: -1, path: '/' });
      }
      return response;
    }
    console.log(`Bid request authenticated for userId: ${userId}`);
    // --------------------------
    
    // Apply rate limiting 
    // ... (Consider if rate limit should be user-specific or IP-based)
    const rateLimit = applyRateLimit(req, { limit: 10, windowMs: 60000 });
    if (!rateLimit.success) return rateLimit.error;
    
    // Validate CSRF token (If implemented properly)
    const csrfResult = validateCsrfToken(req);
    if (!csrfResult.success) return csrfResult.error;
    
    // Parse request body
    const body = await req.json()
    const { gameId, amount } = body // Removed telegramId from body
    
    if (!gameId) {
      return createErrorResponse('Game ID is required', HttpStatus.BAD_REQUEST);
    }
    if (!amount || typeof amount !== 'number' || amount <= 0) {
      return createErrorResponse('Valid bid amount is required', HttpStatus.BAD_REQUEST);
    }

    // --- REMOVED User Lookup by Telegram ID --- 
    // We now have the authenticated userId from the session

    // Create the bid using the authenticated userId
    const bidResult = await createBid(gameId, amount, userId)
    
    if (!bidResult.success) {
      return createErrorResponse(bidResult.error || 'Failed to create bid', HttpStatus.BAD_REQUEST);
    }
    
    return createSuccessResponse({ bid: bidResult.bid }, HttpStatus.OK);

  } catch (error) {
    console.error('Error creating bid:', error);
    // Avoid leaking detailed errors in production
    const message = error instanceof Error ? 'Error processing bid' : 'An internal error occurred';
    return createErrorResponse(message, HttpStatus.INTERNAL_SERVER_ERROR);
  }
} 