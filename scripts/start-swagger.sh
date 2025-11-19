#!/bin/bash

# 🚀 Script de Inicio Rápido - Documentación Swagger
# Este script inicia el servidor y abre Swagger UI automáticamente

echo "================================================"
echo "🚀 Iniciando VoiceTotem Studio Backend"
echo "📘 Documentación OpenAPI/Swagger"
echo "================================================"
echo ""

# Colores
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Puerto del servidor
PORT=4000

# Verificar si el servidor ya está corriendo
if lsof -Pi :$PORT -sTCP:LISTEN -t >/dev/null 2>&1 ; then
    echo -e "${YELLOW}⚠️  El servidor ya está corriendo en el puerto $PORT${NC}"
    echo ""
    echo -e "${GREEN}✅ Abriendo Swagger UI...${NC}"
    sleep 1
    open "http://localhost:$PORT/docs"
    echo ""
    echo "📘 URLs disponibles:"
    echo "   • Swagger UI:      http://localhost:$PORT/docs"
    echo "   • Health Check:    http://localhost:$PORT/health"
    echo "   • Widget Demos:    http://localhost:$PORT/examples/"
    echo "   • API Base:        http://localhost:$PORT"
    exit 0
fi

echo -e "${BLUE}📦 Verificando dependencias...${NC}"
if [ ! -d "node_modules" ]; then
    echo "   Installing dependencies..."
    npm install
fi

echo ""
echo -e "${BLUE}🔧 Compilando TypeScript...${NC}"
npm run build

echo ""
echo -e "${GREEN}✨ Iniciando servidor...${NC}"
echo ""

# Iniciar servidor en background
npm run dev &
SERVER_PID=$!

# Esperar a que el servidor esté listo
echo "⏳ Esperando a que el servidor esté listo..."
sleep 4

# Verificar que el servidor está corriendo
if lsof -Pi :$PORT -sTCP:LISTEN -t >/dev/null 2>&1 ; then
    echo ""
    echo -e "${GREEN}✅ ¡Servidor iniciado exitosamente!${NC}"
    echo ""
    echo "================================================"
    echo "📘 DOCUMENTACIÓN SWAGGER UI"
    echo "================================================"
    echo ""
    echo "🌐 Abriendo navegador en:"
    echo "   http://localhost:$PORT/docs"
    echo ""
    echo "📋 Otros endpoints útiles:"
    echo "   • Health Check:    http://localhost:$PORT/health"
    echo "   • Widget Config:   http://localhost:$PORT/widget/config"
    echo "   • Widget Demos:    http://localhost:$PORT/examples/"
    echo ""
    echo "🔐 Para probar endpoints autenticados:"
    echo "   1. Expandir POST /auth/login"
    echo "   2. Click 'Try it out'"
    echo "   3. Usar credenciales de prueba"
    echo "   4. Copiar el token de la respuesta"
    echo "   5. Click en 'Authorize' 🔓"
    echo "   6. Pegar el token y autorizar"
    echo ""
    echo "📚 Documentación adicional:"
    echo "   • API Endpoints:   docs/API_ENDPOINTS.md"
    echo "   • OpenAPI Guide:   docs/OPENAPI_GUIDE.md"
    echo "   • Architecture:    docs/ARCHITECTURE.md"
    echo ""
    echo "================================================"
    echo ""
    
    # Abrir Swagger UI en el navegador
    sleep 1
    open "http://localhost:$PORT/docs"
    
    echo -e "${YELLOW}💡 Tip: El servidor está corriendo en modo desarrollo${NC}"
    echo -e "${YELLOW}   Usa Ctrl+C para detenerlo${NC}"
    echo ""
    
    # Esperar a que el usuario presione Ctrl+C
    wait $SERVER_PID
else
    echo ""
    echo -e "${RED}❌ Error: El servidor no pudo iniciarse${NC}"
    echo "   Verifica los logs para más detalles"
    exit 1
fi
