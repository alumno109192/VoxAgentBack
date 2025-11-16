import express, { Application } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import config from './config';
import logger from './utils/logger';
import { requestId } from './middleware/requestId';
import { errorHandler, notFound } from './middleware/errorHandler';
import rateLimit from 'express-rate-limit';

// Import routes
import healthRoutes from './routes/health';
import authRoutes from './routes/auth';
import webhookRoutes from './routes/webhooks';
import adminRoutes from './routes/admin';
import contactRoutes from './routes/contact';
import billingRoutes from './routes/billing';
import tenantRoutes from './routes/tenant';
import callsRoutes from './routes/calls';
import transcriptionsRoutes from './routes/transcriptions';

const app: Application = express();

// Security middleware
app.use(helmet());
app.use(
  cors({
    origin: config.cors.origin,
    credentials: true,
  })
);

// Rate limiting
const limiter = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: config.rateLimit.maxRequests,
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

app.use('/api/', limiter);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Compression
app.use(compression());

// Request ID middleware
app.use(requestId);

// Logging middleware
app.use((req, _res, next) => {
  logger.info(`${req.method} ${req.path}`, {
    ip: req.ip,
    userAgent: req.get('user-agent'),
  });
  next();
});

// Routes
app.use('/health', healthRoutes);

// Public endpoints (with /auth prefix as per spec)
app.use('/auth', authRoutes);

// Webhook endpoints (public, no /api prefix)
app.use('/webhooks', webhookRoutes);

// Protected endpoints for panel interno (require JWT)
app.use('/calls', callsRoutes);
app.use('/transcriptions', transcriptionsRoutes);
app.use('/billing', billingRoutes);
app.use('/tenant', tenantRoutes);

// Legacy /api prefix routes (keep for backward compatibility)
app.use('/api/auth', authRoutes);
app.use('/api/webhooks', webhookRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/contact', contactRoutes);
app.use('/api/billing', billingRoutes);

// Swagger documentation
if (config.env !== 'production') {
  const swaggerUi = require('swagger-ui-express');
  const swaggerSpec = require('./docs/swagger');
  
  app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
}

// 404 handler
app.use(notFound);

// Error handler (must be last)
app.use(errorHandler);

export default app;
