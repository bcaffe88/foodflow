/**
 * useAgentOrchestrator Hook
 * React hook for interacting with the agent orchestrator system
 */

import { useState, useCallback } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { TaskRequest, TaskResponse, Agent, AgentListResponse } from "@shared/agent-types";
import { queryClient, apiRequest } from "@/lib/queryClient";

interface UseAgentOrchestratorState {
  currentAgent: Agent | null;
  taskResult: TaskResponse | null;
  isLoading: boolean;
  error: string | null;
  agents: Agent[];
}

/**
 * Hook for using agent orchestrator
 */
export function useAgentOrchestrator() {
  const [state, setState] = useState<UseAgentOrchestratorState>({
    currentAgent: null,
    taskResult: null,
    isLoading: false,
    error: null,
    agents: [],
  });

  // Fetch available agents
  const { data: agentsData } = useQuery({
    queryKey: ["/api/agents/list"],
    queryFn: async () => {
      const res = await fetch("/api/agents/list", {
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to fetch agents");
      return (await res.json()) as AgentListResponse;
    },
    onSuccess: (data) => {
      setState((prev) => ({
        ...prev,
        agents: data.agents,
      }));
    },
  });

  // Execute task mutation
  const executeTaskMutation = useMutation({
    mutationFn: async (request: TaskRequest) => {
      return apiRequest("/api/agents/execute", {
        method: "POST",
        body: JSON.stringify(request),
      });
    },
  });

  /**
   * Execute a task and get response from agent
   */
  const executeTask = useCallback(
    async (input: string, type?: string, preferredAgent?: string) => {
      setState((prev) => ({
        ...prev,
        isLoading: true,
        error: null,
      }));

      try {
        const request: TaskRequest = {
          input,
          type,
          preferredAgent,
        };

        const response = await executeTaskMutation.mutateAsync(request);

        setState((prev) => ({
          ...prev,
          currentAgent: response.agent,
          taskResult: response,
          isLoading: false,
        }));

        return response;
      } catch (error: any) {
        const errorMessage = error.message || "Failed to execute task";
        setState((prev) => ({
          ...prev,
          isLoading: false,
          error: errorMessage,
        }));
        throw error;
      }
    },
    [executeTaskMutation]
  );

  /**
   * Get specific agent by ID
   */
  const getAgent = useCallback(
    (agentId: string): Agent | undefined => {
      return state.agents.find((a) => a.id === agentId);
    },
    [state.agents]
  );

  /**
   * Clear current result
   */
  const clearResult = useCallback(() => {
    setState((prev) => ({
      ...prev,
      taskResult: null,
      currentAgent: null,
      error: null,
    }));
  }, []);

  return {
    // State
    currentAgent: state.currentAgent,
    taskResult: state.taskResult,
    isLoading: state.isLoading,
    error: state.error,
    agents: state.agents,

    // Actions
    executeTask,
    getAgent,
    clearResult,
  };
}

/**
 * Hook for getting all available agents
 */
export function useAvailableAgents() {
  return useQuery({
    queryKey: ["/api/agents/list"],
    queryFn: async () => {
      const res = await fetch("/api/agents/list", {
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to fetch agents");
      return (await res.json()) as AgentListResponse;
    },
  });
}

/**
 * Hook for executing a task with an agent
 */
export function useExecuteAgentTask() {
  const mutation = useMutation({
    mutationFn: async (request: TaskRequest) => {
      return apiRequest("/api/agents/execute", {
        method: "POST",
        body: JSON.stringify(request),
      });
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/agents/history"] });
    },
  });

  return {
    execute: (input: string, type?: string, preferredAgent?: string) =>
      mutation.mutateAsync({
        input,
        type,
        preferredAgent,
      }),
    isPending: mutation.isPending,
    error: mutation.error,
    data: mutation.data,
    isError: mutation.isError,
  };
}
