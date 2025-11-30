import type { Express } from "express";
import { authenticate, requireRole, requireTenantAccess, type AuthRequest } from "../auth/middleware";
import { IStorage } from "../storage";

export function registerAnalyticsRoutes(app: Express, storage: IStorage) {
  // Get analytics data for restaurant
  app.get("/api/restaurant/analytics",
    authenticate,
    requireRole("restaurant_owner"),
    requireTenantAccess,
    async (req: AuthRequest, res) => {
      try {
        const tenantId = req.user!.tenantId!;
        const now = new Date();
        const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

        // Fetch orders for analytics
        const allOrders = await storage.getOrders();
        const orders = allOrders.filter(o => o.tenantId === tenantId && new Date(o.createdAt) >= thirtyDaysAgo);

        // Calculate metrics
        const total = orders.length;
        const completed = orders.filter(o => o.status === "delivered").length;
        const pending = orders.filter(o => o.status === "confirmed" || o.status === "preparing").length;
        const cancelled = orders.filter(o => o.status === "cancelled").length;

        const totalRevenue = orders.reduce((sum, o) => sum + parseFloat(o.total), 0);
        const thisWeekRevenue = orders
          .filter(o => new Date(o.createdAt) >= new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000))
          .reduce((sum, o) => sum + parseFloat(o.total), 0);
        const todayRevenue = orders
          .filter(o => {
            const orderDate = new Date(o.createdAt);
            return orderDate.toDateString() === now.toDateString();
          })
          .reduce((sum, o) => sum + parseFloat(o.total), 0);

        // Get all customers
        const allCustomers = await storage.getCustomers();
        const customers = allCustomers.filter(c => c.tenantId === tenantId);
        const newToday = customers.filter(c => new Date(c.createdAt).toDateString() === now.toDateString()).length;
        const repeat = customers.filter(c => {
          const customerOrders = orders.filter(o => o.customerId === c.id);
          return customerOrders.length > 1;
        }).length;

        // Hourly breakdown
        const hourlyOrders = Array(24).fill(0);
        orders.forEach(o => {
          const hour = new Date(o.createdAt).getHours();
          hourlyOrders[hour]++;
        });

        const hourly_orders = hourlyOrders.map((count, hour) => ({
          hour: `${hour}:00`,
          orders: count,
        }));

        // Daily revenue (last 30 days)
        const dailyMap = new Map<string, number>();
        for (let i = 30; i >= 0; i--) {
          const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
          dailyMap.set(date.toISOString().split('T')[0], 0);
        }

        orders.forEach(o => {
          const date = new Date(o.createdAt).toISOString().split('T')[0];
          dailyMap.set(date, (dailyMap.get(date) || 0) + parseFloat(o.total));
        });

        const daily_revenue = Array.from(dailyMap.entries()).map(([date, revenue]) => ({
          date,
          revenue,
        }));

        // Order status breakdown
        const order_status = [
          { status: "Completos", count: completed },
          { status: "Pendentes", count: pending },
          { status: "Cancelados", count: cancelled },
        ];

        // Top items
        const itemMap = new Map<string, number>();
        for (const order of orders) {
          const items = await storage.getOrderItems(order.id);
          items.forEach(item => {
            itemMap.set(item.name, (itemMap.get(item.name) || 0) + item.quantity);
          });
        }

        const top_items = Array.from(itemMap.entries())
          .map(([name, orders]) => ({ name, orders }))
          .sort((a, b) => b.orders - a.orders)
          .slice(0, 5);

        // Platform breakdown
        const platformMap = new Map<string, number>();
        orders.forEach(o => {
          const platform = o.externalPlatform || "Direct";
          platformMap.set(platform, (platformMap.get(platform) || 0) + 1);
        });

        const platform_breakdown = Array.from(platformMap.entries())
          .map(([platform, orders]) => ({ platform, orders }));

        res.json({
          orders: {
            total,
            completed,
            pending,
            cancelled,
          },
          revenue: {
            today: todayRevenue,
            thisWeek: thisWeekRevenue,
            thisMonth: totalRevenue,
            total: totalRevenue,
          },
          customers: {
            total: customers.length,
            new_today: newToday,
            repeat,
          },
          hourly_orders,
          daily_revenue,
          order_status,
          top_items,
          platform_breakdown,
        });
      } catch (error) {
        console.error("Analytics error:", error);
        res.status(500).json({ error: "Failed to fetch analytics" });
      }
    }
  );
}
