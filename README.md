# Voice Assistant Backend 🎙️

Backend profesional para Asistente de Voz médico con integración **Bland Voice**, diseñado para atención médica, transcripción de dictados y gestión multi-tenant.

---

## 📘 Documentación Actualizada

> **🆕 NUEVO: Documentación completa de API y OpenAPI/Swagger implementado**

### 🔥 Inicio Rápido
- **[DOCS_INDEX.md](./DOCS_INDEX.md)** - 📚 Índice completo de toda la documentación
- **[RESUMEN_ENDPOINTS_OPENAPI.md](./RESUMEN_ENDPOINTS_OPENAPI.md)** - ⭐ Resumen de implementación (empezar aquí)

### 📖 Documentación de API
- **[docs/API_ENDPOINTS.md](./docs/API_ENDPOINTS.md)** - 📋 **61 endpoints documentados** con ejemplos
- **[docs/OPENAPI_GUIDE.md](./docs/OPENAPI_GUIDE.md)** - 🧰 Guía completa de Swagger/OpenAPI
- **Swagger UI** - 🌐 http://localhost:4000/docs (documentación interactiva)

### 🚀 Scripts Rápidos
```bash
# Abrir Swagger UI (documentación interactiva)
./scripts/start-swagger.sh

# Abrir demos del widget VAPI
./scripts/start-with-demos.sh
```

---

## 🚀 Características

### Panel Interno del Cliente
- ✅ **Gestión de Llamadas** - Historial completo con filtros y paginación
- ✅ **Transcripciones** - Búsqueda y análisis de texto
- ✅ **Facturación** - Historial de pagos y suscripciones
- ✅ **Configuración** - Gestión de tenant y API keys

### Gestión de Agentes Virtuales
- ✅ **CRUD Completo** - Crear, editar, listar y eliminar agentes
- ✅ **Configuración Avanzada** - Language, voice, behavior, temperature
- ✅ **Estadísticas** - Total de llamadas, minutos, última actividad
- ✅ **Límites por Plan** - Control de cantidad de agentes según suscripción
- ✅ **Categorización** - Tags, categorías y knowledge base

### Sistema de Uso (Angelitos)
- ✅ **Tracking de Minutos** - Consumo por tipo (call, voxagentai, transcription)
- ✅ **Analytics** - Agrupación por día/mes para gráficos
- ✅ **Comparativas** - Mes actual vs mes anterior con porcentajes
- ✅ **Breakdown** - Desglose por tipo de servicio

### Gestión de Planes
- ✅ **4 Planes** - Free, Starter, Professional, Enterprise
- ✅ **Límites Configurables** - Agentes, minutos, llamadas, storage, queries
- ✅ **Cambio de Plan** - Upgrade/downgrade con actualización de quotas
- ✅ **Porcentajes de Uso** - Visualización de consumo vs límites

### VoxAgentAI Embebido
- ✅ **Queries Text/Voice** - Consultas en modo texto o voz
- ✅ **Rate Limiting** - Control de cuota por plan
- ✅ **Usage Tracking** - Registro de tokens y costos
- ✅ **Status Endpoint** - Consultar cuota disponible y estadísticas

### Widget Embebible
- ✅ **Configuración Personalizada** - Theme, idioma, posición, colores
- ✅ **Consultas VoxAgentAI** - Integración con motor de IA
- ✅ **Autenticación API Key** - Seguridad con X-API-Key header
- ✅ **CORS Configurado** - Embebible en cualquier dominio autorizado
- ✅ **Almacenamiento JSON** - Configuración y logs por tenant
- ✅ **Endpoints Mock** - Para desarrollo y demos

### Transcripción de Audio (VAPI)
- ✅ **Integración VAPI API** - Transcripción speech-to-text
- ✅ **Almacenamiento por Sesión** - JSON por conversación
- ✅ **Metadatos Detallados** - Palabras, timing, confianza
- ✅ **Cálculo de Costos** - ~$0.006 USD por minuto
- ✅ **Modo Mock** - Fallback para desarrollo sin VAPI
- ✅ **Endpoints Administrativos** - Historial, sesiones, estadísticas

### Infraestructura
- ✅ **Integración Bland Voice** con webhook handling
- ✅ **Transcripción** de llamadas (streaming y post-call)
- ✅ **Multi-tenant** con quotas y API keys
- ✅ **Autenticación JWT** con RBAC
- ✅ **Storage S3** para grabaciones
- ✅ **Real-time** con Socket.IO
- ✅ **BullMQ** para procesamiento asíncrono
- ✅ **Seguridad**: Rate limiting, HMAC verification, encryption PII/PHI
- ✅ **Docker** multi-stage optimizado
- ✅ **Tests** (Jest + Supertest)
- ✅ **OpenAPI/Swagger** docs
- ✅ **Deploy-ready** para Railway, Render, Fly.io

## 📋 Requisitos

- Node.js >= 18
- MongoDB >= 5.0
- Redis >= 6.0
- (Opcional) AWS S3 o Supabase para storage

## 🏗️ Stack Tecnológico

- **Runtime**: Node.js 20 + TypeScript
- **Framework**: Express.js
- **Database**: MongoDB (Mongoose)
- **Cache/Queue**: Redis + BullMQ
- **Real-time**: Socket.IO
- **Storage**: AWS S3 (con fallback local)
- **Auth**: JWT + bcrypt
- **Validation**: Zod/Joi
- **Testing**: Jest + Supertest
- **Docs**: Swagger UI

## 📦 Instalación

### Local (sin Docker)

```bash
# Clonar repositorio
git clone <your-repo>
cd voice-assistant-backend

# Instalar dependencias
npm install

# Configurar variables de entorno
cp .env.example .env
# Editar .env con tus credenciales

# Iniciar servicios (MongoDB y Redis deben estar corriendo)
npm run dev
```

### Con Docker Compose (Recomendado)

```bash
# Clonar repositorio
git clone <your-repo>
cd voice-assistant-backend

# Configurar .env
cp .env.example .env
# Editar .env con tus credenciales

# Iniciar todos los servicios
docker-compose up -d

# Ver logs
docker-compose logs -f app

# Detener servicios
docker-compose down
```

## 🔧 Configuración

### Variables de entorno esenciales

```env
# Application
NODE_ENV=development
PORT=4000

# Database
MONGO_URI=mongodb://localhost:27017/voice-assistant
REDIS_URL=redis://localhost:6379

# JWT
JWT_SECRET=your-super-secret-jwt-key

# Bland Voice
BLAND_API_KEY=your-bland-api-key
BLAND_API_SECRET=your-bland-api-secret
BLAND_WEBHOOK_SECRET=your-bland-webhook-secret

# AWS S3 (opcional)
AWS_ACCESS_KEY_ID=your-aws-key
AWS_SECRET_ACCESS_KEY=your-aws-secret
S3_BUCKET=your-bucket-name
S3_REGION=us-east-1
```

Ver `.env.example` para configuración completa.

## 🎯 Quickstart

### 1. Iniciar servidor

```bash
npm run dev
```

El servidor estará disponible en `http://localhost:4000`

### 2. Verificar salud

```bash
curl http://localhost:4000/health
```

### 3. Ver documentación API

Abre en navegador: `http://localhost:4000/docs`

### 4. Crear usuario admin (seed)

```bash
npm run seed
```

### 5. Login

```bash
curl -X POST http://localhost:4000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@example.com",
    "password": "Admin123!"
  }'
```

## 📡 Endpoints Principales

### Públicos

- `GET /health` - Health check
- `POST /webhooks/bland/events` - Webhook de Bland Voice
- `POST /webhooks/stripe-emulator` - Webhook emulado de Stripe (modo dev)

### Autenticación

- `POST /auth/login` - Login (devuelve JWT)
- `POST /auth/refresh` - Refresh token
- `POST /auth/logout` - Logout

### Panel Interno del Cliente (requiere JWT)

**Llamadas:**
- `GET /calls?tenantId=` - Lista de llamadas con filtros
- `GET /calls/:id` - Detalle completo de llamada con transcripción

**Transcripciones:**
- `GET /transcriptions?tenantId=` - Lista con búsqueda full-text
- `GET /transcriptions/:id` - Detalle de transcripción

**Pagos:**
- `POST /billing/create-session` - Crear sesión (modo test/prod)
- `GET /billing/payments?tenantId=` - Historial de pagos
- `GET /billing/payments/latest` - Último pago

**Tenant (configuración):**
- `GET /tenant/:id` - Datos del cliente (idioma, voz, quotas)
- `POST /tenant/:id/regenerate-key` - Nueva API key
- `PATCH /tenant/:id` - Actualizar configuración

### Admin (legacy, requiere auth)

- `GET /api/admin/calls` - Listar llamadas
- `GET /api/admin/calls/:id` - Detalle de llamada
- `PATCH /api/admin/calls/:id` - Actualizar metadatos
- `GET /api/admin/transcriptions` - Buscar transcripciones
- `GET /api/admin/metrics` - Métricas de uso
- `POST /api/admin/billing/charge` - Crear cargo

### Transcripción

- `POST /api/contact/transcribe` - Subir audio para transcribir

## 🧪 Tests

```bash
# Ejecutar todos los tests
npm test

# Tests con watch mode
npm run test:watch

# Tests de integración
npm run test:integration

# Coverage
npm test -- --coverage
```

## 🔐 Seguridad

### HMAC Webhook Verification

Los webhooks de Bland se verifican con HMAC SHA-256:

```typescript
X-Bland-Signature: <hmac_sha256_hex>
```

### Rate Limiting

- 100 requests / 15 minutos por IP
- Configurable vía `RATE_LIMIT_*` env vars

### Encriptación PII/PHI

Datos sensibles se cifran con AES-256-GCM:

```typescript
import { encrypt, decrypt } from './utils/encryption';

const encrypted = encrypt(sensitiveData);
const decrypted = decrypt(encrypted);
```

### Roles y Permisos

- `admin`: Acceso completo
- `operator`: Gestión de llamadas y transcripciones
- `service`: Solo webhooks y servicios internos

## 🚀 Deployment

### Railway

```bash
# Instalar Railway CLI
npm i -g @railway/cli

# Login
railway login

# Deploy
railway up
```

### Render

1. Conectar repo en Render Dashboard
2. Configurar como "Web Service"
3. Build Command: `npm install && npm run build`
4. Start Command: `npm start`
5. Añadir variables de entorno

### Fly.io

```bash
# Instalar flyctl
curl -L https://fly.io/install.sh | sh

# Login
fly auth login

# Deploy
fly launch
fly deploy
```

## 🧪 Testing Webhooks con ngrok

```bash
# Instalar ngrok
npm install -g ngrok

# Exponer puerto local
ngrok http 4000

# Copiar URL HTTPS (ej: https://abc123.ngrok.io)
# Configurar en Bland dashboard:
# Webhook URL: https://abc123.ngrok.io/api/webhooks/bland/events
```

### Simular evento de Bland

```bash
curl -X POST http://localhost:4000/api/webhooks/bland/events \
  -H "Content-Type: application/json" \
  -H "X-Bland-Signature: mock-signature" \
  -d '{
    "event": "incoming_call",
    "data": {
      "call_id": "test-123",
      "from": "+1234567890",
      "to": "+0987654321",
      "metadata": {
        "tenant_id": "tenant-id-here"
      }
    }
  }'
```

## 📊 Monitoreo

### Prometheus Metrics

Endpoint: `GET /metrics` (si está habilitado)

### Logs

Los logs se guardan en:
- `logs/application-YYYY-MM-DD.log`
- `logs/error-YYYY-MM-DD.log`

### Sentry (opcional)

Configurar `SENTRY_DSN` en `.env` para tracking de errores.

## 🔒 HIPAA/GDPR Compliance Checklist

### Pre-producción

- [ ] Habilitar HTTPS/TLS obligatorio
- [ ] Configurar cifrado en tránsito (mínimo TLS 1.2)
- [ ] Cifrar datos PII/PHI en base de datos
- [ ] Implementar logging de accesos (AuditLog)
- [ ] Configurar retention policies
- [ ] Verificar backup y disaster recovery
- [ ] Firmar BAA con proveedores (Bland, AWS, etc.)
- [ ] Implementar 2FA para admins
- [ ] Realizar penetration testing
- [ ] Documentar procesos de consent y data deletion
- [ ] Configurar alertas de seguridad
- [ ] Revisar permisos de roles

### En Producción

- [ ] Monitoreo 24/7 con alertas
- [ ] Logs de auditoría inmutables
- [ ] Backup automático diario
- [ ] Plan de incident response
- [ ] Revisiones de seguridad trimestrales

## 💳 Emulación de Pagos (Modo Test)

El backend soporta emulación de pasarela de pagos para **testing sin necesidad de claves reales de Stripe**. Esto permite al frontend probar flujos de pago completos sin cargos reales.

### Configuración

```env
# Habilitar emulación
ALLOW_PAYMENT_EMULATION=true

# Clave secreta para el emulador (cambiar en producción)
EMULATOR_KEY=dev-emulator-key-123

# Directorio para persistir pagos emulados
PAYMENTS_JSON_PATH=./data/payments
```

### 1. Crear Sesión de Pago Emulada

```bash
curl -X POST http://localhost:4000/api/billing/create-session \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "tenantId": "tenant-123",
    "amount": 100,
    "currency": "USD",
    "description": "Pago de prueba",
    "testMode": true
  }'
```

**Respuesta:**

```json
{
  "success": true,
  "testMode": true,
  "checkout_url_emulado": "voice-assistant://emulated-checkout/emu_session_abc123",
  "sessionIdEmu": "emu_session_abc123",
  "client_secret_emulado": "emu_secret_xyz789",
  "billingRecordId": "65f1a2b3c4d5e6f7g8h9i0j1"
}
```

### 2. Simular Pago Exitoso

Desde tu frontend o con curl, simula el webhook de Stripe:

```bash
curl -X POST http://localhost:4000/api/webhooks/stripe-emulator \
  -H "Content-Type: application/json" \
  -H "X-Emulator-Key: dev-emulator-key-123" \
  -d '{
    "type": "payment_intent.succeeded",
    "data": {
      "object": {
        "id": "pi_emulated_123456",
        "amount": 10000,
        "currency": "usd",
        "description": "Pago emulado",
        "metadata": {
          "tenantId": "tenant-123",
          "sessionIdEmu": "emu_session_abc123"
        }
      }
    }
  }'
```

**Respuesta:**

```json
{
  "received": true,
  "status": "succeeded",
  "billingRecordId": "65f1a2b3c4d5e6f7g8h9i0j1"
}
```

### 3. Simular Pago Fallido

```bash
curl -X POST http://localhost:4000/api/webhooks/stripe-emulator \
  -H "Content-Type: application/json" \
  -H "X-Emulator-Key: dev-emulator-key-123" \
  -d '{
    "type": "payment_intent.failed",
    "data": {
      "object": {
        "id": "pi_failed_123456",
        "amount": 5000,
        "currency": "usd",
        "last_payment_error": {
          "message": "Insufficient funds"
        },
        "metadata": {
          "tenantId": "tenant-123"
        }
      }
    }
  }'
```

### 4. Consultar Pagos

```bash
# Listar pagos de un tenant (paginado)
curl -X GET "http://localhost:4000/api/billing/payments?tenantId=tenant-123&page=1&limit=20" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# Obtener último pago
curl -X GET http://localhost:4000/api/billing/payments/latest \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Características del Emulador

- ✅ **Idempotencia**: Múltiples webhooks con el mismo `providerPaymentId` solo crean un registro
- ✅ **Concurrencia**: Escrituras atómicas con mutex en memoria (single-instance)
- ✅ **Persistencia**: Registros JSON por día (`payments-YYYY-MM-DD.json`)
- ✅ **Real-time**: Emite eventos Socket.IO (`payment.succeeded`, `payment.failed`)
- ✅ **Testing**: Tests de integración con 10 requests concurrentes

### Modo Producción

Para usar **Stripe real** en producción:

1. Configurar claves reales:

```env
STRIPE_SECRET_KEY=sk_live_your_stripe_secret_key
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret
STRIPE_PUBLISHABLE_KEY=pk_live_your_publishable_key
ENABLE_STRIPE=true
```

2. Crear sesión sin `testMode`:

```bash
curl -X POST http://localhost:4000/api/billing/create-session \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "tenantId": "tenant-123",
    "amount": 100,
    "currency": "USD",
    "description": "Pago real",
    "testMode": false
  }'
```

**Respuesta:**

```json
{
  "success": true,
  "testMode": false,
  "checkout_url": "https://checkout.stripe.com/pay/cs_live_abc123...",
  "sessionId": "cs_live_abc123...",
  "billingRecordId": "65f1a2b3c4d5e6f7g8h9i0j1"
}
```

3. Configurar webhook real en Stripe Dashboard apuntando a:
   ```
   https://your-domain.com/api/webhooks/stripe
   ```

### Seguridad

- 🔐 El emulador **solo funciona** si `ALLOW_PAYMENT_EMULATION=true`
- 🔐 Requiere header `X-Emulator-Key` que coincida con `EMULATOR_KEY`
- 🔐 En producción, **deshabilitar emulación** (`ALLOW_PAYMENT_EMULATION=false`)
- 🔐 Cambiar `EMULATOR_KEY` a un valor secreto fuerte

## 📚 Ejemplos de Uso

Ver carpeta `/examples` para:
- ✅ Colección Postman completa
- ✅ Scripts curl
- ✅ Ejemplos de integración cliente
- ✅ Webhooks de test
- ✅ Flujos de pago emulado

## 🤝 Contribuir

1. Fork del proyecto
2. Crear feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit cambios (`git commit -m 'Add AmazingFeature'`)
4. Push al branch (`git push origin feature/AmazingFeature`)
5. Abrir Pull Request

## 📄 Licencia

MIT License - ver archivo `LICENSE`

## 💬 Soporte

- 📧 Email: support@yourcompany.com
- 📖 Docs: https://docs.yourcompany.com
- 🐛 Issues: https://github.com/yourorg/voice-assistant-backend/issues

---

**Made with ❤️ for healthcare professionals**
