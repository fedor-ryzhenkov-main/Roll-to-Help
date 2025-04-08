import { WebSocketServer, WebSocket } from 'ws';
import http from 'http';
import { registerWebSocketClient, unregisterWebSocketClient, sendWebSocketMessage } from '../app/lib/websocket'; // Adjust path

const PORT = parseInt(process.env.WS_PORT || '3001', 10);


const server = http.createServer((req, res) => {
  if (req.url === '/health' && req.method === 'GET') {
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end('WebSocket Server OK');
  } else if (req.url === '/send' && req.method === 'POST') {
    // Endpoint for API routes to trigger WS messages
    let body = '';
    req.on('data', chunk => { body += chunk.toString(); });
    req.on('end', () => {
      try {
        const { channelId, message } = JSON.parse(body);
        if (!channelId || !message) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Missing channelId or message' }));
          return;
        }
        
        const success = sendWebSocketMessage(channelId, message);
        
        res.writeHead(success ? 200 : 500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success }));
      } catch (error) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Invalid JSON body' }));
      }
    });
  } else {
    res.writeHead(404);
    res.end();
  }
});

const wss = new WebSocketServer({ server });

wss.on('connection', (ws, req) => {
  console.log('[WS Server] Client connected');
  let channelId: string | null = null; 

  ws.on('message', (message) => {
    try {
      const data = JSON.parse(message.toString());
      if (data.type === 'register' && data.channelId) {
        channelId = data.channelId;
        if (typeof channelId === 'string') { 
          registerWebSocketClient(channelId, ws);
          // Confirmation sent by registerWebSocketClient now if needed 
          // or send one here:
          ws.send(JSON.stringify({ type: 'registered', channelId }));
        } else {
           console.error('[WS Server] Invalid channelId received during registration:', channelId);
           // Optionally close the connection or send an error message
           ws.send(JSON.stringify({ type: 'error', error: 'Invalid registration request' }));
           ws.close();
        }
      } else {
        console.log('[WS Server] Received unknown WebSocket message:', data);
      }
    } catch (error) {
      console.error('[WS Server] Failed to parse WebSocket message or invalid message format:', error);
    }
  });

  ws.on('close', () => {
    console.log('[WS Server] Client disconnected');
    if (channelId) {
      unregisterWebSocketClient(channelId);
    }
  });

  ws.on('error', (error) => {
    console.error('[WS Server] WebSocket error:', error);
    if (channelId) {
      unregisterWebSocketClient(channelId);
    }
  });
});

server.listen(PORT, () => {
  console.log(`✅ WebSocket server initialized and listening on port ${PORT}`);
});

console.log('Starting WebSocket server...'); 