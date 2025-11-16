import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import Tenant from '../models/Tenant';
import AuditLog from '../models/AuditLog';
import logger from '../utils/logger';
import { generateRandomString } from '../utils/encryption';

/**
 * Get tenant details
 * GET /tenant/:id
 */
export const getTenant = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    // Verify user has access to this tenant
    if (req.tenantId !== id && req.role !== 'admin') {
      res.status(403).json({ error: 'Forbidden: Access denied to this tenant' });
      return;
    }

    const tenant = await Tenant.findById(id).lean();

    if (!tenant) {
      res.status(404).json({ error: 'Tenant not found' });
      return;
    }

    // Don't expose sensitive fields in full
    const sanitizedTenant = {
      _id: tenant._id,
      name: tenant.name,
      apiKey: tenant.apiKey, // Show full API key only to authenticated users
      isActive: tenant.isActive,
      quotaLimits: tenant.quotaLimits,
      currentUsage: tenant.currentUsage,
      billingMethod: tenant.billingMethod,
      contactEmail: tenant.contactEmail,
      contactPhone: tenant.contactPhone,
      domain: tenant.domain,
      status: tenant.status,
      settings: tenant.settings,
      metadata: tenant.metadata,
      createdAt: tenant.createdAt,
      updatedAt: tenant.updatedAt,
    };

    res.json(sanitizedTenant);
  } catch (error: any) {
    logger.error('Error fetching tenant:', error);
    res.status(500).json({
      error: 'Failed to fetch tenant',
      message: error.message,
    });
  }
};

/**
 * Regenerate tenant API key
 * POST /tenant/:id/regenerate-key
 */
export const regenerateApiKey = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    // Only admins or the tenant owner can regenerate
    if (req.tenantId !== id && req.role !== 'admin') {
      res.status(403).json({ error: 'Forbidden: Insufficient permissions' });
      return;
    }

    const tenant = await Tenant.findById(id);

    if (!tenant) {
      res.status(404).json({ error: 'Tenant not found' });
      return;
    }

    // Store old key for audit
    const oldApiKey = tenant.apiKey;

    // Generate new API key
    const newApiKey = generateRandomString(32);
    tenant.apiKey = newApiKey;
    await tenant.save();

    // Create audit log
    await AuditLog.create({
      action: 'tenant.api_key_regenerated',
      actorId: req.userId,
      tenantId: id,
      resourceType: 'Tenant',
      resourceId: id,
      before: { apiKey: `${oldApiKey.substring(0, 8)}...` },
      after: { apiKey: `${newApiKey.substring(0, 8)}...` },
      ipAddress: req.ip,
      requestId: req.requestId,
    });

    logger.info(`API key regenerated for tenant: ${id}`, {
      tenantId: id,
      userId: req.userId,
    });

    res.json({
      message: 'API key regenerated successfully',
      apiKey: newApiKey,
      tenant: {
        id: tenant._id,
        name: tenant.name,
      },
    });
  } catch (error: any) {
    logger.error('Error regenerating API key:', error);
    res.status(500).json({
      error: 'Failed to regenerate API key',
      message: error.message,
    });
  }
};

/**
 * Update tenant settings
 * PATCH /tenant/:id
 */
export const updateTenant = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    // Only admins or the tenant owner can update
    if (req.tenantId !== id && req.role !== 'admin') {
      res.status(403).json({ error: 'Forbidden: Insufficient permissions' });
      return;
    }

    const tenant = await Tenant.findById(id);

    if (!tenant) {
      res.status(404).json({ error: 'Tenant not found' });
      return;
    }

    const before = { ...tenant.toObject() };

    // Update allowed fields
    const {
      name,
      contactEmail,
      contactPhone,
      domain,
      settings,
      metadata,
    } = req.body;

    if (name !== undefined) tenant.name = name;
    if (contactEmail !== undefined) tenant.contactEmail = contactEmail;
    if (contactPhone !== undefined) tenant.contactPhone = contactPhone;
    if (domain !== undefined) tenant.domain = domain;
    
    if (settings) {
      tenant.settings = { ...tenant.settings, ...settings };
    }

    if (metadata) {
      tenant.metadata = { ...tenant.metadata, ...metadata };
    }

    await tenant.save();

    // Create audit log
    await AuditLog.create({
      action: 'tenant.updated',
      actorId: req.userId,
      tenantId: id,
      resourceType: 'Tenant',
      resourceId: id,
      before: { name: before.name, settings: before.settings },
      after: { name: tenant.name, settings: tenant.settings },
      ipAddress: req.ip,
      requestId: req.requestId,
    });

    logger.info(`Tenant updated: ${id}`, {
      tenantId: id,
      userId: req.userId,
    });

    res.json({
      message: 'Tenant updated successfully',
      tenant,
    });
  } catch (error: any) {
    logger.error('Error updating tenant:', error);
    res.status(500).json({
      error: 'Failed to update tenant',
      message: error.message,
    });
  }
};
