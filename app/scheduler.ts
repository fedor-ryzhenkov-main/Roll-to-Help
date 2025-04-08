/**
 * Auction Scheduler
 * 
 * This module sets up a cron job to automatically process ended auctions
 * and notify winners. It runs every minute in the background.
 */

let isSchedulerInitialized = false;

/**
 * Initializes the scheduler to run the auction processing task every minute.
 * This function should only be called ONCE from instrumentation.ts.
 */
export function initializeScheduler(): void {
  // Import node-cron ONLY when the scheduler is initialized
  const cron = require('node-cron'); 
  
  // Prevent multiple initializations (extra safety)
  if (isSchedulerInitialized) {
    console.log('[Scheduler] Already initialized, returning.');
    return;
  }
  isSchedulerInitialized = true;
  
  console.log('🕒 [Scheduler] Initializing auction scheduler...');
  
  // Schedule the task to run every minute
  const task = cron.schedule('* * * * *', async () => {
    console.log(`[${new Date().toISOString()}] Cron Job: Triggered.`);
    
    try {
      // Dynamically import the task function ONLY when the cron job runs
      console.log(`[${new Date().toISOString()}] Cron Job: Dynamically importing processEndedAuctions...`);
      const { processEndedAuctions } = await import('./tasks/notifyWinners');
      console.log(`[${new Date().toISOString()}] Cron Job: Import successful. Executing task...`);
      
      await processEndedAuctions();
      console.log(`[${new Date().toISOString()}] Cron Job: Task execution completed successfully.`);
    } catch (error) {
      console.error(`[${new Date().toISOString()}] Cron Job: Error during scheduled processing:`, error);
    }
  });
  
  // Start the task
  task.start();
  
  console.log('✅ [Scheduler] Auction scheduler initialized and task started.');
}