# VoxAgent Backend - Arquitectura y Estructura del Proyecto

## 📁 Estructura de Directorios

```
VoiceTotemStudioBackend/
├── src/
│   ├── controllers/
│   │   ├── billingController.ts      # Gestión de pagos (emulado/real)
│   │   ├── callsController.ts        # Llamadas para panel interno
│   │   ├── tenantController.ts       # Configuración de clientes
│   │   └── transcriptionsController.ts  # Transcripciones para panel
│   │
│   ├── middleware/
│   │   ├── auth.ts                   # Autenticación JWT
│   │   ├── emulatorAuth.ts          # Auth para emulador de pagos
│   │   ├── errorHandler.ts          # Manejo de errores
│   │   └── requestId.ts             # Request ID tracking
│   │
│   ├── models/
│   │   ├── AuditLog.ts              # Logs de auditoría
│   │   ├── BillingRecord.ts         # Registros de facturación
│   │   ├── CallLog.ts               # Registros de llamadas
│   │   ├── Tenant.ts                # Clientes/tenants
│   │   ├── Transcription.ts         # Transcripciones
│   │   └── User.ts                  # Usuarios del sistema
│   │
│   ├── routes/
│   │   ├── admin.ts                 # Rutas admin (legacy)
│   │   ├── auth.ts                  # Autenticación (login/refresh)
│   │   ├── billing.ts               # Rutas de pagos
│   │   ├── calls.ts                 # ✨ Panel: Llamadas
│   │   ├── contact.ts               # Subida de audio
│   │   ├── health.ts                # Health check
│   │   ├── tenant.ts                # ✨ Panel: Configuración tenant
│   │   ├── transcriptions.ts        # ✨ Panel: Transcripciones
│   │   └── webhooks.ts              # Webhooks Bland + Stripe
│   │
│   ├── services/
│   │   ├── blandService.ts          # Integración Bland Voice API
│   │   └── storageService.ts        # S3 / almacenamiento local
│   │
│   ├── utils/
│   │   ├── encryption.ts            # AES-256, HMAC, hashing
│   │   ├── logger.ts                # Winston logger
│   │   └── paymentsFile.ts          # ✨ Escritura atómica JSON
│   │
│   ├── docs/
│   │   └── swagger.ts               # Configuración Swagger
│   │
│   ├── jobs/
│   │   └── index.ts                 # BullMQ jobs (transcripción, billing)
│   │
│   ├── config/
│   │   └── index.ts                 # Configuración centralizada
│   │
│   ├── app.ts                       # Configuración Express
│   └── server.ts                    # Servidor HTTP + Socket.IO
│
├── tests/
│   ├── integration/
│   │   ├── billing.test.ts          # Tests de pagos emulados
│   │   ├── health.test.ts           # Tests básicos
│   │   └── panel.test.ts            # ✨ Tests panel interno
│   └── setup.ts
│
├── scripts/
│   ├── seed.ts                      # Datos de prueba
│   └── test-payment-emulation.sh   # Script de prueba completo
│
├── docs/
│   ├── API_DOCUMENTATION.md         # Documentación completa de API
│   ├── ARCHITECTURE.md
│   ├── DEPLOYMENT.md
│   └── SECURITY.md
│
├── examples/
│   ├── curl-examples.md             # ✨ Ejemplos curl actualizados
│   └── postman-collection.json
│
├── data/
│   └── payments/                    # ✨ JSON files por día
│       └── payments-YYYY-MM-DD.json
│
├── .env                             # Variables de entorno locales
├── .env.example                     # Template de variables
├── docker-compose.yml               # Docker services
├── Dockerfile                       # Multi-stage build
├── package.json
├── tsconfig.json
├── jest.config.js
└── README.md                        # ✨ Actualizado con panel interno
```

## 🎯 Entregables Completados

### ✅ 1. Estructura src/

- **controllers/**: 4 controladores (billing, calls, tenant, transcriptions)
- **routes/**: 8 rutas (incluyendo 3 nuevas para panel interno)
- **models/**: 6 modelos Mongoose
- **utils/**: Incluyendo `paymentsFile.ts` con escritura atómica

### ✅ 2. Utilidad paymentsFile.ts

**Características:**
- ✅ Escritura atómica (temp file + rename)
- ✅ Mutex en memoria para concurrencia
- ✅ Verificación de idempotencia por `providerPaymentId`
- ✅ Archivos JSON diarios: `payments-YYYY-MM-DD.json`
- ✅ Funciones: `writeAtomic()`, `recordExists()`, `readPaymentsByTenant()`, `getLatestPayment()`

### ✅ 3. Tests con Jest + Supertest

**Archivos de test:**
- `tests/integration/health.test.ts` - Health check básico
- `tests/integration/billing.test.ts` - Tests de pagos emulados (idempotencia, concurrencia 10 requests)
- `tests/integration/panel.test.ts` - ✨ Tests completos del panel interno

**Ejecutar tests:**
```bash
npm test
```

### ✅ 4. Swagger UI en /docs

**Acceso:**
```
http://localhost:4000/docs
```

**Configuración:**
- Definiciones OpenAPI 3.0
- Todos los endpoints documentados
- Ejemplos de request/response
- Modelos de datos

### ✅ 5. README con Quickstart

**Contenido actualizado:**
- ✅ Quickstart completo
- ✅ Ejemplos curl (15 secciones)
- ✅ Deploy en Railway/Render
- ✅ Sección completa de "Emulación de Pagos"
- ✅ Endpoints del Panel Interno documentados

## 🔌 Endpoints del Panel Interno

### Públicos

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| POST | `/auth/login` | Login con email/password → JWT |
| POST | `/billing/create-session` | Crear sesión de pago (test/prod) |
| POST | `/webhooks/stripe-emulator` | Webhook emulado |
| POST | `/webhooks/bland/events` | Webhook Bland Voice |

### Protegidos (JWT)

| Método | Endpoint | Descripción | Query Params |
|--------|----------|-------------|--------------|
| **Llamadas** |
| GET | `/calls` | Lista de llamadas | `tenantId`, `page`, `limit`, `status`, `from`, `to` |
| GET | `/calls/:id` | Detalle + transcripción | - |
| **Transcripciones** |
| GET | `/transcriptions` | Lista con búsqueda | `tenantId`, `page`, `limit`, `search`, `status` |
| GET | `/transcriptions/:id` | Detalle completo | - |
| **Pagos** |
| GET | `/billing/payments` | Historial paginado | `tenantId`, `page`, `limit` |
| GET | `/billing/payments/latest` | Último pago | - |
| **Tenant** |
| GET | `/tenant/:id` | Datos del cliente | - |
| POST | `/tenant/:id/regenerate-key` | Nueva API key | - |
| PATCH | `/tenant/:id` | Actualizar config | - |

## 🔐 Seguridad Implementada

### Autenticación
- ✅ JWT con `access` + `refresh` tokens
- ✅ Verificación de usuario activo
- ✅ Role-based access control (admin, operator)

### Validación
- ✅ Verificación de tenantId en todas las queries
- ✅ Forbidden 403 si usuario intenta acceder a otro tenant
- ✅ CORS con whitelist

### Webhooks
- ✅ Verificación HMAC para Bland
- ✅ X-Emulator-Key para webhook emulado
- ✅ Flag `ALLOW_PAYMENT_EMULATION`

### Logs
- ✅ Winston logger sin PII
- ✅ AuditLog para acciones sensibles
- ✅ Request ID tracking

## 📊 Modelos Mongoose

### User
```typescript
{
  email: string;
  hashedPassword: string;
  name: string;
  role: 'admin' | 'operator' | 'service';
  tenantId: ObjectId;
  isActive: boolean;
}
```

### Tenant
```typescript
{
  name: string;
  apiKey: string;
  isActive: boolean;
  status: 'active' | 'suspended' | 'inactive';
  domain?: string;
  contactEmail: string;
  contactPhone?: string;
  quotaLimits: { maxCallsPerMonth, maxMinutesPerMonth, maxStorageGB };
  currentUsage: { callsThisMonth, minutesThisMonth, storageUsedGB };
  billingMethod: 'stripe' | 'invoice' | 'prepaid';
  settings: { 
    allowRecordings, 
    retentionDays, 
    language, 
    voiceId 
  };
  metadata?: Record<string, any>;
}
```

### CallLog
```typescript
{
  blandCallId: string;
  tenantId: ObjectId;
  userId?: ObjectId;
  from: string;
  to: string;
  status: 'initiated' | 'connected' | 'completed' | 'failed';
  direction: 'inbound' | 'outbound';
  startedAt?: Date;
  endedAt?: Date;
  durationSec?: number;
  cost?: number;
  recordingUrl?: string;
  metadata: { tags, notes, isConfidential };
}
```

### Transcription
```typescript
{
  callId: ObjectId;
  tenantId: ObjectId;
  text: string;
  language: string;
  confidence?: number;
  status: 'processing' | 'completed' | 'failed';
  provider: 'bland' | 'whisper' | 'other';
  chunks?: Array<{ start, end, text, speaker }>;
  processedAt?: Date;
}
```

### BillingRecord
```typescript
{
  tenantId: ObjectId;
  type: 'call' | 'subscription' | 'stripe_payment' | 'emulated_payment';
  amount: number;
  currency: string;
  status: 'pending' | 'paid' | 'failed' | 'refunded';
  gatewayId?: string; // Stripe payment_intent ID
  description?: string;
  metadata?: Record<string, any>;
}
```

## 📝 Variables de Entorno

```env
# App
NODE_ENV=development
PORT=4000

# Database
MONGO_URI=mongodb+srv://...
REDIS_URL=redis://...

# JWT
JWT_SECRET=your-secret-key
JWT_ACCESS_EXPIRES=15m
JWT_REFRESH_EXPIRES=7d

# Bland Voice
BLAND_API_KEY=...
BLAND_API_SECRET=...
BLAND_WEBHOOK_SECRET=...

# Stripe (real)
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PUBLISHABLE_KEY=pk_live_...

# AWS S3
S3_BUCKET=...
AWS_ACCESS_KEY_ID=...
AWS_SECRET_ACCESS_KEY=...

# Emulador de Pagos
PAYMENTS_JSON_PATH=./data/payments
EMULATOR_KEY=dev-emulator-key-123
ALLOW_PAYMENT_EMULATION=true

# CORS
CORS_ORIGIN=http://localhost:5173,http://localhost:3000

# Features
ENABLE_REALTIME=true
ENABLE_STRIPE=false
```

## 🚀 Deployment

### Railway
```bash
railway login
railway init
railway up
```

### Render
1. Conectar repo GitHub
2. Build: `npm install && npm run build`
3. Start: `npm start`
4. Configurar variables de entorno

### Docker
```bash
docker build -t voxagent-backend .
docker run -p 4000:4000 --env-file .env voxagent-backend
```

### Docker Compose
```bash
docker-compose up -d
```

## 📚 Documentación Adicional

- **API_DOCUMENTATION.md**: Documentación completa de todos los endpoints
- **curl-examples.md**: 15+ ejemplos curl listos para copiar
- **ARCHITECTURE.md**: Diseño del sistema
- **DEPLOYMENT.md**: Guías de deploy
- **SECURITY.md**: Consideraciones de seguridad

## 🧪 Testing

```bash
# Todos los tests
npm test

# Con coverage
npm test -- --coverage

# Solo tests de integración
npm run test:integration

# Watch mode
npm run test:watch
```

## ✨ Características Destacadas

1. **Panel Interno Completo**: Endpoints dedicados para llamadas, transcripciones, pagos y configuración
2. **Escritura Atómica de Pagos**: Sistema robusto con mutex e idempotencia
3. **Doble Modo**: Emulación (test) y Stripe real (producción)
4. **Multi-tenant**: Aislamiento completo por tenant con validación JWT
5. **Real-time**: Socket.IO para eventos de pago y llamadas
6. **Swagger UI**: Documentación interactiva en /docs
7. **Tests Completos**: Incluyendo tests de concurrencia (10 requests paralelos)
8. **Docker Ready**: Multi-stage build optimizado
9. **Security First**: CORS, Helmet, Rate Limiting, HMAC verification
10. **Production Ready**: Logging, error handling, audit logs

---

**Made with ❤️ for VoxAgent**
