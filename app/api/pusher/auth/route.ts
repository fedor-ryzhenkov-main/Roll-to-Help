import { NextRequest, NextResponse } from 'next/server';
import { pusherServer } from '@/app/lib/pusher-server';
import { getServerSession } from 'next-auth/next'; // Import next-auth session getter
import { authOptions } from '@/app/api/auth/[...nextauth]/options'; // Import auth options

/**
 * Authenticates Pusher subscriptions for private channels using NextAuth session.
 * See: https://pusher.com/docs/channels/server_api/authenticating-users/
 */
export async function POST(request: NextRequest) {
  try {
    // 1. Verify the user is authenticated using NextAuth session
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      console.warn('[Pusher Auth] Denied: User not authenticated (No NextAuth session).');
      return new NextResponse('Forbidden', { status: 403 });
    }

    // User is authenticated, get their ID from the session
    // @ts-expect-error - we have added sub field to session.user in our NextAuth config
    const userId = session.user.sub;
    console.log(`[Pusher Auth] User authenticated: ${userId}`);

    // 2. Get socket_id and channel_name from the request body
    const formData = await request.formData();
    const socketId = formData.get('socket_id') as string;
    const channel = formData.get('channel_name') as string;

    if (!socketId || !channel) {
        console.warn('[Pusher Auth] Denied: Missing socket_id or channel_name.');
        return new NextResponse('Bad Request', { status: 400 });
    }

    // 3. Basic Authorization: Ensure channel starts with 'private-'
    const channelIdPrefix = 'private-';
    if (!channel.startsWith(channelIdPrefix)) {
        console.warn(`[Pusher Auth] Denied: Channel name '${channel}' does not start with '${channelIdPrefix}'.`);
        return new NextResponse('Forbidden', { status: 403 });
    }
    // As noted before, we don't need to strictly match the channelId part to the user
    // for this specific login flow, just ensure they are logged in.

    // 4. Prepare Pusher authentication data, including user_id for presence channels
    const authData = {
      user_id: userId,
      user_info: { // Optional: Add user info if needed by presence channels
        name: session.user.telegramFirstName || session.user.telegramUsername || userId,
        // Add other relevant info from session.user if needed
      },
    };

    if (!pusherServer) {
        console.error('[Pusher Auth] Pusher server instance is not available.');
        return new NextResponse('Internal Server Error', { status: 500 });
    }

    // 5. Authorize the subscription
    const authResponse = pusherServer.authorizeChannel(socketId, channel, authData);

    console.log(`[Pusher Auth] Granted: socket_id=${socketId}, channel=${channel}, user_id=${userId}`);

    // 6. Return the authentication signature
    return NextResponse.json(authResponse);

  } catch (error) {
    console.error('[Pusher Auth] Error authorizing channel:', error);
    logApiError('/api/pusher/auth', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}

// Helper function (assuming it exists and handles potential errors)
// Explicitly type error as unknown for better handling
async function logApiError(path: string, error: unknown) {
    console.error(`API Error at ${path}:`, error instanceof Error ? error.message : error);
} 