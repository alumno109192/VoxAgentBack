# Sistema de Datos Mock

## Descripción

Este sistema permite gestionar datos simulados (mock) para desarrollo y demostración, almacenados en archivos JSON separados **por entidad y por tenant**.

## Arquitectura de Archivos

### Estructura de Almacenamiento

Los datos se almacenan en `./data/mock/` con el siguiente patrón de nombres:

```
{tipo}-{tenantId}.json
```

Ejemplos:
- `agents-test-tenant-001.json` - Agentes del tenant test-tenant-001
- `usage-test-tenant-001.json` - Uso del tenant test-tenant-001
- `plan-test-tenant-001.json` - Plan del tenant test-tenant-001
- `voxagentai-test-tenant-001.json` - Interacciones VoxAgentAI del tenant test-tenant-001
- `payments-test-tenant-001.json` - Pagos del tenant test-tenant-001

### Ventajas de Esta Arquitectura

1. **Aislamiento Real**: Cada tenant tiene sus propios archivos físicos
2. **Escalabilidad**: No hay filtrado en memoria, lectura directa por tenant
3. **Concurrencia**: Lock granular por `{tipo}-{tenantId}`
4. **Simplicidad**: No hay arrays mezclados, estructura más clara
5. **Multi-tenant Real**: Facilita testing con múltiples tenants

## Tipos de Datos

### 1. Agentes Virtuales (`agents-{tenantId}.json`)

Array de agentes virtuales del tenant:

```json
[
  {
    "id": "agent-001",
    "tenantId": "test-tenant-001",
    "name": "Agente Comercial",
    "description": "Agente especializado en ventas",
    "voice": "es-ES-Standard-A",
    "behavior": "ventas",
    "status": "active",
    "configuration": {
      "language": "es",
      "voiceId": "voice-friendly",
      "temperature": 0.7,
      "maxTokens": 500,
      "welcomeMessage": "¡Hola! ¿En qué puedo ayudarte?",
      "fallbackMessage": "Disculpa, no entendí bien."
    },
    "stats": {
      "totalCalls": 45,
      "totalMinutes": 123.5,
      "lastUsed": "2025-11-18T10:30:00Z"
    },
    "createdAt": "2025-11-01T12:00:00Z",
    "updatedAt": "2025-11-18T10:30:00Z"
  }
]
```

### 2. Uso - Angelitos (`usage-{tenantId}.json`)

Objeto con resumen de uso del tenant:

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
    "call": { "minutes": 358.3, "count": 135, "cost": 17.92 },
    "voxagentai": { "minutes": 35.2, "count": 48, "cost": 1.76 },
    "transcription": { "minutes": 10.0, "count": 25, "cost": 0.50 }
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
    { "date": "2025-11-01", "minutes": 12.5, "calls": 4 }
  ],
  "updatedAt": "2025-11-18T12:00:00Z"
}
```

### 3. Plan Contratado (`plan-{tenantId}.json`)

Objeto con plan actual y uso del tenant:

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
    "features": ["20 agentes virtuales", "2,000 minutos/mes", ...],
    "pricing": { "monthly": 99, "yearly": 990, "currency": "USD" },
    "isActive": true
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
  "subscriptionStatus": "active",
  "updatedAt": "2025-11-18T12:00:00Z"
}
```

### 4. VoxAgentAI Interacciones (`voxagentai-{tenantId}.json`)

Array de interacciones con VoxAgentAI del tenant:

```json
[
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
    "timestamp": "2025-11-18T10:15:00Z"
  }
]
```

### 5. Historial de Pagos (`payments-{tenantId}.json`)

Array de pagos del tenant:

```json
[
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
]
```

## Endpoints

Todos los endpoints requieren autenticación JWT (header `Authorization: Bearer {token}`).

### Agentes

```bash
# Obtener todos los agentes
GET /mock/agents?tenantId={tenantId}

# Obtener agente por ID
GET /mock/agents/{id}?tenantId={tenantId}

# Crear agente
POST /mock/agents
{
  "tenantId": "test-tenant-001",
  "name": "Nuevo Agente",
  "description": "Descripción",
  "voice": "es-ES-Standard-A",
  "behavior": "ventas",
  "status": "active"
}

# Actualizar agente
PUT /mock/agents/{id}
{
  "tenantId": "test-tenant-001",
  "name": "Nombre actualizado"
}

# Eliminar agente
DELETE /mock/agents/{id}?tenantId={tenantId}
```

### Uso (Angelitos)

```bash
# Obtener resumen de uso
GET /mock/usage?tenantId={tenantId}
```

### Plan

```bash
# Obtener plan actual
GET /mock/plan?tenantId={tenantId}

# Cambiar plan
POST /mock/plan/change
{
  "tenantId": "test-tenant-001",
  "newPlan": "enterprise"
}
```

### VoxAgentAI

```bash
# Obtener historial de interacciones
GET /mock/voxagentai?tenantId={tenantId}

# Realizar consulta
POST /mock/voxagentai/query
{
  "tenantId": "test-tenant-001",
  "agentId": "agent-001",
  "query": "Tu pregunta aquí",
  "mode": "text"
}
```

### Pagos

```bash
# Obtener historial de pagos
GET /mock/payments?tenantId={tenantId}
```

## Ejemplos de Uso

### 1. Autenticación

```bash
# Login
TOKEN=$(curl -s -X POST http://localhost:4000/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"admin@example.com","password":"Admin123!"}' \
  | jq -r '.accessToken')
```

### 2. Consultar Agentes

```bash
curl -s "http://localhost:4000/mock/agents?tenantId=test-tenant-001" \
  -H "Authorization: Bearer $TOKEN" \
  | jq '.agents[] | {id, name, status}'
```

### 3. Crear Nuevo Agente

```bash
curl -s -X POST "http://localhost:4000/mock/agents" \
  -H "Authorization: Bearer $TOKEN" \
  -H 'Content-Type: application/json' \
  -d '{
    "tenantId": "test-tenant-001",
    "name": "Agente de Soporte",
    "description": "Atiende consultas de soporte técnico",
    "voice": "es-ES-Standard-B",
    "behavior": "técnico",
    "status": "active"
  }' | jq '.'
```

### 4. Ver Uso del Mes

```bash
curl -s "http://localhost:4000/mock/usage?tenantId=test-tenant-001" \
  -H "Authorization: Bearer $TOKEN" \
  | jq '.summary'
```

### 5. Consultar VoxAgentAI

```bash
curl -s -X POST "http://localhost:4000/mock/voxagentai/query" \
  -H "Authorization: Bearer $TOKEN" \
  -H 'Content-Type: application/json' \
  -d '{
    "tenantId": "test-tenant-001",
    "agentId": "agent-001",
    "query": "¿Cuáles son los horarios de atención?",
    "mode": "text"
  }' | jq '.'
```

## Implementación Técnica

### Servicio: `mockDataService.ts`

Gestiona operaciones de lectura/escritura con:

- **Atomicidad**: Escrituras atómicas con archivo temporal + rename
- **Concurrencia**: Sistema de locks por `{tipo}-{tenantId}`
- **Aislamiento**: Archivos separados por tenant, sin filtrado en memoria
- **Validación**: Verificación de pertenencia de datos al tenant

### Métodos Principales

```typescript
// Agentes
getAgents(tenantId: string)
getAgentById(tenantId: string, id: string)
createAgent(tenantId: string, agent: any)
updateAgent(tenantId: string, id: string, updates: any)
deleteAgent(tenantId: string, id: string)

// Uso
getUsage(tenantId: string)
addUsage(tenantId: string, usage: any)

// Plan
getPlan(tenantId: string)
updatePlan(tenantId: string, plan: any)

// VoxAgentAI
getVoxAgentAIInteractions(tenantId: string)
addVoxAgentAIInteraction(tenantId: string, interaction: any)

// Pagos
getPayments(tenantId: string)
addPayment(tenantId: string, payment: any)
```

## Testing Multi-Tenant

Para probar con múltiples tenants:

```bash
# Crear datos para otro tenant
mkdir -p data/mock
cp data/mock/agents-test-tenant-001.json data/mock/agents-tenant-456.json

# Editar el archivo y cambiar todos los tenantId a "tenant-456"

# Probar aislamiento
curl -s "http://localhost:4000/mock/agents?tenantId=tenant-456" \
  -H "Authorization: Bearer $TOKEN"
```

## Notas de Migración

Si tienes datos en el formato antiguo (archivos únicos con arrays filtrados):

1. **Backup**: Copia los archivos antiguos
2. **Separar por tenant**: Filtra arrays por tenantId
3. **Crear nuevos archivos**: Guarda cada tenant en su propio archivo
4. **Verificar**: Prueba endpoints para confirmar funcionamiento
5. **Eliminar antiguos**: Borra archivos con formato antiguo

```bash
# Ejemplo de separación manual
jq '[.[] | select(.tenantId == "test-tenant-001")]' agents.json > agents-test-tenant-001.json
```

## Troubleshooting

### "No se encuentran datos"
- Verifica que existe el archivo `{tipo}-{tenantId}.json`
- Verifica que el tenantId en la consulta coincide con el del archivo

### "Error al escribir"
- Verifica permisos de escritura en `./data/mock/`
- Verifica que no hay procesos bloqueando el archivo

### "Datos de otro tenant"
- Verifica que el tenantId en el request es correcto
- Verifica que los datos en el archivo tienen el tenantId correcto

## Logs

El sistema registra todas las operaciones:

```
[info] Reading mock data from agents-test-tenant-001.json
[info] Writing mock data to agents-test-tenant-001.json
[warn] Agent agent-003 does not belong to tenant test-tenant-002
```

## Seguridad

- Todos los endpoints requieren JWT válido
- El tenantId se valida contra el usuario autenticado
- Las operaciones de escritura verifican propiedad de los datos
- No se permite acceso a datos de otros tenants
