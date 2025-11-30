import { IStorage } from "../storage";
import { sendTwilioWhatsApp } from "../services/twilio-whatsapp-service";
import { verifyIFoodSignature } from "../utils/webhook-signature";

interface IFoodOrder {
  id: string;
  reference: string;
  status: "PLACED" | "CONFIRMED" | "PREPARING" | "READY" | "DISPATCHED" | "DELIVERED" | "CANCELLED";
  customer: {
    id: string;
    name: string;
    phone: string;
    email: string;
  };
  items: Array<{
    id: string;
    name: string;
    quantity: number;
    price: number;
  }>;
  totalAmount: number;
  deliveryAddress: {
    address: string;
    number: string;
    city: string;
    state: string;
    zipCode: string;
  };
  createdAt: string;
}

interface IFoodWebhookEvent {
  event: string;
  orderId: string;
  order: IFoodOrder;
  timestamp: string;
}

export async function processIFoodWebhook(
  event: IFoodWebhookEvent,
  tenantId: string,
  storage: IStorage,
  signature?: string,
  secret?: string
) {
  try {
    // Validate HMAC signature if provided
    if (signature && secret) {
      const isValid = verifyIFoodSignature(JSON.stringify(event), signature, secret);
      if (!isValid) {
        console.error("[iFood] Invalid signature - rejecting webhook");
        return { success: false, message: "Invalid signature" };
      }
    }

    const { order, event: eventType } = event;
    console.log(`[iFood] Processing ${eventType} event for order ${order.id}`);

    let orderStatus = "pending";
    let shouldNotify = true;

    switch (eventType) {
      case "order.placed":
        orderStatus = "confirmed";
        break;
      case "order.confirmed":
        orderStatus = "confirmed";
        break;
      case "order.preparing":
        orderStatus = "preparing";
        break;
      case "order.ready":
        orderStatus = "ready";
        break;
      case "order.dispatched":
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
        console.log(`[iFood] Unknown event type: ${eventType}`);
        return { success: false, message: "Unknown event type" };
    }

    // Create or update order
    const existingOrder = await storage.getOrder(order.reference).catch(() => undefined);

    if (!existingOrder) {
      // Create new order
      const newOrder = {
        id: `order_${Date.now()}`,
        tenantId,
        customerId: `customer_${order.customer.id}`,
        items: order.items.map(item => ({
          id: item.id,
          name: item.name,
          quantity: item.quantity,
          price: item.price.toString(),
        })),
        total: order.totalAmount.toString(),
        status: orderStatus,
        deliveryAddress: order.deliveryAddress.address,
        customerPhone: order.customer.phone,
        customerEmail: order.customer.email,
        externalPlatform: "ifood" as const,
        externalOrderId: order.reference,
        createdAt: new Date().toISOString(),
      };

      await storage.createOrder(newOrder as any);

      // Send WhatsApp notification
      if (shouldNotify) {
        await sendTwilioWhatsApp(
          order.customer.phone,
          `Olá ${order.customer.name}! Seu pedido iFood #${order.reference} foi confirmado! 🍕 Aguarde a entrega.`
        );
      }
    } else {
      // Update order status (if method exists)
      if ('updateOrder' in storage) {
        await (storage as any).updateOrder(existingOrder.id, { status: orderStatus });
      }

      if (shouldNotify) {
        await sendTwilioWhatsApp(
          order.customer.phone,
          `Seu pedido iFood #${order.reference} foi ${statusMessage(orderStatus)}! 🚚`
        );
      }
    }

    console.log(`[iFood] Order ${order.id} processed successfully`);
    return { success: true, message: "Order processed", processed: true };
  } catch (error) {
    console.error("[iFood] Webhook processing error:", error);
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
