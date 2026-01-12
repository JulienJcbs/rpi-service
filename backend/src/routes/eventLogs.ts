import { Router } from 'express';
import { prisma } from '../db';

export const eventLogRouter = Router();

// GET all event logs (with pagination)
eventLogRouter.get('/', async (req, res) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 50;
    const deviceId = req.query.deviceId as string | undefined;
    const type = req.query.type as string | undefined;

    const where = {
      ...(deviceId && { deviceId }),
      ...(type && { type }),
    };

    const [events, total] = await Promise.all([
      prisma.eventLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: (page - 1) * limit,
      }),
      prisma.eventLog.count({ where }),
    ]);

    res.json({
      events,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    res.status(500).json({ error: 'Erreur lors de la récupération des événements' });
  }
});

// GET events by device
eventLogRouter.get('/device/:deviceId', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit as string) || 100;
    const events = await prisma.eventLog.findMany({
      where: { deviceId: req.params.deviceId },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
    res.json(events);
  } catch (error) {
    res.status(500).json({ error: 'Erreur lors de la récupération des événements' });
  }
});

// POST create event log (for RPI client)
eventLogRouter.post('/', async (req, res) => {
  try {
    const { deviceId, triggerId, actionId, type, message, metadata } = req.body;
    const event = await prisma.eventLog.create({
      data: {
        deviceId,
        triggerId,
        actionId,
        type,
        message,
        metadata: metadata ? JSON.stringify(metadata) : null,
      },
    });
    res.status(201).json(event);
  } catch (error) {
    res.status(500).json({ error: "Erreur lors de la création de l'événement" });
  }
});

// DELETE clear old events
eventLogRouter.delete('/cleanup', async (req, res) => {
  try {
    const daysToKeep = parseInt(req.query.days as string) || 30;
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

    const result = await prisma.eventLog.deleteMany({
      where: { createdAt: { lt: cutoffDate } },
    });

    res.json({ deleted: result.count, cutoffDate });
  } catch (error) {
    res.status(500).json({ error: 'Erreur lors du nettoyage des événements' });
  }
});

