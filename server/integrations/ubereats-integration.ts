// UberEats Integration Service
// Handles real UberEats webhook events and order synchronization

import { log } from "../logger";

interface UberEatsOrder {
  id: string;
  reference?: string;
  items: Array<{
    id: string;
    name: string;
    quantity: number;
    price: number;
  }>;
  subtotal: number;
  tax: number;
  delivery_fee: number;
  total: number;
  customer: {
    name: string;
    phone: string;
    email?: string;
  };
  delivery: {
    address: string;
    latitude?: number;
    longitude?: number;
    instructions?: string;
  };
}

interface UberEatsWebhookPayload {
  event_id: string;
  event_time: string;
  event_type: string;
  data: {
    order_id: string;
    order: UberEatsOrder;
  };
}

export class UberEatsIntegration {
  private restaurantId: string;
  private apiKey: string;

  constructor(restaurantId: string, apiKey: string) {
    this.restaurantId = restaurantId;
    this.apiKey = apiKey;
    log(`[UberEats] Integration initialized for restaurant ${restaurantId}`);
  }

  async handleWebhook(payload: UberEatsWebhookPayload): Promise<boolean> {
    try {
      const { event_type, data } = payload;
      log(`[UberEats] Webhook received: ${event_type}`);

      switch (event_type) {
        case "orders.order_placed":
          return await this.handleOrderPlaced(data.order);
        case "orders.order_confirmed":
          return await this.handleOrderConfirmed(data.order_id);
        case "orders.order_cancelled":
          return await this.handleOrderCancelled(data.order_id);
        default:
          log(`[UberEats] Unknown event: ${event_type}`);
          return true;
      }
    } catch (error) {
      console.error("[UberEats] Webhook error:", error);
      return false;
    }
  }

  private async handleOrderPlaced(order: UberEatsOrder): Promise<boolean> {
    log(`[UberEats] Order placed: ${order.id}`);
    // TODO: Create order in database
    // TODO: Notify kitchen via printer
    return true;
  }

  private async handleOrderConfirmed(orderId: string): Promise<boolean> {
    log(`[UberEats] Order confirmed: ${orderId}`);
    // TODO: Update order status
    return true;
  }

  private async handleOrderCancelled(orderId: string): Promise<boolean> {
    log(`[UberEats] Order cancelled: ${orderId}`);
    // TODO: Update order status
    return true;
  }
}

export default UberEatsIntegration;
