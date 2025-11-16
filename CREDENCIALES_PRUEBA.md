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
```

## 🎯 Endpoints del Panel Interno

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
