import { format } from 'date-fns'
import prisma from './db';
import { formatBidderCreatureName } from '@/app/utils/creatureNames';
import { Game, Bid, User } from '@/app/types';

export function formatDate(date: Date): string {
  return format(new Date(date), 'EEEE, MMMM do, yyyy \'at\' h:mm a')
}

/**
 * Fetches a game with its associated bids, including user IDs.
 * Keeps data fetching logic clean and separate from client-side formatting.
 * @param gameId The ID of the game to fetch
 * @returns Game object with raw bids array or null if not found.
 */
export async function getGameWithBids(gameId: string): Promise<(Game & { bids: (Bid & { user: User })[] }) | null> {
  console.log(`Fetching raw game data for gameId: ${gameId}`);
  
  const game = await prisma.game.findUnique({
    where: { id: gameId },
    include: {
      event: true, 
      bids: { 
        orderBy: [
          { amount: 'desc' }, 
          { createdAt: 'asc' } 
        ],
        include: {
          user: { 
            // Select ALL fields required by the User type in app/types.ts
            select: {
              id: true,
              isAdmin: true,
              image: true,
              createdAt: true,
              updatedAt: true,
              telegramId: true,
              telegramUsername: true,
              telegramFirstName: true,
              telegramLastName: true, 
              telegramPhotoUrl: true,
            }
          } 
        }
      }
    }
  });

  if (!game) {
    console.log(`Game with ID ${gameId} not found.`);
    return null; 
  }

  console.log(`Found game: ${game.id}, Name: ${game.name}, Bids count: ${game.bids.length}`);
  
  return game as (Game & { bids: (Bid & { user: User })[] });
}

/**
 * Fetches a game with bids, formatting the bidder names as TTRPG creatures
 * @param gameId The ID of the game to fetch
 * @param currentUserId Optional current user ID to highlight their bids
 * @returns Game with formatted bidder names
 */
export async function getGameWithFormattedBids(gameId: string, currentUserId?: string | null) {
  console.log('Fetching game with currentUserId:', currentUserId);
  
  const game = await prisma.game.findUnique({
    where: { id: gameId },
    include: {
      event: true,
      bids: {
        orderBy: [
          { amount: 'desc' },
          { createdAt: 'asc' }
        ],
        include: {
          user: true // Include all user fields for debugging
        }
      }
    }
  });

  if (!game) return null;

  // Log for debugging
  console.log('Found game:', game.id, game.name);
  console.log('First bid:', game.bids[0] ? {
    id: game.bids[0].id,
    amount: game.bids[0].amount,
    userId: game.bids[0].userId,
    user: game.bids[0].user ? {
      id: game.bids[0].user.id
    } : null
  } : 'No bids');

  // Format bids with creature names
  const formattedBids = game.bids.map(bid => {
    // Get userId from either bid.userId or bid.user.id if available
    // Both might be optional based on the database structure
    const bidUserId = bid.userId || bid.user?.id || 'anonymous';
    
    // Check if this is the current user's bid
    const isBidFromCurrentUser = 
      currentUserId !== undefined && 
      currentUserId !== null && 
      bidUserId === currentUserId;
    
    console.log(`Formatting bid: bidUserId=${bidUserId}, currentUserId=${currentUserId}, isCurrentUser=${isBidFromCurrentUser}`);
    
    return {
      ...bid,
      creatureName: formatBidderCreatureName(bidUserId, isBidFromCurrentUser)
    };
  });

  // Calculate winning bids
  const winningBids = formattedBids
    .slice(0, game.totalSeats)
    .map(bid => ({
      ...bid,
      isWinning: true
    }));

  return {
    ...game,
    bids: formattedBids,
    winningBids,
    currentUserId // Include the currentUserId in the returned object
  };
}

/**
 * Helper function to run code only on the server side in Next.js
 * @param fn Function to execute only on the server
 */
export function nextServerOnly(fn: () => void): void {
  // Only run on the server
  if (typeof window === 'undefined') {
    fn();
  }
} 