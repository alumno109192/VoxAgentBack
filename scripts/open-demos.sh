#!/bin/bash

echo "╔═══════════════════════════════════════════════════════════════╗"
echo "║              Acceso Rápido - Demos VAPI                      ║"
echo "╚═══════════════════════════════════════════════════════════════╝"
echo ""

# Verificar si el servidor está corriendo
if ! curl -s http://localhost:4000/health > /dev/null 2>&1; then
    echo "⚠️  Servidor no está corriendo en puerto 4000"
    echo ""
    echo "Para iniciar el servidor:"
    echo "  npm run dev"
    echo ""
    exit 1
fi

echo "✅ Servidor activo en http://localhost:4000"
echo ""
echo "Selecciona qué abrir:"
echo ""
echo "  1) Índice de Demos    - Vista principal"
echo "  2) Demo Simple        - Widget básico"
echo "  3) Demo Avanzado      - Con eventos y transcripciones"
echo "  4) Health Check       - Estado del servidor"
echo "  5) VAPI Status        - Estado del servicio VAPI"
echo ""
read -p "Opción (1-5): " option

case $option in
  1)
    echo ""
    echo "🚀 Abriendo índice de demos..."
    open "http://localhost:4000/examples/"
    ;;
  2)
    echo ""
    echo "🚀 Abriendo demo simple..."
    open "http://localhost:4000/examples/vapi-widget-demo.html"
    ;;
  3)
    echo ""
    echo "🚀 Abriendo demo avanzado..."
    open "http://localhost:4000/examples/vapi-widget-advanced.html"
    ;;
  4)
    echo ""
    echo "🏥 Health Check:"
    curl -s http://localhost:4000/health | jq '.'
    ;;
  5)
    echo ""
    echo "🎤 VAPI Status:"
    curl -s http://localhost:4000/transcription/health | jq '.'
    ;;
  *)
    echo ""
    echo "❌ Opción inválida"
    exit 1
    ;;
esac

echo ""
echo "📝 URLs disponibles:"
echo "   http://localhost:4000/examples/"
echo "   http://localhost:4000/examples/vapi-widget-demo.html"
echo "   http://localhost:4000/examples/vapi-widget-advanced.html"
echo ""
