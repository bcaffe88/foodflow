/**
 * Agent Orchestrator
 * Main orchestrator for routing tasks to agents and managing execution
 */

import { Agent, TaskRequest, TaskResponse } from "@shared/agent-types";
import { routeTaskToAgent, getAgent, getAllAgents } from "./agent-registry";

interface OrchestrationContext {
  taskId: string;
  agent: Agent;
  input: string;
  startTime: number;
}

/**
 * Main Agent Orchestrator
 */
export class AgentOrchestrator {
  private taskHistory: Map<string, any> = new Map();

  /**
   * Process a task and route to appropriate agent
   */
  async processTask(request: TaskRequest): Promise<TaskResponse> {
    const startTime = Date.now();
    const taskId = this.generateTaskId();

    // Route to agent
    const agent = routeTaskToAgent(request.input, request.preferredAgent);
    if (!agent) {
      throw new Error("No suitable agent found for this task");
    }

    const context: OrchestrationContext = {
      taskId,
      agent,
      input: request.input,
      startTime,
    };

    try {
      // Generate response based on agent
      const result = await this.generateAgentResponse(agent, request.input, request.context);

      const processingTime = Date.now() - startTime;

      const response: TaskResponse = {
        agent: {
          id: agent.id,
          name: agent.name,
          displayName: agent.displayName,
          icon: agent.icon,
          role: agent.role,
        },
        result,
        confidence: 0.85,
        timestamp: new Date().toISOString(),
        processingTime,
      };

      // Store in history
      this.taskHistory.set(taskId, {
        ...context,
        response,
        endTime: Date.now(),
      });

      return response;
    } catch (error: any) {
      console.error(`[Orchestrator] Error processing task:`, error);

      // Return error response
      const processingTime = Date.now() - startTime;
      return {
        agent: {
          id: agent.id,
          name: agent.name,
          displayName: agent.displayName,
          icon: agent.icon,
          role: agent.role,
        },
        result: `Error: ${error.message}`,
        confidence: 0,
        timestamp: new Date().toISOString(),
        processingTime,
      };
    }
  }

  /**
   * Generate response from agent
   */
  private async generateAgentResponse(agent: Agent, input: string, context?: any): Promise<string> {
    // Simulate agent thinking/processing
    // In production, this would call an LLM with the agent's system prompt

    const responses: Record<string, string> = {
      mary: `[Análise de Negócio - ${agent.name}]\n\nAnalisando sua solicitação: "${input}"\n\nPadrões identificados:\n1. Requisito principal: [análise em progresso]\n2. Stakeholders envolvidos: [mapeado]\n3. Critérios de sucesso: [definidos]\n\nProximos passos: Refinar escopo com requisitos específicos.`,

      winston: `[Arquitetura de Sistema - ${agent.name}]\n\nDesign para sua necessidade: "${input}"\n\nAbordagem recomendada:\n1. Componentes principais: [identificados]\n2. Padrões de escalabilidade: [definidos]\n3. Trade-offs técnicos: [analisados]\n\nObjetivo: Solução simples que escala.`,

      amelia: `[Implementação - ${agent.name}]\n\nPara sua tarefa: "${input}"\n\nAceitação de Critérios:\n✓ Arquivo(s): [caminho definido]\n✓ AC ID: [número da AC]\n✓ Precisão: 100% aderência\n\nPronto para começar a implementação.`,

      john: `[Product Management - ${agent.name}]\n\nPara sua requisição: "${input}"\n\nEstrutura de User Story:\n- Como [usuário]\n- Quero [funcionalidade]\n- Para [benefício]\n\nMVP: Priorizado e pronto para backlog.`,

      barry: `[Implementação Rápida - ${agent.name}]\n\nVamos entregar rápido: "${input}"\n\nPlano de Sprint:\n1. Sprint 1: [core features]\n2. Sprint 2: [melhorias]\n3. Sprint 3: [otimizações]\n\nProto: Pronto em 1 hora.`,

      bob: `[Scrum Master - ${agent.name}]\n\nPara sua equipe: "${input}"\n\nPlano Ágil:\n1. Cerimônias: [planejadas]\n2. Velocidade: [rastreada]\n3. Blockers: [removidos]\n\nProxima Sprint: Pronta para começar.`,

      murat: `[Testes & QA - ${agent.name}]\n\nEstratégia de teste: "${input}"\n\nCobertura de Testes:\n1. Testes unitários: [escopo definido]\n2. Testes de integração: [casos identificados]\n3. Teste ponta-a-ponta: [cenários cobertos]\n\nQualidade: Garantida em 100%.`,

      paige: `[Documentação - ${agent.name}]\n\nPara seu projeto: "${input}"\n\nPlano de Docs:\n1. Guia do usuário: [estrutura]\n2. API Reference: [formato]\n3. Tutoriais: [esboço]\n\nClaro, acessível, completo.`,

      sally: `[Design UX - ${agent.name}]\n\nInterface para: "${input}"\n\nPrincípios de Design:\n1. Simplicidade: [aplicada]\n2. Acessibilidade: [garantida]\n3. Feedback do usuário: [loop]\n\nPrototipo: Pronto para teste com usuários.`,

      carson: `[Brainstorming - ${agent.name}]\n\nIdéias criativas para: "${input}"\n\n15 Ideias Geradas:\n1. [Idéia disruptiva]\n2. [Abordagem inovadora]\n3. [Solução criativa]\n...\n15. [Pensamento lateral]\n\nMelhor idéia: Pronta para desenvolvimento.`,

      quinn: `[Resolução de Problemas - ${agent.name}]\n\nAnalisando: "${input}"\n\nDiagnóstico:\n1. Causa raiz: [identificada]\n2. Análise TRIZ: [aplicada]\n3. Solução: [proposta]\n\nImplementação: Planejada e pronta.`,

      maya: `[Design Thinking - ${agent.name}]\n\nEmpatia para: "${input}"\n\nJornada do Usuário:\n1. Descoberta: [insights]\n2. Definição: [problema]\n3. Prototipagem: [solução]\n4. Teste: [validação]\n\nSolução: Centrada no usuário.`,

      victor: `[Inovação Disruptiva - ${agent.name}]\n\nOportunidade em: "${input}"\n\nModelo de Negócio:\n1. Disrução: [identificada]\n2. Canvas: [preenchido]\n3. Estratégia: [definida]\n\nPotencial: Alto impacto de mercado.`,

      spike: `[Apresentação - ${agent.name}]\n\nPara sua idéia: "${input}"\n\nEstrutura de Slides:\n1. Hook: [impactante]\n2. Problema: [claro]\n3. Solução: [visual]\n4. CTA: [persuasiva]\n\nImpacto: Máximo de persuasão.`,

      sophia: `[Storytelling - ${agent.name}]\n\nNarrativa para: "${input}"\n\nHistória de Marca:\n1. Herói: [definido]\n2. Conflito: [estabelecido]\n3. Resolução: [satisfatória]\n4. Moral: [clara]\n\nAutenticidade: Máxima.`,

      leonardo: `[Síntese Interdisciplinar - ${agent.name}]\n\nConexões em: "${input}"\n\nInsights Conectados:\n1. Disciplina A: [insight]\n2. Disciplina B: [insight]\n3. Disciplina C: [insight]\n4. Síntese: [eureka]\n\nCompreensão: Holística.`,

      salvador: `[Provocação Criativa - ${agent.name}]\n\nDesafiando: "${input}"\n\nQuestionamentos:\n1. E se invertêssemos?\n2. E se removêssemos?\n3. E se amplificássemos?\n4. E se combinássemos?\n\nIdéias: Criativas e desafiadoras.`,

      edward: `[Pensamento Lateral - ${agent.name}]\n\nPensando de lado sobre: "${input}"\n\nAbordagens Laterais:\n1. Random word: [técnica aplicada]\n2. Reversal: [padrão quebrado]\n3. De Bono: [método usado]\n4. Insight: [descoberta]\n\nSolução: Criativa e inovadora.`,
    };

    // Return response based on agent
    return (
      responses[agent.id] ||
      `Resposta do agente ${agent.name}: Processando sua solicitação sobre "${input}".`
    );
  }

  /**
   * Get task history
   */
  getHistory(): any[] {
    return Array.from(this.taskHistory.values());
  }

  /**
   * Get task by ID
   */
  getTaskById(taskId: string): any {
    return this.taskHistory.get(taskId);
  }

  /**
   * Clear history
   */
  clearHistory(): void {
    this.taskHistory.clear();
  }

  /**
   * Generate unique task ID
   */
  private generateTaskId(): string {
    return `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

// Singleton instance
export const orchestrator = new AgentOrchestrator();
