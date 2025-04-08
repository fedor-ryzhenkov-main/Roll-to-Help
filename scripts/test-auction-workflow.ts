/**
 * Test script for full auction winner workflow
 * This script tests:
 * 1. Creating a test game with an ended auction
 * 2. Creating winning bids for a specified user
 * 3. Running the winner detection process
 * 4. Sending notifications
 */

import { PrismaClient } from '@prisma/client';
import { processEndedAuctions } from '../app/tasks/notifyWinners';
import { findWinnersForEndedAuctions } from '../app/services/bidService';
import dotenv from 'dotenv';
import { addMinutes, subMinutes } from 'date-fns';

// Load environment variables
dotenv.config({ path: '.env.local' });

const prisma = new PrismaClient();

/**
 * Creates a test game and bids for testing the winner notification workflow
 * @param telegramId Telegram ID of the user to make a winner
 */
async function setupTestAuction(telegramId: string): Promise<string> {
  console.log(`Setting up test auction for user with Telegram ID: ${telegramId}`);
  
  try {
    // Find the user
    const user = await prisma.user.findUnique({
      where: { telegramId },
      select: { id: true, telegramFirstName: true }
    });
    
    if (!user) {
      throw new Error(`User with Telegram ID ${telegramId} not found. Please register the user first.`);
    }
    
    console.log(`Found user: ${user.id} (${user.telegramFirstName || 'No name'})`);
    
    // Calculate the desired end date (30 seconds ago)
    const now = new Date();
    const auctionEndDate = new Date(now.getTime() - 30 * 1000);
    console.log(`Setting event end date to: ${auctionEndDate.toISOString()} (30 seconds ago)`);

    // Find an existing event or create/update a test event with the desired end date
    let event = await prisma.event.findFirst({
      orderBy: { createdAt: 'desc' },
    });
    
    let eventId;
    if (event) {
      console.log(`Using existing event: ${event.id} (${event.name}). Updating its end date...`);
      event = await prisma.event.update({
        where: { id: event.id },
        data: { endDate: auctionEndDate }
      });
      eventId = event.id;
    } else {
      console.log('No existing events found. Creating a test event with the end date...');
      event = await prisma.event.create({
        data: {
          name: 'Тестовое мероприятие',
          description: 'Создано для тестирования',
          location: 'Онлайн',
          eventDate: new Date(Date.now() + 86400000), // 1 day from now
          endDate: auctionEndDate, // Set the end date
        },
      });
      console.log(`Created new test event: ${event.id} with end date ${event.endDate.toISOString()}`);
      eventId = event.id;
    }
    
    // Create a test game associated with the event
    console.log(`Current time: ${now.toISOString()}`);
    // console.log(`Setting auction end date to: ${auctionEndDate.toISOString()} (30 seconds ago)`); // Removed
    // console.log(`Is end date in the past? ${auctionEndDate < now ? 'Yes' : 'No'}`); // Removed
    
    const game = await prisma.game.create({
      data: {
        name: 'Тестовая игра (автоматически созданная)',
        description: 'Эта игра создана для тестирования процесса уведомления победителей.',
        imageUrl: 'https://placehold.co/600x400/EEE/31343C?text=Test+Game',
        system: 'Тестовая система',
        genre: 'Тестовый жанр',
        startingPrice: 10.0,
        totalSeats: 3,
        // auctionEndDate: auctionEndDate, // Removed
        event: {
          connect: { id: eventId }
        }
      },
    });
    
    console.log(`Created test game: ${game.id} linked to event ${eventId}`);
    
    // Create winning bids (createdAt relative to auction end)
    await prisma.bid.create({
      data: {
        userId: user.id,
        gameId: game.id,
        amount: 50.0,
        createdAt: subMinutes(auctionEndDate, 30),
      },
    });
    
    console.log(`Created test bid for user ${user.id} on game ${game.id}`);
    
    return game.id;
  } catch (error) {
    console.error('Error setting up test auction:', error);
    throw error;
  }
}

/**
 * Clean up test data after tests
 * @param gameId ID of the test game to remove
 */
async function cleanupTestData(gameId: string): Promise<void> {
  console.log(`\nCleaning up test data for game: ${gameId}`);
  
  try {
    // Delete bids first (foreign key constraint)
    await prisma.bid.deleteMany({
      where: { gameId },
    });
    
    console.log('Deleted associated bids');
    
    // Delete the game - we don't delete the event as it might be used by other games
    await prisma.game.delete({
      where: { id: gameId },
    });
    
    console.log('Test data cleaned up successfully');
  } catch (error) {
    console.error('Error cleaning up test data:', error);
  }
}

/**
 * Manually test findWinnersForEndedAuctions function
 */
async function testFindWinners(): Promise<void> {
  console.log('\nTesting findWinnersForEndedAuctions function...');
  
  try {
    const winnersMap = await findWinnersForEndedAuctions();
    console.log('Winners found:');
    console.log(JSON.stringify(winnersMap, null, 2));
    
    if (Object.keys(winnersMap).length === 0) {
      console.log('⚠️ No winners found. Make sure there are ended auctions with winners.');
    }
  } catch (error) {
    console.error('Error testing findWinnersForEndedAuctions:', error);
  }
}

/**
 * Run the full process
 */
async function testFullProcess(): Promise<void> {
  console.log('\nTesting full processEndedAuctions workflow...');
  
  try {
    await processEndedAuctions();
    console.log('Process completed. Check your Telegram for notifications.');
  } catch (error) {
    console.error('Error testing processEndedAuctions:', error);
  }
}

/**
 * Main function
 */
async function main(): Promise<void> {
  const telegramId = process.argv[2];
  const skipCleanup = process.argv.includes('--skip-cleanup');
  const onlyRunProcess = process.argv.includes('--only-process');
  
  if (!telegramId && !onlyRunProcess) {
    console.log('Usage: npm run test:workflow <telegramId> [--skip-cleanup] [--only-process]');
    console.log('Example: npm run test:workflow 123456789');
    console.log('Options:');
    console.log('  --skip-cleanup: Skip cleaning up test data');
    console.log('  --only-process: Only run the process without creating test data');
    process.exit(1);
  }
  
  try {
    let gameId: string | undefined;
    
    // Setup test data if not skipping
    if (!onlyRunProcess) {
      // Simplify: always create a new test auction
      gameId = await setupTestAuction(telegramId);
    } 
    
    // Always run the full process now that it calculates winners correctly
    await testFindWinners(); // Still useful to see intermediate state if needed
    await testFullProcess();
    
    // Clean up test data if needed
    if (gameId && !skipCleanup) {
      // Always cleanup the created game if not skipping
      await cleanupTestData(gameId);
    }
    
    console.log('\n✅ Test workflow completed!');
  } catch (error) {
    console.error('\n❌ Test workflow failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch(console.error); 