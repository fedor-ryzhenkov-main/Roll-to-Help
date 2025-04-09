import { NextRequest } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/app/api/auth/[...nextauth]/options'
import { createBid } from '@/app/services/bidService'
import { createSuccessResponse, createErrorResponse, HttpStatus } from '@/app/lib/api-utils'
import { validateCsrfToken } from '@/app/lib/api-middleware'

/**
 * POST /api/bids
 * Creates a new bid for a game (Requires Authentication)
 * Required body: { gameId: string, amount: number }
 * Returns: { success: boolean, bid?: Bid, error?: string }
 */
export async function POST(req: NextRequest) {
  try {
    // --- Authentication Check using NextAuth ---
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return createErrorResponse('Authentication required', HttpStatus.UNAUTHORIZED);
    }
    
    // Based on our NextAuth config, we need to extract user ID differently
    // In the NextAuth setup, default User has no id field directly
    // @ts-expect-error - we have added sub field to session.user in our NextAuth config
    const userId = session.user.sub;
    if (!userId) {
      return createErrorResponse('Invalid user session', HttpStatus.UNAUTHORIZED);
    }
    
    console.log(`Bid request authenticated for userId: ${userId}`);
    // --------------------------
    
    // Validate CSRF token (If implemented properly)
    const csrfResult = validateCsrfToken(req);
    if (!csrfResult.success) return csrfResult.error;
    
    // Parse request body
    const body = await req.json()
    const { gameId, amount } = body
    
    if (!gameId) {
      return createErrorResponse('Game ID is required', HttpStatus.BAD_REQUEST);
    }
    if (!amount || typeof amount !== 'number' || amount <= 0) {
      return createErrorResponse('Valid bid amount is required', HttpStatus.BAD_REQUEST);
    }

    // Create the bid using the authenticated userId from NextAuth session
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