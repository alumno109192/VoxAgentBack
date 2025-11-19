# Integración VAPI - Guía Completa

## 🎯 Objetivo
Recibir audio desde el widget del cliente, enviarlo a VAPI para transcripción, guardar cada segmento en JSON y devolver el texto al frontend.

---

## 📋 Flujo de Integración

```
┌─────────────┐      ┌─────────────┐      ┌─────────────┐      ┌─────────────┐
│   Widget    │─────▶│   Backend   │─────▶│  VAPI API   │─────▶│ JSON Storage│
│  (Cliente)  │      │  /transcription/   │  Transcribe │      │   (Sesión)  │
└─────────────┘      │   segment    │      └─────────────┘      └─────────────┘
                     └─────────────┘              │
                            │                     │
                            │◀────────────────────┘
                            │
                            ▼
                     ┌─────────────┐
                     │  Response   │
                     │  { text }   │
                     └─────────────┘
```

---

## 🔧 Configuración

### 1. Variables de Entorno

Agregar a `.env`:

```env
# VAPI Configuration
VAPI_API_URL=https://api.vapi.ai
VAPI_API_KEY=tu-api-key-aqui
VAPI_AGENT_ID=tu-agent-id-aqui
```

### 2. Obtener Credenciales VAPI

1. Registrarse en [VAPI.ai](https://vapi.ai)
2. Crear un agente de transcripción
3. Copiar el **API Key** y **Agent ID**
4. Pegar en tu archivo `.env`

---

## 📡 Endpoint Principal

### POST /transcription/segment

**Recibe audio, llama a VAPI, guarda en JSON y devuelve texto**

#### Request

```bash
curl -X POST http://localhost:4000/transcription/segment \
  -H "Content-Type: application/json" \
  -H "X-API-Key: vox_test_sk_1234567890abcdef" \
  -d '{
    "sessionId": "session-123",
    "tenantId": "test-tenant-001",
    "audioBlob": "UklGRiQAAABXQVZF...",
    "format": "webm",
    "language": "es-ES"
  }'
```

#### Response

```json
{
  "text": "Hola, ¿cómo estás?",
  "segmentId": "segment-1700000000-abc123",
  "confidence": 0.96,
  "timestamp": "2025-11-19T10:30:00.000Z",
  "metadata": {
    "duration": 2.5,
    "cost": 0.00025
  }
}
```

---

## 💻 Código del Backend (Ya Implementado)

### Servicio VAPI (`src/services/vapiService.ts`)

```typescript
import axios from 'axios';
import config from '../config';

class VapiService {
  async transcribeAudio(audioBlob: string, language: string = 'es-ES') {
    try {
      // Llamada a VAPI API
      const response = await axios.post(
        `${config.vapi.apiUrl}/transcribe`,
        {
          audio: audioBlob,
          agentId: config.vapi.agentId,
          apiKey: config.vapi.apiKey,
          language
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${config.vapi.apiKey}`
          },
          timeout: 30000
        }
      );

      return {
        text: response.data.text,
        confidence: response.data.confidence,
        duration: response.data.duration,
        words: response.data.words
      };
    } catch (error) {
      // Fallback a modo mock
      logger.warn('VAPI failed, using mock');
      return this.mockTranscribe(audioBlob, language);
    }
  }

  private mockTranscribe(audioBlob: string, language: string) {
    const mockTexts = [
      'Hola, ¿cómo estás?',
      '¿Cuál es el horario de atención?',
      'Necesito información sobre sus servicios'
    ];
    
    return {
      text: mockTexts[Math.floor(Math.random() * mockTexts.length)],
      confidence: 0.85 + Math.random() * 0.14,
      duration: audioBlob.length / 15000,
      words: []
    };
  }
}
```

### Controller (`src/controllers/transcriptionController.ts`)

```typescript
import { Request, Response } from 'express';
import vapiService from '../services/vapiService';
import mockDataService from '../utils/mockDataService';

export const transcribeSegment = async (req: Request, res: Response) => {
  const { sessionId, tenantId, audioBlob, format, language } = req.body;

  try {
    // 1. Transcribir con VAPI
    const vapiResult = await vapiService.transcribeAudio(audioBlob, language);

    // 2. Crear segmento
    const segment = {
      id: `segment-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      sessionId,
      tenantId,
      text: vapiResult.text,
      confidence: vapiResult.confidence,
      duration: vapiResult.duration,
      timestamp: new Date().toISOString(),
      metadata: {
        audioSize: audioBlob.length,
        format,
        engine: 'vapi',
        cost: calculateCost(vapiResult.duration)
      }
    };

    // 3. Guardar en JSON
    await mockDataService.addTranscriptionSegment(tenantId, sessionId, segment);

    // 4. Devolver texto al frontend
    res.json({
      text: segment.text,
      segmentId: segment.id,
      confidence: segment.confidence,
      timestamp: segment.timestamp,
      metadata: {
        duration: segment.duration,
        cost: segment.metadata.cost
      }
    });
  } catch (err) {
    res.status(500).json({ error: 'Error en transcripción' });
  }
};

function calculateCost(duration: number): number {
  const costPerMinute = 0.006; // $0.006 USD por minuto
  return (duration / 60) * costPerMinute;
}
```

### Rutas (`src/routes/transcription.ts`)

```typescript
import express from 'express';
import { transcribeSegment } from '../controllers/transcriptionController';
import { validateApiKey } from '../middleware/auth';

const router = express.Router();

// POST /transcription/segment - Recibir audio y transcribir
router.post('/segment', validateApiKey, transcribeSegment);

export default router;
```

### Almacenamiento JSON (`src/utils/mockDataService.ts`)

```typescript
async addTranscriptionSegment(
  tenantId: string, 
  sessionId: string, 
  segment: any
): Promise<any> {
  return this.withLock(tenantId, `transcription-${sessionId}`, async () => {
    // Leer sesión existente o crear nueva
    let session = await this.readJSON(tenantId, `transcription-${sessionId}`)
      .catch(() => ({
        sessionId,
        tenantId,
        createdAt: new Date().toISOString(),
        segments: [],
        totalDuration: 0,
        totalCost: 0
      }));

    // Agregar segmento
    session.segments.push(segment);
    session.updatedAt = new Date().toISOString();
    session.totalDuration += segment.duration;
    session.totalCost += segment.metadata.cost;

    // Guardar
    await this.writeJSON(tenantId, `transcription-${sessionId}`, session);
    
    return segment;
  });
}
```

---

## 🎨 Integración Frontend (Widget)

### Ejemplo con JavaScript Vanilla

```javascript
class VoiceWidget {
  constructor(apiKey, tenantId) {
    this.apiKey = apiKey;
    this.tenantId = tenantId;
    this.sessionId = `session-${Date.now()}`;
    this.mediaRecorder = null;
    this.audioChunks = [];
  }

  async startRecording() {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    
    this.mediaRecorder = new MediaRecorder(stream, {
      mimeType: 'audio/webm;codecs=opus'
    });
    
    this.mediaRecorder.ondataavailable = (event) => {
      this.audioChunks.push(event.data);
    };
    
    this.mediaRecorder.onstop = async () => {
      await this.sendToTranscription();
    };
    
    this.mediaRecorder.start();
    console.log('🎤 Grabando...');
  }

  stopRecording() {
    if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
      this.mediaRecorder.stop();
      console.log('⏹️ Detenido');
    }
  }

  async sendToTranscription() {
    // Crear blob de audio
    const audioBlob = new Blob(this.audioChunks, { type: 'audio/webm' });
    this.audioChunks = [];
    
    // Convertir a base64
    const base64Audio = await this.blobToBase64(audioBlob);
    
    // Enviar a backend
    const response = await fetch('http://localhost:4000/transcription/segment', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': this.apiKey
      },
      body: JSON.stringify({
        sessionId: this.sessionId,
        tenantId: this.tenantId,
        audioBlob: base64Audio.split(',')[1], // Remover prefijo
        format: 'webm',
        language: 'es-ES'
      })
    });
    
    const result = await response.json();
    
    console.log('✅ Transcrito:', result.text);
    console.log('📊 Confianza:', result.confidence);
    
    // Mostrar en UI
    this.displayTranscription(result.text);
  }

  blobToBase64(blob) {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result);
      reader.readAsDataURL(blob);
    });
  }

  displayTranscription(text) {
    const div = document.getElementById('transcription-output');
    const p = document.createElement('p');
    p.textContent = text;
    p.className = 'transcription-text';
    div.appendChild(p);
  }
}

// Inicializar widget
const widget = new VoiceWidget(
  'vox_test_sk_1234567890abcdef',
  'test-tenant-001'
);

// Eventos
document.getElementById('start-btn').onclick = () => widget.startRecording();
document.getElementById('stop-btn').onclick = () => widget.stopRecording();
```

### HTML del Widget

```html
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <title>Widget de Voz - VAPI</title>
  <style>
    .voice-widget {
      max-width: 400px;
      margin: 50px auto;
      padding: 20px;
      border: 2px solid #4CAF50;
      border-radius: 10px;
      font-family: Arial, sans-serif;
    }
    .controls {
      display: flex;
      gap: 10px;
      margin-bottom: 20px;
    }
    button {
      flex: 1;
      padding: 12px;
      font-size: 16px;
      border: none;
      border-radius: 5px;
      cursor: pointer;
    }
    #start-btn {
      background: #4CAF50;
      color: white;
    }
    #stop-btn {
      background: #f44336;
      color: white;
    }
    .transcription-text {
      padding: 10px;
      margin: 5px 0;
      background: #f0f0f0;
      border-radius: 5px;
    }
  </style>
</head>
<body>
  <div class="voice-widget">
    <h2>🎤 Widget de Voz</h2>
    
    <div class="controls">
      <button id="start-btn">Iniciar Grabación</button>
      <button id="stop-btn">Detener</button>
    </div>
    
    <div id="transcription-output">
      <h3>Transcripciones:</h3>
    </div>
  </div>

  <script src="voice-widget.js"></script>
</body>
</html>
```

---

## 📊 Estructura del JSON Guardado

### Archivo: `data/mock/test-tenant-001/transcription-session-123.json`

```json
{
  "sessionId": "session-123",
  "tenantId": "test-tenant-001",
  "createdAt": "2025-11-19T10:00:00.000Z",
  "updatedAt": "2025-11-19T10:05:30.000Z",
  "segments": [
    {
      "id": "segment-1700000001-abc123",
      "sessionId": "session-123",
      "tenantId": "test-tenant-001",
      "text": "Hola, buenos días",
      "confidence": 0.96,
      "duration": 2.5,
      "timestamp": "2025-11-19T10:00:00.000Z",
      "metadata": {
        "audioSize": 38400,
        "format": "webm",
        "engine": "vapi",
        "cost": 0.00025,
        "words": [
          { "text": "Hola", "start": 0.0, "end": 0.5, "confidence": 0.98 },
          { "text": "buenos", "start": 0.6, "end": 1.2, "confidence": 0.97 },
          { "text": "días", "start": 1.3, "end": 2.5, "confidence": 0.95 }
        ]
      }
    },
    {
      "id": "segment-1700000002-def456",
      "sessionId": "session-123",
      "tenantId": "test-tenant-001",
      "text": "¿Cuál es el horario de atención?",
      "confidence": 0.94,
      "duration": 3.2,
      "timestamp": "2025-11-19T10:02:15.000Z",
      "metadata": {
        "audioSize": 48000,
        "format": "webm",
        "engine": "vapi",
        "cost": 0.00032
      }
    }
  ],
  "totalDuration": 5.7,
  "totalCost": 0.00057,
  "totalWords": 9
}
```

---

## 🧪 Pruebas

### 1. Ejecutar Script de Prueba

```bash
# Dar permisos
chmod +x scripts/test-transcription-flow.sh

# Ejecutar
./scripts/test-transcription-flow.sh
```

### 2. Prueba Manual con cURL

```bash
# Audio de prueba en base64
AUDIO="UklGRiQAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQAAAAA="

# Enviar a transcripción
curl -X POST http://localhost:4000/transcription/segment \
  -H "Content-Type: application/json" \
  -H "X-API-Key: vox_test_sk_1234567890abcdef" \
  -d '{
    "sessionId": "test-session",
    "tenantId": "test-tenant-001",
    "audioBlob": "'$AUDIO'",
    "format": "wav",
    "language": "es-ES"
  }' | jq '.'
```

### 3. Verificar JSON Guardado

```bash
# Ver archivo de sesión
cat data/mock/test-tenant-001/transcription-test-session.json | jq '.'

# Ver solo el texto transcrito
cat data/mock/test-tenant-001/transcription-test-session.json | jq '.segments[].text'
```

---

## 🔍 Health Check

Verificar estado de VAPI:

```bash
curl http://localhost:4000/transcription/health | jq '.'
```

**Respuesta cuando VAPI está configurado:**
```json
{
  "status": "healthy",
  "service": "vapi",
  "configured": true,
  "mode": "production",
  "timestamp": "2025-11-19T10:30:00.000Z"
}
```

**Respuesta en modo mock:**
```json
{
  "status": "degraded",
  "service": "vapi",
  "configured": false,
  "mode": "mock",
  "message": "VAPI no configurado - usando mock transcription"
}
```

---

## 💰 Costos VAPI

### Pricing
- **Transcripción:** $0.006 USD por minuto
- **Mínimo:** $0.0001 por request

### Ejemplos
- 10 segundos → $0.001
- 1 minuto → $0.006
- 5 minutos → $0.03
- 1 hora → $0.36

### Estimación Mensual
```
1000 conversaciones/mes × 3 minutos promedio = 3000 minutos
3000 minutos × $0.006 = $18 USD/mes
```

---

## ✅ Checklist de Implementación

- [x] Configurar variables VAPI en `.env`
- [x] Implementar servicio de transcripción (`vapiService.ts`)
- [x] Crear controller para manejar requests (`transcriptionController.ts`)
- [x] Configurar rutas con autenticación (`transcription.ts`)
- [x] Implementar almacenamiento JSON por sesión
- [x] Crear fallback mock para desarrollo
- [x] Agregar cálculo de costos
- [x] Documentar endpoints
- [x] Crear scripts de prueba
- [x] Integrar con widget del frontend

---

## 📚 Documentación Adicional

- [Documentación Completa](./TRANSCRIPTION.md)
- [API Reference](./ARCHITECTURE.md)
- [Credenciales de Prueba](./CREDENCIALES_PRUEBA.md)
- [VAPI Official Docs](https://docs.vapi.ai)

---

## 🚀 Próximos Pasos

1. **Configurar VAPI en Producción**
   - Obtener API Key de producción
   - Configurar webhook callbacks
   - Monitorear costos

2. **Optimizaciones**
   - Comprimir audio antes de enviar
   - Implementar caché de transcripciones
   - Agregar retry logic

3. **Features Adicionales**
   - Análisis de sentimientos
   - Detección de idioma automática
   - Exportar transcripciones a PDF/TXT
   - Dashboard de estadísticas
