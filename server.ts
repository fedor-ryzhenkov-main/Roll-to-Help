import { createServer } from 'http';
import { parse } from 'url';
import next from 'next';
import { WebSocketServer, WebSocket } from 'ws';

const dev = process.env.NODE_ENV !== 'production';
const hostname = 'localhost'; // Standard for custom server
const port = parseInt(process.env.PORT || '8080', 10); // Use PORT env var, default 8080

// Initialize Next.js app
const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

// Prepare the Next.js app
app.prepare().then(() => {
  // Create HTTP server
  const server = createServer(async (req, res) => {
    try {
      const parsedUrl = parse(req.url!, true);
      const { pathname, query } = parsedUrl;

      // Let Next.js handle most requests
      await handle(req, res, parsedUrl);

    } catch (err) {
      console.error('[Custom Server] Error handling request:', err);
      res.statusCode = 500;
      res.end('Internal Server Error');
    }
  });

  // Create WebSocket server and attach it to the HTTP server
  const wss = new WebSocketServer({ noServer: true }); // Use noServer to handle upgrade manually

  // --- WebSocket Logic (Adapted from websocket.ts and websocket-server.ts) ---

  // Map to store active WebSocket connections by channelId
  const webSocketClients = new Map<string, WebSocketWithId>();

  interface WebSocketWithId extends WebSocket {
    channelId?: string;
  }

  function registerLocalClient(channelId: string, ws: WebSocketWithId) {
    ws.channelId = channelId;
    webSocketClients.set(channelId, ws);
    console.log(`[ws:local] WebSocket registered. ChannelId: ${channelId}, Total Clients: ${webSocketClients.size}`);
  }

  function unregisterLocalClient(channelId: string) {
    if (webSocketClients.has(channelId)) {
        webSocketClients.delete(channelId);
        console.log(`[ws:local] WebSocket unregistered. ChannelId: ${channelId}, Remaining Clients: ${webSocketClients.size}`);
    } else {
        console.warn(`[ws:local] Attempted to unregister non-existent channelId: ${channelId}`);
    }
  }

  // This function will be called by the API route later
  // (We remove the HTTP /send endpoint logic from here)
  global.sendWsMessage = (channelId: string, message: object): boolean => {
    console.log(`[ws:local] Attempting to send message via global function to channelId: ${channelId}. Current client keys: [${Array.from(webSocketClients.keys()).join(', ')}]`);
    const client = webSocketClients.get(channelId);
    if (client) {
      console.log(`[ws:local] Client found for channelId: ${channelId}. ReadyState: ${client.readyState}`);
      if (client.readyState === WebSocket.OPEN) {
        try {
          const messageString = JSON.stringify(message);
          client.send(messageString);
          console.log(`[ws:local] Successfully sent WebSocket message to channelId: ${channelId}. Message: ${messageString.substring(0, 100)}...`);
          return true;
        } catch (error) {
            console.error(`[ws:local] Failed to send WebSocket message to channelId ${channelId}:`, error);
            unregisterLocalClient(channelId); // Use local unregister
            client.terminate();
            return false;
        }
      } else {
          console.warn(`[ws:local] WebSocket client found for channelId ${channelId}, but not open (state: ${client.readyState}). Unregistering.`);
          unregisterLocalClient(channelId); // Use local unregister
          return false;
      }
    } else {
      console.warn(`[ws:local] WebSocket client *not found* for channelId: ${channelId}`);
      return false;
    }
  };

  // Handle WebSocket upgrade requests
  server.on('upgrade', (request, socket, head) => {
    // You might want to add authentication/validation here based on the request URL or headers
    const { pathname } = parse(request.url!, true);
    console.log(`[Custom Server] Received upgrade request for path: ${pathname}`);

    // Allow connections on the root path (or specific path like /ws if preferred)
    if (pathname === '/' || pathname === '/ws') { // Adjust path as needed
      wss.handleUpgrade(request, socket, head, (ws) => {
        console.log('[Custom Server] WebSocket upgrade successful, emitting connection.');
        wss.emit('connection', ws, request);
      });
    } else {
      console.log('[Custom Server] Rejecting upgrade request for invalid path.');
      socket.destroy();
    }
  });

  // Handle new WebSocket connections
  wss.on('connection', (ws: WebSocketWithId, req) => {
    const remoteAddress = req.socket.remoteAddress || 'Unknown IP';
    console.log(`[ws:local] Client attempting connection from ${remoteAddress}`);

    ws.on('message', (data) => {
      try {
        const message = JSON.parse(data.toString());
        console.log(`[ws:local] Received message from ${remoteAddress}. Type: ${message?.type}, ChannelId: ${message?.channelId}`);
        if (message.type === 'register' && message.channelId) {
          registerLocalClient(message.channelId, ws); // Use local register
          ws.send(JSON.stringify({ type: 'registered', channelId: message.channelId }));
        } else {
          console.warn(`[ws:local] Received unknown message type or format from ${remoteAddress}: ${data.toString().substring(0,100)}...`);
        }
      } catch (error: any) {
        console.error(`[ws:local] Error parsing message from ${remoteAddress}: ${error.message}. Data: ${data.toString().substring(0, 100)}...`);
      }
    });

    ws.on('close', (code, reason) => {
      const channelId = ws.channelId || 'UNKNOWN';
      const reasonString = reason.toString('utf-8');
      console.log(`[ws:local] Client disconnected. ChannelId: ${channelId}, Code: ${code}, Reason: ${reasonString}, Remote: ${remoteAddress}`);
      if (ws.channelId) {
        unregisterLocalClient(ws.channelId); 
      }
    });

    ws.on('error', (error) => {
      const channelId = ws.channelId || 'UNKNOWN';
      console.error(`[ws:local] WebSocket error for client. ChannelId: ${channelId}, Error: ${error.message}, Remote: ${remoteAddress}`, error);
      if (ws.channelId) {
        unregisterLocalClient(ws.channelId); 
      }
      ws.terminate();
    });
  });

  // Start listening
  server.listen(port, () => {
    console.log(`[Custom Server] Ready on http://${hostname}:${port}`);
  });

  // Graceful shutdown
  const shutdown = (signal: string) => {
    console.log(`[Custom Server] Received ${signal}. Shutting down gracefully...`);
    wss.close((err) => {
      if (err) {
        console.error('[Custom Server] Error closing WebSocketServer:', err);
      }
      console.log('[Custom Server] WebSocketServer closed.');
      server.close(() => {
        console.log('[Custom Server] HTTP server closed.');
        app.close().then(() => { 
          console.log('[Custom Server] Next.js app closed.');
          process.exit(0);
        }).catch((closeErr) => {
          console.error('[Custom Server] Error closing Next.js app:', closeErr);
          process.exit(1);
        });
      });
    });

    setTimeout(() => {
      console.error('[Custom Server] Could not close connections in time, forcefully shutting down');
      process.exit(1);
    }, 15000); 
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));

}).catch((err) => {
  console.error('[Custom Server] Error during app preparation:', err);
  process.exit(1);
});

// Add global declaration for the send function
declare global {
  var sendWsMessage: (channelId: string, message: object) => boolean;
} 