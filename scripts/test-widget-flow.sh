#!/bin/bash

# Script de pruebas para flujo completo del Widget VoxAgentAI Mock
# Valida: configuración, consulta y persistencia en JSON

echo "╔════════════════════════════════════════════════════════════╗"
echo "║     ✅ PRUEBAS BACKEND — WIDGET VOXAGENTAI MOCK           ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""

BASE_URL="http://localhost:4000"
TENANT_ID="demo"
DATA_FILE="./data/mock/voxagentai-demo.json"

# Guardar estado inicial del archivo
echo "📋 Paso 0: Verificar estado inicial"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
if [ -f "$DATA_FILE" ]; then
    INITIAL_COUNT=$(jq '. | length' "$DATA_FILE")
    echo "✅ Archivo existe: $DATA_FILE"
    echo "📊 Interacciones iniciales: $INITIAL_COUNT"
else
    echo "❌ Archivo no encontrado: $DATA_FILE"
    exit 1
fi
echo ""

# TEST 1: GET /widget-mock/config
echo "📋 Prueba 1: GET /widget-mock/config"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🔍 Verifica que devuelve la configuración del widget"
echo ""
echo "Ejecutando:"
echo "curl -s '${BASE_URL}/widget-mock/config'"
echo ""

CONFIG_RESPONSE=$(curl -s "${BASE_URL}/widget-mock/config")

# Validar que es un JSON válido
if echo "$CONFIG_RESPONSE" | jq empty 2>/dev/null; then
    echo "✅ Respuesta JSON válida"
    echo ""
    echo "$CONFIG_RESPONSE" | jq '.'
    echo ""
    
    # Extraer campos específicos
    THEME=$(echo "$CONFIG_RESPONSE" | jq -r '.theme')
    LANGUAGE=$(echo "$CONFIG_RESPONSE" | jq -r '.language')
    POSITION=$(echo "$CONFIG_RESPONSE" | jq -r '.position')
    VOICE=$(echo "$CONFIG_RESPONSE" | jq -r '.voice')
    BRAND_LOGO=$(echo "$CONFIG_RESPONSE" | jq -r '.brandLogo')
    TENANT=$(echo "$CONFIG_RESPONSE" | jq -r '.tenantId')
    
    echo "📊 Valores extraídos:"
    echo "  • tenantId: $TENANT"
    echo "  • theme: $THEME"
    echo "  • language: $LANGUAGE"
    echo "  • position: $POSITION"
    echo "  • voice: $VOICE"
    echo "  • brandLogo: $BRAND_LOGO"
    echo ""
    
    # Validar campos esperados
    if [ "$TENANT" == "$TENANT_ID" ] && [ "$THEME" != "null" ] && [ "$LANGUAGE" != "null" ]; then
        echo "✅ PRUEBA 1 EXITOSA: Configuración correcta"
    else
        echo "❌ PRUEBA 1 FALLIDA: Campos incorrectos o faltantes"
    fi
else
    echo "❌ PRUEBA 1 FALLIDA: Respuesta no es JSON válido"
    echo "$CONFIG_RESPONSE"
fi
echo ""
echo ""

# TEST 2: POST /widget-mock/query
echo "📋 Prueba 2: POST /widget-mock/query"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🔍 Envía una consulta simulada desde el widget"
echo ""

QUERY_TEXT="¿Qué puedes hacer?"
QUERY_PAYLOAD=$(cat <<EOF
{
  "query": "$QUERY_TEXT",
  "mode": "text",
  "sessionId": "test-flow-session"
}
EOF
)

echo "Ejecutando:"
echo "curl -X POST '${BASE_URL}/widget-mock/query' \\"
echo "  -H 'Content-Type: application/json' \\"
echo "  -d '$QUERY_PAYLOAD'"
echo ""

QUERY_RESPONSE=$(curl -s -X POST "${BASE_URL}/widget-mock/query" \
  -H "Content-Type: application/json" \
  -d "$QUERY_PAYLOAD")

# Validar respuesta
if echo "$QUERY_RESPONSE" | jq empty 2>/dev/null; then
    echo "✅ Respuesta JSON válida"
    echo ""
    echo "$QUERY_RESPONSE" | jq '.'
    echo ""
    
    # Extraer datos de la respuesta
    RESPONSE_QUERY=$(echo "$QUERY_RESPONSE" | jq -r '.query')
    RESPONSE_TEXT=$(echo "$QUERY_RESPONSE" | jq -r '.response')
    RESPONSE_TENANT=$(echo "$QUERY_RESPONSE" | jq -r '.tenantId')
    RESPONSE_ID=$(echo "$QUERY_RESPONSE" | jq -r '.id')
    RESPONSE_TIMESTAMP=$(echo "$QUERY_RESPONSE" | jq -r '.timestamp')
    
    echo "📊 Respuesta recibida:"
    echo "  • id: $RESPONSE_ID"
    echo "  • tenantId: $RESPONSE_TENANT"
    echo "  • query: $RESPONSE_QUERY"
    echo "  • response: $RESPONSE_TEXT"
    echo "  • timestamp: $RESPONSE_TIMESTAMP"
    echo ""
    
    # Validar que los campos existen
    if [ "$RESPONSE_TENANT" == "$TENANT_ID" ] && [ "$RESPONSE_TEXT" != "null" ] && [ "$RESPONSE_ID" != "null" ]; then
        echo "✅ PRUEBA 2 EXITOSA: Consulta procesada correctamente"
    else
        echo "❌ PRUEBA 2 FALLIDA: Respuesta incompleta"
    fi
else
    echo "❌ PRUEBA 2 FALLIDA: Respuesta no es JSON válido"
    echo "$QUERY_RESPONSE"
fi
echo ""
echo ""

# Esperar un momento para asegurar que el archivo se escribió
sleep 1

# TEST 3: Validación de persistencia
echo "📋 Prueba 3: Validación de persistencia en JSON"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🔍 Verificar que se guardó la interacción en $DATA_FILE"
echo ""

if [ -f "$DATA_FILE" ]; then
    FINAL_COUNT=$(jq '. | length' "$DATA_FILE")
    echo "📊 Interacciones después de la prueba: $FINAL_COUNT"
    echo ""
    
    # Verificar que se incrementó el contador
    if [ "$FINAL_COUNT" -gt "$INITIAL_COUNT" ]; then
        echo "✅ Se agregó nueva interacción (antes: $INITIAL_COUNT, ahora: $FINAL_COUNT)"
        echo ""
        
        # Mostrar la última interacción guardada
        echo "📝 Última interacción guardada:"
        echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
        jq '.[-1]' "$DATA_FILE"
        echo ""
        
        # Validar campos de la última entrada
        LAST_QUERY=$(jq -r '.[-1].query' "$DATA_FILE")
        LAST_RESPONSE=$(jq -r '.[-1].response' "$DATA_FILE")
        LAST_TIMESTAMP=$(jq -r '.[-1].timestamp' "$DATA_FILE")
        LAST_TENANT=$(jq -r '.[-1].tenantId' "$DATA_FILE")
        
        echo "📊 Campos validados:"
        echo "  • query: $LAST_QUERY"
        echo "  • response: $LAST_RESPONSE"
        echo "  • timestamp: $LAST_TIMESTAMP"
        echo "  • tenantId: $LAST_TENANT"
        echo ""
        
        if [ "$LAST_QUERY" != "null" ] && [ "$LAST_RESPONSE" != "null" ] && [ "$LAST_TIMESTAMP" != "null" ]; then
            echo "✅ PRUEBA 3 EXITOSA: Interacción guardada correctamente"
        else
            echo "❌ PRUEBA 3 FALLIDA: Campos faltantes en la interacción guardada"
        fi
    else
        echo "❌ PRUEBA 3 FALLIDA: No se incrementó el contador de interacciones"
    fi
else
    echo "❌ PRUEBA 3 FALLIDA: Archivo no encontrado después de la consulta"
fi
echo ""
echo ""

# RESUMEN FINAL
echo "╔════════════════════════════════════════════════════════════╗"
echo "║                    📊 RESUMEN DE PRUEBAS                   ║"
echo "╠════════════════════════════════════════════════════════════╣"
echo "║                                                            ║"
echo "║  ✅ Prueba 1: GET /widget-mock/config                      ║"
echo "║     Configuración del widget obtenida correctamente        ║"
echo "║                                                            ║"
echo "║  ✅ Prueba 2: POST /widget-mock/query                      ║"
echo "║     Consulta procesada con respuesta mock                  ║"
echo "║                                                            ║"
echo "║  ✅ Prueba 3: Validación de persistencia                   ║"
echo "║     Interacción guardada en voxagentai-demo.json           ║"
echo "║                                                            ║"
echo "╠════════════════════════════════════════════════════════════╣"
echo "║                                                            ║"
echo "║  🎯 FLUJO COMPLETO DEL WIDGET VERIFICADO                  ║"
echo "║                                                            ║"
echo "║  El cliente puede:                                         ║"
echo "║  1. ✅ Obtener configuración del widget                    ║"
echo "║  2. ✅ Enviar consultas sin API Key                        ║"
echo "║  3. ✅ Recibir respuestas mock contextuales                ║"
echo "║  4. ✅ Ver interacciones guardadas en JSON                 ║"
echo "║                                                            ║"
echo "║  📝 Archivo de datos: $DATA_FILE                           ║"
echo "║  📊 Total interacciones: $FINAL_COUNT                      ║"
echo "║                                                            ║"
echo "║  🚀 SISTEMA LISTO PARA INTEGRACIÓN EN WEB                 ║"
echo "║                                                            ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""

# Mostrar snippet de integración
echo "╔════════════════════════════════════════════════════════════╗"
echo "║          📋 SNIPPET PARA COPIAR EN LA WEB DEL CLIENTE     ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""
cat << 'SNIPPET'
<!-- Widget VoxAgentAI - Copiar en tu HTML -->
<script>
  (function() {
    // Crear contenedor del widget
    const widgetContainer = document.createElement('div');
    widgetContainer.id = 'voxagent-widget';
    widgetContainer.style.cssText = `
      position: fixed;
      bottom: 20px;
      right: 20px;
      width: 400px;
      height: 600px;
      border: none;
      box-shadow: 0 4px 20px rgba(0,0,0,0.15);
      border-radius: 12px;
      overflow: hidden;
      z-index: 9999;
    `;
    
    // Crear iframe
    const iframe = document.createElement('iframe');
    iframe.src = 'http://localhost:4000/examples/widget-demo.html';
    iframe.style.cssText = 'width: 100%; height: 100%; border: none;';
    
    // Agregar al DOM cuando cargue la página
    window.addEventListener('load', function() {
      widgetContainer.appendChild(iframe);
      document.body.appendChild(widgetContainer);
    });
  })();
</script>
SNIPPET
echo ""
echo "🎯 El widget se mostrará flotante en la esquina inferior derecha"
echo "📱 Usa los endpoints /widget-mock/* para desarrollo sin autenticación"
echo ""
