# 📚 Documentación Completa de Endpoints - VoiceTotem Studio Backend

> **Última actualización:** 19 de noviembre de 2025  
> **Versión de la API:** 1.0.0  
> **Base URL:** `http://localhost:4000`  
> **Documentación Interactiva:** `http://localhost:4000/docs`

---

## 🔍 Índice

- [Autenticación](#autenticación)
- [Health & Status](#health--status)
- [Widget (Público)](#widget-público)
- [Transcripciones](#transcripciones)
- [Agentes](#agentes)
- [Llamadas](#llamadas)
- [Billing](#billing)
- [Planes](#planes)
- [Uso/Usage](#usoUsage)
- [VoxAgentAI](#voxagentai)
- [Tenant](#tenant)
- [Webhooks](#webhooks)
- [Admin](#admin)
- [Mock/Development](#mockdevelopment)
- [Contacto](#contacto)

---

## 🔐 Métodos de Autenticación

| Tipo | Header | Formato | Uso |
|------|--------|---------|-----|
| **JWT** | `Authorization` | `Bearer <token>` | Endpoints del panel interno |
| **API Key** | `X-API-Key` | `<api-key>` | Widget y transcripciones públicas |

---

## 🏥 Health & Status

### GET `/health`
**Descripción:** Verifica el estado del servidor  
**Autenticación:** ❌ Pública  
**Respuesta:**
```json
{
  "status": "ok",
  "timestamp": "2025-11-19T10:30:00.000Z",
  "version": "1.0.0"
}
```

---

## 🔑 Autenticación

### POST `/auth/login`
**Descripción:** Iniciar sesión y obtener JWT  
**Autenticación:** ❌ Pública  
**Body:**
```json
{
  "email": "user@example.com",
  "password": "securePassword123"
}
```
**Respuesta:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "refresh_token_here",
  "user": {
    "id": "user_123",
    "email": "user@example.com",
    "role": "admin"
  }
}
```

### POST `/auth/refresh`
**Descripción:** Refrescar token JWT  
**Autenticación:** ❌ Pública (requiere refreshToken)  
**Body:**
```json
{
  "refreshToken": "refresh_token_here"
}
```

### POST `/auth/logout`
**Descripción:** Cerrar sesión  
**Autenticación:** ✅ JWT  
**Body:** `{}`

---

## 🎨 Widget (Público)

### GET `/widget/config`
**Descripción:** Obtener configuración del widget VAPI  
**Autenticación:** ❌ Pública (con rate limit)  
**Respuesta:**
```json
{
  "publicKey": "a8e14149-23ab-405d-afb9-b0889aa1f58c",
  "assistantId": "901c39a3-a56f-4554-8d75-fb41d0c83e11",
  "theme": {
    "primaryColor": "#4F46E5",
    "position": "bottom-right"
  }
}
```

### POST `/widget/query`
**Descripción:** Procesar consulta del widget  
**Autenticación:** 🔑 API Key  
**Headers:** `X-API-Key: <tenant-api-key>`  
**Body:**
```json
{
  "query": "¿Cuál es el horario de atención?",
  "sessionId": "session_123",
  "context": {
    "userAgent": "Mozilla/5.0...",
    "language": "es"
  }
}
```

### PUT `/widget/config`
**Descripción:** Actualizar configuración del widget  
**Autenticación:** ✅ JWT  
**Body:**
```json
{
  "theme": {
    "primaryColor": "#FF6B6B",
    "position": "bottom-left"
  },
  "settings": {
    "autoOpen": false,
    "welcomeMessage": "¡Hola! ¿En qué puedo ayudarte?"
  }
}
```

### GET `/widget/interactions`
**Descripción:** Listar interacciones del widget  
**Autenticación:** ✅ JWT  
**Query params:** `?limit=50&offset=0&startDate=2025-11-01&endDate=2025-11-19`

### GET `/widget/stats`
**Descripción:** Estadísticas de uso del widget  
**Autenticación:** ✅ JWT  
**Respuesta:**
```json
{
  "totalInteractions": 1245,
  "averageSessionDuration": 180,
  "topQueries": [
    { "query": "horarios", "count": 45 },
    { "query": "precios", "count": 38 }
  ],
  "satisfactionRate": 4.5
}
```

---

## 🎙️ Transcripciones

### POST `/transcription/segment`
**Descripción:** Transcribir segmento de audio (endpoint principal)  
**Autenticación:** 🔑 API Key  
**Headers:** `X-API-Key: <tenant-api-key>`  
**Body (multipart/form-data):**
```
audioFile: <binary>
sessionId: "session_123"
language: "es-ES"
```
**Respuesta:**
```json
{
  "transcriptionId": "trans_456",
  "text": "Hola, necesito información sobre los servicios",
  "confidence": 0.95,
  "language": "es-ES",
  "duration": 3.5,
  "timestamp": "2025-11-19T10:30:00.000Z"
}
```

### GET `/transcription/health`
**Descripción:** Health check del servicio de transcripción  
**Autenticación:** ❌ Pública  

### GET `/transcription/session/:sessionId`
**Descripción:** Obtener historial de transcripciones de una sesión  
**Autenticación:** ✅ JWT  
**Respuesta:**
```json
{
  "sessionId": "session_123",
  "transcriptions": [
    {
      "id": "trans_456",
      "text": "Hola...",
      "timestamp": "2025-11-19T10:30:00.000Z"
    }
  ],
  "totalSegments": 15,
  "totalDuration": 180
}
```

### GET `/transcription/sessions`
**Descripción:** Listar todas las sesiones de transcripción  
**Autenticación:** ✅ JWT  
**Query params:** `?limit=50&offset=0`

### GET `/transcription/stats`
**Descripción:** Estadísticas de transcripciones  
**Autenticación:** ✅ JWT  
**Respuesta:**
```json
{
  "totalTranscriptions": 5420,
  "totalDuration": 18500,
  "averageConfidence": 0.92,
  "languageDistribution": {
    "es-ES": 3200,
    "en-US": 2220
  }
}
```

### GET `/transcriptions`
**Descripción:** Listar transcripciones (endpoint alternativo)  
**Autenticación:** ✅ JWT  
**Query params:** `?limit=50&offset=0&startDate=2025-11-01`

### GET `/transcriptions/:id`
**Descripción:** Obtener transcripción específica  
**Autenticación:** ✅ JWT  

---

## 🤖 Agentes

### GET `/agents`
**Descripción:** Listar todos los agentes de voz  
**Autenticación:** ✅ JWT  
**Respuesta:**
```json
{
  "agents": [
    {
      "id": "agent_123",
      "name": "Agente Recepción",
      "language": "es-ES",
      "voice": "es-ES-Standard-A",
      "status": "active",
      "createdAt": "2025-11-01T00:00:00.000Z"
    }
  ],
  "total": 5
}
```

### GET `/agents/:id`
**Descripción:** Obtener detalles de un agente  
**Autenticación:** ✅ JWT  

### POST `/agents`
**Descripción:** Crear nuevo agente  
**Autenticación:** ✅ JWT  
**Body:**
```json
{
  "name": "Agente Atención al Cliente",
  "language": "es-ES",
  "voice": "es-ES-Neural2-A",
  "settings": {
    "speed": 1.0,
    "pitch": 0,
    "responseDelay": 500
  }
}
```

### PUT `/agents/:id`
**Descripción:** Actualizar agente existente  
**Autenticación:** ✅ JWT  

### DELETE `/agents/:id`
**Descripción:** Eliminar agente  
**Autenticación:** ✅ JWT  

---

## 📞 Llamadas

### GET `/calls`
**Descripción:** Listar todas las llamadas  
**Autenticación:** ✅ JWT  
**Query params:** `?limit=50&offset=0&status=completed&startDate=2025-11-01`  
**Respuesta:**
```json
{
  "calls": [
    {
      "id": "call_789",
      "agentId": "agent_123",
      "phoneNumber": "+34612345678",
      "duration": 180,
      "status": "completed",
      "cost": 0.15,
      "createdAt": "2025-11-19T09:00:00.000Z"
    }
  ],
  "total": 328,
  "hasMore": true
}
```

### GET `/calls/:id`
**Descripción:** Obtener detalles de una llamada específica  
**Autenticación:** ✅ JWT  
**Respuesta:**
```json
{
  "id": "call_789",
  "agentId": "agent_123",
  "phoneNumber": "+34612345678",
  "duration": 180,
  "status": "completed",
  "transcription": "Transcripción completa...",
  "recording": "https://storage.example.com/recordings/call_789.mp3",
  "metadata": {
    "userSatisfaction": 5,
    "tags": ["consulta", "horarios"]
  }
}
```

---

## 💳 Billing

### POST `/billing/create-checkout-session`
**Descripción:** Crear sesión de checkout de Stripe  
**Autenticación:** ✅ JWT  
**Body:**
```json
{
  "priceId": "price_1234",
  "quantity": 1,
  "successUrl": "https://example.com/success",
  "cancelUrl": "https://example.com/cancel"
}
```

### GET `/billing/usage`
**Descripción:** Obtener uso y costos del mes actual  
**Autenticación:** ✅ JWT  
**Respuesta:**
```json
{
  "period": "2025-11",
  "totalCalls": 1520,
  "totalMinutes": 4560,
  "totalCost": 228.00,
  "breakdown": {
    "callCosts": 180.00,
    "transcriptionCosts": 38.00,
    "storageCosts": 10.00
  }
}
```

### GET `/billing/invoices`
**Descripción:** Listar facturas  
**Autenticación:** ✅ JWT  
**Query params:** `?limit=12&offset=0`

---

## 📦 Planes

### GET `/plan/current`
**Descripción:** Obtener plan actual del tenant  
**Autenticación:** ✅ JWT  
**Respuesta:**
```json
{
  "planId": "pro",
  "name": "Plan Pro",
  "limits": {
    "maxCalls": 5000,
    "maxMinutes": 15000,
    "maxAgents": 10
  },
  "usage": {
    "calls": 1520,
    "minutes": 4560,
    "agents": 3
  },
  "billingCycle": "monthly",
  "nextBillingDate": "2025-12-01T00:00:00.000Z"
}
```

### GET `/plan`
**Descripción:** Listar todos los planes disponibles  
**Autenticación:** ✅ JWT  
**Respuesta:**
```json
{
  "plans": [
    {
      "id": "starter",
      "name": "Starter",
      "price": 29,
      "limits": {
        "maxCalls": 1000,
        "maxMinutes": 3000
      }
    },
    {
      "id": "pro",
      "name": "Pro",
      "price": 99,
      "limits": {
        "maxCalls": 5000,
        "maxMinutes": 15000
      }
    }
  ]
}
```

### POST `/plan/change`
**Descripción:** Cambiar de plan  
**Autenticación:** ✅ JWT  
**Body:**
```json
{
  "newPlanId": "enterprise",
  "billingCycle": "yearly"
}
```

---

## 📊 Uso/Usage

### GET `/usage`
**Descripción:** Obtener estadísticas de uso detalladas  
**Autenticación:** ✅ JWT  
**Query params:** `?startDate=2025-11-01&endDate=2025-11-19&granularity=day`  
**Respuesta:**
```json
{
  "period": {
    "start": "2025-11-01",
    "end": "2025-11-19"
  },
  "summary": {
    "totalCalls": 1520,
    "totalMinutes": 4560,
    "totalTranscriptions": 890
  },
  "dailyBreakdown": [
    {
      "date": "2025-11-18",
      "calls": 85,
      "minutes": 255,
      "transcriptions": 52
    }
  ]
}
```

### GET `/usage/summary`
**Descripción:** Resumen rápido de uso  
**Autenticación:** ✅ JWT  

### POST `/usage`
**Descripción:** Registrar evento de uso (interno)  
**Autenticación:** ✅ JWT  
**Body:**
```json
{
  "type": "call",
  "duration": 180,
  "cost": 0.15,
  "metadata": {
    "agentId": "agent_123"
  }
}
```

---

## 🧠 VoxAgentAI

### POST `/voxagentai/query`
**Descripción:** Realizar consulta al motor de IA  
**Autenticación:** ✅ JWT  
**Body:**
```json
{
  "query": "¿Cuál es el mejor agente para atención médica?",
  "context": {
    "tenantId": "tenant_123",
    "previousInteractions": []
  }
}
```
**Respuesta:**
```json
{
  "response": "Para atención médica, recomiendo el agente 'Doctor Virtual' configurado con...",
  "confidence": 0.88,
  "suggestions": [
    "Configurar horarios específicos",
    "Añadir base de conocimiento médica"
  ]
}
```

### GET `/voxagentai/status`
**Descripción:** Estado del servicio VoxAgentAI  
**Autenticación:** ✅ JWT  
**Respuesta:**
```json
{
  "status": "operational",
  "version": "2.1.0",
  "uptime": 99.98,
  "lastUpdate": "2025-11-19T10:00:00.000Z"
}
```

---

## 🏢 Tenant

### GET `/tenant/:id`
**Descripción:** Obtener información del tenant  
**Autenticación:** ✅ JWT  
**Respuesta:**
```json
{
  "id": "tenant_123",
  "name": "Clínica Dental Centro",
  "email": "admin@clinicacentro.com",
  "apiKey": "sk_live_...",
  "plan": "pro",
  "settings": {
    "timezone": "Europe/Madrid",
    "language": "es-ES"
  },
  "createdAt": "2025-01-15T00:00:00.000Z"
}
```

### POST `/tenant/:id/regenerate-key`
**Descripción:** Regenerar API Key del tenant  
**Autenticación:** ✅ JWT  
**Respuesta:**
```json
{
  "newApiKey": "sk_live_new_key_here",
  "message": "API Key regenerada exitosamente"
}
```

### PATCH `/tenant/:id`
**Descripción:** Actualizar información del tenant  
**Autenticación:** ✅ JWT  
**Body:**
```json
{
  "name": "Clínica Dental Centro - Sede Norte",
  "settings": {
    "timezone": "Europe/Madrid",
    "notifications": {
      "email": true,
      "sms": false
    }
  }
}
```

---

## 🔔 Webhooks

### POST `/webhooks/bland/events`
**Descripción:** Recibir eventos de Bland AI  
**Autenticación:** ❌ Pública (verificación interna)  
**Body:**
```json
{
  "event": "call.completed",
  "callId": "call_789",
  "data": {
    "duration": 180,
    "status": "completed",
    "transcription": "..."
  }
}
```

### POST `/webhooks/stripe-emulator`
**Descripción:** Emulador de webhooks de Stripe (solo desarrollo)  
**Autenticación:** 🔑 Dev Auth  
**Body:**
```json
{
  "type": "invoice.payment_succeeded",
  "data": {
    "object": {
      "id": "in_123",
      "amount_paid": 9900
    }
  }
}
```

---

## 👑 Admin

### GET `/admin/calls`
**Descripción:** Listar todas las llamadas (admin)  
**Autenticación:** ✅ JWT (rol: admin/operator)  
**Query params:** `?limit=100&offset=0&tenantId=tenant_123`

### GET `/admin/calls/:id`
**Descripción:** Obtener detalles completos de una llamada  
**Autenticación:** ✅ JWT (rol: admin/operator)  

### PATCH `/admin/calls/:id`
**Descripción:** Actualizar estado de llamada  
**Autenticación:** ✅ JWT (rol: admin/operator)  
**Body:**
```json
{
  "status": "reviewed",
  "tags": ["importante", "seguimiento"],
  "notes": "Requiere llamada de seguimiento"
}
```

### GET `/admin/transcriptions`
**Descripción:** Listar todas las transcripciones (admin)  
**Autenticación:** ✅ JWT (rol: admin/operator)  

### GET `/admin/metrics`
**Descripción:** Métricas globales del sistema  
**Autenticación:** ✅ JWT (rol: admin)  
**Respuesta:**
```json
{
  "totalTenants": 45,
  "totalCalls": 15420,
  "totalRevenue": 12850.00,
  "activeUsers": 128,
  "systemHealth": {
    "cpu": 45.2,
    "memory": 62.8,
    "storage": 38.5
  }
}
```

### POST `/admin/billing/charge`
**Descripción:** Crear cargo manual  
**Autenticación:** ✅ JWT (rol: admin)  
**Body:**
```json
{
  "tenantId": "tenant_123",
  "amount": 50.00,
  "description": "Cargo por servicios adicionales",
  "type": "one-time"
}
```

---

## 🧪 Mock/Development

### GET `/mock/agents`
**Descripción:** Obtener agentes mock  
**Autenticación:** ✅ JWT  

### GET `/mock/agents/:id`
**Descripción:** Obtener agente mock por ID  
**Autenticación:** ✅ JWT  

### POST `/mock/agents`
**Descripción:** Crear agente mock  
**Autenticación:** ✅ JWT  

### PUT `/mock/agents/:id`
**Descripción:** Actualizar agente mock  
**Autenticación:** ✅ JWT  

### DELETE `/mock/agents/:id`
**Descripción:** Eliminar agente mock  
**Autenticación:** ✅ JWT  

### GET `/mock/usage`
**Descripción:** Obtener datos de uso mock  
**Autenticación:** ✅ JWT  

### GET `/mock/plan`
**Descripción:** Obtener plan mock  
**Autenticación:** ✅ JWT  

### POST `/mock/plan/change`
**Descripción:** Cambiar plan mock  
**Autenticación:** ✅ JWT  

### GET `/mock/voxagentai`
**Descripción:** Estado de VoxAgentAI mock  
**Autenticación:** ✅ JWT  

### POST `/mock/voxagentai/query`
**Descripción:** Consulta a VoxAgentAI mock  
**Autenticación:** ✅ JWT  

### GET `/mock/payments`
**Descripción:** Historial de pagos mock  
**Autenticación:** ✅ JWT  

### GET `/widget-mock/config`
**Descripción:** Configuración del widget mock  
**Autenticación:** ❌ Pública  

### POST `/widget-mock/query`
**Descripción:** Consulta al widget mock  
**Autenticación:** ❌ Pública  

### GET `/widget-mock/interactions`
**Descripción:** Interacciones del widget mock  
**Autenticación:** ❌ Pública  

### GET `/widget-mock/stats`
**Descripción:** Estadísticas del widget mock  
**Autenticación:** ❌ Pública  

---

## 📧 Contacto

### POST `/contact`
**Descripción:** Enviar mensaje de contacto  
**Autenticación:** ❌ Pública (con rate limit)  
**Body:**
```json
{
  "name": "Juan Pérez",
  "email": "juan@example.com",
  "phone": "+34612345678",
  "subject": "Consulta sobre planes",
  "message": "Me gustaría información sobre el plan Enterprise"
}
```

---

## 📋 Resumen por Categorías

| Categoría | Endpoints | Autenticación Principal |
|-----------|-----------|------------------------|
| **Autenticación** | 3 | Pública/JWT |
| **Health** | 1 | Pública |
| **Widget** | 5 | API Key/JWT |
| **Transcripciones** | 7 | API Key/JWT |
| **Agentes** | 5 | JWT |
| **Llamadas** | 2 | JWT |
| **Billing** | 3 | JWT |
| **Planes** | 3 | JWT |
| **Uso** | 3 | JWT |
| **VoxAgentAI** | 2 | JWT |
| **Tenant** | 3 | JWT |
| **Webhooks** | 2 | Pública/Dev |
| **Admin** | 6 | JWT (admin) |
| **Mock** | 15 | JWT/Pública |
| **Contacto** | 1 | Pública |
| **TOTAL** | **61 endpoints** | - |

---

## 🚀 Guía Rápida de Uso

### 1. Autenticación
```bash
# Login
curl -X POST http://localhost:4000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"pass123"}'

# Guardar el token
TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

### 2. Usar el Widget (API Key)
```bash
# Obtener configuración
curl http://localhost:4000/widget/config

# Enviar consulta
curl -X POST http://localhost:4000/widget/query \
  -H "X-API-Key: sk_live_..." \
  -H "Content-Type: application/json" \
  -d '{"query":"¿Horarios?","sessionId":"session_123"}'
```

### 3. Transcribir Audio
```bash
curl -X POST http://localhost:4000/transcription/segment \
  -H "X-API-Key: sk_live_..." \
  -F "audioFile=@audio.wav" \
  -F "sessionId=session_123" \
  -F "language=es-ES"
```

### 4. Consultas Autenticadas
```bash
# Listar agentes
curl http://localhost:4000/agents \
  -H "Authorization: Bearer $TOKEN"

# Obtener estadísticas
curl http://localhost:4000/usage/summary \
  -H "Authorization: Bearer $TOKEN"
```

---

## 📖 Documentación Adicional

- **Swagger UI:** http://localhost:4000/docs
- **Demos del Widget:** http://localhost:4000/examples/
- **Arquitectura:** [ARCHITECTURE.md](./ARCHITECTURE.md)
- **Seguridad:** [SECURITY.md](./SECURITY.md)
- **Deployment:** [DEPLOYMENT.md](./DEPLOYMENT.md)
- **VAPI Config:** [VAPI_CONFIGURADO.md](../VAPI_CONFIGURADO.md)

---

## ⚠️ Notas Importantes

1. **Rate Limiting:** Todos los endpoints tienen límite de 100 req/min
2. **CORS:** Configurado para permitir widgets embebibles
3. **Entorno de Desarrollo:** Los endpoints `/mock` y `/widget-mock` solo están disponibles en desarrollo
4. **API Keys:** Las API Keys deben mantenerse seguras y nunca exponerse en el frontend
5. **JWT Expiration:** Los tokens JWT expiran en 24 horas
6. **Webhooks:** Los webhooks de Bland y Stripe verifican firmas automáticamente

---

**¿Necesitas ayuda?** Contacta al equipo de desarrollo o revisa la documentación interactiva en `/docs`
