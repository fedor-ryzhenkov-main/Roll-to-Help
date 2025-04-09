/**
 * Auction Scheduler
 * 
 * This module sets up a cron job to automatically process ended auctions
 * and notify winners. It runs every minute in the background.
 */

import cron from 'node-cron';

let isSchedulerInitialized = false;

/**
 * Initializes the scheduler to run the auction processing task every minute.
 * This function should only be called ONCE from instrumentation.ts.
 */
export function initializeScheduler(): void {
  // Prevent multiple initializations (extra safety)
  if (isSchedulerInitialized) {
    console.log('[Scheduler] Already initialized, returning.');
    return;
  }
  isSchedulerInitialized = true;
  
  console.log('🕒 [Scheduler] Initializing auction scheduler...');
  
  const task = cron.schedule('* * * * *', async () => {
    console.log(`[${new Date().toISOString()}] Cron Job: Triggered.`);
    
    try {
      const { processEndedAuctions } = await import('./tasks/notifyWinners');
      await processEndedAuctions();
    } catch (error) {
      console.error(`[${new Date().toISOString()}] Cron Job: Error during scheduled processing:`, error);
    }
  });
  
  task.start();
  
  console.log('✅ [Scheduler] Auction scheduler initialized and task started.');
}