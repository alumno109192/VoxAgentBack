import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import Transcription from '../models/Transcription';
import logger from '../utils/logger';

/**
 * List transcriptions for a tenant
 * GET /transcriptions?tenantId=
 */
export const listTranscriptions = async (req: AuthRequest, res: Response): Promise<void> => {
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

    // Full-text search
    if (req.query.search) {
      filter.$text = { $search: req.query.search as string };
    }

    // Status filter
    if (req.query.status) {
      filter.status = req.query.status;
    }

    // Date range filter
    if (req.query.from) {
      filter.createdAt = { $gte: new Date(req.query.from as string) };
    }

    if (req.query.to) {
      filter.createdAt = { 
        ...filter.createdAt,
        $lte: new Date(req.query.to as string) 
      };
    }

    const [transcriptions, total] = await Promise.all([
      Transcription.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('callId', 'from to startedAt endedAt')
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
  } catch (error: any) {
    logger.error('Error fetching transcriptions:', error);
    res.status(500).json({
      error: 'Failed to fetch transcriptions',
      message: error.message,
    });
  }
};

/**
 * Get transcription details
 * GET /transcriptions/:id
 */
export const getTranscription = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const transcription = await Transcription.findById(id)
      .populate('callId')
      .lean();

    if (!transcription) {
      res.status(404).json({ error: 'Transcription not found' });
      return;
    }

    // Verify user has access to this transcription
    if (req.tenantId !== transcription.tenantId.toString() && req.role !== 'admin') {
      res.status(403).json({ error: 'Forbidden: Access denied to this transcription' });
      return;
    }

    res.json(transcription);
  } catch (error: any) {
    logger.error('Error fetching transcription:', error);
    res.status(500).json({
      error: 'Failed to fetch transcription',
      message: error.message,
    });
  }
};
