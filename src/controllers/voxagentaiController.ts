import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import logger from '../utils/logger';
import Tenant from '../models/Tenant';
import Usage from '../models/Usage';

// POST /voxagentai/query
export const queryVoxAgentAI = async (req: AuthRequest, res: Response) => {
  try {
    const { tenantId, query, mode = 'text', agentId } = req.body;

    if (!tenantId || !query) {
      res.status(400).json({ error: 'tenantId and query are required' });
      return;
    }

    // Verificar autorización
    if (req.role !== 'admin' && req.tenantId !== tenantId) {
      res.status(403).json({ error: 'Forbidden' });
      return;
    }

    // Verificar límites del plan
    const tenant = await Tenant.findById(tenantId);
    if (!tenant) {
      res.status(404).json({ error: 'Tenant not found' });
      return;
    }

    if (tenant.currentUsage.voxagentaiQueriesUsed >= tenant.quotaLimits.voxagentaiQueries) {
      res.status(429).json({
        error: 'VoxAgentAI query limit reached',
        limit: tenant.quotaLimits.voxagentaiQueries,
        used: tenant.currentUsage.voxagentaiQueriesUsed,
        message: 'Upgrade your plan to get more queries',
      });
      return;
    }

    // Simular respuesta de VoxAgentAI
    // En producción, aquí iría la llamada real a la API de VoxAgentAI
    const response = await simulateVoxAgentAI(query, mode, agentId);

    // Registrar uso
    await Tenant.findByIdAndUpdate(tenantId, {
      $inc: { 'currentUsage.voxagentaiQueriesUsed': 1 },
    });

    // Registrar en usage
    const minutesConsumed = mode === 'voice' ? 0.5 : 0.1; // Estimado
    await Usage.create({
      tenantId,
      agentId,
      type: 'voxagentai',
      minutesConsumed,
      metadata: {
        mode,
        tokens: response.tokens,
        cost: response.cost,
      },
      date: new Date(),
    });

    logger.info(`VoxAgentAI query processed for tenant ${tenantId}`);

    res.json({
      response: response.text,
      mode,
      metadata: {
        tokens: response.tokens,
        cost: response.cost,
        queriesRemaining: tenant.quotaLimits.voxagentaiQueries - tenant.currentUsage.voxagentaiQueriesUsed - 1,
      },
    });
  } catch (error) {
    logger.error('VoxAgentAI query error:', error);
    res.status(500).json({ error: 'Failed to process VoxAgentAI query' });
  }
};

// GET /voxagentai/status
export const getVoxAgentAIStatus = async (req: AuthRequest, res: Response) => {
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

    const tenant = await Tenant.findById(tenantId);
    if (!tenant) {
      res.status(404).json({ error: 'Tenant not found' });
      return;
    }

    // Obtener estadísticas del mes
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const [monthlyUsage] = await Usage.aggregate([
      {
        $match: {
          tenantId: tenantId,
          type: 'voxagentai',
          date: { $gte: startOfMonth },
        },
      },
      {
        $group: {
          _id: null,
          totalQueries: { $sum: 1 },
          totalMinutes: { $sum: '$minutesConsumed' },
          totalCost: { $sum: '$metadata.cost' },
          totalTokens: { $sum: '$metadata.tokens' },
        },
      },
    ]);

    const usage = monthlyUsage || {
      totalQueries: 0,
      totalMinutes: 0,
      totalCost: 0,
      totalTokens: 0,
    };

    res.json({
      status: 'active',
      quota: {
        limit: tenant.quotaLimits.voxagentaiQueries,
        used: tenant.currentUsage.voxagentaiQueriesUsed,
        remaining: tenant.quotaLimits.voxagentaiQueries - tenant.currentUsage.voxagentaiQueriesUsed,
        percentage: (tenant.currentUsage.voxagentaiQueriesUsed / tenant.quotaLimits.voxagentaiQueries) * 100,
      },
      monthlyStats: usage,
    });
  } catch (error) {
    logger.error('VoxAgentAI status error:', error);
    res.status(500).json({ error: 'Failed to retrieve VoxAgentAI status' });
  }
};

// Función simulada de VoxAgentAI (en producción sería una llamada real)
async function simulateVoxAgentAI(_query: string, _mode: string, _agentId?: string) {
  // Simular procesamiento
  await new Promise(resolve => setTimeout(resolve, 500));

  const responses = [
    'Hola, soy VoxAgent AI. ¿En qué puedo ayudarte hoy?',
    'Basándome en tu consulta, te recomiendo revisar la documentación sobre ese tema.',
    'He analizado tu pregunta y aquí está la información que necesitas.',
    'Puedo ayudarte con eso. Déjame explicarte paso a paso.',
    'Esa es una excelente pregunta. Aquí tienes la respuesta detallada.',
  ];

  const response = responses[Math.floor(Math.random() * responses.length)];
  const tokens = Math.floor(Math.random() * 100) + 50;

  return {
    text: response,
    tokens,
    cost: tokens * 0.00001, // $0.01 por 1000 tokens
  };
}
