import { Response } from 'express';
import Agent from '../models/Agent';
import Tenant from '../models/Tenant';
import { AuthRequest } from '../middleware/auth';
import logger from '../utils/logger';
import AuditLog from '../models/AuditLog';

// GET /agents?tenantId=xxx
export const listAgents = async (req: AuthRequest, res: Response) => {
  try {
    const { tenantId } = req.query;
    const { page = 1, limit = 20, status } = req.query;

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
    if (status) {
      query.status = status;
    }

    const skip = (Number(page) - 1) * Number(limit);

    const [agents, total] = await Promise.all([
      Agent.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit))
        .select('-__v'),
      Agent.countDocuments(query),
    ]);

    res.json({
      agents,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit)),
      },
    });
  } catch (error) {
    logger.error('List agents error:', error);
    res.status(500).json({ error: 'Failed to retrieve agents' });
  }
};

// GET /agents/:id
export const getAgent = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const agent = await Agent.findById(id).populate('tenantId', 'name contactEmail');

    if (!agent) {
      res.status(404).json({ error: 'Agent not found' });
      return;
    }

    // Verificar autorización
    if (req.role !== 'admin' && req.tenantId !== agent.tenantId.toString()) {
      res.status(403).json({ error: 'Forbidden' });
      return;
    }

    res.json({ agent });
  } catch (error) {
    logger.error('Get agent error:', error);
    res.status(500).json({ error: 'Failed to retrieve agent' });
  }
};

// POST /agents
export const createAgent = async (req: AuthRequest, res: Response) => {
  try {
    const { tenantId, name, description, configuration, metadata } = req.body;

    if (!tenantId || !name || !configuration) {
      res.status(400).json({ error: 'tenantId, name and configuration are required' });
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

    const agentCount = await Agent.countDocuments({ tenantId, status: { $ne: 'inactive' } });
    if (agentCount >= tenant.quotaLimits.maxAgents) {
      res.status(403).json({ 
        error: 'Agent limit reached',
        limit: tenant.quotaLimits.maxAgents,
        current: agentCount,
      });
      return;
    }

    const agent = await Agent.create({
      tenantId,
      name,
      description,
      configuration: {
        language: configuration.language || 'es',
        voiceId: configuration.voiceId || 'default-voice',
        behavior: configuration.behavior,
        temperature: configuration.temperature || 0.7,
        maxTokens: configuration.maxTokens || 150,
        welcomeMessage: configuration.welcomeMessage,
        fallbackMessage: configuration.fallbackMessage,
      },
      metadata: metadata || {},
      stats: {
        totalCalls: 0,
        totalMinutes: 0,
      },
    });

    // Actualizar contador de agentes
    await Tenant.findByIdAndUpdate(tenantId, {
      $inc: { 'currentUsage.agentsCreated': 1 },
    });

    // Audit log
    await AuditLog.create({
      tenantId,
      userId: req.userId,
      action: 'agent.created',
      resource: 'Agent',
      resourceId: agent.id,
      details: { name: agent.name },
    });

    logger.info(`Agent created: ${agent.name} for tenant ${tenantId}`);

    res.status(201).json({ agent });
  } catch (error) {
    logger.error('Create agent error:', error);
    res.status(500).json({ error: 'Failed to create agent' });
  }
};

// PUT /agents/:id
export const updateAgent = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { name, description, status, configuration, metadata } = req.body;

    const agent = await Agent.findById(id);
    if (!agent) {
      res.status(404).json({ error: 'Agent not found' });
      return;
    }

    // Verificar autorización
    if (req.role !== 'admin' && req.tenantId !== agent.tenantId.toString()) {
      res.status(403).json({ error: 'Forbidden' });
      return;
    }

    const updates: any = {};
    if (name) updates.name = name;
    if (description !== undefined) updates.description = description;
    if (status) updates.status = status;
    if (configuration) updates.configuration = { ...agent.configuration, ...configuration };
    if (metadata) updates.metadata = { ...agent.metadata, ...metadata };

    const updatedAgent = await Agent.findByIdAndUpdate(
      id,
      { $set: updates },
      { new: true, runValidators: true }
    );

    // Audit log
    await AuditLog.create({
      tenantId: agent.tenantId,
      userId: req.userId,
      action: 'agent.updated',
      resource: 'Agent',
      resourceId: agent.id,
      details: updates,
    });

    logger.info(`Agent updated: ${id}`);

    res.json({ agent: updatedAgent });
  } catch (error) {
    logger.error('Update agent error:', error);
    res.status(500).json({ error: 'Failed to update agent' });
  }
};

// DELETE /agents/:id
export const deleteAgent = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const agent = await Agent.findById(id);
    if (!agent) {
      res.status(404).json({ error: 'Agent not found' });
      return;
    }

    // Verificar autorización
    if (req.role !== 'admin' && req.tenantId !== agent.tenantId.toString()) {
      res.status(403).json({ error: 'Forbidden' });
      return;
    }

    // Soft delete - cambiar estado a inactive
    await Agent.findByIdAndUpdate(id, { status: 'inactive' });

    // Audit log
    await AuditLog.create({
      tenantId: agent.tenantId,
      userId: req.userId,
      action: 'agent.deleted',
      resource: 'Agent',
      resourceId: agent.id,
      details: { name: agent.name },
    });

    logger.info(`Agent deleted: ${id}`);

    res.json({ message: 'Agent deleted successfully' });
  } catch (error) {
    logger.error('Delete agent error:', error);
    res.status(500).json({ error: 'Failed to delete agent' });
  }
};
