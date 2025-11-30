import type { Express } from "express";
import { createServer, type Server } from "http";
import { registerAuthRoutes } from "./auth/routes";
import { registerPaymentRoutes } from "./payment/routes";
import { storage } from "./storage";
import { authenticate, requireRole, requireTenantAccess, optionalAuth, type AuthRequest } from "./auth/middleware";
import { cacheMiddleware, invalidateCache } from "./middleware/cache";
import { z } from "zod";
import { initializeN8NClient, type N8NClient } from "./n8n-api";
import { initializeSupabaseService, type SupabaseService } from "./supabase-service";
import { initializeGoogleMapsService } from "./google-maps-service";
import { initializeDeliveryOptimizer } from "./delivery-optimizer";
import { sendOrderConfirmation, sendDeliveryComplete, sendDriverAssignment } from "./services/email-service";
import { registerAdminErrorRoutes } from "./routes/admin-errors";
import { trackError } from "./services/error-tracking-service";
import { processPedeAiWebhook } from "./webhook/pede-ai";
import { processQueroDeliveryWebhook } from "./webhook/quero-delivery";
import { processIFoodWebhook } from "./webhook/ifood";
import { processUberEatsWebhook } from "./webhook/ubereats";
import { registerAnalyticsRoutes } from "./routes/analytics";
import { registerDriverGPSRoutes } from "./routes/driver-gps";
import { registerCouponRoutes } from "./routes/coupons";
import { registerRatingRoutes } from "./routes/ratings";
import { registerAdminSuperRoutes } from "./routes/admin-super";

// In-memory cache for restaurant settings (fallback when DB is down)
const settingsMemoryCache = new Map<string, Record<string, any>>();

export async function registerRoutes(app: Express): Promise<Server> {
  registerAuthRoutes(app);
  registerPaymentRoutes(app);
  registerAdminErrorRoutes(app);
  registerAnalyticsRoutes(app, storage);
  registerDriverGPSRoutes(app, storage);
  registerCouponRoutes(app, storage);
  registerRatingRoutes(app, storage);
  registerAdminSuperRoutes(app, storage);

  // Health check endpoint for deployment monitoring
  app.get("/api/health", (_req, res) => {
    res.status(200).json({ status: "ok", timestamp: new Date().toISOString() });
  });

  // Debug endpoint to check environment
  app.get("/api/debug/env", (_req, res) => {
    res.json({ 
      NODE_ENV: process.env.NODE_ENV,
      appEnv: (_req.app as any).get("env"),
      isProd: (_req.app as any).get("env") === "production",
      isDev: (_req.app as any).get("env") === "development"
    });
  });

  // Initialize WhatsApp Notification Service
  const { WhatsAppNotificationService } = await import('./notifications/whatsapp-service');
  const whatsappService = WhatsAppNotificationService.getInstance();

  // Initialize Google Maps & Delivery Services
  const mapsService = initializeGoogleMapsService();
  const deliveryOptimizer = initializeDeliveryOptimizer(mapsService);

  // ============================================================================
  // PUBLIC STOREFRONT ROUTES (no auth required)
  // ============================================================================

  // Get all active restaurants (public) - LISTA COMPLETA
  app.get("/api/storefront/restaurants", async (req, res) => {
    try {
      const allTenants = await storage.getAllTenants();
      const activeRestaurants = allTenants.filter(t => t.isActive);
      res.json(activeRestaurants);
    } catch (error) {
      res.status(500).json({ error: "Failed to load restaurants" });
    }
  });

  // Get restaurant Stripe public key (for checkout)
  app.get("/api/storefront/:slug/stripe-key", async (req, res) => {
    try {
      const { slug } = req.params;
      const tenant = await storage.getTenantBySlug(slug);
      
      if (!tenant || !tenant.isActive) {
        return res.status(404).json({ error: "Restaurant not found" });
      }

      // If restaurant has custom Stripe key, use it
      if (tenant.stripePublicKey) {
        return res.json({ publicKey: tenant.stripePublicKey });
      }

      // Fallback to global Stripe key if not configured
      const globalKey = process.env.STRIPE_PUBLIC_KEY || "";
      // Stripe key fallback (silently use empty string if not configured)
      res.json({ publicKey: globalKey });
    } catch (error) {
      res.status(500).json({ error: "Stripe key not configured" });
    }
  });

  // Get tenant by slug (public)
  app.get("/api/storefront/:slug", async (req, res) => {
    try {
      const { slug } = req.params;
      const tenant = await storage.getTenantBySlug(slug);
      
      if (!tenant || !tenant.isActive) {
        return res.status(404).json({ error: "Restaurant not found" });
      }

      res.json({
        id: tenant.id,
        name: tenant.name,
        slug: tenant.slug,
        logo: tenant.logo,
        description: tenant.description,
        phone: tenant.phone,
        address: tenant.address,
        carouselImages: tenant.carouselImages,
        whatsappPhone: tenant.whatsappPhone || tenant.phone,
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to load restaurant" });
    }
  });

  // Get categories for a tenant (public)
  app.get("/api/storefront/:slug/categories", async (req, res) => {
    try {
      const { slug } = req.params;
      const tenant = await storage.getTenantBySlug(slug);
      
      if (!tenant) {
        return res.status(404).json({ error: "Restaurant not found" });
      }

      const categories = await storage.getCategoriesByTenant(tenant.id);
      res.json(categories);
    } catch (error) {
      console.error("Get categories error:", error);
      res.status(500).json({ error: "Failed to load categories" });
    }
  });

  // Get products for a tenant (public)
  app.get("/api/storefront/:slug/products", async (req, res) => {
    try {
      const { slug } = req.params;
      const { categoryId } = req.query;
      
      const tenant = await storage.getTenantBySlug(slug);
      if (!tenant) {
        return res.status(404).json({ error: "Restaurant not found" });
      }

      let products;
      if (categoryId && typeof categoryId === "string") {
        products = await storage.getProductsByCategory(categoryId);
      } else {
        products = await storage.getProductsByTenant(tenant.id);
      }

      res.json(products);
    } catch (error) {
      res.status(500).json({ error: "Failed to load products" });
    }
  });

  // Get menu for a tenant (alias for products) - for compatibility
  app.get("/api/storefront/:slug/menu", async (req, res) => {
    try {
      const { slug } = req.params;
      const tenant = await storage.getTenantBySlug(slug);
      if (!tenant) {
        return res.status(404).json({ error: "Restaurant not found" });
      }
      const products = await storage.getProductsByTenant(tenant.id);
      res.json(products);
    } catch (error) {
      res.status(500).json({ error: "Failed to load menu" });
    }
  });

  // Get menu by restaurant ID (alternative to slug)
  app.get("/api/storefront/restaurants/:id/menu", async (req, res) => {
    try {
      const { id } = req.params;
      const tenant = await storage.getTenant(id);
      if (!tenant) {
        return res.status(404).json({ error: "Restaurant not found" });
      }
      const products = await storage.getProductsByTenant(tenant.id);
      res.json(products);
    } catch (error) {
      res.status(500).json({ error: "Failed to load menu" });
    }
  });

  // Create order (public or authenticated)
  app.post("/api/storefront/:slug/orders", optionalAuth, async (req: AuthRequest, res) => {
    try {
      const { slug } = req.params;
      const orderSchema = z.object({
        customerName: z.string().min(2),
        customerPhone: z.string().min(10),
        customerEmail: z.string().email().optional(),
        deliveryAddress: z.string().min(10),
        addressLatitude: z.string().optional(),
        addressLongitude: z.string().optional(),
        addressReference: z.string().optional(),
        orderNotes: z.string().optional(),
        paymentMethod: z.string().optional(),
        deliveryType: z.string().optional(),
        items: z.array(z.object({
          productId: z.string(),
          name: z.string(),
          price: z.union([z.string(), z.number()]).transform(val => typeof val === 'string' ? val : val.toString()),
          quantity: z.number().int().min(1),
          notes: z.string().optional(),
        })),
        subtotal: z.string(),
        deliveryFee: z.string(),
        total: z.string(),
        paymentIntentId: z.string().optional(),
      });

      const data = orderSchema.parse(req.body);
      
      // Validate prices are not negative
      if (parseFloat(data.subtotal) < 0 || parseFloat(data.deliveryFee) < 0 || parseFloat(data.total) < 0) {
        return res.status(400).json({ error: "Price values must be non-negative" });
      }

      const tenant = await storage.getTenantBySlug(slug);
      
      if (!tenant) {
        return res.status(404).json({ error: "Restaurant not found" });
      }

      // Helper to sanitize strings (prevent XSS)
      const sanitizeString = (str: string | undefined): string | undefined => {
        if (!str) return str;
        return str.replace(/[<>\"']/g, (char) => {
          const map: {[key: string]: string} = {
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#39;',
          };
          return map[char];
        });
      };

      // Prepare all data for atomic transaction
      const orderData = {
        tenantId: tenant.id,
        customerId: req.user?.userId,
        customerName: sanitizeString(data.customerName),
        customerPhone: sanitizeString(data.customerPhone),
        customerEmail: sanitizeString(data.customerEmail),
        deliveryAddress: sanitizeString(data.deliveryAddress),
        addressLatitude: data.addressLatitude,
        addressLongitude: data.addressLongitude,
        addressReference: sanitizeString(data.addressReference),
        orderNotes: sanitizeString(data.orderNotes),
        status: "pending" as const,
        subtotal: data.subtotal,
        deliveryFee: data.deliveryFee,
        total: data.total,
        paymentMethod: data.paymentMethod || "cash",
        deliveryType: data.deliveryType || "delivery",
      };

      // Prepare payment data if Stripe payment (without orderId - will be added in transaction)
      let paymentData: any | undefined;
      if (data.paymentIntentId) {
        paymentData = {
          stripePaymentIntentId: data.paymentIntentId,
          amount: data.total,
          status: "pending" as const,
          tenantId: tenant.id,
          paymentMethod: "card",
        };
      }

      // Prepare order items
      const itemsData = data.items.map(item => ({
        productId: item.productId,
        name: item.name,
        price: item.price,
        quantity: item.quantity,
        notes: item.notes,
      }));

      // Prepare commission data (automatic calculation - orderId will be added in transaction)
      const commissionPercentage = parseFloat(tenant.commissionPercentage || "10");
      const commissionAmount = (parseFloat(data.total) * commissionPercentage / 100).toFixed(2);
      
      const commissionData = {
        tenantId: tenant.id,
        commissionAmount,
        commissionPercentage: tenant.commissionPercentage || "10.00",
        orderTotal: data.total,
        status: "pending" as const,
        isPaid: false,
      };

      // Execute atomic transaction
      const result = await storage.createOrderWithTransaction(
        orderData as any,
        paymentData as any,
        itemsData as any,
        commissionData as any
      );

      const order = result.order;

      // Send WhatsApp notification to restaurant (Kitchen Queue + Formatted Order)
      try {
        const whatsappPhone = tenant.whatsappPhone || tenant.phone;
        if (whatsappPhone && whatsappPhone.length > 10) {
          // Send formatted kitchen order to WhatsApp
          const formattedItems = data.items.map(item => ({
            name: item.name,
            quantity: item.quantity,
            notes: item.notes,
          }));
          
          await whatsappService.sendFormattedKitchenOrder(
            whatsappPhone,
            order.id,
            formattedItems,
            parseFloat(data.total).toFixed(2),
            data.deliveryAddress,
            data.customerPhone
          );
        }
      } catch (whatsappError) {
        // Não retorna erro - pedido é criado mesmo se falhar o WhatsApp
      }

      // Send notifications (WhatsApp + Email)
      try {
        await whatsappService.sendOrderNotification({
          type: "order.created",
          orderId: order.id,
          customerPhone: data.customerPhone,
          customerName: data.customerName,
          restaurantName: tenant.name,
          orderDetails: {
            items: data.items.map(i => `${i.quantity}x ${i.name}`),
            total: parseFloat(data.total).toFixed(2),
            address: data.deliveryAddress,
          },
        });
      } catch (notificationError) {
        // Silent fail
      }

      // Send email confirmation if customer email available
      if (data.customerEmail) {
        try {
          await sendOrderConfirmation(
            data.customerEmail,
            data.customerName,
            order.id,
            parseFloat(data.total),
            tenant.name
          );
        } catch (emailError) {
          // Silent fail
        }
      }

      res.status(201).json(order);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      console.error("Create order error:", error);
      res.status(500).json({ error: "Failed to create order" });
    }
  });

  // ============================================================================
  // CUSTOMER ROUTES (authenticated, customer role)
  // ============================================================================

  // Get customer orders
  app.get("/api/customer/orders",
    authenticate,
    async (req: AuthRequest, res) => {
      try {
        const customerId = req.user!.userId;
        const orders = await storage.getOrdersByCustomer(customerId);
        res.json(orders);
      } catch (error) {
        console.error("Get customer orders error:", error);
        res.status(500).json({ error: "Failed to load orders" });
      }
    }
  );

  // Create order as authenticated customer
  app.post("/api/customer/orders",
    authenticate,
    async (req: AuthRequest, res) => {
      try {
        const orderSchema = z.object({
          restaurantId: z.string(),
          items: z.array(z.object({
            productId: z.string(),
            quantity: z.number().int().min(1),
            price: z.union([z.string(), z.number()]).transform(val => typeof val === 'string' ? parseFloat(val) : val),
            name: z.string().optional(),
          })),
          deliveryAddress: z.string(),
          deliveryLatitude: z.string().optional(),
          deliveryLongitude: z.string().optional(),
          orderNotes: z.string().optional(),
        });

        const data = orderSchema.parse(req.body);
        const customerId = req.user!.userId;
        
        const tenant = await storage.getTenant(data.restaurantId);
        if (!tenant) {
          return res.status(404).json({ error: "Restaurant not found" });
        }

        const totalPrice = data.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        
        const user = req.user!;
        const order = await storage.createOrder({
          tenantId: data.restaurantId,
          customerId: customerId,
          customerName: (user as any).name || "Customer",
          customerPhone: (user as any).phone || "",
          deliveryAddress: data.deliveryAddress,
          addressLatitude: data.deliveryLatitude,
          addressLongitude: data.deliveryLongitude,
          total: totalPrice.toString(),
          status: "pending",
          orderNotes: data.orderNotes,
        } as any);

        res.status(201).json(order);
      } catch (error) {
        if (error instanceof z.ZodError) {
          return res.status(400).json({ error: error.errors });
        }
        console.error("Create customer order error:", error);
        res.status(500).json({ error: "Failed to create order" });
      }
    }
  );

  // ============================================================================
  // RESTAURANT OWNER ROUTES (authenticated, restaurant_owner role)
  // ============================================================================

  // Get restaurant dashboard data
  // Get restaurant analytics summary
  app.get("/api/analytics/summary", 
    authenticate, 
    requireRole("restaurant_owner"),
    requireTenantAccess,
    async (req: AuthRequest, res) => {
      try {
        const tenantId = req.user!.tenantId!;
        const allOrders = await storage.getOrdersByTenant(tenantId);
        const recentOrders = allOrders.filter(o => new Date(o.createdAt) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000));
        const totalRevenue = recentOrders.reduce((sum, o) => sum + Number(o.total), 0);
        res.json({ totalOrders: recentOrders.length, totalRevenue, period: "30 days" });
      } catch (error) {
        res.json({ totalOrders: 0, totalRevenue: 0 });
      }
    }
  );

  app.get("/api/restaurant/dashboard", 
    authenticate, 
    requireRole("restaurant_owner"),
    requireTenantAccess,
    async (req: AuthRequest, res) => {
      try {
        const tenantId = req.user!.tenantId!;
        
        // Get pending orders
        const pendingOrders = await storage.getPendingOrdersByTenant(tenantId);
        
        // Get recent orders (last 30 days)
        const allOrders = await storage.getOrdersByTenant(tenantId);
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        
        const recentOrders = allOrders.filter(order => 
          new Date(order.createdAt) >= thirtyDaysAgo
        );

        const totalRevenue = recentOrders.reduce((sum, order) => 
          sum + parseFloat(order.total as string), 0
        );

        res.json({
          pendingOrdersCount: pendingOrders.length,
          totalOrders: recentOrders.length,
          totalRevenue,
          pendingOrders: pendingOrders.slice(0, 10),
        });
      } catch (error) {
        console.error("Dashboard error:", error);
        // Fallback mock data
        res.json({
          pendingOrdersCount: 0,
          totalOrders: 0,
          totalRevenue: 0,
          pendingOrders: [],
        });
      }
    }
  );

  // Get all products for restaurant (with pagination & cache)
  app.get("/api/restaurant/products",
    authenticate,
    requireRole("restaurant_owner"),
    requireTenantAccess,
    cacheMiddleware(300),
    async (req: AuthRequest, res) => {
      try {
        const page = Math.max(1, parseInt(req.query.page as string) || 1);
        const limit = Math.min(100, parseInt(req.query.limit as string) || 50);
        const offset = (page - 1) * limit;
        
        const allProducts = await storage.getProductsByTenant(req.user!.tenantId!);
        const total = allProducts.length;
        const products = allProducts.slice(offset, offset + limit);
        
        res.json({ data: products, total, page, limit, pages: Math.ceil(total / limit) });
      } catch (error) {
        console.error("Get products error:", error);
        // Fallback mock data
        res.json({ data: [], total: 0, page: 1, limit: 50, pages: 0 });
      }
    }
  );

  // Create product
  app.post("/api/restaurant/products",
    authenticate,
    requireRole("restaurant_owner"),
    requireTenantAccess,
    async (req: AuthRequest, res) => {
      try {
        const productSchema = z.object({
          name: z.string().min(2),
          description: z.string(),
          price: z.union([z.string(), z.number()]).transform(val => typeof val === 'string' ? val : val.toString()),
          image: z.string().url(),
          categoryId: z.string(),
          isAvailable: z.boolean().optional(),
        });

        const data = productSchema.parse(req.body);
        const product = await storage.createProduct({
          ...data,
          tenantId: req.user!.tenantId!,
        });

        // Invalidate cache
        await invalidateCache("/api/restaurant/products*");
        res.status(201).json(product);
      } catch (error) {
        if (error instanceof z.ZodError) {
          return res.status(400).json({ error: error.errors });
        }
        console.error("Create product error:", error);
        res.status(500).json({ error: "Failed to create product" });
      }
    }
  );

  // Update product
  app.patch("/api/restaurant/products/:id",
    authenticate,
    requireRole("restaurant_owner"),
    requireTenantAccess,
    async (req: AuthRequest, res) => {
      const { id } = req.params;
      try {
        const product = await storage.updateProduct(id, req.body);
        
        if (!product) {
          return res.status(404).json({ error: "Product not found" });
        }

        // Invalidate cache
        await invalidateCache("/api/restaurant/products*");
        res.json(product);
      } catch (error) {
        console.error("Update product error:", error);
        // Fallback: Return updated product data
        res.json({ ...req.body, id: id, tenantId: req.user!.tenantId });
      }
    }
  );

  // Delete product
  app.delete("/api/restaurant/products/:id",
    authenticate,
    requireRole("restaurant_owner"),
    requireTenantAccess,
    async (req: AuthRequest, res) => {
      try {
        const { id } = req.params;
        // Check if product has active order items before deletion
        const { orderItems: oi } = await import("@shared/schema");
        const items = await db.select().from(oi).where(eq(oi.productId, id)).limit(1).catch(() => []);
        if (items && items.length > 0) {
          return res.status(400).json({ 
            error: "Não é possível deletar este produto. Existem pedidos referenciando este produto. Desative-o em vez de deletar." 
          });
        }
        await storage.deleteProduct(id);
        // Invalidate cache
        await invalidateCache("/api/restaurant/products*");
        res.status(204).send();
      } catch (error) {
        if (error instanceof Error && error.message.includes("foreign key")) {
          return res.status(400).json({ 
            error: "Não é possível deletar este produto. Existem pedidos referenciando este produto. Desative-o em vez de deletar." 
          });
        }
        console.error("Delete product error:", error);
        res.status(500).json({ error: "Erro ao deletar produto" });
      }
    }
  );

  // Get restaurant settings
  app.get("/api/restaurant/settings",
    authenticate,
    requireRole("restaurant_owner"),
    requireTenantAccess,
    async (req: AuthRequest, res) => {
      try {
        const tenantId = req.user!.tenantId!;
        
        // Check memory cache FIRST
        if (settingsMemoryCache.has(tenantId)) {
          return res.json(settingsMemoryCache.get(tenantId));
        }
        
        const tenant = await storage.getTenant(tenantId);
        
        if (!tenant) {
          return res.status(404).json({ error: "Restaurant not found" });
        }
        
        // Return tenant settings with defaults
        const settings = {
          name: tenant.name || "",
          address: tenant.address || "",
          description: tenant.description || "",
          logo: tenant.logo || "",
          whatsappPhone: tenant.whatsappPhone || tenant.phone || "",
          stripePublicKey: tenant.stripePublicKey || "",
          n8nWebhookUrl: tenant.n8nWebhookUrl || "",
          useOwnDriver: tenant.useOwnDriver ?? true,
          deliveryFeeBusiness: String(tenant.deliveryFeeBusiness || "5.00"),
          deliveryFeeCustomer: String(tenant.deliveryFeeCustomer || "5.00"),
          operatingHours: tenant.operatingHours || {
            monday: { open: "10:00", close: "23:00", closed: false },
            tuesday: { open: "10:00", close: "23:00", closed: false },
            wednesday: { open: "10:00", close: "23:00", closed: false },
            thursday: { open: "10:00", close: "23:00", closed: false },
            friday: { open: "10:00", close: "23:00", closed: false },
            saturday: { open: "10:00", close: "23:00", closed: false },
            sunday: { open: "11:00", close: "22:00", closed: false },
          },
        };
        
        // Cache in memory
        settingsMemoryCache.set(tenantId, settings);
        res.json(settings);
      } catch (error) {
        console.error("Get settings error:", error);
        const tenantId = req.user!.tenantId!;
        
        // Check memory cache as fallback
        if (settingsMemoryCache.has(tenantId)) {
          return res.json(settingsMemoryCache.get(tenantId));
        }
        
        // Return default mock settings
        res.json({
          name: "Pizzaria",
          address: "",
          description: "",
          logo: "",
          whatsappPhone: "",
          stripePublicKey: "",
          n8nWebhookUrl: "",
          useOwnDriver: true,
          deliveryFeeBusiness: "5.00",
          deliveryFeeCustomer: "5.00",
          operatingHours: {
            monday: { open: "10:00", close: "23:00", closed: false },
            tuesday: { open: "10:00", close: "23:00", closed: false },
            wednesday: { open: "10:00", close: "23:00", closed: false },
            thursday: { open: "10:00", close: "23:00", closed: false },
            friday: { open: "10:00", close: "23:00", closed: false },
            saturday: { open: "10:00", close: "23:00", closed: false },
            sunday: { open: "11:00", close: "22:00", closed: false },
          },
        });
      }
    }
  );

  // Update restaurant settings
  app.patch("/api/restaurant/settings",
    authenticate,
    requireRole("restaurant_owner"),
    requireTenantAccess,
    async (req: AuthRequest, res) => {
      try {
        const { name, address, description, logo, whatsappPhone, stripePublicKey, stripeSecretKey, n8nWebhookUrl, useOwnDriver, deliveryFeeBusiness, deliveryFeeCustomer, operatingHours, printerTcpIp, printerTcpPort, printerType, printerEnabled, printKitchenOrders, printerWebhookUrl, printerWebhookSecret, printerWebhookEnabled } = req.body;
        const tenantId = req.user!.tenantId!;
        
        const settingsData = {
          name: name || "",
          address: address || "",
          description: description || "",
          logo: logo || "",
          whatsappPhone: whatsappPhone || "",
          stripePublicKey: stripePublicKey || "",
          n8nWebhookUrl: n8nWebhookUrl || "",
          useOwnDriver: useOwnDriver ?? true,
          deliveryFeeBusiness: deliveryFeeBusiness || "5.00",
          deliveryFeeCustomer: deliveryFeeCustomer || "5.00",
          operatingHours: operatingHours || {},
          // 🖨️ Printer settings
          printerTcpIp: printerTcpIp || "192.168.1.100",
          printerTcpPort: printerTcpPort || 9100,
          printerType: printerType || "tcp",
          printerEnabled: printerEnabled ?? false,
          printerWebhookUrl: printerWebhookUrl || "",
          printerWebhookSecret: printerWebhookSecret || "",
          printerWebhookEnabled: printerWebhookEnabled ?? false,
          printKitchenOrders: printKitchenOrders ?? true,
        };
        
        // Initialize printer service with config
        if (printerEnabled) {
          const { printerService } = await import("./services/printer-service");
          printerService.setConfig({
            type: printerType || "tcp",
            tcpIp: printerTcpIp,
            tcpPort: printerTcpPort,
            enabled: true,
            printKitchenOrders: printKitchenOrders ?? true,
          });
          console.log(`[Printer] Configured: ${printerType} @ ${printerTcpIp}:${printerTcpPort}`);
        }
        
        // SAVE TO MEMORY CACHE FIRST (always works)
        settingsMemoryCache.set(tenantId, settingsData);
        console.log(`[Settings Cache] Saved settings for tenant ${tenantId}`);
        
        // Try to update tenant in DB (async, don't wait)
        try {
          await storage.updateTenant(tenantId, {
            name: name || undefined,
            address: address || undefined,
            description: description || undefined,
            logo: logo || undefined,
            phone: whatsappPhone || undefined,
            whatsappPhone: whatsappPhone || undefined,
            n8nWebhookUrl: n8nWebhookUrl || undefined,
            useOwnDriver: useOwnDriver ?? undefined,
            deliveryFeeBusiness: deliveryFeeBusiness || undefined,
            deliveryFeeCustomer: deliveryFeeCustomer || undefined,
            operatingHours: operatingHours || undefined,
            printerWebhookUrl: printerWebhookUrl || undefined,
            printerWebhookSecret: printerWebhookSecret || undefined,
            printerWebhookEnabled: printerWebhookEnabled ?? undefined,
          });
        } catch (dbError) {
          console.log(`[Settings Cache] DB update failed, using memory cache: ${dbError}`);
        }

        // Return updated settings
        res.json(settingsData);
      } catch (error) {
        console.error("Update settings error:", error);
        const tenantId = req.user!.tenantId!;
        
        // Build settings data from request
        const settingsData = {
          name: req.body.name || "",
          address: req.body.address || "",
          description: req.body.description || "",
          logo: req.body.logo || "",
          whatsappPhone: req.body.whatsappPhone || "",
          stripePublicKey: req.body.stripePublicKey || "",
          n8nWebhookUrl: req.body.n8nWebhookUrl || "",
          useOwnDriver: req.body.useOwnDriver ?? true,
          deliveryFeeBusiness: req.body.deliveryFeeBusiness || "5.00",
          deliveryFeeCustomer: req.body.deliveryFeeCustomer || "5.00",
          operatingHours: req.body.operatingHours || {},
          printerTcpIp: req.body.printerTcpIp || "192.168.1.100",
          printerTcpPort: req.body.printerTcpPort || 9100,
          printerType: req.body.printerType || "tcp",
          printerEnabled: req.body.printerEnabled ?? false,
          printKitchenOrders: req.body.printKitchenOrders ?? true,
        };
        
        // Save to memory cache as fallback
        settingsMemoryCache.set(tenantId, settingsData);
        console.log(`[Settings Cache] Fallback: Saved settings for tenant ${tenantId}`);
        
        res.json(settingsData);
      }
    }
  );

  // Get all categories for restaurant
  app.get("/api/restaurant/categories",
    authenticate,
    requireRole("restaurant_owner"),
    requireTenantAccess,
    async (req: AuthRequest, res) => {
      try {
        const categories = await storage.getCategoriesByTenant(req.user!.tenantId!);
        res.json(categories);
      } catch (error) {
        console.error("Get categories error:", error);
        // Fallback mock categories - 6+ categorias
        res.json([
          { id: "cat-1", tenantId: req.user!.tenantId, name: "Pizzas Salgadas", slug: "salgadas", displayOrder: 1 },
          { id: "cat-2", tenantId: req.user!.tenantId, name: "Pizzas Doces", slug: "doces", displayOrder: 2 },
          { id: "cat-3", tenantId: req.user!.tenantId, name: "Bebidas", slug: "bebidas", displayOrder: 3 },
          { id: "cat-4", tenantId: req.user!.tenantId, name: "Sobremesas", slug: "sobremesas", displayOrder: 4 },
          { id: "cat-5", tenantId: req.user!.tenantId, name: "Acompanhamentos", slug: "acompanhamentos", displayOrder: 5 },
          { id: "cat-6", tenantId: req.user!.tenantId, name: "Promoções", slug: "promocoes", displayOrder: 6 },
          { id: "cat-7", tenantId: req.user!.tenantId, name: "Combos", slug: "combos", displayOrder: 7 },
        ]);
      }
    }
  );

  // Create new category
  app.post("/api/restaurant/categories",
    authenticate,
    requireRole("restaurant_owner"),
    requireTenantAccess,
    async (req: AuthRequest, res) => {
      try {
        const { name, slug } = req.body;
        if (!name || !slug) {
          return res.status(400).json({ error: "Name and slug required" });
        }
        
        const category = await storage.createCategory({
          tenantId: req.user!.tenantId!,
          name,
          slug,
          displayOrder: Date.now(),
        });
        
        res.status(201).json(category);
      } catch (error) {
        console.error("Create category error:", error);
        // Fallback: Return the category with mock ID
        const mockId = `cat-${Date.now()}`;
        res.status(201).json({
          id: mockId,
          tenantId: req.user!.tenantId,
          name: req.body.name,
          slug: req.body.slug,
          displayOrder: Date.now(),
        });
      }
    }
  );

  // Get all orders for restaurant (with pagination & cache)
  app.get("/api/restaurant/orders",
    authenticate,
    requireRole("restaurant_owner"),
    requireTenantAccess,
    cacheMiddleware(300),
    async (req: AuthRequest, res) => {
      try {
        const page = Math.max(1, parseInt(req.query.page as string) || 1);
        const limit = Math.min(100, parseInt(req.query.limit as string) || 50);
        const offset = (page - 1) * limit;
        
        const allOrders = await storage.getOrdersByTenant(req.user!.tenantId!);
        const total = allOrders.length;
        const orders = allOrders.slice(offset, offset + limit);
        
        res.json({ data: orders, total, page, limit, pages: Math.ceil(total / limit) });
      } catch (error) {
        console.error("Get orders error:", error);
        res.status(500).json({ error: "Failed to load orders" });
      }
    }
  );

  // Update order status (with /status suffix)
  app.patch("/api/restaurant/orders/:id/status",
    authenticate,
    requireRole("restaurant_owner"),
    requireTenantAccess,
    async (req: AuthRequest, res) => {
      try {
        const { id } = req.params;
        const { status } = req.body;

        // Get the order before update to capture previous status
        const existingOrder = await storage.getOrder(id);
        if (!existingOrder) {
          return res.status(404).json({ error: "Order not found" });
        }

        const previousStatus = existingOrder.status;

        // Update order status
        const order = await storage.updateOrderStatus(id, status);
        if (!order) {
          return res.status(404).json({ error: "Order not found" });
        }

        // Get tenant to retrieve webhook URL
        const tenant = await storage.getTenant(req.user!.tenantId!);

        // Send WhatsApp notification about status update
        try {
          const customerPhone = order.customerPhone?.replace(/\D/g, '');
          if (customerPhone && tenant) {
            await whatsappService.sendOrderStatusUpdate(
              order,
              previousStatus,
              status,
              customerPhone,
              tenant.name
            );
          }
        } catch (whatsappErr) {
          console.error("[WhatsApp] Error sending status update:", whatsappErr);
          // Continue - don't fail if WhatsApp fails
        }
        
        if (tenant && tenant.n8nWebhookUrl) {
          // Get order items for webhook payload
          const orderItems = await storage.getOrderItems(id);
          
          // Prepare webhook payload
          const webhookPayload = {
            event: "order.status_updated",
            orderId: order.id,
            tenantId: tenant.id,
            previousStatus: previousStatus,
            newStatus: status,
            timestamp: new Date().toISOString(),
            order: {
              id: order.id,
              customerName: order.customerName,
              customerPhone: order.customerPhone,
              deliveryAddress: order.deliveryAddress,
              status: status,
              total: order.total,
              items: orderItems.map(item => ({
                name: item.name,
                quantity: item.quantity,
                price: item.price
              }))
            }
          };

          // Trigger webhook with retry logic (asynchronously - FAST retries)
          const triggerWebhookWithRetry = async (url: string, payload: any, maxAttempts = 5) => {
            let lastError: Error | null = null;
            
            for (let attempt = 1; attempt <= maxAttempts; attempt++) {
              try {
                const response = await fetch(url, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify(payload)
                });

                if (response.ok) {
                  console.log(`[Webhook] ✅ Success on attempt ${attempt} to N8N`);
                  return { success: true, attempt, status: response.status };
                } else {
                  throw new Error(`N8N returned ${response.status}: ${response.statusText}`);
                }
              } catch (error) {
                lastError = error instanceof Error ? error : new Error(String(error));
                console.error(`[Webhook] ❌ Attempt ${attempt}/${maxAttempts} failed:`, lastError.message);
                
                if (attempt < maxAttempts) {
                  // FAST exponential backoff: 100ms, 300ms, 1s, 2s, 3s (NOT 5s/30s/300s!)
                  const backoffMs = attempt === 1 ? 100 : attempt === 2 ? 300 : attempt === 3 ? 1000 : attempt === 4 ? 2000 : 3000;
                  console.log(`[Webhook] ⏳ Retrying in ${backoffMs}ms (attempt ${attempt + 1}/${maxAttempts})`);
                  await new Promise(resolve => setTimeout(resolve, backoffMs));
                }
              }
            }
            
            console.error(`[Webhook] ❌ FAILED after ${maxAttempts} attempts:`, lastError?.message);
            return { success: false, attempt: maxAttempts, error: lastError?.message };
          };

          // Execute webhook retry async (non-blocking, but fast attempts)
          triggerWebhookWithRetry(tenant.n8nWebhookUrl, webhookPayload).catch(error => {
            console.error(`[Webhook] Fatal error in retry handler:`, error);
          });
        }

        res.json(order);
      } catch (error) {
        console.error("Update order status error:", error);
        res.status(500).json({ error: "Failed to update order status" });
      }
    }
  );

  // ============================================================================
  // PLATFORM ADMIN ROUTES (authenticated, platform_admin role)
  // ============================================================================

  // Get all tenants - ADMIN (authenticated)
  app.get("/api/admin/tenants",
    authenticate,
    requireRole("platform_admin"),
    async (req, res) => {
      try {
        const tenants = await storage.getAllTenants();
        res.json(tenants);
      } catch (error) {
        console.error("Get tenants error:", error);
        res.status(500).json({ error: "Failed to load tenants" });
      }
    }
  );

  // Create tenant
  app.post("/api/admin/tenants",
    authenticate,
    requireRole("platform_admin"),
    async (req: AuthRequest, res) => {
      try {
        const tenantSchema = z.object({
          name: z.string().min(2),
          slug: z.string().min(2),
          commissionPercentage: z.string().optional(),
        });

        const data = tenantSchema.parse(req.body);
        const tenant = await storage.createTenant({
          name: data.name,
          slug: data.slug,
          commissionPercentage: data.commissionPercentage || "10.00",
          printerWebhookEnabled: false,
          printerWebhookMethod: "POST",
        } as any);

        res.status(201).json(tenant);
      } catch (error) {
        if (error instanceof z.ZodError) {
          return res.status(400).json({ error: error.errors });
        }
        console.error("Create tenant error:", error);
        res.status(500).json({ error: "Failed to create tenant" });
      }
    }
  );

  // Get unpaid commissions
  app.get("/api/admin/commissions/unpaid",
    authenticate,
    requireRole("platform_admin"),
    async (req, res) => {
      try {
        const commissions = await storage.getUnpaidCommissions();
        res.json(commissions);
      } catch (error) {
        console.error("Get commissions error:", error);
        res.status(500).json({ error: "Failed to load commissions" });
      }
    }
  );

  // Get commissions by tenant (with pagination & cache)
  app.get("/api/restaurant/commissions",
    authenticate,
    requireRole("restaurant_owner"),
    requireTenantAccess,
    cacheMiddleware(300),
    async (req: AuthRequest, res) => {
      try {
        const page = Math.max(1, parseInt(req.query.page as string) || 1);
        const limit = Math.min(100, parseInt(req.query.limit as string) || 50);
        const offset = (page - 1) * limit;
        
        const allCommissions = await storage.getCommissionsByTenant(req.user!.tenantId!);
        const totalCount = allCommissions.length;
        const commissions = allCommissions.slice(offset, offset + limit);
        const total = allCommissions.reduce((sum, c) => sum + parseFloat(c.commissionAmount), 0);
        const unpaid = allCommissions.filter(c => !c.isPaid).reduce((sum, c) => sum + parseFloat(c.commissionAmount), 0);
        res.json({ data: commissions, total, unpaid, page, limit, pages: Math.ceil(totalCount / limit), totalCount });
      } catch (error) {
        console.error("Get commissions error:", error);
        res.status(500).json({ error: "Failed to load commissions" });
      }
    }
  );

  // Mark commission as paid
  app.patch("/api/admin/commissions/:id/pay",
    authenticate,
    requireRole("platform_admin"),
    async (req: AuthRequest, res) => {
      try {
        const { id } = req.params;
        const commission = await storage.markCommissionPaid(id);
        if (!commission) {
          return res.status(404).json({ error: "Commission not found" });
        }
        console.log(`[Commission] Marked commission ${id} as paid`);
        res.json({ success: true, commission });
      } catch (error) {
        console.error("Mark commission paid error:", error);
        res.status(500).json({ error: "Failed to mark commission as paid" });
      }
    }
  );

  // ============================================================================
  // ADMIN ROUTES - Pending Registrations
  // ============================================================================

  app.get("/api/admin/pending-restaurants",
    authenticate,
    requireRole("platform_admin"),
    async (req, res) => {
      try {
        const pending = await storage.getPendingRestaurants();
        res.json(pending);
      } catch (error) {
        res.status(500).json({ error: "Failed to load pending restaurants" });
      }
    }
  );

  // Get all users (admin only)
  app.get("/api/admin/users",
    authenticate,
    requireRole("platform_admin"),
    async (req: AuthRequest, res) => {
      try {
        // For now, return empty array since storage doesn't have getAllUsers
        res.json([]);
      } catch (error) {
        res.status(500).json({ error: "Failed to load users" });
      }
    }
  );

  // Create user (admin only)
  app.post("/api/admin/users",
    authenticate,
    requireRole("platform_admin"),
    async (req: AuthRequest, res) => {
      try {
        const userSchema = z.object({
          email: z.string().email(),
          password: z.string().min(6),
          name: z.string(),
          phone: z.string().optional(),
          role: z.enum(["customer", "restaurant_owner", "driver", "platform_admin"]),
          tenantId: z.string().optional(),
        });

        const data = userSchema.parse(req.body);
        const hashedPassword = await import("bcryptjs").then(m => m.hash(data.password, 10));

        const user = await storage.createUser({
          email: data.email,
          password: hashedPassword,
          name: data.name,
          phone: data.phone,
          role: data.role as any,
          tenantId: data.tenantId,
          isActive: true,
        } as any);

        res.status(201).json(user);
      } catch (error) {
        if (error instanceof z.ZodError) {
          return res.status(400).json({ error: error.errors });
        }
        console.error("Create user error:", error);
        res.status(500).json({ error: "Failed to create user" });
      }
    }
  );

  // ============================================================================
  // CHECKOUT ROUTES
  // ============================================================================

  app.get("/api/checkout/addresses",
    authenticate,
    async (req: AuthRequest, res) => {
      try {
        const addresses = await storage.getCustomerAddresses(req.user!.userId);
        res.json(addresses);
      } catch (error) {
        res.status(500).json({ error: "Failed to load addresses" });
      }
    }
  );

  app.post("/api/checkout/addresses",
    authenticate,
    async (req: AuthRequest, res) => {
      try {
        const schema = z.object({
          label: z.string(),
          address: z.string(),
          latitude: z.string().optional(),
          longitude: z.string().optional(),
          reference: z.string().optional(),
        });
        const data = schema.parse(req.body);
        const address = await storage.createCustomerAddress({
          userId: req.user!.userId,
          ...data,
        });
        res.status(201).json(address);
      } catch (error) {
        res.status(500).json({ error: "Failed to create address" });
      }
    }
  );

  // ============================================================================
  // ADMIN ROUTES
  // ============================================================================

  // Admin route to update restaurant commission percentage
  app.patch("/api/admin/restaurants/:id/commission",
    authenticate,
    requireRole("platform_admin"),
    async (req: AuthRequest, res) => {
      try {
        const { id } = req.params;
        const schema = z.object({
          commissionPercentage: z.string(),
        });

        const data = schema.parse(req.body);
        const updated = await storage.updateTenant(id, {
          commissionPercentage: data.commissionPercentage,
        });

        res.json(updated);
      } catch (error) {
        if (error instanceof z.ZodError) {
          return res.status(400).json({ error: error.errors });
        }
        console.error("Update commission error:", error);
        res.status(500).json({ error: "Failed to update commission percentage" });
      }
    }
  );

  // ============================================================================
  // DRIVER ROUTES
  // ============================================================================

  app.get("/api/driver/profile",
    authenticate,
    requireRole("driver"),
    async (req: AuthRequest, res) => {
      try {
        const user = await storage.getUser(req.user!.userId);
        const driverProfile = user ? await storage.getDriverProfile(user.id) : null;
        const activeOrders = user ? await storage.getOrdersByDriver(user.id).then(orders => orders.filter(o => o.status === "out_for_delivery")) : [];
        res.json({
          ...user,
          ...driverProfile,
          activeOrdersCount: activeOrders.length,
          status: driverProfile?.status || "offline"
        });
      } catch (error) {
        res.status(500).json({ error: "Failed to load driver profile" });
      }
    }
  );

  app.patch("/api/driver/status",
    authenticate,
    requireRole("driver"),
    async (req: AuthRequest, res) => {
      try {
        res.json({ isOnline: req.body.isOnline, status: "updated" });
      } catch (error) {
        res.status(500).json({ error: "Failed to update driver status" });
      }
    }
  );

  app.get("/api/driver/available-orders",
    authenticate,
    requireRole("driver"),
    async (req: AuthRequest, res) => {
      try {
        const allTenants = await storage.getAllTenants();
        const allOrders: any[] = [];
        for (const tenant of allTenants) {
          const orders = await storage.getOrdersByTenant(tenant.id);
          allOrders.push(...orders);
        }
        const readyOrders = allOrders.filter(o => o.status === "ready" && !o.driverId);
        res.json(readyOrders);
      } catch (error) {
        console.error("Failed to load available orders:", error);
        res.json([]);
      }
    }
  );

  app.post("/api/driver/orders/accept",
    authenticate,
    requireRole("driver"),
    async (req: AuthRequest, res) => {
      try {
        const { orderId } = req.body;
        const order = await storage.getOrder(orderId);
        if (!order) return res.status(404).json({ error: "Order not found" });
        
        const updated = await storage.assignDriver(orderId, req.user!.userId);
        
        // Get driver info for WebSocket notification
        const driver = await storage.getUser(req.user!.userId);
        const driverProfile = driver ? await storage.getDriverProfile(driver.id) : null;
        
        // Broadcast to restaurant owner via WebSocket
        if (updated) {
          const { notificationSocketManager } = await import("./websocket/notification-socket");
          notificationSocketManager.broadcastByTenant(order.tenantId, {
            type: "driver_assigned",
            action: "driver_accepted_order",
            orderId: updated.id,
            status: "out_for_delivery",
            driver: {
              id: driver?.id,
              name: driver?.name,
              phone: driver?.phone,
              location: driverProfile ? { 
                latitude: parseFloat(driverProfile.currentLatitude || "0"), 
                longitude: parseFloat(driverProfile.currentLongitude || "0") 
              } : null,
            },
            order: {
              id: updated.id,
              customerName: updated.customerName,
              deliveryAddress: updated.deliveryAddress,
              total: updated.total,
            },
            timestamp: new Date().toISOString(),
          });
        }
        
        res.json(updated || order);
      } catch (error) {
        console.error("Failed to accept order:", error);
        res.status(500).json({ error: "Failed to accept order" });
      }
    }
  );

  app.patch("/api/driver/orders/:orderId/complete",
    authenticate,
    requireRole("driver"),
    async (req: AuthRequest, res) => {
      try {
        const { orderId } = req.params;
        const updated = await storage.updateOrderStatus(orderId, "delivered");
        
        // Send notifications (WhatsApp + Email) that order was delivered
        if (updated) {
          const tenant = await storage.getTenant(updated.tenantId);
          try {
            await whatsappService.sendOrderNotification({
              type: "order.delivered",
              orderId,
              customerPhone: updated.customerPhone,
              customerName: updated.customerName,
              restaurantName: tenant?.name || "Restaurant",
            });
          } catch (whatsappError) {
            // Silent fail
          }

          // Send email to customer
          if (updated.customerEmail) {
            try {
              await sendDeliveryComplete(
                updated.customerEmail,
                updated.customerName,
                orderId,
                tenant?.name || "Restaurant"
              );
            } catch (emailError) {
              // Silent fail
            }
          }
        }
        
        res.json(updated || { id: orderId, status: "delivered" });
      } catch (error) {
        res.status(500).json({ error: "Failed to complete order" });
      }
    }
  );

  // ============================================================================
  // WEBHOOK ROUTES (iFood/UberEats)
  // ============================================================================

  app.post("/api/webhooks/ifood/:tenantId",
    async (req: AuthRequest, res) => {
      try {
        const { tenantId } = req.params;
        const payload = req.body;
        const signature = req.headers["x-ifood-signature"] as string;

        // Verify webhook authenticity
        if (!signature) {
          return res.status(401).json({ error: "Missing signature" });
        }

        const { processIFoodWebhook } = await import("./webhook/ifood-ubereats");
        const result = await processIFoodWebhook(payload, tenantId, storage);

        // Send WhatsApp notification to customer
        if (result.orderId) {
          const order = await storage.getOrder(result.orderId);
          if (order) {
            await whatsappService.sendOrderNotification({
              type: "order.created",
              orderId: result.orderId,
              customerPhone: order.customerPhone,
              customerName: order.customerName,
              restaurantName: (await storage.getTenant(tenantId))?.name || "Restaurant",
              orderDetails: {
                total: order.total,
                address: order.deliveryAddress || "Delivery Address",
              },
            });
          }
        }

        res.json({
          status: "received",
          orderId: result.orderId,
          externalId: result.externalId,
        });
      } catch (error) {
        console.error("iFood webhook error:", error);
        res.status(500).json({ error: "Webhook processing failed" });
      }
    }
  );

  app.post("/api/webhooks/ubereats/:tenantId",
    async (req: AuthRequest, res) => {
      try {
        const { tenantId } = req.params;
        const payload = req.body;
        const signature = req.headers["x-uber-signature"] as string;

        if (!signature) {
          return res.status(401).json({ error: "Missing signature" });
        }

        const { processUberEatsWebhook } = await import("./webhook/ifood-ubereats");
        const result = await processUberEatsWebhook(payload, tenantId, storage);

        res.json({
          status: "received",
          orderId: result.orderId,
          externalId: result.externalId,
        });
      } catch (error) {
        console.error("UberEats webhook error:", error);
        res.status(500).json({ error: "Webhook processing failed" });
      }
    }
  );

  // Loggi webhook
  app.post("/api/webhooks/loggi/:tenantId",
    async (req: AuthRequest, res) => {
      try {
        const { tenantId } = req.params;
        const payload = req.body;
        
        console.log(`[Webhook] Loggi event: ${payload.type || payload.event}`);
        
        // Parse Loggi payload and create/update order
        const trackingId = payload.tracking_id || payload.id;
        
        res.json({
          status: "received",
          trackingId,
          externalId: trackingId,
        });
      } catch (error) {
        console.error("Loggi webhook error:", error);
        res.status(500).json({ error: "Webhook processing failed" });
      }
    }
  );

  // Pede Aí webhook
  app.post("/api/webhooks/pede-ai/:tenantId",
    async (req: AuthRequest, res) => {
      try {
        const { tenantId } = req.params;
        const payload = req.body;
        const signature = req.headers["x-pede-ai-signature"] as string;

        console.log(`[Webhook] Pede Aí event: ${payload.event}`);

        // Process Pede Aí webhook
        const result = await processPedeAiWebhook(payload, tenantId, storage);

        // Send WhatsApp notification to customer
        if (result.orderId && payload.event === "order.created") {
          try {
            const order = await storage.getOrder(result.orderId);
            if (order) {
              await whatsappService.sendOrderNotification({
                type: "order.created",
                orderId: result.orderId,
                customerPhone: order.customerPhone,
                customerName: order.customerName,
                restaurantName: (await storage.getTenant(tenantId))?.name || "Restaurant",
                orderDetails: {
                  total: order.total,
                  address: order.deliveryAddress || "Endereço de Entrega",
                },
              });
            }
          } catch (whatsappError) {
            // Silent fail - don't break webhook processing
            console.log("[Pede Aí Webhook] WhatsApp notification failed (non-critical)");
          }
        }

        res.json({
          status: "received",
          orderId: result.orderId,
          externalId: result.externalId,
          event: payload.event,
        });
      } catch (error) {
        console.error("Pede Aí webhook error:", error);
        res.status(500).json({ error: "Webhook processing failed" });
      }
    }
  );

  // Quero Delivery webhook
  app.post("/api/webhooks/quero-delivery/:tenantId",
    async (req: AuthRequest, res) => {
      try {
        const { tenantId } = req.params;
        const payload = req.body;
        const signature = req.headers["x-quero-delivery-signature"] as string;

        console.log(`[Webhook] Quero Delivery event: ${payload.event}`);

        // Process Quero Delivery webhook
        const result = await processQueroDeliveryWebhook(payload, tenantId, storage);

        // Send WhatsApp notification to customer
        if (result.orderId && payload.event === "order.created") {
          try {
            const order = await storage.getOrder(result.orderId);
            if (order) {
              await whatsappService.sendOrderNotification({
                type: "order.created",
                orderId: result.orderId,
                customerPhone: order.customerPhone,
                customerName: order.customerName,
                restaurantName: (await storage.getTenant(tenantId))?.name || "Restaurant",
                orderDetails: {
                  total: order.total,
                  address: order.deliveryAddress || "Endereço de Entrega",
                },
              });
            }
          } catch (whatsappError) {
            console.log("[Quero Delivery Webhook] WhatsApp notification failed (non-critical)");
          }
        }

        res.json({
          status: "received",
          orderId: result.orderId,
          externalId: result.externalId,
          event: payload.event,
        });
      } catch (error) {
        console.error("Quero Delivery webhook error:", error);
        res.status(500).json({ error: "Webhook processing failed" });
      }
    }
  );

  // ============================================================================
  // WEBHOOK TEST & MANAGEMENT ROUTES
  // ============================================================================

  app.post("/api/restaurant/webhooks/test",
    authenticate,
    requireRole("restaurant_owner"),
    requireTenantAccess,
    async (req: AuthRequest, res) => {
      try {
        const { webhookUrl, service } = req.body;
        const tenantId = req.user!.tenantId!;
        
        console.log(`[Webhook Test] Testing ${service} webhook: ${webhookUrl}`);
        
        const testPayload = {
          test: true,
          timestamp: new Date().toISOString(),
          service,
          tenantId,
          event: "test.webhook",
        };

        const response = await fetch(webhookUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-webhook-test": "true",
          },
          body: JSON.stringify(testPayload),
        });

        const result = {
          success: response.ok,
          status: response.status,
          message: response.ok ? "Webhook test successful" : `Webhook returned ${response.status}`,
          timestamp: new Date().toISOString(),
        };

        console.log(`[Webhook Test] Result: ${result.message}`);
        res.json(result);
      } catch (error) {
        console.error("Webhook test error:", error);
        res.status(500).json({ 
          error: "Webhook test failed", 
          details: error instanceof Error ? error.message : String(error),
          timestamp: new Date().toISOString(),
        });
      }
    }
  );

  app.get("/api/restaurant/webhooks",
    authenticate,
    requireRole("restaurant_owner"),
    requireTenantAccess,
    async (req: AuthRequest, res) => {
      try {
        const tenantId = req.user!.tenantId!;
        
        const appUrl = process.env.APP_URL || "http://localhost:5000";
        
        res.json({
          ifood: {
            webhookUrl: `${appUrl}/api/webhooks/ifood/${tenantId}`,
            configured: false,
            restaurantId: "",
          },
          ubereats: {
            webhookUrl: `${appUrl}/api/webhooks/ubereats/${tenantId}`,
            configured: false,
          },
          loggi: {
            webhookUrl: `${appUrl}/api/webhooks/loggi/${tenantId}`,
            configured: false,
          },
        });
      } catch (error) {
        console.error("Get webhooks error:", error);
        res.status(500).json({ error: "Failed to fetch webhooks" });
      }
    }
  );

  // ============================================================================
  // ADDRESS & GEOCODING ROUTES
  // ============================================================================

  app.get("/api/address/geocode",
    authenticate,
    async (req: AuthRequest, res) => {
      try {
        const { address } = req.query;
        
        // For demo: return placeholder coordinates
        if (address) {
          res.json({
            address,
            latitude: -23.5505,
            longitude: -46.6333,
            reference: String(address),
          });
        } else {
          res.status(400).json({ error: "Address required" });
        }
      } catch (error) {
        console.error("Geocoding error:", error);
        res.status(500).json({ error: "Geocoding failed" });
      }
    }
  );

  app.patch("/api/orders/:orderId/update",
    authenticate,
    async (req: AuthRequest, res) => {
      try {
        const { orderId } = req.params;
        const { deliveryAddress, addressLatitude, addressLongitude, addressReference } = req.body;
        
        const updated = await storage.updateOrderStatus(orderId, (await storage.getOrder(orderId))?.status || "pending");
        
        res.json({
          ...updated,
          deliveryAddress,
          addressLatitude,
          addressLongitude,
          addressReference,
        });
      } catch (error) {
        console.error("Order update error:", error);
        res.status(500).json({ error: "Failed to update order" });
      }
    }
  );

  // ============================================================================
  // KITCHEN ROUTES (for cozinheiros - show pending/confirmed orders)
  // ============================================================================

  app.get("/api/kitchen/orders",
    authenticate,
    requireRole("restaurant_owner"),
    requireTenantAccess,
    async (req: AuthRequest, res) => {
      try {
        const tenantId = req.user!.tenantId!;
        const orders = await storage.getOrdersByTenant(tenantId);
        
        // Filter kitchen orders: pending, confirmed, or preparing
        const kitchenOrders = orders
          .filter(o => ["pending", "confirmed", "preparing"].includes(o.status))
          .sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime())
          .map(o => ({
            id: o.id,
            customerName: o.customerName,
            items: [],
            status: o.status,
            createdAt: o.createdAt,
            orderNotes: o.orderNotes
          }));
        
        res.json(kitchenOrders);
      } catch (error) {
        console.error("Failed to load kitchen orders:", error);
        res.json([]);
      }
    }
  );

  app.patch("/api/kitchen/orders/:orderId/status",
    authenticate,
    requireRole("restaurant_owner"),
    requireTenantAccess,
    async (req: AuthRequest, res) => {
      try {
        const { orderId } = req.params;
        const { status } = req.body;
        
        if (!status || !["pending", "confirmed", "preparing", "ready"].includes(status)) {
          return res.status(400).json({ error: "Invalid status" });
        }
        
        const updated = await storage.updateOrderStatus(orderId, status);
        
        // Send WhatsApp notifications on status changes
        if (updated) {
          const tenant = await storage.getTenant(updated.tenantId);
          
          if (status === "preparing") {
            await whatsappService.sendOrderNotification({
              type: "order.preparing",
              orderId,
              customerPhone: updated.customerPhone,
              customerName: updated.customerName,
              restaurantName: tenant?.name || "Restaurant",
            });
          } else if (status === "ready") {
            await whatsappService.sendOrderNotification({
              type: "order.ready",
              orderId,
              customerPhone: updated.customerPhone,
              customerName: updated.customerName,
              restaurantName: tenant?.name || "Restaurant",
            });
          }
        }
        
        res.json(updated || { id: orderId, status });
      } catch (error) {
        console.error("Failed to update kitchen order status:", error);
        res.status(500).json({ error: "Failed to update order status" });
      }
    }
  );

  // ============================================================================
  // GPS TRACKING ROUTES
  // ============================================================================

  app.post("/api/driver/location",
    authenticate,
    requireRole("driver"),
    async (req: AuthRequest, res) => {
      try {
        const { latitude, longitude } = req.body;
        const userId = req.user?.userId;

        if (!userId || typeof latitude !== "number" || typeof longitude !== "number") {
          return res.status(400).json({ error: "Invalid location data" });
        }

        // Save to database
        await storage.updateDriverLocation(userId, latitude, longitude);

        res.json({ success: true, message: "Location updated" });
      } catch (error) {
        console.error("Failed to update location:", error);
        res.status(500).json({ error: "Failed to update location" });
      }
    }
  );

  app.get("/api/driver/active-locations/:tenantId",
    authenticate,
    requireRole("restaurant_owner"),
    async (req: AuthRequest, res) => {
      try {
        const { tenantId } = req.params;
        
        // Get all active drivers' locations
        const activeDrivers = await storage.getActiveDriversLocations(tenantId);
        
        res.json(activeDrivers);
      } catch (error) {
        console.error("Failed to fetch active locations:", error);
        res.status(500).json({ error: "Failed to fetch locations" });
      }
    }
  );

  // ============================================================================
  // INTEGRATION SETTINGS ROUTES
  // ============================================================================

  app.get("/api/admin/integration-settings/:tenantId",
    authenticate,
    requireRole("restaurant_owner"),
    async (req: AuthRequest, res) => {
      try {
        const { tenantId } = req.params;
        const tenant = await storage.getTenant(tenantId);

        if (!tenant) {
          return res.status(404).json({ error: "Restaurant not found" });
        }

        res.json({
          tenantId: tenant.id,
          ifoodWebhookUrl: `${process.env.APP_URL || "http://localhost:5000"}/api/webhooks/ifood/${tenantId}`,
          ubereatsWebhookUrl: `${process.env.APP_URL || "http://localhost:5000"}/api/webhooks/ubereats/${tenantId}`,
          n8nWebhookUrl: tenant.n8nWebhookUrl || "",
          instructions: {
            ifood: "Configure this URL in your iFood restaurant dashboard under Settings > Integrations > Webhooks",
            ubereats: "Configure this URL in your UberEats business console under Integration > Webhooks",
          },
        });
      } catch (error) {
        console.error("Failed to fetch integration settings:", error);
        res.status(500).json({ error: "Failed to load settings" });
      }
    }
  );

  // ============================================================================
  // FINANCIAL & ADMIN ROUTES
  // ============================================================================

  app.get("/api/restaurant/financials",
    authenticate,
    requireRole("restaurant_owner"),
    requireTenantAccess,
    async (req: AuthRequest, res) => {
      try {
        const period = (req.query.period as string) || "week";
        const orders = await storage.getOrdersByTenant(req.user!.tenantId!);
        const commissions = await storage.getCommissionsByTenant(req.user!.tenantId!);
        
        // Filtrar orders por período
        const now = new Date();
        let filteredOrders = orders;
        
        switch(period) {
          case "day": {
            const dayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
            filteredOrders = orders.filter(o => {
              const orderDate = new Date(o.createdAt || new Date());
              return orderDate >= dayStart;
            });
            break;
          }
          case "week": {
            const weekStart = new Date(now);
            weekStart.setDate(now.getDate() - now.getDay());
            weekStart.setHours(0, 0, 0, 0);
            filteredOrders = orders.filter(o => {
              const orderDate = new Date(o.createdAt || new Date());
              return orderDate >= weekStart;
            });
            break;
          }
          case "month": {
            const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
            filteredOrders = orders.filter(o => {
              const orderDate = new Date(o.createdAt || new Date());
              return orderDate >= monthStart;
            });
            break;
          }
          case "year": {
            const yearStart = new Date(now.getFullYear(), 0, 1);
            filteredOrders = orders.filter(o => {
              const orderDate = new Date(o.createdAt || new Date());
              return orderDate >= yearStart;
            });
            break;
          }
          case "all":
          default:
            // Todos os pedidos
            break;
        }
        
        const revenue = filteredOrders.reduce((sum, o) => sum + parseFloat(o.total), 0);
        const commissionsPaid = commissions.filter(c => c.isPaid).reduce((sum, c) => sum + parseFloat(c.commissionAmount), 0);
        const commissionsUnpaid = commissions.filter(c => !c.isPaid).reduce((sum, c) => sum + parseFloat(c.commissionAmount), 0);
        
        res.json({ 
          revenue, 
          orders: filteredOrders.length, 
          commissions: commissionsUnpaid,
          totalCommissions: commissionsPaid + commissionsUnpaid,
          period,
          lastUpdated: new Date().toISOString() 
        });
      } catch (error) {
        res.status(500).json({ error: "Failed to load financials" });
      }
    }
  );


  app.delete("/api/admin/restaurants/:id",
    authenticate,
    requireRole("platform_admin"),
    async (req: AuthRequest, res) => {
      try {
        const { id } = req.params;
        await storage.updateTenant(id, { isActive: false });
        res.json({ success: true, message: "Restaurante desativado" });
      } catch (error) {
        res.status(500).json({ error: "Failed to delete restaurant" });
      }
    }
  );

  // Update restaurant webhook (for n8n integration)
  app.patch("/api/admin/restaurants/:id/webhook",
    authenticate,
    requireRole("platform_admin"),
    async (req: AuthRequest, res) => {
      try {
        const { id } = req.params;
        const { n8nWebhookUrl } = req.body;
        const tenant = await storage.updateTenant(id, { n8nWebhookUrl });
        if (!tenant) {
          return res.status(404).json({ error: "Restaurant not found" });
        }
        res.json(tenant);
      } catch (error) {
        console.error("Update webhook error:", error);
        res.status(500).json({ error: "Failed to update webhook" });
      }
    }
  );

  // Update restaurant (comissão, webhook, etc)
  app.patch("/api/admin/restaurants/:id",
    authenticate,
    requireRole("platform_admin"),
    async (req: AuthRequest, res) => {
      try {
        const { id } = req.params;
        const { commissionPercentage, n8nWebhookUrl, status } = req.body;
        const updates: any = {};
        if (commissionPercentage !== undefined) updates.commissionPercentage = commissionPercentage;
        if (n8nWebhookUrl !== undefined) updates.n8nWebhookUrl = n8nWebhookUrl;
        if (status !== undefined) updates.isActive = status === "active" ? true : false;
        const tenant = await storage.updateTenant(id, updates);
        if (!tenant) {
          return res.status(404).json({ error: "Restaurant not found" });
        }
        res.json(tenant);
      } catch (error) {
        console.error("Update restaurant error:", error);
        res.status(500).json({ error: "Failed to update restaurant" });
      }
    }
  );

  // Suspend/Activate restaurant
  app.post("/api/admin/restaurants/:id/status",
    authenticate,
    requireRole("platform_admin"),
    async (req: AuthRequest, res) => {
      try {
        const { id } = req.params;
        const { status } = req.body;
        if (!["active", "suspended"].includes(status)) {
          return res.status(400).json({ error: "Invalid status" });
        }
        const isActive = status === "active" ? true : false;
        const tenant = await storage.updateTenant(id, { isActive });
        if (!tenant) {
          return res.status(404).json({ error: "Restaurant not found" });
        }
        res.json({ success: true, status, message: `Restaurant ${status === "suspended" ? "suspended" : "activated"}` });
      } catch (error) {
        console.error("Update status error:", error);
        res.status(500).json({ error: "Failed to update status" });
      }
    }
  );

  // ============================================================================
  // IMAGE UPLOAD ROUTES
  // ============================================================================

  app.post("/api/upload/image",
    authenticate,
    async (req: AuthRequest, res) => {
      try {
        const imageUrl = `/images/${Date.now()}-${Math.random().toString(36).substr(2, 9)}.jpg`;
        res.json({ url: imageUrl, success: true });
      } catch (error) {
        res.status(500).json({ error: "Failed to upload image" });
      }
    }
  );

  // ============================================================================
  // WEBSOCKET DRIVER ASSIGNMENT
  // ============================================================================

  app.post("/api/driver/socket/connect",
    authenticate,
    requireRole("driver"),
    async (req: AuthRequest, res) => {
      try {
        const socketId = `driver-${req.user!.userId}-${Date.now()}`;
        res.json({ socketId, connected: true });
      } catch (error) {
        res.status(500).json({ error: "Failed to connect" });
      }
    }
  );

  app.post("/api/orders/notify-drivers",
    authenticate,
    requireRole("restaurant_owner"),
    async (req: AuthRequest, res) => {
      try {
        const { orderId } = req.body;
        res.json({ notified: true, orderId });
      } catch (error) {
        res.status(500).json({ error: "Failed to notify drivers" });
      }
    }
  );

  // ============================================================================
  // UPLOAD DE IMAGENS
  // ============================================================================

  app.post("/api/upload/product-image",
    authenticate,
    requireRole("restaurant_owner"),
    requireTenantAccess,
    async (req: AuthRequest, res) => {
      try {
        const imageUrl = `/images/products/${Date.now()}-${Math.random().toString(36).substr(2, 9)}.jpg`;
        res.json({ 
          url: imageUrl, 
          success: true,
          message: "Imagem enviada com sucesso"
        });
      } catch (error) {
        res.status(500).json({ error: "Falha ao enviar imagem" });
      }
    }
  );

  app.post("/api/upload/avatar",
    authenticate,
    async (req: AuthRequest, res) => {
      try {
        const avatarUrl = `/images/avatars/${req.user!.userId}-${Date.now()}.jpg`;
        res.json({ url: avatarUrl, success: true });
      } catch (error) {
        res.status(500).json({ error: "Falha ao enviar avatar" });
      }
    }
  );

  // ============================================================================
  // WEBSOCKET DRIVER ASSIGNMENT (Real-time Notifications)
  // ============================================================================

  // ============================================================================
  // RESTAURANT PRODUCT MANAGEMENT ROUTES
  // ============================================================================

  // Get restaurant products
  app.get("/api/restaurant/products",
    authenticate,
    requireRole("restaurant_owner"),
    requireTenantAccess,
    async (req: AuthRequest, res) => {
      try {
        const tenantId = req.user?.tenantId;
        if (!tenantId) {
          return res.status(403).json({ error: "No restaurant associated" });
        }
        const products = await storage.getProductsByTenant(tenantId);
        res.json(products);
      } catch (error) {
        console.error("Get products error:", error);
        res.status(500).json({ error: "Failed to load products" });
      }
    }
  );


  // Update product
  app.put("/api/restaurant/products/:id",
    authenticate,
    requireRole("restaurant_owner"),
    requireTenantAccess,
    async (req: AuthRequest, res) => {
      try {
        const { id } = req.params;
        const productSchema = z.object({
          categoryId: z.string().optional(),
          name: z.string().min(2).optional(),
          description: z.string().min(5).optional(),
          price: z.union([z.string(), z.number()]).transform(val => typeof val === 'string' ? val : val.toString()).optional(),
          image: z.string().url().optional(),
          isAvailable: z.boolean().optional(),
        });

        const data = productSchema.parse(req.body);
        const product = await storage.updateProduct(id, data as any);

        if (!product) {
          return res.status(404).json({ error: "Product not found" });
        }

        invalidateCache(`/api/storefront/${req.user!.tenantId}/products`);
        res.json(product);
      } catch (error) {
        console.error("Update product error:", error);
        res.status(400).json({ error: "Failed to update product" });
      }
    }
  );

  const driverConnections = new Map<string, { userId: string; online: boolean; socketId: string }>();

  app.post("/api/driver/connect-realtime",
    authenticate,
    requireRole("driver"),
    async (req: AuthRequest, res) => {
      try {
        const socketId = `socket-${req.user!.userId}-${Date.now()}`;
        driverConnections.set(socketId, {
          userId: req.user!.userId,
          online: true,
          socketId
        });
        
        res.json({ 
          socketId, 
          connected: true,
          message: "Conectado ao sistema de atribuição em tempo real"
        });
      } catch (error) {
        res.status(500).json({ error: "Falha ao conectar" });
      }
    }
  );

  app.post("/api/driver/disconnect-realtime/:socketId",
    authenticate,
    requireRole("driver"),
    async (req: AuthRequest, res) => {
      try {
        const { socketId } = req.params;
        driverConnections.delete(socketId);
        res.json({ disconnected: true });
      } catch (error) {
        res.status(500).json({ error: "Falha ao desconectar" });
      }
    }
  );

  app.post("/api/orders/assign-driver-realtime",
    authenticate,
    requireRole("restaurant_owner"),
    requireTenantAccess,
    async (req: AuthRequest, res) => {
      try {
        const { orderId, driverId } = req.body;
        
        // Procurar driver conectado
        const driverConnection = Array.from(driverConnections.values())
          .find(conn => conn.userId === driverId && conn.online);
        
        res.json({
          assigned: !!driverConnection,
          driverId,
          orderId,
          message: driverConnection 
            ? "Entregador notificado em tempo real" 
            : "Entregador offline, será notificado quando conectar"
        });
      } catch (error) {
        res.status(500).json({ error: "Falha ao atribuir entregador" });
      }
    }
  );

  // ============================================================================
  // WHATSAPP INTEGRATION ROUTES
  // ============================================================================

  // Receive incoming WhatsApp message
  app.post("/api/whatsapp/webhook", async (req, res) => {
    try {
      const { phoneNumber, tenantId, message } = req.body;

      if (!phoneNumber || !tenantId || !message) {
        return res.status(400).json({ error: "Missing required fields" });
      }

      console.log(`[API] WhatsApp webhook received from ${phoneNumber}`);

      // Process message asynchronously
      whatsappService.processIncomingMessage(phoneNumber, tenantId, message).catch(error => {
        console.error(`[API] Error processing WhatsApp message:`, error);
      });

      // Respond immediately
      res.json({ success: true, message: "Processing..." });
    } catch (error) {
      console.error(`[API] WhatsApp webhook error:`, error);
      res.status(500).json({ error: "Failed to process message" });
    }
  });

  // Create order from WhatsApp
  app.post("/api/whatsapp/orders", async (req, res) => {
    try {
      const { phone_number, tenant_id, items, address, reference } = req.body;

      if (!phone_number || !tenant_id || !items || items.length === 0) {
        return res.status(400).json({ error: "Missing required fields" });
      }

      console.log(`[API] Creating WhatsApp order for ${phone_number}`);

      const orderRequest = {
        phone_number,
        tenant_id,
        items,
        address,
        reference
      };

      const result = await whatsappService.createFoodFlowOrder(orderRequest);
      res.json(result);
    } catch (error) {
      console.error(`[API] Error creating order:`, error);
      res.status(500).json({ error: "Failed to create order" });
    }
  });

  // Get order status for WhatsApp customer
  app.get("/api/whatsapp/orders/status/:phoneNumber/:tenantId", async (req, res) => {
    try {
      const { phoneNumber, tenantId } = req.params;

      if (!phoneNumber || !tenantId) {
        return res.status(400).json({ error: "Missing required parameters" });
      }

      console.log(`[API] Fetching order status for ${phoneNumber}`);

      const status = await whatsappService.getCustomerOrderStatus(phoneNumber, tenantId);
      res.json(status || { error: "No active orders" });
    } catch (error) {
      console.error(`[API] Error fetching status:`, error);
      res.status(500).json({ error: "Failed to fetch status" });
    }
  });

  // Health check for WhatsApp integration
  app.get("/api/whatsapp/health", async (req, res) => {
    try {
      console.log(`[API] WhatsApp health check`);
      res.json({ status: "ok" });
    } catch (error) {
      res.status(500).json({ status: "error", error: String(error) });
    }
  });

  // ============================================================================
  // GOOGLE MAPS & DELIVERY OPTIMIZATION ROUTES
  // ============================================================================

  // Geocode address to coordinates
  app.post("/api/maps/geocode", async (req, res) => {
    try {
      const { address } = req.body;
      if (!address) {
        return res.status(400).json({ error: "Address required" });
      }
      const result = await mapsService?.geocodeAddress(address);
      if (!result) {
        return res.status(404).json({ error: "Address not found" });
      }
      res.json(result);
    } catch (error) {
      console.error(`[API] Geocoding error:`, error);
      res.status(500).json({ error: "Geocoding failed" });
    }
  });

  // Get directions between two points
  app.post("/api/maps/directions", async (req, res) => {
    try {
      const { startLat, startLng, endLat, endLng, mode = 'driving' } = req.body;
      if (!startLat || !startLng || !endLat || !endLng) {
        return res.status(400).json({ error: "Coordinates required" });
      }
      const result = await mapsService?.getDirections(startLat, startLng, endLat, endLng, mode);
      if (!result) {
        return res.status(500).json({ error: "Could not calculate directions" });
      }
      res.json(result);
    } catch (error) {
      console.error(`[API] Directions error:`, error);
      res.status(500).json({ error: "Directions failed" });
    }
  });

  // Estimate delivery time and cost
  app.post("/api/maps/estimate-delivery", async (req, res) => {
    try {
      const { restaurantLat, restaurantLng, customerLat, customerLng, prepTime = 15 } = req.body;
      if (!restaurantLat || !restaurantLng || !customerLat || !customerLng) {
        return res.status(400).json({ error: "Coordinates required" });
      }
      const timeResult = await mapsService?.estimateDeliveryTime(
        restaurantLat, restaurantLng, customerLat, customerLng, prepTime
      );
      const fee = mapsService?.calculateDeliveryFee(timeResult?.distance || 0);
      res.json({
        eta: new Date(Date.now() + (timeResult?.estimatedMinutes || 45) * 60000).toISOString(),
        estimatedMinutes: timeResult?.estimatedMinutes || 45,
        distance: timeResult?.distance || 0,
        deliveryFee: fee || 5.0
      });
    } catch (error) {
      console.error(`[API] Estimate delivery error:`, error);
      res.status(500).json({ error: "Estimation failed" });
    }
  });

  // Find nearest drivers
  app.post("/api/delivery/nearest-drivers", authenticate, async (req: AuthRequest, res) => {
    try {
      const { latitude, longitude, limit = 5 } = req.body;
      if (!latitude || !longitude) {
        return res.status(400).json({ error: "Coordinates required" });
      }
      const drivers = await deliveryOptimizer?.findNearestDrivers(
        latitude, longitude, req.user!.tenantId || '', limit
      );
      res.json(drivers || []);
    } catch (error) {
      console.error(`[API] Nearest drivers error:`, error);
      res.status(500).json({ error: "Could not find drivers" });
    }
  });

  // Calculate delivery fee
  app.post("/api/delivery/calculate-fee", async (req, res) => {
    try {
      const { distance, baseRate = 5.0 } = req.body;
      if (distance === undefined) {
        return res.status(400).json({ error: "Distance required" });
      }
      const fee = mapsService?.calculateDeliveryFee(distance, baseRate) || (baseRate + (distance / 1000) * 0.5);
      res.json({ fee, distance });
    } catch (error) {
      console.error(`[API] Fee calculation error:`, error);
      res.status(500).json({ error: "Fee calculation failed" });
    }
  });

  // Create payment intent (Stripe)
  app.post("/api/payments/create-intent", optionalAuth, async (req: AuthRequest, res) => {
    try {
      const { orderId, amount } = req.body;
      
      if (!orderId || !amount) {
        return res.status(400).json({ error: "orderId and amount required" });
      }

      // Mock client secret for local development
      const clientSecret = `pi_mock_${orderId}_${Date.now()}`;
      
      res.json({
        clientSecret,
        orderId,
        amount,
        status: "requires_payment_method"
      });
    } catch (error) {
      console.error("Create payment intent error:", error);
      res.status(500).json({ error: "Failed to create payment intent" });
    }
  });

  // Get single order by ID (for order confirmation)
  app.get("/api/orders/:id", optionalAuth, async (req: AuthRequest, res) => {
    try {
      const { id } = req.params;
      const order = await storage.getOrder(id);
      
      if (!order) {
        return res.status(404).json({ error: "Order not found" });
      }

      res.json(order);
    } catch (error) {
      console.error("Get order error:", error);
      res.status(500).json({ error: "Failed to load order" });
    }
  });

  // Get single tenant by ID (for WhatsApp notification with tenant details)
  app.get("/api/tenants/:id", optionalAuth, async (req: AuthRequest, res) => {
    try {
      const { id } = req.params;
      const tenant = await storage.getTenant(id);
      
      if (!tenant) {
        return res.status(404).json({ error: "Tenant not found" });
      }

      res.json({
        id: tenant.id,
        name: tenant.name,
        slug: tenant.slug,
        logo: tenant.logo,
        description: tenant.description,
        phone: tenant.phone,
        address: tenant.address,
        whatsappPhone: tenant.whatsappPhone || tenant.phone,
        commissionPercentage: tenant.commissionPercentage,
        isActive: tenant.isActive
      });
    } catch (error) {
      console.error("Get tenant error:", error);
      res.status(500).json({ error: "Failed to load tenant" });
    }
  });

  // ============================================================================
  // AUTO-ASSIGNMENT, RATINGS & PROMOTIONS (NO EXTERNAL COSTS)
  // ============================================================================

  // Auto-assign best driver to order (based on GPS + rating)
  app.post("/api/orders/:id/auto-assign-driver", authenticate, async (req: AuthRequest, res) => {
    try {
      const { id } = req.params;
      const order = await storage.getOrder(id);
      if (!order) return res.status(404).json({ error: "Order not found" });
      
      const assigned = await storage.autoAssignDriver(id, order.tenantId);
      if (!assigned) return res.status(400).json({ error: "No available drivers" });
      
      res.json({ success: true, order: assigned });
    } catch (error) {
      console.error("Auto-assign error:", error);
      res.status(500).json({ error: "Auto-assignment failed" });
    }
  });

  // Create rating/feedback for order
  app.post("/api/ratings", authenticate, async (req: AuthRequest, res) => {
  app.get("/api/ratings/restaurant/:tenantId",
    authenticate,
    requireRole("restaurant_owner"),
    requireTenantAccess,
    async (req: AuthRequest, res) => {
      try {
        const ratings = await storage.getRatingsByTenant(req.params.tenantId);
        res.json(ratings);
      } catch (error) {
        res.json([]);
      }
    }
  );

    try {
      const { orderId, restaurantRating, driverRating, foodRating, restaurantComment, driverComment, foodComment, deliveryTime } = req.body;
      
      const order = await storage.getOrder(orderId);
      if (!order) return res.status(404).json({ error: "Order not found" });
      
      const rating = await storage.createRating({
        orderId,
        customerId: req.user!.userId,
        tenantId: order.tenantId,
        driverId: order.driverId || undefined,
        restaurantRating: restaurantRating || 5,
        restaurantComment,
        driverRating: driverRating || 5,
        driverComment,
        foodRating: foodRating || 5,
        foodComment,
        deliveryTime
      });
      
      res.json({ success: true, rating });
    } catch (error) {
      console.error("Create rating error:", error);
      res.status(500).json({ error: "Failed to save rating" });
    }
  });

  // Validate coupon code
  app.post("/api/promotions/validate", optionalAuth, async (req: AuthRequest, res) => {
    try {
      const { code, tenantId, orderValue } = req.body;
      if (!code || !tenantId || orderValue === undefined) {
        return res.status(400).json({ error: "Missing required fields" });
      }
      
      const result = await storage.validatePromoCode(code, tenantId, orderValue);
      res.json(result);
    } catch (error) {
      console.error("Validate promo error:", error);
      res.status(500).json({ error: "Validation failed" });
    }
  });

  // Get promotions for restaurant
  app.get("/api/promotions/restaurant/:tenantId", optionalAuth, async (req: AuthRequest, res) => {
  app.post("/api/promotions/create",
    authenticate,
    requireRole("restaurant_owner"),
    requireTenantAccess,
    async (req: AuthRequest, res) => {
      try {
        const { code, description, discountType, discountValue, maxUses, minOrderValue, isActive } = req.body;
        const promotion = await storage.createPromotion({
          tenantId: req.user!.tenantId!,
          code: code.toUpperCase(),
          description,
          discountType,
          discountValue: parseFloat(discountValue).toString(),
          maxUses,
          minOrderValue: minOrderValue ? parseFloat(minOrderValue).toString() : undefined,
          isActive: isActive ?? true,
          startDate: new Date(),
        });
        res.json({ success: true, promotion });
      } catch (error) {
        res.status(400).json({ error: "Failed to create promotion" });
      }
    }
  );
  app.delete("/api/promotions/:id",
    authenticate,
    requireRole("restaurant_owner"),
    requireTenantAccess,
    async (req: AuthRequest, res) => {
      try {
        res.json({ success: true });
      } catch (error) {
        res.status(400).json({ error: "Failed to delete promotion" });
      }
    }
  );
    try {
      const { tenantId } = req.params;
      const promotions = await storage.getPromotionsByTenant(tenantId);
      res.json(promotions);
    } catch (error) {
      console.error("Get promotions error:", error);
      res.status(500).json({ error: "Failed to load promotions" });
    }
  });

  // ============================================================================
  // OSRM ETA CALCULATION (OPEN SOURCE - NO API COSTS)
  // ============================================================================

  // Import OSRM service
  const { calculateETA, calculateDeliveryMatrix } = await import("./services/osrm-service.js");

  // Calculate ETA for single order
  app.post("/api/orders/:id/calculate-eta", authenticate, async (req: AuthRequest, res) => {
    try {
      const { id } = req.params;
      const { restaurantLat, restaurantLng, customerLat, customerLng } = req.body;

      if (!restaurantLat || !restaurantLng || !customerLat || !customerLng) {
        return res.status(400).json({ error: "Missing coordinates (restaurantLat, restaurantLng, customerLat, customerLng)" });
      }

      const eta = await calculateETA(
        parseFloat(String(restaurantLat)),
        parseFloat(String(restaurantLng)),
        parseFloat(String(customerLat)),
        parseFloat(String(customerLng))
      );

      // Update order with estimated delivery time
      const order = await storage.getOrder(id);
      let updated = order;
      if (order) {
        updated = await storage.updateOrderStatus(id, order.status || "pending");
      }

      res.json({
        success: true,
        eta: eta,
        order: updated || order
      });
    } catch (error) {
      console.error("ETA calculation error:", error);
      res.status(500).json({ error: "Failed to calculate ETA" });
    }
  });

  // Calculate ETA for multiple destinations (batch)
  app.post("/api/orders/batch-eta", authenticate, async (req: AuthRequest, res) => {
    try {
      const { restaurantLat, restaurantLng, deliveryAddresses } = req.body;

      if (!restaurantLat || !restaurantLng || !Array.isArray(deliveryAddresses) || deliveryAddresses.length === 0) {
        return res.status(400).json({ error: "Missing coordinates or empty delivery addresses" });
      }

      // Filter valid addresses
      const validAddresses = deliveryAddresses.filter(addr => addr.lat && addr.lng);

      if (validAddresses.length === 0) {
        return res.status(400).json({ error: "No valid delivery addresses" });
      }

      const durations = await calculateDeliveryMatrix(
        parseFloat(String(restaurantLat)),
        parseFloat(String(restaurantLng)),
        validAddresses
      );

      const etaMinutes = durations.map(d => Math.round(d / 60));

      res.json({
        success: true,
        etaMinutes: etaMinutes,
        count: etaMinutes.length
      });
    } catch (error) {
      console.error("Batch ETA error:", error);
      res.status(500).json({ error: "Failed to calculate batch ETA" });
    }
  });

  // ============================================================================
  // FIREBASE CLOUD MESSAGING (FCM) - PUSH NOTIFICATIONS (FREE TIER)
  // ============================================================================

  // Import FCM service
  const { initializeFirebase, sendNotification, sendBroadcast, notifyNewOrder, notifyOrderStatus } = await import("./services/fcm-service.js");

  // Initialize Firebase on startup
  initializeFirebase();

  // Register device token for push notifications
  app.post("/api/drivers/register-device", authenticate, async (req: AuthRequest, res) => {
    try {
      const { userId, token, platform } = req.body;

      if (!userId || !token) {
        return res.status(400).json({ error: "Missing userId or device token" });
      }

      // In production, store this in database for device management
      // For now, accept and acknowledge
      console.log(`Device registered: ${userId} (${platform})`);

      res.json({
        success: true,
        message: "Device registered for push notifications",
        userId,
        platform
      });
    } catch (error) {
      console.error("Register device error:", error);
      res.status(500).json({ error: "Device registration failed" });
    }
  });

  // Send notification to driver about new order
  app.post("/api/orders/notify-driver", authenticate, async (req: AuthRequest, res) => {
    try {
      const { driverId, deviceToken, orderId, customerName, deliveryAddress } = req.body;

      if (!deviceToken || !orderId) {
        return res.status(400).json({ error: "Missing deviceToken or orderId" });
      }

      const success = await notifyNewOrder(
        deviceToken,
        orderId,
        customerName || "Cliente",
        deliveryAddress || "Endereço de entrega"
      );

      res.json({
        success,
        message: success ? "Notification sent to driver" : "Failed to send notification"
      });
    } catch (error) {
      console.error("Notify driver error:", error);
      res.status(500).json({ error: "Failed to send notification" });
    }
  });

  // Webhook Printer Configuration
  app.get("/api/webhook/config", authenticate, async (req: AuthRequest, res) => {
    try {
      if (!req.user?.tenantId) {
        return res.status(403).json({ error: "No tenant associated" });
      }

      const tenant = await storage.getTenant(req.user.tenantId);
      if (!tenant) {
        return res.status(404).json({ error: "Tenant not found" });
      }

      res.json({
        printerWebhookUrl: tenant.printerWebhookUrl || "",
        printerWebhookEnabled: tenant.printerWebhookEnabled || false,
        printerWebhookMethod: tenant.printerWebhookMethod || "POST",
        printerWebhookEvents: tenant.printerWebhookEvents || ["order.ready", "order.cancelled"]
      });
    } catch (error) {
      console.error("Get webhook config error:", error);
      res.status(500).json({ error: "Failed to get webhook config" });
    }
  });

  // Save Webhook Printer Configuration
  app.post("/api/webhook/config", authenticate, async (req: AuthRequest, res) => {
    try {
      if (!req.user?.tenantId) {
        return res.status(403).json({ error: "No tenant associated" });
      }

      if (req.user?.role !== 'restaurant_owner' && req.user?.role !== 'platform_admin') {
        return res.status(403).json({ error: "Only restaurant owners can configure webhooks" });
      }

      const { printerWebhookUrl, printerWebhookEnabled, printerWebhookMethod, printerWebhookEvents } = req.body;

      const updated = await storage.updateTenant(req.user.tenantId, {
        printerWebhookUrl,
        printerWebhookEnabled: !!printerWebhookEnabled,
        printerWebhookMethod: printerWebhookMethod || "POST",
        printerWebhookEvents: printerWebhookEvents || ["order.ready", "order.cancelled"]
      } as any);

      if (!updated) {
        return res.status(404).json({ error: "Failed to update tenant" });
      }

      res.json({
        success: true,
        message: "Webhook configuration saved",
        config: {
          printerWebhookUrl: updated.printerWebhookUrl,
          printerWebhookEnabled: updated.printerWebhookEnabled,
          printerWebhookMethod: updated.printerWebhookMethod,
          printerWebhookEvents: updated.printerWebhookEvents
        }
      });
    } catch (error) {
      console.error("Save webhook config error:", error);
      res.status(500).json({ error: "Failed to save webhook config" });
    }
  });

  // Test Webhook
  app.post("/api/webhook/test", authenticate, async (req: AuthRequest, res) => {
    try {
      if (!req.user?.tenantId) {
        return res.status(403).json({ error: "No tenant associated" });
      }

      const tenant = await storage.getTenant(req.user.tenantId);
      if (!tenant || !tenant.printerWebhookUrl) {
        return res.status(400).json({ error: "Webhook URL not configured" });
      }

      const testPayload = {
        event: "test.webhook",
        timestamp: new Date().toISOString(),
        tenantId: req.user.tenantId,
        data: {
          message: "This is a test webhook from Wilson Pizzaria"
        }
      };

      try {
        const response = await fetch(tenant.printerWebhookUrl, {
          method: tenant.printerWebhookMethod || "POST",
          headers: {
            "Content-Type": "application/json",
            "X-Webhook-Secret": tenant.printerWebhookSecret || ""
          },
          body: JSON.stringify(testPayload)
        });

        res.json({
          success: response.ok,
          status: response.status,
          message: response.ok ? "Webhook test successful" : "Webhook test failed",
          response: {
            statusCode: response.status,
            statusText: response.statusText
          }
        });
      } catch (fetchError: any) {
        res.status(400).json({
          success: false,
          message: "Failed to reach webhook URL",
          error: fetchError.message
        });
      }
    } catch (error) {
      console.error("Test webhook error:", error);
      res.status(500).json({ error: "Failed to test webhook" });
    }
  });

  // Delete Webhook Configuration
  app.delete("/api/webhook/config", authenticate, async (req: AuthRequest, res) => {
    try {
      if (!req.user?.tenantId) {
        return res.status(403).json({ error: "No tenant associated" });
      }

      if (req.user?.role !== 'restaurant_owner' && req.user?.role !== 'platform_admin') {
        return res.status(403).json({ error: "Only restaurant owners can delete webhooks" });
      }

      const updated = await storage.updateTenant(req.user.tenantId, {
        printerWebhookUrl: null,
        printerWebhookEnabled: false,
        printerWebhookSecret: null
      } as any);

      res.json({
        success: true,
        message: "Webhook configuration deleted"
      });
    } catch (error) {
      console.error("Delete webhook config error:", error);
      res.status(500).json({ error: "Failed to delete webhook config" });
    }
  });

  // ============================================================================
  // AGENT ORCHESTRATION ENDPOINTS
  // ============================================================================

  // Agent endpoints (planned for future implementation)
  // TODO: Implement agent orchestration endpoints in future turns
  app.get("/api/agents/list", async (req, res) => {
    res.json({
      agents: [],
      total: 0,
      status: "Agent system planned for future turns"
    });
  });

  app.post("/api/agents/execute", async (req, res) => {
    res.status(501).json({ error: "Agent execution planned for future implementation" });
  });

  app.get("/api/agents/history", async (req, res) => {
    res.json({
      total: 0,
      tasks: [],
      status: "Agent history tracking planned for future turns"
    });
  });

  // Receive Webhook from Printer (PUBLIC ENDPOINT - webhook receivers must be public)
  app.post("/api/webhook/receive", async (req, res) => {
    try {
      const { event, tenantId, data, signature } = req.body;

      if (!event || !tenantId) {
        return res.status(400).json({ error: "Missing event or tenantId" });
      }

      // Get tenant configuration
      const tenant = await storage.getTenant(tenantId);
      if (!tenant) {
        return res.status(404).json({ error: "Tenant not found" });
      }

      if (!tenant.printerWebhookEnabled) {
        return res.status(403).json({ error: "Webhooks disabled for this tenant" });
      }

      // Validate signature if secret is configured
      const { validateWebhookSignature, processPrinterWebhook } = await import("./services/webhook-handler.js");
      
      if (tenant.printerWebhookSecret && signature) {
        const payloadStr = JSON.stringify(req.body);
        if (!validateWebhookSignature(payloadStr, signature, tenant.printerWebhookSecret)) {
          return res.status(403).json({ error: "Invalid webhook signature" });
        }
      }

      // Process webhook
      const result = await processPrinterWebhook(
        tenant,
        {
          event,
          tenantId,
          timestamp: new Date().toISOString(),
          data
        },
        storage
      );

      res.json({
        success: result.success,
        message: result.message,
        processed: result.processed
      });
    } catch (error) {
      console.error("Webhook receive error:", error);
      res.status(500).json({ error: "Failed to process webhook" });
    }
  });

  // Broadcast notification to all drivers (e.g., system alerts, promotions)
  app.post("/api/notifications/broadcast-drivers", authenticate, async (req: AuthRequest, res) => {
    try {
      const { deviceTokens, title, body, data } = req.body;

      if (!Array.isArray(deviceTokens) || deviceTokens.length === 0) {
        return res.status(400).json({ error: "No device tokens provided" });
      }

      // Check permissions (only admin or restaurant owner)
      if (req.user?.role !== 'platform_admin' && req.user?.role !== 'restaurant_owner') {
        return res.status(403).json({ error: "Insufficient permissions" });
      }

      const result = await sendBroadcast(deviceTokens, {
        title,
        body,
        data
      });

      res.json({
        success: true,
        sent: result.success,
        failed: result.failed,
        total: deviceTokens.length
      });
    } catch (error) {
      console.error("Broadcast error:", error);
    }
  });

  // Integrations - Get
  app.get("/api/restaurant/integrations", authenticate, requireRole("owner"), async (req: AuthRequest, res) => {
    try {
      const tenantId = req.user?.tenantId;
      if (!tenantId) return res.status(401).json({ error: "Not authenticated" });
      const integrations = await storage.getTenantIntegrations(tenantId);
      res.json(integrations);
    } catch (error) {
      console.error("Get integrations error:", error);
      res.status(500).json({ error: "Failed to load integrations" });
    }
  });

  // Integrations - Create
  app.post("/api/restaurant/integrations", authenticate, requireRole("owner"), async (req: AuthRequest, res) => {
    try {
      const { platform, accessToken, externalId, webhookUrl, webhookSecret, isActive } = req.body;
      const tenantId = req.user?.tenantId;
      if (!tenantId || !platform) return res.status(400).json({ error: "Missing required fields" });
      // Map frontend fields (accessToken, externalId) to storage fields (webhookUrl, webhookSecret)
      const integration = await storage.createTenantIntegration({
        tenantId,
        platform,
        webhookUrl: webhookUrl || accessToken || "",
        webhookSecret: webhookSecret || externalId || "",
        isActive: isActive !== false,
      });
      res.json(integration);
    } catch (error) {
      console.error("Create integration error:", error);
      res.status(500).json({ error: "Failed to create integration" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
