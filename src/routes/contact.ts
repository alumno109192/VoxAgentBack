import { Router, Response } from 'express';
import multer from 'multer';
import { authenticate, AuthRequest } from '../middleware/auth';
import Transcription from '../models/Transcription';
import CallLog from '../models/CallLog';
import storageService from '../services/storageService';
import logger from '../utils/logger';

const router = Router();

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB
  },
  fileFilter: (_req, file, cb) => {
    const allowedTypes = ['audio/mpeg', 'audio/wav', 'audio/mp3', 'audio/m4a'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only audio files are allowed.'));
    }
  },
});

/**
 * @swagger
 * /api/contact/transcribe:
 *   post:
 *     summary: Upload audio file for transcription
 *     tags: [Transcription]
 */
router.post(
  '/transcribe',
  authenticate,
  upload.single('audio'),
  async (req: AuthRequest, res: Response) => {
    try {
      const file = req.file;
      const { callId, mode } = req.body;

      if (!file) {
        res.status(400).json({ error: 'Audio file is required' });
        return;
      }

      // Upload file to storage
      const fileName = `${Date.now()}-${file.originalname}`;
      const storageKey = await storageService.uploadFile(
        file.buffer,
        fileName,
        file.mimetype
      );

      logger.info(`Audio file uploaded: ${storageKey}`);

      // Create or find call log
      let call;
      if (callId) {
        call = await CallLog.findOne({ _id: callId, tenantId: req.tenantId });
      }

      if (!call) {
        // Create a new call log for manual upload
        call = new CallLog({
          blandCallId: `manual-${Date.now()}`,
          tenantId: req.tenantId,
          userId: req.userId,
          from: 'manual',
          to: 'manual',
          direction: 'inbound',
          status: 'completed',
          recordingUrl: storageKey,
          metadata: {
            isConfidential: false,
            tags: ['manual-upload'],
          },
        });
        await call.save();
      }

      // For now, return a mock transcription
      // In production, this would trigger an async job to process with Whisper/Bland
      const mockTranscription = {
        text: 'This is a placeholder transcription. Integration with transcription service pending.',
        language: 'en',
        status: mode === 'async' ? 'processing' : 'completed',
      };

      if (mode === 'sync') {
        // Synchronous mode (for demo purposes)
        const transcription = new Transcription({
          callId: call.id,
          tenantId: req.tenantId,
          text: mockTranscription.text,
          language: mockTranscription.language,
          status: 'completed',
          provider: 'other',
          chunks: [],
          processedAt: new Date(),
        });

        await transcription.save();

        res.json({
          message: 'Transcription completed',
          callId: call.id,
          transcription,
        });
      } else {
        // Asynchronous mode
        // TODO: Queue transcription job
        res.json({
          message: 'Transcription queued',
          callId: call.id,
          status: 'processing',
        });
      }
    } catch (error) {
      logger.error('Transcription error:', error);
      res.status(500).json({ error: 'Transcription failed' });
    }
  }
);

export default router;
