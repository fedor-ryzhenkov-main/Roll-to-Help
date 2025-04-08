import { WebSocket } from 'ws';

// Extend WebSocket type locally to allow adding channelId
interface WebSocketWithId extends WebSocket {
  channelId?: string;
}

// Map to store active WebSocket connections by channelId
const webSocketClients = new Map<string, WebSocketWithId>();

/**
 * Registers a WebSocket client connection associated with a channelId.
 * @param channelId The unique ID for the client's channel.
 * @param ws The WebSocket client instance.
 */
export function registerWebSocketClient(channelId: string, ws: WebSocketWithId) {
  ws.channelId = channelId; // Attach channelId for later reference
  webSocketClients.set(channelId, ws);
  console.log(`[ws:lib] WebSocket registered. ChannelId: ${channelId}, Total Clients: ${webSocketClients.size}`);
}

/**
 * Unregisters a WebSocket client connection.
 * @param channelId The unique ID for the client's channel.
 */
export function unregisterWebSocketClient(channelId: string) {
  if (webSocketClients.has(channelId)) {
      webSocketClients.delete(channelId);
      console.log(`[ws:lib] WebSocket unregistered. ChannelId: ${channelId}, Remaining Clients: ${webSocketClients.size}`);
  } else {
      console.warn(`[ws:lib] Attempted to unregister non-existent channelId: ${channelId}`);
  }
}

/**
 * Sends a message to a specific client via WebSocket.
 * @param channelId The unique ID of the target client's channel.
 * @param message The message object to send (will be JSON.stringify'd).
 * @returns True if the message was sent, false otherwise.
 */
export function sendWebSocketMessage(channelId: string, message: object): boolean {
  console.log(`[ws:lib] Attempting to send message to channelId: ${channelId}. Current client keys: [${Array.from(webSocketClients.keys()).join(', ')}]`);
  const client = webSocketClients.get(channelId);

  if (client) {
    console.log(`[ws:lib] Client found for channelId: ${channelId}. ReadyState: ${client.readyState}`);
    if (client.readyState === WebSocket.OPEN) {
      try {
        const messageString = JSON.stringify(message);
        client.send(messageString);
        console.log(`[ws:lib] Successfully sent WebSocket message to channelId: ${channelId}. Message: ${messageString.substring(0, 100)}...`);
        return true;
      } catch (error) {
          console.error(`[ws:lib] Failed to send WebSocket message to channelId ${channelId}:`, error);
          // Attempt to clean up potentially broken client
          unregisterWebSocketClient(channelId);
          client.terminate(); // Force close the connection
          return false;
      }
    } else {
        console.warn(`[ws:lib] WebSocket client found for channelId ${channelId}, but not open (state: ${client.readyState}). Unregistering.`);
        // Client exists but is closing or closed, remove it
        unregisterWebSocketClient(channelId);
        return false;
    }
  } else {
    console.warn(`[ws:lib] WebSocket client *not found* for channelId: ${channelId}`);
    return false;
  }
} 