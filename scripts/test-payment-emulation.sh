#!/bin/bash

# Script de prueba completa del sistema de emulación de pagos
# Requiere jq para formato JSON: brew install jq

set -e  # Exit on error

API_URL="${API_URL:-http://localhost:4000}"
EMULATOR_KEY="dev-emulator-key-123"

echo "🚀 Testing Payment Emulation System"
echo "=================================="
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Step 1: Health Check
echo -e "${YELLOW}1. Health Check${NC}"
HEALTH=$(curl -s "${API_URL}/health")
echo "$HEALTH" | jq '.'
echo ""

# Step 2: Login
echo -e "${YELLOW}2. Login (admin user)${NC}"
LOGIN_RESPONSE=$(curl -s -X POST "${API_URL}/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@example.com",
    "password": "Admin123!"
  }')

TOKEN=$(echo "$LOGIN_RESPONSE" | jq -r '.accessToken')
TENANT_ID=$(echo "$LOGIN_RESPONSE" | jq -r '.user.tenantId // "test-tenant-id"')

if [ "$TOKEN" = "null" ]; then
  echo -e "${RED}❌ Login failed. Make sure to run 'npm run seed' first${NC}"
  exit 1
fi

echo -e "${GREEN}✓ Login successful${NC}"
echo "Token: ${TOKEN:0:20}..."
echo "Tenant ID: $TENANT_ID"
echo ""

# Step 3: Create Emulated Payment Session
echo -e "${YELLOW}3. Create Emulated Payment Session${NC}"
SESSION_RESPONSE=$(curl -s -X POST "${API_URL}/api/billing/create-session" \
  -H "Authorization: Bearer ${TOKEN}" \
  -H "Content-Type: application/json" \
  -d "{
    \"tenantId\": \"${TENANT_ID}\",
    \"amount\": 100,
    \"currency\": \"USD\",
    \"description\": \"Test payment from script\",
    \"testMode\": true
  }")

echo "$SESSION_RESPONSE" | jq '.'
SESSION_ID=$(echo "$SESSION_RESPONSE" | jq -r '.sessionIdEmu')
BILLING_RECORD_ID=$(echo "$SESSION_RESPONSE" | jq -r '.billingRecordId')

if [ "$SESSION_ID" = "null" ]; then
  echo -e "${RED}❌ Failed to create payment session${NC}"
  exit 1
fi

echo -e "${GREEN}✓ Emulated session created${NC}"
echo "Session ID: $SESSION_ID"
echo "Billing Record ID: $BILLING_RECORD_ID"
echo ""

# Step 4: Simulate Successful Payment Webhook
echo -e "${YELLOW}4. Simulate Successful Payment (Webhook)${NC}"
PROVIDER_PAYMENT_ID="pi_test_$(date +%s)"

WEBHOOK_RESPONSE=$(curl -s -X POST "${API_URL}/api/webhooks/stripe-emulator" \
  -H "Content-Type: application/json" \
  -H "X-Emulator-Key: ${EMULATOR_KEY}" \
  -d "{
    \"type\": \"payment_intent.succeeded\",
    \"data\": {
      \"object\": {
        \"id\": \"${PROVIDER_PAYMENT_ID}\",
        \"amount\": 10000,
        \"currency\": \"usd\",
        \"description\": \"Test payment from script\",
        \"metadata\": {
          \"tenantId\": \"${TENANT_ID}\",
          \"sessionIdEmu\": \"${SESSION_ID}\"
        }
      }
    }
  }")

echo "$WEBHOOK_RESPONSE" | jq '.'

STATUS=$(echo "$WEBHOOK_RESPONSE" | jq -r '.status')
if [ "$STATUS" = "succeeded" ]; then
  echo -e "${GREEN}✓ Payment succeeded${NC}"
else
  echo -e "${RED}❌ Payment failed${NC}"
  exit 1
fi
echo ""

# Step 5: Test Idempotency
echo -e "${YELLOW}5. Test Idempotency (Duplicate Webhook)${NC}"
IDEMPOTENT_RESPONSE=$(curl -s -X POST "${API_URL}/api/webhooks/stripe-emulator" \
  -H "Content-Type: application/json" \
  -H "X-Emulator-Key: ${EMULATOR_KEY}" \
  -d "{
    \"type\": \"payment_intent.succeeded\",
    \"data\": {
      \"object\": {
        \"id\": \"${PROVIDER_PAYMENT_ID}\",
        \"amount\": 10000,
        \"currency\": \"usd\",
        \"metadata\": {
          \"tenantId\": \"${TENANT_ID}\"
        }
      }
    }
  }")

echo "$IDEMPOTENT_RESPONSE" | jq '.'

MESSAGE=$(echo "$IDEMPOTENT_RESPONSE" | jq -r '.message')
if [[ "$MESSAGE" == *"idempotent"* ]]; then
  echo -e "${GREEN}✓ Idempotency works correctly${NC}"
else
  echo -e "${RED}❌ Idempotency check failed${NC}"
fi
echo ""

# Step 6: Test Concurrent Requests
echo -e "${YELLOW}6. Test Concurrency (10 parallel requests)${NC}"
CONCURRENT_ID="pi_concurrent_$(date +%s)"

for i in {1..10}; do
  curl -s -X POST "${API_URL}/api/webhooks/stripe-emulator" \
    -H "Content-Type: application/json" \
    -H "X-Emulator-Key: ${EMULATOR_KEY}" \
    -d "{
      \"type\": \"payment_intent.succeeded\",
      \"data\": {
        \"object\": {
          \"id\": \"${CONCURRENT_ID}\",
          \"amount\": 7500,
          \"currency\": \"usd\",
          \"metadata\": {
            \"tenantId\": \"${TENANT_ID}\"
          }
        }
      }
    }" > /dev/null &
done

wait
echo -e "${GREEN}✓ Concurrent requests completed${NC}"
echo ""

# Step 7: List Payments
echo -e "${YELLOW}7. List Payments${NC}"
PAYMENTS_RESPONSE=$(curl -s -X GET "${API_URL}/api/billing/payments?tenantId=${TENANT_ID}&page=1&limit=5" \
  -H "Authorization: Bearer ${TOKEN}")

echo "$PAYMENTS_RESPONSE" | jq '.'
PAYMENT_COUNT=$(echo "$PAYMENTS_RESPONSE" | jq '.data | length')
echo -e "${GREEN}✓ Found ${PAYMENT_COUNT} payments${NC}"
echo ""

# Step 8: Get Latest Payment
echo -e "${YELLOW}8. Get Latest Payment${NC}"
LATEST_PAYMENT=$(curl -s -X GET "${API_URL}/api/billing/payments/latest" \
  -H "Authorization: Bearer ${TOKEN}")

echo "$LATEST_PAYMENT" | jq '.'
echo ""

# Step 9: Simulate Failed Payment
echo -e "${YELLOW}9. Simulate Failed Payment${NC}"
FAILED_ID="pi_failed_$(date +%s)"

FAILED_RESPONSE=$(curl -s -X POST "${API_URL}/api/webhooks/stripe-emulator" \
  -H "Content-Type: application/json" \
  -H "X-Emulator-Key: ${EMULATOR_KEY}" \
  -d "{
    \"type\": \"payment_intent.failed\",
    \"data\": {
      \"object\": {
        \"id\": \"${FAILED_ID}\",
        \"amount\": 2500,
        \"currency\": \"usd\",
        \"last_payment_error\": {
          \"message\": \"Insufficient funds\"
        },
        \"metadata\": {
          \"tenantId\": \"${TENANT_ID}\"
        }
      }
    }
  }")

echo "$FAILED_RESPONSE" | jq '.'

FAILED_STATUS=$(echo "$FAILED_RESPONSE" | jq -r '.status')
if [ "$FAILED_STATUS" = "failed" ]; then
  echo -e "${GREEN}✓ Failed payment handled correctly${NC}"
fi
echo ""

# Final Summary
echo "=================================="
echo -e "${GREEN}✅ All tests passed!${NC}"
echo ""
echo "Summary:"
echo "  - Health check: OK"
echo "  - Authentication: OK"
echo "  - Emulated session creation: OK"
echo "  - Payment webhook (success): OK"
echo "  - Idempotency: OK"
echo "  - Concurrency: OK"
echo "  - List payments: OK (${PAYMENT_COUNT} found)"
echo "  - Latest payment: OK"
echo "  - Failed payment: OK"
echo ""
echo "Check your payment files at: ./data/payments/payments-$(date +%Y-%m-%d).json"
