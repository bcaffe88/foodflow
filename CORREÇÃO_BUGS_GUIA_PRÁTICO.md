# 🔧 Guia Prático - Correção dos 3 Bugs

**Data:** 23 Novembro 2025  
**Status:** 🟢 Servidor rodando - Pronto para testar

---

## ✅ BUG 1 CORRIGIDO: operatingHours não salvava

### O Que Foi Feito
- ✅ Adicionada linha em `server/storage.ts` linha 139:
  ```typescript
  if (data.operatingHours !== undefined) updateData.operatingHours = data.operatingHours;
  ```
- ✅ Workflow restartado

### Como Testar (Frontend)
1. Abra o painel do restaurante
2. Vá para **Configurações → Horário de Funcionamento**
3. Altere algum horário (ex: segunda-feira de 10:00 para 09:00)
4. Clique **"Salvar Configurações"**
5. ✅ Deve aparecer: "Sucesso! Configurações salvas"
6. **Recarregue a página** (F5)
7. ✅ Os horários devem aparecer salvos

**Se der erro:**
- Verifique console do navegador (F12 → Console)
- Procure por mensagem de erro
- Tire screenshot e envie

---

## ⚠️ BUG 2: N8N Nó 1 - Consultar Horário

### URL do Nó N8N
```
GET https://foodflow.replit.dev/api/restaurant/settings
```

### Headers Obrigatórios
```json
{
  "Authorization": "Bearer {JWT_TOKEN_AQUI}",
  "Content-Type": "application/json"
}
```

### O Que Fazer
1. **No N8N, no nó "HTTP Request":**
   - Method: `GET`
   - URL: Colar acima
   - Authentication: Adicionar Header com Authorization

2. **No painel do restaurante, vá em Settings:**
   - Copie a URL completa do navegador
   - Extraia o **tenant ID** (deve estar em params ou headers)
   - Salve alguma informação nos Settings
   - Verifique que `operatingHours` está salvo

3. **Teste rápido no navegador:**
   ```javascript
   // Abra console (F12) e cole:
   fetch('/api/restaurant/settings', {
     headers: { 'Authorization': 'Bearer ' + localStorage.getItem('token') }
   }).then(r => r.json()).then(d => console.log(d.operatingHours))
   ```
   - ✅ Deve imprimir os horários

### Response Esperado
```json
{
  "id": "uuid-do-restaurante",
  "name": "Wilson Pizzaria",
  "operatingHours": {
    "monday": {"open":"10:00","close":"23:00","closed":false},
    "tuesday": {"open":"10:00","close":"23:00","closed":false},
    ...
  },
  "whatsappPhone": "5511987654321",
  ...
}
```

---

## ⚠️ BUG 3: N8N Nó 2 - Gerar Link Stripe

### Cenário A: COM Stripe (Produção)
1. **Salvar credenciais:**
   - Painel do restaurante → Settings → Stripe
   - Colar "Chave Pública" e "Chave Secreta"
   - Clicar "Salvar Configurações"

2. **No N8N:**
   ```
   POST https://foodflow.replit.dev/api/payment/create-checkout-session
   ```
   ```json
   Body:
   {
     "orderId": "uuid-do-pedido",
     "amount": 95.50,
     "currency": "brl"
   }
   
   Response esperado:
   {
     "success": true,
     "checkoutUrl": "https://checkout.stripe.com/pay/cs_..."
   }
   ```

### Cenário B: SEM Stripe (Desenvolvimento)
1. Usar `paymentMethod: "cash"` ou `"pix"`
2. N8N vai pular o nó de Stripe
3. Responder ao cliente com link de PIX/Dinheiro

**Código N8N recomendado:**
```javascript
IF stripeSecretKey is not empty
  → Call Stripe API
ELSE
  → Use cash/pix payment
  → Skip Stripe
```

---

## ⚠️ BUG 4: N8N Nó 3 - Enviar Pedido

### URL do Nó N8N
```
POST https://foodflow.replit.dev/api/storefront/wilson-pizza/orders
```

### Body Obrigatório
```json
{
  "customerName": "João Silva",
  "customerPhone": "11987654321",
  "customerEmail": "joao@example.com",
  "deliveryAddress": "Rua X, 123, Apto 45, Bairro Y",
  "addressLatitude": "-23.5505",
  "addressLongitude": "-46.6333",
  "paymentMethod": "cash",
  "orderNotes": "Sem cebola",
  "items": [
    {
      "productId": "uuid-do-produto",
      "quantity": 2,
      "specialInstructions": "Sem cebola"
    }
  ]
}
```

### Response Esperado
```json
{
  "success": true,
  "order": {
    "id": "uuid-novo-pedido",
    "status": "pending",
    "total": "95.50",
    "subtotal": "85.00",
    "deliveryFee": "10.50"
  },
  "whatsappLink": "https://wa.me/5511987654321?text=..."
}
```

### Erros Comuns
| Erro | Causa | Solução |
|---|---|---|
| 400 Bad Request | Falta campo obrigatório | Adicionar todos os campos |
| 404 Not Found | Slug errado ou produto não existe | Verificar `wilson-pizza` ou ID do item |
| 500 Internal Server Error | Database erro | Verificar logs do servidor |

### Como Obter productId do Menu
```
GET https://foodflow.replit.dev/api/restaurant/menu

Response:
[
  {
    "id": "uuid-a-copiar",
    "name": "Pizza Calabresa",
    "price": "45.90"
  }
]
```

---

## 📊 Fluxo N8N Correto (Após Correções)

```
┌─────────────────────────────────────┐
│ 1. Webhook WhatsApp (entrada)       │
│ "Quero uma calabresa"               │
└──────────────┬──────────────────────┘
               ↓
┌─────────────────────────────────────┐
│ 2. NÓ: Consultar Horário ✅          │
│ GET /api/restaurant/settings        │
│ └─ Validar: aberto?                 │
└──────────────┬──────────────────────┘
               ↓ (se aberto)
┌─────────────────────────────────────┐
│ 3. NÓ: Buscar Menu                   │
│ GET /api/restaurant/menu            │
│ └─ Extrair products                 │
└──────────────┬──────────────────────┘
               ↓
┌─────────────────────────────────────┐
│ 4. NÓ: Validar Items                │
│ Verificar se items existem          │
│ └─ Se não: responder "não temos"    │
└──────────────┬──────────────────────┘
               ↓ (se válido)
┌─────────────────────────────────────┐
│ 5. NÓ: Criar Pedido ✅              │
│ POST /api/storefront/wilson-pizza/  │
│        orders                       │
│ └─ Salvar order.id                  │
└──────────────┬──────────────────────┘
               ↓
┌─────────────────────────────────────┐
│ 6. NÓ: Gerar Link Stripe (opcional) │
│ IF paymentMethod = "stripe"         │
│ POST /api/payment/create-checkout   │
│ └─ Obter checkoutUrl                │
└──────────────┬──────────────────────┘
               ↓
┌─────────────────────────────────────┐
│ 7. Responder Cliente (WhatsApp)      │
│ Enviar:                             │
│ ├─ ✅ Pedido confirmado (ID)        │
│ ├─ 📍 Rastreamento                  │
│ ├─ 💳 Link Stripe (se aplicável)    │
│ └─ ⏱️ Horário entrega                │
└─────────────────────────────────────┘
```

---

## 🧪 Testes Rápidos (Copiar & Colar no Console do Navegador)

### Teste 1: Verificar Token
```javascript
const token = localStorage.getItem('authToken') || localStorage.getItem('token');
console.log("Token:", token ? "✅ Encontrado" : "❌ Não encontrado");
```

### Teste 2: Consultar Horários
```javascript
const token = localStorage.getItem('authToken') || localStorage.getItem('token');
fetch('/api/restaurant/settings', {
  headers: { 'Authorization': 'Bearer ' + token }
})
.then(r => r.json())
.then(d => {
  console.log("✅ Horários:", d.operatingHours);
  console.log("✅ Telefone:", d.whatsappPhone);
  console.log("✅ Stripe Public:", d.stripePublicKey ? "✅ Salvo" : "❌ Vazio");
})
.catch(e => console.error("❌ Erro:", e.message));
```

### Teste 3: Atualizar Horários
```javascript
const token = localStorage.getItem('authToken') || localStorage.getItem('token');
fetch('/api/restaurant/settings', {
  method: 'PATCH',
  headers: { 
    'Authorization': 'Bearer ' + token,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    operatingHours: {
      monday: {"open":"09:00","close":"24:00","closed":false},
      tuesday: {"open":"09:00","close":"23:00","closed":false},
      wednesday: {"open":"09:00","close":"23:00","closed":false},
      thursday: {"open":"09:00","close":"23:00","closed":false},
      friday: {"open":"09:00","close":"02:00","closed":false},
      saturday: {"open":"12:00","close":"02:00","closed":false},
      sunday: {"open":"12:00","close":"23:00","closed":false}
    }
  })
})
.then(r => r.json())
.then(d => console.log("✅ Salvo!", d.operatingHours))
.catch(e => console.error("❌ Erro:", e.message));
```

### Teste 4: Verificar Menu
```javascript
const token = localStorage.getItem('authToken') || localStorage.getItem('token');
fetch('/api/restaurant/menu', {
  headers: { 'Authorization': 'Bearer ' + token }
})
.then(r => r.json())
.then(d => {
  console.log("✅ Menu:", d);
  console.log("Items:", d.menu?.length || 0);
})
.catch(e => console.error("❌ Erro:", e.message));
```

---

## ✅ Checklist de Verificação

### Frontend
- [ ] Horários aparecem no painel de Settings
- [ ] Consegue editar horários
- [ ] Ao salvar, aparece "Sucesso!"
- [ ] Ao recarregar (F5), horários persistem

### API (Testes no console)
- [ ] Teste 2: GET /api/restaurant/settings retorna operatingHours
- [ ] Teste 3: PATCH /api/restaurant/settings salva operatingHours
- [ ] Teste 4: GET /api/restaurant/menu retorna items

### N8N
- [ ] Nó 1: GET /api/restaurant/settings funciona
- [ ] Nó 2: Stripe salvo ou fallback implementado
- [ ] Nó 3: POST /api/storefront/wilson-pizza/orders cria pedido

---

## 📞 Se Algo Não Funcionar

### Erro 401 (Não Autorizado)
```
Solução: Token inválido ou expirado
→ Faça login novamente
→ Copie o novo token
→ Use nos testes
```

### Erro 404 (Não Encontrado)
```
Solução: URL errada
→ Verifique slug: wilson-pizza (pode estar diferente)
→ Verifique se restaurante existe
```

### Erro 500 (Servidor)
```
Solução: Problema no backend
→ Verifique logs: npm run dev
→ Se BUG 1 não foi aplicado, aplique novamente
→ Restart workflow
```

### Horários ainda não salvam
```
Solução:
→ Verifique se arquivo storage.ts foi editado (linha 139)
→ Restart workflow (npm run dev parou e reiniciou?)
→ Teste 3 no console (acima) deve retornar novo horário
```

---

## 🚀 Próximo Passo

**Depois que tudo acima funcionar:**

1. Teste fluxo completo no N8N:
   - Envie mensagem WhatsApp
   - Veja os 3 nós executarem
   - Receba pedido confirmado

2. Se tudo OK:
   - Pode publicar a app
   - N8N estará 100% funcional

---

**Status:** 🟢 Todos bugs identificados e BUG 1 corrigido  
**Próxima Ação:** Você testa com este guia  
**Tempo Estimado:** 5-10 min

