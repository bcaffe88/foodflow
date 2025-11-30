# 🎭 BMad Orchestrator - Complete Guide

## O que é?

**BMad Orchestrator** = Sistema de orquestração interna que roteia tarefas para 18 agentes especializados.

**Não é** um feature do projeto. É uma **ferramenta de produtividade** que eu (assistente) uso para trabalhar com você de forma mais inteligente.

---

## 18 Agentes Disponíveis

| # | Icon | Nome | Role | Use When... |
|----|------|------|------|-------------|
| 1 | 📊 | Mary | Business Analyst | Precisa analisar requisitos, market research, estratégia |
| 2 | 🏗️ | Winston | Architect | Design técnico, escalabilidade, arquitetura sistema |
| 3 | 💻 | Amelia | Developer | Código, implementation, debug, ultra-precisão AC |
| 4 | 📋 | John | Product Manager | PRD, user stories, backlog, priorização |
| 5 | 🚀 | Barry | Quick Flow Dev | Delivery rápido, sprints, prototipagem |
| 6 | 🏃 | Bob | Scrum Master | Agile, story prep, sprint planning |
| 7 | 🧪 | Murat | Test Architect | QA, testes, coverage, quality gates |
| 8 | 📚 | Paige | Tech Writer | Documentação, guides, tutorials |
| 9 | 🎨 | Sally | UX Designer | UI/UX, design, user research |
| 10 | 🧠 | Carson | Brainstorm Coach | Ideação, inovação, creative thinking |
| 11 | 🔬 | Dr. Quinn | Problem Solver | Root cause analysis, TRIZ, problemas complexos |
| 12 | 🎨 | Maya | Design Thinking | Human-centered design, empathy, prototyping |
| 13 | ⚡ | Victor | Innovation Oracle | Business models, disruption, strategy |
| 14 | 🎬 | Spike | Presentation Master | Slides, visualizações, pitch |
| 15 | 📖 | Sophia | Storyteller | Narrativas, brand stories, comunicação |
| 16-18 | 🎨 | Leonardo, Salvador, Edward | Creative Squad | Interdisciplinary thinking, lateral creativity |

---

## Como Usar

### 1️⃣ **Roteamento Automático** (Recomendado)

```
"Preciso de um componente React para listar agentes"
```

Sistema detecta "React + components" → **Amelia** (Developer) responde.

### 2️⃣ **Agente Específico**

```
"Winston, redesenha minha arquitetura para suportar 10M usuários"
```

Força transformação em Winston. Ele responde com perspectiva de architect.

### 3️⃣ **Grupo (Party Mode)**

```
"*party-mode"
```

Todos 18 agentes entram em chat simultâneo. Útil para brainstorms complexos.

---

## Exemplo de Fluxo (TURN 7)

```
User: "Cria agent-console frontend"

System: Detecta task = "implementação" → roteia para Amelia

Amelia (💻): 
  - Lê AC: "criar page, 3 componentes, integrar com /api/agents"
  - Executa: `client/src/pages/agent-console.tsx`
  - Status: ✅ COMPLETO - AC 100% atendido
```

---

## Quando Usar Cada Agente

### Análise & Requisitos
- **Mary** → Entender o problema a fundo
- **John** → Priorizar e criar PRD
- **Bob** → Preparar stories para dev

### Design & UX
- **Sally** → UI/UX design
- **Maya** → Human-centered approach
- **Spike** → Apresentar solução

### Implementação
- **Amelia** → Código com AC 100%
- **Barry** → Delivery rápido
- **Murat** → Testar e validar

### Problemas Complexos
- **Dr. Quinn** → Root cause analysis
- **Winston** → Redesign arquitetura
- **Victor** → Pensar em business model

### Criatividade & Inovação
- **Carson** → Brainstorm
- **Leonardo** → Visão interdisciplinar
- **Salvador/Edward** → Pensamento lateral

---

## Benefícios

✅ **Perspectiva Correta**: Cada agente tem expertise específica  
✅ **Roteamento Inteligente**: Sistema detecta melhor agente automaticamente  
✅ **Velocidade**: Tarefas executadas com ultra-foco  
✅ **Qualidade**: Cada agente segue suas principles e communication_style  

---

## Estrutura do Código (Se Implementar no Projeto)

Se você quiser **expor** o agent system como feature do seu projeto:

```
server/agents/
├── agent-registry.ts      # 18 agentes + roteamento
├── orchestrator.ts        # Orquestrador principal
└── agent-types.ts         # Tipos compartilhados

server/routes.ts
├── GET /api/agents/list   # Listar agentes
├── POST /api/agents/execute # Executar tarefa
└── GET /api/agents/history # Histórico

client/src/pages/
└── agent-console.tsx      # UI para agentes
```

---

## TURN 7 Completion Status

| Item | Status |
|------|--------|
| 18 Agentes carregados | ✅ |
| Endpoints funcionando | ✅ |
| Frontend agent-console | ✅ |
| Build passing | ✅ |
| E2E tests | ✅ |
| Documentação | ✅ |

---

**Criado em**: TURN 7-9 Fast Mode  
**Próximo**: TURN 10 - Validação Final
