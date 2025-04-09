import { NextRequest, NextResponse } from 'next/server';
import bidEventEmitter from '@/app/lib/eventEmitter';
import { User } from '@/app/types';

export const dynamic = 'force-dynamic'; // Ensure this route is not statically cached

interface FormattedBid {
  id: string;
  amount: number;
  createdAt: string | Date;
  userId: string;
  gameId: string;
  isWinning: boolean;
  user: User; // Assuming user data is included
}

/**
 * GET /api/bids/stream
 * Establishes a Server-Sent Events connection to stream bid updates.
 * Requires a 'gameId' query parameter.
 */
export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams;
  const gameId = searchParams.get('gameId');

  if (!gameId) {
    return new NextResponse('Missing gameId query parameter', { status: 400 });
  }

  // Create a TransformStream for SSE
  const { readable, writable } = new TransformStream();
  const writer = writable.getWriter();
  const encoder = new TextEncoder();

  const sendEvent = (eventName: string, data: unknown) => {
    const message = `event: ${eventName}\ndata: ${JSON.stringify(data)}\n\n`;
    writer.write(encoder.encode(message));
    console.log(`[SSE] Sent event '${eventName}' for game ${gameId}`);
  };

  // Listener function for new bids specific to this gameId
  const newBidListener = (bidData: FormattedBid) => {
    if (bidData.gameId === gameId) {
      sendEvent('new_bid', bidData);
    }
  };

  // Subscribe to the 'new_bid' event from the emitter
  bidEventEmitter.on('new_bid', newBidListener);
  console.log(`[SSE] Client connected for game ${gameId}`);

  // Keep the connection alive with periodic comments (optional)
  const keepAliveInterval = setInterval(() => {
    writer.write(encoder.encode(': keep-alive\n\n'));
  }, 25000); // Send a comment every 25 seconds

  // Cleanup on client disconnect
  req.signal.addEventListener('abort', () => {
    console.log(`[SSE] Client disconnected for game ${gameId}`);
    bidEventEmitter.off('new_bid', newBidListener);
    clearInterval(keepAliveInterval);
    writer.close();
  });

  // Return the readable stream as the response
  return new NextResponse(readable, {
    status: 200,
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no', // Attempt to disable proxy buffering
    },
  });
} 