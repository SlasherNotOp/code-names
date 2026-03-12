// ============================
// CipherGrid — Server Entry Point
// ============================
import express from 'express';
import cors from 'cors';
import http from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import url from 'url';
import { handleConnection } from './ws/handler';
import { generatePlayerId, signToken } from './auth/jwt';
import { gameStore } from './game/state';
import dotenv from 'dotenv';
dotenv.config();

const PORT = process.env.PORT || 3001;

const app = express();
app.use(cors());
app.use(express.json());

// Health check
app.get('/health', (_req, res) => {
    res.json({
        status: 'ok',
        rooms: gameStore.size,
        uptime: process.uptime(),
    });
});

// Generate anonymous identity
app.post('/auth/anonymous', (_req, res) => {
    const playerId = generatePlayerId();
    const token = signToken(playerId);
    res.json({ playerId, token });
});

// Create HTTP server
const server = http.createServer(app);

// Create WebSocket server
const wss = new WebSocketServer({ server, path: '/ws' });

wss.on('connection', (ws: WebSocket, req) => {
    // Extract token from query string
    const query = url.parse(req.url || '', true).query;
    const token = query.token as string | undefined;

    handleConnection(ws, token);
});

wss.on('error', (error) => {
    console.error('[WSS] Error:', error);
});

// Start server
server.listen(PORT, () => {
    console.log(`
╔════════════════════════════════════════╗
║     🔲 CipherGrid Server Running      ║
║     Port: ${String(PORT).padEnd(28)}║
║     WebSocket: ws://localhost:${String(PORT).padEnd(9)}║
╚════════════════════════════════════════╝
  `);
});
