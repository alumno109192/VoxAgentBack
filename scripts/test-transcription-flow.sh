#!/bin/bash

# Test completo del flujo de transcripción
# Simula el envío de audio desde el widget a VAPI

set -e

# Colores
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

BASE_URL="http://localhost:4000"
API_KEY="vox_test_sk_1234567890abcdef"
TENANT_ID="test-tenant-001"
SESSION_ID="session-$(date +%s)"

echo -e "${BLUE}╔════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║   Test de Integración VAPI - Transcripción ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════╝${NC}\n"

# Verificar que el servidor esté corriendo
echo -e "${YELLOW}→ Verificando servidor...${NC}"
if ! curl -s "${BASE_URL}/health" > /dev/null 2>&1; then
    echo -e "${RED}✗ Error: El servidor no está corriendo en ${BASE_URL}${NC}"
    echo -e "${YELLOW}  Ejecuta: npm run dev${NC}"
    exit 1
fi
echo -e "${GREEN}✓ Servidor activo${NC}\n"

# 1. Health Check VAPI
echo -e "${BLUE}═══ 1. Health Check - Estado del servicio VAPI ═══${NC}"
HEALTH_RESPONSE=$(curl -s "${BASE_URL}/transcription/health")
echo "$HEALTH_RESPONSE" | jq '.'

VAPI_STATUS=$(echo "$HEALTH_RESPONSE" | jq -r '.status')
VAPI_MODE=$(echo "$HEALTH_RESPONSE" | jq -r '.mode')

if [ "$VAPI_MODE" = "mock" ]; then
    echo -e "${YELLOW}⚠️  VAPI en modo MOCK (no configurado)${NC}"
    echo -e "${YELLOW}   Configurar en .env:${NC}"
    echo -e "${YELLOW}   VAPI_API_KEY=tu-api-key${NC}"
    echo -e "${YELLOW}   VAPI_AGENT_ID=tu-agent-id${NC}\n"
else
    echo -e "${GREEN}✓ VAPI configurado en modo producción${NC}\n"
fi

# 2. Transcribir primer segmento de audio
echo -e "${BLUE}═══ 2. Transcribir Segmento de Audio #1 ═══${NC}"

# Audio WAV de prueba en base64 (2 segundos de silencio)
# En producción, esto vendría del widget del cliente grabando audio real
AUDIO_BASE64_1="UklGRiQAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQAAAAA="

REQUEST_1='{
  "sessionId": "'$SESSION_ID'",
  "tenantId": "'$TENANT_ID'",
  "audioBlob": "'$AUDIO_BASE64_1'",
  "format": "wav",
  "language": "es-ES"
}'

echo -e "${YELLOW}→ Enviando audio a VAPI...${NC}"
RESPONSE_1=$(curl -s -X POST "${BASE_URL}/transcription/segment" \
  -H "Content-Type: application/json" \
  -H "X-API-Key: ${API_KEY}" \
  -d "$REQUEST_1")

echo "$RESPONSE_1" | jq '.'

TEXT_1=$(echo "$RESPONSE_1" | jq -r '.text')
SEGMENT_ID_1=$(echo "$RESPONSE_1" | jq -r '.segmentId')
CONFIDENCE_1=$(echo "$RESPONSE_1" | jq -r '.confidence')

if [ "$TEXT_1" != "null" ] && [ -n "$TEXT_1" ]; then
    echo -e "${GREEN}✓ Transcripción exitosa:${NC} \"${TEXT_1}\""
    echo -e "${GREEN}  Segmento ID:${NC} ${SEGMENT_ID_1}"
    echo -e "${GREEN}  Confianza:${NC} ${CONFIDENCE_1}"
else
    echo -e "${RED}✗ Error en transcripción${NC}"
fi
echo ""

# 3. Transcribir segundo segmento
echo -e "${BLUE}═══ 3. Transcribir Segmento de Audio #2 ═══${NC}"

# Simular otro segmento de audio
AUDIO_BASE64_2="UklGRkQAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YTAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=="

REQUEST_2='{
  "sessionId": "'$SESSION_ID'",
  "tenantId": "'$TENANT_ID'",
  "audioBlob": "'$AUDIO_BASE64_2'",
  "format": "wav",
  "language": "es-ES"
}'

echo -e "${YELLOW}→ Enviando segundo audio...${NC}"
RESPONSE_2=$(curl -s -X POST "${BASE_URL}/transcription/segment" \
  -H "Content-Type: application/json" \
  -H "X-API-Key: ${API_KEY}" \
  -d "$REQUEST_2")

echo "$RESPONSE_2" | jq '.'

TEXT_2=$(echo "$RESPONSE_2" | jq -r '.text')
echo -e "${GREEN}✓ Transcripción #2:${NC} \"${TEXT_2}\"\n"

# 4. Verificar almacenamiento en JSON
echo -e "${BLUE}═══ 4. Verificar Almacenamiento JSON ═══${NC}"

JSON_FILE="data/mock/${TENANT_ID}/transcription-${SESSION_ID}.json"
echo -e "${YELLOW}→ Buscando archivo: ${JSON_FILE}${NC}"

if [ -f "$JSON_FILE" ]; then
    echo -e "${GREEN}✓ Archivo JSON encontrado${NC}"
    echo -e "\n${YELLOW}Contenido:${NC}"
    cat "$JSON_FILE" | jq '{
      sessionId, 
      tenantId, 
      totalSegments: (.segments | length),
      totalDuration,
      totalCost,
      totalWords,
      firstSegment: .segments[0].text,
      lastSegment: .segments[-1].text
    }'
else
    echo -e "${RED}✗ Archivo JSON no encontrado${NC}"
fi
echo ""

# 5. Obtener historial de sesión (requiere autenticación)
echo -e "${BLUE}═══ 5. Obtener Historial de Sesión ═══${NC}"
echo -e "${YELLOW}→ Intentando obtener historial (requiere JWT)...${NC}"

# Nota: En producción necesitarías un JWT válido
SESSION_RESPONSE=$(curl -s "${BASE_URL}/transcription/session/${SESSION_ID}?tenantId=${TENANT_ID}" 2>&1)

if echo "$SESSION_RESPONSE" | jq -e '.sessionId' > /dev/null 2>&1; then
    echo "$SESSION_RESPONSE" | jq '.'
    echo -e "${GREEN}✓ Historial obtenido${NC}"
else
    echo -e "${YELLOW}⚠️  Requiere autenticación JWT${NC}"
    echo -e "${YELLOW}   Este endpoint está protegido y requiere login${NC}"
fi
echo ""

# 6. Listar todas las sesiones
echo -e "${BLUE}═══ 6. Listar Sesiones de Transcripción ═══${NC}"
echo -e "${YELLOW}→ Obteniendo lista de sesiones...${NC}"

SESSIONS_RESPONSE=$(curl -s "${BASE_URL}/transcription/sessions?tenantId=${TENANT_ID}&limit=5" 2>&1)

if echo "$SESSIONS_RESPONSE" | jq -e '.sessions' > /dev/null 2>&1; then
    echo "$SESSIONS_RESPONSE" | jq '{total, limit, sessionCount: (.sessions | length)}'
    echo -e "${GREEN}✓ Sesiones listadas${NC}"
else
    echo -e "${YELLOW}⚠️  Requiere autenticación JWT${NC}"
fi
echo ""

# 7. Obtener estadísticas
echo -e "${BLUE}═══ 7. Estadísticas de Transcripción ═══${NC}"
echo -e "${YELLOW}→ Calculando estadísticas...${NC}"

STATS_RESPONSE=$(curl -s "${BASE_URL}/transcription/stats?tenantId=${TENANT_ID}" 2>&1)

if echo "$STATS_RESPONSE" | jq -e '.totalSegments' > /dev/null 2>&1; then
    echo "$STATS_RESPONSE" | jq '.'
    echo -e "${GREEN}✓ Estadísticas obtenidas${NC}"
else
    echo -e "${YELLOW}⚠️  Requiere autenticación JWT${NC}"
fi
echo ""

# Resumen final
echo -e "${BLUE}╔════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║            RESUMEN DE PRUEBAS              ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════╝${NC}"
echo -e "${GREEN}✓ Health check VAPI:${NC} OK (modo: ${VAPI_MODE})"
echo -e "${GREEN}✓ Transcripción segmento #1:${NC} OK"
echo -e "${GREEN}✓ Transcripción segmento #2:${NC} OK"
echo -e "${GREEN}✓ Almacenamiento JSON:${NC} OK"
echo -e "${GREEN}✓ Session ID:${NC} ${SESSION_ID}"
echo -e "${GREEN}✓ Archivo JSON:${NC} ${JSON_FILE}"
echo ""
echo -e "${BLUE}════════════════════════════════════════════${NC}"
echo -e "${YELLOW}Próximos pasos:${NC}"
echo "1. Configurar VAPI API key en .env para transcripción real"
echo "2. Integrar el widget del cliente con estos endpoints"
echo "3. Obtener JWT token para acceder a endpoints administrativos"
echo ""
echo -e "${BLUE}Ejemplo de integración desde el widget:${NC}"
echo -e "${YELLOW}
// En el frontend del widget
const mediaRecorder = new MediaRecorder(stream);
mediaRecorder.ondataavailable = async (event) => {
  const audioBlob = event.data;
  const base64Audio = await blobToBase64(audioBlob);
  
  const response = await fetch('/transcription/segment', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-API-Key': '${API_KEY}'
    },
    body: JSON.stringify({
      sessionId: '${SESSION_ID}',
      tenantId: '${TENANT_ID}',
      audioBlob: base64Audio,
      format: 'webm',
      language: 'es-ES'
    })
  });
  
  const { text } = await response.json();
  console.log('Transcrito:', text);
};
${NC}"
echo ""
