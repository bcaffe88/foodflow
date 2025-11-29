/**
 * TURN 11: Agent Context Types
 * Contexto do projeto injetado em agentes
 */

import { z } from "zod";

export interface ProjectContext {
  tenantId: string;
  tenantName: string;
  stats: {
    totalOrders: number;
    totalDrivers: number;
    avgDeliveryTime: number;
    conversionRate: number;
  };
  recentOrders: Array<{
    id: string;
    status: string;
    total: number;
    createdAt: string;
  }>;
  topProducts: Array<{
    name: string;
    sales: number;
  }>;
  drivers: Array<{
    id: string;
    name: string;
    status: string;
    deliveries: number;
  }>;
}

export interface AgentContextRequest {
  input: string;
  type?: string;
  preferredAgent?: string;
  context?: ProjectContext;
}

export interface AgentContextResponse {
  agent: {
    id: string;
    displayName: string;
    icon: string;
    role: string;
  };
  result: string;
  confidence: number;
  processingTime: number;
  contextUsed: Partial<ProjectContext>;
  nextSteps?: string[];
}

export const ProjectContextSchema = z.object({
  tenantId: z.string(),
  tenantName: z.string(),
  stats: z.object({
    totalOrders: z.number(),
    totalDrivers: z.number(),
    avgDeliveryTime: z.number(),
    conversionRate: z.number(),
  }),
  recentOrders: z.array(
    z.object({
      id: z.string(),
      status: z.string(),
      total: z.number(),
      createdAt: z.string(),
    })
  ),
  topProducts: z.array(
    z.object({
      name: z.string(),
      sales: z.number(),
    })
  ),
  drivers: z.array(
    z.object({
      id: z.string(),
      name: z.string(),
      status: z.string(),
      deliveries: z.number(),
    })
  ),
});
