import { processEndedAuctions } from '../app/tasks/notifyWinners'; 

/**
 * Main function to run scheduled tasks
 * Executes all registered tasks and handles errors
 */
async function main() {
  console.log('Running scheduled tasks...');
  try {
    // Add more tasks here if needed
    await processEndedAuctions();
    console.log('Scheduled tasks completed.');
  } catch (error) {
    console.error('Error running scheduled tasks:', error);
    process.exit(1);
  } finally {
    console.log('Finished task runner.');
  }
}

main(); 