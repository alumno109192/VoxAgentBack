# 🔐 Credenciales de Prueba - Panel Interno

## ✅ Sistema Configurado

El backend está configurado para funcionar **SIN MongoDB** utilizando un archivo JSON con datos de prueba.

### 📁 Archivos Importantes

- **Datos**: `/data/test-users.json` - Contiene usuarios, llamadas, transcripciones y pagos
- **Data Source**: `/src/utils/jsonDataSource.ts` - Carga y consulta datos del JSON
- **Auth Modificado**: `/src/routes/auth.ts` - Detecta si MongoDB está disponible y usa JSON como fallback
- **Middleware**: `/src/middleware/auth.ts` - Validación de JWT con soporte para JSON

## 👥 Usuarios Disponibles

### 1. Usuario Administrador
```json
{
  "email": "admin@example.com",
  "password": "Admin123!",
  "role": "admin",
  "tenantId": "test-tenant-001"
}
```

**Permisos**: Acceso completo a todos los endpoints

**API Key Widget**: `vox_test_sk_1234567890abcdef`

### 2. Usuario Operador
```json
{
  "email": "operator@example.com",
  "password": "Operator123!",
  "role": "operator",
  "tenantId": "test-tenant-001"
}
```

**Permisos**: Acceso a endpoints de su tenant

## 🚀 Cómo Usar

### 1. Iniciar el Servidor
```bash
npm run dev
```

El servidor iniciará en `http://localhost:4000`

### 2. Login (Obtener JWT)
```bash
curl -X POST http://localhost:4000/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@example.com",
    "password": "Admin123!"
  }'
```

**Respuesta:**
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "user-admin-001",
    "email": "admin@example.com",
    "name": "Admin User",
    "role": "admin",
    "tenantId": "test-tenant-001"
  }
}
```

### 3. Usar el Token en Requests
```bash
# Guardar token
export TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."

# Ejemplo: Obtener llamadas
curl -H "Authorization: Bearer $TOKEN" \
  "http://localhost:4000/calls?tenantId=test-tenant-001"
```

## 📊 Datos de Prueba Disponibles

El archivo JSON incluye:

- **1 Tenant**: Demo Medical Center
- **2 Usuarios**: Admin + Operator
- **3 Llamadas**: Con diferentes estados y metadata
- **3 Transcripciones**: Con chunks y confianza
- **2 Pagos**: Suscripción mensual + cargos por llamadas

## 🔧 Script de Prueba

Ejecuta el script de prueba automático:

```bash
chmod +x scripts/test-login.sh
./scripts/test-login.sh
```

## 📝 Workflow Completo

```bash
# 1. Login como admin
ADMIN_TOKEN=$(curl -s -X POST http://localhost:4000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"Admin123!"}' \
  | jq -r '.accessToken')

echo "Token: $ADMIN_TOKEN"

# 2. Obtener datos del tenant
curl -H "Authorization: Bearer $ADMIN_TOKEN" \
  http://localhost:4000/tenant/test-tenant-001 | jq .

# 3. Listar llamadas
curl -H "Authorization: Bearer $ADMIN_TOKEN" \
  "http://localhost:4000/calls?tenantId=test-tenant-001" | jq .

# 4. Ver detalles de una llamada con transcripción
curl -H "Authorization: Bearer $ADMIN_TOKEN" \
  http://localhost:4000/calls/call-001 | jq .

# 5. Buscar transcripciones
curl -H "Authorization: Bearer $ADMIN_TOKEN" \
  "http://localhost:4000/transcriptions?tenantId=test-tenant-001&search=medication" | jq .

# 6. Historial de pagos
curl -H "Authorization: Bearer $ADMIN_TOKEN" \
  "http://localhost:4000/billing/payments?tenantId=test-tenant-001" | jq .

# 7. Crear un agente virtual
curl -X POST http://localhost:4000/agents \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "tenantId": "test-tenant-001",
    "name": "Recepción Médica",
    "description": "Agente para atención de pacientes",
    "configuration": {
      "language": "es",
      "voiceId": "voice-friendly",
      "behavior": "Profesional y empático",
      "temperature": 0.7,
      "welcomeMessage": "Hola, soy el asistente virtual. ¿En qué puedo ayudarte?"
    },
    "metadata": {
      "tags": ["recepcion", "atencion"],
      "category": "customer-service"
    }
  }' | jq .

# 8. Listar agentes
curl -H "Authorization: Bearer $ADMIN_TOKEN" \
  "http://localhost:4000/agents?tenantId=test-tenant-001" | jq .

# 9. Consultar uso (angelitos)
curl -H "Authorization: Bearer $ADMIN_TOKEN" \
  "http://localhost:4000/usage?tenantId=test-tenant-001&groupBy=day" | jq .

# 10. Resumen de uso
curl -H "Authorization: Bearer $ADMIN_TOKEN" \
  "http://localhost:4000/usage/summary?tenantId=test-tenant-001" | jq .

# 11. Ver plan actual
curl -H "Authorization: Bearer $ADMIN_TOKEN" \
  "http://localhost:4000/plan/current?tenantId=test-tenant-001" | jq .

# 12. Listar planes disponibles
curl -H "Authorization: Bearer $ADMIN_TOKEN" \
  http://localhost:4000/plan | jq .

# 13. Consulta a VoxAgentAI
curl -X POST http://localhost:4000/voxagentai/query \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "tenantId": "test-tenant-001",
    "query": "¿Cuál es el horario de atención?",
    "mode": "text"
  }' | jq .

# 14. Estado de VoxAgentAI
curl -H "Authorization: Bearer $ADMIN_TOKEN" \
  "http://localhost:4000/voxagentai/status?tenantId=test-tenant-001" | jq .

# ========== ENDPOINTS MOCK (Desarrollo/Demo) ==========

# 15. Listar agentes mock
curl -H "Authorization: Bearer $ADMIN_TOKEN" \
  "http://localhost:4000/mock/agents?tenantId=test-tenant-001" | jq .

# 16. Crear agente mock
curl -X POST http://localhost:4000/mock/agents \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "tenantId": "test-tenant-001",
    "name": "Agente Mock",
    "description": "Agente de prueba",
    "voice": "es-ES-Standard-A",
    "behavior": "amable"
  }' | jq .

# 17. Obtener datos de uso mock
curl -H "Authorization: Bearer $ADMIN_TOKEN" \
  "http://localhost:4000/mock/usage?tenantId=test-tenant-001" | jq .

# 18. Ver plan mock
curl -H "Authorization: Bearer $ADMIN_TOKEN" \
  "http://localhost:4000/mock/plan?tenantId=test-tenant-001" | jq .

# 19. Consultar VoxAgentAI mock
curl -X POST http://localhost:4000/mock/voxagentai/query \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "tenantId": "test-tenant-001",
    "query": "¿Cómo funciona esto?",
    "mode": "text"
  }' | jq .

# 20. Listar interacciones VoxAgentAI mock
curl -H "Authorization: Bearer $ADMIN_TOKEN" \
  "http://localhost:4000/mock/voxagentai?tenantId=test-tenant-001" | jq .

# 21. Ver pagos mock
curl -H "Authorization: Bearer $ADMIN_TOKEN" \
  "http://localhost:4000/mock/payments?tenantId=test-tenant-001" | jq .

# ========== ENDPOINTS WIDGET EMBEBIBLE ==========

# 22. Obtener configuración del widget (público)
curl -s 'http://localhost:4000/widget/config?tenantId=test-tenant-001' | jq .

# 23. Consulta desde widget (con API Key)
curl -X POST 'http://localhost:4000/widget/query' \
  -H 'Content-Type: application/json' \
  -H 'X-API-Key: vox_test_sk_1234567890abcdef' \
  -d '{
    "tenantId": "test-tenant-001",
    "query": "¿Cuál es el horario de atención?",
    "mode": "text",
    "sessionId": "session-abc123"
  }' | jq .

# 24. Historial de interacciones del widget
curl -H "Authorization: Bearer $ADMIN_TOKEN" \
  "http://localhost:4000/widget/interactions?tenantId=test-tenant-001" | jq .

# 25. Estadísticas del widget
curl -H "Authorization: Bearer $ADMIN_TOKEN" \
  "http://localhost:4000/widget/stats?tenantId=test-tenant-001" | jq .

# 26. Actualizar configuración del widget
curl -X PUT http://localhost:4000/widget/config \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "tenantId": "test-tenant-001",
    "theme": "dark",
    "primaryColor": "#8B5CF6",
    "welcomeMessage": "¡Bienvenido! ¿Cómo puedo ayudarte?"
  }' | jq .

# ========== ENDPOINTS WIDGET MOCK (Desarrollo) ==========

# 27. Obtener configuración mock (sin auth)
curl -s 'http://localhost:4000/widget-mock/config' | jq .

# 28. Consulta mock (sin API Key)
curl -X POST 'http://localhost:4000/widget-mock/query' \
  -H 'Content-Type: application/json' \
  -d '{
    "query": "¿Cómo funciona el widget?",
    "mode": "text",
    "sessionId": "demo-test-123"
  }' | jq .

# 29. Ver interacciones mock
curl -s 'http://localhost:4000/widget-mock/interactions?limit=5' | jq .

# 30. Estadísticas mock
curl -s 'http://localhost:4000/widget-mock/stats' | jq .
```

## 🎯 Endpoints del Panel Interno

### Gestión de Datos
| Método | Endpoint | Requiere Auth | Descripción |
|--------|----------|---------------|-------------|
| POST | `/auth/login` | ❌ | Login con email/password |
| GET | `/tenant/:id` | ✅ | Datos del tenant |
| POST | `/tenant/:id/regenerate-key` | ✅ | Nueva API key |
| PATCH | `/tenant/:id` | ✅ | Actualizar configuración |
| GET | `/calls` | ✅ | Lista de llamadas |
| GET | `/calls/:id` | ✅ | Detalle de llamada |
| GET | `/transcriptions` | ✅ | Lista de transcripciones |
| GET | `/transcriptions/:id` | ✅ | Detalle de transcripción |
| GET | `/billing/payments` | ✅ | Historial de pagos |

### 🤖 Gestión de Agentes
| Método | Endpoint | Requiere Auth | Descripción |
|--------|----------|---------------|-------------|
| GET | `/agents` | ✅ | Lista de agentes virtuales |
| GET | `/agents/:id` | ✅ | Detalle de agente |
| POST | `/agents` | ✅ | Crear nuevo agente |
| PUT | `/agents/:id` | ✅ | Actualizar agente |
| DELETE | `/agents/:id` | ✅ | Desactivar agente |

### 📊 Uso y Consumo (Angelitos)
| Método | Endpoint | Requiere Auth | Descripción |
|--------|----------|---------------|-------------|
| GET | `/usage` | ✅ | Historial de consumo de minutos |
| GET | `/usage/summary` | ✅ | Resumen con comparativa mensual |
| POST | `/usage` | ✅ | Registrar consumo (interno) |

### 💎 Gestión de Planes
| Método | Endpoint | Requiere Auth | Descripción |
|--------|----------|---------------|-------------|
| GET | `/plan/current` | ✅ | Plan actual con porcentajes de uso |
| GET | `/plan` | ✅ | Lista de planes disponibles |
| POST | `/plan/change` | ✅ | Cambiar plan del tenant |

### 🎙️ VoxAgentAI
| Método | Endpoint | Requiere Auth | Descripción |
|--------|----------|---------------|-------------|
| POST | `/voxagentai/query` | ✅ | Consulta a VoxAgentAI (texto/voz) |
| GET | `/voxagentai/status` | ✅ | Estado y cuota de VoxAgentAI |

### 📁 Mock Data (Desarrollo/Demo)
| Método | Endpoint | Requiere Auth | Descripción |
|--------|----------|---------------|-------------|
| GET | `/mock/agents` | ✅ | Lista de agentes mock |
| GET | `/mock/agents/:id` | ✅ | Detalle de agente mock |
| POST | `/mock/agents` | ✅ | Crear agente mock |
| PUT | `/mock/agents/:id` | ✅ | Actualizar agente mock |
| DELETE | `/mock/agents/:id` | ✅ | Eliminar agente mock |
| GET | `/mock/usage` | ✅ | Datos de uso mock |
| GET | `/mock/plan` | ✅ | Plan actual mock |
| POST | `/mock/plan/change` | ✅ | Cambiar plan mock |
| GET | `/mock/voxagentai` | ✅ | Interacciones VoxAgentAI mock |
| POST | `/mock/voxagentai/query` | ✅ | Consulta VoxAgentAI mock |
| GET | `/mock/payments` | ✅ | Historial de pagos mock |

### 🎨 Widget Embebible
| Método | Endpoint | Requiere Auth | Descripción |
|--------|----------|---------------|-------------|
| GET | `/widget/config` | ❌ (Público) | Configuración del widget |
| POST | `/widget/query` | 🔑 (API Key) | Procesar consulta desde widget |
| PUT | `/widget/config` | ✅ (JWT) | Actualizar configuración widget |
| GET | `/widget/interactions` | ✅ (JWT) | Historial de interacciones |
| GET | `/widget/stats` | ✅ (JWT) | Estadísticas de uso del widget |

### 🧪 Widget Mock (Desarrollo Sin Auth)
| Método | Endpoint | Requiere Auth | Descripción |
|--------|----------|---------------|-------------|
| GET | `/widget-mock/config` | ❌ (Público) | Config mock para desarrollo rápido |
| POST | `/widget-mock/query` | ❌ (Público) | Query mock sin API Key |
| GET | `/widget-mock/interactions` | ❌ (Público) | Ver historial mock |
| GET | `/widget-mock/stats` | ❌ (Público) | Estadísticas mock |

## 🔍 Verificación

### Health Check
```bash
curl http://localhost:4000/health
```

### Swagger UI
Abre en tu navegador: `http://localhost:4000/docs`

## ⚙️ Modo de Operación

El backend detecta automáticamente si MongoDB está disponible:

- **✅ MongoDB disponible**: Usa la base de datos
- **❌ MongoDB no disponible**: Usa `data/test-users.json`

Los logs mostrarán:
```
2025-11-16 18:25:49 [warn] MongoDB not configured, skipping connection
2025-11-16 18:25:51 [info] Using JSON data source for authentication
2025-11-16 18:25:51 [info] Test data loaded from JSON file
2025-11-16 18:25:51 [info] User logged in (JSON): admin@example.com
```

## 🎨 Para el Frontend

El frontend puede usar estas credenciales para probar:

```javascript
// Login
const response = await fetch('http://localhost:4000/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'admin@example.com',
    password: 'Admin123!'
  })
});

const { accessToken, user } = await response.json();

// Usar token en requests
const calls = await fetch('http://localhost:4000/calls?tenantId=test-tenant-001', {
  headers: { 'Authorization': `Bearer ${accessToken}` }
});
```

---

**Nota**: Estas credenciales son **solo para desarrollo local**. No usar en producción.
