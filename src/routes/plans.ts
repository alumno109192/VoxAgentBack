import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import {
  getCurrentPlan,
  listPlans,
  changePlan,
} from '../controllers/planController';

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Plans
 *   description: Subscription plan management
 */

/**
 * @swagger
 * /plan/current:
 *   get:
 *     summary: Get current plan for a tenant
 *     tags: [Plans]
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
 *         description: Current plan with usage percentages
 *       404:
 *         description: Tenant or plan not found
 */
router.get('/current', authenticate, getCurrentPlan);

/**
 * @swagger
 * /plan:
 *   get:
 *     summary: List all available plans
 *     tags: [Plans]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of active plans
 */
router.get('/', authenticate, listPlans);

/**
 * @swagger
 * /plan/change:
 *   post:
 *     summary: Change tenant plan
 *     tags: [Plans]
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
 *               - newPlanId
 *             properties:
 *               tenantId:
 *                 type: string
 *               newPlanId:
 *                 type: string
 *     responses:
 *       200:
 *         description: Plan changed successfully
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Tenant or plan not found
 */
router.post('/change', authenticate, changePlan);

export default router;
