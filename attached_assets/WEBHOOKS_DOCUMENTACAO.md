# 🔗 Documentação de Webhooks - Sistema de Delivery

## 📋 Visão Geral

Este documento descreve como integrar o sistema de delivery com plataformas externas (iFood, Uber Eats) e impressoras térmicas via webhooks.

---

## 🍔 Webhook iFood

### URL do Webhook
```
POST https://seu-dominio.up.railway.app/api/webhooks/ifood
```

### Configuração no iFood

1. Acesse o painel administrativo do iFood
2. Vá para **Integrações** → **Webhooks**
3. Adicione novo webhook com a URL acima
4. Selecione eventos: `order.created`, `order.updated`, `order.cancelled`
5. Adicione header de autenticação (opcional):
   ```
   Authorization: Bearer SEU_TOKEN_AQUI
   ```

### Formato de Dados Esperado

```json
{
  "id": "ifood_order_12345",
  "merchant": {
    "id": "merchant_123"
  },
  "customer": {
    "name": "João Silva",
    "phone": "87999480699",
    "email": "joao@email.com"
  },
  "items": [
    {
      "name": "X-Burger Clássico",
      "quantity": 2,
      "specialInstructions": "Sem cebola"
    }
  ],
  "total": 5000,
  "deliveryAddress": {
    "formatted": "Rua João Pessoa, 123 - Ouricuri - PE",
    "latitude": "-7.7789",
    "longitude": "-39.0694"
  },
  "status": "CONFIRMED",
  "observations": "Entregar rápido"
}
```

### Resposta Esperada

```json
{
  "success": true,
  "message": "Pedido iFood recebido e impresso",
  "orderNumber": "IFOOD-12345"
}
```

### Fluxo de Integração

1. **Pedido chega** → Webhook recebe dados do iFood
2. **Normalização** → Dados são convertidos para formato interno
3. **Armazenamento** → Pedido salvo no banco de dados
4. **Impressão** → Enviado automaticamente para impressora térmica
5. **Notificação** → Cozinha recebe alerta sonoro no painel

---

## 🚗 Webhook Uber Eats

### URL do Webhook
```
POST https://seu-dominio.up.railway.app/api/webhooks/ubereats
```

### Configuração no Uber Eats

1. Acesse o **Uber Eats Manager**
2. Vá para **Configurações** → **Integrações API**
3. Solicite acesso à API de pedidos
4. Configure webhook para: `order.created`, `order.status_changed`
5. Adicione URL de callback acima

### Formato de Dados Esperado

```json
{
  "id": "uber_order_67890",
  "eater": {
    "first_name": "Maria",
    "phone": "87988776655",
    "email": "maria@email.com"
  },
  "cart": {
    "items": [
      {
        "title": "Pizza Margherita",
        "quantity": 1,
        "special_instructions": "Borda recheada"
      }
    ]
  },
  "payment": {
    "charges": {
      "total": 4500
    }
  },
  "delivery": {
    "location": {
      "address": "Av. Principal, 456 - Ouricuri - PE"
    }
  },
  "type": "DELIVERY",
  "special_instructions": "Deixar na portaria"
}
```

### Resposta Esperada

```json
{
  "success": true,
  "message": "Pedido Uber Eats recebido e impresso",
  "orderNumber": "UBER-67890"
}
```

---

## 🖨️ Webhook Impressora Térmica

### URL do Webhook
```
POST https://seu-dominio.up.railway.app/api/webhooks/printer
```

### Configuração de Impressora

#### Opção 1: Impressora Conectada (Recomendado)

1. **Bematech (BR-1000)**
   - Instale software de integração
   - Configure webhook para: `http://localhost:9100`
   - Sistema enviará dados via rede local

2. **Epson TM-T20**
   - Conecte via USB ou Ethernet
   - Use software Epson OPOS
   - Configure port: `COM3` ou `LPT1`

3. **Star Micronics**
   - Instale Star Micronics SDK
   - Configure endpoint local

#### Opção 2: Webhook Remoto

Se usar serviço de impressão remota (ex: PrintNode, Easypost):

```bash
# Variáveis de ambiente
PRINTER_WEBHOOK_URL=https://api.printnode.com/print
PRINTER_API_KEY=sua_chave_api_aqui
```

### Formato de Dados Enviado

```json
{
  "orderNumber": "IFOOD-12345",
  "customerName": "João Silva",
  "items": [
    {
      "quantity": 2,
      "name": "X-Burger Clássico",
      "notes": "Sem cebola"
    }
  ],
  "total": 5000,
  "source": "iFood"
}
```

### Resposta da Impressora

```json
{
  "success": true,
  "message": "Pedido enviado para impressora",
  "content": "================================\n         NOVO PEDIDO\n================================\n..."
}
```

### Exemplo de Saída Térmica

```
================================
         NOVO PEDIDO
================================

Pedido: IFOOD-12345
Plataforma: iFood
Cliente: João Silva
Data: 21/11/2024 14:30:45

ITENS:
--------------------------------
2x X-Burger Clássico
   OBS: Sem cebola
1x Batata Frita Pequena
1x Refrigerante 350ml
--------------------------------
TOTAL: R$ 50,00

================================
```

---

## 🔄 Fluxo Completo de Integração

```
┌─────────────────────────────────────────────────────────┐
│ Cliente faz pedido no iFood/Uber Eats                  │
└──────────────────┬──────────────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────────────┐
│ Webhook recebe dados da plataforma                     │
└──────────────────┬──────────────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────────────┐
│ Normaliza dados para formato interno                   │
└──────────────────┬──────────────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────────────┐
│ Salva no banco de dados                                │
└──────────────────┬──────────────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────────────┐
│ Envia para impressora térmica                          │
└──────────────────┬──────────────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────────────┐
│ Notifica cozinha (alerta sonoro no painel)            │
└──────────────────┬──────────────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────────────┐
│ Cozinha aceita e prepara pedido                        │
└──────────────────┬──────────────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────────────┐
│ Pedido marcado como "Pronto"                           │
└──────────────────┬──────────────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────────────┐
│ Motoboy recebe notificação                             │
└──────────────────┬──────────────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────────────┐
│ Motoboy entrega pedido                                 │
└──────────────────┬──────────────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────────────┐
│ Status sincronizado com iFood/Uber Eats               │
└─────────────────────────────────────────────────────────┘
```

---

## 🧪 Teste de Webhooks

### Teste Local com cURL

```bash
# Teste iFood
curl -X POST http://localhost:3000/api/webhooks/ifood \
  -H "Content-Type: application/json" \
  -d '{
    "id": "test_ifood_123",
    "customer": {"name": "Teste", "phone": "87999480699"},
    "items": [{"name": "X-Burger", "quantity": 1}],
    "total": 2500,
    "deliveryAddress": {"formatted": "Rua Teste, 123"}
  }'

# Teste Uber Eats
curl -X POST http://localhost:3000/api/webhooks/ubereats \
  -H "Content-Type: application/json" \
  -d '{
    "id": "test_uber_456",
    "eater": {"first_name": "Teste", "phone": "87988776655"},
    "cart": {"items": [{"title": "Pizza", "quantity": 1}]},
    "payment": {"charges": {"total": 4500}},
    "delivery": {"location": {"address": "Av. Teste, 456"}}
  }'

# Teste Impressora
curl -X POST http://localhost:3000/api/webhooks/printer \
  -H "Content-Type: application/json" \
  -d '{
    "orderNumber": "TEST-001",
    "customerName": "Cliente Teste",
    "items": [{"quantity": 1, "name": "Produto Teste"}],
    "total": 2500,
    "source": "Teste"
  }'
```

### Teste com Postman

1. Crie nova collection "Delivery Webhooks"
2. Adicione requests POST para cada webhook
3. Use os JSONs acima como body
4. Verifique respostas e logs no servidor

---

## 🔐 Segurança

### Validação de Webhook

Cada webhook deve validar:

1. **Autenticação**: Verificar token/signature
2. **Origem**: Validar IP da plataforma
3. **Integridade**: Verificar hash HMAC se disponível

```javascript
// Exemplo de validação
const validateWebhook = (req, secret) => {
  const signature = req.headers['x-signature'];
  const body = JSON.stringify(req.body);
  const hash = crypto
    .createHmac('sha256', secret)
    .update(body)
    .digest('hex');
  
  return hash === signature;
};
```

### Variáveis de Ambiente Necessárias

```bash
# iFood
IFOOD_API_KEY=sua_chave_ifood
IFOOD_API_URL=https://api.ifood.com.br

# Uber Eats
UBEREATS_API_KEY=sua_chave_ubereats
UBEREATS_API_URL=https://api.ubereats.com

# Impressora
PRINTER_WEBHOOK_URL=https://seu-servico-impressora.com/print
PRINTER_API_KEY=sua_chave_impressora
```

---

## 📊 Monitoramento

### Logs de Webhook

Todos os webhooks são registrados em:
```
/var/log/delivery-system/webhooks.log
```

### Verificar Status

```bash
# Ver últimos webhooks recebidos
tail -f /var/log/delivery-system/webhooks.log

# Contar webhooks por fonte
grep -c "iFood" /var/log/delivery-system/webhooks.log
grep -c "Uber Eats" /var/log/delivery-system/webhooks.log
```

---

## 🆘 Troubleshooting

### Webhook não está recebendo pedidos

1. ✅ Verifique se URL está correta e acessível
2. ✅ Confirme que firewall não está bloqueando
3. ✅ Verifique logs do servidor
4. ✅ Teste com cURL

### Impressora não recebe pedidos

1. ✅ Verifique se `PRINTER_WEBHOOK_URL` está configurado
2. ✅ Teste conexão com impressora
3. ✅ Verifique se API key está correta
4. ✅ Veja logs de erro

### Pedidos duplicados

1. ✅ Verifique se `externalOrderId` é único
2. ✅ Implemente idempotência (verificar se já existe)
3. ✅ Use transações no banco de dados

---

## 📞 Suporte

Para problemas com integração:
- **iFood**: suporte@ifood.com.br
- **Uber Eats**: support@ubereats.com
- **Sistema**: suporte@deliverysystem.com

---

**Última atualização:** 21 de Novembro de 2024  
**Versão:** 1.0
