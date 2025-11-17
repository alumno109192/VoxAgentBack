import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import {
  listAgents,
  getAgent,
  createAgent,
  updateAgent,
  deleteAgent,
} from '../controllers/agentsController';

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Agents
 *   description: Virtual agent management
 */

/**
 * @swagger
 * /agents:
 *   get:
 *     summary: List all agents for a tenant
 *     tags: [Agents]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: tenantId
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [active, inactive, training]
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
 *     responses:
 *       200:
 *         description: List of agents
 *       403:
 *         description: Forbidden
 */
router.get('/', authenticate, listAgents);

/**
 * @swagger
 * /agents/{id}:
 *   get:
 *     summary: Get agent by ID
 *     tags: [Agents]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Agent details
 *       404:
 *         description: Agent not found
 */
router.get('/:id', authenticate, getAgent);

/**
 * @swagger
 * /agents:
 *   post:
 *     summary: Create a new agent
 *     tags: [Agents]
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
 *               - name
 *             properties:
 *               tenantId:
 *                 type: string
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               configuration:
 *                 type: object
 *                 properties:
 *                   language:
 *                     type: string
 *                     default: es
 *                   voiceId:
 *                     type: string
 *                   behavior:
 *                     type: string
 *                   temperature:
 *                     type: number
 *                   maxTokens:
 *                     type: number
 *                   welcomeMessage:
 *                     type: string
 *                   fallbackMessage:
 *                     type: string
 *               metadata:
 *                 type: object
 *                 properties:
 *                   knowledgeBase:
 *                     type: array
 *                     items:
 *                       type: string
 *                   tags:
 *                     type: array
 *                     items:
 *                       type: string
 *                   category:
 *                     type: string
 *     responses:
 *       201:
 *         description: Agent created
 *       403:
 *         description: Plan limit reached
 */
router.post('/', authenticate, createAgent);

/**
 * @swagger
 * /agents/{id}:
 *   put:
 *     summary: Update an agent
 *     tags: [Agents]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: Agent updated
 *       404:
 *         description: Agent not found
 */
router.put('/:id', authenticate, updateAgent);

/**
 * @swagger
 * /agents/{id}:
 *   delete:
 *     summary: Delete (deactivate) an agent
 *     tags: [Agents]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Agent deleted
 *       404:
 *         description: Agent not found
 */
router.delete('/:id', authenticate, deleteAgent);

export default router;
