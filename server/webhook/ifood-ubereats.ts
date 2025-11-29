import { log } from "../logger";

interface WebhookOrderPayload {
  orderId: string;
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  deliveryAddress: string;
  items: Array<{ name: string; quantity: number; price: string }>;
  total: string;
  status: "pending" | "confirmed" | "cancelled";
  source: "ifood" | "ubereats" | "direct";
  externalId?: string;
}

interface WebhookPayload {
  event: "order.created" | "order.updated" | "order.cancelled";
  data: WebhookOrderPayload;
  timestamp: string;
}

export class WebhookProcessor {
  static validateSignature(
    payload: string,
    signature: string,
    secret: string
  ): boolean {
    const crypto = require("crypto");
    const expectedSignature = crypto
      .createHmac("sha256", secret)
      .update(payload)
      .digest("hex");
    return expectedSignature === signature;
  }

  static async processWebhook(
    payload: WebhookPayload,
    tenantId: string,
    storage: any
  ): Promise<any> {
    try {
      log(`[Webhook] Processing ${payload.event} from ${payload.data.source}`);

      switch (payload.event) {
        case "order.created":
          return await this.handleOrderCreated(payload.data, tenantId, storage);

        case "order.updated":
          return await this.handleOrderUpdated(payload.data, tenantId, storage);

        case "order.cancelled":
          return await this.handleOrderCancelled(
            payload.data,
            tenantId,
            storage
          );

        default:
          throw new Error(`Unknown event: ${payload.event}`);
      }
    } catch (error) {
      log(
        `[Webhook] Error processing webhook: ${error instanceof Error ? error.message : String(error)}`
      );
      throw error;
    }
  }

  private static async handleOrderCreated(
    data: WebhookOrderPayload,
    tenantId: string,
    storage: any
  ): Promise<any> {
    try {
      // Calculate totals
      const subtotal = data.items.reduce(
        (sum, item) => sum + parseFloat(item.price) * item.quantity,
        0
      );
      const deliveryFee = 5.0; // Default fee - can be customized per tenant
      const total = subtotal + deliveryFee;

      // Create order in database
      const order = await storage.createOrder({
        tenantId,
        customerName: data.customerName,
        customerPhone: data.customerPhone,
        customerEmail: data.customerEmail || "",
        deliveryAddress: data.deliveryAddress,
        status: "confirmed", // iFood/UberEats orders are already confirmed
        subtotal: String(subtotal),
        deliveryFee: String(deliveryFee),
        total: String(total),
        deliveryType: "delivery",
        paymentMethod: data.source === "ifood" ? "ifood" : "ubereats",
        orderNotes: `${data.source.toUpperCase()} Order - ID: ${data.externalId || data.orderId}`,
      });

      // Create order items
      for (const item of data.items) {
        await storage.createOrderItem({
          orderId: order.id,
          productId: "", // Would need product mapping in real scenario
          name: item.name,
          price: item.price,
          quantity: item.quantity,
          notes: "",
        });
      }

      log(`[Webhook] Order created from ${data.source}: ${order.id}`);

      return {
        success: true,
        orderId: order.id,
        externalId: data.externalId,
      };
    } catch (error) {
      log(`[Webhook] Error creating order: ${error}`);
      throw error;
    }
  }

  private static async handleOrderUpdated(
    data: WebhookOrderPayload,
    tenantId: string,
    storage: any
  ): Promise<any> {
    try {
      // Find order by external ID
      // In production, would store external_id in orders table
      log(`[Webhook] Updating order ${data.externalId}`);

      // For now, just log - real implementation would update order status
      return {
        success: true,
        externalId: data.externalId,
      };
    } catch (error) {
      log(`[Webhook] Error updating order: ${error}`);
      throw error;
    }
  }

  private static async handleOrderCancelled(
    data: WebhookOrderPayload,
    tenantId: string,
    storage: any
  ): Promise<any> {
    try {
      log(`[Webhook] Cancelling order ${data.externalId}`);

      return {
        success: true,
        externalId: data.externalId,
      };
    } catch (error) {
      log(`[Webhook] Error cancelling order: ${error}`);
      throw error;
    }
  }
}

export async function processIFoodWebhook(
  payload: any,
  tenantId: string,
  storage: any
): Promise<any> {
  // iFood specific processing
  const transformed: WebhookPayload = {
    event: payload.event || "order.created",
    data: {
      orderId: payload.orderId,
      customerName: payload.consumer?.name || "Cliente",
      customerPhone: payload.consumer?.phone || "",
      customerEmail: payload.consumer?.email || "",
      deliveryAddress: payload.deliveryAddress?.address || "",
      items: (payload.items || []).map((item: any) => ({
        name: item.description,
        quantity: item.quantity,
        price: String(item.price || 0),
      })),
      total: String(payload.total || 0),
      status: "confirmed",
      source: "ifood",
      externalId: payload.id,
    },
    timestamp: new Date().toISOString(),
  };

  return WebhookProcessor.processWebhook(transformed, tenantId, storage);
}

export async function processUberEatsWebhook(
  payload: any,
  tenantId: string,
  storage: any
): Promise<any> {
  // UberEats specific processing
  const transformed: WebhookPayload = {
    event: payload.event || "order.created",
    data: {
      orderId: payload.order_id,
      customerName: payload.customer?.name || "Cliente",
      customerPhone: payload.customer?.phone || "",
      customerEmail: payload.customer?.email || "",
      deliveryAddress: payload.delivery_address || "",
      items: (payload.items || []).map((item: any) => ({
        name: item.title,
        quantity: item.quantity,
        price: String(item.price || 0),
      })),
      total: String(payload.order_total || 0),
      status: "confirmed",
      source: "ubereats",
      externalId: payload.order_id,
    },
    timestamp: new Date().toISOString(),
  };

  return WebhookProcessor.processWebhook(transformed, tenantId, storage);
}
