import PusherServer from 'pusher';

const appId = process.env.PUSHER_APP_ID;
const key = process.env.PUSHER_KEY;
const secret = process.env.PUSHER_SECRET;
const cluster = process.env.PUSHER_CLUSTER;

if (!appId || !key || !secret || !cluster) {
  console.error('Error: Pusher server environment variables (PUSHER_APP_ID, PUSHER_KEY, PUSHER_SECRET, PUSHER_CLUSTER) are not fully defined.');
  // Depending on usage, you might throw an error here
}

// Initialize Pusher Server SDK
// Ensure keys are defined before creating instance
let pusherServerInstance: PusherServer | null = null;

if (appId && key && secret && cluster) {
  pusherServerInstance = new PusherServer({
    appId: appId,
    key: key,
    secret: secret,
    cluster: cluster,
    useTLS: true, // Always use TLS
  });
} else {
    console.error('Pusher server SDK could not be initialized due to missing environment variables.');
}

export const pusherServer = pusherServerInstance; 