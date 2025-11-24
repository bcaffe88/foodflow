# 🍕 PROJETO WILSON PIZZA - Arquivos do Código

Este diretório contém **todos os arquivos de código** necessários para o funcionamento da pizzaria Wilson Pizzaria.

## 📂 Estrutura de Arquivos

### 1. **schema.ts**
- **Tipo**: TypeScript (Código)
- **Origem**: `shared/schema.ts`
- **Função**: Define tipos, interfaces e schemas do banco de dados
- **Uso**: Importado por routes.ts e frontend
- **Principais tipos**:
  - Restaurante
  - Pedidos
  - Clientes
  - Pagamentos

### 2. **routes.ts**
- **Tipo**: TypeScript (Código)
- **Origem**: `server/routes.ts`
- **Função**: Define as rotas HTTP da API
- **Endpoints principais**:
  - `GET /api/restaurant/settings` - Validar horários
  - `POST /api/whatsapp/order` - Enviar pedido à fila
  - `POST /api/stripe/checkout` - Gerar link de pagamento

### 3. **n8n-api.ts**
- **Tipo**: TypeScript (Código)
- **Origem**: `server/n8n-api.ts`
- **Função**: Integração com N8N API
- **Uso**: Atualizar prompts do agente, gerenciar workflows

### 4. **006_create_pizzaria_tables.sql**
- **Tipo**: SQL (Database Migration)
- **Origem**: `db/migrations/006_create_pizzaria_tables.sql`
- **Função**: Cria 4 tabelas no PostgreSQL
- **Tabelas criadas**:
  1. `promotions` - Gerenciar promoções
  2. `delivery_zones` - Taxas e zonas de entrega
  3. `customer_preferences` - Preferências do cliente
  4. `order_status_log` - Log de status de pedidos

### 5. **foodflow-whatsapp-workflow.json**
- **Tipo**: JSON (N8N Workflow)
- **Origem**: Exportação do N8N
- **Função**: Define o workflow completo do WhatsApp
- **Nós principais**:
  - Webhook WhatsApp (entrada)
  - Agente Principal (Wilson)
  - 3 Tools HTTP (Horários, Pedido, Stripe)
  - Webhook WhatsApp (saída)
- **ID do Workflow**: `H5VKBLg9Ne0rGXhe`

### 6. **replit.md**
- **Tipo**: Markdown (Documentação)
- **Origem**: Projeto Replit
- **Função**: Rastreia progresso do projeto, decisões e configurações
- **Conteúdo**:
  - Overview do projeto
  - Recent changes
  - User preferences
  - Project architecture

---

## 🚀 Como Usar Este Diretório

### Se você está **desenvolvendo novo código**:
1. Consulte `schema.ts` para entender tipos disponíveis
2. Implemente endpoints em `routes.ts`
3. Adicione queries SQL em `006_create_pizzaria_tables.sql`

### Se você está **atualizando o agente Wilson**:
1. Edite o prompt manualmente no N8N UI
2. OU use `n8n-api.ts` para atualizar via API

### Se você está **testando o workflow**:
1. Abra N8N: https://n8n-docker-production-6703.up.railway.app
2. ID do workflow: `H5VKBLg9Ne0rGXhe`
3. Teste com mensagem WhatsApp

### Se você está **adicionando novas tables**:
1. Crie nova migration SQL em `db/migrations/`
2. Copie arquivo aqui para referência
3. Execute migration no PostgreSQL

---

## 📝 Próximas Ações (Phase 7)

Consulte **`instruções/MARY_CONSULTING_TOOLS_USAGE.md`** para ver as 5 novas ferramentas propostas que usarão estas tabelas:

1. **Menu Management Tool** - Usar cardápio dinâmico
2. **Customer History Tool** - Reconhecer clientes regulares
3. **Promotions Tool** - Oferecer promoções automáticas
4. **Address Validation Tool** - Validar endereço + taxa entrega
5. **Order Status Tool** - Rastreamento real-time

---

## 🔗 Links Úteis

- **N8N Workflow**: https://n8n-docker-production-6703.up.railway.app/editor/H5VKBLg9Ne0rGXhe
- **Documentação completa**: Ver pasta `instruções/`
- **Replit Project**: https://replit.com/

---

**Última atualização**: Phase 6 (Agente Wilson completo)
**Status**: 99% completo, pronto para testar
