import { Router, Request, Response } from 'express';
import mongoose from 'mongoose';
import config from '../config';
import logger from '../utils/logger';

const router = Router();

interface HealthStatus {
  status: 'ok' | 'degraded' | 'down';
  version: string;
  uptime: number;
  timestamp: string;
  services: {
    database: 'connected' | 'disconnected' | 'not_configured';
    redis: 'connected' | 'disconnected' | 'not_configured';
    bland: 'ok' | 'unavailable' | 'not_configured';
  };
}

/**
 * @swagger
 * /health:
 *   get:
 *     summary: Health check endpoint
 *     tags: [Health]
 *     responses:
 *       200:
 *         description: Service is healthy
 */
router.get('/', async (_req: Request, res: Response) => {
  try {
    const healthStatus: HealthStatus = {
      status: 'ok',
      version: config.appVersion,
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
      services: {
        database: mongoose.connection.readyState === 1 ? 'connected' : 'not_configured',
        redis: 'not_configured', // TODO: Check actual Redis connection
        bland: 'not_configured', // TODO: Check Bland API availability
      },
    };

    // Always return ok if server is running
    // Services can be not_configured in development/testing

    const statusCode = healthStatus.status === 'ok' ? 200 : 503;

    res.status(statusCode).json(healthStatus);
  } catch (error) {
    logger.error('Health check error:', error);
    res.status(503).json({
      status: 'down',
      error: 'Health check failed',
    });
  }
});

export default router;
