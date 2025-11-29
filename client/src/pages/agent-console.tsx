import { useState, useEffect } from "react";
import { useAvailableAgents, useExecuteAgentTask } from "@/hooks/use-agent-orchestrator";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Send, Lightbulb, TrendingUp, Users, Package } from "lucide-react";
import type { ProjectContext } from "@shared/agent-context";

export default function AgentConsole() {
  const { toast } = useToast();
  const [taskInput, setTaskInput] = useState("");
  const [selectedAgentId, setSelectedAgentId] = useState<string | null>(null);
  const [result, setResult] = useState<any>(null);
  const [context, setContext] = useState<ProjectContext | null>(null);
  const [loadingContext, setLoadingContext] = useState(false);

  const { data: agentsData, isLoading: loadingAgents } = useAvailableAgents();
  const { execute, isPending: executing } = useExecuteAgentTask();

  // Load project context on mount
  useEffect(() => {
    const loadContext = async () => {
      try {
        setLoadingContext(true);
        const res = await fetch("/api/agents/context", { credentials: "include" });
        if (res.ok) {
          const data = await res.json();
          setContext(data.context);
        }
      } catch (error) {
        console.error("Failed to load context:", error);
      } finally {
        setLoadingContext(false);
      }
    };
    loadContext();
  }, []);

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

        {/* Project Context Cards */}
        {context && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Stats Card */}
            <Card className="p-4 space-y-2" data-testid="card-project-stats">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-primary" />
                <h3 className="font-semibold text-sm" data-testid="text-stats-title">Métricas</h3>
              </div>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Pedidos:</span>
                  <span className="font-medium" data-testid="text-total-orders">{context.stats.totalOrders}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Motoristas:</span>
                  <span className="font-medium" data-testid="text-total-drivers">{context.stats.totalDrivers}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Tempo médio:</span>
                  <span className="font-medium" data-testid="text-avg-delivery">{context.stats.avgDeliveryTime}min</span>
                </div>
              </div>
            </Card>

            {/* Drivers Card */}
            <Card className="p-4 space-y-2" data-testid="card-drivers-status">
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5 text-green-600" />
                <h3 className="font-semibold text-sm" data-testid="text-drivers-title">Motoristas Online</h3>
              </div>
              <div className="space-y-1 text-sm">
                {context.drivers.slice(0, 3).map((driver) => (
                  <div key={driver.id} className="flex justify-between" data-testid={`driver-${driver.id}`}>
                    <span className="text-muted-foreground truncate">{driver.name}</span>
                    <span className="text-xs px-2 py-1 rounded bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                      {driver.status}
                    </span>
                  </div>
                ))}
                {context.drivers.length > 3 && (
                  <div className="text-xs text-muted-foreground pt-1">
                    +{context.drivers.length - 3} mais
                  </div>
                )}
              </div>
            </Card>

            {/* Top Products Card */}
            <Card className="p-4 space-y-2" data-testid="card-top-products">
              <div className="flex items-center gap-2">
                <Package className="h-5 w-5 text-orange-600" />
                <h3 className="font-semibold text-sm" data-testid="text-top-products-title">Top Produtos</h3>
              </div>
              <div className="space-y-1 text-sm">
                {context.topProducts.slice(0, 3).map((product) => (
                  <div key={product.name} className="flex justify-between" data-testid={`product-${product.name}`}>
                    <span className="text-muted-foreground truncate">{product.name}</span>
                    <span className="font-medium">{product.sales}</span>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        )}

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
