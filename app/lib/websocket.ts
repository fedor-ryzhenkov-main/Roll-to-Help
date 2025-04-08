import { WebSocket } from 'ws';

// Map to store active WebSocket connections by channelId
const webSocketClients = new Map<string, WebSocket>();

/**
 * Registers a WebSocket client connection associated with a channelId.
 * @param channelId The unique ID for the client's channel.
 * @param ws The WebSocket client instance.
 */
export function registerWebSocketClient(channelId: string, ws: WebSocket) {
  webSocketClients.set(channelId, ws);
  console.log(`WebSocket registered for channelId: ${channelId}`);
}

/**
 * Unregisters a WebSocket client connection.
 * @param channelId The unique ID for the client's channel.
 */
export function unregisterWebSocketClient(channelId: string) {
  if (webSocketClients.has(channelId)) {
      webSocketClients.delete(channelId);
      console.log(`WebSocket unregistered for channelId: ${channelId}`);
  }
}

/**
 * Sends a message to a specific client via WebSocket.
 * @param channelId The unique ID of the target client's channel.
 * @param message The message object to send (will be JSON.stringify'd).
 * @returns True if the message was sent, false otherwise.
 */
export function sendWebSocketMessage(channelId: string, message: object): boolean {
  const client = webSocketClients.get(channelId);
  if (client && client.readyState === WebSocket.OPEN) {
    try {
      client.send(JSON.stringify(message));
      console.log(`Sent WebSocket message to channelId: ${channelId}`);
      return true;
    } catch (error) {
        console.error(`Failed to send WebSocket message to channelId ${channelId}:`, error);
        return false;
    }
  } else {
    console.log(`WebSocket client not found or not open for channelId: ${channelId}`);
    return false;
  }
} 