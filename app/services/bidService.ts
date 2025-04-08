/**
 * Bid Service
 * Handles business logic for bids
 */

import prisma from '@/app/lib/db';
import { PrismaClient, Game, User } from '@prisma/client';
import { formatBidderCreatureName } from '@/app/utils/creatureNames';
import { getCreatureNameForUser } from '@/app/utils/creatureNames';
import { CURRENCY_SYMBOL } from '@/app/config/constants';
import { logApiError } from '@/app/lib/api-utils';

interface CreateBidParams {
  gameId: number;
  amount: number;
  userId: string;
  notes?: string;
}

interface GetWinningBidsParams {
  gameId: number;
  totalSeats?: number;
}

const prismaClient = new PrismaClient();

/**
 * Create a new bid if it passes validation
 */
export async function createBid(
  gameId: string,
  amount: number,
  userId: string
): Promise<{ success: boolean; bid?: any; error?: string }> {
  try {
    // Get the game AND its event to validate bid
    const game = await prisma.game.findUnique({
      where: { id: gameId },
      include: {
        event: true, // Include the associated event
        bids: {
          orderBy: { amount: 'desc' },
          take: 1,
        },
      },
    });

    if (!game) {
      return { success: false, error: `Game with ID ${gameId} not found` };
    }

    // Event should always exist if game exists due to schema relations
    // but add a safety check just in case.
    if (!game.event) {
      return { success: false, error: `Event data missing for game ${gameId}` };
    }

    // Check if the event auction period has ended using the event's end date
    if (game.event.endDate && new Date(game.event.endDate) < new Date()) {
      return { success: false, error: 'The auction period for this event has ended' };
    }

    // Check if event is active
    if (!game.event.isActive) {
      return { success: false, error: 'The event for this game is no longer active' };
    }

    // Create the new bid
    const newBid = await prisma.bid.create({
      data: {
        amount,
        gameId,
        userId,
        isWinning: false, // Initial status, will be updated below
      },
    });

    // Get all bids for this game, ordered by amount
    const allBids = await prisma.bid.findMany({
      where: { gameId },
      orderBy: { amount: 'desc' },
      select: { id: true },
    });

    // Determine winning bid IDs based on available seats
    const winningBidIds = allBids.slice(0, game.totalSeats).map(b => b.id);

    // Update winning bids
    await prisma.bid.updateMany({
      where: { gameId, id: { in: winningBidIds } },
      data: { isWinning: true },
    });

    // Update non-winning bids
    await prisma.bid.updateMany({
      where: { gameId, id: { notIn: winningBidIds } },
      data: { isWinning: false },
    });

    return { success: true, bid: newBid };
  } catch (error) {
    console.error('Error creating bid:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'An error occurred while creating the bid' 
    };
  }
}

/**
 * Get minimum bid amount required for a game
 */
export async function getMinBidAmount(gameId: string): Promise<number> {
  // Get game details, including the increment
  const game = await prisma.game.findUnique({
    where: { id: gameId },
    select: { startingPrice: true, totalSeats: true, minBidIncrement: true },
  });

  if (!game) {
    throw new Error(`Game with ID ${gameId} not found`);
  }

  // Get current bids
  const bids = await prisma.bid.findMany({
    where: { gameId },
    orderBy: { amount: 'desc' },
    take: game.totalSeats,
  });

  // If we don't have enough bids to fill seats, use starting price
  // Otherwise, use the lowest winning bid + game-specific increment
  const minBidAmount = bids.length < game.totalSeats
    ? game.startingPrice
    : bids[bids.length - 1].amount + game.minBidIncrement;

  return minBidAmount;
}

/**
 * Check if a bid amount is valid for a game
 */
export async function validateBidAmount(gameId: string, amount: number): Promise<{ valid: boolean; message?: string }> {
  try {
    // Get game details, including the increment and associated event
    const game = await prisma.game.findUnique({
      where: { id: gameId },
      include: { 
        event: true // Include the event
      },
    });

    if (!game || !game.event) {
      return { valid: false, message: `Game or associated Event with ID ${gameId} not found` };
    }

    // Check if auction period has ended using event's end date
    if (game.event.endDate && new Date(game.event.endDate) < new Date()) {
      return { valid: false, message: `The auction period for this event has ended` };
    }

    // Check against starting bid
    if (amount < game.startingPrice) {
      return {
        valid: false,
        message: `Bid must be at least the starting bid of ${game.startingPrice.toFixed(2)} ${CURRENCY_SYMBOL}`,
      };
    }

    const minBidAmount = await getMinBidAmount(gameId);

    // Use the game's minBidIncrement
    if (amount < minBidAmount) {
      const currentHighestBid = minBidAmount - game.minBidIncrement;
      return {
        valid: false,
        message: `Your bid must be at least ${minBidAmount.toFixed(2)} ${CURRENCY_SYMBOL} (current highest winning bid is ${currentHighestBid.toFixed(2)} ${CURRENCY_SYMBOL})`,
      };
    }

    return { valid: true };
  } catch (error) {
    return { valid: false, message: `Failed to validate bid: ${error instanceof Error ? error.message : String(error)}` };
  }
}

/**
 * Get winning bids for a game with animal names
 * @param gameId ID of the game to get winning bids for
 * @param currentUserId Optional ID of the current user, to mark their bids
 * @returns Array of winning bids with bidder names
 */
export async function getWinningBids(
  gameId: string,
  currentUserId?: string
): Promise<Array<{ amount: number; bidderName: string; isCurrentUser: boolean }>> {
  try {
    // Get the game with winning bids
    const game = await prismaClient.game.findUnique({
      where: { id: gameId },
      include: {
        bids: {
          where: { isWinning: true },
          orderBy: [
            { amount: 'desc' },
            { createdAt: 'asc' },
          ],
          include: {
            user: {
              select: { id: true } 
            },
          },
        },
      },
    });

    if (!game) {
      throw new Error(`Game with ID ${gameId} not found`);
    }

    // Format winning bids with bidder names
    return game.bids.map(bid => {
      const userId = bid.userId; // userId is already selected
      const isCurrentUser = currentUserId ? userId === currentUserId : false;
      
      return {
        amount: bid.amount,
        bidderName: formatBidderCreatureName(userId, isCurrentUser), 
        isCurrentUser,
      };
    });
  } catch (error) {
    console.error('Error getting winning bids:', error);
    return [];
  }
}

/**
 * Calculates and sets the winning bids for a specific game.
 * @param gameId The ID of the game to process.
 */
export async function processAuctionResults(gameId: string): Promise<void> {
  console.log(`Processing auction results for game: ${gameId}`);
  
  try {
    const game = await prisma.game.findUnique({
      where: { id: gameId },
      select: { totalSeats: true, id: true },
    });

    if (!game) {
      console.error(`Game with ID ${gameId} not found during processing.`);
      return;
    }

    // Find all valid bids for this game, ordered by amount descending, then createdAt ascending
    const bids = await prisma.bid.findMany({
      where: {
        gameId: gameId,
        // user: { isVerified: true }, // REMOVED: Check no longer needed
      },
      orderBy: [
        { amount: 'desc' },
        { createdAt: 'asc' },
      ],
      select: { id: true, userId: true },
    });

    // Determine the winning bids (top N bids based on totalSeats)
    const winningBids = bids.slice(0, game.totalSeats);
    const winningBidIds = winningBids.map(bid => bid.id);

    console.log(`Found ${bids.length} bids, marking ${winningBidIds.length} as winning for game ${gameId}.`);

    // Use a transaction to update bids
    await prisma.$transaction(async (tx) => {
      // Mark all bids for this game as NOT winning initially
      await tx.bid.updateMany({
        where: { gameId: gameId },
        data: { isWinning: false },
      });
      
      // Mark the actual winning bids
      if (winningBidIds.length > 0) {
        await tx.bid.updateMany({
          where: {
            id: { in: winningBidIds },
          },
          data: { isWinning: true },
        });
      }
    });
    
    console.log(`Successfully processed auction results for game: ${gameId}`);

  } catch (error) {
    console.error(`Error processing auction results for game ${gameId}:`, error);
    logApiError('process-auction-results', error, { gameId });
    // Do not re-throw, allow the task to continue with other games if possible
  }
}

/**
 * Finds winners for auctions that have just ended *and have winning bids marked*
 * @returns Map of telegramIds to games they won
 */
export async function findWinnersForEndedAuctions(): Promise<Record<string, Game[]>> {
  const now = new Date();
  
  // Find games associated with events that ended recently *and* have winning bids not yet notified
  const recentlyEndedGamesWithWinners = await prisma.game.findMany({
    where: {
      event: {               // Check the associated event
        endDate: {           // Use the event's end date
          lte: now,          // Ended at or before now
        },
      },
      bids: {
        some: {
          isWinning: true,
          notifiedAt: null, // Important: only those not yet notified
        }
      }
    },
    include: {
      event: true, // Include event details if needed later
      bids: {
        where: {
          isWinning: true,
          notifiedAt: null,
          user: {
            telegramId: { not: null }, // Keep this check
          },
        },
        include: {
          user: true, // Include user to get telegramId
        },
        orderBy: { // Ensure consistent ordering if needed
          amount: 'desc' 
        }
      },
    },
  });
  
  // Group winners by Telegram ID
  const winnersMap: Record<string, Game[]> = {};
  
  for (const game of recentlyEndedGamesWithWinners) {
    if (!game.bids || game.bids.length === 0) continue;
    
    for (const bid of game.bids) {
      if (!bid.user?.telegramId) continue;
      const telegramId = bid.user.telegramId;
      if (!winnersMap[telegramId]) {
        winnersMap[telegramId] = [];
      }
      // Avoid adding the same game multiple times if user had multiple winning bids (unlikely)
      if (!winnersMap[telegramId].some(g => g.id === game.id)) {
          winnersMap[telegramId].push(game);
      }
    }
  }
  
  return winnersMap;
}
