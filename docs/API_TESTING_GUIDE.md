# Guía de Pruebas - API del Panel Interno

Esta guía te ayudará a probar todos los endpoints del backend expandido.

---

## 🚀 Inicio Rápido

### 1. Configuración Inicial

```bash
# Clonar e instalar dependencias
cd /path/to/VoiceTotemStudioBackend
npm install

# Configurar variables de entorno
cp .env.example .env
# Editar .env con tus credenciales

# Iniciar servidor de desarrollo
npm run dev
```

El servidor estará disponible en: `http://localhost:4000`

---

## 🔐 Autenticación

### Login (Obtener JWT)

```bash
# Endpoint público - no requiere autenticación
curl -X POST http://localhost:4000/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@voicetotem.com",
    "password": "SecurePassword123"
  }'
```

**Respuesta exitosa:**
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "507f1f77bcf86cd799439011",
    "email": "admin@voicetotem.com",
    "name": "Admin User",
    "role": "admin",
    "tenantId": "507f191e810c19729de860ea"
  }
}
```

**Guardar el `accessToken`** para usarlo en los siguientes requests.

---

## 📞 Endpoints de Llamadas

### 1. Listar Llamadas

```bash
# Requiere JWT en header Authorization
curl -X GET "http://localhost:4000/calls?tenantId=507f191e810c19729de860ea&page=1&limit=20" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

**Parámetros de query:**
- `tenantId` (requerido): ID del tenant
- `page` (opcional): Número de página (default: 1)
- `limit` (opcional): Resultados por página (default: 20)
- `status` (opcional): Filtrar por estado (`initiated`, `connected`, `completed`, `failed`, `no_answer`)
- `from` (opcional): Fecha inicio (ISO 8601)
- `to` (opcional): Fecha fin (ISO 8601)

**Respuesta:**
```json
{
  "data": [
    {
      "_id": "507f1f77bcf86cd799439011",
      "blandCallId": "call_abc123",
      "tenantId": "507f191e810c19729de860ea",
      "from": "+1234567890",
      "to": "+0987654321",
      "status": "completed",
      "direction": "outbound",
      "startedAt": "2024-01-15T10:30:00Z",
      "endedAt": "2024-01-15T10:35:00Z",
      "durationSec": 300,
      "cost": 0.05,
      "currency": "USD",
      "metadata": {
        "patientName": "Juan Pérez",
        "appointmentId": "apt_123",
        "isConfidential": false,
        "tags": ["recordatorio"]
      }
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 45,
    "pages": 3
  }
}
```

### 2. Detalle de Llamada

```bash
curl -X GET http://localhost:4000/calls/507f1f77bcf86cd799439011 \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

**Respuesta:**
```json
{
  "_id": "507f1f77bcf86cd799439011",
  "blandCallId": "call_abc123",
  "from": "+1234567890",
  "to": "+0987654321",
  "status": "completed",
  "durationSec": 300,
  "recordingUrl": "https://s3.amazonaws.com/presigned-url...",
  "transcription": {
    "_id": "507f1f77bcf86cd799439012",
    "text": "Hola, le llamo para confirmar su cita...",
    "language": "es",
    "confidence": 0.95,
    "status": "completed"
  }
}
```

---

## 📝 Endpoints de Transcripciones

### 1. Listar Transcripciones

```bash
curl -X GET "http://localhost:4000/transcriptions?tenantId=507f191e810c19729de860ea&page=1&limit=20" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

**Parámetros adicionales:**
- `search` (opcional): Búsqueda full-text en el texto de transcripción
- `status` (opcional): `processing`, `completed`, `failed`

**Ejemplo con búsqueda:**
```bash
curl -X GET "http://localhost:4000/transcriptions?tenantId=507f191e810c19729de860ea&search=cita+médica" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

### 2. Detalle de Transcripción

```bash
curl -X GET http://localhost:4000/transcriptions/507f1f77bcf86cd799439012 \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

**Respuesta:**
```json
{
  "_id": "507f1f77bcf86cd799439012",
  "callId": {
    "_id": "507f1f77bcf86cd799439011",
    "from": "+1234567890",
    "to": "+0987654321",
    "startedAt": "2024-01-15T10:30:00Z"
  },
  "text": "Hola, le llamo para confirmar su cita médica del martes...",
  "language": "es",
  "confidence": 0.95,
  "chunks": [
    {
      "start": 0,
      "end": 5.2,
      "text": "Hola, le llamo para confirmar su cita",
      "speaker": "agent",
      "confidence": 0.96
    },
    {
      "start": 5.2,
      "end": 8.5,
      "text": "Sí, confirmo",
      "speaker": "user",
      "confidence": 0.94
    }
  ],
  "status": "completed",
  "provider": "bland",
  "metadata": {
    "durationSec": 300,
    "wordCount": 245,
    "processingTimeMs": 1250
  }
}
```

---

## 💳 Endpoints de Billing/Pagos

### 1. Crear Sesión de Pago (Modo Test)

```bash
curl -X POST http://localhost:4000/billing/create-session \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "tenantId": "507f191e810c19729de860ea",
    "amount": 49.99,
    "currency": "USD",
    "description": "Pago mensual - Plan Premium",
    "testMode": true
  }'
```

**Respuesta (modo test):**
```json
{
  "success": true,
  "testMode": true,
  "checkout_url_emulado": "voice-assistant://emulated-checkout/emu_session_xyz123",
  "sessionIdEmu": "emu_session_xyz123",
  "client_secret_emulado": "emu_secret_abc456",
  "billingRecordId": "507f1f77bcf86cd799439013"
}
```

### 2. Simular Webhook de Pago (Emulador)

```bash
# Endpoint público - requiere EMULATOR_KEY
curl -X POST http://localhost:4000/webhooks/stripe-emulator \
  -H "Content-Type: application/json" \
  -H "X-Emulator-Key: dev123" \
  -d '{
    "type": "payment_intent.succeeded",
    "data": {
      "object": {
        "id": "pi_test_xyz123",
        "amount": 4999,
        "currency": "usd",
        "description": "Pago mensual - Plan Premium",
        "metadata": {
          "tenantId": "507f191e810c19729de860ea",
          "sessionIdEmu": "emu_session_xyz123"
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
  "billingRecordId": "507f1f77bcf86cd799439013"
}
```

**Tipos de eventos soportados:**
- `payment_intent.succeeded` → Pago exitoso
- `payment_intent.failed` → Pago fallido

### 3. Listar Historial de Pagos

```bash
curl -X GET "http://localhost:4000/billing/payments?tenantId=507f191e810c19729de860ea&page=1&limit=20" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

**Respuesta:**
```json
{
  "data": [
    {
      "id": "507f1f77bcf86cd799439013",
      "tenantId": "507f191e810c19729de860ea",
      "amount": 49.99,
      "currency": "USD",
      "status": "paid",
      "providerPaymentId": "pi_test_xyz123",
      "description": "Pago mensual - Plan Premium",
      "createdAt": "2024-01-15T10:30:00Z",
      "updatedAt": "2024-01-15T10:31:00Z",
      "source": "database"
    },
    {
      "id": "507f1f77bcf86cd799439014",
      "tenantId": "507f191e810c19729de860ea",
      "amount": 29.99,
      "currency": "USD",
      "status": "succeeded",
      "providerPaymentId": "pi_test_abc456",
      "description": "Pago adicional",
      "createdAt": "2024-01-14T15:20:00Z",
      "source": "json_file"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 12,
    "pages": 1
  }
}
```

---

## 🏢 Endpoints de Tenant

### 1. Obtener Datos del Cliente

```bash
curl -X GET http://localhost:4000/tenant/507f191e810c19729de860ea \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

**Respuesta:**
```json
{
  "_id": "507f191e810c19729de860ea",
  "name": "Clínica Salud Total",
  "apiKey": "vta_live_abc123xyz456def789",
  "isActive": true,
  "status": "active",
  "contactEmail": "admin@clinicasalud.com",
  "contactPhone": "+1234567890",
  "domain": "clinicasalud.com",
  "quotaLimits": {
    "maxCallsPerMonth": 1000,
    "maxMinutesPerMonth": 5000,
    "maxStorageGB": 10
  },
  "currentUsage": {
    "callsThisMonth": 245,
    "minutesThisMonth": 1230,
    "storageUsedGB": 2.5,
    "lastResetDate": "2024-01-01T00:00:00Z"
  },
  "billingMethod": "stripe",
  "settings": {
    "language": "es",
    "voiceId": "es-ES-Standard-A",
    "allowRecordings": true,
    "retentionDays": 90,
    "enableWhisperFallback": false
  },
  "createdAt": "2023-12-01T10:00:00Z",
  "updatedAt": "2024-01-15T08:30:00Z"
}
```

### 2. Regenerar API Key

```bash
curl -X POST http://localhost:4000/tenant/507f191e810c19729de860ea/regenerate-key \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

**Respuesta:**
```json
{
  "message": "API key regenerated successfully",
  "apiKey": "vta_live_new123xyz456def789abc",
  "tenant": {
    "id": "507f191e810c19729de860ea",
    "name": "Clínica Salud Total"
  }
}
```

⚠️ **Importante:** La API key anterior quedará invalidada inmediatamente.

### 3. Actualizar Configuración del Tenant

```bash
curl -X PATCH http://localhost:4000/tenant/507f191e810c19729de860ea \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Clínica Salud Total - Sede Principal",
    "contactEmail": "nuevo@clinicasalud.com",
    "settings": {
      "language": "es-MX",
      "voiceId": "es-MX-Wavenet-A",
      "retentionDays": 120
    },
    "metadata": {
      "department": "Atención al Paciente",
      "customField": "Valor personalizado"
    }
  }'
```

---

## 📡 Webhooks de Bland Voice

### Recibir Eventos de Llamada

```bash
# Endpoint público - verifica firma HMAC en producción
curl -X POST http://localhost:4000/webhooks/bland/events \
  -H "Content-Type: application/json" \
  -H "X-Bland-Signature: sha256=abc123..." \
  -d '{
    "event": "call_disconnected",
    "data": {
      "call_id": "call_abc123",
      "tenant_id": "507f191e810c19729de860ea",
      "from": "+1234567890",
      "to": "+0987654321",
      "disconnected_at": "2024-01-15T10:35:00Z",
      "duration": 300,
      "recording_url": "https://bland.ai/recordings/xyz.mp3"
    }
  }'
```

**Eventos soportados:**
- `incoming_call` - Nueva llamada entrante
- `call_connected` - Llamada conectada
- `transcription_chunk` - Fragmento de transcripción en tiempo real
- `transcription_completed` - Transcripción completa
- `call_disconnected` - Llamada finalizada
- `error` - Error en la llamada

---

## 🔍 Testing con Postman/Insomnia

### Colección de Ejemplo

1. **Crear variable de entorno:**
   - `baseUrl`: `http://localhost:4000`
   - `accessToken`: (dejar vacío, se actualizará después del login)
   - `tenantId`: `507f191e810c19729de860ea`

2. **Test de Login:**
   - POST `{{baseUrl}}/auth/login`
   - Body: JSON con email/password
   - Script post-request: Guardar `accessToken` de la respuesta

3. **Para endpoints protegidos:**
   - Header: `Authorization: Bearer {{accessToken}}`

---

## 🛠️ Resolución de Problemas

### Error 401 - Unauthorized
- Verifica que el token JWT sea válido
- El token expira en 15 minutos (configurable en `JWT_ACCESS_EXPIRES`)
- Usa `/auth/refresh` para renovar el token

### Error 403 - Forbidden
- El usuario no tiene acceso al tenant solicitado
- Verifica que `tenantId` en la query coincida con el del usuario logueado
- Solo usuarios admin pueden acceder a otros tenants

### Error 400 - Missing tenantId
- El parámetro `tenantId` es obligatorio en endpoints de lista
- Incluye `?tenantId=XXX` en la URL

### MongoDB no disponible
- El backend automáticamente usa JSON data source como fallback
- Logs mostrarán: "Using JSON data source for authentication"

---

## 📊 Monitoreo en Tiempo Real

### Socket.IO Events

Si tienes Socket.IO habilitado (`ENABLE_REALTIME=true`), puedes escuchar eventos:

```javascript
const socket = io('http://localhost:4000');

// Evento de pago exitoso
socket.on('payment.succeeded', (data) => {
  console.log('Pago recibido:', data);
});

// Evento de llamada entrante
socket.on('call:incoming', (data) => {
  console.log('Nueva llamada:', data);
});

// Transcripción en tiempo real
socket.on('transcription:chunk', (data) => {
  console.log('Texto:', data.text);
});
```

---

## 📝 Verificación de Archivos JSON

Los pagos emulados se guardan en `./data/payments/`:

```bash
# Ver pagos del día actual
cat ./data/payments/payments-$(date +%Y-%m-%d).json

# Formato: 1 registro JSON por línea
# Ejemplo:
# {"id":"507f...","tenantId":"507f...","amount":49.99,"status":"succeeded",...}
```

---

## 🔐 Seguridad en Producción

**Antes de deployment:**

1. ✅ Cambiar `JWT_SECRET` a valor aleatorio de 32+ caracteres
2. ✅ Configurar `CORS_ORIGIN` con dominio del frontend
3. ✅ Establecer `ALLOW_PAYMENT_EMULATION=false`
4. ✅ Usar API keys reales de Stripe y Bland
5. ✅ Configurar MongoDB en la nube
6. ✅ Habilitar HTTPS
7. ✅ Configurar rate limiting apropiado

---

## 📚 Documentación API Completa

Accede a la documentación Swagger en:
```
http://localhost:4000/docs
```

(Solo disponible en modo desarrollo)
