#!/bin/bash

# Test script for Mock Data endpoints
# Usage: ./scripts/test-mock.sh

BASE_URL="http://localhost:4000"
TENANT_ID="test-tenant-001"

echo "🔐 Logging in..."
LOGIN_RESPONSE=$(curl -s -X POST "$BASE_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@example.com",
    "password": "Admin123!"
  }')

TOKEN=$(echo $LOGIN_RESPONSE | jq -r '.accessToken')

if [ "$TOKEN" == "null" ] || [ -z "$TOKEN" ]; then
  echo "❌ Login failed"
  echo $LOGIN_RESPONSE | jq .
  exit 1
fi

echo "✅ Login successful"
echo "Token: ${TOKEN:0:20}..."
echo ""

# Test 1: Get mock agents
echo "📋 Test 1: Get mock agents"
curl -s -H "Authorization: Bearer $TOKEN" \
  "$BASE_URL/mock/agents?tenantId=$TENANT_ID" | jq .
echo ""

# Test 2: Create mock agent
echo "🆕 Test 2: Create mock agent"
NEW_AGENT=$(curl -s -X POST "$BASE_URL/mock/agents" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"tenantId\": \"$TENANT_ID\",
    \"name\": \"Test Agent $(date +%s)\",
    \"description\": \"Agent created by test script\",
    \"voice\": \"es-ES-Standard-A\",
    \"behavior\": \"test\"
  }")

echo $NEW_AGENT | jq .
AGENT_ID=$(echo $NEW_AGENT | jq -r '.id')
echo "Created agent ID: $AGENT_ID"
echo ""

# Test 3: Get specific agent
echo "🔍 Test 3: Get specific agent"
curl -s -H "Authorization: Bearer $TOKEN" \
  "$BASE_URL/mock/agents/$AGENT_ID" | jq .
echo ""

# Test 4: Update agent
echo "✏️ Test 4: Update agent"
curl -s -X PUT "$BASE_URL/mock/agents/$AGENT_ID" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Updated Test Agent",
    "status": "training"
  }' | jq .
echo ""

# Test 5: Get usage data
echo "📊 Test 5: Get usage data"
curl -s -H "Authorization: Bearer $TOKEN" \
  "$BASE_URL/mock/usage?tenantId=$TENANT_ID" | jq .
echo ""

# Test 6: Get plan
echo "💎 Test 6: Get plan"
curl -s -H "Authorization: Bearer $TOKEN" \
  "$BASE_URL/mock/plan?tenantId=$TENANT_ID" | jq .
echo ""

# Test 7: Query VoxAgentAI
echo "🎙️ Test 7: Query VoxAgentAI"
curl -s -X POST "$BASE_URL/mock/voxagentai/query" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"tenantId\": \"$TENANT_ID\",
    \"agentId\": \"$AGENT_ID\",
    \"query\": \"This is a test query from script\",
    \"mode\": \"text\"
  }" | jq .
echo ""

# Test 8: Get VoxAgentAI interactions
echo "📝 Test 8: Get VoxAgentAI interactions"
curl -s -H "Authorization: Bearer $TOKEN" \
  "$BASE_URL/mock/voxagentai?tenantId=$TENANT_ID" | jq .
echo ""

# Test 9: Get payments
echo "💳 Test 9: Get payments"
curl -s -H "Authorization: Bearer $TOKEN" \
  "$BASE_URL/mock/payments?tenantId=$TENANT_ID" | jq .
echo ""

# Test 10: Delete agent
echo "🗑️ Test 10: Delete agent"
curl -s -X DELETE "$BASE_URL/mock/agents/$AGENT_ID" \
  -H "Authorization: Bearer $TOKEN" | jq .
echo ""

echo "✅ All mock tests completed!"
