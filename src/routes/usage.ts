import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import {
  getUsage,
  getUsageSummary,
  recordUsage,
} from '../controllers/usageController';

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Usage
 *   description: Usage tracking (angelitos/minutes consumed)
 */

/**
 * @swagger
 * /usage:
 *   get:
 *     summary: Get usage records for a tenant
 *     tags: [Usage]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: tenantId
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [call, voxagentai, transcription]
 *       - in: query
 *         name: agentId
 *         schema:
 *           type: string
 *       - in: query
 *         name: groupBy
 *         schema:
 *           type: string
 *           enum: [day, month]
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 50
 *     responses:
 *       200:
 *         description: Usage records
 *       403:
 *         description: Forbidden
 */
router.get('/', authenticate, getUsage);

/**
 * @swagger
 * /usage/summary:
 *   get:
 *     summary: Get usage summary with comparisons
 *     tags: [Usage]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: tenantId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Usage summary (current vs last month)
 *       403:
 *         description: Forbidden
 */
router.get('/summary', authenticate, getUsageSummary);

/**
 * @swagger
 * /usage:
 *   post:
 *     summary: Record usage (internal use)
 *     tags: [Usage]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - tenantId
 *               - type
 *               - minutesConsumed
 *             properties:
 *               tenantId:
 *                 type: string
 *               agentId:
 *                 type: string
 *               type:
 *                 type: string
 *                 enum: [call, voxagentai, transcription]
 *               minutesConsumed:
 *                 type: number
 *               callId:
 *                 type: string
 *               metadata:
 *                 type: object
 *     responses:
 *       201:
 *         description: Usage recorded
 *       403:
 *         description: Forbidden
 */
router.post('/', authenticate, recordUsage);

export default router;
