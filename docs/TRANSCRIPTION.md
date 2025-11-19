# Sistema de Transcripción de Audio

Sistema completo para recibir audio desde el widget, enviarlo a VAPI para transcripción, guardar segmentos en JSON y devolver el texto al frontend.

## Características

- ✅ Integración con VAPI API para transcripción speech-to-text
- ✅ Fallback mock cuando VAPI no está configurado
- ✅ Almacenamiento de segmentos en JSON por sesión
- ✅ Autenticación con API Key para uploads
- ✅ Endpoints administrativos con JWT
- ✅ Estadísticas de uso y costos
- ✅ Soporte multilenguaje (español por defecto)
- ✅ Metadatos detallados por segmento (palabras, timing, confianza)

## Endpoints

### 1. POST /transcription/segment
**Transcribir un segmento de audio**

**Autenticación:** API Key (X-API-Key header)

```bash
curl -X POST http://localhost:4000/transcription/segment \
  -H "X-API-Key: test-api-key-12345" \
  -H "Content-Type: application/json" \
  -d '{
    "sessionId": "session-123",
    "tenantId": "tenant-001",
    "audioBlob": "UklGRiQAAABXQVZFZm10...",
    "format": "webm",
    "language": "es-ES"
  }'
```

**Respuesta:**
```json
{
  "text": "Hola, ¿cómo estás?",
  "segmentId": "seg-1234567890",
  "confidence": 0.96,
  "timestamp": "2024-01-15T10:30:00.000Z",
  "metadata": {
    "duration": 2.5,
    "cost": 0.00025
  }
}
```

**Parámetros:**
- `sessionId` (string, requerido): ID único de la sesión de conversación
- `tenantId` (string, requerido): ID del tenant/cliente
- `audioBlob` (string, requerido): Audio codificado en base64
- `format` (string, requerido): Formato de audio (webm, mp3, wav, ogg)
- `language` (string, opcional): Código de lenguaje (default: es-ES)

---

### 2. GET /transcription/session/:sessionId
**Obtener historial completo de una sesión**

**Autenticación:** JWT Token

```bash
curl -X GET "http://localhost:4000/transcription/session/session-123?tenantId=tenant-001" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Respuesta:**
```json
{
  "sessionId": "session-123",
  "tenantId": "tenant-001",
  "createdAt": "2024-01-15T10:00:00.000Z",
  "updatedAt": "2024-01-15T10:30:00.000Z",
  "segments": [
    {
      "id": "seg-001",
      "text": "Hola, ¿cómo estás?",
      "confidence": 0.96,
      "duration": 2.5,
      "timestamp": "2024-01-15T10:00:00.000Z",
      "metadata": {
        "audioSize": 38400,
        "format": "webm",
        "engine": "vapi",
        "cost": 0.00025,
        "words": [
          { "text": "Hola", "start": 0.0, "end": 0.5, "confidence": 0.98 }
        ]
      }
    }
  ],
  "totalDuration": 15.5,
  "totalCost": 0.00155,
  "totalWords": 42
}
```

---

### 3. GET /transcription/sessions
**Listar todas las sesiones de transcripción**

**Autenticación:** JWT Token

```bash
curl -X GET "http://localhost:4000/transcription/sessions?tenantId=tenant-001&limit=10" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Respuesta:**
```json
{
  "total": 5,
  "limit": 10,
  "sessions": [
    {
      "sessionId": "session-123",
      "tenantId": "tenant-001",
      "createdAt": "2024-01-15T10:00:00.000Z",
      "updatedAt": "2024-01-15T10:30:00.000Z",
      "segments": [...],
      "totalDuration": 15.5,
      "totalCost": 0.00155,
      "totalWords": 42
    }
  ]
}
```

---

### 4. GET /transcription/stats
**Obtener estadísticas agregadas de transcripciones**

**Autenticación:** JWT Token

```bash
curl -X GET "http://localhost:4000/transcription/stats?tenantId=tenant-001" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Respuesta:**
```json
{
  "totalSessions": 5,
  "totalSegments": 42,
  "totalDuration": 125.5,
  "totalCost": 0.01255,
  "totalWords": 350,
  "averageConfidence": 0.94,
  "averageDurationPerSegment": 2.99
}
```

---

### 5. GET /transcription/health
**Verificar estado del servicio VAPI**

**Autenticación:** Ninguna (público)

```bash
curl -X GET http://localhost:4000/transcription/health
```

**Respuesta:**
```json
{
  "status": "healthy",
  "service": "vapi",
  "configured": true,
  "mode": "production",
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

o cuando VAPI no está configurado:

```json
{
  "status": "degraded",
  "service": "vapi",
  "configured": false,
  "mode": "mock",
  "message": "VAPI no configurado - usando mock transcription",
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

---

## Configuración

### Variables de Entorno

Agregar a tu archivo `.env`:

```env
# VAPI Configuration
VAPI_API_URL=https://api.vapi.ai
VAPI_API_KEY=tu-api-key-de-vapi
VAPI_AGENT_ID=tu-agent-id
```

### Estructura de Archivos

Los archivos JSON se guardan en:
```
data/mock/
  └── tenant-001/
      ├── transcription-session-123.json
      ├── transcription-session-456.json
      └── ...
```

### Formato del Archivo de Sesión

```json
{
  "sessionId": "session-123",
  "tenantId": "tenant-001",
  "createdAt": "2024-01-15T10:00:00.000Z",
  "updatedAt": "2024-01-15T10:30:00.000Z",
  "segments": [
    {
      "id": "seg-1234567890",
      "sessionId": "session-123",
      "tenantId": "tenant-001",
      "text": "Texto transcrito",
      "confidence": 0.96,
      "duration": 2.5,
      "timestamp": "2024-01-15T10:00:00.000Z",
      "metadata": {
        "audioSize": 38400,
        "format": "webm",
        "engine": "vapi",
        "cost": 0.00025,
        "confidence": 0.96,
        "duration": 2.5,
        "words": [
          {
            "text": "Texto",
            "start": 0.0,
            "end": 0.5,
            "confidence": 0.98
          }
        ]
      }
    }
  ],
  "totalDuration": 15.5,
  "totalCost": 0.00155,
  "totalWords": 42
}
```

---

## Integración con Widget

### Ejemplo Frontend (JavaScript)

```javascript
// Configuración
const API_KEY = 'test-api-key-12345';
const TENANT_ID = 'tenant-001';
const SESSION_ID = 'session-' + Date.now();
let mediaRecorder;
let audioChunks = [];

// Iniciar grabación
async function startRecording() {
  const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
  
  mediaRecorder = new MediaRecorder(stream, {
    mimeType: 'audio/webm;codecs=opus'
  });
  
  mediaRecorder.ondataavailable = (event) => {
    audioChunks.push(event.data);
  };
  
  mediaRecorder.onstop = async () => {
    const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
    await transcribeAudio(audioBlob);
    audioChunks = [];
  };
  
  mediaRecorder.start();
}

// Detener y transcribir
async function stopRecording() {
  mediaRecorder.stop();
}

// Enviar audio a transcripción
async function transcribeAudio(audioBlob) {
  // Convertir Blob a Base64
  const base64Audio = await blobToBase64(audioBlob);
  
  const response = await fetch('http://localhost:4000/transcription/segment', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-API-Key': API_KEY
    },
    body: JSON.stringify({
      sessionId: SESSION_ID,
      tenantId: TENANT_ID,
      audioBlob: base64Audio.split(',')[1], // Remover prefijo data:audio/webm;base64,
      format: 'webm',
      language: 'es-ES'
    })
  });
  
  const result = await response.json();
  console.log('Texto transcrito:', result.text);
  
  // Mostrar en la UI
  displayTranscription(result.text);
}

// Helper: Blob to Base64
function blobToBase64(blob) {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result);
    reader.readAsDataURL(blob);
  });
}

// Mostrar transcripción
function displayTranscription(text) {
  const transcriptionDiv = document.getElementById('transcription');
  const p = document.createElement('p');
  p.textContent = text;
  transcriptionDiv.appendChild(p);
}
```

---

## Modelo de Costos

### VAPI Pricing
- **Transcripción:** ~$0.006 USD por minuto
- **Mínimo:** $0.0001 por request

### Ejemplo de Costos
- **10 segundos de audio:** ~$0.001 USD
- **1 minuto de audio:** ~$0.006 USD
- **1 hora de audio:** ~$0.36 USD
- **1000 conversaciones/mes (5 min c/u):** ~$30 USD

### Cálculo Automático
El sistema calcula automáticamente el costo de cada segmento basándose en:
```typescript
const costPerMinute = 0.006;
const audioSizeInBytes = audioBlob.length;
const estimatedMinutes = audioSizeInBytes / 60000; // Aproximación
const cost = estimatedMinutes * costPerMinute;
```

---

## Modo Mock (Desarrollo)

Cuando VAPI no está configurado, el sistema usa transcripciones mock:

```typescript
const mockTexts = [
  'Hola, ¿cómo estás?',
  '¿Cuál es el horario de atención?',
  'Necesito información sobre sus servicios',
  'Quisiera hacer una consulta',
  '¿Tienen disponibilidad para mañana?',
  'Me gustaría agendar una cita',
  'Gracias por la información',
  '¿Cuánto cuesta el servicio?',
  'Entendido, muchas gracias',
  'Hasta luego'
];
```

El texto se selecciona aleatoriamente con:
- **Confianza:** 0.85 - 0.99
- **Duración:** Basada en tamaño del audio
- **Palabras:** Generadas automáticamente

---

## Pruebas

### Script de Prueba

```bash
# Dar permisos
chmod +x scripts/test-transcription.sh

# Ejecutar pruebas
./scripts/test-transcription.sh
```

### Pruebas Manuales con cURL

```bash
# 1. Health check
curl http://localhost:4000/transcription/health

# 2. Transcribir audio
curl -X POST http://localhost:4000/transcription/segment \
  -H "X-API-Key: test-api-key-12345" \
  -H "Content-Type: application/json" \
  -d '{
    "sessionId": "test-session",
    "tenantId": "tenant-001",
    "audioBlob": "UklGRiQAAABXQVZFZm10...",
    "format": "webm",
    "language": "es-ES"
  }'

# 3. Ver sesión (requiere JWT)
curl http://localhost:4000/transcription/session/test-session?tenantId=tenant-001 \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

---

## Seguridad

### API Key Validation
- El endpoint de transcripción requiere API Key
- Valida el tenant asociado a la clave
- Rate limiting aplicado

### JWT Authentication
- Endpoints administrativos requieren JWT
- Token debe contener `tenantId`
- Validación de permisos por tenant

### CORS
- Configurado para permitir widgets embebibles
- Origins permitidos configurables
- Headers específicos para API Key

---

## Troubleshooting

### Error: "VAPI authentication failed"
**Solución:** Verificar que `VAPI_API_KEY` esté configurado correctamente en `.env`

### Error: "sessionId y tenantId son requeridos"
**Solución:** Asegurarse de enviar ambos parámetros en el request

### Error: "Invalid or missing API key"
**Solución:** Incluir header `X-API-Key` con una clave válida

### Audio no se transcribe
**Solución:**
1. Verificar formato de audio (webm, mp3, wav, ogg)
2. Verificar que el audio esté en base64
3. Revisar logs del servidor
4. Comprobar health check: `/transcription/health`

---

## Próximos Pasos

- [ ] Implementar límite de tamaño de audio (ej: 10MB)
- [ ] Agregar soporte para múltiples idiomas
- [ ] Implementar limpieza automática de sesiones antiguas
- [ ] Agregar webhooks para notificaciones
- [ ] Dashboard de visualización de transcripciones
- [ ] Exportación a formatos (PDF, TXT, SRT)
- [ ] Análisis de sentimientos con IA
- [ ] Detección de palabras clave

---

## Documentación Relacionada

- [ARCHITECTURE.md](./ARCHITECTURE.md) - Arquitectura del sistema
- [CREDENCIALES_PRUEBA.md](./CREDENCIALES_PRUEBA.md) - Credenciales de prueba
- [IMPLEMENTACION_COMPLETA.md](./IMPLEMENTACION_COMPLETA.md) - Widget embebible
- [VAPI API Documentation](https://docs.vapi.ai/) - Documentación oficial de VAPI
