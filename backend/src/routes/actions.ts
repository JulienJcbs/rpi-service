import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../db';

export const actionRouter = Router();

const gpioOutputConfigSchema = z.object({
  pin: z.number().min(0).max(40),
  state: z.enum(['high', 'low', 'toggle']),
  duration: z.number().min(0).optional(), // Duration in ms (for pulse)
});

const httpRequestConfigSchema = z.object({
  url: z.string().url(),
  method: z.enum(['GET', 'POST', 'PUT', 'DELETE']).default('POST'),
  headers: z.record(z.string()).optional(),
  body: z.any().optional(),
});

const delayConfigSchema = z.object({
  duration: z.number().min(0), // Duration in ms
});

const createActionSchema = z.object({
  name: z.string().min(1),
  type: z.enum(['gpio_output', 'http_request', 'delay']),
  config: z.record(z.any()),
  order: z.number().default(0),
  triggerId: z.string().uuid(),
});

const updateActionSchema = createActionSchema.partial().omit({ triggerId: true });

// GET all actions
actionRouter.get('/', async (_, res) => {
  try {
    const actions = await prisma.action.findMany({
      include: { trigger: { include: { device: true } } },
      orderBy: { order: 'asc' },
    });
    res.json(actions);
  } catch (error) {
    res.status(500).json({ error: 'Erreur lors de la récupération des actions' });
  }
});

// GET actions by trigger
actionRouter.get('/trigger/:triggerId', async (req, res) => {
  try {
    const actions = await prisma.action.findMany({
      where: { triggerId: req.params.triggerId },
      orderBy: { order: 'asc' },
    });
    res.json(actions);
  } catch (error) {
    res.status(500).json({ error: 'Erreur lors de la récupération des actions' });
  }
});

// GET action by ID
actionRouter.get('/:id', async (req, res) => {
  try {
    const action = await prisma.action.findUnique({
      where: { id: req.params.id },
      include: { trigger: { include: { device: true } } },
    });
    if (!action) {
      return res.status(404).json({ error: 'Action non trouvée' });
    }
    res.json(action);
  } catch (error) {
    res.status(500).json({ error: "Erreur lors de la récupération de l'action" });
  }
});

// POST create action
actionRouter.post('/', async (req, res) => {
  try {
    const data = createActionSchema.parse(req.body);
    const action = await prisma.action.create({
      data: {
        name: data.name,
        type: data.type,
        config: JSON.stringify(data.config),
        order: data.order,
        triggerId: data.triggerId,
      },
      include: { trigger: true },
    });
    res.status(201).json(action);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors });
    }
    res.status(500).json({ error: "Erreur lors de la création de l'action" });
  }
});

// PUT update action
actionRouter.put('/:id', async (req, res) => {
  try {
    const data = updateActionSchema.parse(req.body);
    const action = await prisma.action.update({
      where: { id: req.params.id },
      data: {
        ...data,
        ...(data.config && { config: JSON.stringify(data.config) }),
      },
      include: { trigger: true },
    });
    res.json(action);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors });
    }
    res.status(500).json({ error: "Erreur lors de la mise à jour de l'action" });
  }
});

// DELETE action
actionRouter.delete('/:id', async (req, res) => {
  try {
    await prisma.action.delete({ where: { id: req.params.id } });
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: "Erreur lors de la suppression de l'action" });
  }
});

// PUT reorder actions
actionRouter.put('/trigger/:triggerId/reorder', async (req, res) => {
  try {
    const { actionIds } = req.body as { actionIds: string[] };
    
    await prisma.$transaction(
      actionIds.map((id, index) =>
        prisma.action.update({
          where: { id },
          data: { order: index },
        })
      )
    );
    
    const actions = await prisma.action.findMany({
      where: { triggerId: req.params.triggerId },
      orderBy: { order: 'asc' },
    });
    
    res.json(actions);
  } catch (error) {
    res.status(500).json({ error: 'Erreur lors de la réorganisation des actions' });
  }
});

