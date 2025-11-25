#!/bin/bash

# Script de verificación de configuración VAPI

echo "🔍 Verificando configuración de VAPI..."
echo ""

# Colores
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 1. Verificar que .env existe
if [ ! -f ".env" ]; then
    echo -e "${RED}❌ Archivo .env no encontrado${NC}"
    echo -e "${YELLOW}💡 Crea uno desde: cp .env.example .env${NC}"
    exit 1
fi

# 2. Verificar VAPI_API_URL
if grep -q "VAPI_API_URL=https://api.vapi.ai" .env; then
    echo -e "${GREEN}✅ VAPI_API_URL configurada${NC}"
else
    echo -e "${RED}❌ VAPI_API_URL no configurada${NC}"
    exit 1
fi

# 3. Verificar VAPI_PUBLIC_KEY
if grep -q "VAPI_PUBLIC_KEY=209ac772-6752-4407-9740-84afdfc7a41c" .env; then
    echo -e "${GREEN}✅ VAPI_PUBLIC_KEY configurada${NC}"
else
    echo -e "${RED}❌ VAPI_PUBLIC_KEY no configurada${NC}"
    exit 1
fi

# 4. Verificar VAPI_ASSISTANT_ID
if grep -q "VAPI_ASSISTANT_ID=0e9f3fcb-a5c4-4ea3-b8ff-52e8af6e3bdf" .env; then
    echo -e "${GREEN}✅ VAPI_ASSISTANT_ID configurada${NC}"
else
    echo -e "${RED}❌ VAPI_ASSISTANT_ID no configurada${NC}"
    exit 1
fi

# 5. Verificar VAPI_API_KEY (privada)
if grep -q "VAPI_API_KEY=866040f5-1fdc-40f0-92fd-f8c6077573a1" .env; then
    echo -e "${GREEN}✅ VAPI_API_KEY configurada (modo PRODUCCIÓN)${NC}"
    MODE="PRODUCTION"
elif grep -q "VAPI_API_KEY=mock" .env; then
    echo -e "${YELLOW}⚠️  VAPI_API_KEY en modo MOCK${NC}"
    MODE="MOCK"
elif grep -q "VAPI_API_KEY=" .env; then
    echo -e "${YELLOW}⚠️  VAPI_API_KEY configurada pero con valor diferente${NC}"
    MODE="CUSTOM"
else
    echo -e "${YELLOW}⚠️  VAPI_API_KEY no configurada (usará modo MOCK)${NC}"
    MODE="MOCK"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo -e "${GREEN}🎉 Configuración VAPI verificada${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "📋 Resumen:"
echo "   🌐 API URL: https://api.vapi.ai"
echo "   🔑 Public Key: 209ac772-6752-4407-9740-84afdfc7a41c"
echo "   🤖 Assistant ID: 0e9f3fcb-a5c4-4ea3-b8ff-52e8af6e3bdf"
echo "   🔐 API Key: ✅ Configurada"
echo "   🚀 Modo: $MODE"
echo ""
echo "📝 Siguiente paso:"
echo "   npm run dev"
echo ""

if [ "$MODE" = "PRODUCTION" ]; then
    echo "✨ El sistema usará transcripciones REALES de VAPI"
    echo "   Costo: ~\$0.006 USD por minuto de audio"
else
    echo "⚠️  El sistema usará transcripciones SIMULADAS (mock)"
    echo "   Para producción, configura VAPI_API_KEY con la clave real"
fi

echo ""
