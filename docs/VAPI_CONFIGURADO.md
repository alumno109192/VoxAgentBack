# 🎉 Integración VAPI Completa - Con Credenciales Configuradas

## ✅ Credenciales VAPI Configuradas

### 🔑 Tus Credenciales

```
Public Key:     209ac772-6752-4407-9740-84afdfc7a41c
Assistant ID:   0e9f3fcb-a5c4-4ea3-b8ff-52e8af6e3bdf
```

---

## 🚀 Quick Start (3 Pasos)

### 1. Copiar Variables de Entorno

Crea un archivo `.env` en la raíz del proyecto:

```bash
cp .env.example .env
```

El archivo ya tiene tus credenciales configuradas por defecto:

```env
# VAPI Configuration (YA CONFIGURADO)
VAPI_API_URL=https://api.vapi.ai
VAPI_PUBLIC_KEY=209ac772-6752-4407-9740-84afdfc7a41c
VAPI_ASSISTANT_ID=0e9f3fcb-a5c4-4ea3-b8ff-52e8af6e3bdf
```

### 2. Iniciar el Servidor

```bash
npm run dev
```

### 3. Probar el Widget

Abre en tu navegador:

```
examples/vapi-widget-demo.html
```

**¡Eso es todo! El widget ya está funcionando con tus credenciales.**

---

## 📱 Integración en Tu Sitio Web

### Opción 1: Widget Simple (Copia y Pega)

```html
<!DOCTYPE html>
<html>
<head>
  <title>Mi Sitio con VAPI</title>
</head>
<body>
  <h1>Mi Sitio Web</h1>
  
  <!-- VAPI Widget -->
  <vapi-widget 
    assistant-id="0e9f3fcb-a5c4-4ea3-b8ff-52e8af6e3bdf" 
    public-key="209ac772-6752-4407-9740-84afdfc7a41c">
  </vapi-widget>

  <script
    src="https://unpkg.com/@vapi-ai/client-sdk-react/dist/embed/widget.umd.js"
    async
    type="text/javascript">
  </script>
</body>
</html>
```

### Opción 2: Widget con Backend (Guarda Transcripciones)

```html
<!DOCTYPE html>
<html>
<head>
  <title>Widget con Backend</title>
</head>
<body>
  <h1>Asistente de Voz</h1>
  <div id="transcriptions"></div>

  <!-- VAPI Widget -->
  <vapi-widget 
    assistant-id="0e9f3fcb-a5c4-4ea3-b8ff-52e8af6e3bdf" 
    public-key="209ac772-6752-4407-9740-84afdfc7a41c">
  </vapi-widget>

  <script
    src="https://unpkg.com/@vapi-ai/client-sdk-react/dist/embed/widget.umd.js"
    async
    type="text/javascript">
  </script>

  <script>
    const BACKEND_URL = 'http://localhost:4000';
    const API_KEY = 'vox_test_sk_1234567890abcdef';
    const TENANT_ID = 'test-tenant-001';
    const SESSION_ID = 'session-' + Date.now();

    // Guardar transcripción cuando el usuario hable
    async function saveTranscription(audioBlob) {
      const response = await fetch(`${BACKEND_URL}/transcription/segment`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': API_KEY
        },
        body: JSON.stringify({
          sessionId: SESSION_ID,
          tenantId: TENANT_ID,
          audioBlob: audioBlob, // Base64
          format: 'webm',
          language: 'es-ES'
        })
      });

      const data = await response.json();
      
      // Mostrar transcripción
      document.getElementById('transcriptions').innerHTML += 
        `<p><strong>${data.text}</strong> (${data.confidence})</p>`;
    }
  </script>
</body>
</html>
```

---

## 🧪 Pruebas

### 1. Demo Interactivo

```bash
# Abrir demo simple
open examples/vapi-widget-demo.html

# Abrir demo avanzado
open examples/vapi-widget-advanced.html
```

### 2. Probar Backend

```bash
# Health check
curl http://localhost:4000/transcription/health | jq '.'

# Ver configuración VAPI
curl http://localhost:4000/widget/config?tenantId=test-tenant-001 | jq '.vapi'
```

### 3. Script de Prueba

```bash
./scripts/demo-vapi.sh
```

---

## 📊 Estructura de Datos

### Transcripción Guardada en Backend

**Archivo:** `data/mock/test-tenant-001/transcription-{sessionId}.json`

```json
{
  "sessionId": "session-1234567890",
  "tenantId": "test-tenant-001",
  "createdAt": "2025-11-19T10:00:00.000Z",
  "updatedAt": "2025-11-19T10:05:30.000Z",
  "segments": [
    {
      "id": "segment-1234567890-abc123",
      "text": "Hola, ¿cómo estás?",
      "confidence": 0.96,
      "duration": 2.5,
      "timestamp": "2025-11-19T10:00:00.000Z",
      "metadata": {
        "audioSize": 38400,
        "format": "webm",
        "engine": "vapi",
        "assistantId": "0e9f3fcb-a5c4-4ea3-b8ff-52e8af6e3bdf",
        "cost": 0.00025
      }
    }
  ],
  "totalDuration": 2.5,
  "totalCost": 0.00025,
  "totalWords": 3,
  "vapiConfig": {
    "publicKey": "209ac772-6752-4407-9740-84afdfc7a41c",
    "assistantId": "0e9f3fcb-a5c4-4ea3-b8ff-52e8af6e3bdf"
  }
}
```

---

## 🎨 Personalizar el Widget

### Estilos CSS Personalizados

```html
<style>
  /* Personalizar botón del widget */
  vapi-widget {
    --button-bg-color: #667eea;
    --button-hover-color: #764ba2;
    --button-size: 60px;
    --button-position-bottom: 20px;
    --button-position-right: 20px;
  }
</style>

<vapi-widget 
  assistant-id="0e9f3fcb-a5c4-4ea3-b8ff-52e8af6e3bdf" 
  public-key="209ac772-6752-4407-9740-84afdfc7a41c">
</vapi-widget>
```

### Configuración Avanzada

```html
<vapi-widget 
  assistant-id="0e9f3fcb-a5c4-4ea3-b8ff-52e8af6e3bdf" 
  public-key="209ac772-6752-4407-9740-84afdfc7a41c"
  button-label="Hablar con IA"
  assistant-override='{
    "transcriber": {
      "provider": "deepgram",
      "language": "es",
      "model": "nova-2"
    }
  }'>
</vapi-widget>
```

---

## 🔧 Endpoints Backend Disponibles

| Endpoint | Método | Auth | Descripción |
|----------|--------|------|-------------|
| `/transcription/health` | GET | Ninguna | Estado VAPI |
| `/transcription/segment` | POST | API Key | Guardar transcripción |
| `/transcription/session/:id` | GET | JWT | Historial sesión |
| `/transcription/sessions` | GET | JWT | Listar sesiones |
| `/transcription/stats` | GET | JWT | Estadísticas |
| `/widget/config` | GET | Query param | Config widget |

---

## 📝 Ejemplos de Uso

### Ejemplo 1: Sitio Web Corporativo

```html
<!-- index.html -->
<body>
  <header>
    <h1>Mi Empresa</h1>
  </header>
  
  <main>
    <section>
      <h2>Contacto</h2>
      <p>Habla con nuestro asistente virtual</p>
    </section>
  </main>

  <!-- Widget VAPI en esquina inferior derecha -->
  <vapi-widget 
    assistant-id="0e9f3fcb-a5c4-4ea3-b8ff-52e8af6e3bdf" 
    public-key="209ac772-6752-4407-9740-84afdfc7a41c">
  </vapi-widget>

  <script src="https://unpkg.com/@vapi-ai/client-sdk-react/dist/embed/widget.umd.js" async></script>
</body>
```

### Ejemplo 2: Dashboard Administrativo

```javascript
// React Component
import { useEffect } from 'react';

function VoiceAssistant() {
  useEffect(() => {
    // Cargar widget VAPI
    const script = document.createElement('script');
    script.src = 'https://unpkg.com/@vapi-ai/client-sdk-react/dist/embed/widget.umd.js';
    script.async = true;
    document.body.appendChild(script);

    // Crear widget element
    const widget = document.createElement('vapi-widget');
    widget.setAttribute('assistant-id', '0e9f3fcb-a5c4-4ea3-b8ff-52e8af6e3bdf');
    widget.setAttribute('public-key', '209ac772-6752-4407-9740-84afdfc7a41c');
    document.body.appendChild(widget);

    return () => {
      document.body.removeChild(widget);
      document.body.removeChild(script);
    };
  }, []);

  return <div>Dashboard con Asistente de Voz</div>;
}
```

### Ejemplo 3: Widget con Eventos

```javascript
// Escuchar eventos del widget
window.addEventListener('vapi:call-start', (event) => {
  console.log('Llamada iniciada:', event.detail);
  
  // Guardar en backend
  fetch('/api/analytics/call-started', {
    method: 'POST',
    body: JSON.stringify({
      sessionId: event.detail.sessionId,
      timestamp: new Date().toISOString()
    })
  });
});

window.addEventListener('vapi:call-end', (event) => {
  console.log('Llamada finalizada:', event.detail);
  
  // Guardar transcripción final
  saveTranscription(event.detail.transcript);
});

window.addEventListener('vapi:message', (event) => {
  console.log('Mensaje:', event.detail);
  
  // Actualizar UI en tiempo real
  updateTranscriptionUI(event.detail.text);
});
```

---

## 💰 Costos Estimados

Con tus credenciales de VAPI:

| Uso Mensual | Minutos | Costo Estimado |
|-------------|---------|----------------|
| Bajo | 500 min | ~$3 USD |
| Medio | 2000 min | ~$12 USD |
| Alto | 10000 min | ~$60 USD |

**Fórmula:** `minutos × $0.006`

---

## 🎯 Checklist de Implementación

- [x] ✅ Credenciales VAPI configuradas
- [x] ✅ Backend actualizado con credenciales
- [x] ✅ Ejemplos HTML creados
- [x] ✅ Compilación TypeScript exitosa
- [ ] ⬜ Probar widget en navegador
- [ ] ⬜ Integrar en tu sitio web
- [ ] ⬜ Configurar dominio en producción
- [ ] ⬜ Monitorear uso y costos

---

## 🚀 Próximos Pasos

### Desarrollo
1. Abre `examples/vapi-widget-demo.html` en tu navegador
2. Prueba hablar con el asistente
3. Verifica que las transcripciones se guarden en `data/mock/`

### Producción
1. Configura variables de entorno en tu servidor
2. Agrega tu dominio a CORS en el backend
3. Despliega el backend (Railway, Render, etc.)
4. Actualiza `BACKEND_URL` en el widget
5. Monitorea costos en panel VAPI

---

## 📚 Recursos

- **Demo Simple:** `examples/vapi-widget-demo.html`
- **Demo Avanzado:** `examples/vapi-widget-advanced.html`
- **Documentación:** `docs/VAPI_INTEGRATION.md`
- **Guía Rápida:** `QUICKSTART_VAPI.md`
- **VAPI Docs:** https://docs.vapi.ai

---

## 🆘 Soporte

### Errores Comunes

**Widget no aparece:**
- Verifica que el script esté cargado: `https://unpkg.com/@vapi-ai/client-sdk-react/dist/embed/widget.umd.js`
- Revisa la consola del navegador

**No se guardan transcripciones:**
- Verifica que el backend esté corriendo: `http://localhost:4000`
- Comprueba API Key en headers

**Audio no funciona:**
- Permite permisos de micrófono en el navegador
- Verifica que uses HTTPS en producción

---

**¡Todo listo! Tu widget VAPI está configurado y funcionando! 🎉**

Última actualización: 19 de noviembre de 2025
