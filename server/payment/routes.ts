import type { Express, Request } from "express";
import { stripe } from "./stripe";
import { storage } from "../storage";
import { authenticate, type AuthRequest } from "../auth/middleware";
import { logError } from "../middleware/security";
import { z } from "zod";

export function registerPaymentRoutes(app: Express) {
  // Create payment intent (PUBLIC - for storefront checkout)
  app.post("/api/payments/create-intent", async (req: Request, res) => {
    try {
      const schema = z.object({
        amount: z.number().min(1),
        customerEmail: z.string().email().optional(),
        currency: z.string().optional().default("brl"),
        paymentMethods: z.array(z.string()).optional(),
      });

      const data = schema.parse(req.body);

      // Configurar métodos de pagamento - SOMENTE CARD (Stripe)
      const paymentMethodTypes = data.paymentMethods || ["card"];

      const paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(data.amount * 100),
        currency: data.currency.toLowerCase(),
        receipt_email: data.customerEmail,
        payment_method_types: paymentMethodTypes as any,
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
        clientSecret: `pi_mock_${Date.now()}`,
        paymentIntentId: `pi_mock_${Date.now()}`,
      });
    }
  });

  // Confirm payment (PUBLIC - for storefront checkout)
  app.post("/api/payments/confirm", async (req: Request, res) => {
    try {
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
              await storage.updatePaymentStatus(payment.id, "completed");
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
