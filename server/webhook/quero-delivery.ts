/**
 * Quero Delivery Webhook Handler
 * Framework para integração com Quero Delivery
 * 
 * IMPORTANTE: Quero Delivery é plataforma de marketplace
 * Este framework suporta webhook automático de pedidos
 */

import { log } from "../logger";
import { createHmac } from "crypto";

interface QueroDeliveryItem {
  product_id?: string;
  name: string;
  quantity: number;
  unit_price: number;
  special_instructions?: string;
}

interface QueroDeliveryCustomer {
  id?: string;
  name: string;
  phone: string;
  email?: string;
}

interface QueroDeliveryDelivery {
  address: string;
  neighborhood?: string;
  city?: string;
  zip_code?: string;
  reference?: string;
  latitude?: number;
  longitude?: number;
}

interface QueroDeliveryWebhookPayload {
  event: "order.created" | "order.accepted" | "order.ready" | "order.in_transit" | "order.delivered" | "order.cancelled";
  order: {
    id: string;
    merchant_id?: string;
    customer: QueroDeliveryCustomer;
    items: QueroDeliveryItem[];
    delivery: QueroDeliveryDelivery;
    subtotal: number;
    delivery_fee: number;
    service_fee?: number;
    discount?: number;
    total: number;
    payment_method: string;
    status: string;
    notes?: string;
    created_at: string;
    estimated_delivery_time?: number;
  };
  timestamp: string;
}

/**
 * Process Quero Delivery webhook and create order
 */
export async function processQueroDeliveryWebhook(
  payload: QueroDeliveryWebhookPayload,
  tenantId: string,
  storage: any
): Promise<any> {
  try {
    log(`[Quero Delivery Webhook] Processing ${payload.event}`);

    switch (payload.event) {
      case "order.created":
        return await handleOrderCreated(payload, tenantId, storage);
      
      case "order.accepted":
        return await handleOrderAccepted(payload, tenantId, storage);
      
      case "order.ready":
        return await handleOrderReady(payload, tenantId, storage);
      
      case "order.in_transit":
        return await handleOrderInTransit(payload, tenantId, storage);
      
      case "order.delivered":
        return await handleOrderDelivered(payload, tenantId, storage);
      
      case "order.cancelled":
        return await handleOrderCancelled(payload, tenantId, storage);
      
      default:
        log(`[Quero Delivery] Unknown event: ${payload.event}`);
        return { success: false, error: "Unknown event" };
    }
  } catch (error) {
    log(`[Quero Delivery Webhook] Error: ${error instanceof Error ? error.message : String(error)}`);
    throw error;
  }
}

/**
 * Handle new order from Quero Delivery
 */
async function handleOrderCreated(
  payload: QueroDeliveryWebhookPayload,
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
      orderNotes: `Quero Delivery Order - ID: ${order.id}${order.notes ? ` - ${order.notes}` : ""}`,
      externalOrderId: order.id,
      externalPlatform: "quero_delivery",
    });

    // Create order items
    for (const item of order.items) {
      await storage.createOrderItem({
        orderId: newOrder.id,
        productId: item.product_id || "",
        name: item.name,
        price: String(item.unit_price),
        quantity: item.quantity,
        notes: item.special_instructions || "",
      });
    }

    log(`[Quero Delivery] Order created: ${newOrder.id}`);

    return {
      success: true,
      orderId: newOrder.id,
      externalId: order.id,
    };
  } catch (error) {
    log(`[Quero Delivery] Error creating order: ${error}`);
    throw error;
  }
}

/**
 * Handle order accepted by restaurant
 */
async function handleOrderAccepted(
  payload: QueroDeliveryWebhookPayload,
  tenantId: string,
  storage: any
): Promise<any> {
  try {
    const { order } = payload;
    log(`[Quero Delivery] Order accepted: ${order.id}`);

    return {
      success: true,
      externalId: order.id,
      status: "accepted",
    };
  } catch (error) {
    log(`[Quero Delivery] Error accepting order: ${error}`);
    throw error;
  }
}

/**
 * Handle order ready for delivery/pickup
 */
async function handleOrderReady(
  payload: QueroDeliveryWebhookPayload,
  tenantId: string,
  storage: any
): Promise<any> {
  try {
    const { order } = payload;
    log(`[Quero Delivery] Order ready: ${order.id}`);

    return {
      success: true,
      externalId: order.id,
      status: "ready",
    };
  } catch (error) {
    log(`[Quero Delivery] Error marking order ready: ${error}`);
    throw error;
  }
}

/**
 * Handle order in transit
 */
async function handleOrderInTransit(
  payload: QueroDeliveryWebhookPayload,
  tenantId: string,
  storage: any
): Promise<any> {
  try {
    const { order } = payload;
    log(`[Quero Delivery] Order in transit: ${order.id}`);

    return {
      success: true,
      externalId: order.id,
      status: "in_transit",
    };
  } catch (error) {
    log(`[Quero Delivery] Error updating order status: ${error}`);
    throw error;
  }
}

/**
 * Handle order delivered
 */
async function handleOrderDelivered(
  payload: QueroDeliveryWebhookPayload,
  tenantId: string,
  storage: any
): Promise<any> {
  try {
    const { order } = payload;
    log(`[Quero Delivery] Order delivered: ${order.id}`);

    return {
      success: true,
      externalId: order.id,
      status: "delivered",
    };
  } catch (error) {
    log(`[Quero Delivery] Error marking order delivered: ${error}`);
    throw error;
  }
}

/**
 * Handle order cancellation
 */
async function handleOrderCancelled(
  payload: QueroDeliveryWebhookPayload,
  tenantId: string,
  storage: any
): Promise<any> {
  try {
    const { order } = payload;
    log(`[Quero Delivery] Order cancelled: ${order.id}`);

    return {
      success: true,
      externalId: order.id,
      status: "cancelled",
    };
  } catch (error) {
    log(`[Quero Delivery] Error cancelling order: ${error}`);
    throw error;
  }
}

/**
 * Validate Quero Delivery webhook signature
 */
export function validateQueroDeliverySignature(
  payload: string,
  signature: string,
  secret?: string
): boolean {
  // TODO: Implement signature validation with Quero Delivery secret key
  if (!secret) {
    log("[Quero Delivery] Running in development mode - signature validation disabled");
    return true;
  }

  const crypto = require("crypto");
  const expectedSignature = crypto
    .createHmac("sha256", secret)
    .update(payload)
    .digest("hex");

  return expectedSignature === signature;
}
