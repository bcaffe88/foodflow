// iFood Integration Service
// Handles real iFood webhook events and order synchronization

import { log } from "../logger";

interface iFoodOrder {
  id: string;
  reference?: string;
  items: Array<{
    id: string;
    name: string;
    quantity: number;
    price: number;
  }>;
  total: number;
  customer: {
    name: string;
    phone: string;
    email?: string;
  };
  delivery?: {
    address: string;
    latitude?: number;
    longitude?: number;
  };
}

interface iFoodWebhookPayload {
  id: string;
  event: string;
  createdAt: string;
  resource: {
    orderId: string;
    order: iFoodOrder;
  };
}

export class iFoodIntegration {
  private restaurantId: string;
  private apiKey: string;

  constructor(restaurantId: string, apiKey: string) {
    this.restaurantId = restaurantId;
    this.apiKey = apiKey;
    log(`[iFood] Integration initialized for restaurant ${restaurantId}`);
  }

  async handleWebhook(payload: iFoodWebhookPayload): Promise<boolean> {
    try {
      const { event, resource } = payload;
      log(`[iFood] Webhook received: ${event}`);

      switch (event) {
        case "order.created":
          return await this.handleOrderCreated(resource.order);
        case "order.confirmed":
          return await this.handleOrderConfirmed(resource.orderId);
        case "order.cancelled":
          return await this.handleOrderCancelled(resource.orderId);
        default:
          log(`[iFood] Unknown event: ${event}`);
          return true;
      }
    } catch (error) {
      console.error("[iFood] Webhook error:", error);
      return false;
    }
  }

  private async handleOrderCreated(order: iFoodOrder): Promise<boolean> {
    log(`[iFood] Order created: ${order.id}`);
    // TODO: Create order in database
    // TODO: Notify kitchen via printer
    return true;
  }

  private async handleOrderConfirmed(orderId: string): Promise<boolean> {
    log(`[iFood] Order confirmed: ${orderId}`);
    // TODO: Update order status
    return true;
  }

  private async handleOrderCancelled(orderId: string): Promise<boolean> {
    log(`[iFood] Order cancelled: ${orderId}`);
    // TODO: Update order status
    return true;
  }
}

export default iFoodIntegration;
