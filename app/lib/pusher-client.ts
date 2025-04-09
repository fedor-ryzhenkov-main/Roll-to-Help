import PusherClient from 'pusher-js';

const pusherKey = process.env.NEXT_PUBLIC_PUSHER_KEY;
const pusherCluster = process.env.NEXT_PUBLIC_PUSHER_CLUSTER;

if (!pusherKey) {
  console.error('Error: NEXT_PUBLIC_PUSHER_KEY is not defined in environment variables.');
  // You might want to throw an error or return a dummy object depending on how critical Pusher is
}
if (!pusherCluster) {
  console.error('Error: NEXT_PUBLIC_PUSHER_CLUSTER is not defined in environment variables.');
}

// Ensure Pusher is only initialized client-side
let pusherClientInstance: PusherClient | null = null;

export const getPusherClient = (): PusherClient => {
  if (typeof window === 'undefined') {
    // Return a dummy or throw error if called server-side inappropriately
    // For this use case, returning a basic object might prevent crashes in SSR
    // but it won't function. Proper usage should be client-side only.
    console.warn('Pusher client should only be initialized on the client-side.');
    return {} as PusherClient; // Return dummy to avoid hard crash
  }

  if (!pusherClientInstance && pusherKey && pusherCluster) {
    pusherClientInstance = new PusherClient(pusherKey, {
      cluster: pusherCluster,
      authEndpoint: '/api/pusher/auth',
      authTransport: 'ajax',
      // You can add other options like encrypted: true if needed
    });

    // Optional: Add basic logging for connection state changes
    pusherClientInstance.connection.bind('connected', () => {
      console.log('[Pusher Client] Connected');
    });
    pusherClientInstance.connection.bind('disconnected', () => {
      console.log('[Pusher Client] Disconnected');
    });
    pusherClientInstance.connection.bind('error', (err: any) => {
      console.error('[Pusher Client] Connection Error:', err?.error?.data?.message || err);
    });

  } else if (!pusherKey || !pusherCluster) {
     console.error('Cannot initialize Pusher client: Missing key or cluster.');
     return {} as PusherClient; // Return dummy
  }

  return pusherClientInstance!;
}; 