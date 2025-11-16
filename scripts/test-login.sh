#!/bin/bash

echo "🚀 Iniciando test de login..."

# Esperar a que el servidor esté listo
sleep 2

echo ""
echo "📝 Probando login con ADMIN..."
curl -s -X POST http://localhost:4000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"Admin123!"}' | jq .

echo ""
echo "📝 Probando login con OPERATOR..."
curl -s -X POST http://localhost:4000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"operator@example.com","password":"Operator123!"}' | jq .

echo ""
echo "✅ Tests completados"
