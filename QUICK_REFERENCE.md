# 🚀 Quick Reference - Endpoints Principales

> Guía rápida de los endpoints más utilizados de VoiceTotem Studio API

## 🌐 Base URL
```
Development: http://localhost:4000
Production:  https://api.voicetotem.com
```

## 📘 Swagger UI
```
http://localhost:4000/docs
```

---

## 🔐 Autenticación

### Login
```bash
POST /auth/login
Content-Type: application/json

{
  "email": "admin@example.com",
  "password": "password123"
}

# Response
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": { "id": "...", "email": "...", "role": "admin" }
}
```

### Usar Token
```bash
# Header en cada request
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

---

## 🏥 Health Check

```bash
GET /health

# Response
{
  "status": "ok",
  "timestamp": "2025-11-19T10:30:00.000Z"
}
```

---

## 🎨 Widget

### Obtener Configuración
```bash
GET /widget/config

# Response
{
  "publicKey": "a8e14149-23ab-405d-afb9-b0889aa1f58c",
  "assistantId": "901c39a3-a56f-4554-8d75-fb41d0c83e11",
  "theme": {
    "primaryColor": "#4F46E5",
    "position": "bottom-right"
  }
}
```

### Procesar Consulta
```bash
POST /widget/query
X-API-Key: sk_live_your_api_key
Content-Type: application/json

{
  "query": "¿Cuál es el horario?",
  "sessionId": "session_123"
}
```

### Ver Estadísticas
```bash
GET /widget/stats
Authorization: Bearer <token>

# Response
{
  "totalInteractions": 1245,
  "averageSessionDuration": 180,
  "satisfactionRate": 4.5
}
```

---

## 🎙️ Transcripciones

### Transcribir Audio (Endpoint Principal)
```bash
POST /transcription/segment
X-API-Key: sk_live_your_api_key
Content-Type: multipart/form-data

audioFile: <binary>
sessionId: "session_123"
language: "es-ES"

# Response
{
  "transcriptionId": "trans_456",
  "text": "Hola, necesito información...",
  "confidence": 0.95,
  "duration": 3.5
}
```

### Ver Sesión
```bash
GET /transcription/session/:sessionId
Authorization: Bearer <token>

# Response
{
  "sessionId": "session_123",
  "transcriptions": [...],
  "totalSegments": 15,
  "totalDuration": 180
}
```

### Estadísticas
```bash
GET /transcription/stats
Authorization: Bearer <token>

# Response
{
  "totalTranscriptions": 5420,
  "totalDuration": 18500,
  "averageConfidence": 0.92
}
```

---

## 🤖 Agentes

### Listar Agentes
```bash
GET /agents
Authorization: Bearer <token>

# Response
{
  "agents": [
    {
      "id": "agent_123",
      "name": "Agente Recepción",
      "language": "es-ES",
      "status": "active"
    }
  ]
}
```

### Crear Agente
```bash
POST /agents
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "Nuevo Agente",
  "language": "es-ES",
  "voice": "es-ES-Neural2-A",
  "settings": {
    "speed": 1.0,
    "pitch": 0
  }
}
```

### Obtener Agente
```bash
GET /agents/:id
Authorization: Bearer <token>
```

### Actualizar Agente
```bash
PUT /agents/:id
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "Agente Actualizado",
  "settings": { "speed": 1.2 }
}
```

### Eliminar Agente
```bash
DELETE /agents/:id
Authorization: Bearer <token>
```

---

## 📞 Llamadas

### Listar Llamadas
```bash
GET /calls?limit=50&offset=0&status=completed
Authorization: Bearer <token>

# Response
{
  "calls": [
    {
      "id": "call_789",
      "duration": 180,
      "status": "completed",
      "cost": 0.15
    }
  ],
  "total": 328
}
```

### Ver Llamada
```bash
GET /calls/:id
Authorization: Bearer <token>

# Response
{
  "id": "call_789",
  "transcription": "Transcripción completa...",
  "recording": "https://storage.example.com/..."
}
```

---

## 📦 Planes

### Plan Actual
```bash
GET /plan/current
Authorization: Bearer <token>

# Response
{
  "planId": "pro",
  "name": "Plan Pro",
  "limits": {
    "maxCalls": 5000,
    "maxMinutes": 15000
  },
  "usage": {
    "calls": 1520,
    "minutes": 4560
  }
}
```

### Listar Planes
```bash
GET /plan
Authorization: Bearer <token>

# Response
{
  "plans": [
    {
      "id": "starter",
      "name": "Starter",
      "price": 29,
      "limits": { "maxCalls": 1000 }
    }
  ]
}
```

### Cambiar Plan
```bash
POST /plan/change
Authorization: Bearer <token>
Content-Type: application/json

{
  "newPlanId": "enterprise",
  "billingCycle": "yearly"
}
```

---

## 📊 Uso y Estadísticas

### Resumen de Uso
```bash
GET /usage/summary
Authorization: Bearer <token>

# Response
{
  "period": "2025-11",
  "totalCalls": 1520,
  "totalMinutes": 4560,
  "totalCost": 228.00
}
```

### Uso Detallado
```bash
GET /usage?startDate=2025-11-01&endDate=2025-11-19&granularity=day
Authorization: Bearer <token>

# Response
{
  "summary": { "totalCalls": 1520 },
  "dailyBreakdown": [
    { "date": "2025-11-18", "calls": 85 }
  ]
}
```

---

## 🧠 VoxAgentAI

### Consulta
```bash
POST /voxagentai/query
Authorization: Bearer <token>
Content-Type: application/json

{
  "query": "¿Cuál es el mejor agente?",
  "context": { "tenantId": "tenant_123" }
}

# Response
{
  "response": "Recomiendo el agente...",
  "confidence": 0.88,
  "suggestions": ["...", "..."]
}
```

### Estado
```bash
GET /voxagentai/status
Authorization: Bearer <token>

# Response
{
  "status": "operational",
  "version": "2.1.0",
  "uptime": 99.98
}
```

---

## 🏢 Tenant

### Info del Tenant
```bash
GET /tenant/:id
Authorization: Bearer <token>

# Response
{
  "id": "tenant_123",
  "name": "Mi Empresa",
  "apiKey": "sk_live_...",
  "plan": "pro"
}
```

### Regenerar API Key
```bash
POST /tenant/:id/regenerate-key
Authorization: Bearer <token>

# Response
{
  "newApiKey": "sk_live_new_key_here"
}
```

### Actualizar Tenant
```bash
PATCH /tenant/:id
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "Empresa Actualizada",
  "settings": { "timezone": "Europe/Madrid" }
}
```

---

## 💳 Billing

### Crear Checkout
```bash
POST /billing/create-checkout-session
Authorization: Bearer <token>
Content-Type: application/json

{
  "priceId": "price_1234",
  "quantity": 1,
  "successUrl": "https://example.com/success"
}
```

### Ver Uso del Mes
```bash
GET /billing/usage
Authorization: Bearer <token>

# Response
{
  "period": "2025-11",
  "totalCost": 228.00,
  "breakdown": {
    "callCosts": 180.00,
    "transcriptionCosts": 38.00
  }
}
```

---

## 👑 Admin (Solo Administradores)

### Métricas del Sistema
```bash
GET /admin/metrics
Authorization: Bearer <token>

# Response
{
  "totalTenants": 45,
  "totalCalls": 15420,
  "totalRevenue": 12850.00,
  "systemHealth": {
    "cpu": 45.2,
    "memory": 62.8
  }
}
```

### Todas las Llamadas
```bash
GET /admin/calls?tenantId=tenant_123
Authorization: Bearer <token>
```

### Cargo Manual
```bash
POST /admin/billing/charge
Authorization: Bearer <token>
Content-Type: application/json

{
  "tenantId": "tenant_123",
  "amount": 50.00,
  "description": "Servicios adicionales"
}
```

---

## 🔔 Webhooks

### Bland AI Events
```bash
POST /webhooks/bland/events
Content-Type: application/json

{
  "event": "call.completed",
  "callId": "call_789",
  "data": { "duration": 180 }
}
```

---

## 📧 Contacto

```bash
POST /contact
Content-Type: application/json

{
  "name": "Juan Pérez",
  "email": "juan@example.com",
  "subject": "Consulta",
  "message": "Me gustaría información..."
}
```

---

## 💡 Tips Rápidos

### Testing con curl
```bash
# Login y guardar token
TOKEN=$(curl -s -X POST http://localhost:4000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@test.com","password":"pass"}' \
  | jq -r '.token')

# Usar token
curl http://localhost:4000/agents \
  -H "Authorization: Bearer $TOKEN"
```

### Headers Comunes
```bash
# JWT Auth
Authorization: Bearer <token>

# API Key Auth
X-API-Key: <api-key>

# Content Type
Content-Type: application/json
Content-Type: multipart/form-data
```

### Códigos de Error Comunes
- `401` - No autenticado (falta token)
- `403` - Sin permisos (token inválido o rol insuficiente)
- `404` - No encontrado
- `422` - Error de validación
- `429` - Rate limit excedido

---

## 🔗 Enlaces

- **Swagger UI**: http://localhost:4000/docs
- **Docs Completas**: [API_ENDPOINTS.md](./docs/API_ENDPOINTS.md)
- **Guía OpenAPI**: [OPENAPI_GUIDE.md](./docs/OPENAPI_GUIDE.md)
- **Índice Docs**: [DOCS_INDEX.md](./DOCS_INDEX.md)

---

**🚀 Para más detalles, ver la documentación completa en Swagger UI o docs/API_ENDPOINTS.md**
