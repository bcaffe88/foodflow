import { IStorage } from "../storage";
import { sendTwilioWhatsApp } from "../services/twilio-whatsapp-service";
import { verifyUberEatsSignature } from "../utils/webhook-signature";

interface UberEatsOrder {
  id: string;
  reference: string;
  status: "created" | "accepted" | "preparing" | "ready" | "picked_up" | "delivered" | "cancelled";
  consumer: {
    id: string;
    name: string;
    phone: string;
    email: string;
  };
  items: Array<{
    id: string;
    title: string;
    quantity: number;
    price: number;
  }>;
  totalPrice: number;
  deliveryLocation: {
    address: string;
    city: string;
    state: string;
    zipCode: string;
  };
  createdAt: string;
}

interface UberEatsWebhookEvent {
  eventType: string;
  orderId: string;
  order: UberEatsOrder;
  timestamp: string;
}

export async function processUberEatsWebhook(
  event: UberEatsWebhookEvent,
  tenantId: string,
  storage: IStorage,
  signature?: string,
  secret?: string
) {
  try {
    // Validate HMAC signature if provided
    if (signature && secret) {
      const isValid = verifyUberEatsSignature(JSON.stringify(event), signature, secret);
      if (!isValid) {
        console.error("[UberEats] Invalid signature - rejecting webhook");
        return { success: false, message: "Invalid signature" };
      }
    }

    const { order, eventType } = event;
    console.log(`[UberEats] Processing ${eventType} event for order ${order.id}`);

    let orderStatus = "pending";
    let shouldNotify = true;

    switch (eventType) {
      case "order.created":
        orderStatus = "confirmed";
        break;
      case "order.accepted":
        orderStatus = "confirmed";
        break;
      case "order.preparing":
        orderStatus = "preparing";
        break;
      case "order.ready":
        orderStatus = "ready";
        break;
      case "order.picked_up":
        orderStatus = "dispatched";
        break;
      case "order.delivered":
        orderStatus = "delivered";
        break;
      case "order.cancelled":
        orderStatus = "cancelled";
        shouldNotify = false;
        break;
      default:
        console.log(`[UberEats] Unknown event type: ${eventType}`);
        return { success: false, message: "Unknown event type" };
    }

    // Create or update order
    const existingOrder = await storage.getOrder(order.reference).catch(() => undefined);

    if (!existingOrder) {
      // Create new order
      const newOrder = {
        id: `order_${Date.now()}`,
        tenantId,
        customerId: `customer_${order.consumer.id}`,
        items: order.items.map(item => ({
          id: item.id,
          name: item.title,
          quantity: item.quantity,
          price: item.price.toString(),
        })),
        total: order.totalPrice.toString(),
        status: orderStatus,
        deliveryAddress: order.deliveryLocation.address,
        customerPhone: order.consumer.phone,
        customerEmail: order.consumer.email,
        externalPlatform: "ubereats" as const,
        externalOrderId: order.reference,
        createdAt: new Date().toISOString(),
      };

      await storage.createOrder(newOrder as any);

      // Send WhatsApp notification
      if (shouldNotify) {
        await sendTwilioWhatsApp(
          order.consumer.phone,
          `Oi ${order.consumer.name}! Seu pedido UberEats #${order.reference} foi confirmado! 🍕`
        );
      }
    } else {
      // Update order status (if method exists)
      if ('updateOrder' in storage) {
        await (storage as any).updateOrder(existingOrder.id, { status: orderStatus });
      }

      if (shouldNotify) {
        await sendTwilioWhatsApp(
          order.consumer.phone,
          `Seu pedido UberEats #${order.reference} foi ${statusMessage(orderStatus)}! 🚚`
        );
      }
    }

    console.log(`[UberEats] Order ${order.id} processed successfully`);
    return { success: true, message: "Order processed", processed: true };
  } catch (error) {
    console.error("[UberEats] Webhook processing error:", error);
    return { success: false, message: "Processing error", error: String(error) };
  }
}

function statusMessage(status: string): string {
  const messages: Record<string, string> = {
    confirmed: "confirmado",
    preparing: "está sendo preparado",
    ready: "está pronto para entrega",
    dispatched: "saiu para entrega",
    delivered: "foi entregue com sucesso",
    cancelled: "foi cancelado",
  };
  return messages[status] || status;
}
