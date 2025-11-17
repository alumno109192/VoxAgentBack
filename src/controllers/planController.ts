import { Response } from 'express';
import Plan from '../models/Plan';
import Tenant from '../models/Tenant';
import { AuthRequest } from '../middleware/auth';
import logger from '../utils/logger';
import AuditLog from '../models/AuditLog';

// GET /plan?tenantId=xxx
export const getCurrentPlan = async (req: AuthRequest, res: Response) => {
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

    const tenant = await Tenant.findById(tenantId).populate('planId');

    if (!tenant) {
      res.status(404).json({ error: 'Tenant not found' });
      return;
    }

    res.json({
      currentPlan: tenant.planId || null,
      planTier: tenant.planTier,
      quotaLimits: tenant.quotaLimits,
      currentUsage: tenant.currentUsage,
      usage: {
        calls: {
          used: tenant.currentUsage.callsThisMonth,
          limit: tenant.quotaLimits.maxCallsPerMonth,
          percentage: (tenant.currentUsage.callsThisMonth / tenant.quotaLimits.maxCallsPerMonth) * 100,
        },
        minutes: {
          used: tenant.currentUsage.minutesThisMonth,
          limit: tenant.quotaLimits.maxMinutesPerMonth,
          percentage: (tenant.currentUsage.minutesThisMonth / tenant.quotaLimits.maxMinutesPerMonth) * 100,
        },
        agents: {
          used: tenant.currentUsage.agentsCreated,
          limit: tenant.quotaLimits.maxAgents,
        },
        voxagentai: {
          used: tenant.currentUsage.voxagentaiQueriesUsed,
          limit: tenant.quotaLimits.voxagentaiQueries,
        },
      },
    });
  } catch (error) {
    logger.error('Get current plan error:', error);
    res.status(500).json({ error: 'Failed to retrieve plan' });
  }
};

// GET /plans
export const listPlans = async (_req: AuthRequest, res: Response) => {
  try {
    const plans = await Plan.find({ isActive: true }).sort({ 'pricing.monthly': 1 });

    res.json({ plans });
  } catch (error) {
    logger.error('List plans error:', error);
    res.status(500).json({ error: 'Failed to retrieve plans' });
  }
};

// POST /plan/change
export const changePlan = async (req: AuthRequest, res: Response) => {
  try {
    const { tenantId, planId, planTier } = req.body;

    if (!tenantId || (!planId && !planTier)) {
      res.status(400).json({ error: 'tenantId and (planId or planTier) are required' });
      return;
    }

    // Verificar autorización
    if (req.role !== 'admin' && req.tenantId !== tenantId) {
      res.status(403).json({ error: 'Forbidden' });
      return;
    }

    let plan;
    if (planId) {
      plan = await Plan.findById(planId);
    } else if (planTier) {
      plan = await Plan.findOne({ tier: planTier, isActive: true });
    }

    if (!plan) {
      res.status(404).json({ error: 'Plan not found' });
      return;
    }

    const tenant = await Tenant.findById(tenantId);
    if (!tenant) {
      res.status(404).json({ error: 'Tenant not found' });
      return;
    }

    // Actualizar tenant con nuevo plan
    const updates = {
      planId: plan.id,
      planTier: plan.tier,
      'quotaLimits.maxCallsPerMonth': plan.limits.maxCallsPerMonth,
      'quotaLimits.maxMinutesPerMonth': plan.limits.maxMinutesPerMonth,
      'quotaLimits.maxStorageGB': plan.limits.maxStorageGB,
      'quotaLimits.maxAgents': plan.limits.maxAgents,
      'quotaLimits.voxagentaiQueries': plan.limits.voxagentaiQueries,
    };

    const updatedTenant = await Tenant.findByIdAndUpdate(
      tenantId,
      { $set: updates },
      { new: true }
    ).populate('planId');

    // Audit log
    await AuditLog.create({
      tenantId,
      userId: req.userId,
      action: 'plan.changed',
      resource: 'Tenant',
      resourceId: tenantId,
      details: {
        oldPlan: tenant.planTier,
        newPlan: plan.tier,
        planName: plan.name,
      },
    });

    logger.info(`Plan changed for tenant ${tenantId}: ${tenant.planTier} → ${plan.tier}`);

    res.json({
      message: 'Plan changed successfully',
      tenant: {
        id: updatedTenant?.id,
        planTier: updatedTenant?.planTier,
        quotaLimits: updatedTenant?.quotaLimits,
      },
    });
  } catch (error) {
    logger.error('Change plan error:', error);
    res.status(500).json({ error: 'Failed to change plan' });
  }
};
