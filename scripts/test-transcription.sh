#!/bin/bash

# Script de prueba para endpoints de transcripción
# Asegúrate de tener el servidor corriendo: npm run dev

set -e

# Colores para output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Configuración
BASE_URL="http://localhost:4000"
API_KEY="test-api-key-12345"
TENANT_ID="tenant-001"
SESSION_ID="session-$(date +%s)"

# JWT Token (generado con credenciales de prueba)
# Usuario: admin@tenant-001.com / Password: SecurePass123!
JWT_TOKEN=""

echo -e "${BLUE}=== Pruebas de Sistema de Transcripción ===${NC}\n"

# Función para hacer requests
make_request() {
    local method=$1
    local endpoint=$2
    local data=$3
    local auth_type=$4
    
    echo -e "${GREEN}➜ $method $endpoint${NC}"
    
    if [ "$auth_type" == "apikey" ]; then
        if [ -z "$data" ]; then
            curl -s -X "$method" \
                -H "X-API-Key: $API_KEY" \
                -H "Content-Type: application/json" \
                "$BASE_URL$endpoint" | jq '.'
        else
            curl -s -X "$method" \
                -H "X-API-Key: $API_KEY" \
                -H "Content-Type: application/json" \
                -d "$data" \
                "$BASE_URL$endpoint" | jq '.'
        fi
    elif [ "$auth_type" == "jwt" ]; then
        if [ -z "$JWT_TOKEN" ]; then
            echo -e "${RED}⚠️  No JWT token disponible. Saltando esta prueba.${NC}"
            return
        fi
        curl -s -X "$method" \
            -H "Authorization: Bearer $JWT_TOKEN" \
            -H "Content-Type: application/json" \
            "$BASE_URL$endpoint" | jq '.'
    else
        # Sin autenticación (health check)
        curl -s -X "$method" \
            -H "Content-Type: application/json" \
            "$BASE_URL$endpoint" | jq '.'
    fi
    
    echo -e "\n"
}

echo -e "${BLUE}1. Health Check - Verificar estado del servicio VAPI${NC}\n"
make_request "GET" "/transcription/health" "" "none"

echo -e "${BLUE}2. Transcribir Audio - Enviar segmento de audio (Mock)${NC}\n"

# Audio de ejemplo en base64 (simulado - en producción sería audio real)
AUDIO_BASE64="UklGRiQAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQAAAAA="

TRANSCRIPTION_DATA='{
  "sessionId": "'$SESSION_ID'",
  "tenantId": "'$TENANT_ID'",
  "audioBlob": "'$AUDIO_BASE64'",
  "format": "webm",
  "language": "es-ES"
}'

make_request "POST" "/transcription/segment" "$TRANSCRIPTION_DATA" "apikey"

echo -e "${BLUE}3. Obtener Historial de Sesión (Requiere JWT)${NC}\n"
make_request "GET" "/transcription/session/$SESSION_ID?tenantId=$TENANT_ID" "" "jwt"

echo -e "${BLUE}4. Listar Todas las Sesiones (Requiere JWT)${NC}\n"
make_request "GET" "/transcription/sessions?tenantId=$TENANT_ID&limit=10" "" "jwt"

echo -e "${BLUE}5. Obtener Estadísticas de Transcripción (Requiere JWT)${NC}\n"
make_request "GET" "/transcription/stats?tenantId=$TENANT_ID" "" "jwt"

echo -e "${BLUE}6. Probar con sesión de ejemplo existente${NC}\n"
make_request "GET" "/transcription/session/session-test?tenantId=$TENANT_ID" "" "jwt"

echo -e "${GREEN}=== Pruebas completadas ===${NC}\n"

echo -e "${BLUE}Notas:${NC}"
echo "- Las pruebas con JWT requieren autenticación (token no incluido)"
echo "- El endpoint de transcripción usa mock cuando VAPI no está configurado"
echo "- Los archivos JSON se guardan en: data/mock/$TENANT_ID/"
echo "- Costo estimado: ~\$0.006 por minuto de audio"
echo ""
echo -e "${BLUE}Para pruebas completas con JWT:${NC}"
echo "1. Iniciar sesión: POST /auth/login"
echo "2. Usar el token retornado en las pruebas"
echo ""
