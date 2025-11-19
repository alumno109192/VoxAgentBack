#!/bin/bash

echo "╔═══════════════════════════════════════════════════════════════╗"
echo "║          VAPI Widget - Demos Interactivos                     ║"
echo "╚═══════════════════════════════════════════════════════════════╝"
echo ""
echo "Credenciales VAPI configuradas:"
echo "  Public Key:    209ac772-6752-4407-9740-84afdfc7a41c"
echo "  Assistant ID:  0e9f3fcb-a5c4-4ea3-b8ff-52e8af6e3bdf"
echo ""
echo "Selecciona qué demo abrir:"
echo ""
echo "  1) Demo Simple      - Widget básico embebible"
echo "  2) Demo Avanzado    - Con eventos y transcripciones"
echo "  3) Ambos demos      - Abrir ambos en tabs separados"
echo "  4) Ver documentación"
echo ""
read -p "Opción (1-4): " option

case $option in
  1)
    echo ""
    echo "🚀 Abriendo demo simple..."
    open examples/vapi-widget-demo.html
    echo "✅ Demo abierto en tu navegador"
    ;;
  2)
    echo ""
    echo "🚀 Abriendo demo avanzado..."
    open examples/vapi-widget-advanced.html
    echo "✅ Demo abierto en tu navegador"
    ;;
  3)
    echo ""
    echo "🚀 Abriendo ambos demos..."
    open examples/vapi-widget-demo.html
    sleep 1
    open examples/vapi-widget-advanced.html
    echo "✅ Demos abiertos en tu navegador"
    ;;
  4)
    echo ""
    echo "📚 Abriendo documentación..."
    open VAPI_CONFIGURADO.md
    echo "✅ Documentación abierta"
    ;;
  *)
    echo ""
    echo "❌ Opción inválida"
    exit 1
    ;;
esac

echo ""
echo "📝 Notas:"
echo "  - El widget aparece como botón en esquina inferior derecha"
echo "  - Permite acceso al micrófono cuando lo solicite"
echo "  - Las transcripciones se guardan en: data/mock/"
echo ""
echo "🔗 Backend URL: http://localhost:4000"
echo "🔍 Health Check: curl http://localhost:4000/transcription/health"
echo ""
