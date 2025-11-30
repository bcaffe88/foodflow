# 🐛 BUGS CONHECIDOS & CORREÇÕES NECESSÁRIAS

## CRITICIDADE: HIGH (Prejudica produção)

### 1. LSP Warnings - 4 Errors
**Severidade:** ⚠️ MÉDIA  
**Impacto:** Não afeta runtime, apenas TypeScript linting  
**Localização:** 
- `server/routes.ts:1 diagnostic`
- `server/services/webhook-handler.ts:3 diagnostics`

**Descrição:**
```
Problemas de tipo no webhook-handler.ts
- Tipos de retorno inconsistentes
- Possível null reference
```

**Como Corrigir:**
```bash
1. cd server/services
2. Abrir webhook-handler.ts
3. Procurar por "processPrinterWebhook" e funções auxiliares
4. Adicionar proper typing (Promise<...>)
5. Adicionar null checks
6. npm run build (deve passar)
```

**Arquivos a Revisar:**
- `server/services/webhook-handler.ts` (linhas 1-223)
- `server/routes.ts` (procure por webhook calls)

---

### 2. WhatsApp Service - Falta Automação Real
**Severidade:** ⚠️ MÉDIA  
**Impacto:** Notificações enviam via link (usuário autoriza manualmente)  
**Localização:** `server/services/whatsapp-service.ts`

**Problema:**
```
Atual: Usa wa.me links (grátis mas manual)
- Cliente recebe link no email
- Precisa clicar para confirmar
- Não é automático

Ideal: WhatsApp Business API (automático)
- Mensagens enviadas automáticamente
- Sem necessidade de confirmação
- Profissional
```

**Solução Alternativa (Recomendada):**
```
Usar Twilio WhatsApp API:
1. Instalar: npm install twilio
2. Adicionar secrets: TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN
3. Criar twilioWhatsappService.ts
4. Testar com Twilio sandbox
5. Deploy
```

**Tempo:** 3-4 horas  
**Prioritário:** Sim (melhora UX)  

---

## CRITICIDADE: MEDIUM (Nice to have fixes)

### 3. Pede Aí Integration Incompleto
**Severidade:** 🟡 BAIXA  
**Impacto:** Não recebe pedidos do Pede Aí (ainda)  
**Localização:** `server/integrations/pede-ai-integration.ts`

**Problema:**
```
Código pronto mas não funcional:
- API do Pede Aí é privada (requer contato)
- Sem acesso a credentials
- Sem testes
```

**Como Completar:**
```bash
1. Contatar Pede Aí (developers@pedea.com.br)
2. Solicitar API credentials + docs
3. Implementar autenticação (OAuth2 ou API key)
4. Adicionar processador webhook
5. Testar E2E
6. Deploy
```

**Tempo:** 4-6 horas  
**Prioritário:** Não (outras plataformas funcionam)  

---

### 4. WebSocket Memory Leak Risk
**Severidade:** 🟡 BAIXA  
**Impacto:** Possível vazamento de memória em alta conexão/desconexão  
**Localização:** `server/routes.ts` (procure por `ws.on`)

**Problema:**
```
WebSocket listeners não limpam listeners antigos
Se cliente conecta/desconecta muitas vezes:
- Listeners acumulam
- Memória cresce
- Performance cai
```

**Como Corrigir:**
```typescript
// Adicionar cleanup:
ws.on('close', () => {
  // Remove todos os listeners do socket
  ws.removeAllListeners();
  // Limpar dados associados ao socket
  deleteUserConnection(userId);
});
```

**Tempo:** 1-2 horas  
**Prioritário:** Não (é edge case)  

---

### 5. Database Connection Pool - Não Configurado para Produção
**Severidade:** 🟡 BAIXA  
**Impacto:** Performance subótima em alta carga  
**Localização:** `server/routes.ts` ou `server/storage.ts`

**Problema:**
```
Pool size padrão pode ser muito baixo para produção
Se muitas requisições simultâneas:
- Conexões ficam em fila
- Requests lentos
- Timeout possível
```

**Como Corrigir:**
```typescript
const pool = {
  min: 2,
  max: 10, // Aumentar para produção
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
};
```

**Nota:** Railway auto-configura isso, então baixa prioridade  
**Tempo:** 30 minutos  

---

### 6. Error Handling - Algumas rotas sem try-catch
**Severidade:** 🟡 BAIXA  
**Impacto:** Requisições podem falhar silenciosamente  
**Localização:** `server/routes.ts` (linhas 1700-2100 aprox)

**Problema:**
```
Algumas rotas admin não têm error handling:
- POST /api/admin/* 
- DELETE endpoints
- PATCH endpoints

Se erro ocorre: resposta vazia, cliente não sabe
```

**Como Corrigir:**
```bash
1. Grep "app.post\|app.patch\|app.delete" server/routes.ts
2. Procurar por routes SEM try-catch
3. Adicionar try-catch + console.error
4. Testar
```

**Tempo:** 2-3 horas (audit completo)  
**Prioritário:** Sim (melhor error handling em produção)  

---

## CRITICIDADE: LOW (Polish only)

### 7. SMS Notifications - Não Implementado
**Severidade:** 🟢 NENHUMA  
**Impacto:** Clientes só recebem WhatsApp  
**Implementar com:** Twilio SMS

**Como Adicionar:**
```typescript
// Criar server/services/twilio-service.ts
import twilio from 'twilio';

export async function sendSMS(phoneNumber, message) {
  const client = twilio(
    process.env.TWILIO_ACCOUNT_SID,
    process.env.TWILIO_AUTH_TOKEN
  );
  
  return await client.messages.create({
    body: message,
    from: process.env.TWILIO_PHONE_NUMBER,
    to: phoneNumber
  });
}
```

**Tempo:** 2-3 horas  

---

### 8. Email Notifications - Package Instalado, Não Usado
**Severidade:** 🟢 NENHUMA  
**Impacto:** Sem confirmações por email  
**Implementar com:** @sendgrid/mail (já instalado!)

**Como Adicionar:**
```typescript
// Criar server/services/email-service.ts
import sgMail from '@sendgrid/mail';

export async function sendOrderEmail(customerEmail, orderData) {
  sgMail.setApiKey(process.env.SENDGRID_API_KEY);
  
  const msg = {
    to: customerEmail,
    from: 'noreply@wilsonpizza.com',
    subject: 'Pedido Confirmado #' + orderData.id,
    text: `Seu pedido foi confirmado`,
    html: `<h1>Pedido #${orderData.id}</h1>...`
  };
  
  return await sgMail.send(msg);
}
```

**Tempo:** 2-3 horas  

---

### 9. Google Analytics - Não Implementado
**Severidade:** 🟢 NENHUMA  
**Impacto:** Sem dados de usuário  
**Implementar com:** react-ga4

**Tempo:** 1 hora  

---

### 10. Push Notifications - Firebase Já Configurado
**Severidade:** 🟢 NENHUMA  
**Impacto:** Sem notificações push (apenas WebSocket + email)  
**Implementar com:** firebase-admin (já instalado!)

**Tempo:** 3-4 horas  

---

# 📋 CHECKLIST DE CORREÇÕES RECOMENDADAS

## Antes de Ir Pra Produção
- [ ] Fix LSP warnings (type checking)
- [ ] Add missing error handling (admin routes)
- [ ] Test WebSocket stability (high load)

## Após Primeiro Mês em Produção
- [ ] Implementar Twilio WhatsApp (melhor UX)
- [ ] Implementar Email notifications (SendGrid)
- [ ] Implementar SMS backup (Twilio)

## Próximo Trimestre
- [ ] Implementar Google Analytics
- [ ] Implementar Push notifications (Firebase)
- [ ] Implementar 2FA (segurança)
- [ ] Completar Pede Aí integration

---

# 🔧 COMO REPORTAR BUGS

Se encontrar novo bug:
1. Descrever problema claramente
2. Verificar se está em BUGS_AND_FIXES.md
3. Se não, adicionar com:
   - Título
   - Severidade (HIGH/MEDIUM/LOW)
   - Localização (arquivo + linha aprox)
   - Como reproduzir
   - Como corrigir

---

**Documento criado:** Nov 30, 2025  
**Última atualização:** Turn 8  
**Status:** Up-to-date  

