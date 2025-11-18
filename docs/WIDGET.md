# Widget Embebible VoxAgent

## 📋 Descripción

Sistema de widget embebible que permite a los clientes integrar VoxAgentAI en sus sitios web con configuración personalizada por tenant y seguridad mediante API Keys.

## 🔑 Autenticación

El widget utiliza **API Keys** para autenticación, separadas del sistema JWT del panel interno.

### API Keys Disponibles

| Tenant | API Key |
|--------|---------|
| `test-tenant-001` | `vox_test_sk_1234567890abcdef` |
| `tenant-456` | `vox_prod_sk_abcdef1234567890` |

**Nota**: En producción, las API keys se generan automáticamente y se almacenan de forma segura.

## 🎨 Endpoints

### 1. Obtener Configuración del Widget

**Endpoint público** - No requiere autenticación

```bash
GET /widget/config?tenantId={tenantId}
```

**Ejemplo:**
```bash
curl 'http://localhost:4000/widget/config?tenantId=test-tenant-001'
```

**Respuesta:**
```json
{
  "tenantId": "test-tenant-001",
  "theme": "light",
  "language": "es-ES",
  "voice": "female",
  "position": "bottom-right",
  "enabled": true,
  "brandName": "VoxAgent Demo",
  "brandLogo": "https://cdn.voxagent.ai/demo-logo.png",
  "primaryColor": "#4F46E5",
  "secondaryColor": "#818CF8",
  "welcomeMessage": "¡Hola! Soy tu asistente virtual. ¿En qué puedo ayudarte hoy?",
  "placeholderText": "Escribe tu pregunta aquí...",
  "buttonText": "Enviar",
  "maxQueriesPerDay": 100,
  "allowedDomains": [
    "http://localhost:3000",
    "https://example.com"
  ]
}
```

### 2. Procesar Consulta

**Requiere API Key** - Validación mediante header `X-API-Key` o body

```bash
POST /widget/query
```

**Headers:**
```
Content-Type: application/json
X-API-Key: vox_test_sk_1234567890abcdef
```

**Body:**
```json
{
  "tenantId": "test-tenant-001",
  "query": "¿Cuál es el horario de atención?",
  "mode": "text",
  "sessionId": "session-abc123",
  "agentId": "agent-001"
}
```

**Ejemplo:**
```bash
curl -X POST 'http://localhost:4000/widget/query' \
  -H 'Content-Type: application/json' \
  -H 'X-API-Key: vox_test_sk_1234567890abcdef' \
  -d '{
    "tenantId": "test-tenant-001",
    "query": "¿Cuál es el horario de atención?",
    "mode": "text"
  }'
```

**Respuesta:**
```json
{
  "response": "Nuestro horario de atención es de lunes a viernes de 9:00 a 18:00 horas.",
  "timestamp": "2025-11-18T12:00:00Z",
  "mode": "text",
  "metadata": {
    "tokens": 26,
    "cost": 0.00026,
    "duration": 1.5
  }
}
```

### 3. Actualizar Configuración (Admin)

**Requiere JWT** - Solo para administradores del tenant

```bash
PUT /widget/config
```

**Headers:**
```
Authorization: Bearer {jwt_token}
Content-Type: application/json
```

**Body:**
```json
{
  "tenantId": "test-tenant-001",
  "theme": "dark",
  "primaryColor": "#8B5CF6",
  "welcomeMessage": "¡Bienvenido! ¿Cómo puedo ayudarte?"
}
```

### 4. Historial de Interacciones (Admin)

**Requiere JWT** - Para análisis y estadísticas

```bash
GET /widget/interactions?tenantId={tenantId}&limit={limit}
```

**Ejemplo:**
```bash
curl 'http://localhost:4000/widget/interactions?tenantId=test-tenant-001&limit=50' \
  -H "Authorization: Bearer $TOKEN"
```

**Respuesta:**
```json
{
  "interactions": [
    {
      "id": "widget-int-123456",
      "tenantId": "test-tenant-001",
      "sessionId": "session-abc123",
      "query": "¿Cuál es el horario?",
      "response": "Nuestro horario es...",
      "mode": "text",
      "metadata": {
        "tokens": 26,
        "cost": 0.00026,
        "duration": 1.5,
        "userAgent": "Mozilla/5.0...",
        "ipAddress": "192.168.1.1"
      },
      "timestamp": "2025-11-18T12:00:00Z"
    }
  ],
  "total": 1
}
```

### 5. Estadísticas del Widget (Admin)

**Requiere JWT** - Resumen de uso

```bash
GET /widget/stats?tenantId={tenantId}
```

**Respuesta:**
```json
{
  "tenantId": "test-tenant-001",
  "total": 150,
  "today": 25,
  "thisMonth": 450,
  "totalCost": 0.15,
  "totalTokens": 15000,
  "byMode": {
    "text": 140,
    "voice": 10
  },
  "lastInteraction": "2025-11-18T12:00:00Z"
}
```

## 🔒 Seguridad

### 1. Validación de API Key

Cada consulta al widget debe incluir una API Key válida:

```javascript
fetch('http://localhost:4000/widget/query', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'X-API-Key': 'vox_test_sk_1234567890abcdef'
  },
  body: JSON.stringify({
    tenantId: 'test-tenant-001',
    query: '¿Horario de atención?'
  })
})
```

### 2. Rate Limiting

**Configuración por endpoint:**

| Endpoint | Límite | Ventana |
|----------|--------|---------|
| `/widget/config` | 30 requests | 1 minuto |
| `/widget/query` | 10 requests | 1 minuto por IP+tenant |

**Límite diario:** Configurable por tenant (default: 100 queries/día)

### 3. CORS

Los dominios permitidos se configuran en `widget-config-{tenantId}.json`:

```json
{
  "allowedDomains": [
    "https://midominio.com",
    "https://www.midominio.com"
  ]
}
```

### 4. Validación de Origen

El middleware `validateWidgetOrigin` verifica que las peticiones provengan de dominios autorizados.

## 📦 Almacenamiento de Datos

### Archivos JSON por Tenant

```
data/mock/
├── widget-config-{tenantId}.json         # Configuración del widget
├── widget-interactions-{tenantId}.json   # Historial de interacciones (últimas 1000)
└── voxagentai-{tenantId}.json           # También se guarda en historial VoxAgentAI
```

### Estructura de widget-config

```json
{
  "tenantId": "test-tenant-001",
  "theme": "light | dark | auto",
  "language": "es-ES | en-US | ...",
  "voice": "male | female | neutral",
  "position": "bottom-right | bottom-left | top-right | top-left",
  "enabled": true,
  "brandName": "Nombre de la marca",
  "brandLogo": "URL del logo",
  "primaryColor": "#4F46E5",
  "secondaryColor": "#818CF8",
  "welcomeMessage": "Mensaje de bienvenida",
  "placeholderText": "Placeholder del input",
  "buttonText": "Texto del botón",
  "maxQueriesPerDay": 100,
  "allowedDomains": ["https://domain.com"],
  "customCSS": "/* CSS personalizado */",
  "createdAt": "2025-11-18T12:00:00Z",
  "updatedAt": "2025-11-18T12:00:00Z"
}
```

### Estructura de widget-interactions

```json
[
  {
    "id": "widget-int-{timestamp}-{random}",
    "tenantId": "test-tenant-001",
    "agentId": "agent-001",
    "sessionId": "session-abc123",
    "query": "Pregunta del usuario",
    "response": "Respuesta del asistente",
    "mode": "text | voice",
    "metadata": {
      "tokens": 26,
      "cost": 0.00026,
      "duration": 1.5,
      "userAgent": "Mozilla/5.0...",
      "ipAddress": "192.168.1.1"
    },
    "timestamp": "2025-11-18T12:00:00Z"
  }
]
```

## 🎯 Integración Frontend

### Código HTML Básico

```html
<!DOCTYPE html>
<html>
<head>
  <title>Widget VoxAgent Demo</title>
</head>
<body>
  <div id="voxagent-widget"></div>
  
  <script>
    const TENANT_ID = 'test-tenant-001';
    const API_KEY = 'vox_test_sk_1234567890abcdef';
    const API_URL = 'http://localhost:4000';

    // Cargar configuración
    async function loadConfig() {
      const response = await fetch(
        `${API_URL}/widget/config?tenantId=${TENANT_ID}`
      );
      return response.json();
    }

    // Enviar consulta
    async function sendQuery(query) {
      const response = await fetch(`${API_URL}/widget/query`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': API_KEY
        },
        body: JSON.stringify({
          tenantId: TENANT_ID,
          query: query,
          mode: 'text',
          sessionId: getSessionId()
        })
      });
      return response.json();
    }

    // Generar session ID
    function getSessionId() {
      let sessionId = sessionStorage.getItem('voxagent-session');
      if (!sessionId) {
        sessionId = 'session-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
        sessionStorage.setItem('voxagent-session', sessionId);
      }
      return sessionId;
    }

    // Inicializar widget
    loadConfig().then(config => {
      console.log('Widget config:', config);
      // Renderizar widget con la configuración...
    });
  </script>
</body>
</html>
```

### React Example

```jsx
import { useState, useEffect } from 'react';

const TENANT_ID = 'test-tenant-001';
const API_KEY = 'vox_test_sk_1234567890abcdef';
const API_URL = 'http://localhost:4000';

function VoxAgentWidget() {
  const [config, setConfig] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Cargar configuración
    fetch(`${API_URL}/widget/config?tenantId=${TENANT_ID}`)
      .then(res => res.json())
      .then(data => setConfig(data));
  }, []);

  const sendMessage = async () => {
    if (!input.trim()) return;

    const userMessage = { role: 'user', text: input };
    setMessages([...messages, userMessage]);
    setInput('');
    setLoading(true);

    try {
      const response = await fetch(`${API_URL}/widget/query`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': API_KEY
        },
        body: JSON.stringify({
          tenantId: TENANT_ID,
          query: input,
          mode: 'text'
        })
      });

      const data = await response.json();
      const assistantMessage = { role: 'assistant', text: data.response };
      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!config) return <div>Cargando...</div>;

  return (
    <div style={{ 
      position: 'fixed',
      [config.position.split('-')[0]]: '20px',
      [config.position.split('-')[1]]: '20px',
      width: '350px',
      maxHeight: '500px',
      backgroundColor: config.theme === 'dark' ? '#1f2937' : '#ffffff',
      borderRadius: '12px',
      boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
      display: 'flex',
      flexDirection: 'column'
    }}>
      {/* Header */}
      <div style={{ 
        padding: '16px',
        borderBottom: '1px solid #e5e7eb',
        backgroundColor: config.primaryColor,
        color: 'white',
        borderRadius: '12px 12px 0 0'
      }}>
        <h3>{config.brandName || 'VoxAgent'}</h3>
      </div>

      {/* Messages */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '16px' }}>
        <p>{config.welcomeMessage}</p>
        {messages.map((msg, i) => (
          <div key={i} style={{
            marginBottom: '8px',
            padding: '8px',
            borderRadius: '8px',
            backgroundColor: msg.role === 'user' ? config.secondaryColor : '#f3f4f6',
            color: msg.role === 'user' ? 'white' : 'black'
          }}>
            {msg.text}
          </div>
        ))}
        {loading && <div>Escribiendo...</div>}
      </div>

      {/* Input */}
      <div style={{ padding: '16px', borderTop: '1px solid #e5e7eb' }}>
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
          placeholder={config.placeholderText}
          style={{ width: '100%', padding: '8px', borderRadius: '4px' }}
        />
        <button
          onClick={sendMessage}
          disabled={loading}
          style={{
            marginTop: '8px',
            width: '100%',
            padding: '8px',
            backgroundColor: config.primaryColor,
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          {config.buttonText}
        </button>
      </div>
    </div>
  );
}

export default VoxAgentWidget;
```

## 📊 Monitoreo y Análisis

### Ver Estadísticas

```bash
# Login como admin
TOKEN=$(curl -s -X POST http://localhost:4000/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"admin@example.com","password":"Admin123!"}' \
  | jq -r '.accessToken')

# Estadísticas del widget
curl "http://localhost:4000/widget/stats?tenantId=test-tenant-001" \
  -H "Authorization: Bearer $TOKEN" | jq .

# Últimas 10 interacciones
curl "http://localhost:4000/widget/interactions?tenantId=test-tenant-001&limit=10" \
  -H "Authorization: Bearer $TOKEN" | jq .
```

## 🧪 Testing

### Test de Configuración

```bash
curl 'http://localhost:4000/widget/config?tenantId=test-tenant-001' | jq .
```

### Test de Consulta con API Key Válida

```bash
curl -X POST 'http://localhost:4000/widget/query' \
  -H 'Content-Type: application/json' \
  -H 'X-API-Key: vox_test_sk_1234567890abcdef' \
  -d '{
    "tenantId": "test-tenant-001",
    "query": "Hola, ¿cómo estás?"
  }' | jq .
```

### Test de Seguridad (API Key Inválida)

```bash
curl -X POST 'http://localhost:4000/widget/query' \
  -H 'Content-Type: application/json' \
  -H 'X-API-Key: invalid_key' \
  -d '{
    "tenantId": "test-tenant-001",
    "query": "Test"
  }'
# Esperado: {"error":"Invalid API key"}
```

### Test de Rate Limiting

```bash
# Hacer 15 requests rápidos (límite es 10/min)
for i in {1..15}; do
  curl -X POST 'http://localhost:4000/widget/query' \
    -H 'Content-Type: application/json' \
    -H 'X-API-Key: vox_test_sk_1234567890abcdef' \
    -d '{"tenantId":"test-tenant-001","query":"Test '$i'"}' &
done
wait
# Esperado: Los últimos requests deben retornar 429 (Too Many Requests)
```

## 🚀 Producción

### Consideraciones

1. **API Keys**: Generar keys únicas y seguras para cada tenant
2. **HTTPS**: Usar siempre HTTPS en producción
3. **Dominios**: Configurar `allowedDomains` específicos por tenant
4. **Rate Limiting**: Ajustar límites según plan del tenant
5. **Logs**: Monitorear uso y detectar abusos
6. **Backup**: Mantener backups de configuraciones y datos

### Variables de Entorno

```env
# En .env
WIDGET_RATE_LIMIT_WINDOW=60000  # 1 minuto
WIDGET_RATE_LIMIT_MAX=10        # 10 requests/min
WIDGET_MAX_QUERIES_PER_DAY=100  # Por tenant
```

## 📝 Notas

- Las interacciones se almacenan en `widget-interactions-{tenantId}.json` (últimas 1000)
- También se guardan en `voxagentai-{tenantId}.json` para análisis completo
- El límite de consultas diarias se verifica por tenant
- Las respuestas son simuladas - en producción se conectarían a VoxAgentAI real
- CORS está configurado para permitir localhost en desarrollo
