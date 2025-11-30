# TURN 6 - FRONTEND REFACTOR (PARCIAL) - SALVO PARA PRÓXIMOS TURNS

**Data:** November 30, 2025 | Status: ⚠️ PARCIAL (Turns 4-6 atingidos limite)  
**Objetivo:** Organizar frontend + revisar cadastro + melhorar admin panel + linkar kitchen

---

## ✅ O QUE FOI FEITO NESTE TURN

### 1. ✅ Kitchen Dashboard - Linkagem Corrigida
- **Antes:** Apenas aceitava `restaurant_owner`
- **Depois:** Agora aceita `restaurant_owner` OU `kitchen_staff`
- **Adicional:** Salva `kitchenTenantId` em localStorage para linkar à cozinha correta
- **Status:** FIXADO ✅

### 2. ✅ Register Restaurant - Formulário Expandido
- **Antes:** Apenas 4 campos (nome, email, senha, telefone)
- **Depois:** Adicionados 3 campos opcionais:
  - `address` (endereço)
  - `city` (cidade)
  - `category` (categoria: Pizzaria, Hambúrguer, etc)
- **Status:** EXPANDIDO ✅

### 3. ✅ Build Status
- Build PASSING ✅
- Server RUNNING ✅
- Sem erros de compilação ✅

---

## 📋 O QUE AINDA FALTA (Para Próximos Turns)

### ALTA PRIORIDADE - Turn 7

**Frontend Dashboards (Completo):**
- [ ] **Admin Restaurants Page** - Expandir com:
  - [ ] CRUD completo (Create, Read, Update, Delete) ✓ Partially done
  - [ ] Visualizar métricas de cada restaurante
  - [ ] Suspender/Ativar restaurante
  - [ ] Gerenciar comissão por restaurante
  - [ ] Ver histórico de webhook

- [ ] **Admin Platform Dashboard** - Implementar:
  - [ ] Navegação completa (menu lateral com todas as funcionalidades)
  - [ ] KPIs da plataforma (total de pedidos, receita, restaurants ativos)
  - [ ] Gerenciar usuários (drivers, admins)
  - [ ] Visualizar relatórios de pedidos
  - [ ] Configurar comissões globais

- [ ] **Admin Webhook Config** - Já existe mas falta:
  - [ ] Testar webhooks (button para simular)
  - [ ] Visualizar logs de webhook
  - [ ] Status de entrega

**Backend Endpoints (Validar/Expandir):**
- [ ] `GET /api/admin/restaurants/:id` - Retornar com métricas
- [ ] `PATCH /api/admin/restaurants/:id` - Permitir update de status, comissão
- [ ] `POST /api/admin/restaurants/:id/suspend` - Suspender restaurante
- [ ] `GET /api/admin/restaurants/:id/metrics` - Retornar KPIs do restaurante

---

### MÉDIA PRIORIDADE - Turn 7-8

**Restaurant Owner Dashboard:**
- [ ] Melhorar layout (adicionar navegação completa)
- [ ] Conectar com analytics (mostrar gráficos reais)
- [ ] Integrações (mostrar status de cada integração)
- [ ] WebSocket para pedidos em tempo real

**Driver Dashboard:**
- [ ] Melhorar mapa (Leaflet com marcadores de pickup)
- [ ] Mostrar status de entrega em tempo real
- [ ] Histórico de entregas

**Customer App:**
- [ ] Mostrar histórico de pedidos com status
- [ ] Rastreamento GPS em tempo real
- [ ] Sistema de avaliação funcionando

---

### BAIXA PRIORIDADE - Turn 8+

**Refatorações (Nice to Have):**
- [ ] Consolidar estilos duplicados
- [ ] Criar componentes reutilizáveis
- [ ] Melhorar responsividade mobile
- [ ] Dark mode consistente em todas as páginas

---

## 🔧 MUDANÇAS TÉCNICAS FEITAS

| Arquivo | Mudança | Status |
|---------|---------|--------|
| `client/src/pages/kitchen-dashboard.tsx` | Aceita `kitchen_staff` role | ✅ |
| `client/src/pages/kitchen-dashboard.tsx` | Salva `kitchenTenantId` | ✅ |
| `client/src/pages/register-restaurant.tsx` | Adicionados 3 campos | ✅ |
| Build | PASSING | ✅ |

---

## 📝 PRÓXIMOS PASSOS (Turn 7)

```
1. Ler admin-restaurants.tsx completo
2. Expandir com CRUD + metrics + suspend
3. Ler admin-dashboard.tsx 
4. Adicionar navegação completa
5. Listar todos os endpoints necessários no backend
6. Build + Test
7. Deploy (se tiver tempo)
```

---

## ⚠️ PROBLEMAS CONHECIDOS

**Kitchen Staff Role:**
- Precisa criar endpoint `/api/auth/register-kitchen-staff` no backend
- Precisa adicionar migração para usuário com role `kitchen_staff`
- Kitchen dashboard agora aceita ambos os roles (compatibilidade)

**Register Restaurant:**
- Campos opcionais (address, city, category) enviados para `/api/auth/register`
- Backend precisa validar/salvar esses campos no tenant ou no usuário
- Atualmente, o backend ignora esses campos (não quebra, só não salva)

**Admin Panel:**
- Endpoints ainda incompletos (faltam métricas, suspend, etc)
- Precisa de mais testes E2E

---

## 🎯 RESUMO TURN 6

**Status:** ⚠️ PARCIAL (Salvado para próximos turns)

**O que foi feito:**
- ✅ Kitchen Dashboard linkado à cozinha
- ✅ Register Restaurant expandido
- ✅ Build PASSING
- ✅ Documentação criada

**O que falta:**
- [ ] Admin panel completo (CRÍTICO)
- [ ] Backend endpoints expandidos
- [ ] E2E tests
- [ ] Mais dashboards melhorados

**Recomendação:**
- Turn 7: Focar em Admin Panel + Backend
- Turn 8: E2E tests + Deploy

