/**
 * TURN 11: Agent Context Manager
 * Injeta contexto do projeto nos agentes
 */

import { storage } from "../storage";
import { ProjectContext } from "@shared/agent-context";

export class AgentContextManager {
  async getProjectContext(tenantId: string): Promise<ProjectContext> {
    const tenant = await storage.getTenantById(tenantId);
    if (!tenant) throw new Error("Tenant not found");

    // Fetch stats from storage
    const allOrders = await storage.getOrders();
    const tenantOrders = allOrders.filter((o: any) => o.tenantId === tenantId);
    
    const allDrivers = await storage.getUsers();
    const tenantDrivers = allDrivers.filter(
      (u: any) => u.role === "driver" && u.tenantId === tenantId
    );

    const allProducts = await storage.getProducts();
    const tenantProducts = allProducts.filter((p: any) => p.tenantId === tenantId);

    // Calculate stats
    const totalOrders = tenantOrders.length;
    const totalDrivers = tenantDrivers.length;
    const avgDeliveryTime = tenantOrders.length > 0 
      ? tenantOrders
          .filter((o: any) => o.status === "delivered")
          .reduce((sum: number, o: any) => {
            const created = new Date(o.createdAt).getTime();
            const now = new Date().getTime();
            return sum + (now - created);
          }, 0) / totalOrders / 60000
      : 0;
    
    const conversionRate = totalOrders > 0 ? 0.75 : 0; // Mock

    // Recent orders
    const recentOrders = tenantOrders
      .sort((a: any, b: any) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      )
      .slice(0, 5)
      .map((o: any) => ({
        id: o.id,
        status: o.status,
        total: parseFloat(o.total),
        createdAt: o.createdAt,
      }));

    // Top products
    const topProducts = tenantProducts
      .slice(0, 5)
      .map((p: any) => ({
        name: p.name,
        sales: Math.floor(Math.random() * 100), // Mock
      }));

    return {
      tenantId,
      tenantName: tenant.name,
      stats: {
        totalOrders,
        totalDrivers,
        avgDeliveryTime: Math.round(avgDeliveryTime),
        conversionRate,
      },
      recentOrders,
      topProducts,
      drivers: tenantDrivers.slice(0, 5).map((d: any) => ({
        id: d.id,
        name: d.name,
        status: d.driverStatus || "offline",
        deliveries: 0, // Would fetch from delivery history
      })),
    };
  }

  injectContextIntoPrompt(
    agentRole: string,
    userInput: string,
    context: ProjectContext
  ): string {
    return `
You are working in the context of ${context.tenantName} (${agentRole}).

📊 Current Metrics:
- Total Orders: ${context.stats.totalOrders}
- Active Drivers: ${context.stats.totalDrivers}
- Avg Delivery Time: ${context.stats.avgDeliveryTime} min
- Conversion Rate: ${(context.stats.conversionRate * 100).toFixed(1)}%

🔝 Top Products:
${context.topProducts.map((p, i) => `${i + 1}. ${p.name} (${p.sales} sales)`).join("\n")}

👥 Active Drivers: ${context.drivers.length} online

Task: ${userInput}

Use this context to provide more relevant, data-informed responses.
    `.trim();
  }
}

export const agentContextManager = new AgentContextManager();
