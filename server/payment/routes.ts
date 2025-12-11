import type { Express, Request } from "express";
import { stripe } from "./stripe";
import { storage } from "../storage";
import { authenticate, requireRole, requireTenantAccess, type AuthRequest } from "../auth/middleware";
import { logError } from "../middleware/security";
import { z } from "zod";

export function registerPaymentRoutes(app: Express) {
  // Get tenant's Stripe configuration
  app.get("/api/payments/stripe-config", authenticate, requireTenantAccess, async (req: AuthRequest, res) => {
    try {
      const tenantId = req.user?.tenantId;
      if (!tenantId) return res.status(401).json({ error: "Unauthorized" });

      const tenant = await storage.getTenant(tenantId);
      if (!tenant) return res.status(404).json({ error: "Tenant not found" });

      res.json({
        hasStripeConfig: !!tenant.stripePublicKey && !!tenant.stripeSecretKey,
        publicKey: tenant.stripePublicKey || null,
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to get Stripe config" });
    }
  });

  // Update tenant's Stripe configuration (admin only)
  app.post("/api/payments/stripe-config", authenticate, requireRole("restaurant_owner"), async (req: AuthRequest, res) => {
    try {
      const tenantId = req.user?.tenantId;
      if (!tenantId) return res.status(401).json({ error: "Unauthorized" });

      const schema = z.object({
        stripePublicKey: z.string().min(1),
        stripeSecretKey: z.string().min(1),
      });

      const data = schema.parse(req.body);
      
      // Update tenant with Stripe keys
      const tenant = await storage.getTenant(tenantId);
      if (!tenant) return res.status(404).json({ error: "Tenant not found" });

      await storage.updateTenant(tenantId, {
        stripePublicKey: data.stripePublicKey,
        stripeSecretKey: data.stripeSecretKey,
      });

      res.json({ success: true, message: "Stripe configuration updated" });
    } catch (error: any) {
      res.status(500).json({ error: error.message || "Failed to update Stripe config" });
    }
  });

  // Get tenant payments/transactions list
  app.get("/api/payments/transactions", authenticate, requireTenantAccess, async (req: AuthRequest, res) => {
    try {
      const tenantId = req.user?.tenantId;
      if (!tenantId) return res.status(401).json({ error: "Unauthorized" });

      const limit = Math.min(parseInt(req.query.limit as string) || 50, 100);
      const offset = parseInt(req.query.offset as string) || 0;

      const payments = await storage.getPaymentsByTenant(tenantId, limit, offset);
      const total = await storage.getPaymentCountByTenant(tenantId);

      res.json({
        payments,
        pagination: {
          total,
          limit,
          offset,
          hasMore: offset + limit < total,
        },
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch transactions" });
    }
  });

  // Get payment details by ID
  app.get("/api/payments/:paymentId", authenticate, async (req: AuthRequest, res) => {
    try {
      const payment = await storage.getPaymentById(req.params.paymentId);
      if (!payment) return res.status(404).json({ error: "Payment not found" });

      const tenantId = req.user?.tenantId;
      if (tenantId && payment.tenantId !== tenantId && req.user?.role !== "platform_admin") {
        return res.status(403).json({ error: "Unauthorized" });
      }

      res.json(payment);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch payment" });
    }
  });

  // Create payment intent (PUBLIC - for storefront checkout)
  app.post("/api/payments/create-intent", async (req: Request, res) => {
    try {
      const schema = z.object({
        amount: z.number().min(1),
        customerEmail: z.string().email().optional(),
        currency: z.string().optional().default("brl"),
        paymentMethods: z.array(z.string()).optional(),
        tenantSlug: z.string().optional(), // Restaurant slug to use its Stripe key
      });

      const data = schema.parse(req.body);

      // Get restaurant's Stripe account if provided
      let tenantStripeKey = null;
      if (data.tenantSlug) {
        const tenant = await storage.getTenantBySlug(data.tenantSlug);
        if (tenant?.stripeSecretKey) {
          tenantStripeKey = tenant.stripeSecretKey;
        }
      }

      // Use restaurant's Stripe key, fallback to global
      const stripeClient = tenantStripeKey 
        ? new (await import("stripe")).default(tenantStripeKey)
        : stripe;

      if (!stripeClient) {
        return res.status(503).json({ 
          error: "Payment service not configured",
        });
      }

      // Configurar métodos de pagamento - SOMENTE CARD (Stripe)
      const paymentMethodTypes = data.paymentMethods || ["card"];

      const paymentIntent = await stripeClient.paymentIntents.create({
        amount: Math.round(data.amount * 100),
        currency: data.currency.toLowerCase(),
        receipt_email: data.customerEmail,
        payment_method_types: paymentMethodTypes as any,
        metadata: {
          tenantId: data.tenantSlug || "default",
          currency: data.currency,
        },
      });

      res.json({
        clientSecret: paymentIntent.client_secret,
        paymentIntentId: paymentIntent.id,
      });
    } catch (error) {
      logError("create-intent", error);
      // Fallback: Return mock intent on error
      res.status(500).json({ 
        error: "Failed to create payment intent",
      });
    }
  });

  // Confirm payment (PUBLIC - for storefront checkout)
  app.post("/api/payments/confirm", async (req: Request, res) => {
    try {
      if (!stripe) {
        return res.status(503).json({ error: "Payment service not configured" });
      }

      const schema = z.object({
        paymentIntentId: z.string(),
      });

      const data = schema.parse(req.body);

      // Retrieve payment intent from Stripe to verify status
      const paymentIntent = await stripe.paymentIntents.retrieve(data.paymentIntentId);

      if (paymentIntent.status !== "succeeded") {
        return res.status(400).json({ 
          error: "Payment not completed",
          status: paymentIntent.status 
        });
      }

      res.json({ 
        success: true, 
        paymentIntentId: data.paymentIntentId,
        status: paymentIntent.status,
        amount: paymentIntent.amount / 100 
      });
    } catch (error) {
      logError("confirm-payment", error);
      res.status(500).json({ error: "Failed to confirm payment" });
    }
  });

  // Webhook for Stripe events - LISTENER ATIVO
  app.post("/api/payments/webhook", async (req: Request, res) => {
    if (!stripe) {
      return res.status(503).json({ error: "Payment service not configured" });
    }

    const sig = req.headers["stripe-signature"] as string;

    if (!sig) {
      logError("webhook", "Missing stripe-signature header");
      return res.status(400).send("Missing stripe-signature");
    }

    try {
      const rawBody = (req as any).rawBody || req.body;
      const event = stripe.webhooks.constructEvent(
        rawBody,
        sig,
        process.env.STRIPE_WEBHOOK_SECRET || ""
      );

      console.log(`[Webhook] Received event: ${event.type}`);

      switch (event.type) {
        case "payment_intent.succeeded": {
          const paymentIntent = event.data.object as any;
          const orderId = paymentIntent.metadata?.orderId;
          const amount = (paymentIntent.amount / 100).toFixed(2);

          const logEntry = {
            timestamp: new Date().toISOString(),
            event: "payment_intent.succeeded",
            orderId,
            paymentIntentId: paymentIntent.id,
            amount,
            status: "completed",
          };
          console.log(`[Webhook] ${JSON.stringify(logEntry)}`);

          if (orderId) {
            const payment = await storage.getPaymentByOrder(orderId);
            if (payment) {
              // Update payment with Stripe intent ID
              await storage.updatePaymentStatus(payment.id, "completed");
              await storage.updatePaymentStripeId(payment.id, paymentIntent.id);
              // Mark order as confirmed when payment succeeds
              await storage.updateOrderStatus(orderId, "confirmed");
              console.log(`[Webhook] Updated order ${orderId} to confirmed status`);
            }
          }
          break;
        }

        case "payment_intent.payment_failed": {
          const paymentIntent = event.data.object as any;
          const orderId = paymentIntent.metadata?.orderId;
          const amount = (paymentIntent.amount / 100).toFixed(2);

          const logEntry = {
            timestamp: new Date().toISOString(),
            event: "payment_intent.payment_failed",
            orderId,
            paymentIntentId: paymentIntent.id,
            amount,
            status: "failed",
            error: paymentIntent.last_payment_error?.message || "Unknown error",
          };
          console.log(`[Webhook] ${JSON.stringify(logEntry)}`);

          if (orderId) {
            const payment = await storage.getPaymentByOrder(orderId);
            if (payment) {
              await storage.updatePaymentStatus(payment.id, "failed");
              // Mark order as cancelled when payment fails
              await storage.updateOrderStatus(orderId, "cancelled");
              console.log(`[Webhook] Updated order ${orderId} to cancelled status`);
            }
          }
          break;
        }

        default:
          console.log(`[Webhook] Unhandled event type: ${event.type}`);
      }

      res.json({ received: true });
    } catch (error) {
      logError("webhook", error);
      res.status(400).json({ error: "Webhook error" });
    }
  });
}
