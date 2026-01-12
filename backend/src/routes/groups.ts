import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../db';

export const groupRouter = Router();

const createGroupSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
});

const updateGroupSchema = createGroupSchema.partial();

// GET all groups
groupRouter.get('/', async (_, res) => {
  try {
    const groups = await prisma.group.findMany({
      include: { devices: true },
      orderBy: { name: 'asc' },
    });
    res.json(groups);
  } catch (error) {
    res.status(500).json({ error: 'Erreur lors de la récupération des groupes' });
  }
});

// GET group by ID
groupRouter.get('/:id', async (req, res) => {
  try {
    const group = await prisma.group.findUnique({
      where: { id: req.params.id },
      include: { devices: { include: { triggers: true } } },
    });
    if (!group) {
      return res.status(404).json({ error: 'Groupe non trouvé' });
    }
    res.json(group);
  } catch (error) {
    res.status(500).json({ error: 'Erreur lors de la récupération du groupe' });
  }
});

// POST create group
groupRouter.post('/', async (req, res) => {
  try {
    const data = createGroupSchema.parse(req.body);
    const group = await prisma.group.create({
      data,
      include: { devices: true },
    });
    res.status(201).json(group);
  } catch (error) {
    console.error('Erreur création groupe:', error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors });
    }
    res.status(500).json({ error: 'Erreur lors de la création du groupe' });
  }
});

// PUT update group
groupRouter.put('/:id', async (req, res) => {
  try {
    const data = updateGroupSchema.parse(req.body);
    const group = await prisma.group.update({
      where: { id: req.params.id },
      data,
      include: { devices: true },
    });
    res.json(group);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors });
    }
    res.status(500).json({ error: 'Erreur lors de la mise à jour du groupe' });
  }
});

// DELETE group
groupRouter.delete('/:id', async (req, res) => {
  try {
    // Remove devices from group first
    await prisma.device.updateMany({
      where: { groupId: req.params.id },
      data: { groupId: null },
    });
    await prisma.group.delete({ where: { id: req.params.id } });
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: 'Erreur lors de la suppression du groupe' });
  }
});

