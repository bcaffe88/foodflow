import axios, { AxiosInstance } from 'axios';

export interface N8NNode {
  id: string;
  name: string;
  type: string;
  position: [number, number];
  parameters: Record<string, any>;
  credentials?: Record<string, any>;
}

export interface N8NWorkflow {
  id: string;
  name: string;
  nodes: N8NNode[];
  connections: Record<string, any>;
  active: boolean;
}

export interface N8NExecution {
  id: string;
  workflowId: string;
  mode: string;
  startedAt: string;
  stoppedAt: string;
  status: 'success' | 'failed' | 'error' | 'waiting';
  data?: any;
}

/**
 * N8N API Client
 * Handles all N8N workflow management and execution
 */
export class N8NClient {
  private client: AxiosInstance;
  private hostUrl: string;

  constructor(hostUrl: string, apiKey: string) {
    this.hostUrl = hostUrl.replace(/\/$/, ''); // Remove trailing slash
    
    this.client = axios.create({
      baseURL: `${this.hostUrl}/api/v1`,
      headers: {
        'X-N8N-API-KEY': apiKey,
        'Content-Type': 'application/json'
      },
      timeout: 30000
    });

    console.log(`[N8N] Client initialized for: ${this.hostUrl}`);
  }

  /**
   * List all workflows
   */
  async getWorkflows(): Promise<N8NWorkflow[]> {
    try {
      console.log(`[N8N] Fetching workflows...`);
      const response = await this.client.get('/workflows');
      console.log(`[N8N] Found ${response.data.data?.length || 0} workflows`);
      return response.data.data || [];
    } catch (error) {
      console.error(`[N8N] Error fetching workflows:`, error);
      throw error;
    }
  }

  /**
   * Get workflow by name
   */
  async getWorkflowByName(name: string): Promise<N8NWorkflow | null> {
    try {
      const workflows = await this.getWorkflows();
      const workflow = workflows.find(w => w.name === name);
      if (workflow) {
        console.log(`[N8N] Found workflow: ${name}`);
      } else {
        console.log(`[N8N] Workflow not found: ${name}`);
      }
      return workflow || null;
    } catch (error) {
      console.error(`[N8N] Error finding workflow:`, error);
      throw error;
    }
  }

  /**
   * Get workflow by ID
   */
  async getWorkflow(id: string): Promise<N8NWorkflow> {
    try {
      console.log(`[N8N] Fetching workflow: ${id}`);
      const response = await this.client.get(`/workflows/${id}`);
      console.log(`[N8N] Workflow loaded: ${response.data.name}`);
      return response.data;
    } catch (error) {
      console.error(`[N8N] Error fetching workflow:`, error);
      throw error;
    }
  }

  /**
   * Create a new workflow
   */
  async createWorkflow(name: string, nodes: N8NNode[], connections: Record<string, any> = {}): Promise<N8NWorkflow> {
    try {
      console.log(`[N8N] Creating workflow: ${name}`);
      
      const payload = {
        name,
        nodes,
        connections,
        active: false
      };

      const response = await this.client.post('/workflows', payload);
      console.log(`[N8N] Workflow created: ${response.data.id}`);
      return response.data;
    } catch (error) {
      console.error(`[N8N] Error creating workflow:`, error);
      throw error;
    }
  }

  /**
   * Update workflow
   */
  async updateWorkflow(id: string, nodes: N8NNode[], connections: Record<string, any> = {}): Promise<N8NWorkflow> {
    try {
      console.log(`[N8N] Updating workflow: ${id}`);
      
      const payload = {
        nodes,
        connections
      };

      const response = await this.client.patch(`/workflows/${id}`, payload);
      console.log(`[N8N] Workflow updated: ${id}`);
      return response.data;
    } catch (error) {
      console.error(`[N8N] Error updating workflow:`, error);
      throw error;
    }
  }

  /**
   * Activate workflow
   */
  async activateWorkflow(id: string): Promise<void> {
    try {
      console.log(`[N8N] Activating workflow: ${id}`);
      await this.client.post(`/workflows/${id}/activate`);
      console.log(`[N8N] Workflow activated: ${id}`);
    } catch (error) {
      console.error(`[N8N] Error activating workflow:`, error);
      throw error;
    }
  }

  /**
   * Deactivate workflow
   */
  async deactivateWorkflow(id: string): Promise<void> {
    try {
      console.log(`[N8N] Deactivating workflow: ${id}`);
      await this.client.post(`/workflows/${id}/deactivate`);
      console.log(`[N8N] Workflow deactivated: ${id}`);
    } catch (error) {
      console.error(`[N8N] Error deactivating workflow:`, error);
      throw error;
    }
  }

  /**
   * Execute workflow
   */
  async executeWorkflow(id: string, data: Record<string, any>): Promise<N8NExecution> {
    try {
      console.log(`[N8N] Executing workflow: ${id}`);
      
      const response = await this.client.post(`/workflows/${id}/execute`, {
        testData: data
      });

      console.log(`[N8N] Execution started: ${response.data.id || 'async'}`);
      return response.data;
    } catch (error) {
      console.error(`[N8N] Error executing workflow:`, error);
      throw error;
    }
  }

  /**
   * Get execution status
   */
  async getExecution(id: string): Promise<N8NExecution> {
    try {
      const response = await this.client.get(`/executions/${id}`);
      return response.data;
    } catch (error) {
      console.error(`[N8N] Error fetching execution:`, error);
      throw error;
    }
  }

  /**
   * Delete workflow
   */
  async deleteWorkflow(id: string): Promise<void> {
    try {
      console.log(`[N8N] Deleting workflow: ${id}`);
      await this.client.delete(`/workflows/${id}`);
      console.log(`[N8N] Workflow deleted: ${id}`);
    } catch (error) {
      console.error(`[N8N] Error deleting workflow:`, error);
      throw error;
    }
  }

  /**
   * Health check
   */
  async healthCheck(): Promise<boolean> {
    try {
      console.log(`[N8N] Performing health check...`);
      const response = await this.client.get('/health');
      const isHealthy = response.status === 200;
      console.log(`[N8N] Health check: ${isHealthy ? '✅ OK' : '❌ FAILED'}`);
      return isHealthy;
    } catch (error) {
      console.error(`[N8N] Health check failed:`, error);
      return false;
    }
  }

  /**
   * Get N8N instance info
   */
  async getInstanceInfo(): Promise<any> {
    try {
      console.log(`[N8N] Fetching instance info...`);
      const response = await this.client.get('/');
      console.log(`[N8N] Instance version: ${response.data.version}`);
      return response.data;
    } catch (error) {
      console.error(`[N8N] Error fetching instance info:`, error);
      throw error;
    }
  }
}

/**
 * Initialize N8N Client from environment
 */
export function initializeN8NClient(): N8NClient | null {
  const hostUrl = process.env.N8N_HOST;
  const apiKey = process.env.N8N_API_KEY;

  if (!hostUrl || !apiKey) {
    console.warn(`[N8N] Missing credentials. N8N_HOST or N8N_API_KEY not set.`);
    return null;
  }

  return new N8NClient(hostUrl, apiKey);
}
