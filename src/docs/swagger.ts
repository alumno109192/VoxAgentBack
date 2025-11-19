import swaggerJsdoc from 'swagger-jsdoc';
import config from '../config';

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'VoiceTotem Studio API',
      version: config.appVersion,
      description: `
# VoiceTotem Studio Backend API

API completa para la plataforma VoiceTotem Studio - Sistema de asistentes de voz con IA.

## Características principales

- 🎙️ **Transcripciones en tiempo real** con VAPI
- 🤖 **Agentes de voz inteligentes** configurables
- 📞 **Gestión de llamadas** y grabaciones
- 💬 **Widget embebible** para sitios web
- 📊 **Analytics y estadísticas** detalladas
- 💳 **Billing integrado** con Stripe
- 🔐 **Autenticación segura** JWT + API Keys

## Autenticación

Esta API utiliza dos métodos de autenticación:

1. **JWT (Bearer Token)**: Para endpoints del panel interno
   - Header: \`Authorization: Bearer <token>\`
   - Obtener token: POST /auth/login

2. **API Key**: Para widget y transcripciones públicas
   - Header: \`X-API-Key: <api-key>\`
   - Obtener API Key: Panel de administración

## Rate Limiting

- Límite general: 100 requests/minuto
- Widget config: 20 requests/minuto
- Widget query: 50 requests/minuto

## Webhooks

Los webhooks están disponibles para:
- Eventos de Bland AI (/webhooks/bland/events)
- Eventos de Stripe (producción)

## Soporte

- Documentación completa: [API_ENDPOINTS.md](./docs/API_ENDPOINTS.md)
- Demos: http://localhost:4000/examples/
- Email: support@voicetotem.com
      `,
      contact: {
        name: 'VoiceTotem Support',
        email: 'support@voicetotem.com',
        url: 'https://voicetotem.com/support',
      },
      license: {
        name: 'MIT',
        url: 'https://opensource.org/licenses/MIT',
      },
    },
    servers: [
      {
        url: `http://localhost:${config.port}`,
        description: 'Development server',
      },
      {
        url: 'https://api.voicetotem.com',
        description: 'Production server',
      },
      {
        url: 'https://staging.api.voicetotem.com',
        description: 'Staging server',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'JWT token obtenido desde /auth/login',
        },
        apiKeyAuth: {
          type: 'apiKey',
          in: 'header',
          name: 'X-API-Key',
          description: 'API Key del tenant para acceso público a widget y transcripciones',
        },
      },
      schemas: {
        Error: {
          type: 'object',
          properties: {
            error: {
              type: 'string',
              description: 'Mensaje de error',
            },
            code: {
              type: 'string',
              description: 'Código de error',
            },
            details: {
              type: 'object',
              description: 'Detalles adicionales del error',
            },
          },
        },
        User: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            email: { type: 'string', format: 'email' },
            role: { type: 'string', enum: ['admin', 'operator', 'user'] },
            tenantId: { type: 'string' },
            createdAt: { type: 'string', format: 'date-time' },
          },
        },
        Agent: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            name: { type: 'string' },
            language: { type: 'string' },
            voice: { type: 'string' },
            status: { type: 'string', enum: ['active', 'inactive', 'archived'] },
            settings: { type: 'object' },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
          },
        },
        Call: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            agentId: { type: 'string' },
            phoneNumber: { type: 'string' },
            duration: { type: 'number', description: 'Duración en segundos' },
            status: { type: 'string', enum: ['queued', 'ringing', 'in-progress', 'completed', 'failed', 'cancelled'] },
            cost: { type: 'number', description: 'Costo en USD' },
            recording: { type: 'string', format: 'uri' },
            transcription: { type: 'string' },
            createdAt: { type: 'string', format: 'date-time' },
          },
        },
        Transcription: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            sessionId: { type: 'string' },
            text: { type: 'string' },
            confidence: { type: 'number', minimum: 0, maximum: 1 },
            language: { type: 'string' },
            duration: { type: 'number', description: 'Duración en segundos' },
            timestamp: { type: 'string', format: 'date-time' },
          },
        },
        Plan: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            name: { type: 'string' },
            price: { type: 'number', description: 'Precio mensual en USD' },
            limits: {
              type: 'object',
              properties: {
                maxCalls: { type: 'number' },
                maxMinutes: { type: 'number' },
                maxAgents: { type: 'number' },
                maxTranscriptions: { type: 'number' },
              },
            },
            features: {
              type: 'array',
              items: { type: 'string' },
            },
          },
        },
        Tenant: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            name: { type: 'string' },
            email: { type: 'string', format: 'email' },
            apiKey: { type: 'string' },
            plan: { type: 'string' },
            settings: { type: 'object' },
            createdAt: { type: 'string', format: 'date-time' },
          },
        },
        WidgetConfig: {
          type: 'object',
          properties: {
            publicKey: { type: 'string' },
            assistantId: { type: 'string' },
            theme: {
              type: 'object',
              properties: {
                primaryColor: { type: 'string' },
                position: { type: 'string', enum: ['bottom-right', 'bottom-left', 'top-right', 'top-left'] },
              },
            },
          },
        },
        Usage: {
          type: 'object',
          properties: {
            period: { type: 'string', description: 'Período (YYYY-MM)' },
            totalCalls: { type: 'number' },
            totalMinutes: { type: 'number' },
            totalTranscriptions: { type: 'number' },
            totalCost: { type: 'number', description: 'Costo total en USD' },
            breakdown: {
              type: 'object',
              properties: {
                callCosts: { type: 'number' },
                transcriptionCosts: { type: 'number' },
                storageCosts: { type: 'number' },
              },
            },
          },
        },
      },
      responses: {
        UnauthorizedError: {
          description: 'Token de autenticación faltante o inválido',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/Error' },
              example: {
                error: 'Unauthorized',
                code: 'AUTH_REQUIRED',
              },
            },
          },
        },
        ForbiddenError: {
          description: 'Acceso denegado - Permisos insuficientes',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/Error' },
              example: {
                error: 'Forbidden',
                code: 'INSUFFICIENT_PERMISSIONS',
              },
            },
          },
        },
        NotFoundError: {
          description: 'Recurso no encontrado',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/Error' },
              example: {
                error: 'Not Found',
                code: 'RESOURCE_NOT_FOUND',
              },
            },
          },
        },
        ValidationError: {
          description: 'Error de validación en los datos enviados',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/Error' },
              example: {
                error: 'Validation Error',
                code: 'VALIDATION_FAILED',
                details: {
                  email: 'Email is required',
                },
              },
            },
          },
        },
        RateLimitError: {
          description: 'Límite de tasa excedido',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/Error' },
              example: {
                error: 'Too Many Requests',
                code: 'RATE_LIMIT_EXCEEDED',
              },
            },
          },
        },
      },
    },
    tags: [
      {
        name: 'Health',
        description: '🏥 Health check y estado del sistema',
      },
      {
        name: 'Auth',
        description: '🔐 Autenticación y gestión de sesiones',
      },
      {
        name: 'Widget',
        description: '🎨 Widget embebible para sitios web',
      },
      {
        name: 'Transcription',
        description: '🎙️ Transcripciones de audio con VAPI',
      },
      {
        name: 'Agents',
        description: '🤖 Gestión de agentes de voz',
      },
      {
        name: 'Calls',
        description: '📞 Llamadas y grabaciones',
      },
      {
        name: 'Billing',
        description: '💳 Facturación y pagos',
      },
      {
        name: 'Plans',
        description: '📦 Planes y suscripciones',
      },
      {
        name: 'Usage',
        description: '📊 Uso y estadísticas',
      },
      {
        name: 'VoxAgentAI',
        description: '🧠 Motor de IA VoxAgent',
      },
      {
        name: 'Tenant',
        description: '🏢 Gestión de tenants',
      },
      {
        name: 'Webhooks',
        description: '🔔 Webhooks de integraciones externas',
      },
      {
        name: 'Admin',
        description: '👑 Endpoints administrativos',
      },
      {
        name: 'Mock',
        description: '🧪 Endpoints mock para desarrollo',
      },
      {
        name: 'Contact',
        description: '📧 Formulario de contacto',
      },
    ],
  },
  apis: ['./src/routes/*.ts', './src/controllers/*.ts'],
};

const swaggerSpec = swaggerJsdoc(options);

export default swaggerSpec;
