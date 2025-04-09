import { NextRequest } from 'next/server';
import { createErrorResponse, createSuccessResponse, HttpStatus } from '@/app/lib/api-utils';
import { getGameWithBids } from '@/app/lib/utils';

/**
 * GET /api/games/:gameId
 * 
 * Retrieves a game by ID along with its bids and event data
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ gameId: string }> }
) {
  const resolvedParams = await params;
  const { gameId } = resolvedParams;
  
  if (!gameId) {
    return createErrorResponse('Game ID is required', HttpStatus.BAD_REQUEST);
  }
  
  try {
    const game = await getGameWithBids(gameId);
    
    if (!game) {
      return createErrorResponse('Game not found', HttpStatus.NOT_FOUND);
    }
    
    return createSuccessResponse({ game });
  } catch (error) {
    console.error('Error fetching game:', error);
    return createErrorResponse('Failed to fetch game', HttpStatus.INTERNAL_SERVER_ERROR);
  }
} 