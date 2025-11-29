import { useState } from "react";
import { useAvailableAgents, useExecuteAgentTask } from "@/hooks/use-agent-orchestrator";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Send, Lightbulb } from "lucide-react";

export default function AgentConsole() {
  const { toast } = useToast();
  const [taskInput, setTaskInput] = useState("");
  const [selectedAgentId, setSelectedAgentId] = useState<string | null>(null);
  const [result, setResult] = useState<any>(null);

  const { data: agentsData, isLoading: loadingAgents } = useAvailableAgents();
  const { execute, isPending: executing } = useExecuteAgentTask();

  const handleExecuteTask = async () => {
    if (!taskInput.trim()) {
      toast({ title: "Tarefa vazia", variant: "destructive" });
      return;
    }

    try {
      const response = await execute(taskInput, undefined, selectedAgentId || undefined);
      setResult(response);
      toast({
        title: `${response.agent.displayName} respondeu`,
        description: "Tarefa executada com sucesso",
      });
    } catch (error: any) {
      toast({
        title: "Erro na execução",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  if (loadingAgents) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  const agents = agentsData?.agents || [];

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-4xl font-bold mb-2" data-testid="text-agent-console-title">
            🎭 Agent Console
          </h1>
          <p className="text-muted-foreground" data-testid="text-agent-description">
            Orquestre 16+ agentes especializados para suas tarefas. Roteia automaticamente ou escolha um agente específico.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left: Agents List */}
          <div className="lg:col-span-1 space-y-3">
            <h2 className="text-xl font-semibold" data-testid="text-agents-list-title">
              Agentes Disponíveis
            </h2>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {agents.map((agent) => (
                <button
                  key={agent.id}
                  onClick={() => setSelectedAgentId(selectedAgentId === agent.id ? null : agent.id)}
                  className={`w-full text-left p-3 rounded-lg border-2 transition-colors ${
                    selectedAgentId === agent.id
                      ? "border-primary bg-primary/10"
                      : "border-border hover:border-primary/50"
                  }`}
                  data-testid={`button-agent-${agent.id}`}
                >
                  <div className="flex items-start gap-2">
                    <span className="text-xl">{agent.icon}</span>
                    <div className="min-w-0">
                      <div className="font-semibold text-sm">{agent.displayName}</div>
                      <div className="text-xs text-muted-foreground truncate">{agent.role}</div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
            {selectedAgentId && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedAgentId(null)}
                className="w-full"
                data-testid="button-clear-agent"
              >
                Limpar Agente
              </Button>
            )}
          </div>

          {/* Right: Task Input & Results */}
          <div className="lg:col-span-2 space-y-4">
            {/* Task Input */}
            <Card className="p-6 space-y-4">
              <h2 className="text-lg font-semibold" data-testid="text-task-input-title">
                Sua Tarefa
              </h2>

              <textarea
                value={taskInput}
                onChange={(e) => setTaskInput(e.target.value)}
                placeholder="Descreva sua tarefa, requisito ou pergunta. O agente certo será roteado automaticamente (ou use um específico)."
                className="w-full min-h-24 p-3 border rounded-lg bg-background resize-none"
                data-testid="textarea-task-input"
              />

              <div className="flex gap-2 flex-wrap">
                <Button
                  onClick={handleExecuteTask}
                  disabled={executing || !taskInput.trim()}
                  className="flex-1"
                  data-testid="button-execute-task"
                >
                  {executing ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Executando...
                    </>
                  ) : (
                    <>
                      <Send className="mr-2 h-4 w-4" />
                      Executar Tarefa
                    </>
                  )}
                </Button>
              </div>

              {selectedAgentId && (
                <div className="p-3 bg-primary/10 rounded-lg text-sm" data-testid="div-selected-agent-info">
                  <strong>Agente Selecionado:</strong> {agents.find((a) => a.id === selectedAgentId)?.displayName}
                </div>
              )}
            </Card>

            {/* Result */}
            {result && (
              <Card className="p-6 space-y-3 bg-card border-primary/20">
                <div className="flex items-start gap-3">
                  <span className="text-3xl">{result.agent.icon}</span>
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg" data-testid="text-result-agent-name">
                      {result.agent.displayName}
                    </h3>
                    <p className="text-sm text-muted-foreground" data-testid="text-result-role">
                      {result.agent.role}
                    </p>
                  </div>
                </div>

                <div className="border-t pt-4">
                  <div
                    className="prose prose-sm max-w-none dark:prose-invert whitespace-pre-wrap"
                    data-testid="div-result-content"
                  >
                    {result.result}
                  </div>
                </div>

                <div className="flex gap-4 text-xs text-muted-foreground pt-2 border-t">
                  <div data-testid="text-confidence">
                    <strong>Confiança:</strong> {(result.confidence * 100).toFixed(0)}%
                  </div>
                  <div data-testid="text-processing-time">
                    <strong>Tempo:</strong> {result.processingTime}ms
                  </div>
                </div>
              </Card>
            )}

            {/* Tips */}
            {!result && (
              <Card className="p-4 bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800">
                <div className="flex gap-3">
                  <Lightbulb className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                  <div className="text-sm space-y-1" data-testid="div-tips">
                    <p className="font-semibold text-blue-900 dark:text-blue-100">Dicas:</p>
                    <ul className="list-disc list-inside text-blue-800 dark:text-blue-200 space-y-1">
                      <li>Escreva tarefas específicas para melhor roteamento</li>
                      <li>Escolha um agente para forçar perspectiva especializada</li>
                      <li>Use palavras-chave: análise, código, design, teste, etc</li>
                    </ul>
                  </div>
                </div>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
