#!/bin/bash

echo "╔═══════════════════════════════════════════════════════════════╗"
echo "║          VoxAgent Backend - Servidor con Demos VAPI          ║"
echo "╚═══════════════════════════════════════════════════════════════╝"
echo ""

# Verificar que las dependencias estén instaladas
if [ ! -d "node_modules" ]; then
    echo "📦 Instalando dependencias..."
    npm install
    echo ""
fi

# Compilar TypeScript
echo "🔨 Compilando TypeScript..."
npm run build
if [ $? -ne 0 ]; then
    echo ""
    echo "❌ Error en compilación"
    exit 1
fi
echo "✅ Compilación exitosa"
echo ""

# Verificar archivo .env
if [ ! -f ".env" ]; then
    echo "⚠️  No se encontró archivo .env"
    echo "📝 Creando .env desde .env.example..."
    cp .env.example .env
    echo "✅ Archivo .env creado"
    echo ""
    echo "⚙️  Edita el archivo .env si necesitas cambiar configuraciones"
    echo ""
fi

# Mostrar información
echo "🎯 Configuración:"
echo "   Port:         4000"
echo "   Environment:  development"
echo "   Public Key:   a8e14149-23ab-405d-afb9-b0889aa1f58c"
echo "   Assistant ID: 901c39a3-a56f-4554-8d75-fb41d0c83e11"
echo ""

echo "🌐 URLs disponibles:"
echo "   Demos VAPI:     http://localhost:4000/examples/"
echo "   Demo Simple:    http://localhost:4000/examples/vapi-widget-demo.html"
echo "   Demo Avanzado:  http://localhost:4000/examples/vapi-widget-advanced.html"
echo "   Health Check:   http://localhost:4000/health"
echo "   VAPI Status:    http://localhost:4000/transcription/health"
echo ""

echo "🚀 Iniciando servidor..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Función para abrir navegador después de 2 segundos
open_browser() {
    sleep 2
    if command -v open &> /dev/null; then
        open "http://localhost:4000/examples/" &
    fi
}

# Iniciar función en background
open_browser &

# Iniciar servidor
npm run dev
