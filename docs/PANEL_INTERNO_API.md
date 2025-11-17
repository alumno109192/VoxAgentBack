# 🤖 Panel Interno - Gestión de Agentes y Planes

Documentación completa de los nuevos endpoints para gestión de agentes virtuales, consumo de minutos (angelitos), planes y VoxAgentAI.

## 📋 Tabla de Contenidos

1. [Agentes Virtuales](#agentes-virtuales)
2. [Uso y Consumo (Angelitos)](#uso-y-consumo-angelitos)
3. [Planes](#planes)
4. [VoxAgentAI](#voxagentai)

---

## 🤖 Agentes Virtuales

### Listar Agentes

```http
GET /agents?tenantId={tenantId}&status={status}&page={page}&limit={limit}
Authorization: Bearer {token}
```

**Parámetros:**
- `tenantId` (requerido): ID del tenant
- `status` (opcional): `active`, `inactive`, `training`
- `page` (opcional): Número de página (default: 1)
- `limit` (opcional): Elementos por página (default: 20)

**Respuesta:**
```json
{
  "agents": [
    {
      "_id": "agent-001",
      "tenantId": "test-tenant-001",
      "name": "Recepción Médica",
      "description": "Agente para atención de pacientes",
      "status": "active",
      "configuration": {
        "language": "es",
        "voiceId": "voice-friendly",
        "behavior": "Profesional y empático",
        "temperature": 0.7,
        "maxTokens": 500,
        "welcomeMessage": "Hola, soy el asistente virtual. ¿En qué puedo ayudarte?",
        "fallbackMessage": "Lo siento, no entendí. ¿Podrías repetirlo?"
      },
      "metadata": {
        "knowledgeBase": ["FAQ médicas", "Horarios"],
        "tags": ["recepcion", "atencion"],
        "category": "customer-service"
      },
      "stats": {
        "totalCalls": 125,
        "totalMinutes": 245.5,
        "lastUsed": "2025-01-15T10:30:00Z"
      },
      "createdAt": "2025-01-01T00:00:00Z",
      "updatedAt": "2025-01-15T10:30:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 5,
    "pages": 1
  }
}
```

---

### Obtener Agente por ID

```http
GET /agents/{id}
Authorization: Bearer {token}
```

**Respuesta:** Objeto del agente (igual estructura que en el listado)

---

### Crear Agente

```http
POST /agents
Authorization: Bearer {token}
Content-Type: application/json

{
  "tenantId": "test-tenant-001",
  "name": "Agente de Citas",
  "description": "Gestión de agendamiento",
  "configuration": {
    "language": "es",
    "voiceId": "voice-professional",
    "behavior": "Formal y preciso",
    "temperature": 0.5,
    "maxTokens": 300,
    "welcomeMessage": "Bienvenido, ¿desea agendar una cita?",
    "fallbackMessage": "Disculpe, no entendí su solicitud."
  },
  "metadata": {
    "knowledgeBase": ["Disponibilidad médicos", "Especialidades"],
    "tags": ["citas", "agendamiento"],
    "category": "scheduling"
  }
}
```

**Respuesta:**
```json
{
  "_id": "agent-002",
  "tenantId": "test-tenant-001",
  "name": "Agente de Citas",
  "status": "active",
  "message": "Agent created successfully"
}
```

**Errores:**
- `403` - Plan limit reached
- `400` - Validation error
- `401` - Unauthorized

---

### Actualizar Agente

```http
PUT /agents/{id}
Authorization: Bearer {token}
Content-Type: application/json

{
  "name": "Recepción Médica Actualizada",
  "description": "Nueva descripción",
  "configuration": {
    "temperature": 0.8
  }
}
```

**Nota:** Los campos son opcionales, solo se actualizan los enviados.

---

### Eliminar Agente

```http
DELETE /agents/{id}
Authorization: Bearer {token}
```

**Respuesta:**
```json
{
  "message": "Agent deleted successfully"
}
```

**Nota:** Soft delete - el agente pasa a estado `inactive`

---

## 📊 Uso y Consumo (Angelitos)

### Consultar Uso

```http
GET /usage?tenantId={tenantId}&startDate={date}&endDate={date}&type={type}&agentId={agentId}&groupBy={groupBy}
Authorization: Bearer {token}
```

**Parámetros:**
- `tenantId` (requerido): ID del tenant
- `startDate` (opcional): Fecha inicio (ISO 8601)
- `endDate` (opcional): Fecha fin (ISO 8601)
- `type` (opcional): `call`, `voxagentai`, `transcription`
- `agentId` (opcional): Filtrar por agente específico
- `groupBy` (opcional): `day` o `month` para agregación

**Respuesta (sin groupBy):**
```json
{
  "usage": [
    {
      "_id": "usage-001",
      "tenantId": "test-tenant-001",
      "agentId": "agent-001",
      "type": "call",
      "minutesConsumed": 5.2,
      "callId": "call-123",
      "metadata": {
        "duration": 312,
        "cost": 0.26,
        "tokens": null
      },
      "date": "2025-01-15T10:30:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 50,
    "total": 150,
    "pages": 3
  }
}
```

**Respuesta (con groupBy=day):**
```json
{
  "usage": [
    {
      "_id": "2025-01-15",
      "totalMinutes": 45.3,
      "totalRecords": 12
    },
    {
      "_id": "2025-01-14",
      "totalMinutes": 38.7,
      "totalRecords": 10
    }
  ]
}
```

---

### Resumen de Uso

```http
GET /usage/summary?tenantId={tenantId}
Authorization: Bearer {token}
```

**Respuesta:**
```json
{
  "currentMonth": {
    "totalMinutes": 245.5,
    "totalRecords": 45,
    "byType": {
      "call": 180.2,
      "voxagentai": 50.3,
      "transcription": 15.0
    }
  },
  "lastMonth": {
    "totalMinutes": 198.3,
    "totalRecords": 38,
    "byType": {
      "call": 150.1,
      "voxagentai": 38.2,
      "transcription": 10.0
    }
  },
  "comparison": {
    "minutesChange": 23.8,
    "minutesChangePercent": 12.0,
    "recordsChange": 7,
    "recordsChangePercent": 18.4
  }
}
```

---

### Registrar Uso (Interno)

```http
POST /usage
Authorization: Bearer {token}
Content-Type: application/json

{
  "tenantId": "test-tenant-001",
  "agentId": "agent-001",
  "type": "call",
  "minutesConsumed": 5.2,
  "callId": "call-123",
  "metadata": {
    "duration": 312,
    "cost": 0.26
  }
}
```

**Nota:** Endpoint interno para registrar consumo desde webhooks u otros servicios.

---

## 💎 Planes

### Plan Actual

```http
GET /plan/current?tenantId={tenantId}
Authorization: Bearer {token}
```

**Respuesta:**
```json
{
  "plan": {
    "_id": "plan-starter",
    "name": "Plan Starter",
    "tier": "starter",
    "description": "Perfecto para pequeños negocios",
    "limits": {
      "maxAgents": 5,
      "maxMinutesPerMonth": 500,
      "maxCallsPerMonth": 250,
      "maxStorageGB": 5,
      "voxagentaiQueries": 500
    },
    "features": [
      "5 agentes virtuales",
      "500 minutos/mes",
      "250 llamadas/mes",
      "5 GB de almacenamiento",
      "500 consultas VoxAgentAI/mes"
    ],
    "pricing": {
      "monthly": 29,
      "yearly": 290,
      "currency": "USD"
    }
  },
  "usage": {
    "agentsCreated": 3,
    "agentsUsagePercent": 60.0,
    "minutesUsed": 245.5,
    "minutesUsagePercent": 49.1,
    "callsUsed": 125,
    "callsUsagePercent": 50.0,
    "storageUsed": 2.3,
    "storageUsagePercent": 46.0,
    "voxagentaiQueriesUsed": 150,
    "voxagentaiUsagePercent": 30.0
  }
}
```

---

### Listar Planes

```http
GET /plan
Authorization: Bearer {token}
```

**Respuesta:**
```json
{
  "plans": [
    {
      "_id": "plan-free",
      "name": "Plan Gratuito",
      "tier": "free",
      "limits": {
        "maxAgents": 1,
        "maxMinutesPerMonth": 100,
        "maxCallsPerMonth": 50,
        "maxStorageGB": 1,
        "voxagentaiQueries": 50
      },
      "pricing": {
        "monthly": 0,
        "yearly": 0,
        "currency": "USD"
      }
    },
    {
      "_id": "plan-starter",
      "name": "Plan Starter",
      "tier": "starter",
      "pricing": {
        "monthly": 29,
        "yearly": 290,
        "currency": "USD"
      }
    }
  ]
}
```

---

### Cambiar Plan

```http
POST /plan/change
Authorization: Bearer {token}
Content-Type: application/json

{
  "tenantId": "test-tenant-001",
  "newPlanId": "plan-professional"
}
```

**Respuesta:**
```json
{
  "message": "Plan changed successfully",
  "oldPlan": "starter",
  "newPlan": "professional",
  "quotaLimits": {
    "maxAgents": 20,
    "maxMinutesPerMonth": 2000,
    "maxCallsPerMonth": 1000,
    "maxStorageGB": 20,
    "voxagentaiQueries": 2000
  }
}
```

---

## 🎙️ VoxAgentAI

### Consulta a VoxAgentAI

```http
POST /voxagentai/query
Authorization: Bearer {token}
Content-Type: application/json

{
  "tenantId": "test-tenant-001",
  "query": "¿Cuál es el horario de atención?",
  "mode": "text",
  "agentId": "agent-001"
}
```

**Parámetros:**
- `tenantId` (requerido): ID del tenant
- `query` (requerido): Texto de la consulta
- `mode` (opcional): `text` o `voice` (default: text)
- `agentId` (opcional): Asociar a agente específico

**Respuesta:**
```json
{
  "response": "Nuestro horario de atención es de lunes a viernes de 8:00 AM a 6:00 PM, y sábados de 9:00 AM a 1:00 PM.",
  "mode": "text",
  "metadata": {
    "tokens": 85,
    "cost": 0.00085,
    "queriesRemaining": 349
  }
}
```

**Errores:**
- `429` - Query limit reached (necesita upgrade de plan)
- `400` - Missing required parameters
- `403` - Forbidden

---

### Estado de VoxAgentAI

```http
GET /voxagentai/status?tenantId={tenantId}
Authorization: Bearer {token}
```

**Respuesta:**
```json
{
  "status": "active",
  "quota": {
    "limit": 500,
    "used": 151,
    "remaining": 349,
    "percentage": 30.2
  },
  "monthlyStats": {
    "totalQueries": 151,
    "totalMinutes": 15.1,
    "totalCost": 1.51,
    "totalTokens": 15100
  }
}
```

---

## 🔑 Autenticación

Todos los endpoints requieren JWT en el header:

```http
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

Obtener token:
```http
POST /auth/login
Content-Type: application/json

{
  "email": "admin@example.com",
  "password": "Admin123!"
}
```

---

## 📈 Casos de Uso

### Dashboard Principal

```javascript
// 1. Obtener plan y uso
const planData = await fetch('/plan/current?tenantId=xxx', { headers });

// 2. Listar agentes activos
const agents = await fetch('/agents?tenantId=xxx&status=active', { headers });

// 3. Resumen de consumo
const usageSummary = await fetch('/usage/summary?tenantId=xxx', { headers });

// 4. Estado VoxAgentAI
const voxStatus = await fetch('/voxagentai/status?tenantId=xxx', { headers });
```

### Gráfico de Consumo

```javascript
// Obtener datos agrupados por día para últimos 30 días
const startDate = new Date();
startDate.setDate(startDate.getDate() - 30);

const usage = await fetch(
  `/usage?tenantId=xxx&startDate=${startDate.toISOString()}&groupBy=day`,
  { headers }
);

// Resultado listo para gráficos (Chart.js, Recharts, etc.)
// [{ _id: "2025-01-15", totalMinutes: 45.3 }, ...]
```

### Crear y Configurar Agente

```javascript
// 1. Verificar límite de agentes
const currentPlan = await fetch('/plan/current?tenantId=xxx', { headers });
if (currentPlan.usage.agentsCreated >= currentPlan.plan.limits.maxAgents) {
  showUpgradeModal();
}

// 2. Crear agente
const newAgent = await fetch('/agents', {
  method: 'POST',
  headers,
  body: JSON.stringify({
    tenantId: 'xxx',
    name: 'Nuevo Agente',
    configuration: { ... }
  })
});

// 3. Listar agentes actualizados
const agents = await fetch('/agents?tenantId=xxx', { headers });
```

---

## 🚨 Códigos de Error

| Código | Descripción |
|--------|-------------|
| 400 | Bad Request - Parámetros inválidos |
| 401 | Unauthorized - Token inválido/expirado |
| 403 | Forbidden - Sin permisos o límite alcanzado |
| 404 | Not Found - Recurso no encontrado |
| 429 | Too Many Requests - Rate limit excedido |
| 500 | Internal Server Error |

---

## 📝 Notas

- Todos los tiempos están en UTC (ISO 8601)
- Los minutos consumidos son decimales (ej: 5.2 minutos = 5min 12seg)
- Los soft deletes mantienen el historial
- Los límites se resetean el día 1 de cada mes
- VoxAgentAI simula respuestas en modo desarrollo (reemplazar con API real)
