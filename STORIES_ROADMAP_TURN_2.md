# 📋 TURN 2: FEATURES PLANNING - STORIES & ROADMAP

**Data:** Nov 30, 2025  
**Status:** ✅ 40+ Stories criadas  
**Base:** 13 Melhorias → 47 Stories ágeis  

---

## 🎯 VISÃO GERAL

```
13 Melhorias
    ↓
47 Stories ágeis
    ↓
Priorizado por Epic
    ↓
Com checklists de readiness
```

---

# 🔴 EPIC 1: TWILIO WHATSAPP AUTOMATION (Tier 1)

**Objetivo:** Notificações WhatsApp automáticas (sem wa.me links)  
**Impacto:** 🔴 ALTA  
**Custo:** ~R$ 0.10/mensagem  
**Duração Total:** 5-6 horas  

## Stories

### 1.1 Setup Twilio Service
- **Duração:** 1-2h
- **Descrição:** Instalar Twilio SDK e configurar conta

**Tasks:**
- [ ] npm install twilio
- [ ] Criar account Twilio
- [ ] Get credentials (TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN)
- [ ] Add env vars
- [ ] Test connection

**Aceitação:**
- Twilio SDK instalado
- Credentials testadas
- Connection working

---

### 1.2 Create WhatsApp Service Module
- **Duração:** 1-1.5h
- **Descrição:** Criar server/services/twilio-whatsapp-service.ts

**Tasks:**
- [ ] Create service file
- [ ] Implement sendWhatsAppMessage()
- [ ] Implement handleWebhook()
- [ ] Error handling
- [ ] Logging

**Template:**
```typescript
export async function sendWhatsAppMessage(
  phoneNumber: string,
  message: string
): Promise<void> {
  // Implementação
}
```

**Aceitação:**
- Serviço criado
- Funções exportadas
- Error handling working

---

### 1.3 Integrate with Order Creation
- **Duração:** 1-1.5h
- **Descrição:** Enviar WhatsApp quando ordem é criada

**Tasks:**
- [ ] Import service em routes/orders.ts (TURN 5)
- [ ] Call sendWhatsAppMessage on order.created
- [ ] Log all sends
- [ ] Handle errors gracefully

**Fluxo:**
```
Order Created → sendWhatsAppMessage() → Log → If error: notify admin
```

**Aceitação:**
- Mensagens enviadas automaticamente
- Logs registram tudo
- Errors não quebram flow

---

### 1.4 Test WhatsApp Integration
- **Duração:** 1-1.5h
- **Descrição:** Unit + Integration tests

**Tests:**
- [ ] Unit: sendWhatsAppMessage()
- [ ] Unit: handleWebhook()
- [ ] Integration: Order → WhatsApp
- [ ] Mock Twilio API
- [ ] Coverage: >80%

**Aceitação:**
- Tests escritos
- Coverage >80%
- All green

---

### 1.5 Documentation & Deployment
- **Duração:** 0.5-1h
- **Descrição:** Docs + prepare for production

**Tasks:**
- [ ] Setup guide
- [ ] Configuration doc
- [ ] Troubleshooting
- [ ] Deploy checklist

**Aceitação:**
- Docs completos
- Ready for production

---

**EPIC 1 Checklist:**
- [ ] Twilio SDK instalado
- [ ] Service module criado
- [ ] Order integration funcional
- [ ] Tests criados (>80%)
- [ ] Documentado
- [ ] Ready for production

---

# 🔴 EPIC 2: SENDGRID EMAIL NOTIFICATIONS (Tier 1)

**Objetivo:** Confirmações de pedido por email  
**Impacto:** 🔴 ALTA  
**Custo:** FREE até 100/dia (~$20/mês depois)  
**Duração Total:** 3-4 horas  

## Stories

### 2.1 Setup SendGrid Service
- **Duração:** 0.5-1h

**Tasks:**
- [ ] Get SendGrid API key
- [ ] Add env var SENDGRID_API_KEY
- [ ] npm install já tem @sendgrid/mail!
- [ ] Test connection

**Aceitação:**
- API key configured
- Connection working

---

### 2.2 Create Email Templates
- **Duração:** 1-1.5h

**Templates Needed:**
- Order confirmation
- Order status update
- Delivery confirmation
- Refund notification

**Aceitação:**
- 4 templates criados
- HTML/text versions
- Test send working

---

### 2.3 Integrate with Order Flows
- **Duração:** 0.5-1h

**Tasks:**
- [ ] Send on order.created
- [ ] Send on order status change
- [ ] Send on delivery complete

**Aceitação:**
- Emails enviados corretamente
- Correct template used

---

### 2.4 Test Email Integration
- **Duração:** 0.5-1h

**Tasks:**
- [ ] Unit tests
- [ ] Integration tests
- [ ] Mock SendGrid

**Aceitação:**
- Tests >80% coverage

---

**EPIC 2 Checklist:**
- [ ] SendGrid configured
- [ ] Templates criados (4x)
- [ ] Integration completa
- [ ] Tests >80%

---

# 🔴 EPIC 3: ADMIN ERROR HANDLING AUDIT (Tier 1)

**Objetivo:** Robustecer admin panel  
**Impacto:** 🔴 ALTA  
**Duração Total:** 2-3 horas  

## Stories

### 3.1 Audit Admin Routes (routes/admin.ts - TURN 5)
- **Duração:** 0.5-1h

**Tasks:**
- [ ] List todas as routes admin
- [ ] Check cada uma por try-catch
- [ ] Identify missing error handling

---

### 3.2 Add Error Handling
- **Duração:** 1-1.5h

**Template:**
```typescript
app.post("/api/admin/...", authenticate, requireRole("admin"), 
  async (req, res) => {
    try {
      // Lógica
      res.json({ success: true });
    } catch (error) {
      console.error("Admin error:", error);
      res.status(500).json({ error: "Operation failed" });
    }
  }
);
```

**Aceitação:**
- Todas routes têm try-catch
- Errors logged
- User gets clear messages

---

### 3.3 Test Error Scenarios
- **Duração:** 0.5-1h

**Tests:**
- [ ] Invalid input
- [ ] Database errors
- [ ] Authorization errors
- [ ] Each error logged

**Aceitação:**
- Tests passing

---

**EPIC 3 Checklist:**
- [ ] All admin routes have error handling
- [ ] Console logs implemented
- [ ] Tests passing

---

# 🔴 EPIC 4: PEDE AÍ INTEGRATION (Tier 1)

**Objetivo:** Completar integração Pede Aí  
**Impacto:** 🔴 ALTA (+50% mercado)  
**Duração Total:** 4-6 horas  

## Stories

### 4.1 Get API Credentials
- **Duração:** Business (async)

**Tasks:**
- [ ] Email contato@pedea.com.br
- [ ] Request API credentials
- [ ] Get webhook docs
- [ ] Get auth method

---

### 4.2 Implement Pede Aí Authentication
- **Duração:** 1-1.5h

**Tasks:**
- [ ] Add auth service
- [ ] Store credentials securely
- [ ] Test authentication

---

### 4.3 Implement Webhook Processor
- **Duração:** 1.5-2h

**Tasks:**
- [ ] Parse webhook payload
- [ ] Create order
- [ ] Validate data
- [ ] Error handling

---

### 4.4 Test End-to-End
- **Duração:** 1-1.5h

**Tasks:**
- [ ] Test order creation
- [ ] Test webhook
- [ ] Test error scenarios

---

### 4.5 Deploy & Monitor
- **Duração:** 0.5-1h

**Tasks:**
- [ ] Configure webhook on Pede Aí
- [ ] Monitor logs
- [ ] Test with real orders

---

**EPIC 4 Checklist:**
- [ ] Credentials obtained
- [ ] Auth implemented
- [ ] Webhook processor working
- [ ] E2E tested
- [ ] Deployed & monitored

---

# 🟡 EPIC 5: SMS NOTIFICATIONS (Tier 2)

**Objetivo:** SMS como fallback  
**Duração Total:** 2-3 horas  

### 5.1 Setup Twilio SMS (0.5h)
### 5.2 Create SMS Service (0.5-1h)
### 5.3 Integrate with Orders (0.5-1h)
### 5.4 Test SMS (0.5h)

---

# 🟡 EPIC 6: 2FA AUTHENTICATION (Tier 2)

**Objetivo:** Segurança aumentada  
**Duração Total:** 6-8 horas  

### 6.1 Design 2FA Flow (1h)
### 6.2 Implement TOTP (2-3h)
### 6.3 Frontend 2FA UI (1-2h)
### 6.4 Test 2FA (1-2h)

---

# 🟡 EPIC 7: REFUND SYSTEM (Tier 2)

**Objetivo:** Reembolsos automáticos  
**Duração Total:** 4-5 horas  

### 7.1 Design Refund Flow (0.5h)
### 7.2 Implement Refund Service (2-3h)
### 7.3 Create Admin Dashboard (1h)
### 7.4 Test Refunds (1-1.5h)

---

# 🟢 EPIC 8: GOOGLE ANALYTICS (Tier 3)

**Objetivo:** Dados de usuário  
**Duração Total:** 1-2 horas  

### 8.1 Setup GA4 (0.5h)
### 8.2 Add Tracking (0.5-1h)
### 8.3 Test Analytics (0.5h)

---

# 🟢 EPIC 9: PUSH NOTIFICATIONS (Tier 3)

**Objetivo:** Melhor engagement  
**Duração Total:** 3-4 horas  

### 9.1 Setup Firebase (0.5h)
### 9.2 Create Push Service (1-1.5h)
### 9.3 Integrate with Orders (1h)
### 9.4 Test Push (0.5-1h)

---

# 🟢 EPIC 10: INVOICE PDFS (Tier 3)

**Objetivo:** Profissionalismo  
**Duração Total:** 2-3 horas  

### 10.1 Setup PDFKit (0.5h)
### 10.2 Create Invoice Template (1-1.5h)
### 10.3 Integrate with Orders (0.5-1h)

---

# 🟢 EPIC 11: DARK MODE (Tier 3)

**Objetivo:** UX melhorada  
**Duração Total:** 2-3 horas  

### 11.1 Setup next-themes (0.5h)
### 11.2 Add Dark Variants (1-1.5h)
### 11.3 Test Dark Mode (0.5-1h)

---

# 🟢 EPIC 12: MULTI-LANGUAGE (Tier 3)

**Objetivo:** Expansão internacional  
**Duração Total:** 8-10 horas  

### 12.1 Setup i18next (1h)
### 12.2 Translate Strings (3-4h)
### 12.3 Add Language Selector (1-1.5h)
### 12.4 Test Multi-lang (1-1.5h)
### 12.5 Add ES & EN (2-3h)

---

# 🟡 EPIC 13: REVIEW MODERATION (Tier 2)

**Objetivo:** Controle de conteúdo  
**Duração Total:** 3-4 horas  

### 13.1 Design Moderation Flow (0.5h)
### 13.2 Add Flagging (1h)
### 13.3 Admin Moderation UI (1-1.5h)
### 13.4 Test Moderation (0.5-1h)

---

# 📊 STORIES SUMMARY

```
EPIC 1 (Twilio WhatsApp):  5 stories = 5-6h
EPIC 2 (SendGrid Email):   4 stories = 3-4h
EPIC 3 (Admin Audit):      3 stories = 2-3h
EPIC 4 (Pede Aí):          5 stories = 4-6h
EPIC 5 (SMS):              4 stories = 2-3h
EPIC 6 (2FA):              4 stories = 6-8h
EPIC 7 (Refund):           4 stories = 4-5h
EPIC 8 (Analytics):        3 stories = 1-2h
EPIC 9 (Push):             4 stories = 3-4h
EPIC 10 (Invoices):        3 stories = 2-3h
EPIC 11 (Dark Mode):       3 stories = 2-3h
EPIC 12 (Multi-lang):      5 stories = 8-10h
EPIC 13 (Moderation):      4 stories = 3-4h

TOTAL: 52 STORIES
TIME: 45-60 hours spread over 2-3 months
```

---

# 🎯 IMPLEMENTATION READINESS CHECKLISTS

## EPIC 1.1: Setup Twilio Service

```
ANTES DE COMEÇAR:
- [ ] npm install twilio (deve ser rápido)
- [ ] Twilio account criado
- [ ] API keys gerados

DEPENDÊNCIAS:
- [ ] Environment variables setup
- [ ] Node.js 20+ (você tem)

BLOQUEADORES:
- Nenhum! Pode começar agora

APÓS COMPLETO:
- [ ] Env vars set
- [ ] Connection tested
- [ ] Ready for 1.2
```

## EPIC 1.2: Create WhatsApp Service Module

```
DEPENDÊNCIAS:
- [ ] EPIC 1.1 completo
- [ ] server/services/ exists

ESTRUTURA NECESSÁRIA:
- [ ] server/services/twilio-whatsapp-service.ts created
- [ ] Imports corretos
- [ ] Export functions

APÓS COMPLETO:
- [ ] Module testable
- [ ] Ready for 1.3
```

## EPIC 1.3: Integrate with Order Creation

```
DEPENDÊNCIAS:
- [ ] EPIC 1.2 completo
- [ ] TURN 5 arquitetura (routes/orders.ts pronta)

MODIFICAR:
- [ ] routes/orders.ts (quando TURN 5)
- [ ] Add sendWhatsAppMessage() call

APÓS COMPLETO:
- [ ] Mensagens enviadas
- [ ] Logs working
- [ ] Ready for 1.4
```

## EPIC 2.1: Setup SendGrid Service

```
ANTES DE COMEÇAR:
- [ ] SendGrid account criado
- [ ] API key obtido

DEPENDÊNCIAS:
- [ ] @sendgrid/mail (já instalado!)

APÓS COMPLETO:
- [ ] Env var SENDGRID_API_KEY set
- [ ] Connection tested
```

## EPIC 3.1: Audit Admin Routes

```
ANTES DE COMEÇAR:
- [ ] TURN 5 arquitetura pronta (routes/admin.ts)
- [ ] Listar todas admin routes

FERRAMENTA:
- [ ] Grep para "app.post", "app.delete", etc em routes/admin.ts

APÓS COMPLETO:
- [ ] Lista de rotas sem try-catch
- [ ] Ready para 3.2
```

---

# 📅 RECOMMENDED SPRINTS

## Sprint 1 (Week 1) - Tier 1 Critical
```
Priority: EPIC 1, 2, 3, 4 (Twilio, Email, Admin, Pede Aí)
Time: 15-20 horas
Impact: 🔴 VERY HIGH
```

## Sprint 2 (Week 2-3) - Tier 2 Important
```
Priority: EPIC 5, 6, 7, 13 (SMS, 2FA, Refund, Moderation)
Time: 18-25 horas
Impact: 🟡 MEDIUM-HIGH
```

## Sprint 3 (Week 4) - Tier 3 Polish
```
Priority: EPIC 8, 9, 10, 11, 12 (Analytics, Push, PDFs, Dark, Multi-lang)
Time: 16-22 horas
Impact: 🟢 NICE-TO-HAVE
```

---

# 🚀 PRÓXIMOS PASSOS

**Turn 2 Completo:**
- ✅ 52 stories criadas
- ✅ 13 epics estruturados
- ✅ Readiness checklists
- ✅ Sprint planning

**Turn 3 Próximo:**
- PRD para EPIC 1 (Twilio WhatsApp)
- Detalhes do requisito
- Acceptance criteria

**Turn 5 Próximo:**
- Implementar EPIC 1
- Modularizar architecture (Turn 1)
- Code com testes

---

**Documento criado:** Nov 30, 2025  
**Status:** ✅ 52 Stories criadas  
**Próximo:** Turn 3 (PRD)  

