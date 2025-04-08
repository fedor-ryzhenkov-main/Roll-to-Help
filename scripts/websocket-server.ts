import { WebSocketServer, WebSocket } from 'ws';
import http from 'http';
import { registerWebSocketClient, unregisterWebSocketClient, sendWebSocketMessage } from '../app/lib/websocket'; // Adjust path

// Define the type to include channelId, matching the one in websocket.ts
interface WebSocketWithId extends WebSocket {
  channelId?: string;
}

const PORT = parseInt(process.env.WS_PORT || '3001', 10);

console.log(`[ws:server] Attempting to start HTTP server for WebSocket on port ${PORT}`);

const server = http.createServer((req, res) => {
  const requestUrl = req.url;
  const requestMethod = req.method;
  console.log(`[ws:http] Received request: ${requestMethod} ${requestUrl}`);

  if (requestUrl === '/health' && requestMethod === 'GET') {
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end('WebSocket Server OK');
    console.log('[ws:http] Responded to /health check');
  } else if (requestUrl === '/send' && requestMethod === 'POST') {
    console.log('[ws:http] Received POST request on /send');
    let body = '';
    req.on('data', chunk => { 
      body += chunk.toString(); 
      console.log(`[ws:http:/send] Received data chunk (length: ${chunk.length})`);
    });
    req.on('end', () => {
      console.log(`[ws:http:/send] Request body received: ${body.substring(0, 200)}...`);
      try {
        const { channelId, message } = JSON.parse(body);
        if (!channelId || !message) {
          console.error('[ws:http:/send] Bad Request: Missing channelId or message in body');
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Missing channelId or message' }));
          return;
        }

        console.log(`[ws:http:/send] Parsed request. Calling sendWebSocketMessage for channelId: ${channelId}`);
        const success = sendWebSocketMessage(channelId, message);
        
        if (success) {
            console.log(`[ws:http:/send] sendWebSocketMessage successful for channelId: ${channelId}. Responding 200.`);
        } else {
            console.warn(`[ws:http:/send] sendWebSocketMessage failed for channelId: ${channelId}. Responding 500.`);
        }
        
        res.writeHead(success ? 200 : 500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success }));
      } catch (error: any) {
        console.error(`[ws:http:/send] Error processing /send request: ${error.message}`, error);
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Invalid JSON body or processing error' }));
      }
    });
    req.on('error', (err) => {
        console.error('[ws:http:/send] Request stream error:', err);
        res.writeHead(500); // Internal Server Error on stream issue
        res.end();
    });
  } else {
    console.warn(`[ws:http] Responding 404 for unknown request: ${requestMethod} ${requestUrl}`);
    res.writeHead(404);
    res.end();
  }
});

const wss = new WebSocketServer({ server });

wss.on('listening', () => {
  console.log(`[ws:server] WebSocket server is listening on port ${PORT}`);
});

wss.on('error', (error) => {
  console.error('[ws:server] WebSocketServer error:', error);
});

wss.on('connection', (ws: WebSocketWithId, req) => {
  const remoteAddress = req.socket.remoteAddress || 'Unknown IP';
  console.log(`[ws:server] Client attempting connection from ${remoteAddress}`);

  // Handle registration via message from client (assuming client sends { type: 'register', channelId: '...' })
  ws.on('message', (data) => {
    try {
      const message = JSON.parse(data.toString());
      console.log(`[ws:server] Received message from ${remoteAddress}. Type: ${message?.type}, ChannelId: ${message?.channelId}`);
      if (message.type === 'register' && message.channelId) {
        // Register this client with its channelId
        registerWebSocketClient(message.channelId, ws);
        // Send confirmation back to client
        ws.send(JSON.stringify({ type: 'registered', channelId: message.channelId }));
      } else {
        console.warn(`[ws:server] Received unknown message type or format from ${remoteAddress}: ${data.toString().substring(0,100)}...`);
      }
    } catch (error: any) {
      console.error(`[ws:server] Error parsing message from ${remoteAddress}: ${error.message}. Data: ${data.toString().substring(0, 100)}...`);
      // Optionally close connection on bad message format
      // ws.close(1003, 'Invalid message format');
    }
  });

  ws.on('close', (code, reason) => {
    const channelId = ws.channelId || 'UNKNOWN'; // Use attached channelId if available
    const reasonString = reason.toString('utf-8'); // Decode reason buffer
    console.log(`[ws:server] Client disconnected. ChannelId: ${channelId}, Code: ${code}, Reason: ${reasonString}, Remote: ${remoteAddress}`);
    if (ws.channelId) {
      unregisterWebSocketClient(ws.channelId);
    }
  });

  ws.on('error', (error) => {
    const channelId = ws.channelId || 'UNKNOWN';
    console.error(`[ws:server] WebSocket error for client. ChannelId: ${channelId}, Error: ${error.message}, Remote: ${remoteAddress}`, error);
    // Attempt to unregister if we know the channelId and close
    if (ws.channelId) {
      unregisterWebSocketClient(ws.channelId);
    }
    ws.terminate(); // Force close on error
  });
});

server.listen(PORT, () => {
  console.log(`[ws:http] HTTP server started and listening on port ${PORT}`);
});

// Graceful shutdown handling
const shutdown = (signal: string) => {
  console.log(`[ws:server] Received ${signal}. Shutting down gracefully...`);
  wss.close((err) => {
    if (err) {
      console.error('[ws:server] Error closing WebSocketServer:', err);
    }
    console.log('[ws:server] WebSocketServer closed.');
    server.close(() => {
      console.log('[ws:http] HTTP server closed.');
      process.exit(0);
    });
  });

  // Force shutdown after timeout
  setTimeout(() => {
    console.error('[ws:server] Could not close connections in time, forcefully shutting down');
    process.exit(1);
  }, 10000); // 10 seconds timeout
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT')); 