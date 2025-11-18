import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { authenticate } from '../middleware/auth';
import { validateApiKey, validateWidgetOrigin } from '../middleware/widgetAuth';
import {
  getWidgetConfig,
  updateWidgetConfig,
  processWidgetQuery,
  getWidgetInteractions,
  getWidgetStats,
} from '../controllers/widgetController';

const router = Router();

/**
 * Rate limiters para endpoints del widget
 */

// Rate limiter para configuración (más permisivo)
const configLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minuto
  max: 30, // 30 requests por minuto
  message: 'Too many configuration requests, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

// Rate limiter para queries (más restrictivo)
const queryLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minuto
  max: 10, // 10 queries por minuto por IP
  message: 'Too many queries, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    // Rate limit por IP + tenantId
    const tenantId = req.query.tenantId || req.body.tenantId || 'unknown';
    return `${req.ip}-${tenantId}`;
  },
});

/**
 * @swagger
 * tags:
 *   name: Widget
 *   description: Widget embebible endpoints (public with API key)
 */

// ============ ENDPOINTS PÚBLICOS (requieren API Key) ============

/**
 * @swagger
 * /widget/config:
 *   get:
 *     summary: Get widget configuration
 *     tags: [Widget]
 *     parameters:
 *       - in: query
 *         name: tenantId
 *         required: true
 *         schema:
 *           type: string
 *         description: Tenant ID
 *     responses:
 *       200:
 *         description: Widget configuration
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 tenantId:
 *                   type: string
 *                 theme:
 *                   type: string
 *                   enum: [light, dark, auto]
 *                 language:
 *                   type: string
 *                 voice:
 *                   type: string
 *                   enum: [male, female, neutral]
 *                 position:
 *                   type: string
 *                   enum: [bottom-right, bottom-left, top-right, top-left]
 *                 primaryColor:
 *                   type: string
 *                 welcomeMessage:
 *                   type: string
 *       400:
 *         description: Missing tenantId
 *       500:
 *         description: Server error
 */
router.get('/config', configLimiter, getWidgetConfig);

/**
 * @swagger
 * /widget/query:
 *   post:
 *     summary: Process widget query
 *     tags: [Widget]
 *     security:
 *       - apiKey: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - tenantId
 *               - apiKey
 *               - query
 *             properties:
 *               tenantId:
 *                 type: string
 *               apiKey:
 *                 type: string
 *               query:
 *                 type: string
 *               mode:
 *                 type: string
 *                 enum: [text, voice]
 *               sessionId:
 *                 type: string
 *               agentId:
 *                 type: string
 *     responses:
 *       200:
 *         description: Query response
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 response:
 *                   type: string
 *                 timestamp:
 *                   type: string
 *                 mode:
 *                   type: string
 *                 metadata:
 *                   type: object
 *       401:
 *         description: Invalid API key
 *       429:
 *         description: Rate limit exceeded
 */
router.post('/query', queryLimiter, validateApiKey, validateWidgetOrigin, processWidgetQuery);

// ============ ENDPOINTS PROTEGIDOS (requieren JWT) ============

/**
 * @swagger
 * /widget/config:
 *   put:
 *     summary: Update widget configuration
 *     tags: [Widget]
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
 *             properties:
 *               tenantId:
 *                 type: string
 *               theme:
 *                 type: string
 *               language:
 *                 type: string
 *               voice:
 *                 type: string
 *               position:
 *                 type: string
 *               primaryColor:
 *                 type: string
 *               welcomeMessage:
 *                 type: string
 *               enabled:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Configuration updated
 */
router.put('/config', authenticate, updateWidgetConfig);

/**
 * @swagger
 * /widget/interactions:
 *   get:
 *     summary: Get widget interactions history
 *     tags: [Widget]
 *     security:
 *       - bearerAuth: []
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
 *         description: Limit number of results
 *     responses:
 *       200:
 *         description: Interactions list
 */
router.get('/interactions', authenticate, getWidgetInteractions);

/**
 * @swagger
 * /widget/stats:
 *   get:
 *     summary: Get widget usage statistics
 *     tags: [Widget]
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
 *         description: Widget statistics
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 total:
 *                   type: number
 *                 today:
 *                   type: number
 *                 thisMonth:
 *                   type: number
 *                 totalCost:
 *                   type: number
 *                 totalTokens:
 *                   type: number
 */
router.get('/stats', authenticate, getWidgetStats);

export default router;
