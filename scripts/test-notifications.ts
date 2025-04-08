/**
 * Test script for auction winner notifications
 * This allows testing the notifications without waiting for actual auctions to end
 */

import { PrismaClient, Game } from '@prisma/client';
import { notifyAuctionWinners } from '../app/services/telegramService';
import dotenv from 'dotenv';

// Load environment variables from .env.local
dotenv.config({ path: '.env.local' });

const prisma = new PrismaClient();

/**
 * Creates a test notification for a specific Telegram user
 * @param telegramId The Telegram user ID to notify
 * @param gameIds Optional array of game IDs to include (defaults to a "test" game if empty)
 */
async function createTestNotification(telegramId: string, gameIds: string[] = []) {
  console.log(`Creating test notification for Telegram ID: ${telegramId}`);
  
  try {
    // Verify the user exists
    const user = await prisma.user.findUnique({
      where: { telegramId },
    });
    
    if (!user) {
      console.error(`❌ User with Telegram ID ${telegramId} not found. Please register the user first.`);
      return;
    }
    
    // If no game IDs provided, create a mock game for testing
    let gamesToNotify: Game[] = [];
    
    if (gameIds.length === 0) {
      // Create a mock game object for testing
      const testGame: any = {
        id: 'test-game-id',
        name: 'Тестовая игра',
        description: 'Это тестовое уведомление для проверки функциональности уведомлений.',
        // Add any other required fields
        bids: [
          {
            userId: user.id,
            isWinning: true,
            amount: 100.00,
          }
        ]
      };
      gamesToNotify.push(testGame);
    } else {
      // Fetch the actual games from the database
      const games = await prisma.game.findMany({
        where: { id: { in: gameIds } },
        include: {
          bids: {
            where: { userId: user.id, isWinning: true },
            select: { amount: true, userId: true, isWinning: true }
          }
        }
      });
      
      if (games.length === 0) {
        console.error('❌ No matching games found with the provided IDs.');
        return;
      }
      
      gamesToNotify = games;
    }
    
    // Create a mock winners map with just this user
    const winnersMap: Record<string, Game[]> = {
      [telegramId]: gamesToNotify
    };
    
    console.log(`Sending test notification for ${gamesToNotify.length} games...`);
    await notifyAuctionWinners(winnersMap);
    console.log('✅ Test notification sent successfully!');
    
  } catch (error) {
    console.error('Error during test notification:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Get the Telegram ID from command line arguments
const telegramId = process.argv[2];
const gameIds = process.argv.slice(3);

if (!telegramId) {
  console.log('Usage: npm run test:notification <telegramId> [gameId1] [gameId2] ...');
  console.log('Example: npm run test:notification 123456789');
  process.exit(1);
}

// Run the test
createTestNotification(telegramId, gameIds)
  .catch(console.error)
  .finally(() => {
    console.log('Test completed');
    process.exit(0);
  }); 