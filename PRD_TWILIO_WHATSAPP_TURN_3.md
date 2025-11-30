# 📋 TURN 3: PRODUCT REQUIREMENTS DOCUMENT

**Epic:** Twilio WhatsApp Automation  
**Data:** Nov 30, 2025  
**Status:** ✅ PRD Completo  

---

## 📄 EXECUTIVE SUMMARY

Implementar notificações automáticas via WhatsApp usando Twilio API para Wilson Pizzaria. Substituir wa.me links (manual) por automação real (custosR$ 0.10/msg). 

**Objetivo:** Melhorar experiência do cliente com notificações instantâneas quando pedido é criado/atualizado.

**Impacto:** 🔴 ALTA  
**Timeline:** 5-6 horas  
**Custo:** ~R$ 0.10 por mensagem  

---

## 🎯 BUSINESS REQUIREMENTS

### Problema
- Atual: Clientes recebem link wa.me no email
- Limitação: Manual, espera do usuário
- Impacto: Experiência ruim, taxa de visualização baixa

### Solução
- Twilio WhatsApp API
- Mensagens automáticas
- Sem espera do usuário
- Professional & automatic

### Benefícios
- ✅ +30% taxa de visualização (estimated)
- ✅ Melhor UX
- ✅ Professional appearance
- ✅ Competitive advantage

---

## 📋 FUNCTIONAL REQUIREMENTS

### FR1: Order Confirmation Message
**Quando:** Order criada  
**Quem:** Cliente da pizzaria  
**Mensagem Deve Conter:**
- Número do pedido (#1234)
- Valor total
- Endereco de entrega
- Tempo estimado
- Link de rastreamento

**Exemplo:**
```
🍕 Pedido confirmado!
Número: #1234
Valor: R$ 85,50
Endereço: Rua Principal, 123
Tempo: 30-40 min
Rastrear: https://...
```

**Aceitação:**
- Mensagem enviada <5 segundos após criação
- Todas informações corretas
- Link válido

---

### FR2: Order Status Update Messages
**Quando:** Status muda (preparing → ready → out_for_delivery → delivered)  
**Mensagens:**

**Status = Preparing:**
```
👨‍🍳 Seu pedido está sendo preparado!
```

**Status = Ready:**
```
✅ Seu pedido está pronto!
Motorista saindo em breve...
```

**Status = Out for Delivery:**
```
🚗 Seu pedido saiu para entrega!
Motorista: João Silva
Vem aí em 10-15 min
```

**Status = Delivered:**
```
✅ Pedido entregue!
Obrigado por usar Wilson Pizzaria! 🍕
Avalie aqui: https://...
```

**Aceitação:**
- Mensagem enviada quando status muda
- Informações atualizadas
- Links funcionam

---

### FR3: Delivery Tracking
**Feature:** Customer pode enviar "RASTREAR" para receber localização do motorista

```
Client: "RASTREAR"
System Response:
"Seu pedido está com o motorista João Silva.
Localização atual: Rua Comércio, 456
Falta: 5-7 minutos"
```

**Aceitação:**
- Responde a mensagens de cliente
- Localização correta
- Tempo estimado real

---

### FR4: Webhook Handling
**Quando:** Cliente responde via WhatsApp  
**Ações:**
- Log de conversa
- Parse de comando
- Resposta automática ou humana

**Comandos:**
- "RASTREAR" → Enviar localização
- "PROBLEMA" → Escalate para support
- "AVALIAR" → Enviar link de avaliação

**Aceitação:**
- Webhooks recebidos
- Comandos processados
- Responses corretas

---

### FR5: Error Handling & Logging
**Requisitos:**
- Se envio falhar: Retry 3x com exponential backoff
- Log tudo (envio, erro, retry)
- Admin notificado se falha persistente
- Customer não vê erro

**Aceitação:**
- Retries funcionam
- Logs completos
- Admin notificado

---

## 🎯 NON-FUNCTIONAL REQUIREMENTS

### NFR1: Performance
```
- Latência: <5 segundos from order.created to message sent
- Reliability: >99% delivery rate
- Throughput: 1000 msg/hour capacity
```

### NFR2: Security
```
- HTTPS only for webhooks
- Validate webhook signature
- Encrypt sensitive data
- Don't log phone numbers plain-text
```

### NFR3: Scalability
```
- Support multi-tenant (cada tenant seu Twilio account)
- Support regional variations (diferentes +55 phones)
```

### NFR4: Maintainability
```
- Code coverage >80%
- Clear error messages
- Comprehensive logging
```

---

## 👥 USER STORIES

### Story 1.1: Setup Twilio Service
**As a** System Admin  
**I want to** Configure Twilio for sending WhatsApp messages  
**So that** Wilson Pizzaria can send notifications

**Acceptance Criteria:**
- [ ] Twilio SDK installed
- [ ] API credentials configured
- [ ] Connection tested successfully
- [ ] Service module exports functions

---

### Story 1.2: Create WhatsApp Service Module
**As a** Developer  
**I want to** Have a service module to send WhatsApp messages  
**So that** Routes can easily send notifications

**Acceptance Criteria:**
- [ ] `server/services/twilio-whatsapp-service.ts` created
- [ ] `sendWhatsAppMessage(phone, message)` exported
- [ ] `handleWebhook(data)` exported
- [ ] Error handling for all cases
- [ ] Logging for debugging

---

### Story 1.3: Integrate with Order Creation
**As a** Customer  
**I want to** Receive WhatsApp when my order is created  
**So that** I know my order was received

**Acceptance Criteria:**
- [ ] When order created, WhatsApp sent <5s
- [ ] Message contains order #, value, address, ETA
- [ ] Link to tracking works
- [ ] If send fails, error logged but order not affected

---

### Story 1.4: Test WhatsApp Integration
**As a** QA Engineer  
**I want to** Comprehensive tests for WhatsApp  
**So that** Reliability is guaranteed

**Acceptance Criteria:**
- [ ] Unit tests for service functions
- [ ] Integration tests with orders
- [ ] Mock Twilio for testing
- [ ] Coverage >80%
- [ ] All tests passing

---

### Story 1.5: Documentation & Deploy
**As a** DevOps  
**I want to** Clear documentation on setup  
**So that** Production deployment is smooth

**Acceptance Criteria:**
- [ ] Setup guide written
- [ ] Configuration documented
- [ ] Troubleshooting section
- [ ] Ready for production

---

## 📊 ACCEPTANCE CRITERIA - OVERALL

**Feature is Done When:**
- ✅ Twilio account configured
- ✅ WhatsApp service module implemented
- ✅ Order creation sends WhatsApp
- ✅ Status updates send WhatsApp
- ✅ Webhooks handled (customer replies)
- ✅ >80% test coverage
- ✅ Errors gracefully handled
- ✅ Logging comprehensive
- ✅ Documentation complete
- ✅ Deployed to production

---

## 📈 SUCCESS METRICS

| Métrica | Target | How to Measure |
|---------|--------|----------------|
| Message Delivery Rate | >98% | Monitor Twilio dashboard |
| Message Latency | <5s | Log timestamps |
| Customer Satisfaction | +20% | Survey after use |
| Support Tickets | -30% | Reduced tracking questions |
| Adoption Rate | >90% | Active customers using |

---

## 🚫 OUT OF SCOPE

- Push notifications (different story)
- Email notifications (different story)
- SMS notifications (different story)
- Chat history (MVP doesn't need)
- Conversational AI (future enhancement)

---

## 📋 DEPENDENCIES & CONSTRAINTS

### Technical Dependencies
- Twilio account + API keys (user must obtain)
- Node.js 20+ (already have)
- Existing storage system (already have)

### Timeline Dependencies
- TURN 2 stories complete
- TURN 5 implementation

### Constraints
- Cost: ~R$ 0.10 per message
- Twilio SLA: 99.9% uptime
- Rate limiting: 1000 msg/hour default

---

## 🔄 TESTING STRATEGY

### Unit Tests
```
- sendWhatsAppMessage() with valid input
- sendWhatsAppMessage() with invalid phone
- handleWebhook() with valid payload
- handleWebhook() with invalid payload
- Retry logic
- Error handling
```

### Integration Tests
```
- Order created → WhatsApp sent
- Status changed → WhatsApp sent
- Customer reply → Webhook processed
- Multi-tenant isolation
```

### E2E Tests
```
- End-to-end order → notification flow
- Real Twilio (using test credentials)
- Multiple orders simultaneously
```

### Performance Tests
```
- 1000 messages/hour
- <5 second latency
- Memory usage stable
```

---

## 📋 RISKS & MITIGATIONS

| Risk | Impact | Mitigation |
|------|--------|-----------|
| Twilio API down | 🔴 HIGH | Fallback to email + queue for retry |
| Invalid phone numbers | 🟡 MEDIUM | Validate format before sending |
| Rate limiting | 🟡 MEDIUM | Implement queue + throttling |
| Customer spam | 🟢 LOW | Customers can opt-out |
| Security breach | 🔴 HIGH | HTTPS only, validate signatures |

---

## 📅 IMPLEMENTATION ROADMAP

```
Turn 3:  PRD created (this document)
Turn 4:  Test strategy designed
Turn 5:  Stories 1.1-1.5 implemented
        - Setup Twilio
        - Create service
        - Integration
        - Tests
        - Docs
Turn 6:  Code review + deploy
```

---

## ✅ SIGN-OFF

**Product Owner:** Wilson Pizzaria Owner  
**Status:** ✅ APPROVED  
**Date:** Nov 30, 2025  
**Next:** Turn 4 (Test Strategy)  

---

**PRD created:** Nov 30, 2025  
**Version:** 1.0  
**Status:** Complete & Ready for Development  

