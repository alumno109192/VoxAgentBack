import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import CallLog from '../models/CallLog';
import Transcription from '../models/Transcription';
import logger from '../utils/logger';
import storageService from '../services/storageService';

/**
 * List calls for a tenant
 * GET /calls?tenantId=
 */
export const listCalls = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { tenantId } = req.query;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const skip = (page - 1) * limit;

    if (!tenantId) {
      res.status(400).json({ error: 'tenantId query parameter is required' });
      return;
    }

    // Verify user has access to this tenant
    if (req.tenantId !== tenantId && req.role !== 'admin') {
      res.status(403).json({ error: 'Forbidden: Access denied to this tenant' });
      return;
    }

    const filter: any = { tenantId };

    // Optional filters
    if (req.query.status) {
      filter.status = req.query.status;
    }

    if (req.query.from) {
      filter.createdAt = { $gte: new Date(req.query.from as string) };
    }

    if (req.query.to) {
      filter.createdAt = { 
        ...filter.createdAt,
        $lte: new Date(req.query.to as string) 
      };
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
  } catch (error: any) {
    logger.error('Error fetching calls:', error);
    res.status(500).json({
      error: 'Failed to fetch calls',
      message: error.message,
    });
  }
};

/**
 * Get call details
 * GET /calls/:id
 */
export const getCall = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const call = await CallLog.findById(id)
      .populate('userId', 'name email')
      .lean();

    if (!call) {
      res.status(404).json({ error: 'Call not found' });
      return;
    }

    // Verify user has access to this call
    if (req.tenantId !== call.tenantId.toString() && req.role !== 'admin') {
      res.status(403).json({ error: 'Forbidden: Access denied to this call' });
      return;
    }

    // Get transcription if available
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
  } catch (error: any) {
    logger.error('Error fetching call:', error);
    res.status(500).json({
      error: 'Failed to fetch call',
      message: error.message,
    });
  }
};
