import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import {
  queryVoxAgentAI,
  getVoxAgentAIStatus,
} from '../controllers/voxagentaiController';

const router = Router();

/**
 * @swagger
 * tags:
 *   name: VoxAgentAI
 *   description: VoxAgentAI embedded queries
 */

/**
 * @swagger
 * /voxagentai/query:
 *   post:
 *     summary: Query VoxAgentAI
 *     tags: [VoxAgentAI]
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
 *               - query
 *             properties:
 *               tenantId:
 *                 type: string
 *               query:
 *                 type: string
 *               mode:
 *                 type: string
 *                 enum: [text, voice]
 *                 default: text
 *               agentId:
 *                 type: string
 *     responses:
 *       200:
 *         description: Query response
 *       429:
 *         description: Query limit reached
 *       403:
 *         description: Forbidden
 */
router.post('/query', authenticate, queryVoxAgentAI);

/**
 * @swagger
 * /voxagentai/status:
 *   get:
 *     summary: Get VoxAgentAI usage status
 *     tags: [VoxAgentAI]
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
 *         description: Status and quota information
 *       403:
 *         description: Forbidden
 */
router.get('/status', authenticate, getVoxAgentAIStatus);

export default router;
