# 🔴 N8N HTTP Nodes - Debug & Correção

**Data:** 23 Novembro 2025  
**Problema:** 3 nós HTTP Request falhando  

---

## ⚠️ NÓ 1: Consultar Horário (Falha)

### ❌ Problema Identificado
- **Endpoint:** N8N estava chamando endereço errado
- **Esperado:** GET /api/restaurant/settings
- **Recebido:** 401 ou 404

### ✅ Solução

**URL CORRETA:**
```
GET http://localhost:5173/api/restaurant/settings
```

**Headers OBRIGATÓRIOS:**
```json
{
  "Authorization": "Bearer {RESTAURANT_JWT_TOKEN}",
  "Content-Type": "application/json"
}
```

**Response Esperado:**
```json
{
  "id": "uuid",
  "name": "Wilson Pizzaria",
  "operatingHours": {
    "monday": {"open":"10:00","close":"23:00","closed":false},
    "tuesday": {"open":"10:00","close":"23:00","closed":false},
    ...
  },
  "whatsappPhone": "5511987654321",
  "deliveryFeeCustomer": "8.50",
  ...
}
```

**Teste Rápido:**
```bash
curl -X GET "http://localhost:5173/api/restaurant/settings" \
  -H "Authorization: Bearer {TOKEN}" \
  -H "Content-Type: application/json"
```

**No N8N:**
1. ✅ Usar GET method
2. ✅ URL: `http://localhost:5173/api/restaurant/settings`
3. ✅ Headers: Authorization com token válido
4. ✅ Extrair `.operatingHours` do response

---

## ⚠️ NÓ 2: Gerar Link Stripe (Falha)

### ❌ Problema Identificado
- **Problema:** Stripe sem chaves configuradas
- **Erro:** 500 "STRIPE_SECRET_KEY not configured"
- **Razão:** restaurante não salvou credenciais Stripe

### ✅ Solução

**Opção A: Usar Stripe Real (Produção)**

1. **Obter chaves Stripe:**
   - Login em https://dashboard.stripe.com
   - Ir em Settings → API Keys
   - Copiar `Publishable Key` e `Secret Key`

2. **Salvar no painel:**
   - Menu Settings → Stripe
   - Colar chaves (agora vai funcionar com BUG 1 corrigido!)
   - Clicar "Salvar Configurações"

3. **Verificar salvamento:**
   ```bash
   curl -X GET "http://localhost:5173/api/restaurant/settings" \
     -H "Authorization: Bearer {TOKEN}" | jq '.stripePublicKey'
   ```

**Opção B: Usar Mock (Desenvolvimento)**

Se Stripe não está configurado, usar endpoint mock:

```
POST http://localhost:5173/api/payment/create-checkout-session

Body JSON:
{
  "orderId": "uuid-do-pedido",
  "amount": 95.50,
  "currency": "brl"
}

Response:
{
  "success": true,
  "checkoutUrl": "https://checkout.stripe.com/...",
  "sessionId": "cs_..."
}
```

**No N8N:**
1. ✅ Verificar se Stripe foi salvo: GET /api/restaurant/settings
2. ✅ Se `stripeSecretKey` não está vazio, usar Stripe real
3. ✅ Se vazio, usar mock ou retornar erro controlado

---

## ⚠️ NÓ 3: Enviar Pedido (Falha)

### ❌ Problema Identificado
- **Endpoint:** Provavelmente errando estrutura do pedido
- **Erro:** 400 Bad Request ou 500
- **Razão:** Campos obrigatórios faltando

### ✅ Solução

**URL CORRETA:**
```
POST http://localhost:5173/api/storefront/{slug}/orders
```

**Body Obrigatório:**
```json
{
  "customerName": "João da Silva",
  "customerPhone": "11987654321",
  "customerEmail": "joao@example.com",
  "deliveryAddress": "Rua X, 123, Apto 45, Bairro Y, São Paulo, SP",
  "addressLatitude": "-23.5505",
  "addressLongitude": "-46.6333",
  "paymentMethod": "cash",
  "orderNotes": "Sem cebola",
  "items": [
    {
      "productId": "uuid",
      "quantity": 2,
      "specialInstructions": "Sem cebola"
    }
  ]
}
```

**Response Esperado:**
```json
{
  "success": true,
  "order": {
    "id": "uuid",
    "status": "pending",
    "total": "95.50",
    "subtotal": "85.00",
    "deliveryFee": "10.50"
  },
  "whatsappLink": "https://wa.me/5511987654321?text=..."
}
```

**Teste Rápido:**
```bash
curl -X POST "http://localhost:5173/api/storefront/wilson-pizza/orders" \
  -H "Content-Type: application/json" \
  -d '{
    "customerName": "Wilson",
    "customerPhone": "11987654321",
    "deliveryAddress": "Rua Test, 123",
    "paymentMethod": "cash",
    "items": [{"productId": "uuid", "quantity": 1}]
  }'
```

**No N8N:**
1. ✅ Usar POST method
2. ✅ URL: `/api/storefront/{restaurantSlug}/orders`
3. ✅ Body com todos campos obrigatórios
4. ✅ items array com productId válido (GET /api/restaurant/menu primeiro)
5. ✅ Salvar response.order.id para rastrear

---

## 🔧 Fluxo N8N Corrigido

```
[Webhook WhatsApp] 
    ↓
[Parse Mensagem] (extrair items, endereço, cliente)
    ↓
[NÓ 1: Consultar Horário] ✅
    GET /api/restaurant/settings
    ├─ Validar restaurante aberto?
    └─ Se fechado: Responder "Horário de funcionamento"
    ↓
[NÓ 2: Validar Menu] (NEW)
    GET /api/restaurant/menu
    ├─ Verificar items no cardápio
    └─ Bloquear items não disponíveis
    ↓
[NÓ 3: Criar Pedido] ✅
    POST /api/storefront/{slug}/orders
    ├─ Salvar order.id
    └─ Extrair whatsappLink
    ↓
[NÓ 4: Gerar Link Stripe] (condicional)
    IF paymentMethod == "stripe"
    POST /api/payment/create-checkout-session
    ↓
[NÓ 5: Responder Cliente] ✅
    Enviar via WhatsApp com:
    ├─ Confirmação do pedido
    ├─ Link de rastreamento
    ├─ Link Stripe (se aplicável)
    └─ Horário de entrega
```

---

## 📋 Checklist de Correção

### Frontend (Restaurant Settings)
- [x] BUG 1: Falta `operatingHours` em updateTenant → CORRIGIDO
- [x] GET /api/restaurant/settings agora retorna operatingHours
- [x] PATCH /api/restaurant/settings agora salva operatingHours

### N8N - Nó 1: Consultar Horário
- [ ] Verificar URL do nó HTTP
- [ ] Adicionar Authorization header com JWT válido
- [ ] Testar response com operatingHours
- [ ] Configurar validação de horário aberto

### N8N - Nó 2: Gerar Link Stripe  
- [ ] Verificar se stripeSecretKey foi salvo
- [ ] Se vazio: Usar mock ou retornar erro
- [ ] Se preenchido: Chamar Stripe API correta
- [ ] Testar geração de checkout URL

### N8N - Nó 3: Enviar Pedido
- [ ] Verificar endpoint: POST /api/storefront/{slug}/orders
- [ ] Validar estrutura do body
- [ ] Testar com menu válido
- [ ] Capturar order.id para rastreamento

---

## 🧪 Testes Rápidos (Copiar & Colar)

### Teste 1: Settings com operatingHours
```bash
# Bash
TOKEN="seu-jwt-token-aqui"

curl -X GET "http://localhost:5173/api/restaurant/settings" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" | jq '.operatingHours'
```

### Teste 2: Salvar horários
```bash
curl -X PATCH "http://localhost:5173/api/restaurant/settings" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "operatingHours": {
      "monday": {"open":"09:00","close":"23:00","closed":false},
      "tuesday": {"open":"09:00","close":"23:00","closed":false}
    }
  }' | jq '.operatingHours'
```

### Teste 3: Criar pedido
```bash
curl -X POST "http://localhost:5173/api/storefront/wilson-pizza/orders" \
  -H "Content-Type: application/json" \
  -d '{
    "customerName": "João Silva",
    "customerPhone": "11987654321",
    "deliveryAddress": "Rua Test, 123",
    "paymentMethod": "cash",
    "items": []
  }' | jq '.success'
```

---

## ✅ Status Esperado Depois das Correções

| Nó | Antes | Depois |
|---|---|---|
| Consultar Horário | ❌ 401/404 | ✅ 200 com operatingHours |
| Gerar Link Stripe | ❌ 500 | ✅ 200 ou erro controlado |
| Enviar Pedido | ❌ 400 | ✅ 201 created |

---

**Próximos Passos:**
1. ✅ Executar testes rápidos acima
2. ✅ Atualizar N8N nós com URLs corretas
3. ✅ Testar fluxo completo (WhatsApp → N8N → Pedido criado)
4. ✅ Verificar logs do N8N

