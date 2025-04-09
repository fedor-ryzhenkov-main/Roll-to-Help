import { NextRequest } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { createSuccessResponse, createErrorResponse, HttpStatus } from '@/app/lib/api-utils';
import { getWinningBids } from '@/app/services/bidService';
// import { applyRateLimit } from '@/app/lib/api-middleware'; // Commented out - function not found

const prisma = new PrismaClient();

// Define the type for the route context
type RouteContext = {
  params: {
    id: string;
  };
};

/**
 * GET /api/games/[id]/bids/winning
 * Returns all winning bids for a game with anonymous creature names
 * Optionally includes an indicator if a bid belongs to the requesting user (if userId is provided)
 */
export async function GET(
  req: NextRequest,
  context: RouteContext // Use the defined type for context
) {
  try {

    const { id: gameId } = context.params; // Destructure gameId from context.params
    if (!gameId) {
      return createErrorResponse(
        'Game ID is required',
        HttpStatus.BAD_REQUEST
      );
    }
    
    // Get current user ID from a custom header or query param if needed
    // For now, we assume the client handles highlighting based on its own state
    // const userId = req.headers.get('x-user-id') || req.nextUrl.searchParams.get('userId');
    const userId = undefined; // Let client handle highlighting
    
    // Ensure the game exists
    const game = await prisma.game.findUnique({
      where: { id: gameId },
    });
    
    if (!game) {
      return createErrorResponse(
        'Game not found',
        HttpStatus.NOT_FOUND
      );
    }
    
    // Get winning bids for the game (passing undefined for userId)
    const winningBids = await getWinningBids(gameId, userId);
    
    return createSuccessResponse(winningBids);
  } catch (error) {
    console.error('Error getting winning bids:', error);
    return createErrorResponse(
      'Failed to get winning bids',
      HttpStatus.INTERNAL_SERVER_ERROR
    );
  }
} 