# 📘 Guía de OpenAPI/Swagger - VoiceTotem Studio

## 🚀 Acceso Rápido

### Swagger UI (Interfaz Interactiva)
```
http://localhost:4000/docs
```

Esta interfaz te permite:
- ✅ Explorar todos los endpoints
- ✅ Probar las APIs directamente desde el navegador
- ✅ Ver ejemplos de requests y responses
- ✅ Generar código para diferentes lenguajes
- ✅ Descargar la especificación OpenAPI

---

## 📥 Descargar Especificación OpenAPI

### Formato JSON
```bash
curl http://localhost:4000/docs/swagger.json -o openapi.json
```

### Formato YAML
Puedes usar herramientas como `swagger-cli` para convertir:
```bash
npm install -g @apidevtools/swagger-cli
swagger-cli bundle docs/swagger.ts -o openapi.yaml -t yaml
```

---

## 🧪 Probar la API desde Swagger UI

### 1. Autenticación con JWT

1. Ir a http://localhost:4000/docs
2. Expandir el endpoint `POST /auth/login`
3. Click en "Try it out"
4. Completar el body:
```json
{
  "email": "admin@voicetotem.com",
  "password": "admin123"
}
```
5. Click en "Execute"
6. Copiar el `token` de la respuesta
7. Scroll arriba y click en el botón "Authorize" 🔓
8. Pegar el token en el campo `bearerAuth`
9. Click "Authorize" y luego "Close"
10. ¡Ahora puedes probar todos los endpoints protegidos!

### 2. Autenticación con API Key

Para endpoints del widget:

1. Ir a http://localhost:4000/docs
2. Click en el botón "Authorize" 🔓
3. En la sección `apiKeyAuth`:
   - Ingresar tu API Key (ej: `sk_test_123...`)
4. Click "Authorize" y luego "Close"
5. Probar endpoints como `/widget/query`

---

## 🔧 Configuración Actual de OpenAPI

### Información General
```yaml
openapi: 3.0.0
info:
  title: VoiceTotem Studio API
  version: 1.0.0
  description: API completa para asistentes de voz con IA
```

### Servidores Configurados
```yaml
servers:
  - url: http://localhost:4000
    description: Development server
  - url: https://api.voicetotem.com
    description: Production server
  - url: https://staging.api.voicetotem.com
    description: Staging server
```

### Esquemas de Autenticación
```yaml
securitySchemes:
  bearerAuth:
    type: http
    scheme: bearer
    bearerFormat: JWT
  apiKeyAuth:
    type: apiKey
    in: header
    name: X-API-Key
```

---

## 📦 Esquemas Principales

### User
```typescript
{
  id: string
  email: string (email format)
  role: 'admin' | 'operator' | 'user'
  tenantId: string
  createdAt: string (date-time)
}
```

### Agent
```typescript
{
  id: string
  name: string
  language: string
  voice: string
  status: 'active' | 'inactive' | 'archived'
  settings: object
  createdAt: string (date-time)
  updatedAt: string (date-time)
}
```

### Call
```typescript
{
  id: string
  agentId: string
  phoneNumber: string
  duration: number  // segundos
  status: 'queued' | 'ringing' | 'in-progress' | 'completed' | 'failed' | 'cancelled'
  cost: number  // USD
  recording: string (uri)
  transcription: string
  createdAt: string (date-time)
}
```

### Transcription
```typescript
{
  id: string
  sessionId: string
  text: string
  confidence: number  // 0-1
  language: string
  duration: number  // segundos
  timestamp: string (date-time)
}
```

### Plan
```typescript
{
  id: string
  name: string
  price: number  // USD mensual
  limits: {
    maxCalls: number
    maxMinutes: number
    maxAgents: number
    maxTranscriptions: number
  }
  features: string[]
}
```

### WidgetConfig
```typescript
{
  publicKey: string
  assistantId: string
  theme: {
    primaryColor: string
    position: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left'
  }
}
```

### Usage
```typescript
{
  period: string  // YYYY-MM
  totalCalls: number
  totalMinutes: number
  totalTranscriptions: number
  totalCost: number  // USD
  breakdown: {
    callCosts: number
    transcriptionCosts: number
    storageCosts: number
  }
}
```

---

## 🏷️ Tags (Categorías)

| Tag | Descripción | Icono |
|-----|-------------|-------|
| Health | Health check y estado del sistema | 🏥 |
| Auth | Autenticación y gestión de sesiones | 🔐 |
| Widget | Widget embebible para sitios web | 🎨 |
| Transcription | Transcripciones de audio con VAPI | 🎙️ |
| Agents | Gestión de agentes de voz | 🤖 |
| Calls | Llamadas y grabaciones | 📞 |
| Billing | Facturación y pagos | 💳 |
| Plans | Planes y suscripciones | 📦 |
| Usage | Uso y estadísticas | 📊 |
| VoxAgentAI | Motor de IA VoxAgent | 🧠 |
| Tenant | Gestión de tenants | 🏢 |
| Webhooks | Webhooks de integraciones externas | 🔔 |
| Admin | Endpoints administrativos | 👑 |
| Mock | Endpoints mock para desarrollo | 🧪 |
| Contact | Formulario de contacto | 📧 |

---

## 🔄 Responses Comunes

### 401 Unauthorized
```json
{
  "error": "Unauthorized",
  "code": "AUTH_REQUIRED"
}
```

### 403 Forbidden
```json
{
  "error": "Forbidden",
  "code": "INSUFFICIENT_PERMISSIONS"
}
```

### 404 Not Found
```json
{
  "error": "Not Found",
  "code": "RESOURCE_NOT_FOUND"
}
```

### 422 Validation Error
```json
{
  "error": "Validation Error",
  "code": "VALIDATION_FAILED",
  "details": {
    "email": "Email is required"
  }
}
```

### 429 Rate Limit
```json
{
  "error": "Too Many Requests",
  "code": "RATE_LIMIT_EXCEEDED"
}
```

---

## 📚 Generar Clientes SDK

### JavaScript/TypeScript
```bash
npx @openapitools/openapi-generator-cli generate \
  -i http://localhost:4000/docs/swagger.json \
  -g typescript-axios \
  -o ./sdk/typescript
```

### Python
```bash
openapi-generator-cli generate \
  -i http://localhost:4000/docs/swagger.json \
  -g python \
  -o ./sdk/python
```

### PHP
```bash
openapi-generator-cli generate \
  -i http://localhost:4000/docs/swagger.json \
  -g php \
  -o ./sdk/php
```

### Otros lenguajes soportados
- Java
- Go
- Ruby
- C#
- Swift
- Kotlin
- Rust
- Y muchos más...

Ver lista completa: https://openapi-generator.tech/docs/generators

---

## 🧰 Herramientas Recomendadas

### Insomnia
Importar la especificación OpenAPI:
1. Abrir Insomnia
2. File → Import → From URL
3. Pegar: `http://localhost:4000/docs/swagger.json`

### Postman
Importar colección:
1. Abrir Postman
2. Import → Link
3. Pegar: `http://localhost:4000/docs/swagger.json`
4. ¡La colección completa se importará automáticamente!

### VS Code Extensions
- **OpenAPI (Swagger) Editor** - 42Crunch
- **REST Client** - Humao
- **Thunder Client** - Ranga Vadhineni

### CLI Tools
```bash
# Instalar swagger-cli
npm install -g @apidevtools/swagger-cli

# Validar especificación
swagger-cli validate http://localhost:4000/docs/swagger.json

# Bundle (combinar refs)
swagger-cli bundle src/docs/swagger.ts -o openapi-bundle.json
```

---

## 🎯 Mejores Prácticas

### 1. Documentar con JSDoc
Agregar comentarios JSDoc en las rutas:

```typescript
/**
 * @swagger
 * /agents:
 *   get:
 *     summary: Listar todos los agentes
 *     tags: [Agents]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de agentes
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 agents:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Agent'
 */
router.get('/agents', authenticate, listAgents);
```

### 2. Usar Referencias
```yaml
$ref: '#/components/schemas/Agent'
$ref: '#/components/responses/UnauthorizedError'
```

### 3. Ejemplos Realistas
```yaml
example:
  id: "agent_123"
  name: "Recepcionista Virtual"
  language: "es-ES"
```

### 4. Validación de Esquemas
```yaml
required:
  - email
  - password
minLength: 8
format: email
```

---

## 🔍 Testing con Swagger

### Workflow de Pruebas

1. **Health Check**
   - GET /health
   - Verificar que el servidor responde

2. **Autenticación**
   - POST /auth/login
   - Copiar token

3. **Configurar Autorización**
   - Click "Authorize"
   - Pegar token

4. **Probar Endpoints Protegidos**
   - GET /agents
   - POST /agents
   - PUT /agents/:id

5. **Probar Widget (API Key)**
   - GET /widget/config
   - POST /widget/query

6. **Verificar Errores**
   - Probar sin auth (401)
   - Probar con datos inválidos (422)

---

## 📊 Monitoreo y Analytics

### Ver Logs de Swagger UI
```bash
# En desarrollo
tail -f logs/combined.log | grep "GET /docs"
```

### Métricas Útiles
- Endpoints más consultados en Swagger UI
- Errores comunes en las pruebas
- Tiempo de respuesta promedio

---

## 🚀 Deploy de Documentación

### GitHub Pages
```bash
# Generar HTML estático
npx redoc-cli bundle http://localhost:4000/docs/swagger.json -o docs/index.html

# Publicar en GitHub Pages
git add docs/index.html
git commit -m "Update API docs"
git push origin main
```

### Netlify/Vercel
1. Generar HTML:
```bash
npx redoc-cli bundle openapi.json -o public/index.html
```
2. Deploy carpeta `public/`

### Alternativa: Swagger UI Standalone
```bash
# Servir documentación estática
npx http-server ./swagger-ui -p 8080
```

---

## 🔗 Enlaces Útiles

- **OpenAPI Spec**: https://swagger.io/specification/
- **Swagger UI Docs**: https://swagger.io/tools/swagger-ui/
- **OpenAPI Generator**: https://openapi-generator.tech/
- **Redoc**: https://redocly.com/
- **Stoplight**: https://stoplight.io/

---

## ❓ FAQ

**Q: ¿Cómo actualizo la documentación?**  
A: Los cambios en `src/docs/swagger.ts` se reflejan automáticamente en `/docs`

**Q: ¿Puedo desactivar Swagger en producción?**  
A: Sí, está configurado para solo mostrarse en desarrollo/staging

**Q: ¿Cómo exporto la colección de Postman?**  
A: Importa desde `http://localhost:4000/docs/swagger.json`

**Q: ¿Swagger soporta autenticación múltiple?**  
A: Sí, puedes configurar JWT y API Key simultáneamente

**Q: ¿Puedo personalizar el tema de Swagger UI?**  
A: Sí, puedes pasar opciones personalizadas a `swaggerUi.setup()`

---

**📘 Documentación completa de endpoints:** [API_ENDPOINTS.md](./API_ENDPOINTS.md)  
**🏗️ Arquitectura del sistema:** [ARCHITECTURE.md](./ARCHITECTURE.md)  
**🔐 Seguridad:** [SECURITY.md](./SECURITY.md)
