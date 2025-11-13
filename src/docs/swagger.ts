import swaggerJsdoc from 'swagger-jsdoc';
import config from '../config';

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Voice Assistant API',
      version: config.appVersion,
      description: 'Backend API for Medical Voice Assistant with Bland Voice integration',
      contact: {
        name: 'API Support',
        email: 'support@voiceassistant.com',
      },
    },
    servers: [
      {
        url: `http://localhost:${config.port}`,
        description: 'Development server',
      },
      {
        url: 'https://api.yourcompany.com',
        description: 'Production server',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
    },
    security: [
      {
        bearerAuth: [],
      },
    ],
    tags: [
      {
        name: 'Health',
        description: 'Health check endpoints',
      },
      {
        name: 'Auth',
        description: 'Authentication endpoints',
      },
      {
        name: 'Webhooks',
        description: 'Webhook endpoints for Bland Voice',
      },
      {
        name: 'Admin',
        description: 'Administrative endpoints',
      },
      {
        name: 'Transcription',
        description: 'Transcription endpoints',
      },
    ],
  },
  apis: ['./src/routes/*.ts', './src/controllers/*.ts'],
};

const swaggerSpec = swaggerJsdoc(options);

export default swaggerSpec;
