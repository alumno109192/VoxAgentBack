import { Response } from 'express';
import Usage from '../models/Usage';
import { AuthRequest } from '../middleware/auth';
import logger from '../utils/logger';

// GET /usage?tenantId=xxx&from=xxx&to=xxx
export const getUsage = async (req: AuthRequest, res: Response) => {
  try {
    const { tenantId, from, to, type, agentId, groupBy } = req.query;

    if (!tenantId) {
      res.status(400).json({ error: 'tenantId is required' });
      return;
    }

    // Verificar autorización
    if (req.role !== 'admin' && req.tenantId !== tenantId) {
      res.status(403).json({ error: 'Forbidden' });
      return;
    }

    const query: any = { tenantId };

    // Filtros de fecha
    if (from || to) {
      query.date = {};
      if (from) query.date.$gte = new Date(from as string);
      if (to) query.date.$lte = new Date(to as string);
    } else {
      // Por defecto, último mes
      const lastMonth = new Date();
      lastMonth.setMonth(lastMonth.getMonth() - 1);
      query.date = { $gte: lastMonth };
    }

    if (type) query.type = type;
    if (agentId) query.agentId = agentId;

    // Si se solicita agrupación
    if (groupBy === 'day' || groupBy === 'month') {
      const groupFormat = groupBy === 'day' ? '%Y-%m-%d' : '%Y-%m';
      
      const aggregated = await Usage.aggregate([
        { $match: query },
        {
          $group: {
            _id: {
              date: { $dateToString: { format: groupFormat, date: '$date' } },
              type: '$type',
            },
            totalMinutes: { $sum: '$minutesConsumed' },
            count: { $sum: 1 },
            totalCost: { $sum: '$metadata.cost' },
          },
        },
        { $sort: { '_id.date': 1 } },
      ]);

      res.json({ usage: aggregated });
      return;
    }

    // Consulta sin agrupación
    const [usage, stats] = await Promise.all([
      Usage.find(query)
        .populate('agentId', 'name')
        .sort({ date: -1 })
        .limit(100),
      Usage.aggregate([
        { $match: query },
        {
          $group: {
            _id: null,
            totalMinutes: { $sum: '$minutesConsumed' },
            totalCalls: { $sum: 1 },
            avgMinutesPerCall: { $avg: '$minutesConsumed' },
            totalCost: { $sum: '$metadata.cost' },
          },
        },
      ]),
    ]);

    res.json({
      usage,
      stats: stats[0] || {
        totalMinutes: 0,
        totalCalls: 0,
        avgMinutesPerCall: 0,
        totalCost: 0,
      },
    });
  } catch (error) {
    logger.error('Get usage error:', error);
    res.status(500).json({ error: 'Failed to retrieve usage' });
  }
};

// GET /usage/summary?tenantId=xxx
export const getUsageSummary = async (req: AuthRequest, res: Response) => {
  try {
    const { tenantId } = req.query;

    if (!tenantId) {
      res.status(400).json({ error: 'tenantId is required' });
      return;
    }

    // Verificar autorización
    if (req.role !== 'admin' && req.tenantId !== tenantId) {
      res.status(403).json({ error: 'Forbidden' });
      return;
    }

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);

    const [currentMonth, lastMonth, byType] = await Promise.all([
      // Mes actual
      Usage.aggregate([
        {
          $match: {
            tenantId: tenantId,
            date: { $gte: startOfMonth },
          },
        },
        {
          $group: {
            _id: null,
            totalMinutes: { $sum: '$minutesConsumed' },
            totalCalls: { $sum: 1 },
            totalCost: { $sum: '$metadata.cost' },
          },
        },
      ]),
      // Mes pasado
      Usage.aggregate([
        {
          $match: {
            tenantId: tenantId,
            date: { $gte: startOfLastMonth, $lte: endOfLastMonth },
          },
        },
        {
          $group: {
            _id: null,
            totalMinutes: { $sum: '$minutesConsumed' },
            totalCalls: { $sum: 1 },
          },
        },
      ]),
      // Por tipo
      Usage.aggregate([
        {
          $match: {
            tenantId: tenantId,
            date: { $gte: startOfMonth },
          },
        },
        {
          $group: {
            _id: '$type',
            totalMinutes: { $sum: '$minutesConsumed' },
            count: { $sum: 1 },
          },
        },
      ]),
    ]);

    const current = currentMonth[0] || { totalMinutes: 0, totalCalls: 0, totalCost: 0 };
    const last = lastMonth[0] || { totalMinutes: 0, totalCalls: 0 };

    const changeMinutes = last.totalMinutes > 0
      ? ((current.totalMinutes - last.totalMinutes) / last.totalMinutes) * 100
      : 0;

    res.json({
      currentMonth: {
        totalMinutes: current.totalMinutes,
        totalCalls: current.totalCalls,
        totalCost: current.totalCost,
        avgMinutesPerCall: current.totalCalls > 0 ? current.totalMinutes / current.totalCalls : 0,
      },
      lastMonth: {
        totalMinutes: last.totalMinutes,
        totalCalls: last.totalCalls,
      },
      change: {
        minutes: changeMinutes.toFixed(2) + '%',
      },
      byType,
    });
  } catch (error) {
    logger.error('Get usage summary error:', error);
    res.status(500).json({ error: 'Failed to retrieve usage summary' });
  }
};

// POST /usage (internal - registrar uso)
export const recordUsage = async (req: AuthRequest, res: Response) => {
  try {
    const { tenantId, agentId, type, minutesConsumed, callId, metadata } = req.body;

    if (!tenantId || !type || minutesConsumed === undefined) {
      res.status(400).json({ error: 'tenantId, type and minutesConsumed are required' });
      return;
    }

    const usage = await Usage.create({
      tenantId,
      agentId,
      type,
      minutesConsumed,
      callId,
      metadata: metadata || {},
      date: new Date(),
    });

    // Actualizar stats del agente si aplica
    if (agentId) {
      const Agent = require('../models/Agent').default;
      await Agent.findByIdAndUpdate(agentId, {
        $inc: {
          'stats.totalCalls': 1,
          'stats.totalMinutes': minutesConsumed,
        },
        $set: { 'stats.lastUsed': new Date() },
      });
    }

    logger.info(`Usage recorded: ${minutesConsumed} minutes for tenant ${tenantId}`);

    res.status(201).json({ usage });
  } catch (error) {
    logger.error('Record usage error:', error);
    res.status(500).json({ error: 'Failed to record usage' });
  }
};
