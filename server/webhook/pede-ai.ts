/**
 * Pede Aí Webhook Handler
 * Framework para integração com Pede Aí
 * 
 * IMPORTANTE: Pede Aí tem API privada
 * Este é um framework base pronto para recepcionar webhooks
 * quando credenciais forem disponibilizadas
 */

import { log } from "../logger";
import { createHmac } from "crypto";
import { verifyPedeAiSignature } from "../utils/webhook-signature";

interface PedeAiOrderItem {
  product_id?: string;
  name: string;
  quantity: number;
  unit_price: number;
  notes?: string;
}

interface PedeAiCustomer {
  id?: string;
  name: string;
  phone: string;
  email?: string;
}

interface PedeAiDelivery {
  address: string;
  city?: string;
  zip_code?: string;
  complement?: string;
  latitude?: number;
  longitude?: number;
}

interface PedeAiWebhookPayload {
  event: "order.created" | "order.accepted" | "order.ready" | "order.finished" | "order.cancelled";
  order: {
    id: string;
    external_id?: string;
    customer: PedeAiCustomer;
    items: PedeAiOrderItem[];
    delivery: PedeAiDelivery;
    subtotal: number;
    delivery_fee: number;
    discount?: number;
    total: number;
    payment_method: string;
    status: string;
    created_at: string;
    notes?: string;
  };
  timestamp: string;
}

/**
 * Process Pede Aí webhook and create order
 */
export async function processPedeAiWebhook(
  payload: PedeAiWebhookPayload,
  tenantId: string,
  storage: any,
  signature?: string,
  secret?: string
): Promise<any> {
  try {
    // Validate HMAC signature if provided
    if (signature && secret) {
      const isValid = verifyPedeAiSignature(JSON.stringify(payload), signature, secret);
      if (!isValid) {
        log("[Pede Aí] Invalid signature - rejecting webhook");
        return { success: false, message: "Invalid signature" };
      }
    }

    log(`[Pede Aí Webhook] Processing ${payload.event}`);

    switch (payload.event) {
      case "order.created":
        return await handleOrderCreated(payload, tenantId, storage);
      
      case "order.accepted":
        return await handleOrderAccepted(payload, tenantId, storage);
      
      case "order.ready":
        return await handleOrderReady(payload, tenantId, storage);
      
      case "order.finished":
        return await handleOrderFinished(payload, tenantId, storage);
      
      case "order.cancelled":
        return await handleOrderCancelled(payload, tenantId, storage);
      
      default:
        log(`[Pede Aí] Unknown event: ${payload.event}`);
        return { success: false, error: "Unknown event" };
    }
  } catch (error) {
    log(`[Pede Aí Webhook] Error: ${error instanceof Error ? error.message : String(error)}`);
    throw error;
  }
}

/**
 * Handle new order from Pede Aí
 */
async function handleOrderCreated(
  payload: PedeAiWebhookPayload,
  tenantId: string,
  storage: any
): Promise<any> {
  try {
    const { order } = payload;

    // Create order in database
    const newOrder = await storage.createOrder({
      tenantId,
      customerName: order.customer.name,
      customerPhone: order.customer.phone,
      customerEmail: order.customer.email || "",
      deliveryAddress: order.delivery.address,
      status: "confirmed",
      subtotal: String(order.subtotal),
      deliveryFee: String(order.delivery_fee),
      total: String(order.total),
      deliveryType: "delivery",
      paymentMethod: order.payment_method,
      orderNotes: `Pede Aí Order - ID: ${order.id} - ${order.notes || ""}`,
      externalOrderId: order.id,
      externalPlatform: "pede_ai",
    });

    // Create order items
    for (const item of order.items) {
      await storage.createOrderItem({
        orderId: newOrder.id,
        productId: item.product_id || "",
        name: item.name,
        price: String(item.unit_price),
        quantity: item.quantity,
        notes: item.notes || "",
      });
    }

    log(`[Pede Aí] Order created: ${newOrder.id}`);

    return {
      success: true,
      orderId: newOrder.id,
      externalId: order.id,
    };
  } catch (error) {
    log(`[Pede Aí] Error creating order: ${error}`);
    throw error;
  }
}

/**
 * Handle order accepted by restaurant
 */
async function handleOrderAccepted(
  payload: PedeAiWebhookPayload,
  tenantId: string,
  storage: any
): Promise<any> {
  try {
    const { order } = payload;
    log(`[Pede Aí] Order accepted: ${order.id}`);

    // In production: update order status to "accepted" in database
    // For now, just log
    return {
      success: true,
      externalId: order.id,
      status: "accepted",
    };
  } catch (error) {
    log(`[Pede Aí] Error accepting order: ${error}`);
    throw error;
  }
}

/**
 * Handle order ready for delivery
 */
async function handleOrderReady(
  payload: PedeAiWebhookPayload,
  tenantId: string,
  storage: any
): Promise<any> {
  try {
    const { order } = payload;
    log(`[Pede Aí] Order ready: ${order.id}`);

    // In production: update order status to "ready" in database
    return {
      success: true,
      externalId: order.id,
      status: "ready",
    };
  } catch (error) {
    log(`[Pede Aí] Error marking order ready: ${error}`);
    throw error;
  }
}

/**
 * Handle order finished/delivered
 */
async function handleOrderFinished(
  payload: PedeAiWebhookPayload,
  tenantId: string,
  storage: any
): Promise<any> {
  try {
    const { order } = payload;
    log(`[Pede Aí] Order finished: ${order.id}`);

    // In production: update order status to "delivered" in database
    return {
      success: true,
      externalId: order.id,
      status: "delivered",
    };
  } catch (error) {
    log(`[Pede Aí] Error finishing order: ${error}`);
    throw error;
  }
}

/**
 * Handle order cancellation
 */
async function handleOrderCancelled(
  payload: PedeAiWebhookPayload,
  tenantId: string,
  storage: any
): Promise<any> {
  try {
    const { order } = payload;
    log(`[Pede Aí] Order cancelled: ${order.id}`);

    // In production: update order status to "cancelled" in database
    return {
      success: true,
      externalId: order.id,
      status: "cancelled",
    };
  } catch (error) {
    log(`[Pede Aí] Error cancelling order: ${error}`);
    throw error;
  }
}

/**
 * Validate Pede Aí webhook signature
 * NOTE: Implement with actual signature validation when API credentials available
 */
export function validatePedeAiSignature(
  payload: string,
  signature: string,
  secret?: string
): boolean {
  // TODO: Implement signature validation with Pede Aí secret key
  // For now: accept all webhooks (development mode)
  if (!secret) {
    log("[Pede Aí] Running in development mode - signature validation disabled");
    return true;
  }

  const crypto = require("crypto");
  const expectedSignature = crypto
    .createHmac("sha256", secret)
    .update(payload)
    .digest("hex");

  return expectedSignature === signature;
}
