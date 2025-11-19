# 🚀 Guía Rápida - Integración VAPI

## ✅ Estado: COMPLETADO Y FUNCIONAL

---

## 📦 Instalación y Configuración

### 1. Configurar Variables de Entorno

Agregar a tu archivo `.env`:

```env
# VAPI Transcription API
VAPI_API_URL=https://api.vapi.ai
VAPI_API_KEY=tu-api-key-de-vapi
VAPI_AGENT_ID=tu-agent-id
```

### 2. Instalar Dependencias (ya instaladas)

```bash
npm install
```

### 3. Compilar TypeScript

```bash
npm run build
```

### 4. Iniciar Servidor

```bash
# Desarrollo
npm run dev

# Producción
npm start
```

---

## 🧪 Pruebas Rápidas

### Demo Express (30 segundos)

```bash
./scripts/demo-vapi.sh
```

### Prueba Completa (todos los endpoints)

```bash
./scripts/test-transcription-flow.sh
```

### Health Check

```bash
curl http://localhost:4000/transcription/health | jq '.'
```

### Transcribir Audio de Prueba

```bash
curl -X POST http://localhost:4000/transcription/segment \
  -H "X-API-Key: vox_test_sk_1234567890abcdef" \
  -H "Content-Type: application/json" \
  -d '{
    "sessionId": "test-123",
    "tenantId": "test-tenant-001",
    "audioBlob": "UklGRiQAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQAAAAA=",
    "format": "wav",
    "language": "es-ES"
  }' | jq '.'
```

---

## 📡 Endpoints Disponibles

| Método | Endpoint | Auth | Descripción |
|--------|----------|------|-------------|
| POST | `/transcription/segment` | API Key | Transcribir audio con VAPI |
| GET | `/transcription/health` | Ninguna | Health check VAPI |
| GET | `/transcription/session/:id` | JWT | Historial de sesión |
| GET | `/transcription/sessions` | JWT | Listar sesiones |
| GET | `/transcription/stats` | JWT | Estadísticas agregadas |

---

## 🎨 Ejemplo de Integración Frontend

### HTML + JavaScript

```html
<!DOCTYPE html>
<html>
<head>
  <title>Widget VAPI</title>
</head>
<body>
  <button id="start">🎤 Grabar</button>
  <button id="stop">⏹️ Detener</button>
  <div id="output"></div>

  <script>
    const API_KEY = 'vox_test_sk_1234567890abcdef';
    const TENANT_ID = 'test-tenant-001';
    const SESSION_ID = 'session-' + Date.now();
    let mediaRecorder, chunks = [];

    document.getElementById('start').onclick = async () => {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorder = new MediaRecorder(stream);
      
      mediaRecorder.ondataavailable = e => chunks.push(e.data);
      mediaRecorder.onstop = async () => {
        const blob = new Blob(chunks, { type: 'audio/webm' });
        chunks = [];
        await transcribe(blob);
      };
      
      mediaRecorder.start();
      console.log('🎤 Grabando...');
    };

    document.getElementById('stop').onclick = () => {
      mediaRecorder.stop();
      console.log('⏹️ Detenido');
    };

    async function transcribe(audioBlob) {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64 = reader.result.split(',')[1];
        
        const res = await fetch('http://localhost:4000/transcription/segment', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-API-Key': API_KEY
          },
          body: JSON.stringify({
            sessionId: SESSION_ID,
            tenantId: TENANT_ID,
            audioBlob: base64,
            format: 'webm',
            language: 'es-ES'
          })
        });
        
        const data = await res.json();
        document.getElementById('output').innerHTML += 
          `<p><strong>${data.text}</strong> (${data.confidence})</p>`;
      };
      reader.readAsDataURL(audioBlob);
    }
  </script>
</body>
</html>
```

---

## 📊 Estructura de Respuesta

### Transcripción Exitosa

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

### Archivo JSON Guardado

**Ubicación:** `data/mock/{tenantId}/transcription-{sessionId}.json`

```json
{
  "sessionId": "session-123",
  "tenantId": "test-tenant-001",
  "segments": [
    {
      "id": "segment-001",
      "text": "Hola, buenos días",
      "confidence": 0.96,
      "duration": 2.5,
      "timestamp": "2025-11-19T10:00:00.000Z",
      "metadata": {
        "audioSize": 38400,
        "format": "webm",
        "engine": "vapi",
        "cost": 0.00025
      }
    }
  ],
  "totalDuration": 2.5,
  "totalCost": 0.00025,
  "totalWords": 3
}
```

---

## 🔍 Verificación y Debug

### 1. Verificar Servidor

```bash
curl http://localhost:4000/health
```

### 2. Ver Logs

```bash
npm run dev
# Los logs aparecerán en la consola
```

### 3. Verificar Archivos JSON

```bash
# Listar sesiones guardadas
ls -la data/mock/test-tenant-001/

# Ver contenido de una sesión
cat data/mock/test-tenant-001/transcription-session-123.json | jq '.'

# Ver solo los textos
cat data/mock/test-tenant-001/transcription-*.json | jq '.segments[].text'
```

### 4. Verificar Compilación

```bash
npm run build
# Debe completar sin errores
```

---

## 💰 Costos VAPI

| Duración | Costo |
|----------|-------|
| 10 seg | $0.001 |
| 1 min | $0.006 |
| 5 min | $0.03 |
| 1 hora | $0.36 |

**Ejemplo Mensual:**
```
1000 conversaciones × 3 min = 3000 min
3000 min × $0.006 = $18 USD/mes
```

---

## 📚 Documentación Completa

| Documento | Descripción |
|-----------|-------------|
| [VAPI_RESUMEN.md](./VAPI_RESUMEN.md) | Resumen ejecutivo completo |
| [VAPI_INTEGRATION.md](./VAPI_INTEGRATION.md) | Guía técnica detallada |
| [TRANSCRIPTION.md](./TRANSCRIPTION.md) | Documentación de API |
| [README.md](./README.md) | Documentación general |

---

## 🎯 Checklist de Implementación

### Backend
- [x] Configurar variables VAPI en `.env`
- [x] Verificar compilación TypeScript
- [x] Iniciar servidor (`npm run dev`)
- [x] Ejecutar health check
- [x] Probar endpoint de transcripción

### Frontend (Widget)
- [ ] Implementar grabación de audio
- [ ] Convertir audio a base64
- [ ] Enviar a `/transcription/segment`
- [ ] Mostrar texto transcrito en UI
- [ ] Manejar errores

### Producción
- [ ] Obtener API Key de VAPI producción
- [ ] Configurar variables en servidor
- [ ] Monitorear costos
- [ ] Configurar límites de uso
- [ ] Implementar logging y alertas

---

## 🚨 Troubleshooting

### Error: "Servidor no disponible"
**Solución:**
```bash
npm run dev
```

### Error: "VAPI authentication failed"
**Solución:** Verificar que `VAPI_API_KEY` esté en `.env`

### Error: "Invalid API key"
**Solución:** Incluir header `X-API-Key` en el request

### Modo Mock Activado
**Causa:** VAPI no configurado (normal en desarrollo)
**Solución:** Agregar `VAPI_API_KEY` y `VAPI_AGENT_ID` en `.env` para modo producción

### Audio no se transcribe
**Verificar:**
1. Formato de audio soportado (webm, mp3, wav, ogg)
2. Audio está en base64
3. Health check retorna "healthy"
4. Logs del servidor para errores

---

## 🎉 Comandos Útiles

```bash
# Iniciar servidor
npm run dev

# Compilar TypeScript
npm run build

# Health check
curl http://localhost:4000/transcription/health | jq '.'

# Demo rápido
./scripts/demo-vapi.sh

# Pruebas completas
./scripts/test-transcription-flow.sh

# Ver sesiones guardadas
ls data/mock/test-tenant-001/

# Limpiar sesiones de prueba
rm data/mock/test-tenant-001/transcription-*.json
```

---

## 📞 Soporte

- **Documentación VAPI:** https://docs.vapi.ai
- **Issues:** https://github.com/alumno109192/VoxAgentBack/issues
- **Email:** soporte@voxagent.com

---

**¡Todo listo para transcribir audio con VAPI! 🎉**

Última actualización: 19 de noviembre de 2025
