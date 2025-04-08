import { processEndedAuctions } from '../app/tasks/notifyWinners.ts'; // Adjust path

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
    // Optional: Disconnect Prisma if the task uses it and doesn't disconnect itself
    // await prisma.$disconnect(); 
    console.log('Finished task runner.');
  }
}

main(); 