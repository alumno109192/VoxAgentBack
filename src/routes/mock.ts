import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import {
  getMockAgents,
  getMockAgentById,
  createMockAgent,
  updateMockAgent,
  deleteMockAgent,
  getMockUsage,
  getMockPlan,
  changeMockPlan,
  getMockVoxAgentAI,
  queryMockVoxAgentAI,
  getMockPayments,
} from '../controllers/mockController';

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Mock
 *   description: Mock data endpoints (for development/demo)
 */

// ============ AGENTES ============

/**
 * @swagger
 * /mock/agents:
 *   get:
 *     summary: Get all mock agents
 *     tags: [Mock]
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
 *     responses:
 *       200:
 *         description: List of mock agents
 */
router.get('/agents', authenticate, getMockAgents);

/**
 * @swagger
 * /mock/agents/{id}:
 *   get:
 *     summary: Get mock agent by ID
 *     tags: [Mock]
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
 *         description: Mock agent details
 */
router.get('/agents/:id', authenticate, getMockAgentById);

/**
 * @swagger
 * /mock/agents:
 *   post:
 *     summary: Create mock agent
 *     tags: [Mock]
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
 *     responses:
 *       201:
 *         description: Mock agent created
 */
router.post('/agents', authenticate, createMockAgent);

/**
 * @swagger
 * /mock/agents/{id}:
 *   put:
 *     summary: Update mock agent
 *     tags: [Mock]
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
 *         description: Mock agent updated
 */
router.put('/agents/:id', authenticate, updateMockAgent);

/**
 * @swagger
 * /mock/agents/{id}:
 *   delete:
 *     summary: Delete mock agent
 *     tags: [Mock]
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
 *         description: Mock agent deleted
 */
router.delete('/agents/:id', authenticate, deleteMockAgent);

// ============ USO (ANGELITOS) ============

/**
 * @swagger
 * /mock/usage:
 *   get:
 *     summary: Get mock usage data
 *     tags: [Mock]
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
 *         description: Mock usage data
 */
router.get('/usage', authenticate, getMockUsage);

// ============ PLAN ============

/**
 * @swagger
 * /mock/plan:
 *   get:
 *     summary: Get mock plan data
 *     tags: [Mock]
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
 *         description: Mock plan data
 */
router.get('/plan', authenticate, getMockPlan);

/**
 * @swagger
 * /mock/plan/change:
 *   post:
 *     summary: Change mock plan
 *     tags: [Mock]
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
 *               - newPlan
 *     responses:
 *       200:
 *         description: Mock plan changed
 */
router.post('/plan/change', authenticate, changeMockPlan);

// ============ VOXAGENTAI ============

/**
 * @swagger
 * /mock/voxagentai:
 *   get:
 *     summary: Get mock VoxAgentAI interactions
 *     tags: [Mock]
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
 *         description: Mock VoxAgentAI interactions
 */
router.get('/voxagentai', authenticate, getMockVoxAgentAI);

/**
 * @swagger
 * /mock/voxagentai/query:
 *   post:
 *     summary: Query mock VoxAgentAI
 *     tags: [Mock]
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
 *     responses:
 *       200:
 *         description: Mock VoxAgentAI response
 */
router.post('/voxagentai/query', authenticate, queryMockVoxAgentAI);

// ============ PAGOS ============

/**
 * @swagger
 * /mock/payments:
 *   get:
 *     summary: Get mock payments
 *     tags: [Mock]
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
 *         description: Mock payments list
 */
router.get('/payments', authenticate, getMockPayments);

export default router;
