/**
 * This function is called once when the server starts.
 * It's the ideal place to initialize background tasks.
 */
export async function register() {
  console.log('[Instrumentation] Registering instrumentation hook...');
  
  // Check if this code is running on the server side (Node.js runtime)
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    console.log('[Instrumentation] Running on Node.js runtime. Dynamically importing and initializing scheduler...');
    try {
      // Dynamically import the initializer function ONLY within the Node.js runtime
      const { initializeScheduler } = await import('./app/scheduler'); // Adjust path if necessary
      initializeScheduler();
      console.log('[Instrumentation] Scheduler initialization triggered successfully.');
    } catch (error) {
      console.error('[Instrumentation] Error during dynamic import or initialization:', error);
    }
  } else {
    console.log(`[Instrumentation] Running on runtime: ${process.env.NEXT_RUNTIME}. Skipping scheduler initialization.`);
  }
} 