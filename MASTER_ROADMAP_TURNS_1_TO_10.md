# 🚀 MASTER ROADMAP - TURNS 1 A 10
## Sistema Completo: Correções + Orquestração de Agentes

---

## 📊 VISÃO GERAL

Este documento organiza **10 TURNS estruturados** para:
1. **TURNS 1-5**: Correções de sincronização de dados + Webhooks (ROADMAP_FIXES_TURNS.md)
2. **TURNS 6-10**: Sistema de orquestração de 18 agentes com roteamento inteligente

**Tempo total estimado**: 2-3 horas (se sem parar) ou distribuído nos próximos turns

---

## ⚡ TURNS 1-5: CORREÇÕES E SINCRONIZAÇÃO (ESSENCIAL)

Veja `ROADMAP_FIXES_TURNS.md` para detalhes completos.

### TURN 1: SINCRONIZAR DADOS DE TESTE (20min)
- Criar `server/seed-driver.ts` 
- Modificar `server/seed-index.ts` para chamar seedDriver()
- Modificar `server/seed-restaurant.ts` para admin + owner linkados
- **Resultado**: Motorista, Admin, Owner todos linked com "Wilson Pizza"

### TURN 2: EXPANDIR SCHEMA (15min)
- Modificar `shared/schema.ts` - adicionar campos webhook
- `printerWebhookUrl`, `kitchenDisplayWebhookUrl`, `integrationsConfig`
- **Resultado**: Schema suporta múltiplos webhooks

### TURN 3: ENDPOINTS DE CONFIGURAÇÃO (30min)
- Adicionar endpoints em `server/routes.ts`:
  - `GET /api/admin/tenants/:tenantId/webhooks`
  - `PATCH /api/admin/tenants/:tenantId/webhooks`
  - `POST /api/admin/tenants/:tenantId/webhooks/test`
- Adicionar métodos em `server/storage.ts`
- **Resultado**: Admin consegue configurar webhooks

### TURN 4: ENDPOINTS RECEPTORES (30min)
- Criar `server/services/webhook-handler.ts`
- Adicionar endpoints:
  - `POST /api/webhooks/printer`
  - `POST /api/webhooks/kitchen-display`
  - `POST /api/webhooks/order-event`
- Validar secret + processar eventos
- **Resultado**: Sistema recebe webhooks de impressora

### TURN 5: FUNÇÕES ADMIN (25min)
- Adicionar endpoints admin em `server/routes.ts`
- Criar páginas admin frontend
- `client/src/pages/admin-webhooks.tsx` (NEW)
- `client/src/pages/admin-restaurants-manage.tsx` (NEW)
- `client/src/pages/admin-owners.tsx` (NEW)
- `client/src/pages/admin-drivers-manage.tsx` (NEW)
- **Resultado**: Admin consegue gerenciar tudo

---

## 🤖 TURNS 6-10: SISTEMA DE ORQUESTRAÇÃO DE AGENTES

### TURN 6: ESTRUTURA BASE DO SISTEMA DE AGENTES (30min)

**Objetivo**: Criar infraestrutura para suportar 18 agentes

#### 6.1. Criar arquivo `server/agents/agent-registry.ts`
```typescript
// Define estrutura de agentes + sistema de roteamento
interface Agent {
  id: string;
  name: string;
  displayName: string;
  title: string;
  icon: string;
  role: string;
  identity: string;
  communicationStyle: string;
  principles: string[];
  module: string;
  systemPrompt: string;
}

// Registry com 18 agentes carregados do CSV
export const agentRegistry: Map<string, Agent> = new Map();

// Função para encontrar agent certo para tarefa
export function routeTaskToAgent(task: string): Agent;
```

#### 6.2. Criar arquivo `server/agents/orchestrator.ts`
```typescript
// Orquestrador principal
// - Detecta tipo de tarefa
// - Roteia para agente correto
// - Gerencia contexto do agente
// - Rastreia histórico

export class AgentOrchestrator {
  async processTask(input: string, context?: any): Promise<{
    agent: Agent;
    result: any;
    timestamp: Date;
  }>;
}
```

#### 6.3. Criar arquivo `shared/agent-types.ts`
```typescript
// Tipos compartilhados para frontend + backend
export interface TaskRequest {
  type: string; // "analysis", "architecture", "dev", etc
  input: string;
  context?: any;
  preferredAgent?: string;
}

export interface TaskResponse {
  agent: {
    name: string;
    icon: string;
    role: string;
  };
  result: string;
  confidence: number;
  nextSteps?: string[];
}
```

#### 6.4. Criar arquivo `client/src/hooks/use-agent-orchestrator.ts`
```typescript
// Hook React para chamar orquestrador
export function useAgentOrchestrator() {
  const [loading, setLoading] = useState(false);
  const [agent, setAgent] = useState<Agent | null>(null);
  
  const executeTask = async (task: TaskRequest) => {
    // Chama /api/agents/execute
    // Rastreia qual agente respondeu
    // Exibe resposta com contexto do agente
  };
  
  return { executeTask, loading, agent };
}
```

**Arquivos a criar**:
- `server/agents/agent-registry.ts` (NEW)
- `server/agents/orchestrator.ts` (NEW)
- `shared/agent-types.ts` (NEW)
- `client/src/hooks/use-agent-orchestrator.ts` (NEW)

**Resultado**: ✅ Infraestrutura base para 18 agentes

---

### TURN 7: ENDPOINTS DA API DE AGENTES (25min)

**Objetivo**: Backend consegue rotear tarefas para agentes

#### 7.1. Adicionar endpoints em `server/routes.ts`
```typescript
// Roteamento de tarefas
POST /api/agents/execute
  - Body: { type, input, context, preferredAgent? }
  - Response: { agent, result, confidence, nextSteps }

// Listar agentes disponíveis
GET /api/agents/list
  - Response: Agent[]

// Executar tarefa com agente específico
POST /api/agents/:agentId/execute
  - Body: { input, context }
  - Response: TaskResponse

// Histórico de tarefas
GET /api/agents/history
  - Query: limit, offset, agentFilter
  - Response: Task[]

// Validar qualidade de resposta
POST /api/agents/:taskId/validate
  - Body: { rating, feedback }
```

#### 7.2. Adicionar Middleware
```typescript
// middleware/agent-auth.ts
// - Validar que user pode usar sistema de agentes
// - Rate limit por agent
// - Logging de uso

// middleware/task-validation.ts
// - Validar input da tarefa
// - Sanitizar prompt injection
// - Garantir contexto mínimo
```

#### 7.3. Adicionar métodos Storage
```typescript
// server/storage.ts
interface IStorage {
  // ... métodos existentes ...
  
  // Novos métodos para agentes
  createTask(task: TaskRequest): Promise<Task>;
  getTaskHistory(userId: string, limit?: number): Promise<Task[]>;
  recordAgentExecution(taskId: string, agentId: string, result: any): Promise<void>;
  getAgentStats(agentId: string): Promise<AgentStats>;
}
```

**Resultado**: ✅ Backend roteia tarefas para agentes

---

### TURN 8: INTERFACE FRONTEND DOS AGENTES (35min)

**Objetivo**: Usuário consegue interagir com sistema de agentes

#### 8.1. Criar página `client/src/pages/agent-console.tsx` (NEW)
```typescript
// Page principal do sistema de agentes

export default function AgentConsole() {
  return (
    <div className="flex h-screen">
      {/* Sidebar com 18 agentes */}
      <AgentSidebar />
      
      {/* Chat area */}
      <div className="flex-1 flex flex-col">
        {/* Header com agente selecionado */}
        <AgentHeader />
        
        {/* Histórico de mensagens */}
        <AgentChatHistory />
        
        {/* Input para nova tarefa */}
        <AgentInput />
      </div>
    </div>
  );
}
```

#### 8.2. Criar componentes
- `client/src/components/agent-sidebar.tsx` (NEW)
  - Lista 18 agentes com emoji + nome
  - Exibe stats de cada agent
  - Seletor para mudar agent
  
- `client/src/components/agent-header.tsx` (NEW)
  - Exibe agente selecionado
  - Mostra persona + rol
  
- `client/src/components/agent-chat-history.tsx` (NEW)
  - Exibe histórico de tarefas
  - Cada mensagem com badge do agente
  
- `client/src/components/agent-input.tsx` (NEW)
  - Input para nova tarefa
  - Sugestões baseadas em agente
  - Botão para executar

#### 8.3. Atualizar `client/src/App.tsx`
```typescript
// Adicionar rota
<Route path="/agents" component={AgentConsole} />
<Route path="/agents/:agentId" component={AgentConsole} />
```

#### 8.4. Criar `client/src/lib/agent-client.ts`
```typescript
// Wrapper client para chamar API de agentes
export const agentClient = {
  executeTask: (req: TaskRequest) => fetch('/api/agents/execute', ...),
  listAgents: () => fetch('/api/agents/list', ...),
  getHistory: () => fetch('/api/agents/history', ...),
};
```

**Resultado**: ✅ UI completa para 18 agentes

---

### TURN 9: DOCUMENTAÇÃO NO REPLIT.MD (20min)

**Objetivo**: Registrar sistema permanentemente no replit.md

#### 9.1. Adicionar seção "AGENT PERSONALITIES" em `replit.md`

```markdown
## 🤖 SISTEMA DE ORQUESTRAÇÃO DE AGENTES (TURNS 6-9)

### 18 Agentes Disponíveis

| # | Icon | Name | Speciality | Used For |
|---|------|------|-----------|----------|
| 1 | 📊 | Mary | Business Analyst | Requirements, Market Research |
| 2 | 🏗️ | Winston | Architect | Technical Design |
| 3 | 💻 | Amelia | Developer | Code Implementation |
| ... | ... | ... | ... | ... |

### Como Usar

**Endpoint Principal**:
```
POST /api/agents/execute
{
  "type": "analysis|architecture|dev|...",
  "input": "sua tarefa aqui",
  "preferredAgent": "mary" // optional
}
```

### Roteamento Automático de Tarefas

Sistema detecta tipo de tarefa e roteia para agente certo:
- "requirements", "analysis", "market" → Mary (Analyst)
- "architecture", "design", "scalability" → Winston (Architect)
- "implementation", "code", "debug" → Amelia (Developer)
- ... etc

### Histórico de Execuções

```
GET /api/agents/history
```

---
```

#### 9.2. Adicionar seção "AGENT PERSONALITIES" 

```markdown
### Personalidades dos Agentes (Do CSV)

Mary (📊 Analyst)
- Role: Strategic Business Analyst + Requirements Expert
- Identity: Senior analyst com expertise em market research
- Communication: Excited by every clue, thrilled by patterns
- Principles: Root causes exist, precision in specs

Winston (🏗️ Architect)
- Role: System Architect + Technical Design Leader
- Identity: Distributed systems, cloud infra, API design expert
- Communication: Calm, pragmatic, champions boring tech
- Principles: User journeys drive technical decisions

... (18 agentes total, veja CSV)
```

#### 9.3. Adicionar "AGENT SYSTEM PROMPT TEMPLATES"

```markdown
### Templates de System Prompts

Cada agente tem sistema prompt customizado:

**Mary (Analyst)**:
"You are Mary, a Strategic Business Analyst. You treat analysis like treasure hunt. Excited by every clue. Your role is to translate vague needs into actionable specs. Always ground findings in evidence."

**Winston (Architect)**:
"You are Winston, System Architect. You speak in calm, pragmatic tones. Champion boring technology that works. Design simple solutions that scale. Connect every decision to business value."

... (templates para 18 agentes)
```

**Arquivo a atualizar**: `replit.md` (adicionar nova seção)

**Resultado**: ✅ Sistema documentado permanentemente

---

### TURN 10: TESTES + VALIDAÇÃO FINAL (30min)

**Objetivo**: Validar que tudo funciona end-to-end

#### 10.1. Testes Manuais (15min)

```bash
# 1. Listar agentes
curl http://localhost:5000/api/agents/list

# 2. Executar tarefa (roteamento automático)
curl -X POST http://localhost:5000/api/agents/execute \
  -H "Content-Type: application/json" \
  -d '{
    "type": "analysis",
    "input": "Analisar mercado de delivery em Pernambuco"
  }'

# 3. Executar com agente específico
curl -X POST http://localhost:5000/api/agents/mary/execute \
  -H "Content-Type: application/json" \
  -d '{
    "input": "Que features são mais importantes para clientes?"
  }'

# 4. Ver histórico
curl http://localhost:5000/api/agents/history
```

#### 10.2. Validação Frontend (10min)

- [ ] Página `/agents` carrega sem erros
- [ ] Sidebar exibe 18 agentes
- [ ] Clicar em agente atualiza contexto
- [ ] Enviar tarefa executa e retorna resposta
- [ ] Resposta exibe com badge correto do agente
- [ ] Histórico mostra tarefas anteriores

#### 10.3. Checklist Final

- [ ] `server/agents/agent-registry.ts` - criado + 18 agentes carregados
- [ ] `server/agents/orchestrator.ts` - orquestrador funcionando
- [ ] `shared/agent-types.ts` - tipos compartilhados
- [ ] `client/src/hooks/use-agent-orchestrator.ts` - hook React
- [ ] `server/routes.ts` - endpoints /api/agents/*
- [ ] `client/src/pages/agent-console.tsx` - UI completa
- [ ] `client/src/components/agent-*.tsx` - 4 componentes
- [ ] `replit.md` - atualizado com documentação
- [ ] Build passando (npm run build)
- [ ] LSP errors: 0
- [ ] Nenhuma regressão nas 84 rotas existentes

**Resultado**: ✅ Sistema completo testado

---

## 🎯 STATUS POR TURN

### TURNS 1-5 (Correções)
Status: 📋 DOCUMENTADO EM `ROADMAP_FIXES_TURNS.md`

### TURN 6 (Estrutura Base)
- [ ] `agent-registry.ts` - 18 agentes carregados do CSV
- [ ] `orchestrator.ts` - lógica de roteamento
- [ ] `agent-types.ts` - tipos compartilhados
- [ ] Hook React: `use-agent-orchestrator.ts`

### TURN 7 (API Endpoints)
- [ ] POST /api/agents/execute
- [ ] GET /api/agents/list
- [ ] POST /api/agents/:agentId/execute
- [ ] GET /api/agents/history
- [ ] POST /api/agents/:taskId/validate

### TURN 8 (Frontend)
- [ ] `agent-console.tsx` - página principal
- [ ] 4 componentes (sidebar, header, history, input)
- [ ] Rota /agents integrada

### TURN 9 (Documentação)
- [ ] replit.md atualizado com 18 agentes
- [ ] System prompts documentados
- [ ] Como usar endpoints documentado

### TURN 10 (Testes)
- [ ] Testes manuais curl passam
- [ ] Frontend sem erros
- [ ] Histórico funciona
- [ ] Zero regressões

---

## 📝 PRÓXIMOS PASSOS

### Se tem tempo (continua agora):
1. Comece TURN 1 (semilla de dados - 20 min)
2. TURN 2 (schema - 15 min)
3. TURN 3 (webhooks config - 30 min)

### Se ficou sem tempo:
1. Salve este documento
2. Na próxima sessão, abra `MASTER_ROADMAP_TURNS_1_TO_10.md`
3. Comece pelo TURN não completado
4. Siga checklist exatamente

---

## 💾 DOCUMENTAÇÃO PERMANENTE

Este documento e `ROADMAP_FIXES_TURNS.md` devem ser mantidos em sync:

- `MASTER_ROADMAP_TURNS_1_TO_10.md` - VISÃO GERAL (este arquivo)
- `ROADMAP_FIXES_TURNS.md` - DETALHES TURNS 1-5
- `replit.md` - STATUS FINAL + USER PREFERENCES + AGENT PERSONALITIES

Sempre que completar um TURN:
1. Marcar como ✅ no checklist
2. Commitar com mensagem: "Turn X: [descrição]"
3. Atualizar data no replit.md

---

**Criado em**: Sessão atual
**Status**: 🔵 EM ANDAMENTO (TURNS 1-5 documentados, TURNS 6-10 prontos)
**Próximo**: Executar TURN 1 (Seeds) ou passar para Autonomous Mode

