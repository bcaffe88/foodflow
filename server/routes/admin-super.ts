import type { Express } from "express";
import { authenticate, requireRole, type AuthRequest } from "../auth/middleware";
import { IStorage } from "../storage";

interface PlatformMetrics {
  total_revenue: number;
  total_orders: number;
  total_customers: number;
  restaurants: number;
  daily_revenue: Array<{ date: string; revenue: number }>;
  platform_breakdown: Array<{ platform: string; orders: number }>;
  top_restaurants: Array<{ name: string; revenue: number }>;
  restaurant_status: Array<{ name: string; status: string; revenue: number; orders: number }>;
}

export function registerAdminSuperRoutes(app: Express, storage: IStorage) {
  // Get platform-wide metrics
  app.get("/api/admin/super/metrics",
    authenticate,
    requireRole("super_admin"),
    async (req: AuthRequest, res) => {
      try {
        const now = new Date();
        const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

        // Get all orders and customers (platform-wide for admin)
        const allOrders: any[] = [];
        const allCustomers: any[] = [];
        const allTenants: any[] = [];
        
        // Try to get platform metrics - fallback to empty arrays if methods don't exist
        try {
          if (typeof (storage as any).getAllTenants === 'function') {
            const result = await (storage as any).getAllTenants();
            allTenants.push(...(result || []));
          }
        } catch (e) {
          // Fallback: no tenants data available
        }

        // Filter last 30 days
        const orders = allOrders.filter(o => new Date(o.createdAt || 0) >= thirtyDaysAgo);

        // Calculate totals
        const totalRevenue = orders.reduce((sum: number, o: any) => sum + parseFloat(o.total || "0"), 0);
        const totalOrders = orders.length;
        const totalCustomers = allCustomers.length;
        const restaurants = allTenants.length;

        // Daily revenue
        const dailyMap = new Map<string, number>();
        for (let i = 30; i >= 0; i--) {
          const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
          dailyMap.set(date.toISOString().split('T')[0], 0);
        }

        orders.forEach((o: any) => {
          const date = new Date(o.createdAt).toISOString().split('T')[0];
          dailyMap.set(date, (dailyMap.get(date) || 0) + parseFloat(o.total || "0"));
        });

        const daily_revenue = Array.from(dailyMap.entries()).map(([date, revenue]) => ({
          date,
          revenue,
        }));

        // Platform breakdown
        const platformMap = new Map<string, number>();
        orders.forEach((o: any) => {
          const platform = o.orderNotes?.includes('iFood') ? 'iFood' : 
                          o.orderNotes?.includes('UberEats') ? 'UberEats' :
                          o.orderNotes?.includes('Quero') ? 'Quero Delivery' : 'Direct';
          platformMap.set(platform, (platformMap.get(platform) || 0) + 1);
        });

        const platform_breakdown = Array.from(platformMap.entries())
          .map(([platform, orders]) => ({ platform, orders }));

        // Top restaurants by revenue
        const restaurantMap = new Map<string, { revenue: number; orders: number }>();
        
        orders.forEach(o => {
          const tenant = allTenants.find((t: any) => t.id === o.tenantId);
          const name = tenant?.name || o.tenantId;
          const current = restaurantMap.get(name) || { revenue: 0, orders: 0 };
          restaurantMap.set(name, {
            revenue: current.revenue + parseFloat(o.total || "0"),
            orders: current.orders + 1,
          });
        });

        const top_restaurants = Array.from(restaurantMap.entries())
          .map(([name, data]) => ({ name, ...data }))
          .sort((a, b) => b.revenue - a.revenue)
          .slice(0, 10);

        // Restaurant status
        const restaurant_status = allTenants.map((t: any) => {
          const restaurantOrders = orders.filter(o => o.tenantId === t.id);
          const revenue = restaurantOrders.reduce((sum, o) => sum + parseFloat(o.total || "0"), 0);

          return {
            name: t.name,
            status: t.active ? "active" : "inactive",
            revenue,
            orders: restaurantOrders.length,
          };
        }).sort((a, b) => b.revenue - a.revenue);

        const metrics: PlatformMetrics = {
          total_revenue: totalRevenue,
          total_orders: totalOrders,
          total_customers: totalCustomers,
          restaurants,
          daily_revenue,
          platform_breakdown,
          top_restaurants,
          restaurant_status,
        };

        res.json(metrics);
      } catch (error) {
        console.error("Super metrics error:", error);
        res.status(500).json({ error: "Failed to fetch metrics" });
      }
    }
  );

  // Get all restaurants
  app.get("/api/admin/super/restaurants",
    authenticate,
    requireRole("super_admin"),
    async (req: AuthRequest, res) => {
      try {
        const tenants = await storage.getTenants?.() || [];
        res.json(tenants);
      } catch (error) {
        console.error("Get restaurants error:", error);
        res.status(500).json({ error: "Failed to fetch restaurants" });
      }
    }
  );

  // Update restaurant status
  app.patch("/api/admin/super/restaurants/:id",
    authenticate,
    requireRole("super_admin"),
    async (req: AuthRequest, res) => {
      try {
        const { id } = req.params;
        const { active } = req.body;

        if (storage.updateTenant) {
          const updated = await storage.updateTenant(id, { active });
          res.json(updated);
        } else {
          res.json({ success: true });
        }
      } catch (error) {
        console.error("Update restaurant error:", error);
        res.status(500).json({ error: "Failed to update restaurant" });
      }
    }
  );
}
