# VoxAgent Backend - API Documentation

**Base URL:** `https://voxagent-backend.onrender.com`

**Version:** 1.0.0

---

## 📋 Tabla de Contenidos

- [Health & Status](#health--status)
- [Authentication](#authentication)
- [Webhooks](#webhooks)
- [Admin - Gestión de Llamadas](#admin---gestión-de-llamadas)
- [Admin - Transcripciones](#admin---transcripciones)
- [Admin - Métricas y Facturación](#admin---métricas-y-facturación)
- [Transcripción de Audio](#transcripción-de-audio)
- [Autenticación y Roles](#autenticación-y-roles)
- [Códigos de Error](#códigos-de-error)
- [Ejemplos de Uso](#ejemplos-de-uso)

---

## 📊 Health & Status

### `GET /health`

Verifica el estado del servidor y servicios conectados.

**Request:**
```bash
GET /health
```

**Response 200:**
```json
{
  "status": "ok",
  "version": "1.0.0",
  "uptime": 123.45,
  "timestamp": "2025-11-13T11:00:00.000Z",
  "services": {
    "database": "not_configured",
    "redis": "not_configured",
    "bland": "not_configured"
  }
}
```

**Estados posibles:**
- `ok` - Servidor operativo
- `degraded` - Algunos servicios no disponibles
- `down` - Servidor con problemas

---

## 🔐 Authentication

### `POST /api/auth/login`

Autenticación de usuario y obtención de tokens JWT.

**Request:**
```bash
POST /api/auth/login
Content-Type: application/json
```

**Body:**
```json
{
  "email": "admin@example.com",
  "password": "Admin123!"
}
```

**Response 200:**
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "507f1f77bcf86cd799439011",
    "email": "admin@example.com",
    "name": "Admin User",
    "role": "admin",
    "tenantId": "507f1f77bcf86cd799439012"
  }
}
```

**Response 401:**
```json
{
  "error": "Invalid credentials"
}
```

---

### `POST /api/auth/refresh`

Renovar access token usando refresh token.

**Request:**
```bash
POST /api/auth/refresh
Content-Type: application/json
```

**Body:**
```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Response 200:**
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Response 401:**
```json
{
  "error": "Invalid refresh token"
}
```

---

### `POST /api/auth/logout`

Cerrar sesión y revocar refresh token.

**Request:**
```bash
POST /api/auth/logout
Authorization: Bearer {accessToken}
```

**Response 200:**
```json
{
  "message": "Logged out successfully"
}
```

---

## 🎯 Webhooks

### `POST /api/webhooks/bland/events`

Recibe eventos de Bland Voice para procesamiento de llamadas y transcripciones.

**Headers:**
```
X-Bland-Signature: {hmac_sha256_signature}
Content-Type: application/json
```

**Eventos Soportados:**

#### 1. Incoming Call
```json
{
  "event": "incoming_call",
  "data": {
    "call_id": "bland-call-123",
    "from": "+1234567890",
    "to": "+0987654321",
    "metadata": {
      "tenant_id": "507f1f77bcf86cd799439012",
      "patient_name": "John Doe"
    }
  }
}
```

#### 2. Call Connected
```json
{
  "event": "call_connected",
  "data": {
    "call_id": "bland-call-123",
    "connected_at": "2025-11-13T10:00:00Z"
  }
}
```

#### 3. Transcription Chunk (Real-time)
```json
{
  "event": "transcription_chunk",
  "data": {
    "call_id": "bland-call-123",
    "text": "Hello, how can I help you?",
    "start": 0,
    "end": 5.2,
    "speaker": "agent"
  }
}
```

#### 4. Transcription Completed
```json
{
  "event": "transcription_completed",
  "data": {
    "call_id": "bland-call-123",
    "transcript": "Full transcription text...",
    "language": "en",
    "confidence": 0.95,
    "duration": 300,
    "chunks": [
      {
        "start": 0,
        "end": 5.2,
        "text": "Hello, how can I help you?",
        "speaker": "agent"
      }
    ]
  }
}
```

#### 5. Call Disconnected
```json
{
  "event": "call_disconnected",
  "data": {
    "call_id": "bland-call-123",
    "disconnected_at": "2025-11-13T10:05:30Z",
    "recording_url": "https://recordings.bland.ai/bland-call-123.mp3"
  }
}
```

#### 6. Error
```json
{
  "event": "error",
  "data": {
    "call_id": "bland-call-123",
    "error_code": "CONNECTION_FAILED",
    "error_message": "Failed to establish connection"
  }
}
```

**Response 200:**
```json
{
  "received": true
}
```

**Response 401:**
```json
{
  "error": "Invalid signature"
}
```

---

## 📞 Admin - Gestión de Llamadas

Todos los endpoints requieren autenticación: `Authorization: Bearer {token}`

### `GET /api/admin/calls`

Lista paginada de llamadas con filtros.

**Query Parameters:**
- `page` (number, default: 1) - Página actual
- `limit` (number, default: 20) - Resultados por página
- `status` (string, optional) - Filtrar por estado: `completed`, `failed`, `initiated`
- `from` (string, optional) - Fecha desde (ISO 8601)

**Request:**
```bash
GET /api/admin/calls?page=1&limit=20&status=completed
Authorization: Bearer {token}
```

**Response 200:**
```json
{
  "data": [
    {
      "_id": "507f1f77bcf86cd799439011",
      "blandCallId": "bland-call-001",
      "tenantId": "507f1f77bcf86cd799439012",
      "userId": "507f1f77bcf86cd799439013",
      "from": "+1234567890",
      "to": "+0987654321",
      "direction": "inbound",
      "status": "completed",
      "startedAt": "2024-11-10T10:00:00Z",
      "endedAt": "2024-11-10T10:05:30Z",
      "durationSec": 330,
      "cost": 0.055,
      "recordingUrl": "recordings/123456-uuid-audio.mp3",
      "metadata": {
        "patientName": "John Doe",
        "patientId": "P-12345",
        "isConfidential": false,
        "tags": ["consultation", "follow-up"]
      },
      "createdAt": "2024-11-10T09:59:00Z",
      "updatedAt": "2024-11-10T10:05:30Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 150,
    "pages": 8
  }
}
```

---

### `GET /api/admin/calls/:id`

Obtener detalles completos de una llamada específica.

**Request:**
```bash
GET /api/admin/calls/507f1f77bcf86cd799439011
Authorization: Bearer {token}
```

**Response 200:**
```json
{
  "_id": "507f1f77bcf86cd799439011",
  "blandCallId": "bland-call-001",
  "tenantId": "507f1f77bcf86cd799439012",
  "userId": {
    "_id": "507f1f77bcf86cd799439013",
    "name": "Dr. Smith",
    "email": "dr.smith@example.com"
  },
  "from": "+1234567890",
  "to": "+0987654321",
  "direction": "inbound",
  "status": "completed",
  "startedAt": "2024-11-10T10:00:00Z",
  "endedAt": "2024-11-10T10:05:30Z",
  "durationSec": 330,
  "cost": 0.055,
  "recordingUrl": "https://presigned-s3-url.com/recording.mp3?expires=3600",
  "metadata": {
    "patientName": "John Doe",
    "patientId": "P-12345",
    "isConfidential": false,
    "tags": ["consultation", "follow-up"],
    "notes": "Patient reports improvement in symptoms"
  },
  "transcription": {
    "_id": "507f1f77bcf86cd799439014",
    "text": "Patient reports improvement in symptoms after starting the new medication...",
    "language": "en",
    "confidence": 0.95,
    "status": "completed",
    "provider": "bland",
    "chunks": [
      {
        "start": 0,
        "end": 5.2,
        "text": "Patient reports improvement in symptoms",
        "speaker": "doctor",
        "confidence": 0.98
      }
    ],
    "processedAt": "2024-11-10T10:06:00Z"
  },
  "createdAt": "2024-11-10T09:59:00Z",
  "updatedAt": "2024-11-10T10:05:30Z"
}
```

**Response 404:**
```json
{
  "error": "Call not found"
}
```

---

### `PATCH /api/admin/calls/:id`

Actualizar metadatos, notas y tags de una llamada.

**Request:**
```bash
PATCH /api/admin/calls/507f1f77bcf86cd799439011
Authorization: Bearer {token}
Content-Type: application/json
```

**Body:**
```json
{
  "notes": "Patient follow-up completed. Scheduled next appointment.",
  "tags": ["follow-up", "resolved", "appointment-scheduled"],
  "isConfidential": true
}
```

**Response 200:**
```json
{
  "message": "Call updated successfully",
  "call": {
    "_id": "507f1f77bcf86cd799439011",
    "metadata": {
      "notes": "Patient follow-up completed. Scheduled next appointment.",
      "tags": ["follow-up", "resolved", "appointment-scheduled"],
      "isConfidential": true
    }
  }
}
```

---

## 📝 Admin - Transcripciones

### `GET /api/admin/transcriptions`

Buscar y filtrar transcripciones con full-text search.

**Query Parameters:**
- `page` (number, default: 1)
- `limit` (number, default: 20)
- `search` (string, optional) - Búsqueda de texto completo

**Request:**
```bash
GET /api/admin/transcriptions?search=medication&page=1&limit=20
Authorization: Bearer {token}
```

**Response 200:**
```json
{
  "data": [
    {
      "_id": "507f1f77bcf86cd799439014",
      "callId": {
        "_id": "507f1f77bcf86cd799439011",
        "from": "+1234567890",
        "to": "+0987654321",
        "startedAt": "2024-11-10T10:00:00Z"
      },
      "tenantId": "507f1f77bcf86cd799439012",
      "text": "Patient reports improvement in symptoms after starting the new medication. Blood pressure is stable.",
      "language": "en",
      "confidence": 0.95,
      "status": "completed",
      "provider": "bland",
      "chunks": [
        {
          "start": 0,
          "end": 5.2,
          "text": "Patient reports improvement in symptoms",
          "speaker": "doctor",
          "confidence": 0.98
        }
      ],
      "metadata": {
        "durationSec": 330,
        "wordCount": 32,
        "processingTimeMs": 1200
      },
      "processedAt": "2024-11-10T10:06:00Z",
      "createdAt": "2024-11-10T10:05:30Z"
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

---

## 📊 Admin - Métricas y Facturación

### `GET /api/admin/metrics`

Obtener métricas y KPIs de los últimos 30 días.

**Request:**
```bash
GET /api/admin/metrics
Authorization: Bearer {token}
```

**Response 200:**
```json
{
  "period": "30_days",
  "metrics": {
    "totalCalls": 150,
    "completedCalls": 142,
    "failedCalls": 8,
    "successRate": 94.67,
    "avgDurationSec": 285.5,
    "totalCost": 7.85
  },
  "recentCalls": [
    {
      "_id": "507f1f77bcf86cd799439011",
      "blandCallId": "bland-call-001",
      "from": "+1234567890",
      "status": "completed",
      "durationSec": 330,
      "cost": 0.055,
      "createdAt": "2024-11-10T10:00:00Z"
    }
  ]
}
```

---

### `POST /api/admin/billing/charge`

Crear un registro de facturación para una llamada.

**Request:**
```bash
POST /api/admin/billing/charge
Authorization: Bearer {token}
Content-Type: application/json
```

**Body:**
```json
{
  "callId": "507f1f77bcf86cd799439011",
  "amount": 0.055,
  "type": "call",
  "description": "Call charge for 5.5 minutes"
}
```

**Response 200:**
```json
{
  "message": "Billing record created",
  "billingRecord": {
    "_id": "507f1f77bcf86cd799439015",
    "tenantId": "507f1f77bcf86cd799439012",
    "callId": "507f1f77bcf86cd799439011",
    "type": "call",
    "amount": 0.055,
    "currency": "USD",
    "status": "pending",
    "description": "Call charge for 5.5 minutes",
    "createdAt": "2024-11-10T10:10:00Z"
  }
}
```

---

## 🎤 Transcripción de Audio

### `POST /api/contact/transcribe`

Subir archivo de audio para transcripción (sync o async).

**Request:**
```bash
POST /api/contact/transcribe
Authorization: Bearer {token}
Content-Type: multipart/form-data
```

**Form Data:**
- `audio` (file) - Archivo de audio (mp3, wav, m4a - max 50MB)
- `callId` (string, optional) - ID de llamada existente
- `mode` (string) - `sync` o `async`

**Response 200 (modo sync):**
```json
{
  "message": "Transcription completed",
  "callId": "507f1f77bcf86cd799439011",
  "transcription": {
    "_id": "507f1f77bcf86cd799439014",
    "text": "This is a placeholder transcription. Integration with transcription service pending.",
    "language": "en",
    "status": "completed",
    "provider": "other",
    "processedAt": "2024-11-10T10:06:00Z"
  }
}
```

**Response 200 (modo async):**
```json
{
  "message": "Transcription queued",
  "callId": "507f1f77bcf86cd799439011",
  "status": "processing"
}
```

**Response 400:**
```json
{
  "error": "Audio file is required"
}
```

---

## 🔒 Autenticación y Roles

### Roles Disponibles

| Role | Descripción | Permisos |
|------|-------------|----------|
| `admin` | Administrador | Acceso completo a todos los endpoints |
| `operator` | Operador | Gestión de llamadas, transcripciones y consultas |
| `service` | Servicio | Solo webhooks y procesos internos |

### Headers Requeridos

Para endpoints autenticados:

```http
Authorization: Bearer {accessToken}
Content-Type: application/json
```

### Token Expiration

- **Access Token:** 15 minutos
- **Refresh Token:** 7 días

---

## ⚠️ Códigos de Error

### Códigos HTTP

| Código | Descripción |
|--------|-------------|
| `200` | Success - Operación exitosa |
| `400` | Bad Request - Datos de entrada inválidos |
| `401` | Unauthorized - Token inválido o expirado |
| `403` | Forbidden - Sin permisos para esta operación |
| `404` | Not Found - Recurso no encontrado |
| `500` | Internal Server Error - Error del servidor |
| `503` | Service Unavailable - Servicio temporalmente no disponible |

### Formato de Respuesta de Error

```json
{
  "error": "Descripción del error",
  "requestId": "550e8400-e29b-41d4-a716-446655440000"
}
```

En modo development, también incluye:

```json
{
  "error": "Descripción del error",
  "requestId": "550e8400-e29b-41d4-a716-446655440000",
  "stack": "Error stack trace..."
}
```

---

## 🧪 Ejemplos de Uso

### cURL

#### Health Check
```bash
curl https://voxagent-backend.onrender.com/health
```

#### Login
```bash
curl -X POST https://voxagent-backend.onrender.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@example.com",
    "password": "Admin123!"
  }'
```

#### Listar Llamadas
```bash
curl https://voxagent-backend.onrender.com/api/admin/calls?page=1&limit=10 \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

#### Obtener Detalle de Llamada
```bash
curl https://voxagent-backend.onrender.com/api/admin/calls/507f1f77bcf86cd799439011 \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

#### Actualizar Llamada
```bash
curl -X PATCH https://voxagent-backend.onrender.com/api/admin/calls/507f1f77bcf86cd799439011 \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  -H "Content-Type: application/json" \
  -d '{
    "notes": "Follow-up completed",
    "tags": ["resolved"],
    "isConfidential": true
  }'
```

#### Transcribir Audio
```bash
curl -X POST https://voxagent-backend.onrender.com/api/contact/transcribe \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  -F "audio=@/path/to/audio.mp3" \
  -F "mode=sync"
```

#### Simular Webhook (Testing)
```bash
curl -X POST https://voxagent-backend.onrender.com/api/webhooks/bland/events \
  -H "Content-Type: application/json" \
  -H "X-Bland-Signature: mock-signature-for-testing" \
  -d '{
    "event": "incoming_call",
    "data": {
      "call_id": "test-call-123",
      "from": "+1234567890",
      "to": "+0987654321",
      "metadata": {
        "tenant_id": "507f1f77bcf86cd799439012",
        "patient_name": "John Doe"
      }
    }
  }'
```

---

### JavaScript/Fetch

```javascript
// Login
const login = async () => {
  const response = await fetch('https://voxagent-backend.onrender.com/api/auth/login', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      email: 'admin@example.com',
      password: 'Admin123!'
    })
  });
  
  const data = await response.json();
  return data.accessToken;
};

// Obtener llamadas
const getCalls = async (token) => {
  const response = await fetch('https://voxagent-backend.onrender.com/api/admin/calls?page=1&limit=20', {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  
  return await response.json();
};

// Usar
const token = await login();
const calls = await getCalls(token);
console.log(calls);
```

---

### Python/Requests

```python
import requests

# Base URL
BASE_URL = "https://voxagent-backend.onrender.com"

# Login
def login():
    response = requests.post(
        f"{BASE_URL}/api/auth/login",
        json={
            "email": "admin@example.com",
            "password": "Admin123!"
        }
    )
    return response.json()["accessToken"]

# Obtener llamadas
def get_calls(token):
    response = requests.get(
        f"{BASE_URL}/api/admin/calls",
        headers={"Authorization": f"Bearer {token}"},
        params={"page": 1, "limit": 20}
    )
    return response.json()

# Usar
token = login()
calls = get_calls(token)
print(calls)
```

---

## 📚 Recursos Adicionales

- **Repositorio:** https://github.com/alumno109192/VoxAgentBack
- **Documentación Swagger:** No disponible en producción (solo desarrollo)
- **Ejemplos adicionales:** Ver carpeta `/examples` en el repositorio

---

## 🔄 Rate Limiting

- **Límite:** 100 requests por 15 minutos por IP
- **Header de respuesta:** `X-RateLimit-Limit`, `X-RateLimit-Remaining`

Cuando se excede el límite:

```json
{
  "error": "Too many requests from this IP, please try again later."
}
```

---

## 🌐 CORS

Dominios permitidos configurables vía `CORS_ORIGIN` environment variable.

Por defecto en producción: `*` (todos los orígenes)

---

## 📝 Notas Importantes

1. **Tokens JWT:** Los access tokens expiran en 15 minutos. Usa el refresh token para obtener uno nuevo.
2. **WebSockets/Socket.IO:** Disponible en puerto 4000 para eventos en tiempo real.
3. **MongoDB:** Actualmente opcional. Endpoints de base de datos no funcionarán sin configuración.
4. **Bland Voice:** Requiere configuración de API keys en variables de entorno.
5. **Transcripciones:** Actualmente mock/placeholder. Requiere integración con servicio real.

---

**Última actualización:** 13 de noviembre de 2025
