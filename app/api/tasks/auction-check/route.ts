import { NextRequest, NextResponse } from 'next/server';
import { processEndedAuctions } from '@/app/tasks/notifyWinners';
import { logApiError } from '@/app/lib/api-utils';

/**
 * API route to process ended auctions and notify winners
 * This endpoint can be called by a cron job or manually for testing.
 * 
 * @route GET /api/tasks/auction-check?secret=YOUR_SECRET
 * @security Requires a valid secret token except in development
 * @returns {object} JSON response with success status and processed count
 */
export async function GET(request: NextRequest) {
  try {
    // Simple security check to prevent unauthorized access
    const secretToken = process.env.TASKS_SECRET_TOKEN;
    const requestSecret = request.nextUrl.searchParams.get('secret');
    
    // In development, allow without secret
    const isDev = process.env.NODE_ENV === 'development';
    if (!isDev && (!secretToken || secretToken !== requestSecret)) {
      console.error(`[${new Date().toISOString()}] ⚠️ Unauthorized attempt to access auction check task from ${request.ip || 'unknown IP'}`);
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }
    
    console.log(`[${new Date().toISOString()}] 🚀 Starting auction check task...`);
    
    // Run the auction processing task
    const processedCount = await processEndedAuctions();
    
    console.log(`[${new Date().toISOString()}] ✅ Auction check task completed successfully. Processed ${processedCount} auctions.`);
    return NextResponse.json({ 
      success: true, 
      processed: processedCount,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error(`[${new Date().toISOString()}] ❌ Error in auction check task:`, error);
    logApiError('auction-check-task', error);
    
    return NextResponse.json({ 
      success: false, 
      error: "An error occurred while processing auctions", 
      message: errorMessage
    }, { status: 500 });
  }
} 