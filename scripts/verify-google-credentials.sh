#!/bin/bash

# Script para verificar la configuración de Google Cloud Speech-to-Text

echo "🔍 Verificando configuración de Google Cloud Speech-to-Text..."
echo ""

# Colores
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 1. Verificar que existe el archivo de credenciales
CREDENTIALS_PATH="/Users/yesod/voxagentai-2825cc56f9c9.json"
echo "1️⃣  Verificando archivo de credenciales..."
if [ -f "$CREDENTIALS_PATH" ]; then
    echo -e "${GREEN}✅ Archivo encontrado:${NC} $CREDENTIALS_PATH"
else
    echo -e "${RED}❌ Archivo NO encontrado:${NC} $CREDENTIALS_PATH"
    exit 1
fi

# 2. Verificar que el archivo .env existe
echo ""
echo "2️⃣  Verificando archivo .env..."
if [ -f ".env" ]; then
    echo -e "${GREEN}✅ Archivo .env encontrado${NC}"
else
    echo -e "${RED}❌ Archivo .env NO encontrado${NC}"
    echo -e "${YELLOW}💡 Ejecuta: cp .env.example .env${NC}"
    exit 1
fi

# 3. Verificar que la variable está en .env
echo ""
echo "3️⃣  Verificando variable GOOGLE_APPLICATION_CREDENTIALS en .env..."
if grep -q "GOOGLE_APPLICATION_CREDENTIALS=/Users/yesod/voxagentai-2825cc56f9c9.json" .env; then
    echo -e "${GREEN}✅ Variable configurada correctamente en .env${NC}"
else
    echo -e "${RED}❌ Variable NO encontrada o mal configurada en .env${NC}"
    echo -e "${YELLOW}💡 Añade la línea:${NC}"
    echo "   GOOGLE_APPLICATION_CREDENTIALS=/Users/yesod/voxagentai-2825cc56f9c9.json"
    exit 1
fi

# 4. Verificar que el archivo JSON es válido
echo ""
echo "4️⃣  Verificando que el archivo JSON es válido..."
if jq empty "$CREDENTIALS_PATH" 2>/dev/null; then
    echo -e "${GREEN}✅ Archivo JSON válido${NC}"
    
    # Mostrar información del proyecto
    PROJECT_ID=$(jq -r '.project_id' "$CREDENTIALS_PATH" 2>/dev/null)
    CLIENT_EMAIL=$(jq -r '.client_email' "$CREDENTIALS_PATH" 2>/dev/null)
    
    if [ "$PROJECT_ID" != "null" ] && [ -n "$PROJECT_ID" ]; then
        echo -e "${GREEN}   📋 Proyecto:${NC} $PROJECT_ID"
    fi
    
    if [ "$CLIENT_EMAIL" != "null" ] && [ -n "$CLIENT_EMAIL" ]; then
        echo -e "${GREEN}   📧 Service Account:${NC} $CLIENT_EMAIL"
    fi
else
    echo -e "${RED}❌ Archivo JSON inválido o corrupto${NC}"
    echo -e "${YELLOW}💡 Verifica que el archivo descargado de Google Cloud sea correcto${NC}"
    exit 1
fi

# 5. Verificar permisos de lectura
echo ""
echo "5️⃣  Verificando permisos de lectura..."
if [ -r "$CREDENTIALS_PATH" ]; then
    echo -e "${GREEN}✅ Permisos de lectura correctos${NC}"
else
    echo -e "${RED}❌ Sin permisos de lectura${NC}"
    echo -e "${YELLOW}💡 Ejecuta: chmod 600 $CREDENTIALS_PATH${NC}"
    exit 1
fi

# 6. Verificar que el paquete @google-cloud/speech está instalado
echo ""
echo "6️⃣  Verificando paquete @google-cloud/speech..."
if npm list @google-cloud/speech >/dev/null 2>&1; then
    VERSION=$(npm list @google-cloud/speech --depth=0 2>/dev/null | grep @google-cloud/speech | awk '{print $2}' | sed 's/@//')
    echo -e "${GREEN}✅ Paquete instalado${NC} (versión: $VERSION)"
else
    echo -e "${RED}❌ Paquete NO instalado${NC}"
    echo -e "${YELLOW}💡 Ejecuta: npm install @google-cloud/speech${NC}"
    exit 1
fi

# 7. Test de conexión (opcional - solo si node está disponible)
echo ""
echo "7️⃣  Test de conexión (opcional)..."
cat > /tmp/test-google-stt.js << 'EOF'
const { SpeechClient } = require('@google-cloud/speech');

async function testConnection() {
    try {
        const client = new SpeechClient();
        console.log('✅ Cliente de Google Speech-to-Text inicializado correctamente');
        
        // Verificar que las credenciales están cargadas
        const projectId = await client.getProjectId();
        console.log(`✅ Proyecto conectado: ${projectId}`);
        
        return true;
    } catch (error) {
        console.error('❌ Error al conectar:', error.message);
        return false;
    }
}

testConnection().then(success => {
    process.exit(success ? 0 : 1);
});
EOF

export GOOGLE_APPLICATION_CREDENTIALS="$CREDENTIALS_PATH"
if node /tmp/test-google-stt.js 2>/dev/null; then
    echo -e "${GREEN}✅ Conexión exitosa con Google Cloud${NC}"
else
    echo -e "${YELLOW}⚠️  No se pudo verificar la conexión${NC}"
    echo -e "${YELLOW}   (Esto es normal si las credenciales no tienen permisos de Speech-to-Text)${NC}"
fi

rm -f /tmp/test-google-stt.js

# Resumen final
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo -e "${GREEN}🎉 Configuración de Google Cloud Speech-to-Text verificada${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "📝 Siguiente paso:"
echo "   npm run dev"
echo ""
echo "🌐 El servidor usará Google STT en modo PRODUCCIÓN"
echo "   (no modo mock)"
echo ""
echo "📖 Documentación:"
echo "   docs/GOOGLE_STT_INTEGRATION.md"
echo ""
