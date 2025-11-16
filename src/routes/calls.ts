import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import * as callsController from '../controllers/callsController';

const router = Router();

// All routes require authentication
router.use(authenticate);

/**
 * @swagger
 * /calls:
 *   get:
 *     summary: List calls for a tenant
 *     tags: [Calls]
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
 *         name: status
 *         schema:
 *           type: string
 *           enum: [initiated, connected, completed, failed, no_answer]
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
 *         description: List of calls
 *       400:
 *         description: Missing tenantId parameter
 *       403:
 *         description: Forbidden
 */
router.get('/', callsController.listCalls);

/**
 * @swagger
 * /calls/{id}:
 *   get:
 *     summary: Get call details
 *     tags: [Calls]
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
 *         description: Call details
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Call not found
 */
router.get('/:id', callsController.getCall);

export default router;
