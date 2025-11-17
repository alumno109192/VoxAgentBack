# 📁 Sistema Mock Data - Documentación

## 🎯 Objetivo

Sistema de almacenamiento y gestión de datos simulados en archivos JSON separados, permitiendo probar el panel interno sin necesidad de MongoDB o lógica de producción completa.

## 📂 Estructura de Archivos

Todos los archivos mock se encuentran en `./data/mock/`:

```
data/mock/
├── agents.json          # Agentes virtuales
├── usage.json           # Consumo de minutos (angelitos)
├── plan.json            # Plan actual del usuario
├── voxagentai.json      # Interacciones con VoxAgentAI
└── payments.json        # Historial de pagos
```

## 🔧 Configuración

### Variables de Entorno

```env
MOCK_DATA_PATH=./data/mock
```

## 🛠️ Endpoints Disponibles

### 🤖 Agentes Virtuales

#### Listar Agentes
```http
GET /mock/agents?tenantId={tenantId}&status={status}
Authorization: Bearer {token}
```

**Respuesta:**
```json
{
  "agents": [
    {
      "id": "agent-001",
      "tenantId": "test-tenant-001",
      "name": "Agente Comercial",
      "description": "Agente especializado en ventas",
      "voice": "es-ES-Standard-A",
      "behavior": "ventas",
      "status": "active",
      "configuration": { ... },
      "stats": {
        "totalCalls": 45,
        "totalMinutes": 123.5,
        "lastUsed": "2025-11-17T10:30:00Z"
      },
      "createdAt": "2025-11-01T12:00:00Z",
      "updatedAt": "2025-11-17T10:30:00Z"
    }
  ],
  "total": 3
}
```

#### Obtener Agente
```http
GET /mock/agents/{id}
Authorization: Bearer {token}
```

#### Crear Agente
```http
POST /mock/agents
Authorization: Bearer {token}
Content-Type: application/json

{
  "tenantId": "test-tenant-001",
  "name": "Nuevo Agente",
  "description": "Descripción del agente",
  "voice": "es-ES-Standard-B",
  "behavior": "formal",
  "configuration": {
    "language": "es",
    "temperature": 0.7
  }
}
```

**Respuesta:** Agente creado con ID único generado

#### Actualizar Agente
```http
PUT /mock/agents/{id}
Authorization: Bearer {token}
Content-Type: application/json

{
  "name": "Nombre Actualizado",
  "status": "inactive"
}
```

#### Eliminar Agente
```http
DELETE /mock/agents/{id}
Authorization: Bearer {token}
```

---

### 📊 Uso (Angelitos)

#### Obtener Uso
```http
GET /mock/usage?tenantId={tenantId}
Authorization: Bearer {token}
```

**Respuesta:**
```json
{
  "tenantId": "test-tenant-001",
  "period": "2025-11",
  "summary": {
    "totalMinutes": 403.5,
    "totalCalls": 135,
    "totalCost": 20.18,
    "unit": "angelitos"
  },
  "byType": {
    "call": {
      "minutes": 358.3,
      "count": 135,
      "cost": 17.92
    },
    "voxagentai": {
      "minutes": 35.2,
      "count": 48,
      "cost": 1.76
    },
    "transcription": {
      "minutes": 10.0,
      "count": 25,
      "cost": 0.50
    }
  },
  "byAgent": [
    {
      "agentId": "agent-001",
      "agentName": "Agente Comercial",
      "minutes": 123.5,
      "calls": 45,
      "cost": 6.18
    }
  ],
  "dailyUsage": [
    { "date": "2025-11-01", "minutes": 12.5, "calls": 4 },
    { "date": "2025-11-02", "minutes": 18.3, "calls": 6 }
  ],
  "updatedAt": "2025-11-17T12:00:00Z"
}
```

---

### 💎 Plan

#### Obtener Plan Actual
```http
GET /mock/plan?tenantId={tenantId}
Authorization: Bearer {token}
```

**Respuesta:**
```json
{
  "tenantId": "test-tenant-001",
  "currentPlan": {
    "id": "plan-professional",
    "name": "Plan Professional",
    "tier": "professional",
    "limits": {
      "maxAgents": 20,
      "maxMinutesPerMonth": 2000,
      "maxCallsPerMonth": 1000,
      "maxStorageGB": 20,
      "voxagentaiQueries": 2000
    },
    "pricing": {
      "monthly": 99,
      "yearly": 990,
      "currency": "USD"
    }
  },
  "usage": {
    "agentsCreated": 3,
    "agentsUsagePercent": 15.0,
    "minutesUsed": 403.5,
    "minutesUsagePercent": 20.18
  },
  "billingCycle": {
    "startDate": "2025-11-01T00:00:00Z",
    "endDate": "2025-11-30T23:59:59Z",
    "nextBillingDate": "2025-12-01T00:00:00Z"
  },
  "subscriptionStatus": "active"
}
```

#### Cambiar Plan
```http
POST /mock/plan/change
Authorization: Bearer {token}
Content-Type: application/json

{
  "tenantId": "test-tenant-001",
  "newPlan": {
    "id": "plan-enterprise",
    "name": "Plan Enterprise",
    "tier": "enterprise"
  }
}
```

---

### 🎙️ VoxAgentAI

#### Listar Interacciones
```http
GET /mock/voxagentai?tenantId={tenantId}
Authorization: Bearer {token}
```

**Respuesta:**
```json
{
  "interactions": [
    {
      "id": "interaction-001",
      "tenantId": "test-tenant-001",
      "agentId": "agent-001",
      "query": "¿Cuál es el estado de mi pedido?",
      "response": "Su pedido está en tránsito...",
      "mode": "text",
      "metadata": {
        "tokens": 85,
        "cost": 0.00085,
        "duration": 1.2
      },
      "timestamp": "2025-11-17T10:15:00Z"
    }
  ],
  "total": 5
}
```

#### Realizar Consulta
```http
POST /mock/voxagentai/query
Authorization: Bearer {token}
Content-Type: application/json

{
  "tenantId": "test-tenant-001",
  "agentId": "agent-001",
  "query": "¿Cuál es el horario de atención?",
  "mode": "text"
}
```

**Respuesta:**
```json
{
  "response": "Basándome en tu consulta, aquí está la información...",
  "mode": "text",
  "metadata": {
    "tokens": 75,
    "cost": 0.00075,
    "duration": 1.1
  }
}
```

---

### 💳 Pagos

#### Listar Pagos
```http
GET /mock/payments?tenantId={tenantId}
Authorization: Bearer {token}
```

**Respuesta:**
```json
{
  "payments": [
    {
      "id": "pay-001",
      "tenantId": "test-tenant-001",
      "amount": 99.00,
      "currency": "USD",
      "type": "subscription",
      "description": "Plan Professional - Noviembre 2025",
      "status": "completed",
      "paymentMethod": "credit_card",
      "cardLast4": "4242",
      "createdAt": "2025-11-01T00:00:00Z",
      "paidAt": "2025-11-01T00:05:23Z"
    }
  ],
  "total": 4
}
```

---

## 🔒 Características de Seguridad

### Escritura Atómica
- Todos los archivos se escriben primero en archivos temporales (`.tmp`)
- Se renombran atómicamente al archivo final
- Evita corrupción de datos en caso de fallos

### Lock de Archivos
- Sistema de locks en memoria para evitar condiciones de carrera
- Operaciones serializadas por archivo
- Garantiza consistencia en escrituras concurrentes

### Validación de Duplicados
- Verifica IDs únicos antes de insertar
- Evita duplicación de datos
- Retorna errores claros en caso de conflicto

### Autorización
- Todos los endpoints requieren JWT
- Validación de permisos por tenant
- Admin puede ver todos los datos, usuarios solo los suyos

---

## 📈 Casos de Uso

### Dashboard con Datos Mock

```javascript
// 1. Login
const { accessToken } = await fetch('/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'admin@example.com',
    password: 'Admin123!'
  })
}).then(r => r.json());

// 2. Obtener datos mock
const agents = await fetch('/mock/agents?tenantId=test-tenant-001', {
  headers: { 'Authorization': `Bearer ${accessToken}` }
}).then(r => r.json());

const usage = await fetch('/mock/usage?tenantId=test-tenant-001', {
  headers: { 'Authorization': `Bearer ${accessToken}` }
}).then(r => r.json());

const plan = await fetch('/mock/plan?tenantId=test-tenant-001', {
  headers: { 'Authorization': `Bearer ${accessToken}` }
}).then(r => r.json());

const voxagentai = await fetch('/mock/voxagentai?tenantId=test-tenant-001', {
  headers: { 'Authorization': `Bearer ${accessToken}` }
}).then(r => r.json());
```

### Crear Agente y Consultar VoxAgentAI

```javascript
// 1. Crear agente
const newAgent = await fetch('/mock/agents', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${accessToken}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    tenantId: 'test-tenant-001',
    name: 'Agente de Soporte',
    description: 'Atención al cliente',
    voice: 'es-ES-Standard-A',
    behavior: 'amable'
  })
}).then(r => r.json());

// 2. Consultar VoxAgentAI con el nuevo agente
const aiResponse = await fetch('/mock/voxagentai/query', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${accessToken}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    tenantId: 'test-tenant-001',
    agentId: newAgent.id,
    query: '¿Cómo puedo ayudarte?',
    mode: 'text'
  })
}).then(r => r.json());
```

---

## 🚀 Ventajas

✅ **Sin dependencias externas**: No requiere MongoDB ni APIs de terceros
✅ **Pruebas rápidas**: Datos instantáneos para demos y desarrollo
✅ **Control total**: Modifica los JSON directamente si es necesario
✅ **Migración fácil**: Misma estructura que endpoints reales
✅ **Seguro**: Escritura atómica y locks previenen corrupción
✅ **Realista**: Datos de ejemplo completos y coherentes

---

## 🔄 Migración a Producción

Cuando estés listo para producción, simplemente:

1. Cambia los endpoints del frontend de `/mock/*` a los endpoints reales
2. Los datos reales vienen de MongoDB
3. Los archivos mock siguen disponibles para testing

```javascript
// Desarrollo (mock)
const API_BASE = '/mock';

// Producción (real)
const API_BASE = '';

// Uso
fetch(`${API_BASE}/agents?tenantId=xxx`)
```

---

## 📝 Notas Importantes

- **Solo para desarrollo/demo**: No usar en producción real
- **Autenticación requerida**: Todos los endpoints requieren JWT válido
- **Datos persistentes**: Los archivos JSON se actualizan en disco
- **Reset manual**: Para resetear datos, restaura los JSON desde backup
- **Performance**: Adecuado para demos, no para miles de registros

---

## 🔧 Mantenimiento

### Backup de Datos Mock
```bash
cp -r data/mock data/mock.backup
```

### Restaurar Datos Mock
```bash
rm -rf data/mock
cp -r data/mock.backup data/mock
```

### Verificar Integridad
```bash
# Validar JSON
for file in data/mock/*.json; do
  echo "Validating $file"
  jq empty "$file" && echo "✓ Valid" || echo "✗ Invalid"
done
```
