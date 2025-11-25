# ⚠️ Nota Importante: API de VAPI

**Fecha**: 25 de noviembre de 2025

## 🔍 Hallazgo

Después de las pruebas, hemos descubierto que **VAPI NO expone un endpoint público REST para transcripciones server-side** del tipo `/v1/transcriptions`.

### ❌ Lo que NO funciona:
```bash
POST https://api.vapi.ai/v1/transcriptions
```
**Response**: `404 - Cannot POST /v1/transcriptions`

## 🎯 Solución Actual

VAPI funciona principalmente a través de:

### 1. **Widget Client-Side** ✅ (RECOMENDADO)
El widget de VAPI maneja todo el flujo de transcripción en el navegador:

```html
<script src="https://cdn.jsdelivr.net/gh/VapiAI/html-script-tag@latest/dist/vapi.js"></script>
<script>
  const vapi = window.vapiSDK.run({
    apiKey: "209ac772-6752-4407-9740-84afdfc7a41c",
    assistant: "0e9f3fcb-a5c4-4ea3-b8ff-52e8af6e3bdf",
    config: {
      transcriber: {
        provider: "deepgram",
        model: "nova-2",
        language: "es"
      }
    }
  });

  // Escuchar transcripciones
  vapi.on("message", (message) => {
    if (message.type === "transcript") {
      console.log("Transcripción:", message.transcript);
      
      // Enviar al backend para guardar
      fetch('/transcription/save', {
        method: 'POST',
        body: JSON.stringify({
          sessionId: "xxx",
          text: message.transcript,
          timestamp: new Date().toISOString()
        })
      });
    }
  });

  // Iniciar llamada
  vapi.start();
</script>
```

**Ventajas**:
- ✅ Audio capturado directamente del navegador
- ✅ Transcripción en tiempo real
- ✅ No consume ancho de banda del servidor
- ✅ Menor latencia
- ✅ Documentado y soportado oficialmente

### 2. **WebSocket API** (Avanzado)
VAPI también soporta WebSocket para streaming:

```javascript
const ws = new WebSocket('wss://api.vapi.ai/ws');

ws.onopen = () => {
  ws.send(JSON.stringify({
    type: 'start',
    assistantId: '0e9f3fcb-a5c4-4ea3-b8ff-52e8af6e3bdf',
    apiKey: '866040f5-1fdc-40f0-92fd-f8c6077573a1'
  }));
};

ws.onmessage = (event) => {
  const data = JSON.parse(event.data);
  if (data.type === 'transcript') {
    console.log('Transcripción:', data.text);
  }
};

// Enviar audio chunks
function sendAudio(audioChunk) {
  ws.send(audioChunk);
}
```

## 🔧 Implementación Recomendada

### Arquitectura Híbrida

```
┌─────────────┐
│  Navegador  │
└──────┬──────┘
       │
       │ VAPI Widget (transcripción)
       │
       ▼
┌──────────────┐
│   VAPI API   │ (Cloud)
└──────┬───────┘
       │
       │ Webhooks/Events
       │
       ▼
┌──────────────┐
│   Backend    │ (Nuestro servidor)
│              │
│ - Guardar    │
│ - Analytics  │
│ - Historial  │
└──────────────┘
```

### Endpoints del Backend

#### 1. Guardar Transcripción (desde widget)
```javascript
// POST /transcription/save
app.post('/transcription/save', async (req, res) => {
  const { sessionId, text, confidence, timestamp } = req.body;
  
  // Guardar en JSON
  await mockDataService.addTranscriptionSegment(
    tenantId,
    sessionId,
    {
      id: generateId(),
      sessionId,
      tenantId,
      text,
      confidence,
      timestamp,
      metadata: {
        engine: 'vapi',
        source: 'widget'
      }
    }
  );
  
  res.json({ success: true });
});
```

#### 2. Obtener Historial
```javascript
// GET /transcription/history/:sessionId
app.get('/transcription/history/:sessionId', async (req, res) => {
  const session = await mockDataService.getTranscriptionSession(
    tenantId,
    sessionId
  );
  res.json(session);
});
```

## 📝 Actualización del Frontend (vapi-session-test.html)

```html
<!DOCTYPE html>
<html>
<head>
  <title>VAPI Transcription</title>
  <script src="https://cdn.jsdelivr.net/gh/VapiAI/html-script-tag@latest/dist/vapi.js"></script>
</head>
<body>
  <button id="startBtn">Iniciar Conversación</button>
  <div id="transcripts"></div>

  <script>
    const sessionId = `session-${Date.now()}`;
    const vapi = window.vapiSDK.run({
      apiKey: "209ac772-6752-4407-9740-84afdfc7a41c",
      assistant: "0e9f3fcb-a5c4-4ea3-b8ff-52e8af6e3bdf"
    });

    // Escuchar mensajes
    vapi.on("message", async (message) => {
      if (message.type === "transcript") {
        // Mostrar en UI
        document.getElementById('transcripts').innerHTML += 
          `<p>${message.transcript}</p>`;

        // Guardar en backend
        await fetch('http://localhost:4000/transcription/save', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': 'vox_test_sk_1234567890abcdef'
          },
          body: JSON.stringify({
            sessionId: sessionId,
            tenantId: 'test-tenant-001',
            text: message.transcript,
            confidence: message.confidence || 0.95,
            timestamp: new Date().toISOString()
          })
        });
      }
    });

    // Botón para iniciar
    document.getElementById('startBtn').onclick = () => {
      vapi.start();
    };
  </script>
</body>
</html>
```

## 🎯 Próximos Pasos

### Opción 1: Usar Widget de VAPI (RECOMENDADO)
1. ✅ Modificar `vapi-session-test.html` para usar widget oficial
2. ✅ Crear endpoint `/transcription/save` en backend
3. ✅ El widget maneja audio, transcripción y eventos
4. ✅ Backend solo guarda y consulta historial

### Opción 2: Investigar API Server-Side de VAPI
1. 📧 Contactar soporte de VAPI para documentación de API server-side
2. 🔑 Verificar si necesitamos un tipo diferente de API key
3. 📚 Revisar si hay endpoints no documentados
4. 🧪 Probar con diferentes formatos de audio

### Opción 3: Usar Otro Provider
Si necesitamos transcripción server-side:
- **Google Cloud Speech-to-Text** (ya implementado anteriormente)
- **AWS Transcribe**
- **Deepgram API**
- **AssemblyAI**

## 📊 Comparación

| Aspecto | VAPI Widget | Server-Side |
|---------|-------------|-------------|
| Latencia | ⚡ Muy baja | 🐌 Alta |
| Bandwidth | ✅ Cliente | ❌ Servidor |
| Costo | 💰 Directo a VAPI | 💰💰 Servidor + VAPI |
| Complejidad | ✅ Baja | ⚠️ Alta |
| Control | ⚠️ Limitado | ✅ Total |
| Privacidad | ⚠️ Cliente→VAPI | ✅ Servidor→VAPI |

## ✅ Decisión Recomendada

**Usar VAPI Widget** para la transcripción y backend solo para:
- Almacenamiento de historial
- Analytics
- Exportación
- Dashboard

Esto es más eficiente, económico y está soportado oficialmente por VAPI.

---

**Estado Actual del Código**: 
- ✅ Endpoints de sesiones implementados
- ⚠️ No functional con API REST de VAPI (404)
- 🔄 Pendiente migración a widget client-side

**Última actualización**: 25 de noviembre de 2025, 13:05
