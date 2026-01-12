import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../db';

export const deviceRouter = Router();

const createDeviceSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  hostname: z.string().optional(),
  ipAddress: z.string().optional(),
  groupId: z.string().uuid().optional().nullable(),
});

const updateDeviceSchema = createDeviceSchema.partial();

// GET all devices
deviceRouter.get('/', async (_, res) => {
  try {
    const devices = await prisma.device.findMany({
      include: { group: true, triggers: { include: { actions: true } } },
      orderBy: { createdAt: 'desc' },
    });
    res.json(devices);
  } catch (error) {
    res.status(500).json({ error: 'Erreur lors de la récupération des devices' });
  }
});

// GET device by ID
deviceRouter.get('/:id', async (req, res) => {
  try {
    const device = await prisma.device.findUnique({
      where: { id: req.params.id },
      include: { group: true, triggers: { include: { actions: true } } },
    });
    if (!device) {
      return res.status(404).json({ error: 'Device non trouvé' });
    }
    res.json(device);
  } catch (error) {
    res.status(500).json({ error: 'Erreur lors de la récupération du device' });
  }
});

// GET device configuration (for RPI client)
deviceRouter.get('/:id/config', async (req, res) => {
  try {
    const device = await prisma.device.findUnique({
      where: { id: req.params.id },
      include: {
        triggers: {
          where: { isEnabled: true },
          include: { actions: { orderBy: { order: 'asc' } } },
        },
      },
    });
    if (!device) {
      return res.status(404).json({ error: 'Device non trouvé' });
    }
    
    // Parse JSON configs
    const config = {
      deviceId: device.id,
      deviceName: device.name,
      triggers: device.triggers.map(t => ({
        id: t.id,
        name: t.name,
        type: t.type,
        config: JSON.parse(t.config),
        actions: t.actions.map(a => ({
          id: a.id,
          name: a.name,
          type: a.type,
          config: JSON.parse(a.config),
          order: a.order,
        })),
      })),
    };
    
    res.json(config);
  } catch (error) {
    res.status(500).json({ error: 'Erreur lors de la récupération de la config' });
  }
});

// POST create device
deviceRouter.post('/', async (req, res) => {
  try {
    const data = createDeviceSchema.parse(req.body);
    const device = await prisma.device.create({
      data,
      include: { group: true },
    });
    res.status(201).json(device);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors });
    }
    res.status(500).json({ error: 'Erreur lors de la création du device' });
  }
});

// PUT update device
deviceRouter.put('/:id', async (req, res) => {
  try {
    const data = updateDeviceSchema.parse(req.body);
    const device = await prisma.device.update({
      where: { id: req.params.id },
      data,
      include: { group: true },
    });
    res.json(device);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors });
    }
    res.status(500).json({ error: 'Erreur lors de la mise à jour du device' });
  }
});

// DELETE device
deviceRouter.delete('/:id', async (req, res) => {
  try {
    await prisma.device.delete({ where: { id: req.params.id } });
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: 'Erreur lors de la suppression du device' });
  }
});

// POST update device status (for RPI client heartbeat)
deviceRouter.post('/:id/heartbeat', async (req, res) => {
  try {
    const { hostname, ipAddress } = req.body;
    const device = await prisma.device.update({
      where: { id: req.params.id },
      data: {
        isOnline: true,
        lastSeen: new Date(),
        ...(hostname && { hostname }),
        ...(ipAddress && { ipAddress }),
      },
    });
    res.json({ status: 'ok', device });
  } catch (error) {
    res.status(500).json({ error: 'Erreur lors du heartbeat' });
  }
});

