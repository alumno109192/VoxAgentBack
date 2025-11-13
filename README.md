# Voice Assistant Backend 🎙️

Backend profesional para Asistente de Voz médico con integración **Bland Voice**, diseñado para atención médica, transcripción de dictados y gestión multi-tenant.

## 🚀 Características

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

### Autenticación

- `POST /api/auth/login` - Login
- `POST /api/auth/refresh` - Refresh token
- `POST /api/auth/logout` - Logout

### Admin (requiere auth)

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

## 📚 Ejemplos de Uso

Ver carpeta `/examples` para:
- ✅ Colección Postman completa
- ✅ Scripts curl
- ✅ Ejemplos de integración cliente
- ✅ Webhooks de test

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
