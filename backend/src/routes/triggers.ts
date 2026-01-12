import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../db';
import { fireTriggerOnDevice, isDeviceConnected } from '../websocket';

export const triggerRouter = Router();

const gpioInputConfigSchema = z.object({
  pin: z.number().min(0).max(40),
  edge: z.enum(['rising', 'falling', 'both']).default('rising'),
  pull: z.enum(['up', 'down', 'none']).default('up'),
  debounce: z.number().min(0).default(50),
});

const scheduleConfigSchema = z.object({
  cron: z.string(), // Cron expression
  timezone: z.string().default('Europe/Paris'),
});

const apiCallConfigSchema = z.object({
  method: z.enum(['GET', 'POST']).default('POST'),
  secret: z.string().optional(), // Secret token for auth
});

const triggerConfigSchema = z.union([
  z.object({ type: z.literal('gpio_input'), ...gpioInputConfigSchema.shape }),
  z.object({ type: z.literal('schedule'), ...scheduleConfigSchema.shape }),
  z.object({ type: z.literal('api_call'), ...apiCallConfigSchema.shape }),
]);

const createTriggerSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  type: z.enum(['gpio_input', 'schedule', 'api_call']),
  config: z.record(z.any()),
  isEnabled: z.boolean().default(true),
  deviceId: z.string().uuid(),
});

const updateTriggerSchema = createTriggerSchema.partial().omit({ deviceId: true });

// GET all triggers
triggerRouter.get('/', async (_, res) => {
  try {
    const triggers = await prisma.trigger.findMany({
      include: { device: true, actions: { orderBy: { order: 'asc' } } },
      orderBy: { createdAt: 'desc' },
    });
    res.json(triggers);
  } catch (error) {
    res.status(500).json({ error: 'Erreur lors de la récupération des triggers' });
  }
});

// GET triggers by device
triggerRouter.get('/device/:deviceId', async (req, res) => {
  try {
    const triggers = await prisma.trigger.findMany({
      where: { deviceId: req.params.deviceId },
      include: { actions: { orderBy: { order: 'asc' } } },
      orderBy: { createdAt: 'desc' },
    });
    res.json(triggers);
  } catch (error) {
    res.status(500).json({ error: 'Erreur lors de la récupération des triggers' });
  }
});

// GET trigger by ID
triggerRouter.get('/:id', async (req, res) => {
  try {
    const trigger = await prisma.trigger.findUnique({
      where: { id: req.params.id },
      include: { device: true, actions: { orderBy: { order: 'asc' } } },
    });
    if (!trigger) {
      return res.status(404).json({ error: 'Trigger non trouvé' });
    }
    res.json(trigger);
  } catch (error) {
    res.status(500).json({ error: 'Erreur lors de la récupération du trigger' });
  }
});

// POST create trigger
triggerRouter.post('/', async (req, res) => {
  try {
    const data = createTriggerSchema.parse(req.body);
    const trigger = await prisma.trigger.create({
      data: {
        name: data.name,
        description: data.description,
        type: data.type,
        config: JSON.stringify(data.config),
        isEnabled: data.isEnabled,
        deviceId: data.deviceId,
      },
      include: { device: true, actions: true },
    });
    res.status(201).json(trigger);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors });
    }
    res.status(500).json({ error: 'Erreur lors de la création du trigger' });
  }
});

// PUT update trigger
triggerRouter.put('/:id', async (req, res) => {
  try {
    const data = updateTriggerSchema.parse(req.body);
    const trigger = await prisma.trigger.update({
      where: { id: req.params.id },
      data: {
        ...data,
        ...(data.config && { config: JSON.stringify(data.config) }),
      },
      include: { device: true, actions: true },
    });
    res.json(trigger);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors });
    }
    res.status(500).json({ error: 'Erreur lors de la mise à jour du trigger' });
  }
});

// DELETE trigger
triggerRouter.delete('/:id', async (req, res) => {
  try {
    await prisma.trigger.delete({ where: { id: req.params.id } });
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: 'Erreur lors de la suppression du trigger' });
  }
});

// POST fire trigger manually (for testing)
triggerRouter.post('/:id/fire', async (req, res) => {
  try {
    const trigger = await prisma.trigger.findUnique({
      where: { id: req.params.id },
      include: { device: true, actions: { orderBy: { order: 'asc' } } },
    });
    if (!trigger) {
      return res.status(404).json({ error: 'Trigger non trouvé' });
    }

    // Check if device is connected
    if (!isDeviceConnected(trigger.deviceId)) {
      return res.status(503).json({ 
        error: 'Device non connecté',
        message: `Le device "${trigger.device.name}" n'est pas connecté. Impossible d'exécuter le trigger.`
      });
    }
    
    // Send command to device via WebSocket
    const sent = await fireTriggerOnDevice(trigger.deviceId, trigger.id);
    
    if (!sent) {
      return res.status(500).json({ error: 'Erreur lors de l\'envoi de la commande au device' });
    }
    
    // Log the event
    await prisma.eventLog.create({
      data: {
        deviceId: trigger.deviceId,
        triggerId: trigger.id,
        type: 'trigger_fired',
        message: `Trigger "${trigger.name}" déclenché manuellement`,
        metadata: JSON.stringify({ manual: true }),
      },
    });
    
    res.json({ status: 'fired', trigger, sent: true });
  } catch (error) {
    console.error('Erreur fire trigger:', error);
    res.status(500).json({ error: 'Erreur lors du déclenchement' });
  }
});

