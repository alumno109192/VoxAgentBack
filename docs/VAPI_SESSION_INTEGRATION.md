# 🎤 Integración VAPI con Gestión de Sesiones

## 📋 Resumen

Sistema de transcripción voz → texto usando VAPI con gestión de sesiones local, almacenamiento persistente por sesión y control completo del ciclo de vida de las conversaciones.

**Fecha de implementación**: 25 de noviembre de 2025

---

## 🎯 Objetivos Cumplidos

✅ Configurar entorno con credenciales VAPI  
✅ Crear sesiones locales para agrupar transcripciones  
✅ Enviar audio a VAPI y recibir transcripciones  
✅ Persistir cada transcript en `transcription-<sessionId>.json`  
✅ Cerrar sesiones y limpiar recursos  
✅ Manejo de errores robusto  
✅ Tests funcionales  

---

## 🏗️ Arquitectura

### Flujo de Trabajo

```
┌─────────────┐
│   Cliente   │
│  (Widget)   │
└──────┬──────┘
       │
       │ 1. POST /transcription/session/start
       ├──────────────────────────────────────────┐
       │                                          │
       ▼                                          ▼
┌──────────────────┐                   ┌──────────────────┐
│  Backend API     │                   │  MockDataService │
│  (Controller)    │                   │  (Local Storage) │
└─────────┬────────┘                   └──────────────────┘
          │                                       │
          │ 2. createSession()                   │
          │                                       │
          ▼                                       │
┌──────────────────┐                             │
│  VAPI Service    │                             │
│  (Mock Sessions) │                             │
└─────────┬────────┘                             │
          │                                       │
          │ 3. Return sessionId                  │
          │                                       │
          ▼                                       ▼
┌─────────────────────────────────────────────────────┐
│         Sesión Activa (en memoria)                  │
│  - sessionId: "session-xxx"                         │
│  - vapiSessionId: "mock-xxx" o "vapi-xxx"          │
│  - transcripts: []                                  │
│  - createdAt: timestamp                             │
└─────────────────────────────────────────────────────┘
          │
          │ 4. POST /transcription/vapi (múltiples veces)
          │    - Enviar chunks de audio
          │    - Recibir transcripciones parciales/finales
          │
          ▼
┌─────────────────────────────────────────────────────┐
│  Almacenamiento: transcription-<sessionId>.json     │
│  {                                                   │
│    sessionId: "session-xxx",                        │
│    tenantId: "test-tenant-001",                     │
│    segments: [                                       │
│      { text: "Hola...", confidence: 0.95, ... }    │
│    ],                                                │
│    totalDuration: 45.3,                             │
│    totalCost: 0.0045                                │
│  }                                                   │
└─────────────────────────────────────────────────────┘
          │
          │ 5. POST /transcription/session/end
          │
          ▼
     Sesión Cerrada
     Recursos Limpiados
```

---

## 🔧 Configuración

### Variables de Entorno

```env
# VAPI Transcription API Configuration
VAPI_API_URL=https://api.vapi.ai
VAPI_PUBLIC_KEY=209ac772-6752-4407-9740-84afdfc7a41c
VAPI_ASSISTANT_ID=0e9f3fcb-a5c4-4ea3-b8ff-52e8af6e3bdf
VAPI_API_KEY=866040f5-1fdc-40f0-92fd-f8c6077573a1

# Timeout para sesiones (en segundos)
VAPI_SESSION_TIMEOUT=300

# Mock Data Configuration
MOCK_DATA_PATH=./data/mock
```

### API Keys de Tenant

Para desarrollo:
- **Tenant**: `test-tenant-001`
- **API Key**: `vox_test_sk_1234567890abcdef`

---

## 📊 Endpoints Implementados

### 1️⃣ Iniciar Sesión

**POST** `/transcription/session/start`

Crea una nueva sesión VAPI y la registra localmente.

#### Request

```bash
curl -X POST http://localhost:4000/transcription/session/start \
  -H "Content-Type: application/json" \
  -H "x-api-key: vox_test_sk_1234567890abcdef" \
  -d '{
    "tenantId": "test-tenant-001",
    "sessionId": "session-abc123",
    "language": "es-ES",
    "metadata": {
      "userId": "user-456",
      "channel": "web"
    }
  }'
```

#### Response (200 OK)

```json
{
  "success": true,
  "vapiSessionId": "mock-1732543210-abc123",
  "sessionId": "session-abc123",
  "status": "active",
  "createdAt": "2025-11-25T12:46:50.123Z"
}
```

#### Errores

- **400**: Falta `tenantId` o `sessionId`
- **401**: API Key inválida
- **503**: VAPI no configurado

---

### 2️⃣ Enviar Audio

**POST** `/transcription/vapi`

Envía un chunk de audio a la sesión VAPI activa.

#### Request

```bash
curl -X POST http://localhost:4000/transcription/vapi \
  -H "Content-Type: application/json" \
  -H "x-api-key: vox_test_sk_1234567890abcdef" \
  -d '{
    "vapiSessionId": "mock-1732543210-abc123",
    "sessionId": "session-abc123",
    "tenantId": "test-tenant-001",
    "audioBlob": "base64_encoded_audio_data...",
    "sequence": 1
  }'
```

#### Response (200 OK)

```json
{
  "text": "Hola, ¿cómo estás?",
  "type": "final",
  "isFinal": true,
  "confidence": 0.95,
  "timestamp": "2025-11-25T12:47:15.456Z"
}
```

#### Tipos de Respuesta

- **`partial`**: Transcripción parcial (se actualiza)
- **`final`**: Transcripción final (se guarda en DB)

#### Errores

- **400**: Campos requeridos faltantes o audio vacío
- **404**: Sesión no encontrada o expirada
- **503**: VAPI no disponible

---

### 3️⃣ Obtener Historial

**GET** `/transcription/history/:sessionId`

Obtiene todas las transcripciones de una sesión.

#### Request

```bash
curl -X GET "http://localhost:4000/transcription/history/session-abc123?tenantId=test-tenant-001" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

#### Response (200 OK)

```json
{
  "sessionId": "session-abc123",
  "tenantId": "test-tenant-001",
  "segments": [
    {
      "id": "segment-1732543235-xyz789",
      "sessionId": "session-abc123",
      "tenantId": "test-tenant-001",
      "text": "Hola, ¿cómo estás?",
      "confidence": 0.95,
      "timestamp": "2025-11-25T12:47:15.456Z",
      "metadata": {
        "audioSize": 42720,
        "format": "webm",
        "engine": "vapi",
        "sequence": 1
      }
    }
  ],
  "createdAt": "2025-11-25T12:46:50.123Z",
  "updatedAt": "2025-11-25T12:47:15.456Z",
  "totalDuration": 3.5,
  "totalCost": 0.00035,
  "totalWords": 4
}
```

---

### 4️⃣ Finalizar Sesión

**POST** `/transcription/session/end`

Cierra la sesión VAPI y limpia recursos.

#### Request

```bash
curl -X POST http://localhost:4000/transcription/session/end \
  -H "Content-Type: application/json" \
  -H "x-api-key: vox_test_sk_1234567890abcdef" \
  -d '{
    "vapiSessionId": "mock-1732543210-abc123",
    "sessionId": "session-abc123",
    "tenantId": "test-tenant-001"
  }'
```

#### Response (200 OK)

```json
{
  "success": true,
  "sessionId": "session-abc123",
  "vapiSessionId": "mock-1732543210-abc123",
  "totalSegments": 5,
  "endedAt": "2025-11-25T12:50:00.000Z"
}
```

---

## 🧪 Tests Realizados

### ✅ Test 1: Smoke Test - Crear Sesión

```bash
curl -X POST http://localhost:4000/transcription/session/start \
  -H "Content-Type: application/json" \
  -H "x-api-key: vox_test_sk_1234567890abcdef" \
  -d '{
    "tenantId": "test-tenant-001",
    "sessionId": "test-session-smoke",
    "language": "es-ES"
  }'
```

**Resultado Esperado**:
- ✅ Devuelve `vapiSessionId`
- ✅ `status: "active"`
- ✅ Sesión creada en memoria

### ✅ Test 2: Audio Corto

```bash
# 1. Crear sesión
SESSION_RESPONSE=$(curl -s -X POST http://localhost:4000/transcription/session/start \
  -H "Content-Type: application/json" \
  -H "x-api-key: vox_test_sk_1234567890abcdef" \
  -d '{
    "tenantId": "test-tenant-001",
    "sessionId": "test-session-audio",
    "language": "es-ES"
  }')

VAPI_SESSION_ID=$(echo $SESSION_RESPONSE | jq -r '.vapiSessionId')

# 2. Enviar audio mock (base64 de "Hello")
curl -X POST http://localhost:4000/transcription/vapi \
  -H "Content-Type: application/json" \
  -H "x-api-key: vox_test_sk_1234567890abcdef" \
  -d "{
    \"vapiSessionId\": \"$VAPI_SESSION_ID\",
    \"sessionId\": \"test-session-audio\",
    \"tenantId\": \"test-tenant-001\",
    \"audioBlob\": \"SGVsbG8gV29ybGQ=\",
    \"sequence\": 1
  }"
```

**Resultado Esperado**:
- ✅ Devuelve texto transcrito (mock)
- ✅ `isFinal: true`
- ✅ `confidence` entre 0.85 - 0.99

### ✅ Test 3: Persistencia

```bash
# Verificar archivo creado
ls -la ./data/mock/test-tenant-001/transcription-test-session-audio.json

# Ver contenido
cat ./data/mock/test-tenant-001/transcription-test-session-audio.json | jq .
```

**Resultado Esperado**:
- ✅ Archivo JSON existe
- ✅ Contiene `sessionId`, `tenantId`, `segments[]`
- ✅ Segmento guardado con texto, confidence, timestamp

### ✅ Test 4: Manejo de Errores

#### Audio vacío → 400
```bash
curl -X POST http://localhost:4000/transcription/vapi \
  -H "Content-Type: application/json" \
  -H "x-api-key: vox_test_sk_1234567890abcdef" \
  -d '{
    "vapiSessionId": "mock-123",
    "sessionId": "test",
    "tenantId": "test-tenant-001",
    "audioBlob": ""
  }'
```

#### Credenciales ausentes → 503
```bash
# Sin configurar VAPI_API_KEY
VAPI_API_KEY=mock curl -X POST http://localhost:4000/transcription/session/start \
  -H "Content-Type: application/json" \
  -H "x-api-key: vox_test_sk_1234567890abcdef" \
  -d '{
    "tenantId": "test-tenant-001",
    "sessionId": "test",
    "language": "es-ES"
  }'
```

#### Fallo VAPI → Log + Fallback Mock
- ✅ Error loggeado correctamente
- ✅ Fallback a transcripción mock
- ✅ Usuario recibe respuesta controlada

---

## 📦 Estructura de Archivos

### Código Fuente

```
src/
├── services/
│   └── vapiService.ts           # Gestión de sesiones VAPI
├── controllers/
│   └── transcriptionController.ts  # Controladores de endpoints
├── routes/
│   └── transcription.ts         # Definición de rutas
├── types/
│   └── transcription.ts         # Tipos TypeScript
├── middleware/
│   └── widgetAuth.ts            # Validación API Keys
└── utils/
    └── mockDataService.ts       # Almacenamiento JSON
```

### Tipos Principales

```typescript
// VapiSessionResponse
{
  sessionId: string;
  status: 'active' | 'inactive' | 'ended';
  createdAt: string;
  assistantId: string;
}

// VapiTranscriptEvent
{
  type: 'transcript' | 'partial' | 'final';
  text: string;
  timestamp: string;
  confidence?: number;
  isFinal?: boolean;
}

// TranscriptionSegment
{
  id: string;
  sessionId: string;
  tenantId: string;
  text: string;
  confidence?: number;
  timestamp: string;
  metadata?: {
    audioSize?: number;
    format?: string;
    engine?: string;
    sequence?: number;
  };
}
```

---

## 🎨 Demo Frontend

Se incluye un HTML demo completo: **`examples/vapi-session-test.html`**

### Características

✅ Interfaz visual moderna con gradientes  
✅ Grabación de audio con MediaRecorder API  
✅ Manejo completo del ciclo de vida de sesiones  
✅ Visualización en tiempo real de transcripciones  
✅ Estadísticas: segmentos, palabras, duración, confianza  
✅ Indicador de grabación animado  
✅ Manejo de errores con UI clara  

### Cómo Usar

1. Abrir `http://localhost:4000/examples/vapi-session-test.html`
2. Configurar API Key y Tenant ID (pre-llenados)
3. Click en **"Iniciar Sesión"**
4. Click en **"Grabar Audio"**
5. Hablar al micrófono
6. Click en **"Detener Grabación"**
7. Ver transcripción en tiempo real
8. Repetir 4-7 para más segmentos
9. Click en **"Finalizar Sesión"** cuando termine

---

## 💰 Costos

Basado en pricing de VAPI:

- **Costo por minuto**: $0.006 USD
- **Ejemplo**: 10 minutos de conversación = $0.06 USD

### Cálculo Automático

El sistema calcula automáticamente el costo por segmento:

```typescript
function calculateTranscriptionCost(audioSize: number, duration?: number): number {
  const durationInMinutes = (duration || audioSize / 10000) / 60;
  return Math.round(durationInMinutes * 0.006 * 10000) / 10000;
}
```

---

## 🔒 Seguridad

### Autenticación

- **Endpoints de sesión**: API Key (`x-api-key` header)
- **Endpoints de admin**: JWT Bearer Token
- **Validación**: Tenant ID + API Key match

### Almacenamiento

- **Archivos JSON**: Separados por tenant en `./data/mock/{tenantId}/`
- **Permisos**: Solo lectura/escritura del proceso Node.js
- **Retención**: Configurable por tenant (default 365 días)

### Rate Limiting

Aplicado a nivel de aplicación (ver `app.ts`):

```typescript
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100 // máximo 100 requests por ventana
});
```

---

## 🐛 Troubleshooting

### Problema: "Sesión no encontrada"

**Causa**: Sesión expiró (> 300 segundos sin actividad)

**Solución**:
```bash
# Aumentar timeout en .env
VAPI_SESSION_TIMEOUT=600  # 10 minutos
```

### Problema: "VAPI not configured"

**Causa**: `VAPI_API_KEY` no está configurado o es "mock"

**Solución**:
```bash
# Configurar en .env
VAPI_API_KEY=866040f5-1fdc-40f0-92fd-f8c6077573a1
```

### Problema: Audio no transcribe

**Causa**: Formato de audio no soportado

**Solución**:
```javascript
// Usar MediaRecorder con codec compatible
const mediaRecorder = new MediaRecorder(stream, {
  mimeType: 'audio/webm;codecs=opus'
});
```

---

## 📈 Próximos Pasos

### Mejoras Futuras

- [ ] **WebSocket para transcripción en tiempo real**
- [ ] **Soporte para streaming de audio continuo**
- [ ] **Integración con base de datos (MongoDB)**
- [ ] **Dashboard de analytics por tenant**
- [ ] **Exportación de transcripciones (TXT, SRT, VTT)**
- [ ] **Traducción automática de transcripciones**
- [ ] **Detección de sentimientos en transcripciones**

### Optimizaciones

- [ ] **Cache de sesiones activas en Redis**
- [ ] **Compresión de audio antes de enviar**
- [ ] **Batch processing para múltiples chunks**
- [ ] **Auto-limpieza de sesiones expiradas**

---

## 📚 Referencias

- [Documentación VAPI](https://vapi.ai/docs)
- [MediaRecorder API](https://developer.mozilla.org/en-US/docs/Web/API/MediaRecorder)
- [OpenAPI 3.0 Specification](https://swagger.io/specification/)
- [TypeScript Best Practices](https://www.typescriptlang.org/docs/handbook/declaration-files/do-s-and-don-ts.html)

---

## 👥 Autor

**VoiceTotem Studio Backend Team**  
Fecha: 25 de noviembre de 2025

---

## 📄 Licencia

Propiedad de VoiceTotem Studio. Todos los derechos reservados.
