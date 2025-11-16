import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import * as tenantController from '../controllers/tenantController';

const router = Router();

// All routes require authentication
router.use(authenticate);

/**
 * @swagger
 * /tenant/{id}:
 *   get:
 *     summary: Get tenant details
 *     tags: [Tenant]
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
 *         description: Tenant details
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Tenant not found
 */
router.get('/:id', tenantController.getTenant);

/**
 * @swagger
 * /tenant/{id}/regenerate-key:
 *   post:
 *     summary: Regenerate tenant API key
 *     tags: [Tenant]
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
 *         description: API key regenerated successfully
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Tenant not found
 */
router.post('/:id/regenerate-key', tenantController.regenerateApiKey);

/**
 * @swagger
 * /tenant/{id}:
 *   patch:
 *     summary: Update tenant settings
 *     tags: [Tenant]
 *     security:
 *       - BearerAuth: []
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
 *             properties:
 *               name:
 *                 type: string
 *               contactEmail:
 *                 type: string
 *               contactPhone:
 *                 type: string
 *               domain:
 *                 type: string
 *               settings:
 *                 type: object
 *               metadata:
 *                 type: object
 *     responses:
 *       200:
 *         description: Tenant updated successfully
 */
router.patch('/:id', tenantController.updateTenant);

export default router;
