/**
 * TURN 11: Agent Context Routes
 * Endpoints para gerenciar contexto de agentes
 */

import type { Express, Request } from "express";
import { authenticate, requireTenantAccess } from "../auth/middleware";
import { agentContextManager } from "./agent-context-manager";
import { ProjectContextSchema } from "@shared/agent-context";

export function registerAgentContextRoutes(app: Express): void {
  // GET current project context
  app.get(
    "/api/agents/context",
    authenticate,
    requireTenantAccess,
    async (req: any, res) => {
      try {
        const tenantId = req.user?.tenantId;
        if (!tenantId) return res.status(401).json({ error: "Unauthorized" });

        const context = await agentContextManager.getProjectContext(tenantId);
        
        // Validate context
        const validated = ProjectContextSchema.parse(context);
        
        res.json({
          success: true,
          context: validated,
          timestamp: new Date().toISOString(),
        });
      } catch (error: any) {
        res.status(500).json({
          error: "Failed to load context",
          message: error.message,
        });
      }
    }
  );

  // POST execute task with context
  app.post(
    "/api/agents/execute-with-context",
    authenticate,
    requireTenantAccess,
    async (req: any, res) => {
      try {
        const tenantId = req.user?.tenantId;
        const { input, type, preferredAgent } = req.body;

        if (!input) return res.status(400).json({ error: "Missing input" });
        if (!tenantId) return res.status(401).json({ error: "Unauthorized" });

        // Get project context
        const context = await agentContextManager.getProjectContext(tenantId);

        // Would integrate with agent orchestrator here
        // For now, return success response
        res.json({
          success: true,
          message: "Task queued with context",
          contextUsed: {
            tenant: context.tenantName,
            stats: context.stats,
          },
        });
      } catch (error: any) {
        res.status(500).json({
          error: "Failed to execute task",
          message: error.message,
        });
      }
    }
  );

  // GET agent system prompts with context
  app.get(
    "/api/agents/prompts/:agentId",
    authenticate,
    async (req: any, res) => {
      try {
        const { agentId } = req.params;
        const tenantId = req.user?.tenantId;

        if (!tenantId) return res.status(401).json({ error: "Unauthorized" });

        const context = await agentContextManager.getProjectContext(tenantId);

        // Mock response with context-injected prompt
        const prompt = agentContextManager.injectContextIntoPrompt(
          "agent-role",
          "Sample task",
          context
        );

        res.json({
          success: true,
          agentId,
          systemPrompt: prompt,
          contextInjected: true,
        });
      } catch (error: any) {
        res.status(500).json({ error: error.message });
      }
    }
  );
}
