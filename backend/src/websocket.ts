import { WebSocketServer, WebSocket } from 'ws';
import { prisma } from './db';

interface DeviceConnection {
  ws: WebSocket;
  deviceId: string;
  lastPing: Date;
}

const connections = new Map<string, DeviceConnection>();

export function setupWebSocket(wss: WebSocketServer) {
  wss.on('connection', (ws, req) => {
    console.log('📡 Nouvelle connexion WebSocket');

    ws.on('message', async (data) => {
      try {
        const message = JSON.parse(data.toString());
        await handleMessage(ws, message);
      } catch (error) {
        console.error('Erreur parsing message:', error);
        ws.send(JSON.stringify({ type: 'error', message: 'Invalid JSON' }));
      }
    });

    ws.on('close', () => {
      // Find and remove the connection
      for (const [id, conn] of connections.entries()) {
        if (conn.ws === ws) {
          connections.delete(id);
          console.log(`🔌 Device ${conn.deviceId} déconnecté`);
          markDeviceOffline(conn.deviceId);
          break;
        }
      }
    });

    ws.on('error', (error) => {
      console.error('WebSocket error:', error);
    });
  });

  // Ping devices periodically to check connection
  setInterval(() => {
    const now = new Date();
    for (const [id, conn] of connections.entries()) {
      const timeSinceLastPing = now.getTime() - conn.lastPing.getTime();
      if (timeSinceLastPing > 60000) {
        // No ping for 60 seconds
        console.log(`⚠️ Device ${conn.deviceId} timeout`);
        conn.ws.close();
        connections.delete(id);
        markDeviceOffline(conn.deviceId);
      }
    }
  }, 30000);
}

async function handleMessage(ws: WebSocket, message: any) {
  const { type, deviceId, ...payload } = message;

  switch (type) {
    case 'register':
      await handleRegister(ws, deviceId, payload);
      break;

    case 'ping':
      handlePing(ws, deviceId);
      break;

    case 'trigger_fired':
      await handleTriggerFired(deviceId, payload);
      break;

    case 'action_executed':
      await handleActionExecuted(deviceId, payload);
      break;

    case 'error':
      await handleDeviceError(deviceId, payload);
      break;

    default:
      ws.send(JSON.stringify({ type: 'error', message: `Unknown message type: ${type}` }));
  }
}

async function handleRegister(ws: WebSocket, deviceId: string, payload: any) {
  const { hostname, ipAddress } = payload;

  // Check if device exists
  const device = await prisma.device.findUnique({ where: { id: deviceId } });
  if (!device) {
    ws.send(JSON.stringify({ type: 'error', message: 'Device not found' }));
    ws.close();
    return;
  }

  // Update device status
  await prisma.device.update({
    where: { id: deviceId },
    data: { isOnline: true, lastSeen: new Date(), hostname, ipAddress },
  });

  // Store connection
  connections.set(deviceId, { ws, deviceId, lastPing: new Date() });

  // Log event
  await prisma.eventLog.create({
    data: {
      deviceId,
      type: 'device_connected',
      message: `Device "${device.name}" connecté`,
      metadata: JSON.stringify({ hostname, ipAddress }),
    },
  });

  // Send config to device
  const config = await getDeviceConfig(deviceId);
  ws.send(JSON.stringify({ type: 'config', config }));

  console.log(`✅ Device ${device.name} (${deviceId}) enregistré`);
}

function handlePing(ws: WebSocket, deviceId: string) {
  const conn = connections.get(deviceId);
  if (conn) {
    conn.lastPing = new Date();
  }
  ws.send(JSON.stringify({ type: 'pong', timestamp: new Date().toISOString() }));
}

async function handleTriggerFired(deviceId: string, payload: any) {
  const { triggerId, triggerName } = payload;

  await prisma.eventLog.create({
    data: {
      deviceId,
      triggerId,
      type: 'trigger_fired',
      message: `Trigger "${triggerName}" déclenché`,
      metadata: JSON.stringify(payload),
    },
  });

  console.log(`🎯 Trigger ${triggerName} fired on device ${deviceId}`);
}

async function handleActionExecuted(deviceId: string, payload: any) {
  const { triggerId, actionId, actionName, success } = payload;

  await prisma.eventLog.create({
    data: {
      deviceId,
      triggerId,
      actionId,
      type: 'action_executed',
      message: `Action "${actionName}" ${success ? 'exécutée' : 'échouée'}`,
      metadata: JSON.stringify(payload),
    },
  });

  console.log(`⚡ Action ${actionName} ${success ? 'executed' : 'failed'} on device ${deviceId}`);
}

async function handleDeviceError(deviceId: string, payload: any) {
  const { error, context } = payload;

  await prisma.eventLog.create({
    data: {
      deviceId,
      type: 'device_error',
      message: `Erreur: ${error}`,
      metadata: JSON.stringify({ error, context }),
    },
  });

  console.error(`❌ Device ${deviceId} error:`, error);
}

async function markDeviceOffline(deviceId: string) {
  try {
    const device = await prisma.device.update({
      where: { id: deviceId },
      data: { isOnline: false },
    });

    await prisma.eventLog.create({
      data: {
        deviceId,
        type: 'device_disconnected',
        message: `Device "${device.name}" déconnecté`,
      },
    });
  } catch (error) {
    console.error('Error marking device offline:', error);
  }
}

async function getDeviceConfig(deviceId: string) {
  const device = await prisma.device.findUnique({
    where: { id: deviceId },
    include: {
      triggers: {
        where: { isEnabled: true },
        include: { actions: { orderBy: { order: 'asc' } } },
      },
    },
  });

  if (!device) return null;

  return {
    deviceId: device.id,
    deviceName: device.name,
    triggers: device.triggers.map((t) => ({
      id: t.id,
      name: t.name,
      type: t.type,
      config: JSON.parse(t.config),
      actions: t.actions.map((a) => ({
        id: a.id,
        name: a.name,
        type: a.type,
        config: JSON.parse(a.config),
        order: a.order,
      })),
    })),
  };
}

// Function to send config update to a specific device
export function sendConfigUpdate(deviceId: string) {
  const conn = connections.get(deviceId);
  if (conn) {
    getDeviceConfig(deviceId).then((config) => {
      conn.ws.send(JSON.stringify({ type: 'config_update', config }));
    });
  }
}

// Function to broadcast to all connected devices
export function broadcast(message: any) {
  const data = JSON.stringify(message);
  for (const conn of connections.values()) {
    conn.ws.send(data);
  }
}

