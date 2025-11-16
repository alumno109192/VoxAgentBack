import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import * as transcriptionsController from '../controllers/transcriptionsController';

const router = Router();

// All routes require authentication
router.use(authenticate);

/**
 * @swagger
 * /transcriptions:
 *   get:
 *     summary: List transcriptions for a tenant
 *     tags: [Transcriptions]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: tenantId
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Full-text search in transcription text
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [processing, completed, failed]
 *       - in: query
 *         name: from
 *         schema:
 *           type: string
 *           format: date-time
 *       - in: query
 *         name: to
 *         schema:
 *           type: string
 *           format: date-time
 *     responses:
 *       200:
 *         description: List of transcriptions
 *       400:
 *         description: Missing tenantId parameter
 *       403:
 *         description: Forbidden
 */
router.get('/', transcriptionsController.listTranscriptions);

/**
 * @swagger
 * /transcriptions/{id}:
 *   get:
 *     summary: Get transcription details
 *     tags: [Transcriptions]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Transcription details
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Transcription not found
 */
router.get('/:id', transcriptionsController.getTranscription);

export default router;
