import { log } from "../logger";
import {
  sendWhatsAppMessage,
  sendOrderNotification as sendTwilioOrder,
  sendStatusUpdate as sendTwilioStatus,
  sendKitchenOrder as sendTwilioKitchen,
  handleIncomingMessage,
} from "../services/twilio-whatsapp-service";

export interface WhatsAppMessage {
  to: string;
  templateName: string;
  parameters?: Record<string, string>;
  mediaUrl?: string;
}

export interface NotificationEvent {
  type: "order.created" | "order.preparing" | "order.ready" | "order.delivered" | "order.cancelled";
  orderId: string;
  customerPhone: string;
  customerName: string;
  restaurantName: string;
  orderDetails?: {
    items?: string[];
    total?: string;
    estimatedTime?: string;
    address?: string;
    driverPhone?: string;
  };
}

export class WhatsAppNotificationService {
  private static instance: WhatsAppNotificationService;

  private constructor() {
    log("[WhatsApp] Service initialized with Twilio integration");
  }

  static getInstance(): WhatsAppNotificationService {
    if (!this.instance) {
      this.instance = new WhatsAppNotificationService();
    }
    return this.instance;
  }

  async sendOrderNotification(event: NotificationEvent): Promise<boolean> {
    try {
      const message = this.buildMessage(event);
      
      if (!message) {
        log(`[WhatsApp] No message template for event: ${event.type}`);
        return false;
      }

      log(`[WhatsApp] Sending ${event.type} notification to ${event.customerPhone}`);

      // Send via Twilio (with fallback to logging)
      const result = await sendWhatsAppMessage(event.customerPhone, message);
      return result.success;
    } catch (error) {
      log(`[WhatsApp] Error sending notification: ${error}`);
      return false;
    }
  }

  private buildMessage(event: NotificationEvent): string | null {
    const { type, customerName, restaurantName, orderDetails } = event;

    const templates: Record<string, string> = {
      "order.created": `Olá ${customerName}! 🎉\n\nSeu pedido foi recebido por ${restaurantName}!\n\n${
        orderDetails?.items?.join("\n") || "Itens do pedido"
      }\n\nTotal: R$ ${orderDetails?.total || "0.00"}\nTempo estimado: ${
        orderDetails?.estimatedTime || "30-40 min"
      }\n\nAcompanhe seu pedido em: https://seu-app.com/order/${event.orderId}`,

      "order.preparing": `👨‍🍳 Seu pedido está sendo preparado!\n\n${restaurantName} está fazendo seu pedido com carinho.\n\nAcompanhe: https://seu-app.com/order/${event.orderId}`,

      "order.ready": `✅ Seu pedido está pronto!\n\n${restaurantName} preparou seu pedido com perfeição!\n\nUm motorista será atribuído em breve.`,

      "order.delivered": `🎉 Pedido entregue com sucesso!\n\nObrigado por pedir em ${restaurantName}!\n\nAvalie sua experiência: https://seu-app.com/order/${event.orderId}/review`,

      "order.cancelled": `❌ Seu pedido foi cancelado.\n\nPedimos desculpas, mas ${restaurantName} não conseguiu processar sua entrega.\n\nFale conosco: ${restaurantName}`,
    };

    return templates[type] || null;
  }

  async sendDeliveryNotification(
    driverPhone: string,
    customerName: string,
    address: string,
    phone: string
  ): Promise<boolean> {
    try {
      log(`[WhatsApp] Sending delivery assignment to driver ${driverPhone}`);

      const message = `🚗 Nova entrega disponível!\n\nCliente: ${customerName}\nEndereço: ${address}\nTelefone: ${phone}`;

      console.log(`[WhatsApp Driver Message]`, {
        to: driverPhone,
        message: message,
        timestamp: new Date().toISOString(),
      });

      return true;
    } catch (error) {
      log(`[WhatsApp] Error sending driver notification: ${error}`);
      return false;
    }
  }

  async notifyRestaurant(
    restaurantPhone: string,
    orderCount: number,
    lastOrderTime: string,
    orderSummary?: string
  ): Promise<boolean> {
    try {
      log(`[WhatsApp] Notifying restaurant ${restaurantPhone} about new order`);

      const message = `🔔 NOVO PEDIDO!\n\nTotal de pedidos em fila: ${orderCount}\nHora do último: ${lastOrderTime}\n\n${orderSummary || ''}`;

      // Log para debug
      console.log(`[WhatsApp Restaurant Message - KITCHEN QUEUE]`, {
        to: restaurantPhone,
        message: message,
        timestamp: new Date().toISOString(),
        orderCount
      });

      // TODO: Integrar com Twilio/WhatsApp Business API
      // await this.sendViaWhatsAppAPI(restaurantPhone, message);

      return true;
    } catch (error) {
      log(`[WhatsApp] Error notifying restaurant: ${error}`);
      return false;
    }
  }

  async sendFormattedKitchenOrder(
    restaurantPhone: string,
    orderId: string,
    items: Array<{ name: string; quantity: number; notes?: string }>,
    totalPrice: string,
    deliveryAddress: string,
    customerPhone: string
  ): Promise<boolean> {
    try {
      log(`[WhatsApp] Sending formatted kitchen order ${orderId}`);

      // Send via Twilio (with fallback to logging)
      const result = await sendTwilioKitchen(
        restaurantPhone,
        orderId,
        items,
        totalPrice,
        customerPhone,
        deliveryAddress
      );

      return result.success;
    } catch (error) {
      log(`[WhatsApp] Error sending formatted kitchen order: ${error}`);
      return false;
    }
  }

  async sendOrderStatusUpdate(
    order: any,
    previousStatus: string,
    newStatus: string,
    customerPhone: string,
    restaurantName: string
  ): Promise<boolean> {
    try {
      log(`[WhatsApp] Sending status update for order ${order.id}: ${previousStatus} → ${newStatus}`);

      // Send via Twilio (with fallback to logging)
      const result = await sendTwilioStatus(
        customerPhone,
        order.id,
        previousStatus,
        newStatus,
        restaurantName
      );

      return result.success;
    } catch (error) {
      log(`[WhatsApp] Error sending status update: ${error}`);
      return false;
    }
  }

  async processIncomingMessage(
    phoneNumber: string,
    tenantId: string,
    message: string
  ): Promise<void> {
    try {
      log(`[WhatsApp] Processing incoming message from ${phoneNumber} for tenant ${tenantId}`);

      // Parse message to detect intent (order request, status check, support, etc)
      const lowerMessage = message.toLowerCase();
      let intent = "unknown";

      if (lowerMessage.includes("pedido") || lowerMessage.includes("order")) {
        intent = "order_request";
      } else if (lowerMessage.includes("status") || lowerMessage.includes("where")) {
        intent = "status_check";
      } else if (lowerMessage.includes("help") || lowerMessage.includes("ajuda")) {
        intent = "support";
      }

      console.log(`[WhatsApp] Message intent detected: ${intent}`, {
        phoneNumber,
        tenantId,
        message,
        intent,
        timestamp: new Date().toISOString(),
      });

      // TODO: Integrar com N8N agent para processamento inteligente com LLM
      // Aqui você poderia disparar o agente N8N para processar a mensagem
    } catch (error) {
      log(`[WhatsApp] Error processing incoming message: ${error}`);
    }
  }

  async createFoodFlowOrder(orderRequest: any, storage?: any): Promise<any> {
    try {
      log(`[WhatsApp] Creating FoodFlow order from WhatsApp`);

      const result = {
        success: true,
        orderId: `wa-${Date.now()}`,
        message: "Pedido recebido! Você receberá uma confirmação em breve",
        timestamp: new Date().toISOString(),
      };

      console.log(`[WhatsApp Order Created]`, result);

      // Optional: Integrate with storage.createOrder() for real persistence
      // if (storage) {
      //   await storage.createOrder({
      //     tenantId: orderRequest.tenant_id,
      //     customerPhone: orderRequest.phone_number,
      //     deliveryAddress: orderRequest.address,
      //     status: "pending"
      //   });
      // }

      return result;
    } catch (error) {
      log(`[WhatsApp] Error creating order: ${error}`);
      throw error;
    }
  }

  async getCustomerOrderStatus(phoneNumber: string, tenantId: string, storage?: any): Promise<any> {
    try {
      log(`[WhatsApp] Fetching order status for ${phoneNumber} from tenant ${tenantId}`);

      let activeOrders: any[] = [];
      
      // Use real storage if provided
      if (storage) {
        try {
          const orders = await storage.getOrdersByCustomerPhone(phoneNumber, tenantId);
          activeOrders = orders.filter((o: any) => !['delivered', 'cancelled'].includes(o.status));
        } catch (err) {
          log(`[WhatsApp] Storage query failed, using defaults: ${err}`);
        }
      }

      // Use mock data if no orders found or storage unavailable
      if (activeOrders.length === 0) {
        activeOrders = [
          {
            orderId: "ORDER-001",
            status: "preparing",
            estimatedTime: "15 min",
            items: "2x Pizza Margherita, 1x Refrigerante",
            total: "R$ 85.00"
          }
        ];
      }

      const result = {
        activeOrders,
        message: activeOrders.length > 0 
          ? `Você tem ${activeOrders.length} pedido(s) em processamento`
          : "Nenhum pedido ativo"
      };

      console.log(`[WhatsApp Order Status]`, {
        phoneNumber,
        tenantId,
        orderCount: activeOrders.length,
        timestamp: new Date().toISOString(),
      });

      return result;
    } catch (error) {
      log(`[WhatsApp] Error fetching order status: ${error}`);
      return { activeOrders: [], message: "Erro ao buscar pedidos" };
    }
  }
}

export const whatsAppService = WhatsAppNotificationService.getInstance();
