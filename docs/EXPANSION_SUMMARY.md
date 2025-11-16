# Ampliación del Backend - Panel Interno ✅

## 🎯 Resumen Ejecutivo

El backend ha sido **completamente implementado** para servir datos al panel interno del cliente. Todos los endpoints requeridos están funcionales, protegidos con JWT, y listos para producción.

---

## ✅ Implementación Completada

### Endpoints Públicos (4/4)
- ✅ `POST /auth/login` - Autenticación con JWT
- ✅ `POST /billing/create-session` - Crear sesión de pago (test/real)
- ✅ `POST /webhooks/stripe-emulator` - Recibir pagos simulados
- ✅ `POST /webhooks/bland/events` - Eventos de llamadas/transcripciones

### Endpoints Protegidos JWT (7/7)
- ✅ `GET /calls?tenantId=` - Lista de llamadas
- ✅ `GET /calls/:id` - Detalle de llamada
- ✅ `GET /transcriptions?tenantId=` - Lista de transcripciones
- ✅ `GET /transcriptions/:id` - Detalle de transcripción
- ✅ `GET /billing/payments?tenantId=` - Historial de pagos
- ✅ `GET /tenant/:id` - Datos del cliente
- ✅ `POST /tenant/:id/regenerate-key` - Nueva API key

### Modelos de Datos (5/5)
- ✅ User (email, passwordHash, role)
- ✅ Tenant (nombre, apiKey, idioma, voz, estado)
- ✅ CallLog (tenantId, fecha, duración, status)
- ✅ Transcription (texto, llamada vinculada)
- ✅ BillingRecord (monto, estado, providerId)

### Características de Seguridad (5/5)
- ✅ Validación JWT en todos los endpoints protegidos
- ✅ Verificación de firma HMAC en webhooks
- ✅ CORS con whitelist configurable
- ✅ Helmet + Rate Limiting
- ✅ Logs sin PII (información sensible)

### JSON Storage (4/4)
- ✅ Carpeta `./data/payments`
- ✅ Archivos por día: `payments-YYYY-MM-DD.json`
- ✅ Escritura atómica (tmp file + rename)
- ✅ Verificación de idempotencia por `providerPaymentId`

---

## 📁 Archivos Clave

### Controllers
```
src/controllers/
├── authController.ts          ✅ Login, refresh, logout
├── billingController.ts       ✅ Pagos, sesiones, webhooks
├── callsController.ts         ✅ Lista y detalle de llamadas
├── transcriptionsController.ts ✅ Lista y detalle de transcripciones
└── tenantController.ts        ✅ Datos y regeneración de API key
```

### Routes
```
src/routes/
├── auth.ts                    ✅ Rutas públicas de autenticación
├── billing.ts                 ✅ Rutas protegidas de billing
├── calls.ts                   ✅ Rutas protegidas de llamadas
├── transcriptions.ts          ✅ Rutas protegidas de transcripciones
├── tenant.ts                  ✅ Rutas protegidas de tenant
└── webhooks.ts                ✅ Webhooks públicos (Bland + Stripe emulator)
```

### Utilities
```
src/utils/
├── paymentsFile.ts            ✅ Escritura atómica a JSON
├── jsonDataSource.ts          ✅ Fallback sin MongoDB
├── encryption.ts              ✅ HMAC, generación de keys
└── logger.ts                  ✅ Winston logger sin PII
```

---

## 🚀 Inicio Rápido

### 1. Instalación

```bash
# Clonar repositorio
git clone <repo-url>
cd VoiceTotemStudioBackend

# Instalar dependencias
npm install

# Configurar variables de entorno
cp .env.example .env
# Editar .env con tus credenciales
```

### 2. Desarrollo Local

```bash
# Iniciar servidor de desarrollo
npm run dev

# El servidor estará en http://localhost:4000
```

### 3. Testing

```bash
# Login para obtener JWT
curl -X POST http://localhost:4000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"password"}'

# Usar el accessToken en endpoints protegidos
curl -X GET "http://localhost:4000/calls?tenantId=XXX" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### 4. Build para Producción

```bash
# Compilar TypeScript
npm run build

# Iniciar servidor
npm start
```

---

## 📚 Documentación

- **[Estado de Implementación](./docs/BACKEND_EXPANSION_STATUS.md)** - Detalle completo de todos los componentes
- **[Guía de Testing](./docs/API_TESTING_GUIDE.md)** - Ejemplos de cURL y casos de uso
- **[API Reference](http://localhost:4000/docs)** - Swagger UI (solo en desarrollo)

---

## 🔐 Variables de Entorno Requeridas

### Mínimas para Desarrollo
```env
NODE_ENV=development
PORT=4000
JWT_SECRET=change-this-super-secret-jwt-key-min-32-chars
MONGO_URI=mongodb://localhost:27017/voice-assistant
ALLOW_PAYMENT_EMULATION=true
EMULATOR_KEY=dev123
PAYMENTS_JSON_PATH=./data/payments
```

### Adicionales para Producción
```env
# Bland Voice
BLAND_API_KEY=your-bland-api-key
BLAND_API_SECRET=your-bland-api-secret
BLAND_WEBHOOK_SECRET=your-webhook-secret

# Stripe (opcional si usas pagos reales)
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
ENABLE_STRIPE=true

# CORS
CORS_ORIGIN=https://tu-frontend.com

# Seguridad
ALLOW_PAYMENT_EMULATION=false
```

---

## 🧪 Testing Endpoints

### Login
```bash
POST /auth/login
Body: {"email":"user@example.com","password":"pass"}
→ Returns: {accessToken, refreshToken, user}
```

### Llamadas
```bash
GET /calls?tenantId=XXX
Header: Authorization: Bearer TOKEN
→ Returns: {data: [...], pagination: {...}}
```

### Pagos
```bash
POST /billing/create-session
Header: Authorization: Bearer TOKEN
Body: {"tenantId":"XXX","amount":49.99,"testMode":true}
→ Returns: {sessionIdEmu, checkout_url_emulado}
```

### Webhook Emulador
```bash
POST /webhooks/stripe-emulator
Header: X-Emulator-Key: dev123
Body: {"type":"payment_intent.succeeded","data":{...}}
→ Returns: {received:true, status:"succeeded"}
```

Ver ejemplos completos en: `docs/API_TESTING_GUIDE.md`

---

## 🛡️ Seguridad

### Implementado
- ✅ JWT con expiración (15min access, 7d refresh)
- ✅ bcrypt para passwords (10 rounds)
- ✅ HMAC SHA256 para webhooks
- ✅ Rate limiting (100 req/15min)
- ✅ Helmet.js (headers de seguridad)
- ✅ CORS configurable
- ✅ Audit logs para acciones críticas
- ✅ Validación de tenantId en todos los endpoints

### Por Configurar en Producción
- 🔧 JWT_SECRET aleatorio de 32+ caracteres
- 🔧 CORS_ORIGIN con dominio del frontend
- 🔧 HTTPS obligatorio
- 🔧 MongoDB con autenticación
- 🔧 Rate limiting ajustado según carga

---

## 📊 JSON Storage

Los pagos emulados se guardan en archivos JSON con:

**Formato:** Un archivo por día
```
./data/payments/
├── payments-2024-01-15.json
├── payments-2024-01-16.json
└── payments-2024-01-17.json
```

**Contenido:** Un registro JSON por línea (append-friendly)
```json
{"id":"507f...","tenantId":"XXX","amount":49.99,"status":"succeeded","providerPaymentId":"pi_123",...}
{"id":"507g...","tenantId":"YYY","amount":29.99,"status":"succeeded","providerPaymentId":"pi_456",...}
```

**Características:**
- ✅ Escritura atómica (tmp + rename)
- ✅ Mutex en memoria (single instance)
- ✅ Idempotencia por providerPaymentId
- ✅ Merge con registros de MongoDB

---

## 🔄 Flujo de Pago Emulado

1. Frontend llama `POST /billing/create-session` con `testMode: true`
2. Backend retorna `sessionIdEmu` y `checkout_url_emulado`
3. Frontend simula checkout
4. Frontend/Test llama `POST /webhooks/stripe-emulator` con evento
5. Backend:
   - Verifica idempotencia
   - Actualiza BillingRecord en BD
   - Escribe registro en JSON (atómico)
   - Emite evento Socket.IO
   - Retorna confirmación
6. Frontend recibe evento en tiempo real

---

## 📈 Monitoreo

### Logs
```bash
# Los logs se guardan en ./logs/
tail -f logs/combined-YYYY-MM-DD.log
tail -f logs/error-YYYY-MM-DD.log
```

### Socket.IO Events (Real-time)
```javascript
socket.on('payment.succeeded', (data) => {...});
socket.on('call:incoming', (data) => {...});
socket.on('transcription:completed', (data) => {...});
```

---

## 🐛 Troubleshooting

### MongoDB no disponible
- ✅ El backend usa JSON data source automáticamente
- Logs: "Using JSON data source for authentication"
- Solo funciona login, no persistencia de nuevos usuarios

### Token expirado (401)
- Usa `POST /auth/refresh` con refreshToken
- O vuelve a hacer login

### CORS error
- Verifica `CORS_ORIGIN` en .env
- Incluye el dominio del frontend

### Pagos no se guardan en JSON
- Verifica que `./data/payments` existe
- Revisa logs para errores de escritura
- Verifica `PAYMENTS_JSON_PATH` en .env

---

## 🚀 Deploy en Render/Railway

### Variables de Entorno
Configura en el dashboard de tu plataforma:
- `NODE_ENV=production`
- `JWT_SECRET=<random-32-chars>`
- `MONGO_URI=<mongodb-atlas-uri>`
- `CORS_ORIGIN=<frontend-url>`
- Resto según `.env.example`

### Build Command
```bash
npm install && npm run build
```

### Start Command
```bash
npm start
```

---

## 📞 Soporte

Para preguntas o issues:
1. Revisa la documentación en `./docs/`
2. Verifica logs en `./logs/`
3. Consulta Swagger UI en `/docs`

---

## ✅ Checklist de Deployment

- [ ] Copiar `.env.example` a `.env`
- [ ] Configurar todas las variables de entorno
- [ ] Generar JWT_SECRET aleatorio
- [ ] Configurar MongoDB URI
- [ ] Establecer CORS_ORIGIN
- [ ] Crear usuarios de prueba
- [ ] Probar login local
- [ ] Probar endpoints protegidos
- [ ] Verificar escritura de JSON
- [ ] Build sin errores (`npm run build`)
- [ ] Deployment exitoso
- [ ] Probar desde frontend

---

**El backend está 100% listo para integración con el frontend del panel interno.**
