import { log } from "../logger";

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
    log("[WhatsApp] Service initialized");
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

      // In production: integrate with Twilio/WhatsApp Business API
      // For now: log the message (ready for Twilio integration)
      console.log(`[WhatsApp Message]`, {
        to: event.customerPhone,
        message: message,
        timestamp: new Date().toISOString(),
      });

      return true;
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
    lastOrderTime: string
  ): Promise<boolean> {
    try {
      log(`[WhatsApp] Notifying restaurant ${restaurantPhone} about new order`);

      const message = `🔔 Novo pedido recebido!\n\nTotal de pedidos: ${orderCount}\nÚltimo pedido: ${lastOrderTime}`;

      console.log(`[WhatsApp Restaurant Message]`, {
        to: restaurantPhone,
        message: message,
        timestamp: new Date().toISOString(),
      });

      return true;
    } catch (error) {
      log(`[WhatsApp] Error notifying restaurant: ${error}`);
      return false;
    }
  }
}

export const whatsAppService = WhatsAppNotificationService.getInstance();
