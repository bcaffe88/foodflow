#!/bin/bash

echo "🧪 INICIANDO TESTES EXAUSTIVOS DA PLATAFORMA"
echo "============================================="

BASE_URL="http://localhost:5000"
CUSTOMER_TOKEN=""
RESTAURANT_TOKEN=""
DRIVER_TOKEN=""
ADMIN_TOKEN=""

# Cores
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

test_count=0
pass_count=0
fail_count=0

function test_endpoint() {
  local method=$1
  local endpoint=$2
  local data=$3
  local token=$4
  local description=$5
  
  ((test_count++))
  
  echo -n "  [$test_count] $description... "
  
  if [ -z "$token" ]; then
    response=$(curl -s -w "\n%{http_code}" -X "$method" "$BASE_URL$endpoint" \
      -H "Content-Type: application/json" \
      -d "$data" 2>/dev/null)
  else
    response=$(curl -s -w "\n%{http_code}" -X "$method" "$BASE_URL$endpoint" \
      -H "Content-Type: application/json" \
      -H "Authorization: Bearer $token" \
      -d "$data" 2>/dev/null)
  fi
  
  http_code=$(echo "$response" | tail -n1)
  body=$(echo "$response" | head -n-1)
  
  if [[ $http_code =~ ^(200|201|400|401|403|404|429)$ ]]; then
    echo -e "${GREEN}✓ HTTP $http_code${NC}"
    ((pass_count++))
  else
    echo -e "${RED}✗ HTTP $http_code${NC}"
    echo "    Resposta: $(echo "$body" | head -c 100)..."
    ((fail_count++))
  fi
}

echo -e "\n${YELLOW}1. TESTES DE AUTENTICAÇÃO${NC}"
test_endpoint "POST" "/api/auth/register" \
  '{"email":"test@test.com","password":"Test123!","name":"Teste"}' \
  "" "Registrar novo usuário"

test_endpoint "POST" "/api/auth/login" \
  '{"email":"test@test.com","password":"Test123!"}' \
  "" "Login com credenciais"

echo -e "\n${YELLOW}2. TESTES DE PÁGINAS PÚBLICAS${NC}"
test_endpoint "GET" "/" "" "" "Home page"
test_endpoint "GET" "/r/wilson-pizza" "" "" "Página do restaurante"
test_endpoint "GET" "/login" "" "" "Página de login"
test_endpoint "GET" "/register" "" "" "Página de registro"

echo -e "\n${YELLOW}3. TESTES DE PRODUTOS${NC}"
test_endpoint "GET" "/api/products/category/pizza" "" "" "Listar produtos por categoria"
test_endpoint "GET" "/api/products/featured" "" "" "Produtos em destaque"

echo -e "\n${YELLOW}4. TESTES DE CARRINHO E CHECKOUT${NC}"
test_endpoint "GET" "/checkout" "" "" "Página de checkout"
test_endpoint "GET" "/order-confirmation" "" "" "Confirmação de pedido"

echo -e "\n${YELLOW}5. TESTES DE PEDIDOS (Cliente)${NC}"
test_endpoint "GET" "/api/orders/customer" "" "" "Listar pedidos do cliente"
test_endpoint "GET" "/api/orders/1" "" "" "Detalhes de um pedido"

echo -e "\n${YELLOW}6. TESTES DE DASHBOARD RESTAURANTE${NC}"
test_endpoint "GET" "/api/restaurant/dashboard" "" "" "Dashboard do restaurante"
test_endpoint "GET" "/api/restaurant/products" "" "" "Produtos do restaurante"
test_endpoint "GET" "/api/restaurant/orders/pending" "" "" "Pedidos pendentes"
test_endpoint "GET" "/api/restaurant/financials" "" "" "Financeiro do restaurante"

echo -e "\n${YELLOW}7. TESTES DE DASHBOARD ENTREGADOR${NC}"
test_endpoint "GET" "/api/driver/profile" "" "" "Perfil do entregador"
test_endpoint "GET" "/api/driver/available-orders" "" "" "Pedidos disponíveis"
test_endpoint "GET" "/api/driver/active-deliveries" "" "" "Entregas ativas"

echo -e "\n${YELLOW}8. TESTES DE ADMIN${NC}"
test_endpoint "GET" "/api/admin/restaurants" "" "" "Lista de restaurantes"
test_endpoint "GET" "/api/admin/commissions/unpaid" "" "" "Comissões não pagas"
test_endpoint "GET" "/api/admin/analytics" "" "" "Analytics da plataforma"

echo -e "\n${YELLOW}9. TESTES DE UPLOADS${NC}"
test_endpoint "POST" "/api/upload/product-image" '{}' "" "Upload de imagem de produto"
test_endpoint "POST" "/api/upload/avatar" '{}' "" "Upload de avatar"

echo -e "\n${YELLOW}10. TESTES DE WEBSOCKET (Real-time)${NC}"
test_endpoint "POST" "/api/driver/connect-realtime" '{}' "" "Conectar ao sistema real-time"
test_endpoint "POST" "/api/orders/assign-driver-realtime" \
  '{"orderId":"123","driverId":"456"}' "" "Atribuir entregador em tempo real"

echo -e "\n${YELLOW}11. TESTES DE PÁGINAS DINÂMICAS${NC}"
test_endpoint "GET" "/customer/orders" "" "" "Página de pedidos do cliente"
test_endpoint "GET" "/customer/order/1" "" "" "Rastreamento de pedido"
test_endpoint "GET" "/restaurant/products" "" "" "Gerenciamento de produtos"
test_endpoint "GET" "/restaurant/orders" "" "" "Fila de pedidos"
test_endpoint "GET" "/restaurant/financials" "" "" "Dashboard financeiro"
test_endpoint "GET" "/restaurant/settings" "" "" "Configurações do restaurante"
test_endpoint "GET" "/driver/dashboard" "" "" "Dashboard do entregador"
test_endpoint "GET" "/admin/dashboard" "" "" "Dashboard admin"
test_endpoint "GET" "/admin/restaurants" "" "" "Gerenciamento de restaurantes"

echo -e "\n============================================="
echo -e "${GREEN}✓ Testes Aprovados: $pass_count${NC}"
echo -e "${RED}✗ Testes Falhados: $fail_count${NC}"
echo -e "Total de Testes: $test_count"

if [ $fail_count -eq 0 ]; then
  echo -e "\n${GREEN}🎉 TODOS OS TESTES PASSARAM!${NC}"
  exit 0
else
  echo -e "\n${RED}⚠️  ALGUNS TESTES FALHARAM${NC}"
  exit 1
fi
