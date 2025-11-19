import express from 'express';
import {
  transcribeSegment,
  getSessionHistory,
  getAllSessions,
  getTranscriptionStats,
  healthCheck,
} from '../controllers/transcriptionController';
import { authenticate } from '../middleware/auth';
import { validateApiKey } from '../middleware/widgetAuth';

const router = express.Router();

/**
 * @swagger
 * /transcription/segment:
 *   post:
 *     summary: Transcribe audio segment using VAPI
 *     description: Receives audio from widget, sends to VAPI for transcription, saves segment in JSON
 *     tags: [Transcription]
 *     security:
 *       - ApiKeyAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - sessionId
 *               - tenantId
 *               - audioBlob
 *             properties:
 *               sessionId:
 *                 type: string
 *                 description: Session identifier
 *                 example: session-abc123
 *               tenantId:
 *                 type: string
 *                 description: Tenant identifier
 *                 example: test-tenant-001
 *               audioBlob:
 *                 type: string
 *                 description: Base64 encoded audio data
 *               format:
 *                 type: string
 *                 enum: [webm, mp3, wav, ogg]
 *                 default: webm
 *               language:
 *                 type: string
 *                 default: es-ES
 *                 example: es-ES
 *     responses:
 *       200:
 *         description: Transcription successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 text:
 *                   type: string
 *                   example: Hola, ¿cómo estás?
 *                 segmentId:
 *                   type: string
 *                 confidence:
 *                   type: number
 *                   example: 0.95
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *                 metadata:
 *                   type: object
 *                   properties:
 *                     duration:
 *                       type: number
 *                     cost:
 *                       type: number
 *       400:
 *         description: Missing required fields
 *       401:
 *         description: Invalid API Key
 *       500:
 *         description: Transcription error
 */
router.post('/segment', validateApiKey, transcribeSegment);

/**
 * @swagger
 * /transcription/session/{sessionId}:
 *   get:
 *     summary: Get transcription session history
 *     description: Retrieve all segments for a specific transcription session
 *     tags: [Transcription]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: sessionId
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: tenantId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Session history
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 sessionId:
 *                   type: string
 *                 tenantId:
 *                   type: string
 *                 segments:
 *                   type: array
 *                   items:
 *                     type: object
 *                 createdAt:
 *                   type: string
 *                 updatedAt:
 *                   type: string
 *       404:
 *         description: Session not found
 */
router.get('/session/:sessionId', authenticate, getSessionHistory);

/**
 * @swagger
 * /transcription/sessions:
 *   get:
 *     summary: Get all transcription sessions
 *     description: Retrieve all transcription sessions for a tenant
 *     tags: [Transcription]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: tenantId
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 50
 *     responses:
 *       200:
 *         description: List of sessions
 */
router.get('/sessions', authenticate, getAllSessions);

/**
 * @swagger
 * /transcription/stats:
 *   get:
 *     summary: Get transcription statistics
 *     description: Get aggregated statistics for transcriptions
 *     tags: [Transcription]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: tenantId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Transcription statistics
 */
router.get('/stats', authenticate, getTranscriptionStats);

/**
 * @swagger
 * /transcription/health:
 *   get:
 *     summary: Health check for transcription service
 *     description: Check if VAPI integration is working
 *     tags: [Transcription]
 *     responses:
 *       200:
 *         description: Service health status
 */
router.get('/health', healthCheck);

export default router;
