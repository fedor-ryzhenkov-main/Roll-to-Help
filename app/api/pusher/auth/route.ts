import { NextRequest, NextResponse } from 'next/server';
import { pusherServer } from '@/app/lib/pusher-server';
import { getSessionIdFromCookie } from '@/app/lib/auth'; // Assuming you have a way to get session/user ID

/**
 * Authenticates Pusher subscriptions for private channels.
 * See: https://pusher.com/docs/channels/server_api/authenticating-users/
 */
export async function POST(request: NextRequest) {
  try {
    // 1. Verify the user is authenticated (e.g., via session cookie)
    const sessionId = await getSessionIdFromCookie(request);
    if (!sessionId) {
      console.warn('[Pusher Auth] Denied: User not authenticated.');
      return new NextResponse('Forbidden', { status: 403 });
    }

    // You might want to load the user data based on sessionId if needed for auth logic
    // const user = await getUserBySessionId(sessionId);
    // if (!user) { ... }

    // 2. Get socket_id and channel_name from the request body
    const formData = await request.formData();
    const socketId = formData.get('socket_id') as string;
    const channel = formData.get('channel_name') as string;

    if (!socketId || !channel) {
        console.warn('[Pusher Auth] Denied: Missing socket_id or channel_name.');
        return new NextResponse('Bad Request', { status: 400 });
    }

    // 3. Basic Authorization: Ensure the channel name follows expected pattern
    // For this app, the user should only be able to subscribe to their own channelId channel.
    // We extract the channelId from the channel name (e.g., 'private-xxxx')
    const channelIdPrefix = 'private-';
    if (!channel.startsWith(channelIdPrefix)) {
        console.warn(`[Pusher Auth] Denied: Channel name '${channel}' does not start with '${channelIdPrefix}'.`);
        return new NextResponse('Forbidden', { status: 403 });
    }
    // Note: We don't strictly need to verify the channelId against the user's session here,
    // because the channelId is generated per-login attempt. The important part is that
    // *only authenticated users* can get *any* private channel authorized.
    // If channel names were based on user IDs, you *would* need to verify here.

    // 4. Prepare Pusher authentication data
    // No presence data needed for this use case
    const authData = {
      // user_id: user.id, // Required if using presence channels
      // user_info: { name: user.name }, // Optional extra info
    };

    if (!pusherServer) {
        console.error('[Pusher Auth] Pusher server instance is not available.');
        return new NextResponse('Internal Server Error', { status: 500 });
    }

    // 5. Authorize the subscription
    const authResponse = pusherServer.authorizeChannel(socketId, channel, authData);

    console.log(`[Pusher Auth] Granted: socket_id=${socketId}, channel=${channel}`);

    // 6. Return the authentication signature
    return NextResponse.json(authResponse);

  } catch (error) {
    console.error('[Pusher Auth] Error authorizing channel:', error);
    logApiError('/api/pusher/auth', error); // Assuming logApiError exists
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}

// Helper function (assuming it exists and handles potential errors)
async function logApiError(path: string, error: any) {
    console.error(`API Error at ${path}:`, error);
} 