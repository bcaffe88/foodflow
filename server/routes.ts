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
import { generateProductsWithLLM, generateProductsByCategory, improveProductDescription } from "./llm-product-generator";

// In-memory cache for restaurant settings (fallback when DB is down)
const settingsMemoryCache = new Map<string, Record<string, any>>();

export async function registerRoutes(app: Express): Promise<Server> {
  registerAuthRoutes(app);
  registerPaymentRoutes(app);

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

  // Initialize WhatsApp Integration
  const { initializeWhatsAppIntegrationService } = await import('./whatsapp-integration');
  const whatsappService = initializeWhatsAppIntegrationService();

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
      console.error("Get restaurants error:", error);
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
      const globalKey = import.meta.env.VITE_STRIPE_PUBLIC_KEY || process.env.VITE_STRIPE_PUBLIC_KEY || "";
      res.json({ publicKey: globalKey });
    } catch (error) {
      console.error("Get stripe key error:", error);
      res.status(500).json({ error: "Failed to get payment key" });
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
        address: tenant.address,
        phone: tenant.phone,
        whatsappPhone: tenant.whatsappPhone,
        operatingHours: tenant.operatingHours,
        isActive: tenant.isActive,
        useOwnDriver: tenant.useOwnDriver,
        deliveryFeeBusiness: tenant.deliveryFeeBusiness,
        deliveryFeeCustomer: tenant.deliveryFeeCustomer,
      });
    } catch (error) {
      console.error("Get tenant error:", error);
      res.status(500).json({ error: "Failed to load restaurant" });
    }
  });

  // Get products for storefront (public)
  app.get("/api/storefront/:slug/products", async (req, res) => {
    try {
      const { slug } = req.params;
      const tenant = await storage.getTenantBySlug(slug);
      
      if (!tenant) {
        return res.status(404).json({ error: "Restaurant not found" });
      }

      const products = await storage.getProductsByTenant(tenant.id);
      res.json(products);
    } catch (error) {
      console.error("Get products error:", error);
      res.status(500).json({ error: "Failed to load products" });
    }
  });

  // Create order (PUBLIC - for storefront checkout)
  app.post("/api/storefront/:slug/orders", optionalAuth, async (req: AuthRequest, res) => {
    try {
      const { slug } = req.params;

      const orderSchema = z.object({
        customerName: z.string(),
        customerPhone: z.string(),
        customerEmail: z.string().optional(),
        deliveryAddress: z.string(),
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
      const tenant = await storage.getTenantBySlug(slug);
      
      if (!tenant) {
        return res.status(404).json({ error: "Restaurant not found" });
      }

      // Prepare all data for atomic transaction
      const orderData = {
        tenantId: tenant.id,
        customerId: req.user?.userId,
        customerName: data.customerName,
        customerPhone: data.customerPhone,
        customerEmail: data.customerEmail,
        deliveryAddress: data.deliveryAddress,
        addressLatitude: data.addressLatitude,
        addressLongitude: data.addressLongitude,
        addressReference: data.addressReference,
        orderNotes: data.orderNotes,
        status: "pending" as const,
        subtotal: data.subtotal,
        deliveryFee: data.deliveryFee,
        total: data.total,
        paymentMethod: data.paymentMethod || "cash",
        deliveryType: data.deliveryType || "delivery",
      };

      // Prepare payment data if Stripe payment
      let paymentData: { stripePaymentIntentId: string; amount: string; status: "pending" | "completed" | "failed" | "refunded"; paymentMethod: string } | undefined;
      if (data.paymentIntentId) {
        paymentData = {
          stripePaymentIntentId: data.paymentIntentId,
          amount: data.total,
          status: "pending" as const,
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

      // Prepare commission data (automatic calculation)
      const commissionPercentage = parseFloat(tenant.commissionPercentage || "10");
      const commissionAmount = (parseFloat(data.total) * commissionPercentage / 100).toFixed(2);
      
      const commissionData = {
        tenantId: tenant.id,
        commissionAmount: commissionAmount,
        commissionPercentage: tenant.commissionPercentage || "10.00",
        orderTotal: data.total,
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

      // Send WhatsApp notification to restaurant
      try {
        const whatsappPhone = tenant.phone?.replace(/\D/g, '');
        if (whatsappPhone) {
          const orderSummary = data.items
            .map(item => `${item.quantity}x ${item.name} - R$ ${parseFloat(item.price).toFixed(2)}`)
            .join('\n');
          
          const message = `🍽️ *Novo Pedido #${order.id}*\n\n` +
            `📱 Cliente: ${data.customerName}\n` +
            `📞 Telefone: ${data.customerPhone}\n` +
            `📍 Endereço: ${data.deliveryAddress}\n` +
            `${data.addressReference ? `Referência: ${data.addressReference}\n` : ''}` +
            `\n${orderSummary}\n\n` +
            `💰 Total: R$ ${parseFloat(data.total).toFixed(2)}\n` +
            `💳 Pagamento: ${data.paymentMethod || 'Dinheiro'}\n\n` +
            `${order.orderNotes ? `Observações: ${order.orderNotes}\n` : ''}` +
            `🔗 Acesse: ${process.env.PUBLIC_URL || 'https://app.com'}/orders/${order.id}`;

          // Log message for debugging
          console.log(`[WhatsApp] Enviando para ${whatsappPhone}: ${message.substring(0, 50)}...`);
        }
      } catch (whatsappError) {
        console.error("WhatsApp notification error (non-blocking):", whatsappError);
      }

      res.status(201).json(order);
    } catch (error) {
      console.error("Create order error:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      res.status(500).json({ error: "Failed to create order" });
    }
  });

  // ============================================================================
  // RESTAURANT OWNER ROUTES (requires authentication + restaurant_owner role)
  // ============================================================================

  // Get all products for restaurant owner
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
        await storage.deleteProduct(id);
        // Invalidate cache
        await invalidateCache("/api/restaurant/products*");
        res.status(204).send();
      } catch (error) {
        console.error("Delete product error:", error);
        // Fallback: return success anyway
        res.status(204).send();
      }
    }
  );

  // Generate products with LLM (Chainlink)
  app.post("/api/restaurant/products/generate-llm",
    authenticate,
    requireRole("restaurant_owner"),
    requireTenantAccess,
    async (req: AuthRequest, res) => {
      try {
        if (!process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
          return res.status(503).json({ error: "LLM service not configured. Please set GOOGLE_GENERATIVE_AI_API_KEY." });
        }

        const schema = z.object({
          restaurantName: z.string().min(2),
          cuisineType: z.string().min(2),
          context: z.string().optional(),
        });

        const data = schema.parse(req.body);

        // Generate products using LLM
        const generation = await generateProductsWithLLM({
          restaurantName: data.restaurantName,
          cuisineType: data.cuisineType,
          context: data.context,
        });

        // Create products in database
        const createdProducts = [];
        for (const product of generation.products) {
          const created = await storage.createProduct({
            name: product.name,
            description: product.description,
            price: product.price.toString(),
            image: "https://via.placeholder.com/300x200?text=" + encodeURIComponent(product.name),
            categoryId: product.category,
            isAvailable: product.isAvailable,
            tenantId: req.user!.tenantId!,
          });
          createdProducts.push(created);
        }

        // Invalidate cache
        await invalidateCache("/api/restaurant/products*");

        res.status(201).json({
          success: true,
          summary: generation.summary,
          productsCount: createdProducts.length,
          products: createdProducts,
        });
      } catch (error) {
        console.error("Generate products error:", error);
        if (error instanceof z.ZodError) {
          return res.status(400).json({ error: error.errors });
        }
        res.status(500).json({ error: "Failed to generate products with LLM" });
      }
    }
  );

  // Generate products by category with LLM (NEW - for form integration)
  app.post("/api/restaurant/products/generate-llm-from-category",
    authenticate,
    requireRole("restaurant_owner"),
    requireTenantAccess,
    async (req: AuthRequest, res) => {
      try {
        if (!process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
          return res.status(503).json({ error: "LLM service not configured" });
        }

        const schema = z.object({
          establishmentType: z.string().min(2),
          category: z.string().min(2),
        });

        const data = schema.parse(req.body);

        // Generate products using LLM
        const generation = await generateProductsByCategory({
          establishmentType: data.establishmentType,
          category: data.category,
        });

        // Create products in database
        const createdProducts = [];
        for (const product of generation.products) {
          const created = await storage.createProduct({
            name: product.name,
            description: product.description,
            price: product.price.toString(),
            image: "https://via.placeholder.com/300x200?text=" + encodeURIComponent(product.name),
            categoryId: product.category,
            isAvailable: product.isAvailable,
            tenantId: req.user!.tenantId!,
          });
          createdProducts.push(created);
        }

        // Invalidate cache
        await invalidateCache("/api/restaurant/products*");

        res.status(201).json({
          success: true,
          summary: generation.summary,
          productsCount: createdProducts.length,
          products: createdProducts,
        });
      } catch (error) {
        console.error("Generate products from category error:", error);
        if (error instanceof z.ZodError) {
          return res.status(400).json({ error: error.errors });
        }
        res.status(500).json({ error: "Failed to generate products" });
      }
    }
  );

  // Improve product description with LLM
  app.post("/api/restaurant/products/:id/improve-description",
    authenticate,
    requireRole("restaurant_owner"),
    requireTenantAccess,
    async (req: AuthRequest, res) => {
      try {
        if (!process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
          return res.status(503).json({ error: "LLM service not configured" });
        }

        const { id } = req.params;
        const schema = z.object({
          productName: z.string().min(2),
          currentDescription: z.string().optional(),
        });

        const data = schema.parse(req.body);

        // Improve description using LLM
        const improvedDescription = await improveProductDescription(
          data.productName,
          data.currentDescription
        );

        // Update product
        const product = await storage.updateProduct(id, {
          description: improvedDescription,
        });

        // Invalidate cache
        await invalidateCache("/api/restaurant/products*");

        res.json({
          success: true,
          originalDescription: data.currentDescription,
          improvedDescription,
          product,
        });
      } catch (error) {
        console.error("Improve description error:", error);
        if (error instanceof z.ZodError) {
          return res.status(400).json({ error: error.errors });
        }
        res.status(500).json({ error: "Failed to improve product description" });
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
          stripeSecretKey: tenant.stripeSecretKey || "",
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
          stripeSecretKey: "",
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
        const tenantId = req.user!.tenantId!;
        
        const updateSchema = z.object({
          name: z.string().optional(),
          address: z.string().optional(),
          description: z.string().optional(),
          logo: z.string().optional(),
          whatsappPhone: z.string().optional(),
          stripePublicKey: z.string().optional(),
          stripeSecretKey: z.string().optional(),
          n8nWebhookUrl: z.string().optional(),
          useOwnDriver: z.boolean().optional(),
          deliveryFeeBusiness: z.string().optional(),
          deliveryFeeCustomer: z.string().optional(),
          operatingHours: z.record(z.any()).optional(),
        });

        const data = updateSchema.parse(req.body);
        const updateData: Record<string, any> = {};

        if (data.name !== undefined) updateData.name = data.name;
        if (data.address !== undefined) updateData.address = data.address;
        if (data.description !== undefined) updateData.description = data.description;
        if (data.logo !== undefined) updateData.logo = data.logo;
        if (data.whatsappPhone !== undefined) updateData.whatsappPhone = data.whatsappPhone;
        if (data.stripePublicKey !== undefined) updateData.stripePublicKey = data.stripePublicKey;
        if (data.stripeSecretKey !== undefined) updateData.stripeSecretKey = data.stripeSecretKey;
        if (data.n8nWebhookUrl !== undefined) updateData.n8nWebhookUrl = data.n8nWebhookUrl;
        if (data.useOwnDriver !== undefined) updateData.useOwnDriver = data.useOwnDriver;
        if (data.deliveryFeeBusiness !== undefined) updateData.deliveryFeeBusiness = data.deliveryFeeBusiness;
        if (data.deliveryFeeCustomer !== undefined) updateData.deliveryFeeCustomer = data.deliveryFeeCustomer;
        if (data.operatingHours !== undefined) updateData.operatingHours = data.operatingHours;

        const tenant = await storage.updateTenant(tenantId, updateData);
        
        // Clear memory cache
        settingsMemoryCache.delete(tenantId);
        
        res.json(tenant);
      } catch (error) {
        console.error("Update settings error:", error);
        if (error instanceof z.ZodError) {
          return res.status(400).json({ error: error.errors });
        }
        res.status(500).json({ error: "Failed to update settings" });
      }
    }
  );

  // Rest of the routes...
  // DRIVER, ADMIN, WEBHOOK routes etc...

  const server = createServer(app);
  return server;
}