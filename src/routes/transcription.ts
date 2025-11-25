import express from 'express';
import {
  startSession,
  transcribeVapi,
  endSession,
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
 * /transcription/session/start:
 *   post:
 *     summary: Start a new VAPI transcription session
 *     description: Creates a new session in VAPI for real-time transcription
 *     tags: [Transcription - Sessions]
 *     security:
 *       - ApiKeyAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - tenantId
 *               - sessionId
 *             properties:
 *               tenantId:
 *                 type: string
 *                 description: Tenant identifier
 *                 example: test-tenant-001
 *               sessionId:
 *                 type: string
 *                 description: Session identifier
 *                 example: session-abc123
 *               language:
 *                 type: string
 *                 default: es-ES
 *                 example: es-ES
 *               metadata:
 *                 type: object
 *                 description: Additional metadata
 *     responses:
 *       200:
 *         description: Session created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 vapiSessionId:
 *                   type: string
 *                   description: VAPI session ID for sending audio
 *                 sessionId:
 *                   type: string
 *                 status:
 *                   type: string
 *                   enum: [active, inactive, ended]
 *                 createdAt:
 *                   type: string
 *                   format: date-time
 *       400:
 *         description: Missing required fields
 *       503:
 *         description: VAPI service not configured
 */
router.post('/session/start', validateApiKey, startSession);

/**
 * @swagger
 * /transcription/vapi:
 *   post:
 *     summary: Send audio chunk to VAPI session
 *     description: Sends audio to an active VAPI session and receives transcription
 *     tags: [Transcription - Sessions]
 *     security:
 *       - ApiKeyAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - vapiSessionId
 *               - sessionId
 *               - tenantId
 *               - audioBlob
 *             properties:
 *               vapiSessionId:
 *                 type: string
 *                 description: VAPI session ID from start endpoint
 *               sessionId:
 *                 type: string
 *                 description: Internal session identifier
 *               tenantId:
 *                 type: string
 *                 description: Tenant identifier
 *               audioBlob:
 *                 type: string
 *                 description: Base64 encoded audio chunk
 *               sequence:
 *                 type: number
 *                 description: Sequence number for ordering chunks
 *     responses:
 *       200:
 *         description: Audio processed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 text:
 *                   type: string
 *                   description: Transcribed text
 *                 type:
 *                   type: string
 *                   enum: [transcript, partial, final]
 *                 isFinal:
 *                   type: boolean
 *                 confidence:
 *                   type: number
 *                 timestamp:
 *                   type: string
 *       400:
 *         description: Missing required fields or empty audio
 *       404:
 *         description: Session not found or expired
 *       503:
 *         description: VAPI service not available
 */
router.post('/vapi', validateApiKey, transcribeVapi);

/**
 * @swagger
 * /transcription/session/end:
 *   post:
 *     summary: End a VAPI transcription session
 *     description: Closes an active VAPI session and cleans up resources
 *     tags: [Transcription - Sessions]
 *     security:
 *       - ApiKeyAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - vapiSessionId
 *               - sessionId
 *               - tenantId
 *             properties:
 *               vapiSessionId:
 *                 type: string
 *                 description: VAPI session ID
 *               sessionId:
 *                 type: string
 *                 description: Internal session identifier
 *               tenantId:
 *                 type: string
 *                 description: Tenant identifier
 *     responses:
 *       200:
 *         description: Session ended successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 sessionId:
 *                   type: string
 *                 vapiSessionId:
 *                   type: string
 *                 totalSegments:
 *                   type: number
 *                 endedAt:
 *                   type: string
 *       400:
 *         description: Missing required fields
 */
router.post('/session/end', validateApiKey, endSession);

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
