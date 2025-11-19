#!/bin/bash

# ========================================
# DEMO RÁPIDO - Integración VAPI
# ========================================

echo "╔═══════════════════════════════════════════════════════════════╗"
echo "║         DEMO: Integración VAPI - Transcripción de Audio      ║"
echo "╚═══════════════════════════════════════════════════════════════╝"
echo ""

# Configuración
BASE_URL="http://localhost:4000"
API_KEY="vox_test_sk_1234567890abcdef"

echo "🔍 1. Verificando servidor..."
if curl -s "${BASE_URL}/health" > /dev/null 2>&1; then
    echo "   ✅ Servidor corriendo"
else
    echo "   ❌ Servidor no disponible"
    echo "   → Ejecuta: npm run dev"
    exit 1
fi
echo ""

echo "🏥 2. Health Check VAPI..."
HEALTH=$(curl -s "${BASE_URL}/transcription/health")
echo "$HEALTH" | jq '{status, mode, configured}'
echo ""

echo "🎤 3. Transcribiendo audio de prueba..."
AUDIO="UklGRiQAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQAAAAA="
SESSION="demo-$(date +%s)"

RESULT=$(curl -s -X POST "${BASE_URL}/transcription/segment" \
  -H "Content-Type: application/json" \
  -H "X-API-Key: ${API_KEY}" \
  -d '{
    "sessionId": "'$SESSION'",
    "tenantId": "test-tenant-001",
    "audioBlob": "'$AUDIO'",
    "format": "wav",
    "language": "es-ES"
  }')

echo "$RESULT" | jq '.'
echo ""

TEXT=$(echo "$RESULT" | jq -r '.text')
CONFIDENCE=$(echo "$RESULT" | jq -r '.confidence')

echo "📝 Resultado:"
echo "   Texto: \"$TEXT\""
echo "   Confianza: $CONFIDENCE"
echo ""

echo "✅ Demo completado!"
echo ""
echo "📚 Más información:"
echo "   - docs/VAPI_RESUMEN.md"
echo "   - docs/VAPI_INTEGRATION.md"
echo "   - docs/TRANSCRIPTION.md"
echo ""
