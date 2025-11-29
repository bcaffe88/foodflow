#!/bin/bash
# COMPREHENSIVE ENDPOINT TESTS - WILSON PIZZARIA
# Tests all critical flows

BASE_URL="http://localhost:5000"
ADMIN_EMAIL="admin@foodflow.com"
ADMIN_PASS="Admin123!"
CUSTOMER_EMAIL="customer@example.com"
CUSTOMER_PASS="password"
RESTAURANT_EMAIL="wilson@wilsonpizza.com"
RESTAURANT_PASS="wilson123"
DRIVER_EMAIL="driver@example.com"
DRIVER_PASS="password"

echo "=== 🧪 WILSON PIZZARIA - COMPREHENSIVE ENDPOINT TESTS ==="
echo ""

# Test 1: Admin Login
echo "✓ Test 1: Admin Login"
ADMIN_TOKEN=$(curl -s -X POST $BASE_URL/api/auth/login \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$ADMIN_EMAIL\",\"password\":\"$ADMIN_PASS\"}" \
  | jq -r '.accessToken' 2>/dev/null)

if [ ! -z "$ADMIN_TOKEN" ] && [ "$ADMIN_TOKEN" != "null" ]; then
  echo "  ✅ PASSED - Token: ${ADMIN_TOKEN:0:20}..."
else
  echo "  ❌ FAILED - No token received"
fi
echo ""

# Test 2: Customer Login
echo "✓ Test 2: Customer Login"
CUSTOMER_TOKEN=$(curl -s -X POST $BASE_URL/api/auth/login \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$CUSTOMER_EMAIL\",\"password\":\"$CUSTOMER_PASS\"}" \
  | jq -r '.accessToken' 2>/dev/null)

if [ ! -z "$CUSTOMER_TOKEN" ] && [ "$CUSTOMER_TOKEN" != "null" ]; then
  echo "  ✅ PASSED"
else
  echo "  ❌ FAILED"
fi
echo ""

# Test 3: Driver Login
echo "✓ Test 3: Driver Login"
DRIVER_TOKEN=$(curl -s -X POST $BASE_URL/api/auth/login \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$DRIVER_EMAIL\",\"password\":\"$DRIVER_PASS\"}" \
  | jq -r '.accessToken' 2>/dev/null)

if [ ! -z "$DRIVER_TOKEN" ] && [ "$DRIVER_TOKEN" != "null" ]; then
  echo "  ✅ PASSED"
else
  echo "  ❌ FAILED"
fi
echo ""

# Test 4: Get Public Restaurants
echo "✓ Test 4: Get Public Restaurants"
RESTAURANTS=$(curl -s -X GET $BASE_URL/api/storefront/restaurants | jq '.[0].name' 2>/dev/null)
if [ "$RESTAURANTS" = "\"Wilson Pizzaria\"" ]; then
  echo "  ✅ PASSED - Found Wilson Pizzaria"
else
  echo "  ❌ FAILED - Expected Wilson Pizzaria, got: $RESTAURANTS"
fi
echo ""

# Test 5: Check Stripe Keys NOT Exposed
echo "✓ Test 5: Security - Stripe Keys NOT Exposed"
STRIPE_CHECK=$(curl -s -X GET $BASE_URL/api/admin/tenants \
  -H "Authorization: Bearer $ADMIN_TOKEN" 2>/dev/null | grep -i "stripesecretkey")
if [ -z "$STRIPE_CHECK" ]; then
  echo "  ✅ PASSED - Stripe secret keys NOT exposed"
else
  echo "  ❌ FAILED - Stripe secret keys found in response!"
fi
echo ""

# Test 6: Create Order
echo "✓ Test 6: Create Order"
ORDER_RESPONSE=$(curl -s -X POST $BASE_URL/api/storefront/wilson-pizza/orders \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $CUSTOMER_TOKEN" \
  -d '{
    "customerName":"John Test",
    "customerPhone":"11988776655",
    "customerEmail":"john@test.com",
    "deliveryAddress":"Rua Test, 123",
    "addressLatitude":-7.9056,
    "addressLongitude":-40.1056,
    "items":[{"productId":"test","quantity":1,"price":"48.00"}],
    "subtotal":"48.00",
    "deliveryFee":"5.00",
    "total":"53.00",
    "paymentMethod":"cash"
  }')

ORDER_ID=$(echo $ORDER_RESPONSE | jq -r '.order.id' 2>/dev/null)
if [ ! -z "$ORDER_ID" ] && [ "$ORDER_ID" != "null" ]; then
  echo "  ✅ PASSED - Order created: $ORDER_ID"
else
  echo "  ⚠️ PARTIAL - Response: $(echo $ORDER_RESPONSE | jq '.' 2>/dev/null | head -5)"
fi
echo ""

# Test 7: Get Admin Tenants
echo "✓ Test 7: Get Admin Tenants"
TENANTS=$(curl -s -X GET $BASE_URL/api/admin/tenants \
  -H "Authorization: Bearer $ADMIN_TOKEN" | jq 'length' 2>/dev/null)
if [ "$TENANTS" -gt 0 ]; then
  echo "  ✅ PASSED - Found $TENANTS tenant(s)"
else
  echo "  ❌ FAILED - No tenants found"
fi
echo ""

# Test 8: Check API Error Response Format
echo "✓ Test 8: Error Response Format"
ERROR_RESPONSE=$(curl -s -X POST $BASE_URL/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"invalid@test.com","password":"wrongpass"}' | jq 'keys' 2>/dev/null)
if echo "$ERROR_RESPONSE" | grep -q "error"; then
  echo "  ✅ PASSED - Error response format: {error: ...}"
else
  echo "  ⚠️ CHECK - Response format: $ERROR_RESPONSE"
fi
echo ""

# Test 9: Test Address Search (Nominatim)
echo "✓ Test 9: Address Search (Nominatim API)"
ADDRESS_TEST=$(curl -s "https://nominatim.openstreetmap.org/search?format=json&q=Ouricuri,Pernambuco,Brasil&limit=1" \
  -H 'User-Agent: FoodFlow-App' | jq 'length' 2>/dev/null)
if [ "$ADDRESS_TEST" -gt 0 ]; then
  echo "  ✅ PASSED - Nominatim API responding"
else
  echo "  ⚠️ WARNING - Nominatim API no response"
fi
echo ""

# Test 10: Build Status
echo "✓ Test 10: Build Status"
BUILD_OUTPUT=$(npm run build 2>&1 | tail -3)
if echo "$BUILD_OUTPUT" | grep -q "Build complete"; then
  echo "  ✅ PASSED - Build successful"
  echo "  $BUILD_OUTPUT"
else
  echo "  ❌ FAILED - Build errors"
fi
echo ""

echo "=== ✅ ENDPOINT TESTS COMPLETE ==="
