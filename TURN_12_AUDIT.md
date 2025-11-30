# TURN 12 - AUDIT REPORT COMPLETO

**Data**: 2025-11-29  
**Status**: Revisão 360° completada + 2 CRÍTICOS IDENTIFICADOS  
**Próximo Dev**: LEIA ESTE ARQUIVO ANTES DE CONTINUAR!

---

## 🔴 CONFLITOS CRÍTICOS (ANTES DE DEPLOY)

### ❌ CONFLITO #1: HARDCODED MOCK LOGIN
**Arquivo**: `server/auth/routes.ts` (linhas 91-106)  
**Severidade**: 🔴 CRÍTICO - SEGURANÇA  
**Problema**:
```typescript
if (data.email.toLowerCase() === "wilson@wilsonpizza.com" && data.password === "wilson123") {
  // Ignora completamente a senha real do DB
  // Retorna tokens mock
  // BYPASSA autenticação quando DB está offline
}
```

**Impacto**: 
- ⚠️ Qualquer um pode fazer login como Wilson Pizza
- ⚠️ Funciona mesmo com DB offline (não é feature, é bug)
- ⚠️ SECRET EXPOSTO: "wilson123" em código

**SOLUÇÃO**:
- REMOVER linhas 91-106 inteiramente
- Deixar apenas database login (linhas 109-120)

**Status**: ❌ NÃO CORRIGIDO

---

### ❌ CONFLITO #2: STRIPE SECRET KEYS EXPOSED
**Arquivo**: `server/routes.ts` (linhas 515, 587, 632)  
**Severidade**: 🔴 CRÍTICO - SEGURANÇA  
**Problema**:
```typescript
// Linha 515 - GET /api/admin/tenants
stripeSecretKey: tenant.stripeSecretKey || ""  // ⚠️ EXPOSTO!

// Linha 587 - POST /api/restaurant/register
stripeSecretKey: stripeSecretKey || ""  // ⚠️ SALVO NO RESPONSE!

// Linha 632 - PATCH /api/admin/restaurants/:id/webhook
stripeSecretKey: req.body.stripeSecretKey || ""  // ⚠️ LOG?
```

**Impacto**:
- 🚨 Secret keys privadas enviadas ao frontend
- 🚨 Pode ser interceptado em transit (HTTPS ajuda, mas não é 100%)
- 🚨 No logs de desenvolvimento aparecem as keys
- 🚨 Frontend pode vazar keys para analytics/error tracking

**SOLUÇÃO**:
- NUNCA retornar `stripeSecretKey` em responses
- Apenas `stripePublicKey` deve ir para frontend
- Backend mantém secret keys em ENV variables

**Lines to Fix**:
- 515: Remover stripeSecretKey
- 551: Remover stripeSecretKey: ""
- 587: Remover stripeSecretKey
- 632: Remover stripeSecretKey

**Status**: ❌ NÃO CORRIGIDO

---

## 🟠 PROBLEMAS MAIORES (PRÓXIMA SPRINT)

### Issue #3: TYPE SAFETY - Muitos `any` Types
**Arquivos**: `server/routes.ts`, `server/storage.ts`  
**Severidade**: 🟠 MAIOR - CODE QUALITY  
**Instâncias**: 9+ ocorrências

```typescript
// Exemplos:
values(insertTenant as any)  // storage.ts:122
orderData as any  // routes.ts:269
await storage.updateTenant(req.user!.tenantId!, data as any)  // routes.ts:1058
```

**Impacto**: 
- Sem type checking em compile time
- Fácil quebrar durante refactors
- IDE não consegue dar autocompletion

**Solução**: Trocar `as any` por tipos específicos  
**Status**: ⏳ PRÓXIMA SPRINT

---

### Issue #4: PERFORMANCE - 270+ Console Logs
**Arquivos**: `server/` (múltiplos)  
**Severidade**: 🟠 MAIOR - PERFORMANCE  

**Impacto**:
- Logs em production degradam performance
- Cluttered output dificulta debugging real
- Pode vazar dados sensíveis em logs

**Solução**: 
- Remover/comentar console.logs de debug
- Usar logger.ts para logs estruturados
- Manter apenas erros críticos

**Status**: ⏳ PRÓXIMA SPRINT

---

## 🟡 PROBLEMAS MENORES (MELHORIAS)

### Issue #5: Null DriverId Handling
**Arquivo**: `server/routes.ts:1144`  
**Problema**: Orders podem ficar orfãs (sem driver)

```typescript
const readyOrders = allOrders.filter(o => o.status === "ready" && !o.driverId);
// Se nenhum driver disponível, order fica stuck em "ready"
```

**Solução**: Auto-assign com retry  
**Status**: ⏳ PRÓXIMA SPRINT

---

### Issue #6: passwordHash vs password Field Naming
**Arquivo**: `shared/schema.ts:49` vs `server/mem-storage.ts:41`  
**Problema**: Schema diz `password`, código usa `passwordHash`

```typescript
// Schema: password: text("password")
// MemStorage: passwordHash: "bcrypt_hash"
// Auth: password: hashedPassword
```

**Solução**: Standardizar para `password` em schema (já tem hash)  
**Status**: ⏳ PRÓXIMA SPRINT

---

### Issue #7: Inconsistent Error Responses
**Arquivo**: `server/routes.ts` (múltiplos endpoints)  
**Problema**: Alguns retornam `{error}`, outros `{message}`

```typescript
res.json({ error: "..." })  // Linha 515
res.json({ message: "..." })  // Outro lugar
```

**Solução**: Padrão único: sempre `{error, code, details}`  
**Status**: ⏳ PRÓXIMA SPRINT

---

## ✅ O QUE FUNCIONA BEM

- ✅ Database schema bem estruturado
- ✅ Storage interface limpa
- ✅ WebSocket implementation (após fixes de Turn 11)
- ✅ Frontend 20/20 páginas completas
- ✅ Order creation endpoint (`POST /api/storefront/:slug/orders`)
- ✅ Address search com Nominatim API (FREE)
- ✅ Mapa centrado em Ouricuri, PE
- ✅ Todos 4 user roles testados

---

## 🎯 PRÓXIMAS AÇÕES (PRIORIDADE)

### TURN 12 - BLOQUEADOR (ANTES DE DEPLOY) - 5 min
- [ ] **FIX #1**: Remover mock login (linhas 91-106 em auth/routes.ts)
- [ ] **FIX #2**: Remover stripeSecretKey de responses (4 locais em routes.ts)
- [ ] **TEST**: Login com credenciais reais
- [ ] **DEPLOY**: Para Railway/Render

### TURN 13 - CÓDIGO LIMPO (PRÓXIMA SPRINT) - 30 min
- [ ] Remover 270+ console.logs
- [ ] Fix `any` types (9+ instâncias)
- [ ] Standardize error responses
- [ ] Auto-assign drivers com retry

### TURN 14+ - FEATURES (DEPOIS DE DEPLOY)
- [ ] Ratings & feedback system
- [ ] Promotion/coupon system
- [ ] Analytics dashboard (admin)
- [ ] Mobile app (React Native)

---

## 📋 CHECKLIST DEPLOY

- [ ] Mock login removido
- [ ] Stripe keys não expostas
- [ ] Database conectado (PostgreSQL)
- [ ] WebSocket testado
- [ ] All 4 user roles funcionando
- [ ] Address search funcionando
- [ ] Build passing (~100ms)
- [ ] LSP: ZERO erros
- [ ] Pronto para Railway

---

## 🔧 COMO CORRIGIR (INSTRUÇÕES PASSO A PASSO)

### Correção #1 - Remover Mock Login
```bash
# Arquivo: server/auth/routes.ts
# Remover as linhas 90-107 (bloco inteiro de mock login)
# Deixar apenas o fluxo real do database (linhas 109-120+)
```

**Antes**:
```typescript
// Fallback: Mock login when credentials match demo user
if (data.email.toLowerCase() === "wilson@wilsonpizza.com" && data.password === "wilson123") {
  // ... mock tokens ...
}
// Find user in database
const user = await storage.getUserByEmail(data.email);
```

**Depois**:
```typescript
// Find user in database
const user = await storage.getUserByEmail(data.email);
```

---

### Correção #2 - Remove Stripe Secret Keys
```bash
# Arquivo: server/routes.ts
# 4 locais para remover stripeSecretKey
```

**Locais**:
1. Linha 515: `stripeSecretKey: tenant.stripeSecretKey || "",` → remover
2. Linha 551: `stripeSecretKey: "",` → remover
3. Linha 587: `stripeSecretKey: stripeSecretKey || "",` → remover
4. Linha 632: `stripeSecretKey: req.body.stripeSecretKey || "",` → remover

**Exemplo Antes**:
```typescript
res.json({
  id: restaurant.id,
  stripePublicKey: tenant.stripePublicKey || "",
  stripeSecretKey: tenant.stripeSecretKey || "",  // ❌ REMOVER
  name: tenant.name
})
```

**Exemplo Depois**:
```typescript
res.json({
  id: restaurant.id,
  stripePublicKey: tenant.stripePublicKey || "",  // ✅ OK (público)
  name: tenant.name
})
```

---

## 🧪 TESTE MANUAL POS-FIX

```bash
# Test 1: Login real funciona
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@foodflow.com","password":"Admin123!"}'

# Test 2: Stripe keys NÃO retornam
curl http://localhost:5000/api/admin/tenants \
  -H "Authorization: Bearer $TOKEN" \
  | grep -i stripeSecret  # Deve estar VAZIO

# Test 3: App ainda funciona
curl http://localhost:5000/
```

---

## 📊 STATUS FINAL

| Aspecto | Status | Próx Ação |
|---------|--------|----------|
| Security | ❌ 2 críticos | FIX AGORA |
| Code Quality | 🟠 4 menores | Next turn |
| Features | ✅ 95% | Deploy agora |
| Performance | 🟡 Logs | Next turn |
| **DEPLOY** | ⏳ BLOQUEADO | Após FIX #1 + #2 |

---

**Written by**: Agent (Turn 11 Audit)  
**For**: Next Developer  
**Action**: Leia tudo antes de continuar!
