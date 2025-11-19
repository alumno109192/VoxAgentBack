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
import agentsRoutes from './routes/agents';
import usageRoutes from './routes/usage';
import plansRoutes from './routes/plans';
import voxagentaiRoutes from './routes/voxagentai';
import mockRoutes from './routes/mock';
import widgetRoutes from './routes/widget';
import widgetMockRoutes from './routes/widgetMock';

const app: Application = express();

// Security middleware
app.use(helmet());

// CORS configurado para permitir widgets embebibles
app.use(
  cors({
    origin: (origin, callback) => {
      // Permitir requests sin origen (mobile apps, Postman, curl)
      if (!origin) return callback(null, true);
      
      // Lista de orígenes permitidos
      const allowedOrigins = [
        ...config.cors.origin, // Orígenes configurados
        'http://localhost:3000', // Frontend dev
        'http://localhost:5173', // Vite dev
        'https://example.com', // Cliente ejemplo
        'https://www.example.com',
      ];
      
      // Permitir cualquier origen en desarrollo
      if (config.env === 'development') {
        return callback(null, true);
      }
      
      // Verificar si el origen está permitido
      if (allowedOrigins.some(allowed => origin.startsWith(allowed))) {
        callback(null, true);
      } else {
        callback(null, false);
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-API-Key', 'X-Request-ID'],
    exposedHeaders: ['X-Request-ID'],
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

// Widget endpoints (public with API Key validation)
app.use('/widget', widgetRoutes);

// Protected endpoints for panel interno (require JWT)
app.use('/calls', callsRoutes);
app.use('/transcriptions', transcriptionsRoutes);
app.use('/billing', billingRoutes);
app.use('/tenant', tenantRoutes);
app.use('/agents', agentsRoutes);
app.use('/usage', usageRoutes);
app.use('/plan', plansRoutes);
app.use('/voxagentai', voxagentaiRoutes);

// Mock endpoints (development/demo)
app.use('/mock', mockRoutes);

// Widget mock endpoints (sin autenticación, solo desarrollo)
app.use('/widget-mock', widgetMockRoutes);

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
