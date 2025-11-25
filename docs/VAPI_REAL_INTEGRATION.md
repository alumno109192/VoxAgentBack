# 🚀 Integración VAPI Real - Sin Mock

**Fecha de actualización**: 25 de noviembre de 2025  
**Versión**: 2.0.0  
**Estado**: ✅ Producción con API real de VAPI

---

## 📋 Cambios Realizados

### ✅ Eliminado Sistema Mock
- ❌ Ya NO usa sesiones mock
- ❌ Ya NO usa transcripciones mock
- ✅ **TODO usando API real de VAPI**

### ✅ Arquitectura Actualizada

```
Cliente → Backend → VAPI API (Real)
         ↓
    JSON Storage
  (transcription-*.json)
```

**VAPI es Stateless**: No mantiene sesiones en su API. Nuestro backend:
1. Crea tracking local de "sesiones" para agrupar transcripciones
2. Cada chunk de audio va directo a `/v1/transcriptions` de VAPI
3. VAPI responde con el texto transcrito
4. Backend guarda en JSON local

---

## 🔧 Configuración Requerida

### Variables de Entorno (.env)

```env
# VAPI Configuration (OBLIGATORIAS)
VAPI_API_URL=https://api.vapi.ai
VAPI_API_KEY=866040f5-1fdc-40f0-92fd-f8c6077573a1
VAPI_ASSISTANT_ID=0e9f3fcb-a5c4-4ea3-b8ff-52e8af6e3bdf
VAPI_PUBLIC_KEY=209ac772-6752-4407-9740-84afdfc7a41c
```

### ⚠️ IMPORTANTE

Si `VAPI_API_KEY` no está configurado o es "mock", el sistema **lanzará error**:
```
Error: VAPI API key no configurada. Configure VAPI_API_KEY en .env
```

---

## 📊 Flujo de Trabajo

### 1. Iniciar Sesión
```bash
curl -X POST http://localhost:4000/transcription/session/start \
  -H "Content-Type: application/json" \
  -H "x-api-key: vox_test_sk_1234567890abcdef" \
  -d '{
    "tenantId": "test-tenant-001",
    "sessionId": "session-123",
    "language": "es-ES"
  }'
```

**Response**:
```json
{
  "success": true,
  "vapiSessionId": "vapi-1732547890-abc123",
  "sessionId": "session-123",
  "status": "active",
  "createdAt": "2025-11-25T13:15:00.000Z"
}
```

**Qué pasa**:
- ✅ Crea tracking local de sesión
- ✅ Genera `vapiSessionId` único
- ✅ **NO llama a API de VAPI** (es stateless)
- ✅ Inicializa archivo JSON de transcripción

---

### 2. Enviar Audio

```bash
curl -X POST http://localhost:4000/transcription/vapi \
  -H "Content-Type: application/json" \
  -H "x-api-key: vox_test_sk_1234567890abcdef" \
  -d '{
    "vapiSessionId": "vapi-1732547890-abc123",
    "sessionId": "session-123",
    "tenantId": "test-tenant-001",
    "audioBlob": "BASE64_AUDIO_HERE",
    "sequence": 1
  }'
```

**Response**:
```json
{
  "text": "Hola, quisiera información sobre sus servicios",
  "type": "final",
  "isFinal": true,
  "confidence": 0.97,
  "timestamp": "2025-11-25T13:15:05.123Z"
}
```

**Qué pasa**:
1. ✅ Valida que `VAPI_API_KEY` esté configurada
2. ✅ Llama a `POST https://api.vapi.ai/v1/transcriptions`
3. ✅ Payload enviado:
   ```json
   {
     "audio": "BASE64_AUDIO",
     "language": "es-ES",
     "assistantId": "0e9f3fcb-a5c4-4ea3-b8ff-52e8af6e3bdf"
   }
   ```
4. ✅ VAPI responde con texto transcrito
5. ✅ Backend guarda en JSON local
6. ✅ Responde al cliente

---

### 3. Finalizar Sesión

```bash
curl -X POST http://localhost:4000/transcription/session/end \
  -H "Content-Type: application/json" \
  -H "x-api-key: vox_test_sk_1234567890abcdef" \
  -d '{
    "vapiSessionId": "vapi-1732547890-abc123",
    "sessionId": "session-123",
    "tenantId": "test-tenant-001"
  }'
```

**Response**:
```json
{
  "success": true,
  "sessionId": "session-123",
  "vapiSessionId": "vapi-1732547890-abc123",
  "totalSegments": 5,
  "endedAt": "2025-11-25T13:20:00.000Z"
}
```

**Qué pasa**:
- ✅ Elimina sesión del tracking local
- ✅ **NO llama a API de VAPI** (es stateless)
- ✅ Archivo JSON permanece para historial

---

## 🧪 Testing con Audio Real

### Grabar Audio con MediaRecorder

```javascript
// Iniciar grabación
navigator.mediaDevices.getUserMedia({ audio: true })
  .then(stream => {
    const mediaRecorder = new MediaRecorder(stream, {
      mimeType: 'audio/webm;codecs=opus'
    });
    
    const chunks = [];
    
    mediaRecorder.ondataavailable = e => {
      if (e.data.size > 0) chunks.push(e.data);
    };
    
    mediaRecorder.onstop = async () => {
      const audioBlob = new Blob(chunks, { type: 'audio/webm' });
      const reader = new FileReader();
      
      reader.onloadend = async () => {
        const base64Audio = reader.result.split(',')[1];
        
        // Enviar a backend
        const response = await fetch('/transcription/vapi', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': 'vox_test_sk_1234567890abcdef'
          },
          body: JSON.stringify({
            vapiSessionId: 'vapi-xxx',
            sessionId: 'session-123',
            tenantId: 'test-tenant-001',
            audioBlob: base64Audio
          })
        });
        
        const data = await response.json();
        console.log('Transcripción:', data.text);
      };
      
      reader.readAsDataURL(audioBlob);
    };
    
    mediaRecorder.start();
    
    // Detener después de 5 segundos
    setTimeout(() => mediaRecorder.stop(), 5000);
  });
```

---

## 🔍 Health Check

```bash
curl http://localhost:4000/transcription/health
```

**Response (OK)**:
```json
{
  "status": "ok",
  "vapi": {
    "status": "ok",
    "configured": true,
    "message": "VAPI conectado y funcionando"
  },
  "timestamp": "2025-11-25T13:15:00.000Z"
}
```

**Response (Error - API Key no configurada)**:
```json
{
  "status": "ok",
  "vapi": {
    "status": "error",
    "configured": false,
    "message": "VAPI_API_KEY no configurada"
  },
  "timestamp": "2025-11-25T13:15:00.000Z"
}
```

**Response (Error - API Key inválida)**:
```json
{
  "status": "ok",
  "vapi": {
    "status": "error",
    "configured": true,
    "message": "API key inválida"
  },
  "timestamp": "2025-11-25T13:15:00.000Z"
}
```

---

## ⚡ Manejo de Errores

### Error 1: VAPI_API_KEY no configurada

**Request**:
```bash
curl -X POST http://localhost:4000/transcription/session/start ...
```

**Response (503)**:
```json
{
  "error": "Error al iniciar sesión de transcripción",
  "message": "VAPI API key no configurada. Configure VAPI_API_KEY en .env"
}
```

**Solución**:
```bash
# En .env
VAPI_API_KEY=866040f5-1fdc-40f0-92fd-f8c6077573a1
```

---

### Error 2: API Key Inválida

**Response (500)**:
```json
{
  "error": "Error al procesar transcripción",
  "message": "Autenticación VAPI falló. Verifique VAPI_API_KEY"
}
```

**Solución**: Verificar que la API key sea correcta en VAPI dashboard.

---

### Error 3: Endpoint No Encontrado

**Response (500)**:
```json
{
  "error": "Error al procesar transcripción",
  "message": "Endpoint de VAPI no encontrado. Verifique VAPI_API_URL"
}
```

**Solución**:
```bash
# En .env
VAPI_API_URL=https://api.vapi.ai
```

---

## 💰 Costos Reales

Cada llamada a `/v1/transcriptions` consume créditos de VAPI:

- **$0.006 USD por minuto** de audio
- Audio de 5 segundos = ~$0.0005 USD
- Audio de 30 segundos = ~$0.003 USD
- Audio de 1 minuto = $0.006 USD

### Ejemplo de Conversación

| Segmento | Duración | Costo Individual | Acumulado |
|----------|----------|------------------|-----------|
| 1        | 3s       | $0.0003          | $0.0003   |
| 2        | 5s       | $0.0005          | $0.0008   |
| 3        | 8s       | $0.0008          | $0.0016   |
| 4        | 4s       | $0.0004          | $0.0020   |
| 5        | 10s      | $0.0010          | $0.0030   |

**Total**: 30 segundos = **$0.003 USD**

---

## 📊 Logs en Producción

### Sesión Exitosa

```
2025-11-25 13:15:00 [info] Creating local VAPI session {"language":"es-ES"}
2025-11-25 13:15:00 [info] Local VAPI session created {"sessionId":"vapi-1732547890-abc123"}
2025-11-25 13:15:05 [info] Sending audio to VAPI (stateless) {"sessionId":"vapi-xxx","audioSize":42720}
2025-11-25 13:15:06 [info] Audio transcribed successfully with VAPI {"textLength":45,"confidence":0.97}
2025-11-25 13:20:00 [info] Ending VAPI session (local cleanup) {"sessionId":"vapi-xxx"}
```

### Error de Configuración

```
2025-11-25 13:15:00 [error] Error creating local VAPI session {"error":"VAPI API key no configurada"}
```

### Error de Autenticación

```
2025-11-25 13:15:05 [error] Error sending audio to VAPI {"status":401,"message":"Unauthorized"}
```

---

## 🎯 Diferencias vs Versión Mock

| Aspecto | Versión Mock (v1.0) | Versión Real (v2.0) |
|---------|---------------------|---------------------|
| **API VAPI** | ❌ No usada | ✅ Usada en cada transcripción |
| **Transcripciones** | Mock random | ✅ Reales de VAPI |
| **Costos** | $0 | ✅ $0.006/minuto |
| **Configuración** | Opcional | ✅ Obligatoria |
| **Accuracy** | N/A | ✅ Real (0.85-0.99) |
| **Idiomas** | Solo mock | ✅ Todos los de VAPI |
| **Fallback** | Mock automático | ❌ Error si falla |

---

## 🚀 Demo en Producción

El archivo `examples/vapi-session-test.html` **funciona con API real**:

1. Abrir `http://localhost:4000/examples/vapi-session-test.html`
2. Verificar que API Key esté configurada
3. Click "Iniciar Sesión"
4. Click "Grabar Audio"
5. **Hablar al micrófono** (audio real)
6. Click "Detener Grabación"
7. **Ver transcripción REAL de VAPI** ✅

---

## ✅ Checklist de Producción

Antes de desplegar:

- [ ] `VAPI_API_KEY` configurada en `.env`
- [ ] `VAPI_API_URL` apunta a `https://api.vapi.ai`
- [ ] `VAPI_ASSISTANT_ID` correcto
- [ ] Health check responde OK
- [ ] Test con audio real funciona
- [ ] Logs muestran conexión exitosa a VAPI
- [ ] Archivo JSON se crea correctamente
- [ ] Costos monitoreados en dashboard VAPI

---

## 📚 Referencias

- [VAPI API Documentation](https://docs.vapi.ai)
- [Endpoint /v1/transcriptions](https://docs.vapi.ai/api-reference/transcriptions)
- [Pricing](https://vapi.ai/pricing)

---

## 👥 Soporte

### Verificar Configuración
```bash
# Ver variables de entorno
cat .env | grep VAPI

# Test de health
curl http://localhost:4000/transcription/health | jq .
```

### Logs en Tiempo Real
```bash
tail -f /tmp/server.log | grep -i vapi
```

---

**Estado**: ✅ **PRODUCCIÓN CON API REAL DE VAPI**  
**Última actualización**: 25 de noviembre de 2025
