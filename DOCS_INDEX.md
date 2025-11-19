# 📘 VoiceTotem Studio Backend - Índice de Documentación

## 🎯 Inicio Rápido

### Swagger UI (Documentación Interactiva OpenAPI)
```bash
# Opción 1: Script automatizado
./scripts/start-swagger.sh

# Opción 2: Manual
npm run dev
# Luego abrir: http://localhost:4000/docs
```

### Widget Demos VAPI
```bash
# Opción 1: Script automatizado
./scripts/start-with-demos.sh

# Opción 2: Manual
npm run dev
# Luego abrir: http://localhost:4000/examples/
```

---

## 📚 Documentación Disponible

### 🔥 Principales (NUEVOS)

1. **[RESUMEN_ENDPOINTS_OPENAPI.md](./RESUMEN_ENDPOINTS_OPENAPI.md)** ⭐ **EMPEZAR AQUÍ**
   - Resumen completo de la implementación
   - 61 endpoints documentados
   - OpenAPI/Swagger configurado
   - Guía rápida de inicio
   - Checklist de verificación

2. **[docs/API_ENDPOINTS.md](./docs/API_ENDPOINTS.md)** 📖 **REFERENCIA COMPLETA**
   - Documentación detallada de TODOS los endpoints
   - Ejemplos de requests y responses
   - Códigos de error
   - Guía de autenticación
   - Ejemplos curl

3. **[docs/OPENAPI_GUIDE.md](./docs/OPENAPI_GUIDE.md)** 🧰 **GUÍA SWAGGER**
   - Cómo usar Swagger UI
   - Generar SDKs para múltiples lenguajes
   - Integración con Postman/Insomnia
   - Mejores prácticas
   - FAQ

### 📖 Documentación Técnica

4. **[docs/ARCHITECTURE.md](./docs/ARCHITECTURE.md)**
   - Arquitectura del sistema
   - Flujos de datos
   - Diagramas
   - Tecnologías utilizadas

5. **[docs/SECURITY.md](./docs/SECURITY.md)**
   - Seguridad y autenticación
   - Mejores prácticas
   - Manejo de API Keys
   - Encriptación

6. **[docs/DEPLOYMENT.md](./docs/DEPLOYMENT.md)**
   - Guía de deployment
   - Configuración de producción
   - Docker
   - Variables de entorno

### 🎨 VAPI/Widget

7. **[VAPI_CONFIGURADO.md](./VAPI_CONFIGURADO.md)**
   - Integración completa con VAPI
   - Configuración del widget
   - Ejemplos de uso
   - Costos y límites

8. **[README_VAPI.md](./README_VAPI.md)**
   - Resumen ejecutivo VAPI
   - Quick start
   - Comandos principales

9. **[QUICKSTART_VAPI.md](./QUICKSTART_VAPI.md)**
   - Inicio rápido en 3 pasos
   - Ejemplos HTML
   - Troubleshooting

10. **[START_HERE.md](./START_HERE.md)**
    - Guía de inicio simple
    - URLs importantes
    - Credenciales VAPI

### 📋 Ejemplos

11. **[examples/curl-examples.md](./examples/curl-examples.md)**
    - Ejemplos de llamadas con curl
    - Testing manual

12. **[examples/postman-collection.json](./examples/postman-collection.json)**
    - Colección de Postman
    - Importar directamente

---

## 🚀 Scripts Disponibles

### Swagger/OpenAPI
```bash
./scripts/start-swagger.sh    # Iniciar servidor y abrir Swagger UI
```

### VAPI Widget
```bash
./scripts/start-with-demos.sh # Iniciar servidor y abrir demos
./scripts/open-demos.sh        # Menú interactivo de demos
```

### Test & Build
```bash
npm run dev                    # Desarrollo con hot reload
npm run build                  # Compilar TypeScript
npm run test                   # Ejecutar tests
npm run lint                   # Linter
```

---

## 🌐 URLs Principales

| Servicio | URL | Descripción |
|----------|-----|-------------|
| **Swagger UI** | http://localhost:4000/docs | Documentación interactiva OpenAPI |
| **Health Check** | http://localhost:4000/health | Estado del servidor |
| **Widget Demos** | http://localhost:4000/examples/ | Demos del widget VAPI |
| **API Base** | http://localhost:4000 | Base URL de la API |
| **Swagger JSON** | http://localhost:4000/docs/swagger.json | Spec OpenAPI JSON |

---

## 📊 Endpoints por Categoría

| Categoría | Cantidad | Docs |
|-----------|----------|------|
| Autenticación | 3 | [Ver](./docs/API_ENDPOINTS.md#autenticación) |
| Health | 1 | [Ver](./docs/API_ENDPOINTS.md#health--status) |
| Widget | 5 | [Ver](./docs/API_ENDPOINTS.md#widget-público) |
| Transcripciones | 7 | [Ver](./docs/API_ENDPOINTS.md#transcripciones) |
| Agentes | 5 | [Ver](./docs/API_ENDPOINTS.md#agentes) |
| Llamadas | 2 | [Ver](./docs/API_ENDPOINTS.md#llamadas) |
| Billing | 3 | [Ver](./docs/API_ENDPOINTS.md#billing) |
| Planes | 3 | [Ver](./docs/API_ENDPOINTS.md#planes) |
| Uso | 3 | [Ver](./docs/API_ENDPOINTS.md#usoUsage) |
| VoxAgentAI | 2 | [Ver](./docs/API_ENDPOINTS.md#voxagentai) |
| Tenant | 3 | [Ver](./docs/API_ENDPOINTS.md#tenant) |
| Webhooks | 2 | [Ver](./docs/API_ENDPOINTS.md#webhooks) |
| Admin | 6 | [Ver](./docs/API_ENDPOINTS.md#admin) |
| Mock | 15 | [Ver](./docs/API_ENDPOINTS.md#mockdevelopment) |
| Contacto | 1 | [Ver](./docs/API_ENDPOINTS.md#contacto) |
| **TOTAL** | **61** | - |

---

## 🔐 Autenticación

### JWT (Bearer Token)
Para endpoints del panel interno:
```bash
# 1. Login
curl -X POST http://localhost:4000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@test.com","password":"password"}'

# 2. Usar token
curl http://localhost:4000/agents \
  -H "Authorization: Bearer <token>"
```

### API Key
Para widget y transcripciones públicas:
```bash
curl -X POST http://localhost:4000/widget/query \
  -H "X-API-Key: sk_live_..." \
  -H "Content-Type: application/json" \
  -d '{"query":"Hola","sessionId":"123"}'
```

---

## 🎯 Flujo de Trabajo Recomendado

### Para Nuevos Desarrolladores

1. **Leer primero:**
   - `RESUMEN_ENDPOINTS_OPENAPI.md` - Overview completo
   - `docs/ARCHITECTURE.md` - Entender la arquitectura

2. **Configurar entorno:**
   ```bash
   npm install
   cp .env.example .env
   # Editar .env con tus credenciales
   ```

3. **Iniciar servidor:**
   ```bash
   ./scripts/start-swagger.sh
   ```

4. **Explorar API:**
   - Abrir Swagger UI: http://localhost:4000/docs
   - Probar endpoints
   - Ver ejemplos

5. **Integrar:**
   - Revisar `docs/API_ENDPOINTS.md`
   - Generar SDK si es necesario
   - Implementar en tu app

### Para Testing

1. **Swagger UI** - Testing visual interactivo
2. **Postman** - Importar `http://localhost:4000/docs/swagger.json`
3. **curl** - Ver `examples/curl-examples.md`
4. **SDK** - Generar con OpenAPI Generator

---

## 🧪 Testing Rápido

### Health Check
```bash
curl http://localhost:4000/health
```

### Widget Config
```bash
curl http://localhost:4000/widget/config
```

### Login
```bash
curl -X POST http://localhost:4000/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123"
  }'
```

---

## 📦 Generar SDK

### TypeScript
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

Ver más en: `docs/OPENAPI_GUIDE.md`

---

## 🛠️ Herramientas de Desarrollo

### VS Code Extensions Recomendadas
- **REST Client** - Probar APIs desde VS Code
- **Thunder Client** - Cliente HTTP ligero
- **OpenAPI (Swagger) Editor** - Editar specs

### Importar en Postman
```
Import → Link → http://localhost:4000/docs/swagger.json
```

### Importar en Insomnia
```
Import/Export → Import Data → From URL
http://localhost:4000/docs/swagger.json
```

---

## 📝 Contribuir

### Agregar nuevo endpoint

1. **Crear la ruta** en `src/routes/`
2. **Agregar JSDoc** con anotaciones Swagger
3. **Documentar** en `docs/API_ENDPOINTS.md`
4. **Actualizar** este índice si es necesario

### Ejemplo JSDoc Swagger:
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
 */
router.get('/agents', authenticate, listAgents);
```

---

## ❓ FAQ

**Q: ¿Por dónde empiezo?**  
A: `RESUMEN_ENDPOINTS_OPENAPI.md` y luego `./scripts/start-swagger.sh`

**Q: ¿Cómo veo todos los endpoints?**  
A: `docs/API_ENDPOINTS.md` o http://localhost:4000/docs

**Q: ¿Cómo pruebo la API?**  
A: Swagger UI en http://localhost:4000/docs

**Q: ¿Cómo genero un cliente SDK?**  
A: Ver sección "Generar SDK" en `docs/OPENAPI_GUIDE.md`

**Q: ¿Dónde están las demos del widget?**  
A: http://localhost:4000/examples/ o `./scripts/start-with-demos.sh`

**Q: ¿Cómo importo en Postman?**  
A: Import → Link → `http://localhost:4000/docs/swagger.json`

---

## 🔗 Enlaces Externos

- **OpenAPI Specification**: https://swagger.io/specification/
- **Swagger UI**: https://swagger.io/tools/swagger-ui/
- **OpenAPI Generator**: https://openapi-generator.tech/
- **VAPI Docs**: https://docs.vapi.ai/

---

## 📞 Soporte

- **Email**: support@voicetotem.com
- **Docs**: Este repositorio
- **Issues**: GitHub Issues

---

**Última actualización:** 19 de noviembre de 2025  
**Versión de la API:** 1.0.0
