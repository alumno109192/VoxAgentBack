# 🎤 VoxAgent Backend - VAPI Integration

## ✅ Servidor con Demos VAPI Listos

Tu backend ya tiene todo configurado para usar VAPI con tus credenciales.

---

## 🚀 Uso Rápido (Ya tienes el servidor corriendo)

### Ver los Demos

```bash
./scripts/open-demos.sh
```

### URLs Disponibles

- **Índice de Demos:** http://localhost:4000/examples/
- **Demo Simple:** http://localhost:4000/examples/vapi-widget-demo.html
- **Demo Avanzado:** http://localhost:4000/examples/vapi-widget-advanced.html

---

## 🔑 Credenciales Configuradas

```
Public Key:     209ac772-6752-4407-9740-84afdfc7a41c
Assistant ID:   0e9f3fcb-a5c4-4ea3-b8ff-52e8af6e3bdf
Backend URL:    http://localhost:4000
```

---

## 📱 Widget para Tu Sitio Web

Copia y pega este código en cualquier página HTML:

```html
<!-- Widget VAPI -->
<vapi-widget 
  assistant-id="0e9f3fcb-a5c4-4ea3-b8ff-52e8af6e3bdf" 
  public-key="209ac772-6752-4407-9740-84afdfc7a41c">
</vapi-widget>

<script
  src="https://unpkg.com/@vapi-ai/client-sdk-react/dist/embed/widget.umd.js"
  async
  type="text/javascript">
</script>
```

---

## 🧪 Probar Backend

```bash
# Health check
curl http://localhost:4000/health

# Estado VAPI
curl http://localhost:4000/transcription/health

# Demo rápido
./scripts/demo-vapi.sh
```

---

## 📂 Estructura

```
examples/
  ├── index.html                    # Índice de demos
  ├── vapi-widget-demo.html         # Demo simple
  └── vapi-widget-advanced.html     # Demo avanzado

scripts/
  ├── open-demos.sh                 # Abrir demos
  ├── demo-vapi.sh                  # Prueba rápida
  └── start-with-demos.sh           # Iniciar servidor

docs/
  ├── VAPI_CONFIGURADO.md           # Guía completa
  ├── VAPI_INTEGRATION.md           # Documentación técnica
  └── TRANSCRIPTION.md              # API reference
```

---

## 📚 Documentación Completa

- [VAPI_CONFIGURADO.md](./VAPI_CONFIGURADO.md) - Guía de configuración
- [README_VAPI.md](./README_VAPI.md) - Resumen ejecutivo
- [QUICKSTART_VAPI.md](./QUICKSTART_VAPI.md) - Quick start

---

## 🎯 Endpoints API

| Endpoint | Método | Descripción |
|----------|--------|-------------|
| `/examples/` | GET | Índice de demos |
| `/transcription/segment` | POST | Guardar transcripción |
| `/transcription/health` | GET | Estado VAPI |
| `/health` | GET | Estado servidor |

---

## ✨ Características

- ✅ Widget VAPI embebible
- ✅ Credenciales preconfiguradas
- ✅ Demos interactivos incluidos
- ✅ Backend con almacenamiento JSON
- ✅ Transcripciones en tiempo real
- ✅ TypeScript compilado

---

**Para ver los demos: http://localhost:4000/examples/**

**Para abrir demos: `./scripts/open-demos.sh`**
