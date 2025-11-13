import { Router, Response } from 'express';
import { AuthRequest, authenticate, authorize } from '../middleware/auth';
import CallLog from '../models/CallLog';
import Transcription from '../models/Transcription';
import BillingRecord from '../models/BillingRecord';
import logger from '../utils/logger';
import storageService from '../services/storageService';

const router = Router();

// Apply authentication to all admin routes
router.use(authenticate);

/**
 * @swagger
 * /api/admin/calls:
 *   get:
 *     summary: List all calls with pagination
 *     tags: [Admin]
 */
router.get('/calls', authorize('admin', 'operator'), async (req: AuthRequest, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const skip = (page - 1) * limit;

    const filter: any = { tenantId: req.tenantId };

    if (req.query.status) {
      filter.status = req.query.status;
    }

    if (req.query.from) {
      filter.createdAt = { $gte: new Date(req.query.from as string) };
    }

    const [calls, total] = await Promise.all([
      CallLog.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('userId', 'name email')
        .lean(),
      CallLog.countDocuments(filter),
    ]);

    res.json({
      data: calls,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    logger.error('Error fetching calls:', error);
    res.status(500).json({ error: 'Failed to fetch calls' });
  }
});

/**
 * @swagger
 * /api/admin/calls/:id:
 *   get:
 *     summary: Get call details
 *     tags: [Admin]
 */
router.get('/calls/:id', authorize('admin', 'operator'), async (req: AuthRequest, res: Response) => {
  try {
    const call = await CallLog.findOne({
      _id: req.params.id,
      tenantId: req.tenantId,
    })
      .populate('userId', 'name email')
      .lean();

    if (!call) {
      res.status(404).json({ error: 'Call not found' });
      return;
    }

    // Get transcription
    const transcription = await Transcription.findOne({ callId: call._id }).lean();

    // Generate presigned URL for recording if available
    let recordingUrl = null;
    if (call.recordingUrl) {
      try {
        recordingUrl = await storageService.getPresignedUrl(call.recordingUrl);
      } catch (error) {
        logger.warn('Failed to generate presigned URL:', error);
      }
    }

    res.json({
      ...call,
      recordingUrl,
      transcription,
    });
  } catch (error) {
    logger.error('Error fetching call details:', error);
    res.status(500).json({ error: 'Failed to fetch call details' });
  }
});

/**
 * @swagger
 * /api/admin/calls/:id:
 *   patch:
 *     summary: Update call metadata
 *     tags: [Admin]
 */
router.patch('/calls/:id', authorize('admin', 'operator'), async (req: AuthRequest, res: Response) => {
  try {
    const { notes, tags, isConfidential } = req.body;

    const call = await CallLog.findOne({
      _id: req.params.id,
      tenantId: req.tenantId,
    });

    if (!call) {
      res.status(404).json({ error: 'Call not found' });
      return;
    }

    if (notes !== undefined) {
      call.metadata.notes = notes;
    }

    if (tags !== undefined) {
      call.metadata.tags = tags;
    }

    if (isConfidential !== undefined) {
      call.metadata.isConfidential = isConfidential;
    }

    await call.save();

    res.json({ message: 'Call updated successfully', call });
  } catch (error) {
    logger.error('Error updating call:', error);
    res.status(500).json({ error: 'Failed to update call' });
  }
});

/**
 * @swagger
 * /api/admin/transcriptions:
 *   get:
 *     summary: Search transcriptions
 *     tags: [Admin]
 */
router.get('/transcriptions', authorize('admin', 'operator'), async (req: AuthRequest, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const skip = (page - 1) * limit;

    const filter: any = { tenantId: req.tenantId };

    // Full-text search
    if (req.query.search) {
      filter.$text = { $search: req.query.search as string };
    }

    const [transcriptions, total] = await Promise.all([
      Transcription.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('callId', 'from to startedAt')
        .lean(),
      Transcription.countDocuments(filter),
    ]);

    res.json({
      data: transcriptions,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    logger.error('Error fetching transcriptions:', error);
    res.status(500).json({ error: 'Failed to fetch transcriptions' });
  }
});

/**
 * @swagger
 * /api/admin/metrics:
 *   get:
 *     summary: Get usage metrics
 *     tags: [Admin]
 */
router.get('/metrics', authorize('admin'), async (req: AuthRequest, res: Response) => {
  try {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const [
      totalCalls,
      completedCalls,
      failedCalls,
      avgDuration,
      totalCost,
      recentCalls,
    ] = await Promise.all([
      CallLog.countDocuments({ tenantId: req.tenantId, createdAt: { $gte: thirtyDaysAgo } }),
      CallLog.countDocuments({ tenantId: req.tenantId, status: 'completed', createdAt: { $gte: thirtyDaysAgo } }),
      CallLog.countDocuments({ tenantId: req.tenantId, status: 'failed', createdAt: { $gte: thirtyDaysAgo } }),
      CallLog.aggregate([
        { $match: { tenantId: req.tenantId, status: 'completed', createdAt: { $gte: thirtyDaysAgo } } },
        { $group: { _id: null, avgDuration: { $avg: '$durationSec' } } },
      ]),
      BillingRecord.aggregate([
        { $match: { tenantId: req.tenantId, createdAt: { $gte: thirtyDaysAgo } } },
        { $group: { _id: null, totalCost: { $sum: '$amount' } } },
      ]),
      CallLog.find({ tenantId: req.tenantId })
        .sort({ createdAt: -1 })
        .limit(10)
        .lean(),
    ]);

    res.json({
      period: '30_days',
      metrics: {
        totalCalls,
        completedCalls,
        failedCalls,
        successRate: totalCalls > 0 ? (completedCalls / totalCalls) * 100 : 0,
        avgDurationSec: avgDuration[0]?.avgDuration || 0,
        totalCost: totalCost[0]?.totalCost || 0,
      },
      recentCalls,
    });
  } catch (error) {
    logger.error('Error fetching metrics:', error);
    res.status(500).json({ error: 'Failed to fetch metrics' });
  }
});

/**
 * @swagger
 * /api/admin/billing/charge:
 *   post:
 *     summary: Create billing charge
 *     tags: [Admin]
 */
router.post('/billing/charge', authorize('admin'), async (req: AuthRequest, res: Response) => {
  try {
    const { callId, amount, type, description } = req.body;

    const billingRecord = new BillingRecord({
      tenantId: req.tenantId,
      callId,
      type: type || 'call',
      amount,
      description,
      status: 'pending',
    });

    await billingRecord.save();

    res.json({ message: 'Billing record created', billingRecord });
  } catch (error) {
    logger.error('Error creating billing record:', error);
    res.status(500).json({ error: 'Failed to create billing record' });
  }
});

export default router;
