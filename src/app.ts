import express, { Application } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import path from 'path';
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
import transcriptionRoutes from './routes/transcription';

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

// Servir archivos estáticos (demos y ejemplos)
if (config.env === 'development') {
  const examplesPath = path.join(__dirname, '..', 'examples');
  app.use('/examples', express.static(examplesPath));
  logger.info('Serving static examples from:', { path: examplesPath });
}

// Public endpoints (with /auth prefix as per spec)
app.use('/auth', authRoutes);

// Webhook endpoints (public, no /api prefix)
app.use('/webhooks', webhookRoutes);

// Widget endpoints (public with API Key validation)
app.use('/widget', widgetRoutes);

// Transcription endpoints (mixed auth: API Key for upload, JWT for admin)
app.use('/transcription', transcriptionRoutes);

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

// Swagger documentation (OpenAPI 3.0)
if (config.env !== 'production') {
  const swaggerUi = require('swagger-ui-express');
  const swaggerSpec = require('./docs/swagger');
  
  // Swagger UI options
  const swaggerOptions = {
    explorer: true,
    customCss: '.swagger-ui .topbar { display: none }',
    customSiteTitle: 'VoiceTotem Studio API Docs',
    swaggerOptions: {
      persistAuthorization: true,
      displayRequestDuration: true,
      filter: true,
      tryItOutEnabled: true,
    },
  };
  
  app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec.default || swaggerSpec, swaggerOptions));
  
  // Endpoint para obtener el spec JSON directamente
  app.get('/docs/swagger.json', (_req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.send(swaggerSpec.default || swaggerSpec);
  });
  
  logger.info('📘 Swagger UI available at /docs');
}

// 404 handler
app.use(notFound);

// Error handler (must be last)
app.use(errorHandler);

export default app;
