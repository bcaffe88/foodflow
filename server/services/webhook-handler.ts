/**
 * Webhook Handler Service
 * Processes incoming printer webhooks and triggers appropriate actions
 */

import { Order, Tenant } from "@shared/schema";

export interface WebhookPayload {
  event: string;
  timestamp: string;
  tenantId: string;
  data: any;
}

export interface WebhookEvent {
  type: "order.ready" | "order.cancelled" | "order.completed" | "test.webhook";
  orderId?: string;
  data: any;
}

/**
 * Validates webhook signature if secret is configured
 */
export function validateWebhookSignature(
  payload: string,
  signature: string,
  secret?: string
): boolean {
  if (!secret) {
    return true; // No secret configured, accept all
  }

  // In production, use HMAC-SHA256
  // For now, simple string comparison
  const expectedSignature = Buffer.from(`${payload}${secret}`).toString("base64");
  return signature === expectedSignature;
}

/**
 * Process printer webhook events
 */
export async function processPrinterWebhook(
  tenant: Tenant,
  payload: WebhookPayload,
  storage: any
): Promise<{ success: boolean; message: string; processed?: WebhookEvent }> {
  try {
    const { event, data, orderId } = payload;

    // Validate event type
    if (!["order.ready", "order.cancelled", "order.completed", "test.webhook"].includes(event)) {
      return {
        success: false,
        message: `Unknown event type: ${event}`
      };
    }

    // Test webhook - just acknowledge
    if (event === "test.webhook") {
      return {
        success: true,
        message: "Test webhook received successfully",
        processed: {
          type: "test.webhook",
          data: payload
        }
      };
    }

    // For actual events, we'd fetch the order and take action
    if (orderId && storage) {
      const order = await storage.getOrder(orderId);
      
      if (!order) {
        return {
          success: false,
          message: `Order not found: ${orderId}`
        };
      }

      // Log webhook processing
      console.log(`[Webhook] Processing ${event} for order ${orderId}`, {
        orderStatus: order.status,
        tenantId: tenant.id,
        timestamp: payload.timestamp
      });

      // Here we could:
      // 1. Update order status if needed
      // 2. Send notifications to driver/customer
      // 3. Trigger other business logic
      // 4. Log to audit trail

      return {
        success: true,
        message: `${event} event processed for order ${orderId}`,
        processed: {
          type: event as any,
          orderId,
          data: {
            orderStatus: order.status,
            eventTime: payload.timestamp,
            tenantName: tenant.name
          }
        }
      };
    }

    return {
      success: true,
      message: `${event} event received and logged`,
      processed: {
        type: event as any,
        data: payload
      }
    };
  } catch (error: any) {
    console.error("[Webhook] Error processing webhook:", error);
    return {
      success: false,
      message: `Failed to process webhook: ${error.message}`
    };
  }
}

/**
 * Send webhook to printer with retry logic
 */
export async function sendWebhookToPrinter(
  webhookUrl: string,
  method: string,
  payload: WebhookPayload,
  secret?: string,
  maxRetries: number = 3
): Promise<{ success: boolean; attempts: number; lastError?: string }> {
  let lastError: string | undefined;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const response = await fetch(webhookUrl, {
        method: method || "POST",
        headers: {
          "Content-Type": "application/json",
          ...(secret && { "X-Webhook-Secret": secret })
        },
        body: JSON.stringify(payload),
        timeout: 10000
      });

      if (response.ok) {
        console.log(`[Webhook] Successfully sent to printer (attempt ${attempt}/${maxRetries})`);
        return {
          success: true,
          attempts: attempt
        };
      }

      lastError = `HTTP ${response.status}: ${response.statusText}`;
    } catch (error: any) {
      lastError = error.message;

      // Exponential backoff
      if (attempt < maxRetries) {
        const delayMs = Math.pow(2, attempt - 1) * 1000;
        console.log(`[Webhook] Retry ${attempt}/${maxRetries} after ${delayMs}ms`);
        await new Promise(resolve => setTimeout(resolve, delayMs));
      }
    }
  }

  console.error(`[Webhook] Failed after ${maxRetries} attempts:`, lastError);
  return {
    success: false,
    attempts: maxRetries,
    lastError
  };
}

/**
 * Trigger printer webhook when order status changes
 */
export async function triggerPrinterWebhook(
  tenant: Tenant,
  order: Order,
  eventType: "order.ready" | "order.cancelled" | "order.completed"
): Promise<void> {
  if (!tenant.printerWebhookEnabled || !tenant.printerWebhookUrl) {
    return;
  }

  // Check if event is in configured events
  const configuredEvents = tenant.printerWebhookEvents || ["order.ready", "order.cancelled"];
  if (!configuredEvents.includes(eventType)) {
    return;
  }

  const payload: WebhookPayload = {
    event: eventType,
    timestamp: new Date().toISOString(),
    tenantId: tenant.id,
    data: {
      orderId: order.id,
      customerName: order.customerName,
      customerPhone: order.customerPhone,
      deliveryAddress: order.deliveryAddress,
      total: order.total,
      status: order.status,
      items: [] // Would be populated with order items in production
    }
  };

  // Send async - don't block order processing
  sendWebhookToPrinter(
    tenant.printerWebhookUrl,
    tenant.printerWebhookMethod || "POST",
    payload,
    tenant.printerWebhookSecret
  ).catch(error => {
    console.error(`[Webhook] Failed to send printer webhook:`, error);
    // Don't fail the order - webhook is best-effort
  });
}
