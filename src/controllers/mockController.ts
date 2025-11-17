import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import mockDataService from '../utils/mockDataService';
import logger from '../utils/logger';
import { v4 as uuidv4 } from 'uuid';

// ============ AGENTES ============

export const getMockAgents = async (req: AuthRequest, res: Response) => {
  try {
    const { tenantId, status } = req.query;

    // Verificar autorización
    if (req.role !== 'admin' && req.tenantId !== tenantId) {
      res.status(403).json({ error: 'Forbidden' });
      return;
    }

    let agents = await mockDataService.getAgents(tenantId as string);

    // Filtrar por status si se especifica
    if (status) {
      agents = agents.filter((a: any) => a.status === status);
    }

    res.json({ agents, total: agents.length });
  } catch (error) {
    logger.error('Error getting mock agents:', error);
    res.status(500).json({ error: 'Failed to get agents' });
  }
};

export const getMockAgentById = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const agent = await mockDataService.getAgentById(id);

    if (!agent) {
      res.status(404).json({ error: 'Agent not found' });
      return;
    }

    // Verificar autorización
    if (req.role !== 'admin' && req.tenantId !== agent.tenantId) {
      res.status(403).json({ error: 'Forbidden' });
      return;
    }

    res.json(agent);
  } catch (error) {
    logger.error('Error getting mock agent:', error);
    res.status(500).json({ error: 'Failed to get agent' });
  }
};

export const createMockAgent = async (req: AuthRequest, res: Response) => {
  try {
    const { tenantId, name, description, voice, behavior, configuration } = req.body;

    if (!tenantId || !name) {
      res.status(400).json({ error: 'tenantId and name are required' });
      return;
    }

    // Verificar autorización
    if (req.role !== 'admin' && req.tenantId !== tenantId) {
      res.status(403).json({ error: 'Forbidden' });
      return;
    }

    const newAgent = {
      id: `agent-${uuidv4().slice(0, 8)}`,
      tenantId,
      name,
      description: description || '',
      voice: voice || 'es-ES-Standard-A',
      behavior: behavior || 'neutral',
      status: 'active',
      configuration: configuration || {},
      stats: {
        totalCalls: 0,
        totalMinutes: 0,
        lastUsed: null,
      },
    };

    const agent = await mockDataService.createAgent(newAgent);
    logger.info(`Mock agent created: ${agent.id}`);

    res.status(201).json(agent);
  } catch (error) {
    logger.error('Error creating mock agent:', error);
    res.status(500).json({ error: 'Failed to create agent' });
  }
};

export const updateMockAgent = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const existingAgent = await mockDataService.getAgentById(id);
    if (!existingAgent) {
      res.status(404).json({ error: 'Agent not found' });
      return;
    }

    // Verificar autorización
    if (req.role !== 'admin' && req.tenantId !== existingAgent.tenantId) {
      res.status(403).json({ error: 'Forbidden' });
      return;
    }

    const updatedAgent = await mockDataService.updateAgent(id, updates);
    logger.info(`Mock agent updated: ${id}`);

    res.json(updatedAgent);
  } catch (error) {
    logger.error('Error updating mock agent:', error);
    res.status(500).json({ error: 'Failed to update agent' });
  }
};

export const deleteMockAgent = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const existingAgent = await mockDataService.getAgentById(id);
    if (!existingAgent) {
      res.status(404).json({ error: 'Agent not found' });
      return;
    }

    // Verificar autorización
    if (req.role !== 'admin' && req.tenantId !== existingAgent.tenantId) {
      res.status(403).json({ error: 'Forbidden' });
      return;
    }

    await mockDataService.deleteAgent(id);
    logger.info(`Mock agent deleted: ${id}`);

    res.json({ message: 'Agent deleted successfully' });
  } catch (error) {
    logger.error('Error deleting mock agent:', error);
    res.status(500).json({ error: 'Failed to delete agent' });
  }
};

// ============ USO (ANGELITOS) ============

export const getMockUsage = async (req: AuthRequest, res: Response) => {
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

    const usage = await mockDataService.getUsage(tenantId as string);
    res.json(usage);
  } catch (error) {
    logger.error('Error getting mock usage:', error);
    res.status(500).json({ error: 'Failed to get usage' });
  }
};

// ============ PLAN ============

export const getMockPlan = async (req: AuthRequest, res: Response) => {
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

    const plan = await mockDataService.getPlan(tenantId as string);
    
    if (!plan) {
      res.status(404).json({ error: 'Plan not found' });
      return;
    }

    res.json(plan);
  } catch (error) {
    logger.error('Error getting mock plan:', error);
    res.status(500).json({ error: 'Failed to get plan' });
  }
};

export const changeMockPlan = async (req: AuthRequest, res: Response) => {
  try {
    const { tenantId, newPlan } = req.body;

    if (!tenantId || !newPlan) {
      res.status(400).json({ error: 'tenantId and newPlan are required' });
      return;
    }

    // Verificar autorización
    if (req.role !== 'admin' && req.tenantId !== tenantId) {
      res.status(403).json({ error: 'Forbidden' });
      return;
    }

    const updatedPlan = await mockDataService.updatePlan(tenantId, newPlan);
    logger.info(`Mock plan changed for tenant: ${tenantId}`);

    res.json(updatedPlan);
  } catch (error) {
    logger.error('Error changing mock plan:', error);
    res.status(500).json({ error: 'Failed to change plan' });
  }
};

// ============ VOXAGENTAI ============

export const getMockVoxAgentAI = async (req: AuthRequest, res: Response) => {
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

    const interactions = await mockDataService.getVoxAgentAIInteractions(tenantId as string);
    res.json({ interactions, total: interactions.length });
  } catch (error) {
    logger.error('Error getting mock VoxAgentAI interactions:', error);
    res.status(500).json({ error: 'Failed to get interactions' });
  }
};

export const queryMockVoxAgentAI = async (req: AuthRequest, res: Response) => {
  try {
    const { tenantId, agentId, query, mode = 'text' } = req.body;

    if (!tenantId || !query) {
      res.status(400).json({ error: 'tenantId and query are required' });
      return;
    }

    // Verificar autorización
    if (req.role !== 'admin' && req.tenantId !== tenantId) {
      res.status(403).json({ error: 'Forbidden' });
      return;
    }

    // Simular respuesta
    const responses = [
      'Basándome en tu consulta, aquí está la información que necesitas.',
      'He analizado tu pregunta y puedo ayudarte con eso.',
      'Perfecto, déjame ayudarte con tu solicitud.',
      'Entiendo tu pregunta, aquí está la respuesta.',
      'Claro, con gusto te asisto en esto.',
    ];

    const response = responses[Math.floor(Math.random() * responses.length)];
    const tokens = Math.floor(Math.random() * 100) + 50;

    const interaction = {
      id: `interaction-${uuidv4().slice(0, 8)}`,
      tenantId,
      agentId,
      query,
      response,
      mode,
      metadata: {
        tokens,
        cost: tokens * 0.00001,
        duration: Math.random() * 3,
      },
    };

    await mockDataService.addVoxAgentAIInteraction(interaction);
    logger.info(`Mock VoxAgentAI query processed for tenant: ${tenantId}`);

    res.json({
      response: interaction.response,
      mode: interaction.mode,
      metadata: interaction.metadata,
    });
  } catch (error) {
    logger.error('Error processing mock VoxAgentAI query:', error);
    res.status(500).json({ error: 'Failed to process query' });
  }
};

// ============ PAGOS ============

export const getMockPayments = async (req: AuthRequest, res: Response) => {
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

    const payments = await mockDataService.getPayments(tenantId as string);
    res.json({ payments, total: payments.length });
  } catch (error) {
    logger.error('Error getting mock payments:', error);
    res.status(500).json({ error: 'Failed to get payments' });
  }
};
