# 🎤 Integración de Google Cloud Speech-to-Text

## 📋 Descripción General

Este sistema utiliza **Google Cloud Speech-to-Text** para transcribir audio en tiempo real, procesando el audio capturado desde el navegador del usuario y convirtiéndolo en texto.

## 🏗️ Arquitectura

```
┌─────────────┐        ┌──────────────┐        ┌─────────────────┐
│  Frontend   │        │   Backend    │        │  Google Cloud   │
│  (Browser)  │───────▶│   Express    │───────▶│  Speech-to-Text │
│ MediaRecorder│ Base64 │ googleSpeech │  API   │      API        │
└─────────────┘  Audio └──────────────┘ Request└─────────────────┘
                              │
                              ▼
                       ┌──────────────┐
                       │ JSON Storage │
                       │ (per session)│
                       └──────────────┘
```

## 🔧 Configuración

### ✅ Configuración Actual (Ya Completada)

El proyecto **ya está configurado** y listo para usar Google Cloud Speech-to-Text:

```bash
# Credenciales configuradas
GOOGLE_APPLICATION_CREDENTIALS=/Users/yesod/voxagentai-2825cc56f9c9.json

# Proyecto: voxagentai
# Service Account: cloud-speech-client@voxagentai.iam.gserviceaccount.com
```

**Para verificar la configuración:**
```bash
./scripts/verify-google-credentials.sh
```

**Para iniciar el servidor:**
```bash
npm run dev
# El servidor usará Google STT en modo PRODUCCIÓN (no mock)
```

### 📋 Configuración Manual (Si Necesitas Cambiar el Proyecto)

### 1. Credenciales de Google Cloud

1. **Crear proyecto en Google Cloud Console**:
   - Ir a https://console.cloud.google.com/
   - Crear un nuevo proyecto o seleccionar uno existente

2. **Activar Speech-to-Text API**:
   - Navegar a "APIs & Services" → "Library"
   - Buscar "Cloud Speech-to-Text API"
   - Hacer clic en "Enable"

3. **Crear Service Account**:
   - Ir a "APIs & Services" → "Credentials"
   - Clic en "Create Credentials" → "Service Account"
   - Asignar rol "Cloud Speech Client"
   - Descargar la clave JSON

4. **Configurar credenciales en el servidor**:

```bash
# Copiar el archivo JSON descargado
cp ~/Downloads/your-project-credentials.json ./google-credentials.json

# Configurar variable de entorno
export GOOGLE_APPLICATION_CREDENTIALS="$(pwd)/google-credentials.json"
```

### 2. Variables de Entorno

Añadir al archivo `.env`:

```env
# Google Cloud Speech-to-Text
GOOGLE_APPLICATION_CREDENTIALS=./google-credentials.json

# Opcional: Configuración de la región
GOOGLE_CLOUD_PROJECT=your-project-id
```

## 🎯 Formatos de Audio Soportados

| Formato | Encoding Google STT | Sample Rate | Uso Recomendado |
|---------|-------------------|-------------|-----------------|
| **WEBM** | WEBM_OPUS | 48000 Hz | ✅ **Navegadores modernos** (Chrome, Edge, Firefox) |
| **OGG** | OGG_OPUS | 48000 Hz | Firefox, algunos navegadores móviles |
| **WAV** | LINEAR16 | 16000 Hz | Calidad telefónica, compatible universalmente |
| **MP3** | MP3 | 16000 Hz | Compatibilidad legacy |

### Formato Recomendado: WEBM_OPUS

```javascript
// Frontend - Configuración MediaRecorder
const mediaRecorder = new MediaRecorder(stream, {
  mimeType: 'audio/webm;codecs=opus',
  audioBitsPerSecond: 128000
});
```

**Ventajas**:
- ✅ Mejor compresión (menor tamaño)
- ✅ Excelente calidad de audio
- ✅ Baja latencia
- ✅ Soporte nativo en navegadores modernos
- ✅ Optimizado para voz

## 📡 API Endpoints

### 1. Transcribir Segmento de Audio

**POST** `/api/transcription/segment`

Transcribe un fragmento de audio usando Google Cloud Speech-to-Text.

#### Request Body

```json
{
  "sessionId": "session-abc123",
  "tenantId": "test-tenant-001",
  "audioBlob": "UklGRiQAAABXQVZFZm10IBAAAAABAAEA...",
  "format": "webm",
  "language": "es-ES"
}
```

#### Parámetros

| Campo | Tipo | Requerido | Default | Descripción |
|-------|------|-----------|---------|-------------|
| `sessionId` | string | ✅ | - | ID único de la sesión |
| `tenantId` | string | ✅ | - | ID del tenant |
| `audioBlob` | string | ✅ | - | Audio en Base64 |
| `format` | string | ❌ | "webm" | Formato del audio (webm/mp3/wav/ogg) |
| `language` | string | ❌ | "es-ES" | Código de idioma |

#### Response Success (200)

```json
{
  "text": "Hola, ¿cómo estás?",
  "segmentId": "seg-1637254800123",
  "confidence": 0.95,
  "timestamp": "2024-11-20T10:30:00.000Z",
  "metadata": {
    "duration": 2.5,
    "cost": 0.006,
    "engine": "google-stt",
    "encoding": "WEBM_OPUS",
    "sampleRate": 48000,
    "words": [
      {
        "word": "Hola",
        "startTime": 0.0,
        "endTime": 0.5,
        "confidence": 0.98
      },
      {
        "word": "cómo",
        "startTime": 0.6,
        "endTime": 0.9,
        "confidence": 0.95
      }
    ]
  }
}
```

#### Response Error (400)

```json
{
  "error": "Missing required field: audioBlob"
}
```

### 2. Health Check

**GET** `/api/transcription/health`

Verifica el estado del servicio de Google Speech-to-Text.

#### Response

```json
{
  "status": "ok",
  "service": "google-stt",
  "configured": true,
  "mode": "production",
  "timestamp": "2024-11-20T10:30:00.000Z"
}
```

**Estados posibles**:
- `ok` + `production`: Google STT configurado y funcionando
- `ok` + `mock`: Sin credenciales, usando modo simulación
- `degraded`: Servicio con problemas

## 💰 Modelo de Costos

Google Cloud Speech-to-Text factura por **intervalos de 15 segundos**:

| Duración | Intervalos | Costo (USD) |
|----------|-----------|-------------|
| 0-15 seg | 1 | $0.006 |
| 16-30 seg | 2 | $0.012 |
| 31-45 seg | 3 | $0.018 |
| 46-60 seg | 4 | $0.024 |

**Fórmula**:
```
cost = Math.ceil(durationInSeconds / 15) * 0.006
```

### Comparación con VAPI

| Servicio | Unidad de Facturación | Costo por Unidad | Audio de 30 seg |
|----------|----------------------|------------------|-----------------|
| **Google STT** | 15 segundos | $0.006 | $0.012 |
| **VAPI** | 1 minuto | $0.006 | $0.003 |

⚠️ **Nota**: Google STT es más costoso para audios cortos, pero ofrece mayor precisión y control.

## 🔐 Seguridad

### Autenticación API Key

Todas las peticiones de transcripción requieren autenticación mediante API Key:

```bash
curl -X POST https://your-domain.com/api/transcription/segment \
  -H "X-API-Key: your-api-key" \
  -H "Content-Type: application/json" \
  -d '{
    "sessionId": "session-123",
    "tenantId": "tenant-001",
    "audioBlob": "base64-audio-data",
    "format": "webm"
  }'
```

### Protección de Credenciales

❌ **NO HACER**:
```javascript
// NO commitear credenciales en el código
const credentials = {
  private_key: "-----BEGIN PRIVATE KEY-----\nMIIE..."
};
```

✅ **HACER**:
```bash
# Usar variable de entorno
export GOOGLE_APPLICATION_CREDENTIALS="/path/to/credentials.json"

# Añadir a .gitignore
echo "google-credentials.json" >> .gitignore
```

## 🧪 Modo Mock (Sin Credenciales)

Si no se configuran las credenciales de Google Cloud, el sistema funciona en **modo mock**:

```javascript
// Respuesta simulada
{
  "text": "Esto es una transcripción de prueba simulada",
  "confidence": 0.85,
  "metadata": {
    "engine": "google-stt",
    "mode": "mock"
  }
}
```

**Frases Mock (12 variantes en español)**:
1. "Esto es una transcripción de prueba simulada"
2. "Hola, esta es una prueba del sistema de transcripción"
3. "Bienvenido al servicio de transcripción automática"
4. "El sistema está funcionando correctamente"
5. "Esta es una demostración del reconocimiento de voz"
6. ... (ver `googleSpeechService.ts`)

## 📊 Almacenamiento de Transcripciones

Las transcripciones se guardan en archivos JSON por sesión:

```
data/
  mock/
    {tenantId}/
      transcription-{sessionId}.json
```

### Estructura del Archivo

```json
{
  "sessionId": "session-abc123",
  "tenantId": "test-tenant-001",
  "segments": [
    {
      "segmentId": "seg-1637254800123",
      "text": "Hola, ¿cómo estás?",
      "confidence": 0.95,
      "timestamp": "2024-11-20T10:30:00.000Z",
      "metadata": {
        "duration": 2.5,
        "cost": 0.006,
        "engine": "google-stt",
        "encoding": "WEBM_OPUS",
        "sampleRate": 48000,
        "words": [...]
      }
    }
  ],
  "createdAt": "2024-11-20T10:30:00.000Z",
  "updatedAt": "2024-11-20T10:32:15.000Z"
}
```

## 🌐 Idiomas Soportados

Google Cloud Speech-to-Text soporta **125+ idiomas**. Los más comunes:

| Código | Idioma | Variantes |
|--------|--------|-----------|
| `es-ES` | Español (España) | ✅ **Default** |
| `es-MX` | Español (México) | |
| `es-AR` | Español (Argentina) | |
| `en-US` | Inglés (EE.UU.) | |
| `en-GB` | Inglés (Reino Unido) | |
| `fr-FR` | Francés | |
| `de-DE` | Alemán | |
| `it-IT` | Italiano | |
| `pt-BR` | Portugués (Brasil) | |
| `ca-ES` | Catalán | |

### Configurar Idioma

```javascript
// Frontend
const requestData = {
  sessionId: 'session-123',
  tenantId: 'tenant-001',
  audioBlob: base64Audio,
  language: 'es-MX'  // Español de México
};
```

## 🛠️ Implementación Frontend

### Ejemplo Completo: Captura y Transcripción

```html
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <title>Transcripción con Google STT</title>
</head>
<body>
  <button id="startBtn">🎤 Iniciar Grabación</button>
  <button id="stopBtn" disabled>⏹️ Detener</button>
  <div id="transcript"></div>
  
  <script>
    const API_URL = 'https://your-backend.com/api';
    const API_KEY = 'your-api-key';
    const SESSION_ID = 'session-' + Date.now();
    const TENANT_ID = 'tenant-001';
    
    let mediaRecorder;
    let audioChunks = [];
    
    // Iniciar grabación
    document.getElementById('startBtn').addEventListener('click', async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ 
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            sampleRate: 48000
          } 
        });
        
        mediaRecorder = new MediaRecorder(stream, {
          mimeType: 'audio/webm;codecs=opus',
          audioBitsPerSecond: 128000
        });
        
        mediaRecorder.ondataavailable = (event) => {
          audioChunks.push(event.data);
        };
        
        mediaRecorder.onstop = async () => {
          const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
          await sendToTranscription(audioBlob);
          audioChunks = [];
        };
        
        mediaRecorder.start();
        document.getElementById('startBtn').disabled = true;
        document.getElementById('stopBtn').disabled = false;
        
      } catch (error) {
        console.error('Error al acceder al micrófono:', error);
        alert('No se pudo acceder al micrófono');
      }
    });
    
    // Detener grabación
    document.getElementById('stopBtn').addEventListener('click', () => {
      mediaRecorder.stop();
      mediaRecorder.stream.getTracks().forEach(track => track.stop());
      document.getElementById('startBtn').disabled = false;
      document.getElementById('stopBtn').disabled = true;
    });
    
    // Enviar audio a transcripción
    async function sendToTranscription(audioBlob) {
      try {
        // Convertir a Base64
        const reader = new FileReader();
        reader.readAsDataURL(audioBlob);
        
        reader.onloadend = async () => {
          const base64Audio = reader.result.split(',')[1];
          
          // Enviar a backend
          const response = await fetch(`${API_URL}/transcription/segment`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'X-API-Key': API_KEY
            },
            body: JSON.stringify({
              sessionId: SESSION_ID,
              tenantId: TENANT_ID,
              audioBlob: base64Audio,
              format: 'webm',
              language: 'es-ES'
            })
          });
          
          const result = await response.json();
          
          if (response.ok) {
            // Mostrar transcripción
            const transcriptDiv = document.getElementById('transcript');
            transcriptDiv.innerHTML += `
              <p>
                <strong>[${new Date().toLocaleTimeString()}]</strong> 
                ${result.text} 
                <em>(${(result.confidence * 100).toFixed(1)}%)</em>
              </p>
            `;
            console.log('Metadata:', result.metadata);
          } else {
            console.error('Error:', result.error);
          }
        };
      } catch (error) {
        console.error('Error al transcribir:', error);
      }
    }
  </script>
</body>
</html>
```

## 🐛 Troubleshooting

### Problema: "Google credentials not configured"

**Solución**:
```bash
# Verificar que existe el archivo
ls -la google-credentials.json

# Configurar variable de entorno
export GOOGLE_APPLICATION_CREDENTIALS="$(pwd)/google-credentials.json"

# Reiniciar servidor
npm run dev
```

### Problema: "Audio encoding not supported"

**Solución**: Verificar que el formato esté en la lista soportada:
```javascript
// Formatos válidos
const validFormats = ['webm', 'mp3', 'wav', 'ogg'];
```

### Problema: "Low confidence score"

**Posibles causas**:
- Audio con mucho ruido de fondo
- Volumen muy bajo
- Sample rate incorrecto
- Idioma incorrecto

**Solución**:
```javascript
// Mejorar calidad de audio
const stream = await navigator.mediaDevices.getUserMedia({ 
  audio: {
    echoCancellation: true,      // Cancelación de eco
    noiseSuppression: true,       // Supresión de ruido
    autoGainControl: true,        // Control automático de ganancia
    sampleRate: 48000             // Sample rate óptimo
  } 
});
```

## 📚 Referencias

- [Google Cloud Speech-to-Text Docs](https://cloud.google.com/speech-to-text/docs)
- [Supported Languages](https://cloud.google.com/speech-to-text/docs/languages)
- [Audio Encoding](https://cloud.google.com/speech-to-text/docs/encoding)
- [Pricing](https://cloud.google.com/speech-to-text/pricing)
- [Best Practices](https://cloud.google.com/speech-to-text/docs/best-practices)

## 📝 Notas de Migración desde VAPI

Si estás migrando desde VAPI:

| Aspecto | VAPI | Google STT |
|---------|------|------------|
| **Configuración** | API Key pública | Service Account JSON |
| **Formato Audio** | Widget maneja automático | MediaRecorder manual |
| **Facturación** | $0.006/minuto | $0.006/15 segundos |
| **Latencia** | ~500ms | ~200ms |
| **Precisión** | Buena | Excelente |
| **Idiomas** | Limitados | 125+ |
| **Control** | Limitado | Total |

---

**Última actualización**: 20 de noviembre de 2024  
**Versión del servicio**: 1.0.0  
**Mantenido por**: VoiceTotem Studio Team
