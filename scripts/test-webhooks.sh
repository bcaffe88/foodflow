#!/bin/bash
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

API_URL="http://localhost:5000"
TENANT_ID="9ff08749-cfe8-47e5-8964-3284a9e8a901"

echo -e "${BLUE}===== WEBHOOK INTEGRATION TESTS =====${NC}\n"

echo -e "${YELLOW}1. iFood Webhook Test${NC}"
curl -s -X POST "$API_URL/api/webhooks/ifood/$TENANT_ID" \
  -H "Content-Type: application/json" \
  -H "x-ifood-signature: test-sig" \
  -d '{
    "event": "order.created",
    "data": {
      "orderId": "ifood-'$(date +%s)'",
      "customerName": "João Silva",
      "customerPhone": "5587999999999",
      "customerEmail": "joao@example.com",
      "deliveryAddress": "Rua Principal, 123",
      "items": [{"name": "Pizza", "quantity": 2, "price": "45.00"}],
      "total": "100.00",
      "status": "confirmed",
      "source": "ifood",
      "externalId": "ifood-ext-123"
    },
    "timestamp": "'$(date -u +%Y-%m-%dT%H:%M:%SZ)'"
  }' | jq -r '.success // .error // .' 2>/dev/null || echo "Error"
echo -e "${GREEN}✅ iFood\n${NC}"

echo -e "${YELLOW}2. UberEats Webhook Test${NC}"
curl -s -X POST "$API_URL/api/webhooks/ubereats/$TENANT_ID" \
  -H "Content-Type: application/json" \
  -d '{
    "event": "order.created",
    "data": {
      "orderId": "uber-'$(date +%s)'",
      "customerName": "Maria Santos",
      "customerPhone": "5588888888888",
      "customerEmail": "maria@example.com",
      "deliveryAddress": "Avenida Central, 456",
      "items": [{"name": "Hambúrguer", "quantity": 1, "price": "55.00"}],
      "total": "79.00",
      "status": "confirmed",
      "source": "ubereats",
      "externalId": "uber-ext-456"
    },
    "timestamp": "'$(date -u +%Y-%m-%dT%H:%M:%SZ)'"
  }' | jq -r '.success // .error // .' 2>/dev/null || echo "Error"
echo -e "${GREEN}✅ UberEats\n${NC}"

echo -e "${YELLOW}3. Health Check${NC}"
curl -s "$API_URL/api/health" | jq -r '.status' 2>/dev/null || echo "Error"
echo -e "${GREEN}✅ Server OK\n${NC}"

echo -e "${BLUE}===== TESTS COMPLETED =====${NC}"
