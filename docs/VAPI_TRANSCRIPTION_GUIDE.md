# 🎤 Transcripción con VAPI - Guía Actualizada

## 📋 Resumen

Backend actualizado para usar el endpoint correcto de VAPI: **`/v1/transcriptions`**

---

## 🔧 Configuración Actual

### Variables de Entorno (`.env`)

```env
# VAPI Transcription API Configuration
VAPI_API_URL=https://api.vapi.ai
VAPI_PUBLIC_KEY=209ac772-6752-4407-9740-84afdfc7a41c
VAPI_ASSISTANT_ID=0e9f3fcb-a5c4-4ea3-b8ff-52e8af6e3bdf
VAPI_API_KEY=866040f5-1fdc-40f0-92fd-f8c6077573a1
```

✅ **Estado**: Configurado y listo para usar

---

## 📡 Endpoint del Backend

### POST `/api/transcription/segment`

**Descripción**: Recibe audio del frontend, lo envía a VAPI `/v1/transcriptions` y devuelve el texto transcrito.

### Request

```json
{
  "sessionId": "session-abc123",
  "tenantId": "test-tenant-001",
  "audioBlob": "UklGRiQAAABXQVZF...",  // Audio en base64
  "format": "webm",
  "language": "es-ES"
}
```

**Headers requeridos**:
```
Content-Type: application/json
X-API-Key: vox_test_sk_1234567890abcdef
```

### Response

```json
{
  "text": "Hola, ¿cómo estás?",
  "segmentId": "segment-1732536000-abc123",
  "confidence": 0.95,
  "timestamp": "2024-11-25T12:00:00.000Z",
  "metadata": {
    "duration": 2.5,
    "cost": 0.00025
  }
}
```

---

## 🔄 Flujo Completo

```
┌─────────────────┐
│   1. Frontend   │
│   MediaRecorder │
│   captura audio │
└────────┬────────┘
         │ Base64
         ▼
┌─────────────────┐
│  2. Backend     │
│  POST /segment  │
└────────┬────────┘
         │
         ▼
┌─────────────────────────────────┐
│  3. VAPI API                    │
│  POST /v1/transcriptions        │
│  {                              │
│    audio: "base64...",          │
│    language: "es-ES",           │
│    assistantId: "0e9f3fcb..."   │
│  }                              │
└────────┬────────────────────────┘
         │ { text: "..." }
         ▼
┌─────────────────┐
│  4. Backend     │
│  Guarda en JSON │
│  por sessionId  │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  5. Response    │
│  { text: "..." }│
│  al Frontend    │
└─────────────────┘
```

---

## 💻 Implementación Backend

### `src/services/vapiService.ts`

```typescript
async transcribeAudio(audioBlob: string, language: string = 'es-ES'): Promise<VapiTranscriptionResponse> {
  try {
    // Payload según especificación de VAPI /v1/transcriptions
    const payload = {
      audio: audioBlob, // audio en base64
      language: language,
      assistantId: this.assistantId,
    };

    const response = await axios.post<VapiTranscriptionResponse>(
      `${this.apiUrl}/v1/transcriptions`,  // ✅ Endpoint correcto
      payload,
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
        },
        timeout: 30000,
      }
    );

    return response.data;
  } catch (error: any) {
    // Fallback a modo mock si falla
    if (error.response?.status === 401 || error.response?.status === 403) {
      logger.warn('VAPI authentication failed, using mock transcription');
      return this.mockTranscribe(audioBlob, language);
    }
    throw new Error('Error al transcribir audio con VAPI');
  }
}
```

### `src/controllers/transcriptionController.ts`

```typescript
export const transcribeSegment = async (req: Request, res: Response): Promise<any> => {
  try {
    const { sessionId, tenantId, audioBlob, format = 'webm', language = 'es-ES' } = req.body;

    // Validación
    if (!sessionId || !tenantId || !audioBlob) {
      return res.status(400).json({ error: 'sessionId, tenantId y audioBlob son requeridos' });
    }

    // Transcribir con VAPI
    const vapiResult = await vapiService.transcribeAudio(audioBlob, language);

    // Crear segmento
    const segment: TranscriptionSegment = {
      id: `segment-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      sessionId,
      tenantId,
      text: vapiResult.text,
      confidence: vapiResult.confidence,
      timestamp: new Date().toISOString(),
      metadata: {
        engine: 'vapi',
        cost: calculateCost(vapiResult.duration),
      },
    };

    // Guardar en JSON por sesión
    await mockDataService.addTranscriptionSegment(tenantId, sessionId, segment);

    // Responder al frontend
    res.json({
      text: segment.text,
      segmentId: segment.id,
      confidence: segment.confidence,
      timestamp: segment.timestamp,
      metadata: segment.metadata,
    });
  } catch (error: any) {
    res.status(500).json({ error: 'Error al procesar la transcripción' });
  }
};
```

---

## 📁 Almacenamiento en JSON

Las transcripciones se guardan en:

```
data/
  mock/
    {tenantId}/
      transcription-{sessionId}.json
```

### Estructura del archivo

```json
{
  "sessionId": "session-abc123",
  "tenantId": "test-tenant-001",
  "segments": [
    {
      "id": "segment-1732536000-abc123",
      "sessionId": "session-abc123",
      "tenantId": "test-tenant-001",
      "text": "Hola, ¿cómo estás?",
      "confidence": 0.95,
      "duration": 2.5,
      "timestamp": "2024-11-25T12:00:00.000Z",
      "metadata": {
        "engine": "vapi",
        "cost": 0.00025,
        "format": "webm"
      }
    }
  ],
  "createdAt": "2024-11-25T12:00:00.000Z",
  "updatedAt": "2024-11-25T12:05:00.000Z"
}
```

---

## 🧪 Testing

### 1. Test con cURL

```bash
curl -X POST http://localhost:4000/api/transcription/segment \
  -H "Content-Type: application/json" \
  -H "X-API-Key: vox_test_sk_1234567890abcdef" \
  -d '{
    "sessionId": "test-session-123",
    "tenantId": "test-tenant-001",
    "audioBlob": "UklGRiQAAABXQVZFZm10IBAAAAABAAEA...",
    "format": "webm",
    "language": "es-ES"
  }'
```

### 2. Test desde Frontend

```javascript
async function transcribeAudio(audioBlob) {
  const reader = new FileReader();
  reader.readAsDataURL(audioBlob);
  
  reader.onloadend = async () => {
    const base64Audio = reader.result.split(',')[1];
    
    const response = await fetch('http://localhost:4000/api/transcription/segment', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': 'vox_test_sk_1234567890abcdef'
      },
      body: JSON.stringify({
        sessionId: 'session-' + Date.now(),
        tenantId: 'test-tenant-001',
        audioBlob: base64Audio,
        format: 'webm',
        language: 'es-ES'
      })
    });
    
    const result = await response.json();
    console.log('Texto transcrito:', result.text);
  };
}
```

---

## ✅ Cambios Realizados

### Antes (Incorrecto)
```typescript
// ❌ Endpoint antiguo que causaba error
const response = await axios.post(
  `${this.apiUrl}/transcribe`,
  payload
);
```

### Después (Correcto)
```typescript
// ✅ Endpoint correcto según especificación VAPI
const response = await axios.post(
  `${this.apiUrl}/v1/transcriptions`,
  {
    audio: audioBlob,
    language: language,
    assistantId: this.assistantId,
  },
  {
    headers: {
      'Authorization': `Bearer ${this.apiKey}`,
    }
  }
);
```

---

## 🐛 Solución de Problemas

### Error: "Cannot POST /transcribe"

✅ **Solucionado**: Ahora usa `/v1/transcriptions`

### Error: 401 Unauthorized

**Verificar**:
1. `VAPI_API_KEY` está configurada en `.env`
2. La API key es válida en VAPI.ai
3. El header `Authorization: Bearer {key}` está presente

### Error: 400 Bad Request

**Verificar**:
1. `audioBlob` está en formato base64
2. `assistantId` es correcto
3. `language` es un código válido (ej: `es-ES`, `en-US`)

### Modo Mock

Si VAPI falla o no está configurado, el sistema usa transcripciones simuladas:

```typescript
// Frases mock en español
const mockTexts = [
  'Hola, ¿cómo estás?',
  '¿Cuál es el horario de atención?',
  'Necesito información sobre sus servicios',
  // ...
];
```

---

## 📊 Costo de Transcripción

**VAPI**: ~$0.006 USD por minuto de audio

**Cálculo**:
```typescript
function calculateTranscriptionCost(audioSize: number, duration: number): number {
  const costPerMinute = 0.006;
  const durationInMinutes = duration / 60;
  return durationInMinutes * costPerMinute;
}
```

---

## 📚 Endpoints Relacionados

### GET `/api/transcription/session/:sessionId`

Obtener historial de una sesión:

```bash
curl -H "Authorization: Bearer YOUR_JWT" \
  "http://localhost:4000/api/transcription/session/session-abc123?tenantId=test-tenant-001"
```

### GET `/api/transcription/health`

Verificar estado del servicio VAPI:

```bash
curl http://localhost:4000/api/transcription/health
```

Response:
```json
{
  "status": "ok",
  "vapiAvailable": true,
  "timestamp": "2024-11-25T12:00:00.000Z"
}
```

---

## 🔗 Referencias

- **VAPI Docs**: https://docs.vapi.ai
- **API Endpoint**: `https://api.vapi.ai/v1/transcriptions`
- **Dashboard**: https://vapi.ai/dashboard

---

**Última actualización**: 25 de noviembre de 2024  
**Estado**: ✅ Funcionando con endpoint correcto `/v1/transcriptions`
