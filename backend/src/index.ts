import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { WebSocketServer } from 'ws';
import { deviceRouter } from './routes/devices';
import { groupRouter } from './routes/groups';
import { triggerRouter } from './routes/triggers';
import { actionRouter } from './routes/actions';
import { eventLogRouter } from './routes/eventLogs';
import { setupWebSocket } from './websocket';
import { prisma } from './db';

const app = express();
const server = createServer(app);
const wss = new WebSocketServer({ server });

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/devices', deviceRouter);
app.use('/api/groups', groupRouter);
app.use('/api/triggers', triggerRouter);
app.use('/api/actions', actionRouter);
app.use('/api/events', eventLogRouter);

// Health check
app.get('/api/health', (_, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// WebSocket setup
setupWebSocket(wss);

const PORT = process.env.PORT || 3001;

server.listen(PORT, () => {
  console.log(`🚀 Backend démarré sur http://localhost:${PORT}`);
  console.log(`📡 WebSocket actif sur ws://localhost:${PORT}`);
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  await prisma.$disconnect();
  process.exit(0);
});

