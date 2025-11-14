import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { checkEmulationAllowed } from '../middleware/emulatorAuth';
import * as billingController from '../controllers/billingController';

const router = Router();

/**
 * @swagger
 * /billing/create-session:
 *   post:
 *     summary: Create a payment session (real or emulated)
 *     tags: [Billing]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - tenantId
 *               - amount
 *             properties:
 *               tenantId:
 *                 type: string
 *                 description: Tenant identifier
 *               amount:
 *                 type: number
 *                 description: Payment amount
 *               currency:
 *                 type: string
 *                 default: USD
 *               description:
 *                 type: string
 *               testMode:
 *                 type: boolean
 *                 default: false
 *                 description: If true, creates an emulated payment session
 *     responses:
 *       200:
 *         description: Session created successfully
 *       400:
 *         description: Invalid request
 *       401:
 *         description: Unauthorized
 */
router.post(
  '/create-session',
  authenticate,
  checkEmulationAllowed,
  billingController.createSession
);

/**
 * @swagger
 * /billing/payments:
 *   get:
 *     summary: Get paginated list of payments
 *     tags: [Billing]
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
 *     responses:
 *       200:
 *         description: Payments list
 *       400:
 *         description: Invalid request
 *       401:
 *         description: Unauthorized
 */
router.get(
  '/payments',
  authenticate,
  billingController.getPayments
);

/**
 * @swagger
 * /billing/payments/latest:
 *   get:
 *     summary: Get the most recent payment
 *     tags: [Billing]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Latest payment
 *       404:
 *         description: No payments found
 *       401:
 *         description: Unauthorized
 */
router.get(
  '/payments/latest',
  authenticate,
  billingController.getLatestPayment
);

export default router;
