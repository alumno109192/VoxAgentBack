# Voice Assistant API - Ejemplos CURL

Este archivo contiene ejemplos de uso de la API con curl.

## Variables de entorno

```bash
export API_URL="http://localhost:4000"
export TOKEN="your-jwt-token-here"
```

## 1. Health Check

```bash
curl -X GET "${API_URL}/health" \
  -H "Content-Type: application/json"
```

## 2. Autenticación

### Login

```bash
curl -X POST "${API_URL}/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@example.com",
    "password": "Admin123!"
  }'
```

Respuesta:
```json
{
  "accessToken": "eyJhbGc...",
  "refreshToken": "eyJhbGc...",
  "user": {
    "id": "...",
    "email": "admin@example.com",
    "name": "Admin User",
    "role": "admin"
  }
}
```

### Refresh Token

```bash
curl -X POST "${API_URL}/api/auth/refresh" \
  -H "Content-Type: application/json" \
  -d '{
    "refreshToken": "your-refresh-token"
  }'
```

### Logout

```bash
curl -X POST "${API_URL}/api/auth/logout" \
  -H "Authorization: Bearer ${TOKEN}"
```

## 3. Admin - Listar Llamadas

```bash
curl -X GET "${API_URL}/api/admin/calls?page=1&limit=20" \
  -H "Authorization: Bearer ${TOKEN}" \
  -H "Content-Type: application/json"
```

### Con filtros

```bash
curl -X GET "${API_URL}/api/admin/calls?status=completed&from=2024-11-01" \
  -H "Authorization: Bearer ${TOKEN}" \
  -H "Content-Type: application/json"
```

## 4. Admin - Detalle de Llamada

```bash
curl -X GET "${API_URL}/api/admin/calls/CALL_ID_HERE" \
  -H "Authorization: Bearer ${TOKEN}" \
  -H "Content-Type: application/json"
```

## 5. Admin - Actualizar Metadatos de Llamada

```bash
curl -X PATCH "${API_URL}/api/admin/calls/CALL_ID_HERE" \
  -H "Authorization: Bearer ${TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{
    "notes": "Patient follow-up completed",
    "tags": ["follow-up", "resolved"],
    "isConfidential": true
  }'
```

## 6. Admin - Buscar Transcripciones

```bash
curl -X GET "${API_URL}/api/admin/transcriptions?search=medication&page=1" \
  -H "Authorization: Bearer ${TOKEN}" \
  -H "Content-Type: application/json"
```

## 7. Admin - Métricas

```bash
curl -X GET "${API_URL}/api/admin/metrics" \
  -H "Authorization: Bearer ${TOKEN}" \
  -H "Content-Type: application/json"
```

## 8. Transcribir Audio (Multipart)

```bash
curl -X POST "${API_URL}/api/contact/transcribe" \
  -H "Authorization: Bearer ${TOKEN}" \
  -F "audio=@/path/to/audio.mp3" \
  -F "mode=async"
```

### Modo síncrono

```bash
curl -X POST "${API_URL}/api/contact/transcribe" \
  -H "Authorization: Bearer ${TOKEN}" \
  -F "audio=@/path/to/audio.mp3" \
  -F "mode=sync"
```

## 9. Webhooks - Simular Evento Bland

### Llamada Entrante

```bash
curl -X POST "${API_URL}/api/webhooks/bland/events" \
  -H "Content-Type: application/json" \
  -H "X-Bland-Signature: mock-signature-for-testing" \
  -d '{
    "event": "incoming_call",
    "data": {
      "call_id": "test-call-123",
      "from": "+1234567890",
      "to": "+0987654321",
      "metadata": {
        "tenant_id": "TENANT_ID_HERE",
        "patient_name": "John Doe"
      }
    }
  }'
```

### Llamada Conectada

```bash
curl -X POST "${API_URL}/api/webhooks/bland/events" \
  -H "Content-Type: application/json" \
  -H "X-Bland-Signature: mock-signature" \
  -d '{
    "event": "call_connected",
    "data": {
      "call_id": "test-call-123",
      "connected_at": "2024-11-12T10:00:00Z"
    }
  }'
```

### Transcripción Completada

```bash
curl -X POST "${API_URL}/api/webhooks/bland/events" \
  -H "Content-Type: application/json" \
  -H "X-Bland-Signature: mock-signature" \
  -d '{
    "event": "transcription_completed",
    "data": {
      "call_id": "test-call-123",
      "transcript": "This is the full transcription of the call.",
      "language": "en",
      "confidence": 0.95,
      "duration": 300,
      "chunks": [
        {
          "start": 0,
          "end": 5.2,
          "text": "Hello, how can I help you?",
          "speaker": "agent"
        },
        {
          "start": 5.2,
          "end": 10.5,
          "text": "I need to schedule an appointment.",
          "speaker": "caller"
        }
      ]
    }
  }'
```

### Llamada Desconectada

```bash
curl -X POST "${API_URL}/api/webhooks/bland/events" \
  -H "Content-Type: application/json" \
  -H "X-Bland-Signature: mock-signature" \
  -d '{
    "event": "call_disconnected",
    "data": {
      "call_id": "test-call-123",
      "disconnected_at": "2024-11-12T10:05:30Z",
      "recording_url": "https://recordings.bland.ai/test-call-123.mp3"
    }
  }'
```

### Error de Llamada

```bash
curl -X POST "${API_URL}/api/webhooks/bland/events" \
  -H "Content-Type: application/json" \
  -H "X-Bland-Signature: mock-signature" \
  -d '{
    "event": "error",
    "data": {
      "call_id": "test-call-123",
      "error_code": "CONNECTION_FAILED",
      "error_message": "Failed to establish connection with recipient"
    }
  }'
```

## 10. Admin - Crear Cargo de Facturación

```bash
curl -X POST "${API_URL}/api/admin/billing/charge" \
  -H "Authorization: Bearer ${TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{
    "callId": "CALL_ID_HERE",
    "amount": 0.055,
    "type": "call",
    "description": "Call charge for 5.5 minutes"
  }'
```

## 11. Pagos Emulados (Modo Test)

### Crear Sesión de Pago Emulada

```bash
curl -X POST "${API_URL}/api/billing/create-session" \
  -H "Authorization: Bearer ${TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{
    "tenantId": "TENANT_ID_HERE",
    "amount": 100,
    "currency": "USD",
    "description": "Test payment",
    "testMode": true
  }'
```

Respuesta:
```json
{
  "success": true,
  "testMode": true,
  "checkout_url_emulado": "voice-assistant://emulated-checkout/emu_session_abc123",
  "sessionIdEmu": "emu_session_abc123",
  "client_secret_emulado": "emu_secret_xyz789",
  "billingRecordId": "65f1a2b3c4d5e6f7g8h9i0j1"
}
```

### Simular Pago Exitoso (Webhook Emulado)

```bash
curl -X POST "${API_URL}/api/webhooks/stripe-emulator" \
  -H "Content-Type: application/json" \
  -H "X-Emulator-Key: dev-emulator-key-123" \
  -d '{
    "type": "payment_intent.succeeded",
    "data": {
      "object": {
        "id": "pi_emulated_123456",
        "amount": 10000,
        "currency": "usd",
        "description": "Pago emulado exitoso",
        "metadata": {
          "tenantId": "TENANT_ID_HERE",
          "sessionIdEmu": "emu_session_abc123"
        }
      }
    }
  }'
```

Respuesta:
```json
{
  "received": true,
  "status": "succeeded",
  "billingRecordId": "65f1a2b3c4d5e6f7g8h9i0j1"
}
```

### Simular Pago Fallido

```bash
curl -X POST "${API_URL}/api/webhooks/stripe-emulator" \
  -H "Content-Type: application/json" \
  -H "X-Emulator-Key: dev-emulator-key-123" \
  -d '{
    "type": "payment_intent.failed",
    "data": {
      "object": {
        "id": "pi_failed_789012",
        "amount": 5000,
        "currency": "usd",
        "description": "Pago fallido",
        "last_payment_error": {
          "message": "Insufficient funds"
        },
        "metadata": {
          "tenantId": "TENANT_ID_HERE"
        }
      }
    }
  }'
```

### Listar Pagos

```bash
curl -X GET "${API_URL}/api/billing/payments?tenantId=TENANT_ID_HERE&page=1&limit=20" \
  -H "Authorization: Bearer ${TOKEN}" \
  -H "Content-Type: application/json"
```

### Obtener Último Pago

```bash
curl -X GET "${API_URL}/api/billing/payments/latest" \
  -H "Authorization: Bearer ${TOKEN}" \
  -H "Content-Type: application/json"
```

### Test de Idempotencia (mismo providerPaymentId)

```bash
# Primera solicitud
curl -X POST "${API_URL}/api/webhooks/stripe-emulator" \
  -H "Content-Type: application/json" \
  -H "X-Emulator-Key: dev-emulator-key-123" \
  -d '{
    "type": "payment_intent.succeeded",
    "data": {
      "object": {
        "id": "pi_idempotent_test_001",
        "amount": 2500,
        "currency": "usd",
        "metadata": {
          "tenantId": "TENANT_ID_HERE"
        }
      }
    }
  }'

# Segunda solicitud (mismo id) - debe ser idempotente
curl -X POST "${API_URL}/api/webhooks/stripe-emulator" \
  -H "Content-Type: application/json" \
  -H "X-Emulator-Key: dev-emulator-key-123" \
  -d '{
    "type": "payment_intent.succeeded",
    "data": {
      "object": {
        "id": "pi_idempotent_test_001",
        "amount": 2500,
        "currency": "usd",
        "metadata": {
          "tenantId": "TENANT_ID_HERE"
        }
      }
    }
  }'
```

Respuesta de segunda solicitud:
```json
{
  "received": true,
  "message": "Event already processed (idempotent)"
}
```

### Test de Concurrencia (bash script)

```bash
#!/bin/bash

# Script para probar concurrencia con el mismo providerPaymentId
PROVIDER_ID="pi_concurrent_$(date +%s)"

for i in {1..10}; do
  curl -X POST "${API_URL}/api/webhooks/stripe-emulator" \
    -H "Content-Type: application/json" \
    -H "X-Emulator-Key: dev-emulator-key-123" \
    -d "{
      \"type\": \"payment_intent.succeeded\",
      \"data\": {
        \"object\": {
          \"id\": \"${PROVIDER_ID}\",
          \"amount\": 7500,
          \"currency\": \"usd\",
          \"metadata\": {
            \"tenantId\": \"TENANT_ID_HERE\"
          }
        }
      }
    }" &
done

wait
echo "Concurrent test completed"
```

### Crear Sesión de Pago Real (Stripe)

```bash
curl -X POST "${API_URL}/api/billing/create-session" \
  -H "Authorization: Bearer ${TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{
    "tenantId": "TENANT_ID_HERE",
    "amount": 100,
    "currency": "USD",
    "description": "Real Stripe payment",
    "testMode": false
  }'
```

Respuesta:
```json
{
  "success": true,
  "testMode": false,
  "checkout_url": "https://checkout.stripe.com/pay/cs_live_...",
  "sessionId": "cs_live_abc123...",
  "billingRecordId": "65f1a2b3c4d5e6f7g8h9i0j1"
}
```

## Testing con jq (formato JSON)

Para mejor visualización de respuestas:

```bash
curl -X GET "${API_URL}/api/admin/calls" \
  -H "Authorization: Bearer ${TOKEN}" \
  -H "Content-Type: application/json" \
  | jq '.'
```

## Guardar Token de Login

```bash
# Login y guardar token
export TOKEN=$(curl -s -X POST "${API_URL}/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@example.com",
    "password": "Admin123!"
  }' | jq -r '.accessToken')

echo "Token saved: ${TOKEN}"

# Usar token en siguientes requests
curl -X GET "${API_URL}/api/admin/calls" \
  -H "Authorization: Bearer ${TOKEN}"
```

## Testing Performance

### Test de carga simple

```bash
for i in {1..100}; do
  curl -s -X GET "${API_URL}/health" -w "\n" &
done
wait
```

## Notas

- En producción, reemplaza `X-Bland-Signature: mock-signature` con firmas HMAC válidas
- Para testing local con webhooks, usa ngrok: `ngrok http 4000`
- Todos los endpoints admin requieren autenticación JWT
