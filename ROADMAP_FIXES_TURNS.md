# 🔧 ROADMAP DE CORREÇÕES - ESTRUTURADO POR TURNS

## ⚠️ PROBLEMAS IDENTIFICADOS

### 1. ❌ DADOS DE TESTE NÃO SINCRONIZADOS
- **Problema**: Motorista criado sem vinculação com restaurante teste
- **Causa**: `seed-index.ts` não cria motorista para "Wilson Pizza"
- **Impacto**: Não consegue testar fluxo completo de pedido
- **Status**: ❌ NÃO SINCRONIZADO

### 2. ❌ ADMIN NÃO VÊ RESTAURANTES TESTE
- **Problema**: Admin não vinculado aos restaurantes teste
- **Causa**: Não há relacionamento admin ↔ restaurante teste
- **Impacto**: Admin não consegue manipular configurações
- **Status**: ❌ SEM VISIBILIDADE

### 3. ❌ WEBHOOK PARA IMPRESSORA NÃO IMPLEMENTADO
- **Problema**: Campo `n8nWebhookUrl` existe, mas faltam:
  - Campo específico para webhook de impressora
  - Endpoints para configurar webhook
  - Endpoints para RECEBER webhooks (para impressora)
- **Causa**: Schema incompleto + routes incompleto
- **Impacto**: Não consegue sincronizar impressão
- **Status**: ❌ NÃO IMPLEMENTADO

### 4. ❌ FALTAM FUNÇÕES ADMIN
- **Problema**: Admin não pode:
  - Configurar webhook de impressora
  - Configurar webhook de aplicativos
  - Manipular todos restaurantes
  - Manipular donos e motoristas
- **Causa**: Endpoints não existem
- **Status**: ❌ INCOMPLETO

### 5. ❌ MÚLTIPLAS CORREÇÕES DEIXADAS
- Restaurante settings com fallback (parcial)
- WhatsApp kitchen order (parcial)
- Menu endpoint (parcial)
- Order creation (parcial)

---

## 🗺️ PLANO DE RESOLUÇÃO EM 5 TURNS

### TURN 1: SINCRONIZAR DADOS DE TESTE (SEEDS)
**Tempo estimado**: 20 minutos
**Objetivo**: Criar todos dados teste linkados corretamente

#### 1.1. Criar `seed-driver.ts`
```typescript
// Criar motorista teste
// Email: driver@wilsonpizza.com
// Password: driver123
// Role: driver
// Status: available
// Vinculado com tenant "Wilson Pizza"
```

#### 1.2. Modificar `seed-index.ts`
```typescript
// Adicionar seedDriver() na sequência
```

#### 1.3. Modificar `seed-restaurant.ts`
```typescript
// Admin vinculado a "Wilson Pizza" também
```

**Resultado**: 
- ✅ Owner + Driver + Admin todos linked com "Wilson Pizza"
- ✅ Dados teste sincronizados
- ✅ Pode testar fluxo completo

---

### TURN 2: ADICIONAR CAMPOS DE WEBHOOK NO SCHEMA
**Tempo estimado**: 15 minutos
**Objetivo**: Expandir schema para suportar webhooks múltiplos

#### 2.1. Modificar `shared/schema.ts` - Tenants Table
Adicionar novos campos:
```typescript
printerWebhookUrl: text("printer_webhook_url"),
printerWebhookSecret: text("printer_webhook_secret"),
kitchenDisplayWebhookUrl: text("kitchen_display_webhook_url"),
kitchenDisplayWebhookSecret: text("kitchen_display_webhook_secret"),
integrationsConfig: json("integrations_config").$type<{
  printer?: { enabled: boolean; type: string; apiKey?: string };
  kitchenDisplay?: { enabled: boolean; type: string };
  [key: string]: any;
}>(),
```

**Resultado**: 
- ✅ Schema suporta múltiplos webhooks
- ✅ Cada webhook tem secret para validação
- ✅ Configurações flexíveis por integração

---

### TURN 3: CRIAR ENDPOINTS PARA CONFIGURAR WEBHOOKS
**Tempo estimado**: 30 minutos
**Objetivo**: Admin conseguir salvar configurações de webhook

#### 3.1. Modificar `server/routes.ts` - Adicionar Endpoints Admin

```typescript
// GET /api/admin/tenants/:tenantId/webhooks
// PATCH /api/admin/tenants/:tenantId/webhooks
// POST /api/admin/tenants/:tenantId/webhooks/test
// DELETE /api/admin/tenants/:tenantId/webhooks/:type
```

#### 3.2. Modificar `server/storage.ts` - Adicionar Storage Methods
```typescript
updateTenantWebhooks(tenantId, config)
getTenantWebhooks(tenantId)
testWebhook(url, payload)
```

**Resultado**: 
- ✅ Admin consegue configurar webhooks via API
- ✅ Pode testar webhook antes salvar
- ✅ Armazena configurações no banco

---

### TURN 4: CRIAR ENDPOINTS PARA RECEBER WEBHOOKS
**Tempo estimado**: 30 minutos
**Objetivo**: Sistema consegue RECEBER webhooks de impressora

#### 4.1. Adicionar Webhook Receiver Endpoints
```typescript
// POST /api/webhooks/printer
// POST /api/webhooks/kitchen-display
// POST /api/webhooks/order-event

// Validar secret
// Validar tenant
// Processar evento
```

#### 4.2. Adicionar Webhook Handler Service
```typescript
// server/services/webhook-handler.ts
// Processar eventos de impressora
// Processar eventos de kitchen display
// Processar eventos de aplicativos
```

**Resultado**: 
- ✅ Sistema consegue receber eventos
- ✅ Valida segurança (secret)
- ✅ Processa eventos de impressora

---

### TURN 5: EXPANDIR FUNÇÕES ADMIN
**Tempo estimado**: 25 minutos
**Objetivo**: Admin consegue manipular restaurantes, donos, motoristas

#### 5.1. Adicionar Admin Routes
```typescript
// RESTAURANTES
GET /api/admin/restaurants
PATCH /api/admin/restaurants/:id
DELETE /api/admin/restaurants/:id

// DONOS
GET /api/admin/restaurant-owners
POST /api/admin/restaurant-owners
PATCH /api/admin/restaurant-owners/:id

// MOTORISTAS
GET /api/admin/drivers
PATCH /api/admin/drivers/:id/status
PATCH /api/admin/drivers/:id/restaurant

// WEBHOOKS
GET /api/admin/webhooks/config
PATCH /api/admin/webhooks/config
POST /api/admin/webhooks/test
```

#### 5.2. Adicionar Funções no Frontend Admin
```typescript
// client/src/pages/admin-webhooks.tsx (NEW)
// client/src/pages/admin-restaurants-manage.tsx (NEW)
// client/src/pages/admin-owners.tsx (NEW)
// client/src/pages/admin-drivers-manage.tsx (NEW)
```

**Resultado**: 
- ✅ Admin consegue gerenciar tudo
- ✅ Consegue configurar webhooks
- ✅ Interface completa para admin

---

## 📋 CHECKLIST POR TURN

### TURN 1: SEEDS
- [ ] Criar `server/seed-driver.ts`
- [ ] Modificar `server/seed-index.ts` (adicionar driver)
- [ ] Modificar `server/seed-restaurant.ts` (admin + owner linkados)
- [ ] Testar: `npm run dev` e verificar se dados aparecem
- [ ] Commit: "Turn 1: Sincronizar dados teste (seeds)"

### TURN 2: SCHEMA
- [ ] Modificar `shared/schema.ts` (adicionar campos webhook)
- [ ] Gerar migrations (se necessário)
- [ ] Commit: "Turn 2: Adicionar campos webhook no schema"

### TURN 3: WEBHOOK CONFIG ENDPOINTS
- [ ] Modificar `server/storage.ts` (adicionar métodos)
- [ ] Modificar `server/routes.ts` (adicionar endpoints admin)
- [ ] Testar com curl
- [ ] Commit: "Turn 3: Criar endpoints para configurar webhooks"

### TURN 4: WEBHOOK RECEIVER
- [ ] Criar `server/services/webhook-handler.ts`
- [ ] Modificar `server/routes.ts` (adicionar receivers)
- [ ] Testar com curl
- [ ] Commit: "Turn 4: Criar endpoints para receber webhooks"

### TURN 5: ADMIN FUNCTIONS
- [ ] Modificar `server/routes.ts` (mais endpoints admin)
- [ ] Criar páginas admin frontend
- [ ] Modificar `client/src/pages/admin-*.tsx`
- [ ] Testar fluxo completo
- [ ] Commit: "Turn 5: Expandir funções admin"

---

## 🎯 ORDEM DE EXECUÇÃO

```
TURN 1: Seeds (motorista + sincronização)
    ↓
TURN 2: Schema (novos campos webhook)
    ↓
TURN 3: Endpoints de configuração (admin configura webhook)
    ↓
TURN 4: Endpoints receptores (sistema recebe webhook)
    ↓
TURN 5: Admin functions (interface completa)
```

---

## ✅ VALIDAÇÃO FINAL

Após todos os TURNS, validar:
- ✅ Motorista teste consegue fazer delivery
- ✅ Admin consegue ver restaurantes teste
- ✅ Admin consegue configurar webhooks
- ✅ Sistema consegue receber eventos de webhook
- ✅ Admin consegue manipular restaurantes/donos/motoristas
- ✅ Fila de pedidos funciona end-to-end
- ✅ Cozinha recebe pedidos formatados
- ✅ Impressora recebe webhook de pedido

---

## 💾 STATUS ATUAL

**Build**: ✅ PASSING (143ms)
**LSP Errors**: ✅ ZERO
**Production Ready**: 🔴 NÃO (faltam as 5 correções acima)

---

**PRÓXIMO PASSO**: Ativar Autonomous Mode e executar TURN 1

