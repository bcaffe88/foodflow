/**
 * Agent Types & Interfaces
 * Shared types for agent system across frontend and backend
 */

export interface Agent {
  id: string;
  name: string;
  displayName: string;
  icon: string;
  role: string;
  title: string;
  identity: string;
  communicationStyle: string;
  principles: string[];
  module: string;
  systemPrompt: string;
  keywords?: string[];
}

export interface TaskRequest {
  type?: string;
  input: string;
  context?: any;
  preferredAgent?: string;
}

export interface TaskResponse {
  agent: {
    id: string;
    name: string;
    displayName: string;
    icon: string;
    role: string;
  };
  result: string;
  confidence: number;
  timestamp: string;
  processingTime: number;
  nextSteps?: string[];
  metadata?: Record<string, any>;
}

export interface AgentListResponse {
  agents: Agent[];
  total: number;
}

export interface TaskHistoryEntry {
  taskId: string;
  agent: Agent;
  input: string;
  response: TaskResponse;
  timestamp: string;
}
