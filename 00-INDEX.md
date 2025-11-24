# 🍕 ÍNDICE - PROJETO WILSON PIZZA

**Código e configuração do projeto**

---

## 📂 01-Codigo-Principal
**Código TypeScript principal**
- `schema.ts` (14 KB) - Types, interfaces e database schema
  - Definições de tipos para Restaurante, Pedidos, Clientes, Pagamentos
  - Used by: routes.ts, frontend

- `routes.ts` (51 KB) - API routes backend
  - GET /api/restaurant/settings - Validar horários
  - POST /api/whatsapp/order - Enviar pedido à fila
  - POST /api/stripe/checkout - Gerar link Stripe
  - Outras rotas da API

- `n8n-api.ts` (7 KB) - Integração N8N
  - Comunicação com N8N API
  - Atualizar prompts do agente
  - Gerenciar workflows

---

## 🗄️ 02-Database
**Migrations e schemas SQL**
- `006_create_pizzaria_tables.sql` (2.7 KB)
  - Cria 4 tabelas novas no PostgreSQL:
    1. `promotions` - Gerenciar promoções
    2. `delivery_zones` - Zonas e taxas de entrega
    3. `customer_preferences` - Preferências do cliente
    4. `order_status_log` - Log de status de pedidos

---

## ⚙️ 03-Configuracao
**Configuração e design do projeto**
- `replit.md` - Informações do projeto Replit
  - Overview
  - Recent changes
  - User preferences
  - Architecture

- `components.json` - Configuração de componentes UI
  - Shadcn/UI components config

- `design_guidelines.md` - Design system
  - Cores, tipografia, espaçamento
  - Componentes, padrões de design
  - Dark mode, SEO

---

## 🤖 04-N8N-Workflow
**Workflow N8N do WhatsApp**
- `foodflow-whatsapp-workflow.json` (149 KB)
  - Workflow completo do agente Wilson
  - ID: H5VKBLg9Ne0rGXhe
  - 53 nós
  - Webhook WhatsApp entrada/saída
  - Agente Principal (conversa com Wilson)
  - 3 Tools HTTP integradas

---

## 🗺️ GUIA DE DESENVOLVIMENTO

### Se você quer **ADICIONAR NOVO ENDPOINT**:
1. Consulte `01-Codigo-Principal/schema.ts` para tipos
2. Implemente em `01-Codigo-Principal/routes.ts`
3. Valide com Zod schemas

### Se você quer **ADICIONAR NOVA TABELA**:
1. Crie migration SQL em `02-Database/`
2. Copie arquivo aqui para referência
3. Execute no PostgreSQL

### Se você quer **ALTERAR O AGENTE WILSON**:
1. Edite o prompt no N8N UI
2. OU use `01-Codigo-Principal/n8n-api.ts` para atualizar via API
3. Teste com WhatsApp

### Se você quer **VERIFICAR O WORKFLOW**:
1. Acesse: https://n8n-docker-production-6703.up.railway.app
2. ID: `H5VKBLg9Ne0rGXhe`
3. Verifique os 3 nós HTTP conectados

### Se você quer **ALTERAR DESIGN**:
1. Edite: `03-Configuracao/design_guidelines.md`
2. Edite: `03-Configuracao/components.json`

---

## 📋 ARQUIVOS IMPORTANTES

| Arquivo | Tipo | Tamanho | Uso |
|---------|------|---------|-----|
| schema.ts | TypeScript | 14 KB | Types |
| routes.ts | TypeScript | 51 KB | API |
| n8n-api.ts | TypeScript | 7 KB | N8N |
| 006_create_pizzaria_tables.sql | SQL | 2.7 KB | Database |
| foodflow-whatsapp-workflow.json | JSON | 149 KB | Workflow |
| replit.md | Markdown | 11 KB | Config |
| components.json | JSON | - | UI Config |
| design_guidelines.md | Markdown | - | Design |

---

## 🎯 PRÓXIMOS PASSOS

**AGORA:**
1. Consulte `01-Codigo-Principal/schema.ts` para entender tipos
2. Execute migration: `02-Database/006_create_pizzaria_tables.sql`
3. Teste N8N workflow

**FASE 7 (Próximos passos):**
1. Implemente Menu Management Tool
2. Implemente Customer History Tool
3. Implemente Promotions Tool
4. Implemente Address Validation Tool
5. Implemente Order Status Tool

(Veja detalhes em: `instruções/07-Documentação-Extra/MARY_CONSULTING_TOOLS_USAGE.md`)

---

## 🔗 LINKS ÚTEIS

- **N8N Workflow**: https://n8n-docker-production-6703.up.railway.app/editor/H5VKBLg9Ne0rGXhe
- **Documentação**: Ver pasta `instruções/`
- **Instruções Setup N8N**: `instruções/02-Setup-N8N/N8N_SETUP_INSTRUCTIONS.md`

---

**Total: 8 arquivos organizados em 4 pastas**
